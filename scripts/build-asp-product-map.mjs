// ASP成果レポート（楽天アフィリエイト／Amazonアソシエイト）を記事単位に突合するための
// 「商品キー → 記事slug」対応表を content/posts から生成する（読み取り専用・記事は変更しない）。
//
// 楽天もAmazonも、成果レポートは「どのページから」ではなく「どの商品が」売れたかで返ってくる
// （楽天: 商品URL item.rakuten.co.jp/<shop>/<item>/ ／ Amazon: ASIN）。
// そのため記事単位の突合は、商品キーが載っている記事を逆引きする形になる。
// 同じ商品を複数記事に載せている場合は按分できない（articles 列が複数になる）。
//
// 使い方: node scripts/build-asp-product-map.mjs [--resolve-shortlinks]
//   出力: _file/asp-product-article-map.tsv
//   列: platform / key / product_name / articles(;区切り) / article_count / ranks(;区切り)
//   --resolve-shortlinks: amazonAsin が無く amzn.to 短縮リンクだけのカードについて、短縮URLの
//     リダイレクト先(amazon.co.jp/dp/<ASIN>)を HEAD で解決して ASIN キーに寄せる。
//     解決結果は _file/amazon-shortlink-asin.tsv にキャッシュし、次回以降は再取得しない。
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "content/posts");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")).sort();
const RESOLVE = process.argv.includes("--resolve-shortlinks");
const CACHE_PATH = "_file/amazon-shortlink-asin.tsv";

// 短縮リンク → ASIN のキャッシュ（short_url \t asin \t resolved_url \t checked_date）
const shortCache = new Map();
if (fs.existsSync(CACHE_PATH)) {
  for (const line of fs.readFileSync(CACHE_PATH, "utf8").split("\n").slice(1)) {
    const [u, asin, resolved, date] = line.split("\t");
    if (u) shortCache.set(u, { asin: asin || "", resolved: resolved || "", date: date || "" });
  }
}
async function resolveShort(url) {
  if (shortCache.has(url) && shortCache.get(url).asin) return shortCache.get(url).asin;
  let location = "";
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "manual", headers: { "User-Agent": "Mozilla/5.0" } });
    location = res.headers.get("location") ?? "";
  } catch (e) {
    location = `ERROR:${e.message}`;
  }
  const m = location.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/);
  shortCache.set(url, { asin: m ? m[1] : "", resolved: location.split("?")[0].slice(0, 200), date: new Date().toISOString().slice(0, 10) });
  return m ? m[1] : "";
}

// key -> { platform, name, articles: Map<slug, rank> }
const map = new Map();
const add = (platform, key, name, slug, rank) => {
  const id = `${platform}\t${key}`;
  if (!map.has(id)) map.set(id, { platform, key, name, articles: new Map() });
  const e = map.get(id);
  if (!e.name && name) e.name = name;
  if (!e.articles.has(slug)) e.articles.set(slug, rank ?? "");
};

const attr = (block, name) => {
  const m = block.match(new RegExp(`\\b${name}=\\{?"([^"]*)"`));
  return m ? m[1] : "";
};
const rakutenKey = (url) => {
  // hb.afl の pc= 内、または素URLから item.rakuten.co.jp/<shop>/<item>/ を取り出す
  try {
    const u = new URL(url);
    let target = url;
    if (u.hostname === "hb.afl.rakuten.co.jp") target = decodeURIComponent(u.searchParams.get("pc") ?? "");
    const m = target.match(/item\.rakuten\.co\.jp\/([^/?#]+)\/([^/?#]+)/);
    return m ? `${m[1]}/${m[2]}` : "";
  } catch {
    return "";
  }
};

let cards = 0;
let amzShortOnly = 0;
for (const f of files) {
  const slug = f.replace(/\.mdx$/, "");
  const text = fs.readFileSync(path.join(dir, f), "utf8");
  // ProductCardMdx ブロック
  for (const m of text.matchAll(/<ProductCardMdx\b([\s\S]*?)\/>/g)) {
    const block = m[1];
    cards++;
    const name = attr(block, "name");
    const rank = attr(block, "rank");
    const asin = attr(block, "amazonAsin");
    const amazonUrl = attr(block, "amazonUrl");
    const affiliateUrl = attr(block, "affiliateUrl");
    const source = attr(block, "source");
    if (asin) add("amazon", asin, name, slug, rank);
    else if (source === "amazon" && /^B0[A-Z0-9]{8}$/.test(affiliateUrl)) add("amazon", affiliateUrl, name, slug, rank);
    else if (amazonUrl) {
      // amzn.to 短縮のみで ASIN が無いカード。--resolve-shortlinks で ASIN に解決できれば amazon キーへ寄せる
      amzShortOnly++;
      let asinResolved = "";
      if (RESOLVE) {
        asinResolved = await resolveShort(amazonUrl);
        await new Promise((r) => setTimeout(r, 400));
      } else if (shortCache.get(amazonUrl)?.asin) asinResolved = shortCache.get(amazonUrl).asin;
      if (asinResolved) add("amazon", asinResolved, name, slug, rank);
      else add("amazon-shortlink", amazonUrl, name, slug, rank);
    }
    const rk = rakutenKey(affiliateUrl);
    if (rk) add("rakuten", rk, name, slug, rank);
  }
  // 比較表 JSON 内の楽天URL（ProductCard と同じ商品のことが多いが、別商品の場合もあるので拾う）
  for (const m of text.matchAll(/https:\/\/hb\.afl\.rakuten\.co\.jp\/hgc\/[^"'\s)]+/g)) {
    const rk = rakutenKey(m[0]);
    if (rk) add("rakuten", rk, "", slug, "");
  }
  // 比較表 JSON 内の ASIN（"asin":"B0..." 形式）
  for (const m of text.matchAll(/"asin"\s*:\s*"(B0[A-Z0-9]{8})"/g)) add("amazon", m[1], "", slug, "");
}

const rows = [...map.values()].sort((a, b) => a.platform.localeCompare(b.platform) || a.key.localeCompare(b.key));
const out = ["platform\tkey\tproduct_name\tarticles\tarticle_count\tranks"];
for (const r of rows) {
  const slugs = [...r.articles.keys()];
  const ranks = [...r.articles.values()];
  out.push([r.platform, r.key, r.name.replace(/\t/g, " "), slugs.join(";"), slugs.length, ranks.join(";")].join("\t"));
}
fs.mkdirSync("_file", { recursive: true });
fs.writeFileSync("_file/asp-product-article-map.tsv", out.join("\n") + "\n");
if (RESOLVE) {
  const lines = ["short_url\tasin\tresolved_url\tchecked_date"];
  for (const [u, v] of shortCache) lines.push([u, v.asin, v.resolved, v.date].join("\t"));
  fs.writeFileSync(CACHE_PATH, lines.join("\n") + "\n");
  console.log(`shortlink cache saved: ${CACHE_PATH} (${shortCache.size} entries, resolved: ${[...shortCache.values()].filter((v) => v.asin).length})`);
}

// サマリ（突合精度の目安）
const byPlatform = {};
for (const r of rows) {
  const p = (byPlatform[r.platform] ??= { keys: 0, single: 0, multi: 0 });
  p.keys++;
  if (r.articles.size === 1) p.single++;
  else p.multi++;
}
console.log(`files: ${files.length}, ProductCardMdx: ${cards}, amzn.to only (ASIN無し): ${amzShortOnly}`);
console.log(JSON.stringify(byPlatform, null, 2));
console.log("saved: _file/asp-product-article-map.tsv");
