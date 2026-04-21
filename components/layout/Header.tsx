import Link from "next/link";
import styles from "./Header.module.css";

const navLinks = [
  { href: "/ranking", label: "ランキング" },
  { href: "/category/tent", label: "テント" },
  { href: "/category/sleeping-bag", label: "寝袋" },
  { href: "/category/cookware", label: "調理器具" },
  { href: "/about", label: "このサイトについて" },
];

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🏕️</span>
          <span className={styles.logoText}>CampKit Guide</span>
        </Link>
        <nav className={styles.nav}>
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className={styles.navLink}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
