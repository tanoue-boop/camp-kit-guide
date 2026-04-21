import type { Product } from "../../types/product";
import styles from "./ProductCard.module.css";

type ProductCardProps = {
  product: Product;
  rank?: number;
};

const RANK_LABELS: Record<number, { label: string; className: string }> = {
  1: { label: "1位", className: styles.rank1 },
  2: { label: "2位", className: styles.rank2 },
  3: { label: "3位", className: styles.rank3 },
};

function buildAmazonUrl(product: Product): string {
  if (product.source === "amazon" && product.affiliateUrl && product.affiliateUrl !== "#") {
    return product.affiliateUrl;
  }
  return `https://www.amazon.co.jp/s?k=${encodeURIComponent(product.name)}`;
}

function buildRakutenUrl(product: Product): string {
  if (product.source === "rakuten" && product.affiliateUrl && product.affiliateUrl !== "#") {
    return product.affiliateUrl;
  }
  return `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(product.name)}/`;
}

export default function ProductCard({ product, rank }: ProductCardProps) {
  const rankInfo = rank !== undefined ? RANK_LABELS[rank] : undefined;
  const amazonUrl = buildAmazonUrl(product);
  const rakutenUrl = buildRakutenUrl(product);

  return (
    <div className={styles.card}>
      {rankInfo && (
        <span className={`${styles.rankBadge} ${rankInfo.className}`}>{rankInfo.label}</span>
      )}

      <div className={styles.inner}>
        {/* Left: image */}
        <div className={styles.imageWrap}>
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
        </div>

        {/* Right: info */}
        <div className={styles.info}>
          {product.badge && <span className={styles.badge}>{product.badge}</span>}
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
      </div>

      {/* Buttons */}
      <div className={styles.buttons}>
        <a href={amazonUrl} target="_blank" rel="noopener noreferrer nofollow" className={`${styles.btn} ${styles.amazon}`}>
          <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.344-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726a18.48 18.48 0 0 1-5.208.738c-3.83 0-7.445-1.046-10.85-3.14-.327-.2-.422-.4-.43-.6v-.12l.002-.146zm6.26-8.43c0-1.17.304-2.17.912-3 .607-.83 1.426-1.44 2.456-1.83.48-.175.99-.296 1.53-.36.54-.065 1.11-.098 1.71-.098h.6c.282 0 .595.016.938.048v-.6c0-.832-.285-1.502-.854-2.01-.57-.508-1.34-.762-2.31-.762-.55 0-1.07.09-1.565.27-.494.18-.947.44-1.358.783-.063.057-.137.085-.224.083-.087-.002-.162-.028-.225-.076l-1.23-1.25c-.073-.076-.1-.164-.08-.264.02-.1.076-.184.166-.25 2.002-1.566 4.178-2.35 6.528-2.35 1.35 0 2.536.247 3.558.74 1.023.494 1.832 1.197 2.426 2.108.362.552.623 1.163.782 1.832.16.67.24 1.41.24 2.22v8.25c0 .208-.1.312-.3.312h-2.1c-.2 0-.3-.104-.3-.312v-.912c-.53.56-1.17 1.006-1.92 1.34-.75.334-1.56.5-2.43.5-1.33 0-2.45-.37-3.36-1.11-.908-.74-1.362-1.74-1.362-3zm2.7-.135c0 .62.24 1.12.72 1.5.48.38 1.086.57 1.818.57.928 0 1.73-.29 2.403-.87.674-.578 1.01-1.296 1.01-2.154v-.84l-.854-.072c-.352-.033-.67-.05-.954-.05-1.072 0-1.924.23-2.556.69-.632.46-.948 1.06-.948 1.8l.36.426zm8.635 9.98c-.067-.1-.088-.2-.062-.3.026-.1.087-.18.182-.24 2.2-1.348 3.938-3.022 5.214-5.022.22-.34.397-.694.53-1.06l.076-.248c.076-.24.203-.356.384-.348.18.01.27.13.27.36v.456c0 1.534-.34 2.982-1.02 4.342-.68 1.36-1.63 2.47-2.85 3.33-.172.12-.344.13-.52.03l-2.204-1.3z"/>
          </svg>
          Amazonで見る
        </a>
        <a href={rakutenUrl} target="_blank" rel="noopener noreferrer nofollow" className={`${styles.btn} ${styles.rakuten}`}>
          <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.6 0H2.4C1.08 0 0 1.08 0 2.4v19.2C0 22.92 1.08 24 2.4 24h19.2c1.32 0 2.4-1.08 2.4-2.4V2.4C24 1.08 22.92 0 21.6 0zM13.5 17.25h-2.25v-4.5h-4.5v4.5H4.5V6.75h2.25v3.75h4.5V6.75H13.5v10.5zm6-6h-2.25v6h-2.25v-6H12.75V9h6.75v2.25z"/>
          </svg>
          楽天で見る
        </a>
      </div>
    </div>
  );
}
