import Seo from "../components/common/Seo";
import Breadcrumb from "../components/common/Breadcrumb";
import styles from "./privacy-policy.module.css";

const LAST_UPDATED = "2025年4月21日";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Seo
        title="プライバシーポリシー"
        description="CampKit Guide（camp-kit-guide.com）のプライバシーポリシーです。個人情報の取り扱い、Cookie、Google Analytics、Google AdSense、Amazonアソシエイト、楽天アフィリエイトについて説明しています。"
        canonical="/privacy-policy"
      />
      <div className={styles.container}>
        <Breadcrumb items={[{ label: "プライバシーポリシー" }]} />

        <h1 className={styles.title}>プライバシーポリシー</h1>
        <p className={styles.lastUpdated}>最終更新日：{LAST_UPDATED}</p>

        <div className={styles.body}>
          <p>
            CampKit Guide（以下「当サイト」）は、camp-kit-guide.com にて個人が運営するキャンプ用品情報メディアです。
            当サイトにおける個人情報の取り扱い、Cookie の使用、各種サービスの利用方針について、
            以下のとおり定めます。
          </p>

          {/* 1. 個人情報の収集と利用目的 */}
          <section className={styles.section}>
            <h2 className={styles.heading}>1. 個人情報の収集と利用目的</h2>
            <p>
              当サイトでは、お問い合わせフォームを通じて氏名・メールアドレス等の個人情報をご提供いただく場合があります。
              収集した個人情報は、お問い合わせへの返答・連絡のみを目的として使用し、
              それ以外の目的には使用しません。
            </p>
            <p>
              収集した個人情報は、ご本人の同意なく第三者に提供・開示することはありません。
              ただし、法令に基づき開示が求められた場合はこの限りではありません。
            </p>
          </section>

          {/* 2. Cookie の使用について */}
          <section className={styles.section}>
            <h2 className={styles.heading}>2. Cookieの使用について</h2>
            <p>
              当サイトでは、利便性の向上・アクセス解析・広告配信を目的として Cookie を使用しています。
              Cookie はブラウザに保存される小さなテキストファイルであり、個人を直接特定する情報は含まれません。
            </p>
            <p>
              Cookie の使用を希望されない場合は、ブラウザの設定から Cookie を無効にすることができます。
              ただし、一部のコンテンツや機能が正常に動作しなくなる場合があります。
            </p>
            <p>
              当サイトで Cookie を使用しているサービスは以下のとおりです。
            </p>
            <ul className={styles.list}>
              <li>Google Analytics（アクセス解析）</li>
              <li>Google AdSense（広告配信）</li>
              <li>Amazonアソシエイト（アフィリエイト計測）</li>
              <li>楽天アフィリエイト（アフィリエイト計測）</li>
            </ul>
          </section>

          {/* 3. アクセス解析 */}
          <section className={styles.section}>
            <h2 className={styles.heading}>3. アクセス解析ツールについて（Google Analytics）</h2>
            <p>
              当サイトでは、Googleが提供するアクセス解析サービス「Google Analytics」を使用しています。
              Google Analytics は Cookie を使用してトラフィックデータ（ページビュー数・滞在時間・流入元など）を収集します。
              このデータは匿名で収集されており、個人を特定する情報は含まれません。
            </p>
            <p>
              また当サイトでは、記事のページビュー数を表示するために「Supabase」を使用しています。
              Supabase に送信されるデータはページの URL とアクセス数のみであり、
              個人を特定できる情報は収集しておりません。
            </p>
            <p>
              Google Analytics の利用規約およびデータの取り扱いについては、
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                Googleのプライバシーポリシー
              </a>
              をご確認ください。
              Google Analytics によるデータ収集を無効にしたい場合は、
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                Google Analytics オプトアウトアドオン
              </a>
              をご利用ください。
            </p>
          </section>

          {/* 4. 広告について */}
          <section className={styles.section}>
            <h2 className={styles.heading}>4. 広告について（Google AdSense）</h2>
            <p>
              当サイトでは、Google が提供する広告配信サービス「Google AdSense」を使用しています。
              Google AdSense は、ユーザーの興味・関心に基づいたパーソナライズド広告を表示するために
              Cookie を使用することがあります。
            </p>
            <p>
              Google による広告 Cookie の使用については、
              <a
                href="https://policies.google.com/technologies/ads"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                Google の広告ポリシー
              </a>
              をご確認ください。
              パーソナライズド広告を無効にしたい場合は、
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                広告設定ページ
              </a>
              からオプトアウトできます。
            </p>
          </section>

          {/* 5. アフィリエイトについて */}
          <section className={styles.section}>
            <h2 className={styles.heading}>5. アフィリエイトについて（Amazon・楽天）</h2>
            <p>
              当サイトは、以下のアフィリエイトプログラムに参加しています。
            </p>
            <ul className={styles.list}>
              <li>
                <strong>Amazonアソシエイト：</strong>
                Amazon.co.jp が運営するアフィリエイトプログラムの参加者です。
                当サイトの記事内に含まれるAmazonへのリンクを通じて商品をご購入いただいた場合、
                当サイトに紹介料が発生することがあります。
              </li>
              <li>
                <strong>楽天アフィリエイト：</strong>
                楽天グループ株式会社が運営するアフィリエイトプログラムの参加者です。
                当サイトの記事内に含まれる楽天市場へのリンクを通じて商品をご購入いただいた場合、
                当サイトに紹介料が発生することがあります。
              </li>
            </ul>
            <p>
              これらのリンクを経由しての購入において、読者の方に追加の費用が発生することは一切ありません。
              また、アフィリエイト収益は当サイトの運営・記事制作費用に充てており、
              記事の内容・評価に影響を与えることはありません。
            </p>
          </section>

          {/* 6. 免責事項 */}
          <section className={styles.section}>
            <h2 className={styles.heading}>6. 免責事項</h2>
            <p>
              当サイトに掲載している情報は、正確性・最新性を保つよう努めていますが、
              その完全性・正確性・有用性を保証するものではありません。
            </p>
            <p>
              商品の価格・仕様・在庫状況は記事公開時点のものであり、予告なく変更される場合があります。
              最新の情報については、各販売サイト・メーカーの公式情報をご確認ください。
            </p>
            <p>
              当サイトの情報を参考にした行動・購入により生じた損害・トラブルについて、
              当サイト運営者は一切の責任を負いません。
              また、当サイトからリンクしている外部サイトの内容については、
              当サイトは責任を負いかねます。
            </p>
          </section>

          {/* 7. 著作権 */}
          <section className={styles.section}>
            <h2 className={styles.heading}>7. 著作権</h2>
            <p>
              当サイトに掲載されているすべてのテキスト・画像・コードなどのコンテンツの著作権は、
              当サイト運営者に帰属します。
              無断での転載・複製・改変・商用利用は固くお断りします。
            </p>
            <p>
              引用する場合は、出典元として当サイト名（CampKit Guide）とURLを明記のうえ、
              引用の範囲内でご利用ください。
            </p>
          </section>

          {/* 8. プライバシーポリシーの変更 */}
          <section className={styles.section}>
            <h2 className={styles.heading}>8. プライバシーポリシーの変更</h2>
            <p>
              当サイトは、法令の改正や運営方針の変更に伴い、本プライバシーポリシーを予告なく改訂することがあります。
              改訂後のプライバシーポリシーは、当ページに掲載した時点より効力を生じるものとします。
              定期的にご確認いただくことをお勧めします。
            </p>
          </section>

          {/* 9. お問い合わせ */}
          <section className={styles.section}>
            <h2 className={styles.heading}>9. お問い合わせ</h2>
            <p>
              当サイトのプライバシーポリシーに関するご質問・個人情報の開示・訂正・削除のご要望は、
              <a href="/contact" className={styles.link}>お問い合わせフォーム</a>よりご連絡ください。
              通常3営業日以内にご返答いたします。
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
