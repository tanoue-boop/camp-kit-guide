import Seo from "../components/common/Seo";
import CategoryGrid from "../components/top/CategoryGrid";
import RankingWidget from "../components/top/RankingWidget";
import type { Category } from "../types/category";
import type { Post } from "../types/post";
import styles from "./index.module.css";

const categories: Category[] = [
  { slug: "tent", name: "テント", description: "ソロ・ファミリー・ツーリング向けテントの選び方", icon: "⛺", postCount: 0 },
  { slug: "sleeping-bag", name: "寝袋・シュラフ", description: "季節別おすすめ寝袋と温度対応の基本", icon: "🛏️", postCount: 0 },
  { slug: "cookware", name: "調理器具", description: "バーナー・クッカー・焚き火台など", icon: "🍳", postCount: 0 },
  { slug: "chair-table", name: "チェア・テーブル", description: "軽量・コンパクトなアウトドア家具の選び方", icon: "🪑", postCount: 0 },
  { slug: "lighting", name: "照明・ランタン", description: "LEDランタン・ヘッドライトのおすすめ", icon: "🔦", postCount: 0 },
  { slug: "clothing", name: "ウェア・装備", description: "レインウェア・防寒着・シューズなど", icon: "🧥", postCount: 0 },
];

const samplePosts: Post[] = [];

export default function HomePage() {
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
              {samplePosts.length === 0 ? (
                <p className={styles.empty}>記事を準備中です。もうしばらくお待ちください。</p>
              ) : null}
            </section>
          </div>
          <aside className={styles.sideCol}>
            {samplePosts.length > 0 && <RankingWidget posts={samplePosts} />}
          </aside>
        </div>
      </div>
    </>
  );
}
