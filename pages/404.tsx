import type { GetStaticProps } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import Seo from "../components/common/Seo";
import Sidebar from "../components/article/Sidebar";
import type { Post } from "../types/post";
import type { Category } from "../types/category";
import styles from "./404.module.css";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

const ALL_CATEGORIES: Category[] = [
  { slug: "tent",         name: "テント",           description: "", icon: "⛺" },
  { slug: "sleeping-bag", name: "寝袋・シュラフ",   description: "", icon: "🛏️" },
  { slug: "cookware",     name: "調理器具",         description: "", icon: "🍳" },
  { slug: "chair-table",  name: "チェア・テーブル", description: "", icon: "🪑" },
  { slug: "lighting",     name: "照明・ランタン",   description: "", icon: "🔦" },
  { slug: "clothing",     name: "ウェア・装備",     description: "", icon: "🧥" },
  { slug: "bonfire",      name: "焚き火台",         description: "", icon: "🔥" },
  { slug: "backpack",     name: "バックパック",     description: "", icon: "🎒" },
  { slug: "power",        name: "電源・バッテリー", description: "", icon: "🔋" },
];

type NotFoundPageProps = {
  popularPosts: Post[];
  categories: Category[];
};

export default function NotFoundPage({ popularPosts, categories }: NotFoundPageProps) {
  return (
    <>
      <Seo
        title="ページが見つかりません"
        description="お探しのページは削除されたか、URLが変更された可能性があります。"
        noindex
      />

      <div className={styles.container}>
        <div className={styles.main}>
          <div className={styles.hero}>
            <p className={styles.code}>404</p>
            <h1 className={styles.title}>ページが見つかりません</h1>
            <p className={styles.subtitle}>
              お探しのページは削除されたか、URLが変更された可能性があります。
            </p>

            <div className={styles.actions}>
              <Link href="/" className={styles.btnPrimary}>
                トップページへ戻る
              </Link>
              <Link href="/ranking" className={styles.btnSecondary}>
                人気記事を見る
              </Link>
            </div>
          </div>

          <div className={styles.categories}>
            <p className={styles.categoriesTitle}>カテゴリから探す</p>
            <ul className={styles.categoryList}>
              {ALL_CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/category/${cat.slug}`} className={styles.categoryLink}>
                    <span className={styles.categoryIcon}>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.sidebar}>
          <Sidebar
            popularPosts={popularPosts}
            recentPosts={popularPosts}
            categories={categories}
          />
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps<NotFoundPageProps> = async () => {
  const posts: Post[] = [];

  if (fs.existsSync(POSTS_DIR)) {
    const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx"));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
      const { data } = matter(raw);
      posts.push({
        slug: file.replace(".mdx", ""),
        title: data.title ?? "",
        description: data.description ?? "",
        date: data.date ?? "",
        category: data.category ?? "",
        tags: data.tags ?? [],
        ...(data.thumbnail ? { thumbnail: data.thumbnail } : {}),
      });
    }
    posts.sort((a, b) => b.date.localeCompare(a.date));
  }

  const countByCategory: Record<string, number> = {};
  posts.forEach((p) => {
    countByCategory[p.category] = (countByCategory[p.category] || 0) + 1;
  });

  const categories: Category[] = ALL_CATEGORIES.map((c) => ({
    ...c,
    postCount: countByCategory[c.slug] || 0,
  }));

  return {
    props: {
      popularPosts: posts.slice(0, 5),
      categories,
    },
  };
};
