import type { NextConfig } from "next";

// 寝袋（シュラフ）選び方カニバリ解消（2026-07-24）
// 温度・季節・3シーズンで分散していた3記事を
// /posts/sleeping-bag-temperature-guide のピラーへ統合し恒久リダイレクト
const SLEEPING_BAG_PILLAR = "/posts/sleeping-bag-temperature-guide";
const MERGED_INTO_PILLAR = [
  "/posts/camp-sleeping-bag-temperature-guide",
  "/posts/sleeping-bag-season-guide",
  "/posts/sleeping-bag-temp-guide",
];

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  async redirects() {
    return MERGED_INTO_PILLAR.map((source) => ({
      source,
      destination: SLEEPING_BAG_PILLAR,
      permanent: true,
    }));
  },
};

export default nextConfig;
