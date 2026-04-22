import Link from "next/link";
import { Battery } from "lucide-react";
import type { Category } from "../../types/category";
import styles from "./CategoryGrid.module.css";

type CategoryGridProps = {
  categories: Category[];
};

function CategoryIcon({ icon }: { icon?: string | null }) {
  if (!icon) return <Battery size={44} className={styles.icon} />;
  return <img src={icon} alt="" width={44} height={44} className={styles.icon} />;
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>カテゴリから探す</h2>
      <p className={styles.sectionLabel}>Category</p>
      <div className={styles.grid}>
        {categories.map((cat) => (
          <Link key={cat.slug} href={`/category/${cat.slug}`} className={styles.card}>
            <CategoryIcon icon={cat.icon} />
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
