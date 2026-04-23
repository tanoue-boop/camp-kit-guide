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
      <p className={styles.sectionLabel}>Category</p>
      <div className={styles.grid}>
        {categories.map((cat) => (
          <Link key={cat.slug} href={`/category/${cat.slug}`} className={styles.card}>
            {cat.icon && (
              <img src={cat.icon} alt="" width={44} height={44} className={styles.icon} loading="lazy" decoding="async" />
            )}
            <p className={styles.name}>{cat.name}</p>
            <p className={styles.desc}>{cat.description}</p>
            {cat.postCount !== undefined && (
              <span className={styles.count}>{cat.postCount}記事</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
