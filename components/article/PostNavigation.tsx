import Link from "next/link";
import type { Post } from "../../types/post";
import styles from "./PostNavigation.module.css";

type PostNavigationProps = {
  prevPost: Post | null;
  nextPost: Post | null;
};

export default function PostNavigation({ prevPost, nextPost }: PostNavigationProps) {
  if (!prevPost && !nextPost) return null;

  return (
    <nav className={styles.nav}>
      <div className={styles.side}>
        {prevPost ? (
          <Link href={`/posts/${prevPost.slug}`} className={`${styles.link} ${styles.prev}`}>
            <span className={styles.dir}>← 前の記事</span>
            <span className={styles.postTitle}>{prevPost.title}</span>
          </Link>
        ) : <div />}
      </div>
      <div className={styles.side}>
        {nextPost ? (
          <Link href={`/posts/${nextPost.slug}`} className={`${styles.link} ${styles.next}`}>
            <span className={styles.dir}>次の記事 →</span>
            <span className={styles.postTitle}>{nextPost.title}</span>
          </Link>
        ) : <div />}
      </div>
    </nav>
  );
}
