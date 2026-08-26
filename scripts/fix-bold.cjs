#!/usr/bin/env node
/**
 * fix-bold.cjs — lint-bold.cjs が検出した太字破綻の「機械的に安全なパターンだけ」を修正する
 *
 * ⚠ CLAUDE.md の安全ルールにより、既存記事の一括正規表現置換は禁止されている。
 *    そのため本スクリプトは以下を厳守する:
 *      - 本文ブロックのみ対象（frontmatter / コードフェンス / JSX属性行は触らない）
 *      - `*` を除去した文字列が変更前後で完全一致することを1行ごとに検証（＝文言は絶対に変わらない）
 *      - 修正後に micromark で再レンダリングし、** が消えたことを検証
 *      - 括弧の対応が崩れる案（例: `**A（B**）C`）は採用しない
 *      - 上記を満たす案が無い行は触らず「要手動」として報告する
 *
 * 使い方:
 *   node scripts/fix-bold.cjs            # dry-run（差分を表示するだけ）
 *   node scripts/fix-bold.cjs --apply    # 実際に書き換える
 */

const fs = require("fs");
const path = require("path");
const { micromark } = require("micromark");

const APPLY = process.argv.includes("--apply");
const PAIRS = { "（": "）", "(": ")", "「": "」", "『": "』", "【": "】", "〈": "〉", "［": "］", "《": "》" };
const OPENS = Object.keys(PAIRS);
const CLOSERS = new Set(Object.values(PAIRS));

const strip = (s) => s.replace(/\*/g, "");
const broken = (l) => { try { return micromark(l).includes("**"); } catch { return false; } };

/** 括弧の不均衡数（0なら対応が取れている） */
function unbalanced(s) {
  let open = 0, orphan = 0;
  for (const c of s) {
    if (PAIRS[c]) open++;
    else if (CLOSERS.has(c)) { if (open > 0) open--; else orphan++; }
  }
  return open + orphan;
}

function candidates(head, inner, tail) {
  const out = [];
  // (a) 末尾の「対応が取れた括弧グループ」を太字の外へ  **A（B）**C → **A**（B）C
  const last = inner[inner.length - 1];
  if (CLOSERS.has(last)) {
    const open = OPENS.find((o) => PAIRS[o] === last);
    const oi = inner.lastIndexOf(open);
    if (oi > 0) out.push({ s: `${head}**${inner.slice(0, oi)}**${inner.slice(oi)}${tail}`, inner: inner.slice(0, oi) });
  }
  // (b) 先頭の「対応が取れた括弧グループ」を太字の前へ  **（A）B** → （A）**B**
  const first = inner[0];
  if (PAIRS[first]) {
    const ci = inner.indexOf(PAIRS[first]);
    if (ci > 0 && ci < inner.length - 1) out.push({ s: `${head}${inner.slice(0, ci + 1)}**${inner.slice(ci + 1)}**${tail}`, inner: inner.slice(ci + 1) });
  }
  // (c) 前後の約物をまとめて外へ  **「A」**B → 「**A**」B（引用符ごと囲うケースで最も自然）
  const both = inner.match(/^([\p{P}\p{S}]*)([^\p{P}\p{S}][\s\S]*[^\p{P}\p{S}])([\p{P}\p{S}]*)$/u);
  if (both && (both[1] || both[3])) out.push({ s: `${head}${both[1]}**${both[2]}**${both[3]}${tail}`, inner: both[2], bonus: -1 });
  return out;
}

function fixLine(line) {
  let cur = line;
  for (let guard = 0; guard < 6 && broken(cur); guard++) {
    const pos = [];
    const re = /\*\*/g;
    let m;
    while ((m = re.exec(cur)) !== null) { pos.push(m.index); re.lastIndex = m.index + 2; }

    let best = null;
    for (let k = 0; k + 1 < pos.length; k += 2) {
      const a = pos[k], b = pos[k + 1];
      for (const c of candidates(cur.slice(0, a), cur.slice(a + 2, b), cur.slice(b + 2))) {
        if (c.s === cur || strip(c.s) !== strip(line)) continue;
        if (unbalanced(c.inner) !== 0) continue;              // 括弧が崩れる案は却下
        const score = (broken(c.s) ? 5 : 0) + (c.bonus || 0);
        if (!best || score < best.score) best = { ...c, score };
      }
    }
    if (!best) return null;
    cur = best.s;
  }
  return broken(cur) ? null : cur;
}

/** lint-bold.cjs と同じ「本文行」判定 */
function bodyLineNumbers(raw) {
  const ok = new Set();
  let fence = false, jsx = false, fm = false;
  raw.split("\n").forEach((line, i) => {
    const n = i + 1, t = line.trim();
    if (n === 1 && t === "---") { fm = true; return; }
    if (fm) { if (t === "---") fm = false; return; }
    if (/^```/.test(t)) { fence = !fence; return; }
    if (fence) return;
    if (/^<[A-Z][A-Za-z]*Mdx\b/.test(t)) { jsx = !/\/>\s*$/.test(t); return; }
    if (jsx) { if (/\/>\s*$/.test(t)) jsx = false; return; }
    ok.add(n);
  });
  return ok;
}

function main() {
  const dir = "content/posts";
  let fixed = 0, touchedFiles = 0;
  const manual = [];

  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".mdx")).sort()) {
    const p = path.join(dir, f);
    const raw = fs.readFileSync(p, "utf8");
    const body = bodyLineNumbers(raw);
    const lines = raw.split("\n");
    let changed = false;

    lines.forEach((line, i) => {
      if (!body.has(i + 1) || !line.includes("**") || !broken(line)) return;
      const next = fixLine(line);
      if (next === null) { manual.push({ file: p, line: i + 1, text: line.trim() }); return; }
      console.log(`${p}:${i + 1}`);
      console.log(`  - ${line.trim().slice(0, 150)}`);
      console.log(`  + ${next.trim().slice(0, 150)}`);
      lines[i] = next;
      changed = true;
      fixed++;
    });

    if (changed) { touchedFiles++; if (APPLY) fs.writeFileSync(p, lines.join("\n"), "utf8"); }
  }

  console.log(`\n${APPLY ? "APPLIED" : "DRY-RUN"}: 自動修正 ${fixed}箇所 / ${touchedFiles}ファイル`);
  if (manual.length) {
    console.log(`\n要手動 ${manual.length}件（機械的に安全な案が無いため未変更）:`);
    for (const m of manual) console.log(`  ${m.file}:${m.line}\n      ${m.text.slice(0, 170)}`);
  }
}

main();
