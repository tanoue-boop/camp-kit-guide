#!/usr/bin/env node
/**
 * check-affiliate-links.cjs — 「楽天＋Amazon の両リンクが揃っているか」のデプロイ関門
 *   （読み取り専用・ファイルは書き換えない）
 *
 * 背景（2026-10-01 / campkit-20261001-G01）:
 *   リライト・新規作成で商品が増えたとき、片方のリンクしか無いカード（＝収益が片側ゼロ）が
 *   そのまま本番に出る事故が起きていた。ビルドも太字lintも通ってしまうので気づけない。
 *   そこで deploy.cjs の冒頭（build/commit より前）でこの検査を走らせ、1件でも欠けていれば
 *   デプロイを失敗させる。**スキップオプションは用意しない**（関門を骨抜きにしないため）。
 *
 * 何を検査するか（対象 mdx の <ProductCardMdx …/> ごと）:
 *   1. affiliateUrl が `https://hb.afl.rakuten.co.jp/` で始まる
 *      → 素の `https://item.rakuten.co.jp/…` や `#` はアフィリエイト収益が付かないので不可
 *   2. Amazon リンクを持つ
 *      → `amazonAsin` が10桁の英数字、または `amazonUrl` が `https://www.amazon.co.jp/` で始まる
 *      → 例外: `_file/amazon-backfill-no-amazon.tsv` に登録済みのカードだけ Amazon 無しを許す
 *   3. 本文に `amzn.to/` の短縮URLが無い（中身が見えずリンク先の差し替わりを検知できない）
 *   4. 本文に `affiliateUrl="https://item.rakuten.co.jp` が無い
 *
 * 使い方:
 *   node scripts/check-affiliate-links.cjs                       # 変更された記事を自動抽出して検査
 *   node scripts/check-affiliate-links.cjs content/posts/a.mdx   # ファイル指定（deploy.cjs はこれ）
 *   node scripts/check-affiliate-links.cjs --all                 # content/posts/*.mdx を全走査（棚卸し用）
 *   node scripts/check-affiliate-links.cjs --test                # 自己テスト（ネット不使用・一時ファイル）
 *
 * 終了コード: 違反が1件でもあれば 1、無ければ 0
 *
 * 注意: 検査は「変更された記事」だけを対象にする。サイト全体を関門にすると、既存記事に残る
 *   旧形式（amzn.to 短縮URL 等・CLAUDE.md のキュー#18 で順次置換中）で日次デプロイが全部止まる。
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const NO_AMAZON_TSV = path.join(ROOT, '_file', 'amazon-backfill-no-amazon.tsv');

const RAKUTEN_AFL_PREFIX = 'https://hb.afl.rakuten.co.jp/';
const AMAZON_URL_PREFIX = 'https://www.amazon.co.jp/';
const ASIN_RE = /^[0-9A-Za-z]{10}$/; // 10桁の英数字（B0… の新形式・旧形式の数字ISBNの双方）
const SHORT_URL_RE = /amzn\.to\//;
const RAW_RAKUTEN_ATTR_RE = /affiliateUrl=(?:"|\{`|\{')https:\/\/item\.rakuten\.co\.jp/;

// ---------------------------------------------------------------------------
// mdx パース（check-amazon-asin.cjs と同じ規則。属性は "…" / {`…`} / {'…'} を拾う）
// ---------------------------------------------------------------------------
function parseCards(mdx) {
  const cards = [];
  const re = /<ProductCardMdx\b([\s\S]*?)\/>/g;
  let m;
  let idx = 0;
  while ((m = re.exec(mdx))) {
    idx += 1;
    const attrs = {};
    for (const a of m[1].matchAll(/(\w+)=(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/g)) {
      attrs[a[1]] = a[2] ?? a[3] ?? a[4] ?? '';
    }
    // 開始タグの行番号（報告用）
    const line = mdx.slice(0, m.index).split('\n').length;
    cards.push({ index: idx, rank: Number(attrs.rank) || idx, id: attrs.id || '', line, attrs });
  }
  return cards;
}

/** 楽天アフィリエイトリンクを持つか */
function hasRakutenAffiliate(attrs) {
  return String(attrs.affiliateUrl || '').startsWith(RAKUTEN_AFL_PREFIX);
}

/** Amazon リンクを持つか（ProductCard.getAmazonUrl と同じ優先順。amazonUrl → amazonAsin） */
function hasAmazonLink(attrs) {
  const url = String(attrs.amazonUrl || '');
  if (url && url.startsWith(AMAZON_URL_PREFIX)) return true;
  if (ASIN_RE.test(String(attrs.amazonAsin || ''))) return true;
  return false;
}

// ---------------------------------------------------------------------------
// 例外台帳（_file/amazon-backfill-no-amazon.tsv）
// ---------------------------------------------------------------------------
function readTsv(file) {
  if (!fs.existsSync(file)) return [];
  const lines = fs
    .readFileSync(file, 'utf8')
    .replace(/^﻿/, '')
    .replace(/\r/g, '')
    .replace(/\n$/, '')
    .split('\n');
  const header = lines[0].split('\t');
  return lines.slice(1).filter((l) => l !== '').map((l) => {
    const c = l.split('\t');
    const o = {};
    header.forEach((h, i) => { o[h] = c[i] ?? ''; });
    return o;
  });
}

/**
 * 例外セットを読む。キーは `slug\trank\tid`。
 * ProductCard の rank は記事内で一意ではない（CLAUDE.md: dod-tarp 等は本体と関連アイテムが同 rank）ため、
 * id まで揃っていれば slug+rank+id で、台帳側の id が空なら slug+rank で照合する（タスク定義の「(slug, rank)」を満たす）。
 */
function loadExemptions(tsvPath = NO_AMAZON_TSV) {
  const withId = new Set();
  const noId = new Set();
  for (const r of readTsv(tsvPath)) {
    if (!r.slug) continue;
    if (r.id) withId.add(`${r.slug}\t${r.rank}\t${r.id}`);
    else noId.add(`${r.slug}\t${r.rank}`);
  }
  return {
    has(slug, rank, id) {
      return withId.has(`${slug}\t${rank}\t${id}`) || noId.has(`${slug}\t${rank}`);
    },
    size: withId.size + noId.size,
  };
}

// ---------------------------------------------------------------------------
// 検査本体
// ---------------------------------------------------------------------------
function checkFile(file, exemptions) {
  const raw = fs.readFileSync(file, 'utf8');
  const slug = path.basename(file).replace(/\.mdx$/, '');
  const violations = [];

  for (const c of parseCards(raw)) {
    const missing = [];
    if (!hasRakutenAffiliate(c.attrs)) {
      const url = String(c.attrs.affiliateUrl || '');
      missing.push(
        url
          ? `楽天アフィリエイトリンク（affiliateUrl="${url.slice(0, 60)}" は hb.afl ではない）`
          : '楽天アフィリエイトリンク（affiliateUrl 属性なし）'
      );
    }
    if (!hasAmazonLink(c.attrs)) {
      if (!exemptions.has(slug, String(c.rank), c.id)) {
        const asin = String(c.attrs.amazonAsin || '');
        missing.push(
          asin
            ? `Amazonリンク（amazonAsin="${asin}" が10桁英数でない）`
            : 'Amazonリンク（amazonAsin / amazonUrl なし。恒久的に無い商品は _file/amazon-backfill-no-amazon.tsv に登録）'
        );
      }
    }
    if (missing.length) {
      violations.push({ file, slug, rank: c.rank, id: c.id, line: c.line, name: c.attrs.name || '', missing });
    }
  }

  // 本文レベルの禁止パターン（カード外に書かれた場合も拾う）
  raw.split('\n').forEach((line, i) => {
    if (SHORT_URL_RE.test(line)) {
      violations.push({
        file, slug, rank: '-', id: '-', line: i + 1, name: '',
        missing: ['amzn.to 短縮URLは使用禁止（amazonAsin="<ASIN>" に置き換える）'],
      });
    }
    if (RAW_RAKUTEN_ATTR_RE.test(line)) {
      violations.push({
        file, slug, rank: '-', id: '-', line: i + 1, name: '',
        missing: ['affiliateUrl に素の item.rakuten.co.jp を使用（hb.afl アフィリエイトURLに置き換える）'],
      });
    }
  });

  return violations;
}

function checkFiles(files, exemptions) {
  return files.filter((f) => fs.existsSync(f)).flatMap((f) => checkFile(f, exemptions));
}

// ---------------------------------------------------------------------------
// 対象ファイルの決定
// ---------------------------------------------------------------------------
function isTargetMdx(p) {
  const n = p.replace(/\\/g, '/');
  return n.startsWith('content/posts/') && n.endsWith('.mdx');
}

/** 引数なしのとき: HEAD との差分（staged + unstaged）＋ 未追跡から content/posts/*.mdx を抽出 */
function changedArticles() {
  const out = new Set();
  const cap = (cmd) => {
    try { return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }); } catch { return ''; }
  };
  for (const l of cap('git diff --name-only HEAD').split('\n')) {
    const f = l.trim();
    if (f && isTargetMdx(f)) out.add(f);
  }
  for (const l of cap('git status --porcelain').split('\n')) {
    if (!l.startsWith('??')) continue;
    const f = l.slice(3).trim().replace(/^"|"$/g, '');
    if (isTargetMdx(f)) out.add(f);
  }
  return [...out].sort();
}

function allArticles() {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .sort()
    .map((f) => `content/posts/${f}`);
}

function report(violations, files) {
  if (violations.length === 0) {
    console.log(`PASS: 楽天・Amazon 両リンク検査 OK（${files.length}ファイル検査）`);
    return 0;
  }
  const byFile = new Map();
  for (const v of violations) {
    if (!byFile.has(v.file)) byFile.set(v.file, []);
    byFile.get(v.file).push(v);
  }
  console.log(`FAIL: ${violations.length}件のリンク不備を ${byFile.size}ファイルで検出\n`);
  for (const [file, items] of byFile) {
    console.log(`■ ${file}`);
    for (const v of items) {
      const head = v.rank === '-' ? `L${v.line}` : `第${v.rank}位 (id: ${v.id || '-'}) L${v.line}`;
      console.log(`  ${head} ${v.name ? `/ ${v.name}` : ''}`);
      for (const m of v.missing) console.log(`    ✖ ${m}`);
    }
    console.log('');
  }
  console.log('修正方針: 全カードに楽天（hb.afl アフィリエイトURL）と Amazon（amazonAsin="<10桁ASIN>"）の両方を設定する。');
  console.log('  楽天URLの発行: node scripts/rakuten-search.mjs');
  console.log('  Amazon に恒久的に同一商品が無いカードだけ _file/amazon-backfill-no-amazon.tsv に slug/rank/id/judged_task/reason を登録する。');
  return 1;
}

// ---------------------------------------------------------------------------
// 自己テスト（ネット不使用・一時ファイルはリポジトリ外に作って必ず削除）
// ---------------------------------------------------------------------------
function selfTest() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-affiliate-links-'));
  const write = (slug, body) => {
    const f = path.join(dir, `${slug}.mdx`);
    fs.writeFileSync(f, body);
    return f;
  };
  const card = (attrs) => `# test\n\n<ProductCardMdx\n${attrs}\n/>\n`;
  const RAK = 'https://hb.afl.rakuten.co.jp/hgc/xxxx/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fshop%2F1%2F';

  const cases = [];
  try {
    const noExempt = loadExemptions(path.join(dir, 'empty.tsv')); // 存在しない＝例外なし

    // (a) 両リンクあり → 合格
    const a = write('case-a', card(`  rank="1"\n  id="p1"\n  name="テスト商品"\n  price="9800"\n  affiliateUrl="${RAK}"\n  amazonAsin="B0DR43CC43"\n  source="rakuten"`));
    cases.push({ name: '(a) 楽天hb.afl + amazonAsin → 合格', expect: 0, got: checkFiles([a], noExempt).length });

    // (b) Amazon 欠落 → 不合格
    const b = write('case-b', card(`  rank="1"\n  id="p1"\n  name="テスト商品"\n  affiliateUrl="${RAK}"\n  source="rakuten"`));
    const bv = checkFiles([b], noExempt);
    cases.push({ name: '(b) Amazonリンク欠落 → 不合格', expect: 1, got: bv.length, detail: bv[0] && bv[0].missing.join(' / ') });

    // (c) 楽天が素URL → 不合格（素URL検出とカード検査の2件が立つ）
    const c = write('case-c', card(`  rank="2"\n  id="p2"\n  name="テスト商品"\n  affiliateUrl="https://item.rakuten.co.jp/shop/1/"\n  amazonAsin="B0DR43CC43"\n  source="rakuten"`));
    const cv = checkFiles([c], noExempt);
    cases.push({ name: '(c) 楽天が素URL（item.rakuten.co.jp）→ 不合格', expect: 2, got: cv.length, detail: cv.map((v) => v.missing.join('')).join(' / ') });

    // (d) no-amazon 登録済み → 合格
    const tsv = path.join(dir, 'no-amazon.tsv');
    fs.writeFileSync(tsv, 'slug\trank\tid\tjudged_task\treason\ncase-d\t3\tp3\tcampkit-20261001-G01\tAmazon に同一商品の出品なし（テスト）\n');
    const exempt = loadExemptions(tsv);
    const d = write('case-d', card(`  rank="3"\n  id="p3"\n  name="テスト商品"\n  affiliateUrl="${RAK}"\n  source="rakuten"`));
    cases.push({ name: '(d) Amazon無しだが no-amazon.tsv 登録済み → 合格', expect: 0, got: checkFiles([d], exempt).length });

    // 補助: amzn.to 短縮URL / amazonUrl(www.amazon.co.jp) / ASIN桁数
    const e = write('case-e', card(`  rank="1"\n  id="p1"\n  affiliateUrl="${RAK}"\n  amazonUrl="https://amzn.to/4abcDEF"\n  source="rakuten"`));
    cases.push({ name: '(e) amzn.to 短縮URL → 不合格', expect: 2, got: checkFiles([e], noExempt).length });
    const f = write('case-f', card(`  rank="1"\n  id="p1"\n  affiliateUrl="${RAK}"\n  amazonUrl="https://www.amazon.co.jp/dp/B0DR43CC43"\n  source="rakuten"`));
    cases.push({ name: '(f) amazonUrl=www.amazon.co.jp → 合格', expect: 0, got: checkFiles([f], noExempt).length });
    const g = write('case-g', card(`  rank="1"\n  id="p1"\n  affiliateUrl="${RAK}"\n  amazonAsin="B0DR43CC"\n  source="rakuten"`));
    cases.push({ name: '(g) amazonAsin が10桁でない → 不合格', expect: 1, got: checkFiles([g], noExempt).length });
    const h = write('case-h', card(`  rank="1"\n  id="p1"\n  affiliateUrl="B09DBDH7VB"\n  amazonAsin="B09DBDH7VB"\n  source="amazon"`));
    cases.push({ name: '(h) 旧形式（affiliateUrl=ASIN・楽天リンクなし）→ 不合格', expect: 1, got: checkFiles([h], noExempt).length });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true }); // 一時ファイルはリポジトリに残さない
  }

  let ng = 0;
  console.log('■ 自己テスト（check-affiliate-links.cjs）');
  for (const c of cases) {
    const ok = c.got === c.expect;
    if (!ok) ng += 1;
    console.log(`  ${ok ? 'PASS' : 'FAIL'} ${c.name}  … 違反${c.got}件(期待${c.expect})${c.detail ? ` → ${c.detail}` : ''}`);
  }
  console.log(ng === 0 ? `\n自己テスト: 全${cases.length}ケース PASS` : `\n自己テスト: ${ng}ケース FAIL`);
  process.exit(ng === 0 ? 0 : 1);
}

// ---------------------------------------------------------------------------
function main() {
  const args = process.argv.slice(2);
  if (args.includes('--test')) return selfTest();

  const explicit = args.filter((a) => !a.startsWith('--')).map((a) => a.replace(/\\/g, '/'));
  let files;
  if (args.includes('--all')) files = allArticles();
  else if (explicit.length) files = explicit.filter(isTargetMdx);
  else files = changedArticles();

  if (files.length === 0) {
    console.log('PASS: 検査対象の記事（content/posts/*.mdx）の変更なし');
    process.exit(0);
  }

  const exemptions = loadExemptions();
  const violations = checkFiles(files.map((f) => path.join(ROOT, f)), exemptions);
  // 報告は repo 相対で出す
  for (const v of violations) v.file = path.relative(ROOT, v.file).replace(/\\/g, '/');
  process.exit(report(violations, files));
}

main();
