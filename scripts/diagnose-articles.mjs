#!/usr/bin/env node
// 記事メタデータ抽出 → GSC実績との突合 → 集計（診断フェーズ1 / 2026-09-20）
//
// 入力:
//   content/posts/*.mdx        … 記事（slug=ファイル名）
//   _file/gsc-pages.tsv        … scripts/diagnose-gsc.mjs の出力（無ければGSC列は空欄で出す）
//   _file/gsc-queries.tsv      … 同上（上位1000クエリ）
// 出力:
//   _file/diagnosis-articles.tsv … 記事単位の一覧
//   docs/diagnosis-2026-09.md    … 集計レポート
//
// 使い方: node scripts/diagnose-articles.mjs

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "content", "posts");
const FILE_DIR = path.join(ROOT, "_file");
const SITE = "https://www.camp-kit-guide.com";
const OUT_TSV = path.join(FILE_DIR, "diagnosis-articles.tsv");
const OUT_MD = path.join(ROOT, "docs", "diagnosis-2026-09.md");

// ---------- 記事タイプ判定（タイトル正規表現・上から順に最初に当たったもの） ----------
// 「おすすめ5選と選び方」のように複数語を含むタイトルが多いため、順序が重要。
// 「おすすめ5選【2026年版】容量別に比較」のように ○選記事の副題に「比較」が付くものが多く、
// 比較を先に判定すると購入型の大半が比較へ流れるため、購入型（○選・おすすめ）を比較より先に判定する。
const TYPE_RULES = [
  ["体験", /レビュー|使ってみた|実際に使|使い比べ|検証/],
  ["購入型", /\d+選|おすすめ|オススメ|ランキング/],
  ["比較", /比較|の違い|違いは|違いを|vs|VS|どっち|どちら/], // 「サイズ違い」（不一致の意）を除外するため「違い」単独は不採用
  ["ハウツー", /方法|やり方|コツ|手順|流れ|始め方|使い方|張り方|立て方|洗い方|手入れ|選び方|目安/],
];
function classify(title) {
  for (const [type, re] of TYPE_RULES) if (re.test(title)) return type;
  return "問題解決/その他";
}

// ---------- リンク数カウント ----------
// ProductCardMdx は 1カード=1導線として数える（同一商品に楽天・Amazonの両ボタンがあれば各1）。
// カード外の生リンク（markdown / href）は URL ドメインで数える。画像URL(thumbnail.image.rakuten)は数えない。
const CARD_RE = /<ProductCardMdx\b[\s\S]*?\/>/g;
const RAKUTEN_LINK_RE = /https?:\/\/(?:hb\.afl\.rakuten\.co\.jp|item\.rakuten\.co\.jp|search\.rakuten\.co\.jp)\/[^\s"')<>]*/g;
const AMAZON_LINK_RE = /https?:\/\/(?:amzn\.to|www\.amazon\.co\.jp|amazon\.co\.jp)\/[^\s"')<>]*/g;
const A8_LINK_RE = /https?:\/\/px\.a8\.net\/[^\s"')<>]*/g;

function attr(card, name) {
  const m = card.match(new RegExp(`\\b${name}=\\"([^\\"]*)\\"`));
  return m ? m[1] : "";
}

function countLinks(body) {
  let rakuten = 0;
  let amazon = 0;
  let cards = 0;
  for (const card of body.match(CARD_RE) ?? []) {
    cards++;
    const source = attr(card, "source") || "rakuten";
    const aff = attr(card, "affiliateUrl");
    const amazonUrl = attr(card, "amazonUrl");
    const asin = attr(card, "amazonAsin");
    if (source === "rakuten" && aff && aff !== "#" && /rakuten\.co\.jp/.test(aff)) rakuten++;
    if (amazonUrl || asin || (source === "amazon" && aff && aff !== "#")) amazon++;
  }
  const rest = body.replace(CARD_RE, "");
  rakuten += (rest.match(RAKUTEN_LINK_RE) ?? []).length;
  amazon += (rest.match(AMAZON_LINK_RE) ?? []).length;
  const a8 = (body.match(A8_LINK_RE) ?? []).length;
  return { rakuten, amazon, a8, cards };
}

// ---------- 記事読み込み ----------
function loadArticles() {
  const out = [];
  for (const f of fs.readdirSync(POSTS_DIR)) {
    if (!f.endsWith(".mdx")) continue;
    const slug = f.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(POSTS_DIR, f), "utf8");
    const { data, content } = matter(raw);
    const title = String(data.title ?? "");
    out.push({
      slug,
      title,
      category: String(data.category ?? ""),
      type: classify(title),
      date: String(data.date ?? ""),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      ...countLinks(content),
    });
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

// ---------- GSC読み込み ----------
function readTsv(file) {
  if (!fs.existsSync(file)) return null;
  const [head, ...lines] = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
  const cols = head.split("\t");
  return lines.map((l) => Object.fromEntries(l.split("\t").map((v, i) => [cols[i], v])));
}

// page URL → slug（/posts/<slug> のみ。クエリ・フラグメント・末尾スラッシュを除去）
function pageToSlug(url) {
  try {
    const u = new URL(url);
    const m = u.pathname.replace(/\/+$/, "").match(/^\/posts\/([^/]+)$/);
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

function aggregatePages(rows) {
  // slug → {clicks, impressions, posWeighted}  複数URL変種は impressions 加重で position を合成
  const bySlug = new Map();
  const nonPost = { clicks: 0, impressions: 0, urls: 0 };
  for (const r of rows) {
    const slug = pageToSlug(r.page);
    const clicks = Number(r.clicks), impressions = Number(r.impressions), position = Number(r.position);
    if (!slug) {
      nonPost.clicks += clicks;
      nonPost.impressions += impressions;
      nonPost.urls++;
      continue;
    }
    const cur = bySlug.get(slug) ?? { clicks: 0, impressions: 0, posW: 0 };
    cur.clicks += clicks;
    cur.impressions += impressions;
    cur.posW += position * impressions;
    bySlug.set(slug, cur);
  }
  for (const v of bySlug.values()) {
    v.position = v.impressions ? v.posW / v.impressions : null;
    v.ctr = v.impressions ? v.clicks / v.impressions : null;
  }
  return { bySlug, nonPost };
}

// ---------- クエリ⇔既存記事の照合 ----------
// クエリを空白で分割し、汎用語（おすすめ・キャンプ等）を除いた実質トークンが
// いずれか1記事の「タイトル+タグ+slug」に全て含まれれば「専用記事あり」とみなす（ヒューリスティック）。
const GENERIC = new Set(["おすすめ", "オススメ", "人気", "ランキング", "選", "比較", "2026", "2026年", "最新", "とは", "キャンプ", "アウトドア", "用", "の", "は", "で", "に", "を"]);
function normalize(s) {
  return String(s)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60)); // ひらがな→カタカナ
}
function queryTokens(q) {
  return normalize(q)
    .split(/[\s　]+/)
    .filter((t) => t && !GENERIC.has(t));
}
function hasDedicatedArticle(query, articles) {
  const toks = queryTokens(query);
  if (toks.length === 0) return { hit: null, note: "汎用語のみ" };
  for (const a of articles) {
    const hay = normalize(`${a.title} ${a.tags.join(" ")} ${a.slug.replace(/-/g, " ")}`);
    if (toks.every((t) => hay.includes(t))) return { hit: a.slug };
  }
  return { hit: null };
}

// ---------- 集計ヘルパ ----------
const fmtN = (n) => (n == null ? "-" : Number(n).toLocaleString("ja-JP"));
const fmtPct = (x) => (x == null ? "-" : `${(x * 100).toFixed(2)}%`);
const fmtPos = (x) => (x == null ? "-" : Number(x).toFixed(1));
const mdRow = (cells) => `| ${cells.map((c) => String(c).replace(/\|/g, "\\|")).join(" | ")} |`;
function mdTable(header, rows) {
  return [mdRow(header), mdRow(header.map(() => "---")), ...rows.map(mdRow)].join("\n");
}
function groupStats(articles, keyFn) {
  const g = new Map();
  for (const a of articles) {
    const k = keyFn(a);
    const cur = g.get(k) ?? { n: 0, clicks: 0, impressions: 0, withData: 0, zero: 0 };
    cur.n++;
    if (a.gsc) {
      cur.withData++;
      cur.clicks += a.gsc.clicks;
      cur.impressions += a.gsc.impressions;
    }
    if (!a.gsc || a.gsc.impressions < 10) cur.zero++;
    g.set(k, cur);
  }
  return [...g.entries()].sort((a, b) => b[1].clicks - a[1].clicks || b[1].impressions - a[1].impressions);
}
function positionBand(a) {
  if (!a.gsc || a.gsc.impressions === 0) return "圏外（表示なし）";
  const p = a.gsc.position;
  if (p <= 10) return "1-10位";
  if (p <= 20) return "11-20位";
  if (p <= 50) return "21-50位";
  return "51位以下";
}

// ---------- main ----------
const articles = loadArticles();
const pagesRaw = readTsv(path.join(FILE_DIR, "gsc-pages.tsv"));
const queriesRaw = readTsv(path.join(FILE_DIR, "gsc-queries.tsv"));
const meta = fs.existsSync(path.join(FILE_DIR, "gsc-meta.json")) ? JSON.parse(fs.readFileSync(path.join(FILE_DIR, "gsc-meta.json"), "utf8")) : null;
const hasGsc = !!pagesRaw;

let pageAgg = null;
let unmatchedPages = [];
if (hasGsc) {
  pageAgg = aggregatePages(pagesRaw);
  const slugSet = new Set(articles.map((a) => a.slug));
  for (const a of articles) a.gsc = pageAgg.bySlug.get(a.slug) ?? null;
  unmatchedPages = [...pageAgg.bySlug.entries()].filter(([s]) => !slugSet.has(s));
}

// ----- TSV -----
const header = ["slug", "タイトル", "カテゴリ", "記事タイプ", "公開日", "楽天リンク数", "Amazonリンク数", "clicks", "impressions", "ctr", "position"];
const tsvLines = [header.join("\t")];
for (const a of articles) {
  const g = a.gsc;
  tsvLines.push(
    [
      a.slug,
      a.title.replace(/\t/g, " "),
      a.category,
      a.type,
      a.date,
      a.rakuten,
      a.amazon,
      g ? g.clicks : hasGsc ? 0 : "",
      g ? g.impressions : hasGsc ? 0 : "",
      g && g.ctr != null ? (g.ctr * 100).toFixed(2) : "",
      g && g.position != null ? g.position.toFixed(1) : "",
    ].join("\t")
  );
}
fs.writeFileSync(OUT_TSV, tsvLines.join("\n") + "\n", "utf8");

// ----- Markdown -----
const md = [];
const today = new Date().toISOString().slice(0, 10);
md.push(`# CampKit Guide 記事診断レポート（フェーズ1）`);
md.push(``);
md.push(`- 作成日: ${today}`);
md.push(`- 対象記事: ${articles.length}本（content/posts/*.mdx）`);
if (hasGsc) {
  md.push(`- GSC期間: ${meta?.startDate} 〜 ${meta?.endDate}（${meta?.days}日 / プロパティ ${meta?.siteUrl} / 取得 ${meta?.fetchedAt}）`);
  md.push(`- GSC取得行数: page ${pagesRaw.length}行 / query ${queriesRaw?.length ?? 0}行`);
} else {
  md.push(`- **GSCデータ: 未取得**（${meta?.error ?? "_file/gsc-pages.tsv が存在しない"}）。GSC由来の指標は空欄。認証情報を用意して \`node scripts/diagnose-gsc.mjs\` → 本スクリプトを再実行すると埋まる。`);
}
md.push(`- 出力: \`_file/diagnosis-articles.tsv\`（記事単位一覧）`);
md.push(``);

// GA4 導入状況（2026-09-20 に手動確認した静的事実。再実行で消えないようここに固定）
md.push(`## GA4 導入確認（2026-09-20 実施）`);
md.push(``);
md.push(`- **導入済み（測定ID: G-W64E37EDCL）**`);
md.push(`- 実装: \`pages/_document.tsx\` が \`NEXT_PUBLIC_GA_ID\` を読み gtag.js（googletagmanager.com/gtag/js）を \`<Head>\` に直書き。\`@next/third-parties\` は不使用。`);
md.push(`- SPA遷移: \`pages/_app.tsx\` が \`routeChangeComplete\` で \`lib/gtag.ts\` の \`pageview()\` を呼び \`gtag('config', ID, {page_path})\` を送信。\`event()\` ヘルパは定義のみで呼び出し箇所なし（アフィリンクのクリック計測などのカスタムイベントは未実装）。`);
md.push(`- 自己トラフィック除外: URLに \`?ckbot=1\` または sessionStorage \`ckbot=1\` があると \`window['ga-disable-<ID>']=true\` で計測停止。`);
md.push(`- 本番HTML（https://www.camp-kit-guide.com/）で \`gtag/js?id=G-W64E37EDCL\` の出力を確認済み（Vercel側の環境変数も設定されている）。`);
md.push(``);

// 判定ルール
md.push(`## 判定ルール`);
md.push(``);
md.push(`### 記事タイプ（タイトルの正規表現・上から順に最初に一致したもの）`);
md.push(``);
md.push(mdTable(["順", "タイプ", "正規表現"], TYPE_RULES.map(([t, re], i) => [i + 1, t, `\`${re.source}\``]).concat([[TYPE_RULES.length + 1, "問題解決/その他", "上記いずれにも該当しない"]])));
md.push(``);
md.push(`「おすすめ5選【2026年版】容量別に比較」のように ○選記事の副題に「比較」「選び方」が付くタイトルが多いため、体験→購入型→比較→ハウツーの順で優先判定（比較を先にすると購入型の約半数が比較へ流れる）。「選び方」「目安」単独（○選・おすすめを含まない）はハウツー扱い。`);
md.push(``);
md.push(`### アフィリエイトリンク数`);
md.push(``);
md.push(`- \`<ProductCardMdx>\` 1枚を1導線として数える。楽天＝\`source="rakuten"\`（既定）かつ \`affiliateUrl\` が楽天URL（\`#\` は数えない）。Amazon＝\`amazonUrl\` または \`amazonAsin\` あり、または \`source="amazon"\` かつ \`affiliateUrl\` が \`#\` 以外。`);
md.push(`- カード外のリンクはURLドメインで加算（楽天: hb.afl/item/search.rakuten.co.jp、Amazon: amzn.to/amazon.co.jp）。\`<ComparisonTableMdx>\` の rows に入った \`affiliateUrl\`（比較表の「楽天で見る」リンク）もここに含まれるため、5選記事は概ね「カード5＋比較表5＝楽天10」になる。商品画像URL（thumbnail.image.rakuten.co.jp）は数えない。`);
md.push(`- 参考として A8.net（px.a8.net）のASPリンク数も別途集計（TSVの列には含めない）。`);
md.push(``);

// 記事属性の全体像（GSC無しでも出せる）
md.push(`## 記事属性の全体像`);
md.push(``);
const byType = groupStats(articles, (a) => a.type);
const byCat = groupStats(articles, (a) => a.category);
md.push(`### 記事タイプ別`);
md.push(``);
md.push(
  mdTable(
    ["記事タイプ", "記事数", "楽天リンク合計", "Amazonリンク合計", "A8リンク合計", ...(hasGsc ? ["clicks合計", "impressions合計", "clicks/記事", "impressions/記事", "表示<10の記事"] : [])],
    byType.map(([k, s]) => {
      const as = articles.filter((a) => a.type === k);
      const sum = (f) => as.reduce((x, a) => x + a[f], 0);
      return [k, s.n, sum("rakuten"), sum("amazon"), sum("a8"), ...(hasGsc ? [fmtN(s.clicks), fmtN(s.impressions), (s.clicks / s.n).toFixed(1), (s.impressions / s.n).toFixed(0), s.zero] : [])];
    })
  )
);
md.push(``);
md.push(`### カテゴリ別`);
md.push(``);
md.push(
  mdTable(
    ["カテゴリ", "記事数", "楽天リンク合計", "Amazonリンク合計", "A8リンク合計", ...(hasGsc ? ["clicks合計", "impressions合計", "clicks/記事", "impressions/記事", "表示<10の記事"] : [])],
    byCat.map(([k, s]) => {
      const as = articles.filter((a) => a.category === k);
      const sum = (f) => as.reduce((x, a) => x + a[f], 0);
      return [k, s.n, sum("rakuten"), sum("amazon"), sum("a8"), ...(hasGsc ? [fmtN(s.clicks), fmtN(s.impressions), (s.clicks / s.n).toFixed(1), (s.impressions / s.n).toFixed(0), s.zero] : [])];
    })
  )
);
md.push(``);
md.push(`### 収益導線の型別（リンク内容から判定）`);
md.push(``);
const lineType = (a) => (a.a8 > 0 && a.rakuten + a.amazon === 0 ? "ASPのみ" : a.a8 > 0 ? "物販+ASP" : a.rakuten + a.amazon > 0 ? "物販のみ" : "リンクなし");
const byLine = groupStats(articles, lineType);
md.push(mdTable(["導線", "記事数", ...(hasGsc ? ["clicks合計", "impressions合計", "clicks/記事", "impressions/記事", "表示<10の記事"] : [])], byLine.map(([k, s]) => [k, s.n, ...(hasGsc ? [fmtN(s.clicks), fmtN(s.impressions), (s.clicks / s.n).toFixed(1), (s.impressions / s.n).toFixed(0), s.zero] : [])])));
md.push(``);
md.push(`### 公開月別`);
md.push(``);
const byMonth = groupStats(articles, (a) => a.date.slice(0, 7)).sort((a, b) => a[0].localeCompare(b[0]));
md.push(mdTable(["公開月", "記事数", ...(hasGsc ? ["clicks合計", "impressions合計", "clicks/記事", "impressions/記事", "表示<10の記事"] : [])], byMonth.map(([k, s]) => [k, s.n, ...(hasGsc ? [fmtN(s.clicks), fmtN(s.impressions), (s.clicks / s.n).toFixed(1), (s.impressions / s.n).toFixed(0), s.zero] : [])])));
md.push(``);
const noLink = articles.filter((a) => a.rakuten + a.amazon + a.a8 === 0);
md.push(`### 収益リンクが1本も無い記事（${noLink.length}本）`);
md.push(``);
md.push(noLink.length ? noLink.map((a) => `- \`${a.slug}\`（${a.type} / ${a.category}）${a.title}`).join("\n") : "なし");
md.push(``);
const amazonZero = articles.filter((a) => a.rakuten > 0 && a.amazon === 0);
md.push(`### 楽天リンクはあるがAmazonリンクが0本の記事: ${amazonZero.length}本 / 楽天リンクあり${articles.filter((a) => a.rakuten > 0).length}本`);
md.push(``);

if (hasGsc) {
  // 1. 表示ゼロ
  const zero = articles.filter((a) => !a.gsc || a.gsc.impressions < 10);
  const totalClicks = articles.reduce((x, a) => x + (a.gsc?.clicks ?? 0), 0);
  const totalImp = articles.reduce((x, a) => x + (a.gsc?.impressions ?? 0), 0);
  md.push(`## 1. 表示ゼロ記事（impressions < 10）`);
  md.push(``);
  md.push(`- **${zero.length}本 / ${articles.length}本（${((zero.length / articles.length) * 100).toFixed(1)}%）**`);
  md.push(`- うち GSC に行自体が無い（impressions=0）: ${articles.filter((a) => !a.gsc).length}本`);
  md.push(`- 記事合計: clicks ${fmtN(totalClicks)} / impressions ${fmtN(totalImp)}（記事以外のURL: clicks ${fmtN(pageAgg.nonPost.clicks)} / impressions ${fmtN(pageAgg.nonPost.impressions)} / ${pageAgg.nonPost.urls}URL）`);
  if (unmatchedPages.length) md.push(`- GSCにあるがMDXが無い /posts/ URL: ${unmatchedPages.length}件（${unmatchedPages.slice(0, 10).map(([s, v]) => `${s}:${v.impressions}`).join(", ")}${unmatchedPages.length > 10 ? " …" : ""}）`);
  md.push(``);
  md.push(`<details><summary>表示ゼロ記事の一覧（${zero.length}本）</summary>`);
  md.push(``);
  md.push(mdTable(["slug", "タイプ", "カテゴリ", "公開日", "imp"], zero.map((a) => [a.slug, a.type, a.category, a.date, a.gsc?.impressions ?? 0])));
  md.push(``);
  md.push(`</details>`);
  md.push(``);

  // 2. クリック上位20
  md.push(`## 2. クリック上位20記事`);
  md.push(``);
  const top = [...articles].filter((a) => a.gsc).sort((a, b) => b.gsc.clicks - a.gsc.clicks || b.gsc.impressions - a.gsc.impressions).slice(0, 20);
  md.push(
    mdTable(
      ["#", "slug", "タイプ", "カテゴリ", "公開日", "clicks", "imp", "CTR", "pos", "楽天/Amz/A8"],
      top.map((a, i) => [i + 1, a.slug, a.type, a.category, a.date, fmtN(a.gsc.clicks), fmtN(a.gsc.impressions), fmtPct(a.gsc.ctr), fmtPos(a.gsc.position), `${a.rakuten}/${a.amazon}/${a.a8}`])
    )
  );
  md.push(``);
  const topClicks = top.reduce((x, a) => x + a.gsc.clicks, 0);
  md.push(`上位20記事でクリック合計の ${totalClicks ? ((topClicks / totalClicks) * 100).toFixed(1) : "-"}% を占める。`);
  md.push(``);

  // 3. カテゴリ別・タイプ別（上の表に含めた）
  md.push(`## 3. カテゴリ別・記事タイプ別の合計と1記事あたり平均`);
  md.push(``);
  md.push(`「記事属性の全体像」の各表に clicks合計 / impressions合計 / 1記事あたり平均 を併記済み。`);
  md.push(``);

  // 4. 順位帯
  md.push(`## 4. 順位帯別の記事分布（impressions加重平均順位）`);
  md.push(``);
  const bands = ["1-10位", "11-20位", "21-50位", "51位以下", "圏外（表示なし）"];
  const byBand = new Map(bands.map((b) => [b, []]));
  for (const a of articles) byBand.get(positionBand(a)).push(a);
  md.push(
    mdTable(
      ["順位帯", "記事数", "割合", "clicks合計", "impressions合計"],
      bands.map((b) => {
        const as = byBand.get(b);
        return [b, as.length, `${((as.length / articles.length) * 100).toFixed(1)}%`, fmtN(as.reduce((x, a) => x + (a.gsc?.clicks ?? 0), 0)), fmtN(as.reduce((x, a) => x + (a.gsc?.impressions ?? 0), 0))];
      })
    )
  );
  md.push(``);
  md.push(`### 順位帯 × 記事タイプ（記事数）`);
  md.push(``);
  const types = byType.map(([k]) => k);
  md.push(mdTable(["順位帯", ...types], bands.map((b) => [b, ...types.map((t) => byBand.get(b).filter((a) => a.type === t).length)])));
  md.push(``);

  // 5. 専用記事がないクエリ
  md.push(`## 5. 表示があるのに専用記事がないクエリ（上位30）`);
  md.push(``);
  if (queriesRaw) {
    const gaps = [];
    for (const q of queriesRaw) {
      const r = hasDedicatedArticle(q.query, articles);
      if (!r.hit && r.note !== "汎用語のみ") gaps.push({ ...q, impressions: Number(q.impressions), clicks: Number(q.clicks) });
    }
    gaps.sort((a, b) => b.impressions - a.impressions);
    md.push(`照合方法: クエリを空白分割し汎用語（おすすめ・キャンプ・2026 等）を除いたトークンが、いずれか1記事の「タイトル＋tags＋slug」に全て含まれれば専用記事あり。ひらがな/カタカナ・全半角は正規化。判定は機械的なので、上位から目視で確認すること。`);
    md.push(``);
    md.push(`- 取得クエリ ${queriesRaw.length}件のうち専用記事なし判定: ${gaps.length}件`);
    md.push(``);
    md.push(mdTable(["#", "query", "clicks", "imp", "CTR", "pos"], gaps.slice(0, 30).map((q, i) => [i + 1, q.query, q.clicks, q.impressions, `${q.ctr}%`, q.position])));
  } else {
    md.push(`_file/gsc-queries.tsv が無いため未実施。`);
  }
  md.push(``);
} else {
  md.push(`## GSC依存の集計（未実施）`);
  md.push(``);
  md.push(`### 詰まった点（2026-09-20）`);
  md.push(``);
  md.push(`- リポジトリ・\`.env.local\`・環境変数のいずれにも Search Console API の認証情報（サービスアカウントキー／OAuthトークン）が無い。\`gcloud\` CLI も未インストール。`);
  md.push(`- 指示にあった自動化用Chrome（deviceId 68806dea-…）でのGCPコンソール操作は、本セッションにブラウザ操作ツールが接続されていないため実行不可（localhost:9222 等のリモートデバッグ口も無し）。Google Drive 連携も権限未付与で、Drive上のキーファイル探索も不可。`);
  md.push(`- 対処: \`scripts/diagnose-gsc.mjs\` は認証情報が揃えば即動く状態にしてある（依存追加なし・SAキーはRS256 JWTを自前署名）。`);
  md.push(``);
  md.push(`### 解除手順（人手で1回だけ）`);
  md.push(``);
  md.push(`1. GCPコンソール（プロジェクト camp-kit-gsc / 392502212588）→「IAMと管理 > サービスアカウント」でSAを作成（既存があればそれ）→「キー > 鍵を追加 > JSON」でダウンロード。`);
  md.push(`2. 「APIとサービス > ライブラリ」で **Google Search Console API** を有効化。`);
  md.push(`3. Search Console（https://www.camp-kit-guide.com/ のプロパティ）→「設定 > ユーザーと権限」で SAの client_email を「制限付き」以上で追加。`);
  md.push(`4. JSONを \`_file/gsc-sa-key.json\` に置き（.gitignore 済）、\`.env.local\` に \`GSC_SA_KEY_FILE=_file/gsc-sa-key.json\` を追記。`);
  md.push(`5. \`node scripts/diagnose-gsc.mjs\` → \`node scripts/diagnose-articles.mjs\` を実行すると本レポートとTSVのGSC列が埋まる。`);
  md.push(``);
  md.push(`以下はGSCデータ取得後に自動生成される（本スクリプト再実行で追記）:`);
  md.push(``);
  md.push(`1. 表示ゼロ記事（impressions<10）の数と割合`);
  md.push(`2. クリック上位20記事`);
  md.push(`3. カテゴリ別・記事タイプ別の合計clicks/impressionsと1記事あたり平均`);
  md.push(`4. 順位帯別の記事分布（1-10 / 11-20 / 21-50 / 51以下 / 圏外）`);
  md.push(`5. 表示があるのに専用記事がないクエリ上位30`);
  md.push(``);
}

fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
fs.writeFileSync(OUT_MD, md.join("\n") + "\n", "utf8");
console.log(`記事 ${articles.length}本 / GSC ${hasGsc ? "あり" : "なし"} → ${path.relative(ROOT, OUT_TSV)}, ${path.relative(ROOT, OUT_MD)}`);
