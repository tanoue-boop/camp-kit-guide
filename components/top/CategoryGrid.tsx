import Link from "next/link";
import type { Category } from "../../types/category";
import styles from "./CategoryGrid.module.css";

type CategoryGridProps = {
  categories: Category[];
};

export default function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>カテゴリから探す</h2>
      <div className={styles.grid}>
        {categories.map((cat) => (
          <Link key={cat.slug} href={`/category/${cat.slug}`} className={styles.card}>
            {/* Background: thumbnail image or green gradient */}
            {cat.latestThumbnail ? (
              <div
                className={styles.bg}
                style={{ backgroundImage: `url(${cat.latestThumbnail})` }}
              />
            ) : (
              <div className={styles.bgGradient} />
            )}
            <div className={styles.overlay} />
            <div className={styles.content}>
              {cat.icon && <span className={styles.icon}>{cat.icon}</span>}
              <p className={styles.name}>{cat.name}</p>
              <p className={styles.desc}>{cat.description}</p>
              {cat.postCount !== undefined && (
                <span className={styles.count}>{cat.postCount}記事</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
