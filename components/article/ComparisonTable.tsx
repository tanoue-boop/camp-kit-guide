import type { Product } from "../../types/product";
import styles from "./ComparisonTable.module.css";
import { buildAmazonUrl } from "@/lib/amazon";

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

const HB_AFL_PREFIX = "https://hb.afl.rakuten.co.jp/";

/**
 * 購入列（key: "buy"）の行ごとのリンク（campkit-20261027-C01）。
 * 既存の source 列は「楽天」か「Amazon」の1本しか出せないため、
 * 1行から楽天・Amazon の両方へ進めるようにした購入導線。
 * 値は行の affiliateUrl（楽天 hb.afl）と amazonAsin から組み、推測はしない。
 */
function resolveBuyUrls(product: Product): { rakuten: string; amazon: string } {
  const aff = String((product as Record<string, unknown>).affiliateUrl ?? "");
  const asin = String((product as Record<string, unknown>).amazonAsin ?? "");
  const rakuten = aff.startsWith(HB_AFL_PREFIX) ? aff : "";
  let amazon = asin ? buildAmazonUrl(asin) : "";
  // charcoal-starter 型（affiliateUrl 自体が Amazon の dp URL）の行も Amazon として出す
  if (!amazon && /^https?:\/\/(?:www\.)?amazon\.co\.jp\//.test(aff)) amazon = aff;
  return { rakuten, amazon };
}

function renderCell(col: Column, product: Product, isFirst: boolean) {
  const val = (product as Record<string, unknown>)[col.key];
  const strVal = String(val ?? "");

  if (col.key === "price") {
    const num = Number(val);
    const hasPrice = val !== null && val !== undefined && val !== "" && Number.isFinite(num);
    return (
      <td key={col.key} className={`${styles.td} ${isFirst ? styles.tdFirst : ""}`}>
        {hasPrice ? <span className={styles.price}>¥{num.toLocaleString()}</span> : <span>—</span>}
      </td>
    );
  }
  if (col.key === "rating") {
    const num = Number(val);
    const hasRating = val !== null && val !== undefined && val !== "" && Number.isFinite(num);
    return (
      <td key={col.key} className={`${styles.td} ${isFirst ? styles.tdFirst : ""}`}>
        {hasRating ? <span className={styles.rating}>★ {num.toFixed(1)}</span> : <span>—</span>}
      </td>
    );
  }
  if (col.key === "buy") {
    const { rakuten, amazon } = resolveBuyUrls(product);
    return (
      <td key={col.key} className={`${styles.td} ${isFirst ? styles.tdFirst : ""}`}>
        {rakuten || amazon ? (
          <span className={styles.buyCell}>
            {rakuten && (
              <a
                href={rakuten}
                target="_blank"
                rel="sponsored nofollow noopener noreferrer"
                className={`${styles.link} ${styles.buyRakuten}`}
              >
                楽天
              </a>
            )}
            {amazon && (
              <a
                href={amazon}
                target="_blank"
                rel="sponsored nofollow noopener noreferrer"
                className={`${styles.link} ${styles.buyAmazon}`}
              >
                Amazon
              </a>
            )}
          </span>
        ) : (
          <span>—</span>
        )}
      </td>
    );
  }
  if (col.key === "source") {
    const label = product.source === "amazon" ? "Amazon" : "楽天";
    return (
      <td key={col.key} className={`${styles.td} ${isFirst ? styles.tdFirst : ""}`}>
        {product.affiliateUrl ? (
          <a href={product.affiliateUrl} target="_blank" rel="noopener noreferrer nofollow" className={styles.link}>
            {label}
          </a>
        ) : (
          <span>{label}</span>
        )}
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
    <div className={styles.outer}>
      <p className={styles.scrollHint}>← スクロールできます →</p>
      <div className={styles.wrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col, colIndex) => (
                <th
                  key={col.key}
                  className={`${styles.th} ${colIndex === 0 ? styles.thSticky : ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product, rowIndex) => {
              const isFirst = rowIndex === 0;
              const isEven = rowIndex % 2 === 0 && !isFirst;
              return (
                <tr key={product.id} className={`${isFirst ? styles.rowFirst : ""} ${isEven ? styles.rowEven : ""}`}>
                  {columns.map((col, colIndex) => {
                    const cell = renderCell(col, product, isFirst);
                    if (colIndex !== 0) return cell;
                    // First column: add sticky class
                    const baseClass = `${styles.td} ${isFirst ? styles.tdFirst : ""} ${styles.tdSticky} ${isFirst ? styles.tdStickyFirst : isEven ? styles.tdStickyEven : styles.tdStickyDefault}`;
                    return (
                      <td key={col.key} className={baseClass}>
                        {String((product as Record<string, unknown>)[col.key] ?? "")}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
