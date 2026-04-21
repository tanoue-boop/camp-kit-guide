import Link from "next/link";
import styles from "./Breadcrumb.module.css";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className={styles.breadcrumb} aria-label="パンくずリスト">
      <ol className={styles.list}>
        <li className={styles.item}>
          <Link href="/" className={styles.link}>ホーム</Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className={styles.item}>
            <span className={styles.sep}>›</span>
            {item.href ? (
              <Link href={item.href} className={styles.link}>{item.label}</Link>
            ) : (
              <span className={styles.current}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
