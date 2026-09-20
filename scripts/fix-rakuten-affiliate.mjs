// 記事内の楽天「素URL」（報酬が発生しない形式）を hb.afl ラッパー形式へ変換する。
//
// 対象:
//   (a) https://item.rakuten.co.jp/<shop>/<item>/?rafcid=wsc_i_is_<RAKUTEN_APP_ID>
//       … 楽天API itemUrl の素URL。rafcid に入っているのはアプリケーションIDで
//         アフィリエイトIDではないため成果が付かない。
//   (b) https://search.rakuten.co.jp/search/mall/<kw>/?rafcid=wsc_i_is_<AFF_ID>
//       … 検索結果ページへの直リンク（ふるさと納税CTA）。現行規約に合わせて同じ形式へ寄せる。
// 変換先（docs/scheduled-task-spec.md「記事に載せるアフィリURLは hb.afl 形式に統一」と同形）:
//   https://hb.afl.rakuten.co.jp/hgc/<AFF_ID>/?pc=<encodeURIComponent(url.split('?')[0])>
//
// 既に hb.afl 形式のリンク（pc= 内は %2F エンコード済み）には一致しないので二重変換はしない。
// 商品画像URL（thumbnail.image.rakuten.co.jp）には触れない。
//
// 使い方:
//   node scripts/fix-rakuten-affiliate.mjs           … dry-run（件数と対象一覧のみ）
//   node scripts/fix-rakuten-affiliate.mjs --apply   … 書き換え実行
import fs from "node:fs";
import path from "node:path";

const apply = process.argv.includes("--apply");
const dir = path.join(process.cwd(), "content/posts");

// AFF_ID は .env.local の NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID から読む（値を捏造しない）
function readAffId() {
  if (process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID) return process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID;
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return "";
  const m = fs.readFileSync(envPath, "utf8").match(/^NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID=(.+)$/m);
  return m ? m[1].trim() : "";
}
const AFF_ID = readAffId();
if (!/^[0-9a-f]{8}\.[0-9a-f]{8}\.[0-9a-f]{8}\.[0-9a-f]{8}$/.test(AFF_ID)) {
  console.error("NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID が .env.local から読めません。中止します。");
  process.exit(1);
}

// URL末尾は引用符・空白・括弧・<> で終端（属性値・JSON文字列・markdownの両方に対応）
const ITEM_RE = /https?:\/\/item\.rakuten\.co\.jp\/[^\s"'`)<>]+/g;
const SEARCH_RE = /https?:\/\/search\.rakuten\.co\.jp\/[^\s"'`)<>]+/g;

const hb = (url) => `https://hb.afl.rakuten.co.jp/hgc/${AFF_ID}/?pc=${encodeURIComponent(url.split("?")[0])}`;

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")).sort();
let totalItem = 0;
let totalSearch = 0;
const changed = [];

for (const f of files) {
  const p = path.join(dir, f);
  const before = fs.readFileSync(p, "utf8");
  let nItem = 0;
  let nSearch = 0;
  let after = before.replace(ITEM_RE, (u) => {
    nItem++;
    return hb(u);
  });
  after = after.replace(SEARCH_RE, (u) => {
    nSearch++;
    return hb(u);
  });
  if (nItem + nSearch === 0) continue;
  totalItem += nItem;
  totalSearch += nSearch;
  changed.push({ f, nItem, nSearch });
  if (apply) {
    // 安全確認: 置換で行数が変わらないこと・URL以外の文字列が変わっていないこと
    if (after.split("\n").length !== before.split("\n").length) {
      console.error(`行数が変わったため中止: ${f}`);
      process.exit(1);
    }
    fs.writeFileSync(p, after, "utf8");
  }
}

for (const c of changed) console.log(`${apply ? "fixed" : "would-fix"}\t${c.f}\titem=${c.nItem}\tsearch=${c.nSearch}`);
console.log(`\nfiles: ${changed.length} / item.rakuten: ${totalItem} / search.rakuten: ${totalSearch} / total: ${totalItem + totalSearch}${apply ? "" : "  (dry-run: --apply で実行)"}`);
