import styles from "./QuickPick.module.css";
import { buildAmazonUrl } from "@/lib/amazon";

/**
 * 「迷ったらこれ」ボックス（campkit-20261027-C01）
 *
 * 記事冒頭の結論の直後に置く送客導線。本文を読み進めなくても
 * 1〜3製品の楽天／Amazon の購入ボタンに到達できるようにする。
 *
 * - 商品は【同じ記事の既存 ProductCardMdx から選ぶ】。価格・リンクはそのカードの値をそのまま写す。
 *   新しい商品・新しい価格の断定はここで行わない。
 * - 楽天は ProductCardMdx と同じ hb.afl アフィリエイトURL、Amazon は同じ amazonAsin から組む
 *   （lib/amazon.ts buildAmazonUrl＝ProductCard.getAmazonUrl() の amazonAsin 枝と同じ形）。
 * - ボタンのクラス名は ProductCard と衝突させない（verify-deploy.cjs はカードのボタン枚数・href を
 *   `ProductCard…__rakuten` / `ProductCard…__amazon` のクラスで数えるため、同じ名前にすると
 *   期待値がカード枚数とずれて誤 FAIL する）。
 * - クリック計測は components/AffiliateClickTracker.tsx のクリック委譲が拾う。
 *   商品名を affiliate_click に載せるため item ごとに data-product-name を付ける。
 */

export type QuickPickItem = {
  /** 用途ラベル（例:「通勤でPCを運ぶなら」） */
  label: string;
  /** 商品名（既存カードの name と表記を揃える。長い楽天タイトルは読みやすく縮めてよい） */
  name: string;
  /** 数値スペック（例:「20L／0.59kg／12,760円」）。既存カード・比較表の公表値のみ */
  spec?: string;
  /** 選ぶ理由の1行 */
  reason?: string;
  /** 記事内の詳細カードへのアンカー（ProductCardMdx の id） */
  anchor?: string;
  /** 楽天 hb.afl アフィリエイトURL（該当カードと同じもの） */
  affiliateUrl?: string;
  /** Amazon の ASIN（該当カードと同じもの） */
  amazonAsin?: string;
};

type QuickPickProps = {
  items: QuickPickItem[];
  /** 見出し文言（既定「迷ったらこれ」）。h2/h3 は使わず TOC には出さない */
  title?: string;
  /** ボックス上部の補足1行（任意） */
  lead?: string;
};

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

export default function QuickPick({ items, title = "迷ったらこれ", lead }: QuickPickProps) {
  const list = (items || []).filter((it) => it && it.name);
  if (list.length === 0) return null;

  return (
    <aside className={styles.box} aria-label={title}>
      <div className={styles.head}>
        <span className={styles.prTag}>PR</span>
        <p className={styles.title}>{title}</p>
      </div>
      {lead && <p className={styles.lead}>{lead}</p>}

      <ul className={styles.list}>
        {list.map((it, i) => {
          const amazonUrl = it.amazonAsin ? buildAmazonUrl(it.amazonAsin) : null;
          const rakutenUrl = it.affiliateUrl || null;
          return (
            <li key={`${it.name}-${i}`} className={styles.item} data-product-name={it.name}>
              <p className={styles.label}>{it.label}</p>
              <p className={styles.name}>
                {it.anchor ? (
                  <a href={`#${it.anchor}`} className={styles.anchor}>{it.name}</a>
                ) : (
                  it.name
                )}
              </p>
              {it.spec && <p className={styles.spec}>{it.spec}</p>}
              {it.reason && <p className={styles.reason}>{it.reason}</p>}
              <div className={styles.buttons}>
                {rakutenUrl && (
                  <a
                    href={rakutenUrl}
                    target="_blank"
                    rel="sponsored nofollow noopener noreferrer"
                    className={`${styles.btn} ${styles.btnRakuten}`}
                  >
                    <CartIcon className={styles.btnIcon} />
                    楽天市場で見る
                  </a>
                )}
                {amazonUrl && (
                  <a
                    href={amazonUrl}
                    target="_blank"
                    rel="sponsored nofollow noopener noreferrer"
                    className={`${styles.btn} ${styles.btnAmazon}`}
                  >
                    <CartIcon className={styles.btnIcon} />
                    Amazonで見る
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className={styles.note}>
        価格・在庫は各ショップの表示をご確認ください。くわしい比較は記事本文をご覧ください。
      </p>
    </aside>
  );
}
