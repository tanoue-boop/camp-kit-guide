export type Product = {
  id: string;
  name: string;
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
