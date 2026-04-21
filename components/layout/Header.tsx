import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./Header.module.css";

const CATEGORIES = [
  { href: "/category/tent", label: "テント", icon: "⛺" },
  { href: "/category/sleeping-bag", label: "寝袋・シュラフ", icon: "🛏️" },
  { href: "/category/cookware", label: "調理器具", icon: "🍳" },
  { href: "/category/chair-table", label: "チェア・テーブル", icon: "🪑" },
  { href: "/category/lighting", label: "照明・ランタン", icon: "🔦" },
  { href: "/category/clothing", label: "ウェア・装備", icon: "🧥" },
  { href: "/category/bonfire", label: "焚き火台", icon: "🔥" },
];

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const router = useRouter();

  // Close drawer on route change
  useEffect(() => {
    const handleRouteChange = () => setDrawerOpen(false);
    router.events.on("routeChangeStart", handleRouteChange);
    return () => router.events.off("routeChangeStart", handleRouteChange);
  }, [router.events]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>🏕️</span>
            <span className={styles.logoText}>CampKit Guide</span>
          </Link>

          {/* PC nav */}
          <nav className={styles.nav}>
            <Link href="/ranking" className={styles.navLink}>ランキング</Link>

            {/* Category dropdown */}
            <div
              className={styles.dropdown}
              onMouseEnter={() => setCategoryOpen(true)}
              onMouseLeave={() => setCategoryOpen(false)}
            >
              <button className={styles.dropdownTrigger} type="button" aria-haspopup="true" aria-expanded={categoryOpen}>
                カテゴリ
                <svg className={`${styles.chevron} ${categoryOpen ? styles.chevronOpen : ""}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {categoryOpen && (
                <div className={styles.dropdownMenu}>
                  {CATEGORIES.map((cat) => (
                    <Link key={cat.href} href={cat.href} className={styles.dropdownItem}>
                      <span className={styles.dropdownIcon}>{cat.icon}</span>
                      {cat.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/about" className={styles.navLink}>このサイトについて</Link>
          </nav>

          {/* Hamburger button (SP only) */}
          <button
            className={styles.hamburger}
            type="button"
            aria-label="メニューを開く"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <span className={styles.hamburgerBar} />
            <span className={styles.hamburgerBar} />
            <span className={styles.hamburgerBar} />
          </button>
        </div>
      </header>

      {/* SP Drawer overlay */}
      {drawerOpen && (
        <div className={styles.overlay} onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      )}

      {/* SP Drawer */}
      <div className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ""}`} aria-hidden={!drawerOpen}>
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>🏕️ メニュー</span>
          <button
            className={styles.drawerClose}
            type="button"
            aria-label="メニューを閉じる"
            onClick={() => setDrawerOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className={styles.drawerNav}>
          <Link href="/ranking" className={styles.drawerLink}>
            <span className={styles.drawerLinkIcon}>🏆</span>ランキング
          </Link>

          <p className={styles.drawerSection}>カテゴリ</p>
          {CATEGORIES.map((cat) => (
            <Link key={cat.href} href={cat.href} className={styles.drawerLink}>
              <span className={styles.drawerLinkIcon}>{cat.icon}</span>{cat.label}
            </Link>
          ))}

          <div className={styles.drawerDivider} />
          <Link href="/about" className={styles.drawerLink}>
            <span className={styles.drawerLinkIcon}>ℹ️</span>このサイトについて
          </Link>
        </nav>
      </div>
    </>
  );
}
