import { useEffect, useState } from "react";
import styles from "./TableOfContents.module.css";

export type Heading = { level: 2 | 3; text: string; id: string };

type TableOfContentsProps = {
  headings: Heading[];
};

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-80px 0% -65% 0%" }
    );
    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  return (
    <nav className={styles.toc}>
      <p className={styles.tocTitle}>目次</p>
      <ol className={styles.list}>
        {headings.map(({ level, text, id }) => (
          <li key={id} className={`${styles.item} ${level === 3 ? styles.h3 : ""} ${activeId === id ? styles.active : ""}`}>
            <a href={`#${id}`} className={styles.link}>{text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
