// ASP成果レポート（楽天アフィリエイト管理画面のCSV／Amazonアソシエイト・セントラルのCSV）を
// _file/asp-product-article-map.tsv（build-asp-product-map.mjs の出力）で記事slugに突合し、
// 記事単位の集計TSVを出す（読み取り専用・記事は変更しない）。
//
// 使い方:
//   node scripts/merge-asp-report.mjs --rakuten _file/rakuten-report-20260920.csv [--rakuten-encoding=shift_jis]
//                                     --amazon  _file/amazon-report-20260920.csv  [--amazon-encoding=utf-8]
//                                     [--out _file/asp-by-article-20260920.tsv]
//   どちらか片方だけでも可。
//
// 列の自動検出（レポート画面のCSV列名は変わり得るので、ヘッダ名を決め打ちしない）:
//   - キー列: 楽天は値に item.rakuten.co.jp/<shop>/<item> を含む列（商品URL）。Amazon は ASIN 形（B0＋8桁）の値が並ぶ列。
//   - 集計列: ヘッダに 報酬|売上|クリック|件数|数量|注文|Revenue|Fee|Earnings|Clicks|Ordered|Shipped|Items|Price を含み、
//     値が数値として読める列をすべて合計する。
//   自動検出が外れた場合は --key-col=<列名> --sum-cols=<列名,列名> で明示する（両ASP共通）。
//
// 按分: 同じ商品を複数記事に載せている場合は各記事に均等按分する（share=1/記事数）。
//       按分前の実数は products 側の TSV（--out の隣に *-products.tsv）に残す。
//
// 出力:
//   <out>            … slug 単位: platform ごとの集計列 ＋ diagnosis-articles.tsv の GSC 指標（clicks/impressions/position）
//   <out>-products.tsv … 商品キー単位: レポートの合計値・紐づいた記事・按分率
//   紐づかなかったキー（記事に載っていない商品＝過去に差し替えた商品や、リンク経由の別商品購入）は articles 空欄で残す。
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  if (i >= 0 && args[i + 1] && !args[i + 1].startsWith("--")) return args[i + 1];
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : def;
};
const rakutenPath = opt("rakuten", "");
const amazonPath = opt("amazon", "");
const outPath = opt("out", `_file/asp-by-article-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.tsv`);
const keyColOpt = opt("key-col", "");
const sumColsOpt = opt("sum-cols", "");
if (!rakutenPath && !amazonPath) {
  console.error("--rakuten <csv> か --amazon <csv> の少なくとも一方を指定してください。");
  process.exit(1);
}

// --- CSV/TSV パーサ（引用符・改行・BOM対応） ---
function parseDelimited(text) {
  text = text.replace(/^﻿/, "");
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const delim = (firstLine.match(/\t/g) ?? []).length > (firstLine.match(/,/g) ?? []).length ? "\t" : ",";
  const rows = [];
  let row = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else q = false;
      } else cell += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c === "\r") { /* skip */ }
    else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const header = rows.shift() ?? [];
  return rows.filter((r) => r.some((v) => v !== "")).map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}
function readReport(p, encoding) {
  const buf = fs.readFileSync(p);
  const text = new TextDecoder(encoding || "utf-8").decode(buf);
  return parseDelimited(text);
}
const toNum = (v) => {
  const s = String(v ?? "").replace(/[¥,円\s%]/g, "");
  if (s === "" || s === "-") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
const SUM_RE = /報酬|売上|クリック|件数|数量|注文|Revenue|Fee|Earnings|Clicks|Ordered|Shipped|Items|Price|Conversion/i;

function detectColumns(rows, platform) {
  const headers = Object.keys(rows[0] ?? {});
  let keyCol = keyColOpt;
  if (!keyCol) {
    for (const h of headers) {
      const sample = rows.slice(0, 50).map((r) => r[h]);
      const hit = platform === "rakuten"
        ? sample.filter((v) => /item\.rakuten\.co\.jp\/[^/]+\/[^/]+/.test(v)).length
        : sample.filter((v) => /^B0[A-Z0-9]{8}$/.test(v)).length;
      if (hit >= Math.max(1, sample.length * 0.5)) { keyCol = h; break; }
    }
  }
  let sumCols = sumColsOpt ? sumColsOpt.split(",").map((s) => s.trim()) : [];
  if (!sumCols.length) {
    sumCols = headers.filter((h) => SUM_RE.test(h) && rows.slice(0, 50).some((r) => toNum(r[h]) !== null));
  }
  return { headers, keyCol, sumCols };
}
const rakutenKey = (v) => {
  const m = String(v).match(/item\.rakuten\.co\.jp\/([^/?#]+)\/([^/?#]+)/);
  return m ? `${m[1]}/${m[2]}` : "";
};

// --- 対応表 ---
const MAP_PATH = "_file/asp-product-article-map.tsv";
if (!fs.existsSync(MAP_PATH)) {
  console.error(`${MAP_PATH} がありません。先に node scripts/build-asp-product-map.mjs を実行してください。`);
  process.exit(1);
}
const productMap = new Map(); // `${platform}\t${key}` -> { name, articles[] }
for (const line of fs.readFileSync(MAP_PATH, "utf8").split("\n").slice(1)) {
  if (!line) continue;
  const [platform, key, name, articles] = line.split("\t");
  productMap.set(`${platform}\t${key}`, { name, articles: articles ? articles.split(";") : [] });
}

// --- 記事側の基礎データ（diagnosis-articles.tsv） ---
const DIAG_PATH = "_file/diagnosis-articles.tsv";
const diag = new Map();
if (fs.existsSync(DIAG_PATH)) {
  const rows = parseDelimited(fs.readFileSync(DIAG_PATH, "utf8"));
  for (const r of rows) diag.set(r.slug, r);
}

// --- 集計 ---
const byArticle = new Map(); // slug -> { [platform:col]: number }
const productRows = [];
const summary = {};
function process_(platform, p, encoding) {
  const rows = readReport(p, encoding);
  const { headers, keyCol, sumCols } = detectColumns(rows, platform);
  summary[platform] = { file: p, rows: rows.length, keyCol, sumCols, headers, matched: 0, unmatched: 0 };
  if (!keyCol) {
    console.error(`[${platform}] キー列を自動検出できませんでした。--key-col で指定してください。headers: ${headers.join(" | ")}`);
    return;
  }
  // 商品キー単位に合算
  const agg = new Map();
  for (const r of rows) {
    const key = platform === "rakuten" ? rakutenKey(r[keyCol]) : r[keyCol];
    if (!key) continue;
    const a = agg.get(key) ?? { key, name: "", sums: Object.fromEntries(sumCols.map((c) => [c, 0])) };
    for (const c of sumCols) a.sums[c] += toNum(r[c]) ?? 0;
    if (!a.name) a.name = r["商品名"] ?? r["Name"] ?? r["商品"] ?? "";
    agg.set(key, a);
  }
  for (const a of agg.values()) {
    const entry = productMap.get(`${platform}\t${a.key}`);
    const articles = entry?.articles ?? [];
    if (articles.length) summary[platform].matched++; else summary[platform].unmatched++;
    productRows.push({ platform, key: a.key, name: a.name || entry?.name || "", articles, sums: a.sums, share: articles.length ? 1 / articles.length : 0 });
    for (const slug of articles) {
      const s = byArticle.get(slug) ?? {};
      for (const c of sumCols) s[`${platform}:${c}`] = (s[`${platform}:${c}`] ?? 0) + a.sums[c] / articles.length;
      s[`${platform}:products`] = (s[`${platform}:products`] ?? 0) + 1;
      byArticle.set(slug, s);
    }
  }
}
if (rakutenPath) process_("rakuten", rakutenPath, opt("rakuten-encoding", "shift_jis"));
if (amazonPath) process_("amazon", amazonPath, opt("amazon-encoding", "utf-8"));

// --- 出力 ---
const metricCols = [...new Set([...byArticle.values()].flatMap((s) => Object.keys(s)))].sort();
const fmt = (n) => (n === undefined ? "" : Number.isInteger(n) ? String(n) : n.toFixed(2));
const outHeader = ["slug", "タイトル", "カテゴリ", "記事タイプ", "clicks", "impressions", "position", ...metricCols];
const outLines = [outHeader.join("\t")];
const slugs = new Set([...byArticle.keys(), ...diag.keys()]);
for (const slug of [...slugs].sort()) {
  const d = diag.get(slug) ?? {};
  const s = byArticle.get(slug) ?? {};
  outLines.push([slug, d["タイトル"] ?? "", d["カテゴリ"] ?? "", d["記事タイプ"] ?? "", d.clicks ?? "", d.impressions ?? "", d.position ?? "", ...metricCols.map((c) => fmt(s[c]))].join("\t"));
}
fs.writeFileSync(outPath, outLines.join("\n") + "\n");

const prodPath = outPath.replace(/\.tsv$/, "") + "-products.tsv";
const sumKeys = [...new Set(productRows.flatMap((r) => Object.keys(r.sums).map((c) => `${r.platform}:${c}`)))].sort();
const prodLines = [["platform", "key", "product_name", "articles", "article_count", "share", ...sumKeys].join("\t")];
for (const r of productRows) {
  prodLines.push([r.platform, r.key, r.name.replace(/\t/g, " "), r.articles.join(";"), r.articles.length, r.share ? r.share.toFixed(3) : "0", ...sumKeys.map((k) => (k.startsWith(`${r.platform}:`) ? fmt(r.sums[k.slice(r.platform.length + 1)]) : ""))].join("\t"));
}
fs.writeFileSync(prodPath, prodLines.join("\n") + "\n");

console.log(JSON.stringify(summary, null, 2));
console.log(`saved: ${outPath} (${outLines.length - 1} rows), ${prodPath} (${prodLines.length - 1} rows)`);
