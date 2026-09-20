// ASP成果レポートの取得可否を確認する調査用スクリプト（読み取り専用・記事は変更しない）。
//
// 1. 楽天ウェブサービスのAPI一覧ページを取得し、成果報酬レポート系APIの有無を確認する
// 2. 楽天アフィリエイトの管理画面（レポート）が認証なしで到達できるかを確認する（できない想定）
// 3. 既存の楽天APIキー（RAKUTEN_APP_ID / RAKUTEN_ACCESS_KEY）でレポート系エンドポイント候補を叩いて応答を記録する
//
// 使い方: node scripts/asp-report-probe.mjs   … 結果は logs/asp-report-probe.json に保存
import fs from "node:fs";
import path from "node:path";

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

const HEADERS = { Referer: "https://www.camp-kit-guide.com/", Origin: "https://www.camp-kit-guide.com" };
const results = [];

async function probe(label, url, opts = {}) {
  const entry = { label, url: url.replace(ACCESS_KEY, "<ACCESS_KEY>").replace(APP_ID, "<APP_ID>") };
  try {
    const res = await fetch(url, { headers: HEADERS, redirect: "manual", ...opts });
    entry.status = res.status;
    entry.location = res.headers.get("location") ?? undefined;
    entry.contentType = res.headers.get("content-type") ?? undefined;
    const text = await res.text();
    entry.bodyHead = text.slice(0, 600);
    entry.bodyLength = text.length;
    if (label === "rws-documentation") {
      // API一覧（/documentation/<name> へのリンク）を抽出
      const names = [...text.matchAll(/href="[^"]*\/documentation\/([A-Za-z0-9_-]+)"/g)].map((m) => m[1]);
      entry.apiNamesFound = [...new Set(names)];
      entry.mentionsReport = /report|レポート|成果報酬|成果/i.test(text);
      entry.reportSnippets = [...text.matchAll(/.{0,60}(レポート|成果報酬|Report).{0,60}/g)].map((m) => m[0]).slice(0, 20);
    }
  } catch (e) {
    entry.error = String(e);
  }
  results.push(entry);
  console.log(`${label}: ${entry.status ?? entry.error}`);
}

await probe("rws-documentation", "https://webservice.rakuten.co.jp/documentation");
await probe("rws-top", "https://webservice.rakuten.co.jp/");
// 楽天アフィリエイト管理画面（レポート）: ログイン必須のはず
await probe("affiliate-report-page", "https://affiliate.rakuten.co.jp/report/");
await probe("affiliate-top", "https://affiliate.rakuten.co.jp/");
// レポートAPIのエンドポイント候補（存在しない想定だが実応答を記録する）
await probe(
  "rws-affiliate-report-guess",
  `https://openapi.rakuten.co.jp/affiliate/api/Report/20260701?format=json&applicationId=${APP_ID}&accessKey=${ACCESS_KEY}&affiliateId=${AFF_ID}`
);
// 既存キーが生きているかの対照（商品検索API・成功すれば 200）
await probe(
  "rws-ichiba-search-control",
  `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701?format=json&applicationId=${APP_ID}&accessKey=${ACCESS_KEY}&keyword=%E3%83%86%E3%83%B3%E3%83%88&hits=1`
);
// Amazon Associates Central（ログイン必須のはず）
await probe("amazon-associates-home", "https://affiliate.amazon.co.jp/home");
await probe("amazon-associates-reports", "https://affiliate.amazon.co.jp/home/reports");

fs.mkdirSync("logs", { recursive: true });
fs.writeFileSync("logs/asp-report-probe.json", JSON.stringify(results, null, 2));
console.log("saved: logs/asp-report-probe.json");
