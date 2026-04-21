import Seo from "../components/common/Seo";
import Breadcrumb from "../components/common/Breadcrumb";
import type { Post } from "../types/post";
import Link from "next/link";
import styles from "./ranking.module.css";

const posts: Post[] = [];

export default function RankingPage() {
  return (
    <>
      <Seo
        title="人気記事ランキング"
        description="CampKit Guideで読まれている記事のランキングです。テント・寝袋・バーナーなどキャンプ用品のおすすめ記事を人気順に掲載。"
        canonical="/ranking"
      />
      <div className={styles.container}>
        <Breadcrumb items={[{ label: "人気記事ランキング" }]} />
        <h1 className={styles.title}>人気記事ランキング</h1>
        {posts.length === 0 ? (
          <p className={styles.empty}>記事を準備中です。</p>
        ) : (
          <ol className={styles.list}>
            {posts.map((post, i) => (
              <li key={post.slug} className={styles.item}>
                <span className={styles.rank}>{i + 1}</span>
                <Link href={`/posts/${post.slug}`} className={styles.link}>
                  <p className={styles.postTitle}>{post.title}</p>
                  <p className={styles.postDesc}>{post.description}</p>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
