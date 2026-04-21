import type { Product } from "../../types/product";
import styles from "./ProductCard.module.css";

type ProductCardProps = {
  product: Product;
  rank?: number;
};

export default function ProductCard({ product, rank }: ProductCardProps) {
  return (
    <div className={styles.card}>
      {rank && <span className={styles.rank}>#{rank}</span>}
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
        href={product.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={styles.cta}
      >
        {product.source === "amazon" ? "Amazonで見る →" : "楽天で見る →"}
      </a>
    </div>
  );
}
