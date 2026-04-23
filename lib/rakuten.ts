// 楽天アフィリエイトリンクのヘルパー
// アフィリエイトIDは .env.local の NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID で設定
const AFFILIATE_ID = process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID ?? "";

export function buildRakutenUrl(itemUrl: string): string {
  if (!AFFILIATE_ID) return itemUrl;
  return `https://hb.afl.rakuten.co.jp/hgc/${AFFILIATE_ID}/?pc=${encodeURIComponent(itemUrl)}`;
}

export function buildRakutenSearchUrl(keyword: string): string {
  const base = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(keyword)}/`;
  if (!AFFILIATE_ID) return base;
  return `${base}?rafcid=wsc_i_is_${AFFILIATE_ID}`;
}
