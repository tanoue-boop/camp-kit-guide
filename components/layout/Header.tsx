import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./Header.module.css";

type Category = {
  href: string;
  label: string;
  icon: string;
};

const CATEGORIES: Category[] = [
  { href: "/category/tent",         label: "テント",           icon: "/icons/categories/tent.svg" },
  { href: "/category/sleeping-bag", label: "寝袋・シュラフ",   icon: "/icons/categories/sleeping-bag.svg" },
  { href: "/category/cookware",     label: "調理器具",         icon: "/icons/categories/cookware.svg" },
  { href: "/category/chair-table",  label: "チェア・テーブル", icon: "/icons/categories/chair-table.svg" },
  { href: "/category/lighting",     label: "照明・ランタン",   icon: "/icons/categories/lighting.svg" },
  { href: "/category/clothing",     label: "ウェア・装備",     icon: "/icons/categories/clothing.svg" },
  { href: "/category/bonfire",      label: "焚き火台",         icon: "/icons/categories/bonfire.svg" },
  { href: "/category/backpack",     label: "バックパック",     icon: "/icons/categories/backpack.svg" },
  { href: "/category/power",        label: "電源・バッテリー", icon: "/icons/categories/power.svg" },
];

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => setDrawerOpen(false);
    router.events.on("routeChangeStart", handleRouteChange);
    return () => router.events.off("routeChangeStart", handleRouteChange);
  }, [router.events]);

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
            <img src="/logo.svg" alt="CampKit Guide" className={styles.logoImage} loading="eager" decoding="async" />
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
                      <img src={cat.icon} alt="" width={20} height={20} className={styles.categoryIcon} loading="lazy" decoding="async" />
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
          <img src="/logo.svg" alt="CampKit Guide" className={styles.drawerLogoImage} loading="lazy" decoding="async" />
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
            <img src="/icons/menu/ranking.svg" alt="" width={20} height={20} className={styles.menuIcon} loading="lazy" decoding="async" />
            ランキング
          </Link>

          <p className={styles.drawerSection}>カテゴリ</p>
          {CATEGORIES.map((cat) => (
            <Link key={cat.href} href={cat.href} className={styles.drawerLink}>
              <img src={cat.icon} alt="" width={20} height={20} className={styles.categoryIcon} loading="lazy" decoding="async" />
              {cat.label}
            </Link>
          ))}

          <div className={styles.drawerDivider} />
          <Link href="/about" className={styles.drawerLink}>
            <img src="/icons/menu/about.svg" alt="" width={20} height={20} className={styles.menuIcon} loading="lazy" decoding="async" />
            このサイトについて
          </Link>
        </nav>
      </div>
    </>
  );
}
