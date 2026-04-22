import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.topRow}>
          <div className={styles.brandGroup}>
            <img src="/logo_white.svg" alt="CampKit Guide" className={styles.logoImage} />
            <p className={styles.tagline}>キャンプ用品の選び方をわかりやすく。</p>
          </div>
          <nav className={styles.links}>
            <Link href="/about" className={styles.link}>このサイトについて</Link>
            <Link href="/privacy-policy" className={styles.link}>プライバシーポリシー</Link>
            <Link href="/contact" className={styles.link}>お問い合わせ</Link>
          </nav>
        </div>

        <div className={styles.bottomRow}>
          <p className={styles.affiliate}>
            当サイトはAmazonアソシエイト・楽天アフィリエイトプログラムに参加しています。<br />
            記事内のリンクから商品を購入された場合、当サイトに報酬が発生することがあります。
          </p>
          <p className={styles.copy}>© {new Date().getFullYear()} CampKit Guide. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
