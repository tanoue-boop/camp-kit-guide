import Link from "next/link";
import type { Post } from "../../types/post";
import styles from "./RecommendedPosts.module.css";

type RecommendedPostsProps = {
  posts: Post[];
  title?: string;
};

export default function RecommendedPosts({ posts, title = "関連記事" }: RecommendedPostsProps) {
  if (posts.length === 0) return null;
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{title}</h2>
      <div className={styles.grid}>
        {posts.map((post) => (
          <Link key={post.slug} href={`/posts/${post.slug}`} className={styles.card}>
            <p className={styles.category}>{post.category}</p>
            <p className={styles.title}>{post.title}</p>
            <p className={styles.description}>{post.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
