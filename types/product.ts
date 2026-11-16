export type Product = {
  id: string;
  name: string;
  /**
   * メーカー・ブランド名。Product の JSON-LD に brand として出す。
   * name の先頭から推測はしない（誤ったブランドを構造化データに出さないため）ので、
   * MDX の ProductCardMdx に brand="…" を明示した場合だけ入る。
   */
  brand?: string;
  description: string;
  price: number;
  rating?: number;
  reviewCount?: number;
  amazonRating?: number;
  amazonReviewCount?: number;
  rakutenRating?: number;
  rakutenReviewCount?: number;
  affiliateUrl: string;
  amazonUrl?: string;
  amazonAsin?: string;
  source: "amazon" | "rakuten" | "other";
  image?: string;
  badge?: string;
  /**
   * メーカー公式ストアへのアフィリエイトリンク（A8.net の px.a8.net など・campkit-20261116-C06）。
   * あるときだけ楽天・Amazon ボタンの下に3つ目のボタンを出す。楽天・Amazon のリンクの代わりにはしない。
   */
  officialUrl?: string;
  /** 公式ストアボタンの文言（既定「公式ストアで見る」） */
  officialLabel?: string;
  /** A8 の計測用画像（0.gif）。あれば 1×1 の img で出す */
  officialPixel?: string;
};
