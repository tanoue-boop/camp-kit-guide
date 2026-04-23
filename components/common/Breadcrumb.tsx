import Link from "next/link";
import JsonLd from "../seo/JsonLd";
import styles from "./Breadcrumb.module.css";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

const BASE_URL = "https://www.camp-kit-guide.com";

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const allItems = [{ label: "ホーム", href: "/" }, ...items];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: allItems.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${BASE_URL}${item.href}` } : {}),
    })),
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
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
    </>
  );
}
