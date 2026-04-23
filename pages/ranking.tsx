import type { GetStaticProps } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import Seo from "../components/common/Seo";
import Breadcrumb from "../components/common/Breadcrumb";
import type { Post } from "../types/post";
import styles from "./ranking.module.css";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

const CATEGORY_MAP: Record<string, { name: string; icon: string }> = {
  tent:         { name: "テント",       icon: "⛺" },
  "sleeping-bag": { name: "寝袋・シュラフ", icon: "🛏️" },
  cookware:     { name: "調理器具",     icon: "🍳" },
  "chair-table": { name: "チェア・テーブル", icon: "🪑" },
  lighting:     { name: "照明・ランタン", icon: "🔦" },
  clothing:     { name: "ウェア・装備", icon: "🧥" },
  bonfire:      { name: "焚き火台",     icon: "🔥" },
  backpack:     { name: "バックパック", icon: "🎒" },
};

const MEDAL: Record<number, { emoji: string; label: string; mod: string }> = {
  1: { emoji: "🥇", label: "1位", mod: styles.gold },
  2: { emoji: "🥈", label: "2位", mod: styles.silver },
  3: { emoji: "🥉", label: "3位", mod: styles.bronze },
};

type RankingPageProps = {
  posts: Post[];
  updatedAt: string;
};

export default function RankingPage({ posts, updatedAt }: RankingPageProps) {
  return (
    <>
      <Seo
        title="人気記事ランキング"
        description="CampKit Guideで読まれている記事のランキングです。テント・寝袋・バーナーなどキャンプ用品のおすすめ記事を人気順に掲載。"
        canonical="/ranking"
      />
      <div className={styles.container}>
        <Breadcrumb items={[{ label: "人気記事ランキング" }]} />

        {/* Page header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            <span className={styles.pageTitleIcon}>🏆</span>
            人気記事ランキング
          </h1>
          <div className={styles.pageMeta}>
            <span className={styles.metaBadge}>全{posts.length}記事</span>
            <span className={styles.metaSep}>｜</span>
            <span className={styles.metaDate}>最終更新：{updatedAt}</span>
          </div>
          <p className={styles.pageDesc}>
            キャンプ用品の選び方・おすすめ比較記事を、公開日の新しい順にランキング形式でご紹介します。
            テント・寝袋・バーナーなど、人気アイテムの最新情報をチェックしてください。
          </p>
        </div>

        {posts.length === 0 ? (
          <p className={styles.empty}>記事を準備中です。</p>
        ) : (
          <ol className={styles.list}>
            {posts.map((post, i) => {
              const rank = i + 1;
              const medal = MEDAL[rank];
              const cat = CATEGORY_MAP[post.category] ?? { name: post.category, icon: "📄" };
              const isTop3 = rank <= 3;

              return (
                <li key={post.slug} className={`${styles.card} ${medal ? medal.mod : styles.normal} ${isTop3 ? styles.top3 : ""}`}>
                  {/* Rank badge */}
                  <div className={`${styles.rankBadge} ${medal ? medal.mod : styles.normal}`}>
                    {medal ? (
                      <>
                        <span className={styles.rankEmoji}>{medal.emoji}</span>
                        <span className={styles.rankLabel}>{medal.label}</span>
                      </>
                    ) : (
                      <span className={styles.rankNum}>{rank}</span>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className={`${styles.thumb} ${medal ? medal.mod : ""}`}>
                    {post.thumbnail ? (
                      <img src={post.thumbnail} alt={post.title} className={styles.thumbImg} loading="lazy" decoding="async" />
                    ) : (
                      <div className={styles.thumbPlaceholder}>
                        <svg className={styles.thumbPlaceholderIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span className={styles.thumbPlaceholderText}>画像準備中</span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className={styles.body}>
                    <div className={styles.bodyTop}>
                      <span className={styles.catBadge}>
                        {cat.icon} {cat.name}
                      </span>
                      <span className={styles.date}>{post.date}</span>
                    </div>
                    <h2 className={styles.title}>{post.title}</h2>
                    <p className={styles.desc}>{post.description}</p>
                    <Link href={`/posts/${post.slug}`} className={`${styles.btn} ${medal ? medal.mod : styles.normal}`}>
                      詳細を見る →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps<RankingPageProps> = async () => {
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
  }
  posts.sort((a, b) => b.date.localeCompare(a.date));

  const now = new Date();
  const updatedAt = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

  return { props: { posts, updatedAt } };
};
