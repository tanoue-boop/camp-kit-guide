#!/usr/bin/env node
/**
 * lint-bold.cjs — MDX記事の「太字破綻」検出（読み取り専用・ファイルは書き換えない）
 *
 * 何を検出するか:
 *   `**スカート（裾のフラップ）**で` のように、閉じ側の ** の直前が約物（全角括弧・読点・
 *   中黒・鉤括弧など）で直後が文字の場合、CommonMark の right-flanking 条件を満たせず
 *   太字にならない。結果として ** が本文に生表示される。日本語記事で頻発するパターン。
 *
 * 判定方法:
 *   自前の推測ではなく、サイトのMDXレンダリングが内部で使っている micromark に
 *   実際に通し、出力HTMLに ** が残ったブロックだけを報告する（＝偽陽性なし）。
 *
 * 使い方:
 *   node scripts/lint-bold.cjs                      # content/posts/*.mdx を全走査
 *   node scripts/lint-bold.cjs content/posts/a.mdx  # ファイル指定
 *   node scripts/lint-bold.cjs --files              # 該当ファイル名だけを一覧
 *
 * 終了コード: 破綻が1件でもあれば 1、無ければ 0（デプロイ前チェック／CIに使える）
 *
 * 修正方針:
 *   NG: **スカート（裾のフラップ）**で地面との隙間を塞ぐ
 *   OK: **スカート**（裾のフラップ）で地面との隙間を塞ぐ   ← 太字の境界を約物の外へ出す
 */

const fs = require("fs");
const path = require("path");
const { micromark } = require("micromark");

/** 本文ブロック（連続する非空行）を切り出す。frontmatter・コードフェンス・JSX属性行は除外 */
function extractBlocks(raw) {
  const lines = raw.split("\n");
  const blocks = [];
  let buf = null;
  let inFence = false;
  let inJsxProps = false;
  let inFrontmatter = false;

  const flush = () => {
    if (buf && buf.text.some((l) => l.includes("**"))) blocks.push(buf);
    buf = null;
  };

  lines.forEach((line, i) => {
    const n = i + 1;
    const trimmed = line.trim();

    if (n === 1 && trimmed === "---") { inFrontmatter = true; return; }
    if (inFrontmatter) { if (trimmed === "---") inFrontmatter = false; return; }

    if (/^```/.test(trimmed)) { flush(); inFence = !inFence; return; }
    if (inFence) return;

    // <ProductCardMdx ... /> / <ComparisonTableMdx ... /> / <CalloutCtaMdx ... /> の属性は本文ではない
    if (/^<[A-Z][A-Za-z]*Mdx\b/.test(trimmed)) {
      flush();
      inJsxProps = !/\/>\s*$/.test(trimmed);
      return;
    }
    if (inJsxProps) { if (/\/>\s*$/.test(trimmed)) inJsxProps = false; return; }

    if (trimmed === "") { flush(); return; }
    if (!buf) buf = { start: n, text: [] };
    buf.text.push(line);
  });
  flush();
  return blocks;
}

function lintFile(file) {
  const raw = fs.readFileSync(file, "utf8");
  const findings = [];

  for (const block of extractBlocks(raw)) {
    const src = block.text.join("\n");
    let html;
    try {
      html = micromark(src);
    } catch {
      continue; // パースできないブロックは対象外（JSX混在など）
    }
    if (!html.includes("**")) continue;

    // 生 ** が残った行を特定して報告
    block.text.forEach((line, offset) => {
      if (!line.includes("**")) return;
      let one;
      try {
        one = micromark(line);
      } catch {
        return;
      }
      if (!one.includes("**")) return;
      const idx = line.indexOf("**");
      findings.push({
        file,
        line: block.start + offset,
        excerpt: line.slice(Math.max(0, idx - 30), idx + 60).trim(),
      });
    });
  }

  return findings;
}

function main() {
  const args = process.argv.slice(2);
  const filesOnly = args.includes("--files");
  const targets = args.filter((a) => !a.startsWith("--"));

  let files = targets;
  if (files.length === 0) {
    const dir = path.join(process.cwd(), "content/posts");
    files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".mdx"))
      .sort()
      .map((f) => path.join("content/posts", f));
  }

  const all = files.flatMap(lintFile);
  const byFile = new Map();
  for (const f of all) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file).push(f);
  }

  if (all.length === 0) {
    console.log(`PASS: 太字破綻なし（${files.length}ファイル走査）`);
    process.exit(0);
  }

  if (filesOnly) {
    for (const [file, items] of byFile) console.log(`${file}\t${items.length}`);
  } else {
    console.log(`FAIL: ${all.length}箇所の太字破綻を ${byFile.size}ファイルで検出\n`);
    for (const [file, items] of byFile) {
      console.log(`■ ${file}（${items.length}箇所）`);
      for (const it of items) console.log(`  L${it.line}: … ${it.excerpt}`);
      console.log("");
    }
    console.log("修正方針: 太字の境界を約物（全角括弧・読点・中黒など）の外へ出す。");
    console.log("  NG: **スカート（裾のフラップ）**で地面との隙間を塞ぐ");
    console.log("  OK: **スカート**（裾のフラップ）で地面との隙間を塞ぐ");
  }
  process.exit(1);
}

main();
