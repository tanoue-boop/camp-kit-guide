// 記事内の hb.afl.rakuten.co.jp リンクをパラメータ構成別に集計する（読み取り専用・変更なし）
// 使い方: node scripts/count-hb-params.mjs [--list]
//   総数 / rafcid= あり / m= あり / pc= のみ / 形式が壊れているもの / 計測ID(rafcid以外の付加パラメータ) を出す
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "content/posts");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
const list = process.argv.includes("--list");

const RE = /https?:\/\/hb\.afl\.rakuten\.co\.jp\/[^\s"'`)<>\]]*/g;
// 4分割IDは「8桁16進×4」(手動発行) と「英数8桁×4」(楽天API affiliateUrl 由来) の2形式がある
const OK_RE = /^https:\/\/hb\.afl\.rakuten\.co\.jp\/hgc\/([0-9a-z]{8}\.[0-9a-z]{8}\.[0-9a-z]{8}\.[0-9a-z]{8})\/\?pc=([^&]+)(?:&(.*))?$/;

const stat = { files: files.length, total: 0, withRafcid: 0, withM: 0, pcOnly: 0, broken: 0 };
const affIds = new Map();
const rafcidValues = new Map();
const extraKeys = new Map();
const perFile = new Map();
const brokenList = [];

for (const f of files) {
  const text = fs.readFileSync(path.join(dir, f), "utf8");
  const links = text.match(RE) || [];
  perFile.set(f, links.length);
  for (const url of links) {
    stat.total++;
    const m = url.match(OK_RE);
    if (!m) {
      stat.broken++;
      brokenList.push({ f, url: url.slice(0, 160) });
      continue;
    }
    affIds.set(m[1], (affIds.get(m[1]) || 0) + 1);
    const rest = m[3] || "";
    const params = new URLSearchParams(rest);
    const hasRaf = params.has("rafcid");
    const hasM = params.has("m");
    if (hasRaf) {
      stat.withRafcid++;
      const v = params.get("rafcid");
      rafcidValues.set(v, (rafcidValues.get(v) || 0) + 1);
    }
    if (hasM) stat.withM++;
    if (!hasRaf && !hasM && rest === "") stat.pcOnly++;
    for (const k of params.keys()) {
      if (k !== "rafcid" && k !== "m") extraKeys.set(k, (extraKeys.get(k) || 0) + 1);
    }
  }
}

console.log(JSON.stringify(stat, null, 2));
console.log("affiliate ids:", Object.fromEntries(affIds));
console.log("rafcid values:", Object.fromEntries(rafcidValues));
console.log("extra param keys (non rafcid/m):", Object.fromEntries(extraKeys));
console.log("files containing hb.afl links:", [...perFile.values()].filter((n) => n > 0).length);
if (brokenList.length) {
  console.log("--- broken ---");
  for (const b of brokenList) console.log(`${b.f}\t${b.url}`);
}
if (list) {
  console.log("--- per file ---");
  for (const [f, n] of [...perFile.entries()].sort((a, b) => b[1] - a[1])) console.log(`${n}\t${f}`);
}
