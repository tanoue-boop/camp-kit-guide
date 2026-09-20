# CampKit Guide 記事診断レポート（フェーズ1）

- 作成日: 2026-09-20
- 対象記事: 264本（content/posts/*.mdx）
- **GSCデータ: 未取得**（GSC認証情報がありません。次のいずれかを .env.local に設定してください: GSC_ACCESS_TOKEN / GSC_SA_KEY_FILE(またはGOOGLE_APPLICATION_CREDENTIALS) / GSC_CLIENT_ID+GSC_CLIENT_SECRET+GSC_REFRESH_TOKEN）。GSC由来の指標は空欄。認証情報を用意して `node scripts/diagnose-gsc.mjs` → 本スクリプトを再実行すると埋まる。
- 出力: `_file/diagnosis-articles.tsv`（記事単位一覧）

## GA4 導入確認（2026-09-20 実施）

- **導入済み（測定ID: G-W64E37EDCL）**
- 実装: `pages/_document.tsx` が `NEXT_PUBLIC_GA_ID` を読み gtag.js（googletagmanager.com/gtag/js）を `<Head>` に直書き。`@next/third-parties` は不使用。
- SPA遷移: `pages/_app.tsx` が `routeChangeComplete` で `lib/gtag.ts` の `pageview()` を呼び `gtag('config', ID, {page_path})` を送信。`event()` ヘルパは定義のみで呼び出し箇所なし（アフィリンクのクリック計測などのカスタムイベントは未実装）。
- 自己トラフィック除外: URLに `?ckbot=1` または sessionStorage `ckbot=1` があると `window['ga-disable-<ID>']=true` で計測停止。
- 本番HTML（https://www.camp-kit-guide.com/）で `gtag/js?id=G-W64E37EDCL` の出力を確認済み（Vercel側の環境変数も設定されている）。

## 判定ルール

### 記事タイプ（タイトルの正規表現・上から順に最初に一致したもの）

| 順 | タイプ | 正規表現 |
| --- | --- | --- |
| 1 | 体験 | `レビュー\|使ってみた\|実際に使\|使い比べ\|検証` |
| 2 | 購入型 | `\d+選\|おすすめ\|オススメ\|ランキング` |
| 3 | 比較 | `比較\|の違い\|違いは\|違いを\|vs\|VS\|どっち\|どちら` |
| 4 | ハウツー | `方法\|やり方\|コツ\|手順\|流れ\|始め方\|使い方\|張り方\|立て方\|洗い方\|手入れ\|選び方\|目安` |
| 5 | 問題解決/その他 | 上記いずれにも該当しない |

「おすすめ5選【2026年版】容量別に比較」のように ○選記事の副題に「比較」「選び方」が付くタイトルが多いため、体験→購入型→比較→ハウツーの順で優先判定（比較を先にすると購入型の約半数が比較へ流れる）。「選び方」「目安」単独（○選・おすすめを含まない）はハウツー扱い。

### アフィリエイトリンク数

- `<ProductCardMdx>` 1枚を1導線として数える。楽天＝`source="rakuten"`（既定）かつ `affiliateUrl` が楽天URL（`#` は数えない）。Amazon＝`amazonUrl` または `amazonAsin` あり、または `source="amazon"` かつ `affiliateUrl` が `#` 以外。
- カード外のリンクはURLドメインで加算（楽天: hb.afl/item/search.rakuten.co.jp、Amazon: amzn.to/amazon.co.jp）。`<ComparisonTableMdx>` の rows に入った `affiliateUrl`（比較表の「楽天で見る」リンク）もここに含まれるため、5選記事は概ね「カード5＋比較表5＝楽天10」になる。商品画像URL（thumbnail.image.rakuten.co.jp）は数えない。
- 参考として A8.net（px.a8.net）のASPリンク数も別途集計（TSVの列には含めない）。

## 記事属性の全体像

### 記事タイプ別

| 記事タイプ | 記事数 | 楽天リンク合計 | Amazonリンク合計 | A8リンク合計 |
| --- | --- | --- | --- | --- |
| 購入型 | 220 | 1392 | 732 | 0 |
| 問題解決/その他 | 26 | 20 | 10 | 16 |
| ハウツー | 17 | 37 | 27 | 6 |
| 比較 | 1 | 0 | 0 | 1 |

### カテゴリ別

| カテゴリ | 記事数 | 楽天リンク合計 | Amazonリンク合計 | A8リンク合計 |
| --- | --- | --- | --- | --- |
| tent | 71 | 315 | 176 | 16 |
| cookware | 39 | 215 | 132 | 0 |
| power | 25 | 164 | 71 | 1 |
| backpack | 20 | 102 | 40 | 5 |
| lighting | 18 | 110 | 64 | 0 |
| bonfire | 31 | 175 | 106 | 0 |
| sleeping-bag | 28 | 154 | 86 | 1 |
| chair-table | 29 | 189 | 89 | 0 |
| clothing | 3 | 25 | 5 | 0 |

### 収益導線の型別（リンク内容から判定）

| 導線 | 記事数 |
| --- | --- |
| 物販のみ | 241 |
| ASPのみ | 23 |

### 公開月別

| 公開月 | 記事数 |
| --- | --- |
| 2024-06 | 4 |
| 2025-04 | 3 |
| 2026-03 | 1 |
| 2026-04 | 36 |
| 2026-05 | 11 |
| 2026-06 | 75 |
| 2026-07 | 28 |
| 2026-08 | 63 |
| 2026-09 | 43 |

### 収益リンクが1本も無い記事（0本）

なし

### 楽天リンクはあるがAmazonリンクが0本の記事: 14本 / 楽天リンクあり231本

## GSC依存の集計（未実施）

### 詰まった点（2026-09-20）

- リポジトリ・`.env.local`・環境変数のいずれにも Search Console API の認証情報（サービスアカウントキー／OAuthトークン）が無い。`gcloud` CLI も未インストール。
- 指示にあった自動化用Chrome（deviceId 68806dea-…）でのGCPコンソール操作は、本セッションにブラウザ操作ツールが接続されていないため実行不可（localhost:9222 等のリモートデバッグ口も無し）。Google Drive 連携も権限未付与で、Drive上のキーファイル探索も不可。
- 対処: `scripts/diagnose-gsc.mjs` は認証情報が揃えば即動く状態にしてある（依存追加なし・SAキーはRS256 JWTを自前署名）。

### 解除手順（人手で1回だけ）

1. GCPコンソール（プロジェクト camp-kit-gsc / 392502212588）→「IAMと管理 > サービスアカウント」でSAを作成（既存があればそれ）→「キー > 鍵を追加 > JSON」でダウンロード。
2. 「APIとサービス > ライブラリ」で **Google Search Console API** を有効化。
3. Search Console（https://www.camp-kit-guide.com/ のプロパティ）→「設定 > ユーザーと権限」で SAの client_email を「制限付き」以上で追加。
4. JSONを `_file/gsc-sa-key.json` に置き（.gitignore 済）、`.env.local` に `GSC_SA_KEY_FILE=_file/gsc-sa-key.json` を追記。
5. `node scripts/diagnose-gsc.mjs` → `node scripts/diagnose-articles.mjs` を実行すると本レポートとTSVのGSC列が埋まる。

以下はGSCデータ取得後に自動生成される（本スクリプト再実行で追記）:

1. 表示ゼロ記事（impressions<10）の数と割合
2. クリック上位20記事
3. カテゴリ別・記事タイプ別の合計clicks/impressionsと1記事あたり平均
4. 順位帯別の記事分布（1-10 / 11-20 / 21-50 / 51以下 / 圏外）
5. 表示があるのに専用記事がないクエリ上位30

