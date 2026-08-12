// Amazon アソシエイトリンクのヘルパー
// タグID は .env.local の NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG で設定
// アソシエイトタグ（公開ストアID）。
// env が未設定/プレースホルダでも本番で必ず成果が計上されるよう、実タグをフォールバック既定値に固定。
// 将来タグを変えたい場合は env に実値を入れれば env が優先される。
const ENV_TAG = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG;
const ASSOCIATE_TAG =
  ENV_TAG && ENV_TAG !== "your-associate-tag-22" ? ENV_TAG : "campkit26-22";

export function buildAmazonUrl(asin: string): string {
  return `https://www.amazon.co.jp/dp/${asin}?tag=${ASSOCIATE_TAG}`;
}

export function buildAmazonSearchUrl(keyword: string): string {
  const base = `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}`;
  if (!ASSOCIATE_TAG) return base;
  return `${base}&tag=${ASSOCIATE_TAG}`;
}
