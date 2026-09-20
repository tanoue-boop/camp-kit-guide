// 公開ヘルプページを取得してテキスト化する読み取り専用ツール（調査用・記事や設定には触らない）
// 使い方: node scripts/fetch-help-page.mjs <URL> [--links] [--out file]
import fs from "node:fs";

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith("--"));
const wantLinks = args.includes("--links");
const outIdx = args.indexOf("--out");
const out = outIdx >= 0 ? args[outIdx + 1] : null;
if (!url) {
  console.error("usage: node scripts/fetch-help-page.mjs <URL> [--links] [--out file]");
  process.exit(1);
}

const res = await fetch(url, {
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Accept-Language": "ja,en;q=0.8" },
  redirect: "follow",
});
console.log(`status: ${res.status} ${res.url}`);
const html = await res.text();
if (out) fs.writeFileSync(out, html, "utf8");

const decodeEntities = (s) =>
  s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
   .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));

if (wantLinks) {
  const links = new Map();
  for (const m of html.matchAll(/<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const text = decodeEntities(m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
    links.set(m[1], text);
  }
  for (const [href, text] of links) console.log(`${href}\t${text}`);
} else {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|dt|dd|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
  console.log(decodeEntities(text));
}
