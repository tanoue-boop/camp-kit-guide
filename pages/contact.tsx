import Seo from "../components/common/Seo";
import Breadcrumb from "../components/common/Breadcrumb";
import styles from "./contact.module.css";

export default function ContactPage() {
  return (
    <>
      <Seo
        title="お問い合わせ"
        description="CampKit Guideへのお問い合わせはこちらから。"
        canonical="/contact"
      />
      <div className={styles.container}>
        <Breadcrumb items={[{ label: "お問い合わせ" }]} />
        <h1 className={styles.title}>お問い合わせ</h1>
        <p className={styles.lead}>
          掲載内容に関するご意見・ご指摘・掲載依頼などはこちらからご連絡ください。
          通常3営業日以内にご返答します。
        </p>
        <form className={styles.form} action="https://formspree.io/f/placeholder" method="POST">
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">お名前</label>
            <input className={styles.input} type="text" id="name" name="name" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">メールアドレス</label>
            <input className={styles.input} type="email" id="email" name="email" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="message">お問い合わせ内容</label>
            <textarea className={styles.textarea} id="message" name="message" rows={6} required />
          </div>
          <button type="submit" className={styles.submit}>送信する</button>
        </form>
      </div>
    </>
  );
}
