import Link from "next/link";
import Seo from "../components/common/Seo";
import Breadcrumb from "../components/common/Breadcrumb";
import styles from "./about.module.css";

const FEATURES = [
  {
    emoji: "🔍",
    title: "徹底比較",
    body: "複数の商品を同じ基準でフラットに比較。スペック・価格・使用感を横断的に検証し、あなたに合った一本を見つけやすくします。",
  },
  {
    emoji: "📊",
    title: "ビジュアル重視",
    body: "わかりやすい比較表・図解を積極的に活用。テキストだけでは伝わりにくい差異も、一目で把握できるようにしています。",
  },
  {
    emoji: "🌱",
    title: "初心者目線",
    body: "専門用語はわかりやすい言葉に置き換えて解説。キャンプをはじめて検討する方でも迷わず読み進められる記事を心がけています。",
  },
  {
    emoji: "🔄",
    title: "最新情報",
    body: "価格変動・新モデル発売などに合わせて定期的に記事を更新。情報が古いまま放置されないよう、鮮度の維持を大切にしています。",
  },
];

export default function AboutPage() {
  return (
    <>
      <Seo
        title="このサイトについて｜CampKit Guide"
        description="CampKit Guideはキャンプ用品の選び方・比較情報を提供するメディアです。徹底比較・初心者目線・最新情報を大切にした記事をお届けします。"
        canonical="/about"
      />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.heroEyebrow}>🏕️ CampKit Guide</p>
          <h1 className={styles.heroTitle}>キャンプ用品選びで、<br />もう失敗しない。</h1>
          <p className={styles.heroSub}>
            テント・寝袋・バーナーなど、キャンプ用品は種類が多く選び方に迷いがちです。
            CampKit Guideは「何を買えばいいかわからない」という悩みに応えるため、
            実際に調査・比較した情報だけを掲載するメディアです。
          </p>
        </div>
      </section>

      <div className={styles.page}>
        <div className={styles.breadcrumbWrap}>
          <Breadcrumb items={[{ label: "このサイトについて" }]} />
        </div>

        {/* About section */}
        <section className={styles.section}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>このサイトについて</h2>
            <div className={styles.prose}>
              <h3>CampKit Guideの運営方針</h3>
              <p>
                CampKit Guideは、キャンプ初心者からベテランキャンパーまでを対象に、
                キャンプ用品の選び方・おすすめ比較情報を提供するメディアです。
                「本当に役立つ情報だけを届ける」という方針のもと、広告収益よりも
                読者の満足度を優先した記事作りを心がけています。
              </p>
              <h3>記事の作成基準</h3>
              <p>
                掲載する情報は、公式サイト・販売ページ・メーカースペックシートなどの
                一次情報をもとに調査・検証しています。根拠のある情報のみを掲載し、
                「なんとなくおすすめ」の羅列にならないよう記事構成に細心の注意を払っています。
              </p>
              <h3>更新頻度・情報の鮮度</h3>
              <p>
                キャンプ用品は季節ごとに新モデルが登場し、価格も変動します。
                当サイトでは掲載記事を定期的に見直し、古くなった情報は随時更新しています。
                ただし、ご購入前には必ず各販売サイトにて最新情報をご確認ください。
              </p>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>コンテンツの特徴</h2>
            <div className={styles.featuresGrid}>
              {FEATURES.map((f) => (
                <div key={f.title} className={styles.featureCard}>
                  <span className={styles.featureEmoji}>{f.emoji}</span>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureBody}>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Disclaimer section */}
        <section className={styles.section}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>免責事項・アフィリエイト開示</h2>
            <div className={styles.disclaimerList}>
              <div className={styles.disclaimerItem}>
                <span className={styles.disclaimerIcon}>💰</span>
                <div>
                  <p className={styles.disclaimerLabel}>価格・在庫について</p>
                  <p className={styles.disclaimerText}>
                    記事内に掲載している価格・在庫状況は執筆時点のものです。
                    実際の価格・在庫は変動しますので、ご購入前に各販売サイトでご確認ください。
                  </p>
                </div>
              </div>
              <div className={styles.disclaimerItem}>
                <span className={styles.disclaimerIcon}>🔗</span>
                <div>
                  <p className={styles.disclaimerLabel}>アフィリエイトプログラムへの参加</p>
                  <p className={styles.disclaimerText}>
                    当サイトはAmazonアソシエイト・楽天アフィリエイトプログラムに参加しています。
                    記事内のリンクから商品をご購入いただいた場合、当サイトに紹介料が発生することがありますが、
                    読者の方に追加費用が発生することは一切ありません。
                  </p>
                </div>
              </div>
              <div className={styles.disclaimerItem}>
                <span className={styles.disclaimerIcon}>📝</span>
                <div>
                  <p className={styles.disclaimerLabel}>記事内容について</p>
                  <p className={styles.disclaimerText}>
                    記事内容は執筆・更新時点の情報に基づいています。
                    情報の正確性には最大限配慮していますが、内容の完全性・最新性を保証するものではありません。
                    掲載情報のご利用は読者の方ご自身の判断と責任においておこなってください。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={`${styles.inner} ${styles.ctaInner}`}>
            <p className={styles.ctaText}>ご意見・ご質問・掲載に関するお問い合わせはお気軽にどうぞ。</p>
            <Link href="/contact" className={styles.ctaBtn}>
              お問い合わせはこちら →
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
