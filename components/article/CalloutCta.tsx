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
};

/**
 * 記事内に差し込む汎用CTAブロック。
 * ProductCard（Amazon/楽天の商品）とは別に、A8のサービス系案件
 * （hinataレンタル / ふるさと納税 / アソビュー等）の成約導線に使う。
 * 外部リンクは rel="sponsored nofollow" 固定でPR表記を内包する。
 */
export default function CalloutCta({
  title,
  body,
  linkText,
  href,
  note,
  variant = "default",
}: CalloutCtaProps) {
  const variantClass = styles[variant] ?? "";
  return (
    <aside className={`${styles.cta} ${variantClass}`}>
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
    </aside>
  );
}
