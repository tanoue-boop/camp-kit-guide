// Amazon アソシエイトリンクのヘルパー
// タグID は .env.local の NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG で設定
const ASSOCIATE_TAG = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG ?? "";

export function buildAmazonUrl(asin: string): string {
  return `https://www.amazon.co.jp/dp/${asin}?tag=${ASSOCIATE_TAG}`;
}

export function buildAmazonSearchUrl(keyword: string): string {
  const base = `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}`;
  if (!ASSOCIATE_TAG) return base;
  return `${base}&tag=${ASSOCIATE_TAG}`;
}
