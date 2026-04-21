import Link from "next/link";
import type { Post } from "../../types/post";
import type { Category } from "../../types/category";
import type { Heading } from "./TableOfContents";
import TableOfContents from "./TableOfContents";
import styles from "./Sidebar.module.css";

type SidebarProps = {
  headings: Heading[];
  relatedPosts: Post[];
  recentPosts: Post[];
  categories: Category[];
};

export default function Sidebar({ headings, relatedPosts, recentPosts, categories }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      {/* TOC */}
      {headings.length > 0 && <TableOfContents headings={headings} />}

      {/* Related posts in same category */}
      {relatedPosts.length > 0 && (
        <div className={styles.widget}>
          <p className={styles.widgetTitle}>同カテゴリの記事</p>
          <ul className={styles.postList}>
            {relatedPosts.map((post) => (
              <li key={post.slug}>
                <Link href={`/posts/${post.slug}`} className={styles.postLink}>
                  <div className={styles.postThumb}>
                    {post.thumbnail ? (
                      <img src={post.thumbnail} alt={post.title} className={styles.thumbImg} />
                    ) : (
                      <div className={styles.thumbPlaceholder} />
                    )}
                  </div>
                  <span className={styles.postLinkTitle}>{post.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent/Popular posts */}
      {recentPosts.length > 0 && (
        <div className={styles.widget}>
          <p className={styles.widgetTitle}>人気記事 TOP5</p>
          <ol className={styles.rankList}>
            {recentPosts.map((post, i) => (
              <li key={post.slug} className={styles.rankItem}>
                <span className={styles.rankNum}>{i + 1}</span>
                <Link href={`/posts/${post.slug}`} className={styles.rankLink}>{post.title}</Link>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Category list */}
      <div className={styles.widget}>
        <p className={styles.widgetTitle}>カテゴリ一覧</p>
        <ul className={styles.catList}>
          {categories.map((cat) => (
            <li key={cat.slug}>
              <Link href={`/category/${cat.slug}`} className={styles.catLink}>
                {cat.icon && <span className={styles.catIcon}>{cat.icon}</span>}
                <span>{cat.name}</span>
                {cat.postCount !== undefined && (
                  <span className={styles.catCount}>{cat.postCount}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
