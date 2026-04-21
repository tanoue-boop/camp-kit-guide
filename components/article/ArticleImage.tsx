import styles from "./ArticleImage.module.css";

type ArticleImageProps = {
  src?: string;
  alt?: string;
  caption?: string;
};

export default function ArticleImage({ src, alt = "", caption }: ArticleImageProps) {
  return (
    <figure className={styles.figure}>
      {src ? (
        <img src={src} alt={alt} className={styles.img} />
      ) : (
        <div className={styles.placeholder}>
          <svg className={styles.icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className={styles.placeholderText}>画像準備中</span>
          {alt && <span className={styles.altHint}>[alt: {alt}]</span>}
        </div>
      )}
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
      {!src && alt && !caption && (
        <figcaption className={styles.altCaption}>[デザイナー向け指示: {alt}]</figcaption>
      )}
    </figure>
  );
}
