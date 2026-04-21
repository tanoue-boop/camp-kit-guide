import type { Product } from "../../types/product";
import styles from "./ComparisonTable.module.css";

type Column = {
  key: keyof Product | string;
  label: string;
};

type ComparisonTableProps = {
  products?: Product[];
  columns?: Column[];
};

const defaultColumns: Column[] = [
  { key: "name", label: "商品名" },
  { key: "price", label: "価格" },
  { key: "rating", label: "評価" },
  { key: "source", label: "購入先" },
];

const CHECK_VALUES = new Set(["○", "✓", "◎", "yes", "true", "✔"]);

function renderCell(col: Column, product: Product, isFirst: boolean) {
  const val = (product as Record<string, unknown>)[col.key];
  const strVal = String(val ?? "");

  if (col.key === "price") {
    return (
      <td key={col.key} className={`${styles.td} ${isFirst ? styles.tdFirst : ""}`}>
        <span className={styles.price}>¥{Number(val).toLocaleString()}</span>
      </td>
    );
  }
  if (col.key === "rating") {
    return (
      <td key={col.key} className={`${styles.td} ${isFirst ? styles.tdFirst : ""}`}>
        <span className={styles.rating}>★ {Number(val).toFixed(1)}</span>
      </td>
    );
  }
  if (col.key === "source") {
    return (
      <td key={col.key} className={`${styles.td} ${isFirst ? styles.tdFirst : ""}`}>
        <a href={product.affiliateUrl ?? "#"} target="_blank" rel="noopener noreferrer nofollow" className={styles.link}>
          {product.source === "amazon" ? "Amazon" : "楽天"}
        </a>
      </td>
    );
  }
  if (CHECK_VALUES.has(strVal.trim().toLowerCase())) {
    return (
      <td key={col.key} className={`${styles.td} ${isFirst ? styles.tdFirst : ""}`}>
        <span className={styles.check}>
          <svg viewBox="0 0 16 16" fill="currentColor" className={styles.checkIcon}>
            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
          </svg>
          {strVal}
        </span>
      </td>
    );
  }
  return (
    <td key={col.key} className={`${styles.td} ${isFirst ? styles.tdFirst : ""}`}>
      {strVal}
    </td>
  );
}

export default function ComparisonTable({ products = [], columns = defaultColumns }: ComparisonTableProps) {
  if (!products.length) return null;

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={styles.th}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((product, rowIndex) => {
            const isFirst = rowIndex === 0;
            const isEven = rowIndex % 2 === 0 && !isFirst;
            return (
              <tr key={product.id} className={`${isFirst ? styles.rowFirst : ""} ${isEven ? styles.rowEven : ""}`}>
                {columns.map((col) => renderCell(col, product, isFirst))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
