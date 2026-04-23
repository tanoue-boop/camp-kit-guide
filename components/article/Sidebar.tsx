import Link from "next/link";
import type { Post } from "../../types/post";
import type { Category } from "../../types/category";
import styles from "./Sidebar.module.css";

type SidebarProps = {
  popularPosts: Post[];
  recentPosts: Post[];
  categories: Category[];
};

function PostThumb({ post, catName }: { post: Post; catName: string }) {
  return (
    <div className={styles.thumb}>
      {post.thumbnail ? (
        <img src={post.thumbnail} alt={post.title} className={styles.thumbImg} loading="lazy" decoding="async" />
      ) : (
        <div className={styles.thumbPlaceholder}>
          <span className={styles.thumbCat}>{catName}</span>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ popularPosts, recentPosts, categories }: SidebarProps) {
  const catNameMap: Record<string, string> = Object.fromEntries(
    categories.map((c) => [c.slug, c.name])
  );

  return (
    <aside className={styles.sidebar}>
      {/* Popular posts */}
      {popularPosts.length > 0 && (
        <div className={styles.widget}>
          <p className={styles.widgetTitle}>
            <svg className={styles.widgetIcon} viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            人気記事 TOP5
          </p>
          <ol className={styles.rankList}>
            {popularPosts.map((post, i) => (
              <li key={post.slug} className={styles.rankItem}>
                <span className={`${styles.rankNum} ${i === 0 ? styles.rank1 : i === 1 ? styles.rank2 : i === 2 ? styles.rank3 : ""}`}>{i + 1}</span>
                <Link href={`/posts/${post.slug}`} className={styles.rankCard}>
                  <PostThumb post={post} catName={catNameMap[post.category] ?? post.category} />
                  <div className={styles.rankInfo}>
                    <p className={styles.rankCat}>{catNameMap[post.category] ?? post.category}</p>
                    <p className={styles.rankTitle}>{post.title}</p>
                    <p className={styles.rankViews}>
                      <svg className={styles.eyeIcon} viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      {post.views ? post.views.toLocaleString() : "—"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Category list */}
      <div className={styles.widget}>
        <p className={styles.widgetTitle}>
          <svg className={styles.widgetIcon} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />
            <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
          </svg>
          カテゴリ
        </p>
        <ul className={styles.catList}>
          {categories.map((cat) => (
            <li key={cat.slug}>
              <Link href={`/category/${cat.slug}`} className={styles.catLink}>
                {cat.icon && <span className={styles.catIcon}>{cat.icon}</span>}
                <span className={styles.catName}>{cat.name}</span>
                {cat.postCount !== undefined && (
                  <span className={styles.catCount}>{cat.postCount}件</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Recent posts */}
      {recentPosts.length > 0 && (
        <div className={styles.widget}>
          <p className={styles.widgetTitle}>
            <svg className={styles.widgetIcon} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            新着記事
          </p>
          <ul className={styles.recentList}>
            {recentPosts.map((post) => (
              <li key={post.slug}>
                <Link href={`/posts/${post.slug}`} className={styles.recentCard}>
                  <PostThumb post={post} catName={catNameMap[post.category] ?? post.category} />
                  <div className={styles.recentInfo}>
                    <p className={styles.recentTitle}>{post.title}</p>
                    <p className={styles.recentDate}>{post.date}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
