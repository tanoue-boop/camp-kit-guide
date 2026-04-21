import Seo from "../components/common/Seo";
import Breadcrumb from "../components/common/Breadcrumb";
import styles from "./about.module.css";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Seo
        title="プライバシーポリシー"
        description="CampKit Guideのプライバシーポリシーです。"
        canonical="/privacy-policy"
      />
      <div className={styles.container}>
        <Breadcrumb items={[{ label: "プライバシーポリシー" }]} />
        <h1 className={styles.title}>プライバシーポリシー</h1>
        <div className={styles.body}>
          <h2>個人情報の取り扱い</h2>
          <p>
            当サイト（camp-kit-guide.com）では、お問い合わせフォームからご提供いただいた
            氏名・メールアドレスを、ご返答のためにのみ使用します。
            第三者への提供は行いません。
          </p>
          <h2>アクセス解析</h2>
          <p>
            当サイトはGoogle Analyticsを使用しています。
            Cookieを通じてトラフィックデータを収集しますが、個人を特定する情報は含まれません。
          </p>
          <h2>広告について</h2>
          <p>
            当サイトはGoogle AdSense、Amazonアソシエイト、楽天アフィリエイトを利用しています。
            これらのサービスはCookieを使用して広告を配信する場合があります。
          </p>
          <h2>免責事項</h2>
          <p>
            当サイトの情報は正確性を期していますが、内容の完全性・正確性を保証するものではありません。
            当サイトの情報に基づく損害について、運営者は責任を負いません。
          </p>
        </div>
      </div>
    </>
  );
}
