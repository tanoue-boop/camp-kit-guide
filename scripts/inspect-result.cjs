#!/usr/bin/env node
/**
 * scripts/inspect-result.cjs — タスク成果の検品を1本で回す（campkit-20260927-112 §A-2）
 *
 * 使い方:
 *   node scripts/inspect-result.cjs --base <コミットSHA>     # <SHA> = そのタスクが着手する前の HEAD
 *   node scripts/inspect-result.cjs                         # --base 省略時は HEAD~1
 *
 * 出力（すべて標準出力・人が読める表）:
 *   1. 変更ファイル一覧               … git diff --numstat <base>..HEAD
 *   2. 4台帳のサマリ                  … 行数・列数・バイト数を base / HEAD で並べ、同一なら UNCHANGED
 *   3. 列の値分布                      … asin-check の link_form / static_flags / verdict / seller_type、
 *                                        article-fix-backlog の status / issue_type を base→HEAD で
 *   4. 変更行の列単位の差分            … 3点キー＋「変わった列だけ」を 列名: 旧値 → 新値 で
 *   5. 未照合の件数                    … asin が非空かつ verdict が空（check-amazon-asin.cjs の集計行と同義）
 *   6. mdx 側の実測                    … content/posts/*.mdx の amazonAsin= / amazonUrl= / <ProductCardMdx の出現数
 *
 * 設計上の約束:
 *   - ネットアクセスは行わない。作業ツリーへの書き込みも行わない（読むだけ）。
 *   - base 時点のファイルは `git cat-file`（= git show 相当）で取る。作業ツリーを汚さない。
 *   - HEAD 時点も同じく git のオブジェクトから読む（作業ツリーの CRLF 変換に左右されないため）。
 *     作業ツリーに未コミットの差分があれば「⚠ 未コミット」として警告だけ出す。
 *   - TSV は UTF-8 BOM 付きでも読めるように先頭の ﻿ を除去する（utf-8-sig 相当）。
 *   - static_flags はカンマ区切りの複数値。OK 等を数えるときは split して数える
 *     （`both_forms` は note 本文にも出るので、フラグとして数えるのは static_flags 列のみ）。
 */

'use strict';

const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ── 台帳の定義（3点キー。card-name-check は 18 列） ─────────────────────────
const LEDGERS = [
  { file: '_file/amazon-asin-check.tsv', key: ['slug', 'rank', 'id'] },
  { file: '_file/card-name-check.tsv', key: ['slug', 'rank', 'id'] },
  { file: '_file/article-fix-backlog.tsv', key: ['target_slug', 'position', 'issue_type'] },
  { file: '_file/amazon-backfill-no-amazon.tsv', key: ['slug', 'rank', 'id'] },
];

// ── 値分布を出す列 ────────────────────────────────────────────────────────
const DISTRIBUTIONS = [
  { file: '_file/amazon-asin-check.tsv', col: 'link_form' },
  { file: '_file/amazon-asin-check.tsv', col: 'static_flags', split: ',' },
  { file: '_file/amazon-asin-check.tsv', col: 'verdict' },
  { file: '_file/amazon-asin-check.tsv', col: 'seller_type' },
  { file: '_file/article-fix-backlog.tsv', col: 'status' },
  { file: '_file/article-fix-backlog.tsv', col: 'issue_type' },
];

const MDX_DIR = 'content/posts';
const MDX_PATTERNS = [
  { label: 'amazonAsin=', re: /amazonAsin=/g },
  { label: 'amazonUrl=', re: /amazonUrl=/g },
  { label: '<ProductCardMdx', re: /<ProductCardMdx/g },
];

// ── git ヘルパ ────────────────────────────────────────────────────────────
function git(args, opts = {}) {
  return execFileSync('git', args, { cwd: ROOT, maxBuffer: 1 << 29, ...opts });
}
function gitText(args) {
  return git(args, { encoding: 'utf8' });
}
/** <rev>:<path> の中身を Buffer で返す。存在しなければ null */
function showBuf(rev, file) {
  try {
    return git(['cat-file', 'blob', `${rev}:${file}`]);
  } catch (e) {
    return null;
  }
}
/** rev 配下 dir の .mdx を {path, buf} で一括取得（cat-file --batch で 1 プロセス） */
function listBlobs(rev, dir, suffix) {
  let listing;
  try {
    listing = git(['ls-tree', '-r', '-z', '--name-only', rev, '--', dir], { encoding: 'utf8' });
  } catch (e) {
    return null;
  }
  const files = listing.split('\0').filter((f) => f && f.endsWith(suffix));
  if (!files.length) return [];
  const input = Buffer.from(files.map((f) => `${rev}:${f}`).join('\n') + '\n', 'utf8');
  const out = git(['cat-file', '--batch'], { input });
  const blobs = [];
  let pos = 0;
  for (const f of files) {
    const nl = out.indexOf(0x0a, pos);
    if (nl < 0) break;
    const header = out.slice(pos, nl).toString('utf8');
    const m = /^([0-9a-f]{40}) (\w+) (\d+)$/.exec(header);
    if (!m) { pos = nl + 1; continue; } // missing 等
    const size = Number(m[3]);
    blobs.push({ path: f, buf: out.slice(nl + 1, nl + 1 + size) });
    pos = nl + 1 + size + 1; // 本体の後に LF
  }
  return blobs;
}

// ── TSV ───────────────────────────────────────────────────────────────────
function parseTsv(buf) {
  if (buf === null) return null;
  let text = buf.toString('utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // utf-8-sig 相当
  text = text.replace(/\n+$/, '');
  if (text === '') return { header: [], rows: [], bytes: buf.length, raggedRows: [] };
  const lines = text.split('\n').map((l) => l.replace(/\r$/, ''));
  const header = lines[0].split('\t');
  const rows = [];
  const raggedRows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split('\t');
    if (cells.length !== header.length) raggedRows.push({ line: i + 1, cols: cells.length });
    const o = {};
    header.forEach((h, j) => { o[h] = cells[j] === undefined ? '' : cells[j]; });
    o.__line = i + 1;
    rows.push(o);
  }
  return { header, rows, bytes: buf.length, raggedRows };
}

// ── 表示（全角を 2 幅として揃える） ───────────────────────────────────────
function dw(s) {
  let w = 0;
  for (const ch of String(s)) {
    const c = ch.codePointAt(0);
    w += (c >= 0x1100 && (c <= 0x115f || (c >= 0x2e80 && c <= 0xa4cf) || (c >= 0xac00 && c <= 0xd7a3)
      || (c >= 0xf900 && c <= 0xfaff) || (c >= 0xfe30 && c <= 0xfe6f) || (c >= 0xff00 && c <= 0xff60)
      || (c >= 0xffe0 && c <= 0xffe6) || (c >= 0x20000 && c <= 0x3fffd))) ? 2 : 1;
  }
  return w;
}
function pad(s, n, right = false) {
  const fill = ' '.repeat(Math.max(0, n - dw(s)));
  return right ? fill + s : s + fill;
}
function table(headers, rows, aligns = []) {
  if (!rows.length) { console.log('  （該当なし）'); return; }
  const all = [headers, ...rows];
  const widths = headers.map((_, i) => Math.max(...all.map((r) => dw(r[i] === undefined ? '' : String(r[i])))));
  const line = (r) => '  ' + r.map((c, i) => pad(String(c === undefined ? '' : c), widths[i], aligns[i] === 'r')).join('  ').replace(/\s+$/, '');
  console.log(line(headers));
  console.log('  ' + widths.map((w) => '-'.repeat(w)).join('  '));
  for (const r of rows) console.log(line(r));
}
function h1(s) { console.log('\n' + '='.repeat(72) + '\n' + s + '\n' + '='.repeat(72)); }
function h2(s) { console.log('\n● ' + s); }
function show(v) { return v === '' ? '(empty)' : v; }
function clip(v, n = 200) {
  const s = String(v === undefined ? '' : v);
  return s.length <= n ? s : s.slice(0, n) + `…[+${s.length - n}字]`;
}

// ── 1. 変更ファイル一覧 ───────────────────────────────────────────────────
function section1(base) {
  h1('1. 変更ファイル一覧  git diff --numstat ' + base + '..HEAD');
  const out = gitText(['diff', '--numstat', base, 'HEAD']).split('\n').filter(Boolean);
  const rows = out.map((l) => {
    const [add, del, ...rest] = l.split('\t');
    return [add, del, rest.join('\t')];
  });
  table(['追加', '削除', 'ファイル'], rows, ['r', 'r']);
  const sum = rows.reduce((a, r) => ({ a: a.a + (Number(r[0]) || 0), d: a.d + (Number(r[1]) || 0) }), { a: 0, d: 0 });
  console.log(`  → 計 ${rows.length} ファイル / +${sum.a} -${sum.d}`);
}

// ── 2. 4台帳のサマリ ──────────────────────────────────────────────────────
function section2(ledgers) {
  h1('2. 4台帳のサマリ（base / HEAD）');
  const rows = [];
  for (const L of ledgers) {
    const b = L.base;
    const h = L.head;
    const same = L.baseBuf !== null && L.headBuf !== null && L.baseBuf.equals(L.headBuf);
    const fmt = (t) => (t === null ? ['(無し)', '(無し)', '(無し)'] : [String(t.rows.length), String(t.header.length), String(t.bytes)]);
    const fb = fmt(b);
    const fh = fmt(h);
    rows.push([path.basename(L.file), ...fb, ...fh, same ? 'UNCHANGED' : 'CHANGED']);
    if (h && h.raggedRows.length) {
      console.log(`  ⚠ ${L.file}: HEAD 側に列数の違う行 ${h.raggedRows.length} 件 → ` +
        h.raggedRows.slice(0, 5).map((r) => `L${r.line}(${r.cols}列)`).join(' '));
    }
  }
  table(['台帳', 'base:行', 'base:列', 'base:byte', 'HEAD:行', 'HEAD:列', 'HEAD:byte', '判定'],
    rows, ['', 'r', 'r', 'r', 'r', 'r', 'r', '']);
  console.log('  ※「行」はヘッダを除いたデータ行数。byte は BOM を含む生のバイト数。');
}

// ── 3. 列の値分布 ─────────────────────────────────────────────────────────
function countCol(tsv, col, splitBy) {
  const m = new Map();
  if (!tsv) return m;
  for (const r of tsv.rows) {
    const raw = r[col] === undefined ? '' : r[col];
    const vals = splitBy ? raw.split(splitBy).map((s) => s.trim()).filter((s) => s !== '') : [raw];
    if (!vals.length) vals.push('');
    for (const v of vals) m.set(v, (m.get(v) || 0) + 1);
  }
  return m;
}
function section3(byFile) {
  h1('3. 列の値分布（base → HEAD）');
  for (const D of DISTRIBUTIONS) {
    const L = byFile.get(D.file);
    h2(`${path.basename(D.file)}  ${D.col}` + (D.split ? `（"${D.split}" で split して計数）` : ''));
    const cb = countCol(L && L.base, D.col, D.split);
    const ch = countCol(L && L.head, D.col, D.split);
    const keys = [...new Set([...cb.keys(), ...ch.keys()])]
      .sort((a, b) => (ch.get(b) || 0) - (ch.get(a) || 0) || String(a).localeCompare(String(b)));
    const rows = keys.map((k) => {
      const b = cb.get(k) || 0;
      const h = ch.get(k) || 0;
      const d = h - b;
      return [show(k), String(b), String(h), d === 0 ? '' : (d > 0 ? '+' + d : String(d))];
    });
    table(['値', 'base', 'HEAD', 'delta'], rows, ['', 'r', 'r', 'r']);
    const tb = [...cb.values()].reduce((a, v) => a + v, 0);
    const th = [...ch.values()].reduce((a, v) => a + v, 0);
    console.log(`  → 値の総数 base ${tb} / HEAD ${th}`);
  }
}

// ── 4. 変更行の列単位の差分 ───────────────────────────────────────────────
function keyOf(row, key) { return key.map((k) => row[k] === undefined ? '' : row[k]).join('#'); }
/** 同じ3点キーが複数ある台帳（article-fix-backlog 等）のため、キーごとに出現順で対応づける */
function indexByKey(tsv, key) {
  const m = new Map();
  if (!tsv) return m;
  for (const r of tsv.rows) {
    const k = keyOf(r, key);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
}
function section4(ledgers) {
  h1('4. 変更行の列単位の差分（変わった列だけ）');
  for (const L of ledgers) {
    h2(`${path.basename(L.file)}  キー = ${L.key.join(' + ')}`);
    if (L.baseBuf !== null && L.headBuf !== null && L.baseBuf.equals(L.headBuf)) {
      console.log('  UNCHANGED（バイト一致）');
      continue;
    }
    if (!L.base || !L.head) { console.log('  ⚠ base か HEAD に台帳が存在しない → 比較できない'); continue; }
    const ib = indexByKey(L.base, L.key);
    const ih = indexByKey(L.head, L.key);
    const cols = L.head.header;
    const keys = [...new Set([...ib.keys(), ...ih.keys()])];
    let nChanged = 0, nAdded = 0, nRemoved = 0;
    for (const k of keys) {
      const bs = ib.get(k) || [];
      const hs = ih.get(k) || [];
      const n = Math.max(bs.length, hs.length);
      for (let i = 0; i < n; i++) {
        const b = bs[i];
        const h = hs[i];
        if (b && !h) { nRemoved++; console.log(`  [REMOVED] ${k}  (base L${b.__line})`); continue; }
        if (!b && h) {
          nAdded++;
          console.log(`  [ADDED]   ${k}  (HEAD L${h.__line})`);
          for (const c of cols) if (h[c] !== '' && h[c] !== undefined) console.log(`              ${c}: ${clip(h[c])}`);
          continue;
        }
        const diffs = cols.filter((c) => (b[c] === undefined ? '' : b[c]) !== (h[c] === undefined ? '' : h[c]));
        if (!diffs.length) continue;
        nChanged++;
        console.log(`  [CHANGED] ${k}  (base L${b.__line} → HEAD L${h.__line})`);
        for (const c of diffs) console.log(`              ${c}: ${clip(b[c]) || '(empty)'} → ${clip(h[c]) || '(empty)'}`);
      }
    }
    console.log(`  → 変更 ${nChanged} 行 / 追加 ${nAdded} 行 / 削除 ${nRemoved} 行`);
  }
}

// ── 5. 未照合の件数 ───────────────────────────────────────────────────────
//   check-amazon-asin.cjs の集計行と同じ定義: rows.filter((r) => r.asin && !r.verdict).length
function unverified(tsv) {
  if (!tsv) return null;
  return tsv.rows.filter((r) => r.asin && !r.verdict).length;
}
function section5(byFile) {
  h1('5. 未照合の件数（asin が非空かつ verdict が空）');
  const L = byFile.get('_file/amazon-asin-check.tsv');
  const b = unverified(L && L.base);
  const h = unverified(L && L.head);
  table(['台帳', 'base', 'HEAD', 'delta'],
    [['amazon-asin-check.tsv', b === null ? '(無し)' : b, h === null ? '(無し)' : h,
      (b === null || h === null) ? '' : (h - b === 0 ? '' : (h - b > 0 ? '+' + (h - b) : String(h - b)))]],
    ['', 'r', 'r', 'r']);
  console.log('  ※ 定義は scripts/check-amazon-asin.cjs の最終集計行（r.asin && !r.verdict）に合わせている。');
}

// ── 6. mdx 側の実測 ──────────────────────────────────────────────────────
function countMdx(rev) {
  const blobs = listBlobs(rev, MDX_DIR, '.mdx');
  if (blobs === null) return null;
  const res = { files: blobs.length };
  for (const p of MDX_PATTERNS) res[p.label] = 0;
  for (const b of blobs) {
    const t = b.buf.toString('utf8');
    for (const p of MDX_PATTERNS) {
      const m = t.match(p.re);
      res[p.label] += m ? m.length : 0;
    }
  }
  return res;
}
function section6(base) {
  h1('6. mdx 側の実測（content/posts/*.mdx・出現数）');
  const b = countMdx(base);
  const h = countMdx('HEAD');
  const rows = [['mdx ファイル数', b ? b.files : '(無し)', h ? h.files : '(無し)', '']];
  for (const p of MDX_PATTERNS) {
    const bv = b ? b[p.label] : null;
    const hv = h ? h[p.label] : null;
    const d = (bv === null || hv === null) ? '' : (hv - bv === 0 ? '' : (hv - bv > 0 ? '+' + (hv - bv) : String(hv - bv)));
    rows.push([p.label, bv === null ? '(無し)' : bv, hv === null ? '(無し)' : hv, d]);
  }
  table(['項目', 'base', 'HEAD', 'delta'], rows, ['', 'r', 'r', 'r']);
}

// ── main ─────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const o = { base: 'HEAD~1' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base') { o.base = argv[++i]; if (!o.base) throw new Error('--base に SHA が必要'); }
    else if (argv[i] === '--help' || argv[i] === '-h') o.help = true;
    else throw new Error(`未知の引数: ${argv[i]}`);
  }
  return o;
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(String(e.message));
    process.exit(2);
  }
  if (opts.help) {
    console.log('node scripts/inspect-result.cjs [--base <コミットSHA>]   （省略時 HEAD~1）');
    return;
  }
  let baseSha;
  try {
    baseSha = gitText(['rev-parse', opts.base]).trim();
  } catch (e) {
    console.error(`--base ${opts.base} を解決できない`);
    process.exit(2);
  }
  const headSha = gitText(['rev-parse', 'HEAD']).trim();

  console.log('検品対象');
  table(['', 'rev', 'SHA', '件名'], [
    ['base', opts.base, baseSha.slice(0, 7), gitText(['log', '-1', '--format=%s', baseSha]).trim()],
    ['HEAD', 'HEAD', headSha.slice(0, 7), gitText(['log', '-1', '--format=%s', headSha]).trim()],
  ]);

  // 作業ツリーに未コミットの台帳／mdx 差分があれば警告（比較は git のオブジェクト同士で行う）
  const dirty = gitText(['status', '--porcelain', '--', MDX_DIR, ...LEDGERS.map((l) => l.file)]).split('\n').filter(Boolean);
  if (dirty.length) {
    console.log('  ⚠ 作業ツリーに未コミットの差分あり（本レポートは HEAD のコミット内容で比較している）:');
    for (const d of dirty) console.log('      ' + d);
  }

  const ledgers = LEDGERS.map((L) => {
    const baseBuf = showBuf(baseSha, L.file);
    const headBuf = showBuf(headSha, L.file);
    return { ...L, baseBuf, headBuf, base: parseTsv(baseBuf), head: parseTsv(headBuf) };
  });
  const byFile = new Map(ledgers.map((L) => [L.file, L]));

  section1(baseSha);
  section2(ledgers);
  section3(byFile);
  section4(ledgers);
  section5(byFile);
  section6(baseSha);
  console.log('');
}

main();
