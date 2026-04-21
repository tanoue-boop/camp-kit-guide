import { useState } from "react";
import type { Heading } from "./TableOfContents";
import styles from "./InlineTOC.module.css";

type InlineTOCProps = {
  headings: Heading[];
};

export default function InlineTOC({ headings }: InlineTOCProps) {
  const [open, setOpen] = useState(true);

  if (!headings.length) return null;

  return (
    <div className={styles.toc}>
      <button className={styles.toggle} onClick={() => setOpen(!open)} type="button">
        <span className={styles.toggleLabel}>
          <svg className={styles.tocIcon} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          目次
        </span>
        <span className={styles.toggleHint}>{open ? "非表示" : "表示"}</span>
      </button>
      {open && (
        <nav>
          <ol className={styles.list}>
            {headings.map(({ level, text, id }, i) => (
              <li key={id} className={`${styles.item} ${level === 3 ? styles.h3Item : ""}`}>
                {level === 2 && <span className={styles.num}>{headings.filter((h, j) => h.level === 2 && j <= i).length}</span>}
                <a href={`#${id}`} className={styles.link}>{text}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </div>
  );
}
