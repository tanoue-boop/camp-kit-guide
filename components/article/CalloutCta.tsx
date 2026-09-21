import styles from "./CalloutCta.module.css";

export type CalloutCtaVariant = "default" | "rental" | "furusato" | "leisure";

type CalloutCtaProps = {
  /** 太字リード（例:「道具を全部そろえるのが大変なら」） */
  title: string;
  /** 補足の説明文（任意） */
  body?: string;
  /** ボタン文言（例:「hinataレンタルで料金を見る」） */
  linkText: string;
  /** 遷移先URL（A8アフィリリンク等） */
  href: string;
  /** ボタン下の小さな注記（任意） */
  note?: string;
  /** 色バリエーション（任意・既定=default） */
  variant?: CalloutCtaVariant;
  /**
   * A8 インプレッション計測用 1px 画像の URL（任意）。
   * 未指定なら href の a8mat 値から A8_IMPRESSION_PIXELS を引いて自動で出す。
   * 対応表に無い新規プログラムを追加するとき用。
   */
  impressionSrc?: string;
};

/**
 * A8 の正規コードに付属する表示計測ピクセル（a8mat → 画像URL）。
 * サブドメイン（www15 / www18）はプログラムごとに異なり href からは導出できないため、
 * A8 管理画面で発行された素材コードの値をそのまま転記する（推測で書かない）。
 */
const A8_IMPRESSION_PIXELS: Record<string, string> = {
  // hinataストア（素材ID 002「【hinataストア】」）
  "4B8BWS+G9UK1E+4U5Q+BX3J6": "https://www18.a8.net/0.gif?a8mat=4B8BWS+G9UK1E+4U5Q+BX3J6",
  // hinataレンタル
  "4B8B4S+5AIQCY+4U5Q+5YJRM": "https://www15.a8.net/0.gif?a8mat=4B8B4S+5AIQCY+4U5Q+5YJRM",
  // やまどうぐレンタル屋（s00000011202001・素材ID 003「登山道具レンタル」・通常広告用。2026-09-21 管理画面で確認）
  "4B8BWS+GI6MIA+2EFO+5YZ76": "https://www14.a8.net/0.gif?a8mat=4B8BWS+GI6MIA+2EFO+5YZ76",
  // アソビュー（s00000019330001・素材ID 042「日本最大級のレジャー総合情報サイト「asoview!(アソビュー)」」・通常広告用。2026-09-21 管理画面で確認）
  "4B8B4S+5VCWJ6+455G+67C4I": "https://www17.a8.net/0.gif?a8mat=4B8B4S+5VCWJ6+455G+67C4I",
};

/** href が px.a8.net のときだけ a8mat 値を返す（楽天ふるさと納税CTA等は undefined） */
function extractA8mat(href: string): string | undefined {
  const m = href.match(/^https?:\/\/px\.a8\.net\/[^?]*\?(?:[^&]*&)*a8mat=([^&#]+)/i);
  return m ? decodeURIComponent(m[1]) : undefined;
}

function resolveImpressionSrc(href: string, explicit?: string): string | undefined {
  if (explicit) return explicit;
  const a8mat = extractA8mat(href);
  return a8mat ? A8_IMPRESSION_PIXELS[a8mat] : undefined;
}

/**
 * 記事内に差し込む汎用CTAブロック。
 * ProductCard（Amazon/楽天の商品）とは別に、A8のサービス系案件
 * （hinataレンタル / ふるさと納税 / アソビュー等）の成約導線に使う。
 * 外部リンクは rel="sponsored nofollow" 固定でPR表記を内包する。
 * A8 案件では正規コード付属のインプレッション計測ピクセルを併せて描画する。
 */
export default function CalloutCta({
  title,
  body,
  linkText,
  href,
  note,
  variant = "default",
  impressionSrc,
}: CalloutCtaProps) {
  const variantClass = styles[variant] ?? "";
  const pixelSrc = resolveImpressionSrc(href, impressionSrc);
  return (
    // data-product-name: AffiliateClickTracker が affiliate_click の product_name に使う（ボタン文言）
    <aside className={`${styles.cta} ${variantClass}`} data-product-name={linkText}>
      <span className={styles.prTag}>PR</span>
      <p className={styles.title}>{title}</p>
      {body && <p className={styles.body}>{body}</p>}
      <a
        href={href}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        className={styles.button}
      >
        {linkText}
        <span className={styles.arrow} aria-hidden="true">›</span>
      </a>
      {note && <p className={styles.note}>{note}</p>}
      {pixelSrc && (
        // 外部1pxトラッカーのため next/image は使わない
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pixelSrc} width={1} height={1} alt="" loading="eager" decoding="async" style={{ border: 0 }} />
      )}
    </aside>
  );
}
