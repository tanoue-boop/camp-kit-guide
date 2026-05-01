import type { Product } from "../../types/product";
import JsonLd from "../seo/JsonLd";
import styles from "./ProductCard.module.css";
import { buildRakutenSearchUrl } from "@/lib/rakuten";
import { buildAmazonUrl, buildAmazonSearchUrl } from "@/lib/amazon";

type ProductCardProps = {
  product: Product;
  rank?: number;
};

const RANK_LABELS: Record<number, { label: string; className: string }> = {
  1: { label: "1位", className: styles.rank1 },
  2: { label: "2位", className: styles.rank2 },
  3: { label: "3位", className: styles.rank3 },
};

const GOOGLE_SEARCH = (name: string) =>
  `https://www.google.co.jp/search?q=${encodeURIComponent(name)}`;

function getAmazonUrl(product: Product): string {
  if (product.source === "amazon" && product.affiliateUrl && product.affiliateUrl !== "#") {
    return buildAmazonUrl(product.affiliateUrl);
  }
  if (product.source === "other") return GOOGLE_SEARCH(product.name);
  return buildAmazonSearchUrl(product.name);
}

function getRakutenUrl(product: Product): string {
  if (product.source === "rakuten" && product.affiliateUrl && product.affiliateUrl !== "#") {
    return product.affiliateUrl;
  }
  if (product.source === "other") return GOOGLE_SEARCH(product.name);
  return buildRakutenSearchUrl(product.name);
}

// Cart icon SVG
function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

export default function ProductCard({ product, rank }: ProductCardProps) {
  const rankInfo = rank !== undefined ? RANK_LABELS[rank] : undefined;
  const amazonUrl = getAmazonUrl(product);
  const rakutenUrl = getRakutenUrl(product);

  const amazonRating = product.amazonRating ?? (product.source === "amazon" ? product.rating : undefined);
  const amazonReviewCount = product.amazonReviewCount ?? (product.source === "amazon" ? product.reviewCount : undefined);
  const rakutenRating = product.rakutenRating ?? (product.source === "rakuten" ? product.rating : undefined);
  const rakutenReviewCount = product.rakutenReviewCount ?? (product.source === "rakuten" ? product.reviewCount : undefined);

  const hasRatings = amazonRating != null || rakutenRating != null;

  // Use source-appropriate rating for JSON-LD
  const schemaRating      = product.source === "amazon" ? amazonRating      : rakutenRating;
  const schemaReviewCount = product.source === "amazon" ? amazonReviewCount : rakutenReviewCount;

  const hasAggregateRating =
    schemaReviewCount != null && schemaReviewCount > 0 &&
    schemaRating != null && schemaRating > 0;

  // Use source-appropriate URL for JSON-LD offers.url
  const schemaUrl = product.source === "amazon" ? amazonUrl : rakutenUrl;

  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    ...(product.image ? { image: product.image } : {}),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "JPY",
      availability: "https://schema.org/InStock",
      url: schemaUrl,
    },
    ...(hasAggregateRating ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: schemaRating,
        reviewCount: schemaReviewCount,
      },
    } : {}),
  };

  return (
    <>
      <JsonLd data={productSchema} />
      <div className={styles.card}>
        {rankInfo && (
          <span className={`${styles.rankBadge} ${rankInfo.className}`}>{rankInfo.label}</span>
        )}

        <div className={styles.inner}>
          {/* Left: image */}
          <div className={styles.imageWrap}>
            {product.image ? (
              <img src={product.image} alt={product.name} className={styles.image} loading="lazy" decoding="async" />
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

            <div className={styles.metaBottom}>
              <span className={styles.price}>¥{product.price.toLocaleString()}</span>
              {hasRatings && (
                <div className={styles.ratings}>
                  {amazonRating != null && (
                    <span className={styles.ratingRow}>
                      <span className={styles.ratingSource}>Amazon</span>
                      <span className={styles.ratingStars}>★ {amazonRating.toFixed(1)}</span>
                      {amazonReviewCount != null && (
                        <span className={styles.reviewCount}>（{amazonReviewCount.toLocaleString()}件）</span>
                      )}
                    </span>
                  )}
                  {rakutenRating != null && (
                    <span className={styles.ratingRow}>
                      <span className={styles.ratingSource}>楽天</span>
                      <span className={styles.ratingStars}>★ {rakutenRating.toFixed(1)}</span>
                      {rakutenReviewCount != null && (
                        <span className={styles.reviewCount}>（{rakutenReviewCount.toLocaleString()}件）</span>
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className={styles.buttons}>
          <a href={amazonUrl} target="_blank" rel="noopener noreferrer nofollow" className={`${styles.btn} ${styles.amazon}`}>
            <CartIcon className={styles.btnIcon} />
            <span className={styles.btnText}>
              <span className={styles.btnBrand}>amazon</span>
              <span className={styles.btnSub}>で購入する</span>
            </span>
          </a>
          <a href={rakutenUrl} target="_blank" rel="noopener noreferrer nofollow" className={`${styles.btn} ${styles.rakuten}`}>
            <CartIcon className={styles.btnIcon} />
            <span className={styles.btnText}>
              <span className={styles.btnBrand}>Rakuten</span>
              <span className={styles.btnSub}>で購入する</span>
            </span>
          </a>
        </div>
      </div>
    </>
  );
}
