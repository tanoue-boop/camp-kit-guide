// 楽天市場API（IchibaItem/Search/20260701）でキーワード検索し、上位候補を表示・保存する。
// 商品差し替え／楽天リンク穴埋めの実データ取得用（読み取り専用・記事は変更しない）。
//
// 使い方:
//   node scripts/rakuten-search.mjs "キーワード"                 … 1件検索して標準出力
//   node scripts/rakuten-search.mjs --file queries.tsv [--out x.json]
//       … TSV（key<TAB>keyword）を順に検索し、結果を JSON に保存（既定: logs/rakuten-search.json）
//   オプション: --hits=10（既定10）  --sort=-reviewCount（既定）  --all（在庫なしも含める）
//
// 認証・ヘッダ（docs/scheduled-task-spec.md「実データ取得」）:
//   applicationId + accessKey を .env.local から読む。Referer と Origin の両方が必須。
//   連続リクエストは 429 になるため 8 秒間隔で叩く。
import fs from "node:fs";
import path from "node:path";

const ENDPOINT = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701";
const INTERVAL_MS = 8000;

function readEnv(name) {
  if (process.env[name]) return process.env[name];
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return "";
  const m = fs.readFileSync(envPath, "utf8").match(new RegExp(`^${name}=(.+)$`, "m"));
  return m ? m[1].trim() : "";
}
const APP_ID = readEnv("RAKUTEN_APP_ID");
const ACCESS_KEY = readEnv("RAKUTEN_ACCESS_KEY");
const AFF_ID = readEnv("NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID");
if (!APP_ID || !ACCESS_KEY) {
  console.error("RAKUTEN_APP_ID / RAKUTEN_ACCESS_KEY が .env.local から読めません。中止します。");
  process.exit(1);
}

const args = process.argv.slice(2);
const opt = (name, def) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : def;
};
const hits = Number(opt("hits", "10"));
const sort = opt("sort", "-reviewCount");
const includeOos = args.includes("--all");
const fileIdx = args.indexOf("--file");
const outIdx = args.indexOf("--out");

// 記事に載せる形式（hb.afl ラッパー）。素URL(itemUrl?rafcid=) は成果が付かない。
const hb = (itemUrl) => (AFF_ID ? `https://hb.afl.rakuten.co.jp/hgc/${AFF_ID}/?pc=${encodeURIComponent(itemUrl.split("?")[0])}` : itemUrl);

async function search(keyword) {
  const params = new URLSearchParams({
    format: "json",
    applicationId: APP_ID,
    accessKey: ACCESS_KEY,
    keyword,
    hits: String(hits),
    sort,
    availability: includeOos ? "0" : "1",
    imageFlag: "1",
    elements: "itemName,itemPrice,itemUrl,shopName,shopCode,itemCode,reviewCount,reviewAverage,availability,mediumImageUrls",
  });
  const res = await fetch(`${ENDPOINT}?${params}`, {
    headers: { Referer: "https://www.camp-kit-guide.com/", Origin: "https://www.camp-kit-guide.com" },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  const json = JSON.parse(text);
  return (json.Items ?? []).map((it) => {
    const i = it.Item ?? it;
    const img = (i.mediumImageUrls ?? [])[0];
    return {
      itemName: i.itemName,
      itemPrice: i.itemPrice,
      shopName: i.shopName,
      shopCode: i.shopCode,
      itemCode: i.itemCode,
      reviewCount: i.reviewCount,
      reviewAverage: i.reviewAverage,
      availability: i.availability,
      itemUrl: (i.itemUrl ?? "").split("?")[0],
      affiliateUrl: hb(i.itemUrl ?? ""),
      image: typeof img === "string" ? img.split("?")[0] : img?.imageUrl?.split("?")[0],
    };
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function print(key, keyword, items) {
  console.log(`\n### ${key} | ${keyword} | ${items.length}件`);
  items.forEach((i, n) => {
    console.log(
      `${n + 1}. ¥${i.itemPrice} ★${i.reviewAverage}/${i.reviewCount}件 [${i.shopName}] ${i.itemName.slice(0, 110)}\n   ${i.itemUrl}`,
    );
  });
}

if (fileIdx >= 0) {
  const queries = fs
    .readFileSync(args[fileIdx + 1], "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => {
      const [key, keyword] = l.split("\t");
      return { key, keyword };
    });
  const outPath = outIdx >= 0 ? args[outIdx + 1] : path.join(process.cwd(), "logs", "rakuten-search.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const results = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf8")) : {};
  for (let n = 0; n < queries.length; n++) {
    const { key, keyword } = queries[n];
    if (n > 0) await sleep(INTERVAL_MS);
    try {
      const items = await search(keyword);
      results[key] = { keyword, items };
      print(key, keyword, items);
    } catch (e) {
      console.error(`\n### ${key} | ${keyword} | ERROR ${e.message}`);
      results[key] = { keyword, error: e.message, items: [] };
      if (/429/.test(e.message)) await sleep(INTERVAL_MS * 2);
    }
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");
  }
  console.log(`\nsaved: ${outPath}`);
} else {
  const keyword = args.filter((a) => !a.startsWith("--")).join(" ");
  if (!keyword) {
    console.error('使い方: node scripts/rakuten-search.mjs "キーワード" | --file queries.tsv');
    process.exit(1);
  }
  const items = await search(keyword);
  print("single", keyword, items);
}
