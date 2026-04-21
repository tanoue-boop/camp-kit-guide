import type { Product } from "../../types/product";
import styles from "./ComparisonTable.module.css";

type Column = {
  key: keyof Product | string;
  label: string;
};

type ComparisonTableProps = {
  products: Product[];
  columns?: Column[];
};

const defaultColumns: Column[] = [
  { key: "name", label: "商品名" },
  { key: "price", label: "価格" },
  { key: "rating", label: "評価" },
  { key: "source", label: "購入先" },
];

export default function ComparisonTable({ products = [], columns = defaultColumns }: ComparisonTableProps) {
  if (!products.length) return null;
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            <th>リンク</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              {columns.map((col) => {
                const val = (product as any)[col.key];
                if (col.key === "price") return <td key={col.key}>¥{Number(val).toLocaleString()}</td>;
                if (col.key === "rating") return <td key={col.key}>★ {Number(val).toFixed(1)}</td>;
                return <td key={col.key}>{val}</td>;
              })}
              <td>
                <a
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={styles.link}
                >
                  {product.source === "amazon" ? "Amazon" : "楽天"}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
