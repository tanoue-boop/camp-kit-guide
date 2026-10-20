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
};
