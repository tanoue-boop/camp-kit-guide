import Seo from "../components/common/Seo";
import Breadcrumb from "../components/common/Breadcrumb";
import styles from "./about.module.css";

export default function AboutPage() {
  return (
    <>
      <Seo
        title="このサイトについて"
        description="CampKit Guideはキャンプ用品の選び方・比較情報を提供するアフィリエイトサイトです。"
        canonical="/about"
      />
      <div className={styles.container}>
        <Breadcrumb items={[{ label: "このサイトについて" }]} />
        <h1 className={styles.title}>このサイトについて</h1>
        <div className={styles.body}>
          <h2>CampKit Guideとは</h2>
          <p>
            CampKit Guideは、キャンプ初心者からベテランキャンパーまでに向けた
            キャンプ用品の選び方・比較情報を提供するメディアです。
          </p>
          <h2>掲載情報について</h2>
          <p>
            当サイトに掲載している商品情報・価格は記事公開時点のものです。
            最新情報は各販売サイトにてご確認ください。
          </p>
          <h2>アフィリエイトについて</h2>
          <p>
            当サイトはAmazonアソシエイト・楽天アフィリエイトプログラムに参加しています。
            記事内のリンクから商品をご購入いただいた場合、当サイトに紹介料が発生することがあります。
            これにより読者の方に追加の費用が発生することはありません。
          </p>
        </div>
      </div>
    </>
  );
}
