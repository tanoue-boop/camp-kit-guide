import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import Seo from "../../components/common/Seo";
import Breadcrumb from "../../components/common/Breadcrumb";
import type { Category } from "../../types/category";
import type { Post } from "../../types/post";
import styles from "./category.module.css";

const allCategories: Category[] = [
  { slug: "tent", name: "テント", description: "ソロ・ファミリー・ツーリング向けテントの選び方とおすすめ" },
  { slug: "sleeping-bag", name: "寝袋・シュラフ", description: "季節別おすすめ寝袋と温度対応の基本" },
  { slug: "cookware", name: "調理器具", description: "バーナー・クッカー・焚き火台など" },
  { slug: "chair-table", name: "チェア・テーブル", description: "軽量・コンパクトなアウトドア家具の選び方" },
  { slug: "lighting", name: "照明・ランタン", description: "LEDランタン・ヘッドライトのおすすめ" },
  { slug: "clothing", name: "ウェア・装備", description: "レインウェア・防寒着・シューズなど" },
];

type CategoryPageProps = {
  category: Category;
  posts: Post[];
};

export default function CategoryPage({ category, posts }: CategoryPageProps) {
  return (
    <>
      <Seo
        title={`${category.name}のおすすめ記事一覧`}
        description={`${category.description}。キャンプ用品の選び方・比較記事をまとめています。`}
        canonical={`/category/${category.slug}`}
      />
      <div className={styles.container}>
        <Breadcrumb items={[{ label: category.name }]} />
        <h1 className={styles.title}>{category.name}</h1>
        <p className={styles.desc}>{category.description}</p>

        {posts.length === 0 ? (
          <p className={styles.empty}>このカテゴリの記事は準備中です。</p>
        ) : (
          <div className={styles.grid}>
            {posts.map((post) => (
              <Link key={post.slug} href={`/posts/${post.slug}`} className={styles.card}>
                <p className={styles.postTitle}>{post.title}</p>
                <p className={styles.postDesc}>{post.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: allCategories.map((c) => ({ params: { slug: c.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<CategoryPageProps> = async ({ params }) => {
  const slug = params?.slug as string;
  const category = allCategories.find((c) => c.slug === slug);
  if (!category) return { notFound: true };

  // 記事が増えたらここでMDXから絞り込む
  const posts: Post[] = [];

  return { props: { category, posts } };
};
