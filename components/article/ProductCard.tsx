import type { Product } from "../../types/product";
import styles from "./ProductCard.module.css";

type ProductCardProps = {
  product: Product;
  rank?: number;
};

function buildFallbackUrl(product: Product): string {
  const q = encodeURIComponent(product.name);
  if (product.source === "rakuten") {
    return `https://search.rakuten.co.jp/search/mall/${q}/`;
  }
  return `https://www.amazon.co.jp/s?k=${q}`;
}

export default function ProductCard({ product, rank }: ProductCardProps) {
  const ctaUrl =
    product.affiliateUrl && product.affiliateUrl !== "#" && product.affiliateUrl !== ""
      ? product.affiliateUrl
      : buildFallbackUrl(product);

  return (
    <div className={styles.card}>
      {rank && <span className={styles.rank}>#{rank}</span>}

      {/* Product image / placeholder */}
      {product.image ? (
        <img src={product.image} alt={product.name} className={styles.image} />
      ) : (
        <div className={styles.imagePlaceholder}>
          <svg className={styles.placeholderIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className={styles.placeholderText}>画像準備中</span>
        </div>
      )}

      {product.badge && <span className={styles.badge}>{product.badge}</span>}
      <div className={styles.body}>
        <p className={styles.name}>{product.name}</p>
        <p className={styles.description}>{product.description}</p>
        <div className={styles.meta}>
          <span className={styles.rating}>
            ★ {product.rating.toFixed(1)}
            <span className={styles.reviewCount}>（{product.reviewCount.toLocaleString()}件）</span>
          </span>
          <span className={styles.price}>¥{product.price.toLocaleString()}</span>
        </div>
      </div>
      <a
        href={ctaUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={styles.cta}
      >
        {product.source === "amazon" ? "Amazonで見る →" : "楽天で見る →"}
      </a>
    </div>
  );
}
