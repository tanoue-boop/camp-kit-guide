export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  reviewCount: number;
  affiliateUrl: string;
  source: "amazon" | "rakuten" | "other";
  image?: string;
  badge?: string;
};
