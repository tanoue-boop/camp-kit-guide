import Link from "next/link";
import type { Post } from "../../types/post";
import styles from "./RankingWidget.module.css";

type RankingWidgetProps = {
  posts: Post[];
};

export default function RankingWidget({ posts }: RankingWidgetProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>人気記事ランキング</h2>
        <Link href="/ranking" className={styles.more}>すべて見る →</Link>
      </div>
      <p className={styles.sectionLabel}>Ranking</p>
      <ol className={styles.list}>
        {posts.slice(0, 5).map((post, i) => (
          <li key={post.slug} className={styles.item}>
            <span className={`${styles.rank} ${i < 3 ? styles.rankTop : styles.rankDefault}`}>
              {i + 1}
            </span>
            <Link href={`/posts/${post.slug}`} className={styles.link}>
              <p className={styles.title}>{post.title}</p>
              <p className={styles.category}>{post.category}</p>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
