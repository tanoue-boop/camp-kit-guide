import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Seo from "../../components/common/Seo";
import Breadcrumb from "../../components/common/Breadcrumb";
import type { Category } from "../../types/category";
import type { Post } from "../../types/post";
import styles from "./category.module.css";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

const allCategories: Category[] = [
  { slug: "tent", name: "テント", description: "ソロ・ファミリー・ツーリング向けテントの選び方とおすすめ" },
  { slug: "sleeping-bag", name: "寝袋・シュラフ", description: "季節別おすすめ寝袋と温度対応の基本" },
  { slug: "cookware", name: "調理器具", description: "バーナー・クッカー・焚き火台など" },
  { slug: "chair-table", name: "チェア・テーブル", description: "軽量・コンパクトなアウトドア家具の選び方" },
  { slug: "lighting", name: "照明・ランタン", description: "LEDランタン・ヘッドライトのおすすめ" },
  { slug: "clothing", name: "ウェア・装備", description: "レインウェア・防寒着・シューズなど" },
  { slug: "bonfire", name: "焚き火台", description: "初心者向けから本格派まで焚き火台の選び方" },
];

function readPostsByCategory(categorySlug: string): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .reduce<Post[]>((acc, file) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
      const { data } = matter(raw);
      if (data.category === categorySlug) {
        acc.push({
          slug: file.replace(".mdx", ""),
          title: data.title ?? "",
          description: data.description ?? "",
          date: data.date ?? "",
          category: data.category,
          tags: data.tags ?? [],
          ...(data.thumbnail ? { thumbnail: data.thumbnail } : {}),
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.date.localeCompare(a.date));
}

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
                <div className={styles.cardThumb}>
                  {post.thumbnail ? (
                    <img src={post.thumbnail} alt={post.title} className={styles.cardThumbImg} />
                  ) : (
                    <div className={styles.cardThumbPlaceholder}>
                      <span className={styles.cardThumbCatLabel}>{category.name}</span>
                    </div>
                  )}
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.postTitle}>{post.title}</p>
                  <p className={styles.postDesc}>{post.description}</p>
                </div>
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

  const posts = readPostsByCategory(slug);

  return { props: { category, posts } };
};
