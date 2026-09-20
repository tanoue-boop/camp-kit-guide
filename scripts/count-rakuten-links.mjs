// 記事内の楽天URLを種別ごとに集計する（読み取り専用・変更なし）
// 使い方: node scripts/count-rakuten-links.mjs [--list]
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "content/posts");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
const list = process.argv.includes("--list");

const URL_RE = /https?:\/\/[a-z0-9.-]*rakuten[a-z0-9.-]*\.(?:co\.jp|com)[^\s"'`)<>]*/gi;

const buckets = {
  hb_afl: 0, // hb.afl.rakuten.co.jp/hgc/... （報酬発生）
  hb_afl_other: 0, // hb.afl だが /hgc/ 以外
  image: 0, // thumbnail.image.rakuten.co.jp（商品画像）
  raw_item: 0, // item.rakuten.co.jp（素URL・報酬ゼロ）
  raw_search: 0, // search.rakuten.co.jp（素URL・報酬ゼロ）
  raw_other: 0, // その他 rakuten ドメイン
};
const rawHits = [];
const otherHosts = new Map();
const affIds = new Map();

for (const f of files) {
  const text = fs.readFileSync(path.join(dir, f), "utf8");
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(URL_RE)) {
      const url = m[0];
      const host = new URL(url).hostname;
      if (host === "hb.afl.rakuten.co.jp") {
        const mm = url.match(/\/hgc\/([0-9a-z.]+)\//i);
        if (mm) {
          buckets.hb_afl++;
          affIds.set(mm[1], (affIds.get(mm[1]) || 0) + 1);
        } else buckets.hb_afl_other++;
      } else if (host === "thumbnail.image.rakuten.co.jp" || host.endsWith("image.rakuten.co.jp")) {
        buckets.image++;
      } else if (host === "item.rakuten.co.jp") {
        buckets.raw_item++;
        rawHits.push({ f, line: i + 1, url });
      } else if (host === "search.rakuten.co.jp") {
        buckets.raw_search++;
        rawHits.push({ f, line: i + 1, url });
      } else {
        buckets.raw_other++;
        otherHosts.set(host, (otherHosts.get(host) || 0) + 1);
        rawHits.push({ f, line: i + 1, url });
      }
    }
  });
}

console.log(`files scanned: ${files.length}`);
console.log(JSON.stringify(buckets, null, 2));
console.log("affiliate ids in hb.afl:", Object.fromEntries(affIds));
if (otherHosts.size) console.log("other hosts:", Object.fromEntries(otherHosts));
console.log(`raw (non-affiliate) rakuten links total: ${rawHits.length}`);
console.log(`raw files: ${new Set(rawHits.map((h) => h.f)).size}`);
// 素URLがどの文脈（属性名）に入っているかの内訳
const ctx = new Map();
const perFile = new Map();
for (const h of rawHits) {
  const lineText = fs.readFileSync(path.join(dir, h.f), "utf8").split("\n")[h.line - 1];
  const idx = lineText.indexOf(h.url);
  const before = lineText.slice(Math.max(0, idx - 40), idx);
  let kind = "other";
  const am = before.match(/([A-Za-z]+)=["']$/);
  if (am) kind = `attr:${am[1]}`;
  else if (/\]\($/.test(before)) kind = "markdown-link";
  else if (/href=["']$/.test(before)) kind = "href";
  else if (/:\s*["']$/.test(before)) kind = "json-or-fm";
  h.kind = kind;
  ctx.set(kind, (ctx.get(kind) || 0) + 1);
  perFile.set(h.f, (perFile.get(h.f) || 0) + 1);
}
console.log("raw link context:", Object.fromEntries(ctx));
if (list) {
  console.log("--- per file ---");
  for (const [f, n] of [...perFile.entries()].sort((a, b) => b[1] - a[1])) console.log(`${n}\t${f}`);
  console.log("--- hits ---");
  for (const h of rawHits) console.log(`${h.f}:${h.line}\t${h.kind}\t${h.url}`);
}
