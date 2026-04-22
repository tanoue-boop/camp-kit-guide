import type { GetStaticProps } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import Seo from "../components/common/Seo";
import CategoryGrid from "../components/top/CategoryGrid";
import RankingWidget from "../components/top/RankingWidget";
import type { Category } from "../types/category";
import type { Post } from "../types/post";
import styles from "./index.module.css";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

const baseCategories: Omit<Category, "postCount">[] = [
  { slug: "tent", name: "テント", description: "ソロ・ファミリー・ツーリング向けテントの選び方", icon: "⛺" },
  { slug: "sleeping-bag", name: "寝袋・シュラフ", description: "季節別おすすめ寝袋と温度対応の基本", icon: "🛏️" },
  { slug: "cookware", name: "調理器具", description: "バーナー・クッカー・焚き火台など", icon: "🍳" },
  { slug: "chair-table", name: "チェア・テーブル", description: "軽量・コンパクトなアウトドア家具の選び方", icon: "🪑" },
  { slug: "lighting", name: "照明・ランタン", description: "LEDランタン・ヘッドライトのおすすめ", icon: "🔦" },
  { slug: "clothing", name: "ウェア・装備", description: "レインウェア・防寒着・シューズなど", icon: "🧥" },
  { slug: "bonfire", name: "焚き火台", description: "初心者向けから本格派まで焚き火台の選び方", icon: "🔥" },
  { slug: "backpack", name: "バックパック", description: "容量・用途別のキャンプ用バックパックの選び方", icon: "🎒" },
  { slug: "power", name: "電源・バッテリー", description: "ポータブル電源・モバイルバッテリーの選び方", icon: "🔋" },
];

type HomePageProps = {
  categories: Category[];
  recentPosts: Post[];
};

export default function HomePage({ categories, recentPosts }: HomePageProps) {
  return (
    <>
      <Seo
        title="CampKit Guide｜キャンプ用品の選び方・おすすめ比較"
        description="テント・寝袋・バーナーなどキャンプ用品の選び方をわかりやすく解説。初心者からベテランまで役立つ比較・レビュー記事を掲載。"
        canonical="/"
      />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>🏕️ キャンプ用品ガイド</p>
          <h1 className={styles.heroTitle}>
            キャンプ用品の選び方、<br />
            わかりやすく解説。
          </h1>
          <p className={styles.heroSubtitle}>
            テント・寝袋・バーナーなど、カテゴリ別に厳選したおすすめ商品を比較・紹介しています。
            初めてのキャンプ道具選びにも、買い替えの参考にも。
          </p>
        </div>
      </section>

      <div className={styles.content}>
        <CategoryGrid categories={categories} />

        <div className={styles.twoCol}>
          <div className={styles.mainCol}>
            <section>
              <h2 className={styles.sectionTitle}>新着記事</h2>
              {recentPosts.length === 0 ? (
                <p className={styles.empty}>記事を準備中です。もうしばらくお待ちください。</p>
              ) : (
                <div className={styles.postGrid}>
                  {recentPosts.map((post) => (
                    <Link key={post.slug} href={`/posts/${post.slug}`} className={styles.postCard}>
                      <p className={styles.postCardTitle}>{post.title}</p>
                      <p className={styles.postCardDesc}>{post.description}</p>
                      <span className={styles.postCardDate}>{post.date}</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
          <aside className={styles.sideCol}>
            {recentPosts.length > 0 && <RankingWidget posts={recentPosts} />}
          </aside>
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  const countByCategory: Record<string, number> = {};
  const thumbnailByCategory: Record<string, string> = {};
  const allPosts: Post[] = [];

  if (fs.existsSync(POSTS_DIR)) {
    const files = fs
      .readdirSync(POSTS_DIR)
      .filter((f) => f.endsWith(".mdx"))
      .sort()
      .reverse();
    for (const file of files) {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
      const { data } = matter(raw);
      const cat = data.category ?? "";
      if (cat) {
        countByCategory[cat] = (countByCategory[cat] || 0) + 1;
        if (data.thumbnail && !thumbnailByCategory[cat]) {
          thumbnailByCategory[cat] = data.thumbnail;
        }
      }
      allPosts.push({
        slug: file.replace(".mdx", ""),
        title: data.title ?? "",
        description: data.description ?? "",
        date: data.date ?? "",
        category: cat,
        tags: data.tags ?? [],
        ...(data.thumbnail ? { thumbnail: data.thumbnail } : {}),
      });
    }
  }

  const categories: Category[] = baseCategories.map((c) => ({
    ...c,
    postCount: countByCategory[c.slug] || 0,
    ...(thumbnailByCategory[c.slug] ? { latestThumbnail: thumbnailByCategory[c.slug] } : {}),
  }));

  const recentPosts = allPosts
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return { props: { categories, recentPosts } };
};
