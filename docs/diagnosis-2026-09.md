# CampKit Guide 記事診断レポート（フェーズ1）

- 作成日: 2026-09-20
- 対象記事: 264本（content/posts/*.mdx）
- GSC期間: 2026-06-20 〜 2026-09-17（90日 / プロパティ https://www.camp-kit-guide.com/ / 取得 2026-09-20T11:00:18.187Z）
- GSC取得行数: page 410行 / query 1000行
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

| 記事タイプ | 記事数 | 楽天リンク合計 | Amazonリンク合計 | A8リンク合計 | clicks合計 | impressions合計 | clicks/記事 | impressions/記事 | 表示<10の記事 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 購入型 | 220 | 1434 | 732 | 0 | 1,055 | 28,945 | 4.8 | 132 | 80 |
| ハウツー | 17 | 37 | 29 | 6 | 116 | 4,605 | 6.8 | 271 | 9 |
| 問題解決/その他 | 26 | 20 | 10 | 16 | 27 | 2,080 | 1.0 | 80 | 13 |
| 比較 | 1 | 0 | 0 | 1 | 0 | 4 | 0.0 | 4 | 1 |

### カテゴリ別

| カテゴリ | 記事数 | 楽天リンク合計 | Amazonリンク合計 | A8リンク合計 | clicks合計 | impressions合計 | clicks/記事 | impressions/記事 | 表示<10の記事 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| backpack | 20 | 107 | 40 | 5 | 504 | 11,621 | 25.2 | 581 | 6 |
| tent | 71 | 334 | 178 | 16 | 265 | 10,198 | 3.7 | 144 | 22 |
| sleeping-bag | 28 | 160 | 86 | 1 | 121 | 5,359 | 4.3 | 191 | 9 |
| cookware | 39 | 222 | 132 | 0 | 86 | 2,499 | 2.2 | 64 | 16 |
| chair-table | 29 | 189 | 89 | 0 | 86 | 2,431 | 3.0 | 84 | 14 |
| lighting | 18 | 110 | 64 | 0 | 82 | 1,696 | 4.6 | 94 | 10 |
| power | 25 | 164 | 71 | 1 | 27 | 1,054 | 1.1 | 42 | 8 |
| bonfire | 31 | 180 | 106 | 0 | 21 | 499 | 0.7 | 16 | 18 |
| clothing | 3 | 25 | 5 | 0 | 6 | 277 | 2.0 | 92 | 0 |

### 収益導線の型別（リンク内容から判定）

| 導線 | 記事数 | clicks合計 | impressions合計 | clicks/記事 | impressions/記事 | 表示<10の記事 |
| --- | --- | --- | --- | --- | --- | --- |
| 物販のみ | 241 | 1,178 | 35,136 | 4.9 | 146 | 93 |
| ASPのみ | 23 | 20 | 498 | 0.9 | 22 | 10 |

### 公開月別

| 公開月 | 記事数 | clicks合計 | impressions合計 | clicks/記事 | impressions/記事 | 表示<10の記事 |
| --- | --- | --- | --- | --- | --- | --- |
| 2024-06 | 4 | 1 | 136 | 0.3 | 34 | 2 |
| 2025-04 | 3 | 0 | 5 | 0.0 | 2 | 3 |
| 2026-03 | 1 | 0 | 1 | 0.0 | 1 | 1 |
| 2026-04 | 36 | 154 | 10,053 | 4.3 | 279 | 16 |
| 2026-05 | 11 | 205 | 6,292 | 18.6 | 572 | 3 |
| 2026-06 | 75 | 607 | 15,222 | 8.1 | 203 | 13 |
| 2026-07 | 28 | 8 | 290 | 0.3 | 10 | 16 |
| 2026-08 | 63 | 190 | 2,807 | 3.0 | 45 | 25 |
| 2026-09 | 43 | 33 | 828 | 0.8 | 19 | 24 |

### 収益リンクが1本も無い記事（0本）

なし

### 楽天リンクはあるがAmazonリンクが0本の記事: 14本 / 楽天リンクあり241本

## 1. 表示ゼロ記事（impressions < 10）

- **103本 / 264本（39.0%）**
- うち GSC に行自体が無い（impressions=0）: 24本
- 記事合計: clicks 1,198 / impressions 35,634（記事以外のURL: clicks 2 / impressions 385 / 12URL）
- GSCにあるがMDXが無い /posts/ URL: 3件（camp-sleeping-bag-temperature-guide:83, sleeping-bag-season-guide:69, sleeping-bag-temp-guide:44）

<details><summary>表示ゼロ記事の一覧（103本）</summary>

| slug | タイプ | カテゴリ | 公開日 | imp |
| --- | --- | --- | --- | --- |
| air-frame-tent | 購入型 | tent | 2026-09-15 | 3 |
| autumn-hiking-rental | 問題解決/その他 | backpack | 2026-09-17 | 0 |
| bonfire-furusato | ハウツー | bonfire | 2026-08-06 | 6 |
| bonfire-stand-beginner | 購入型 | bonfire | 2025-04-21 | 0 |
| bonfire-stand-solo | 購入型 | bonfire | 2026-06-02 | 0 |
| bonfire-tripod | 購入型 | bonfire | 2026-08-17 | 6 |
| camp-activity-booking | 問題解決/その他 | tent | 2026-09-11 | 1 |
| camp-activity-booking-flow | ハウツー | tent | 2026-09-16 | 1 |
| camp-burner-beginner | 購入型 | cookware | 2026-04-08 | 0 |
| camp-chair-lightweight | 購入型 | chair-table | 2024-06-05 | 0 |
| camp-coffee-dripper | 購入型 | cookware | 2026-07-29 | 4 |
| camp-cooler-box-beginner | 購入型 | cookware | 2026-04-22 | 0 |
| camp-cooler-box-overall | 購入型 | cookware | 2026-04-27 | 8 |
| camp-electric-grill | 購入型 | power | 2026-09-17 | 0 |
| camp-furusato | 問題解決/その他 | cookware | 2026-08-12 | 4 |
| camp-gift | 問題解決/その他 | tent | 2026-09-08 | 5 |
| camp-grill-plate | 購入型 | bonfire | 2026-05-26 | 2 |
| camp-hammock | 購入型 | chair-table | 2026-06-02 | 1 |
| camp-headlight-beginner | 購入型 | lighting | 2026-04-26 | 0 |
| camp-lantern-led | 購入型 | lighting | 2024-06-15 | 3 |
| camp-lighting-guide | 購入型 | lighting | 2026-04-23 | 9 |
| camp-oil-stove | 購入型 | bonfire | 2026-08-03 | 4 |
| camp-portable-power-beginner | 購入型 | power | 2026-04-23 | 1 |
| camp-rental-flow | ハウツー | tent | 2026-08-27 | 7 |
| camp-rental-trouble | 問題解決/その他 | tent | 2026-08-24 | 7 |
| camp-rice-cooker | 購入型 | cookware | 2026-09-17 | 0 |
| camp-sleeping-mat | 購入型 | sleeping-bag | 2026-03-25 | 1 |
| camp-tarp-beginner | 購入型 | tent | 2026-04-24 | 4 |
| captain-stag-bonfire | 購入型 | bonfire | 2026-08-24 | 8 |
| captain-stag-chair | 購入型 | chair-table | 2026-06-15 | 8 |
| cassette-gas-heater | 購入型 | bonfire | 2026-08-10 | 0 |
| chair-table-furusato | 問題解決/その他 | chair-table | 2026-08-03 | 4 |
| co-checker | 購入型 | bonfire | 2026-08-10 | 4 |
| coleman-two-burner | 購入型 | cookware | 2026-06-01 | 0 |
| compact-portable-power | 購入型 | power | 2026-07-28 | 4 |
| cookware-furusato | 問題解決/その他 | cookware | 2026-08-26 | 1 |
| cooler-box-day-camp | 購入型 | cookware | 2026-05-26 | 0 |
| cooler-furusato | ハウツー | cookware | 2026-07-31 | 4 |
| cooler-stand | 購入型 | chair-table | 2026-09-11 | 0 |
| day-camp-grill | 購入型 | bonfire | 2026-04-27 | 0 |
| day-camp-led-lantern | 購入型 | lighting | 2026-04-27 | 0 |
| disaster-portable-power | 購入型 | power | 2026-08-19 | 6 |
| dod-tent | 購入型 | tent | 2026-06-02 | 1 |
| electric-blanket-camp | 購入型 | power | 2026-06-08 | 3 |
| family-camp-tent | 購入型 | tent | 2026-04-28 | 0 |
| fireproof-chair | 購入型 | chair-table | 2026-08-31 | 2 |
| folding-cutting-board | 購入型 | cookware | 2026-08-14 | 7 |
| fuji-climb-rental-vs-buy | 比較 | backpack | 2026-09-10 | 4 |
| furusato-camp-guide | 問題解決/その他 | tent | 2026-08-04 | 0 |
| furusato-shipping-timing | 問題解決/その他 | tent | 2026-09-14 | 5 |
| gas-lantern | 購入型 | lighting | 2026-08-13 | 4 |
| gentos-light | 購入型 | lighting | 2026-06-15 | 7 |
| group-camp-rental | 問題解決/その他 | tent | 2026-09-15 | 2 |
| group-camp-table | 購入型 | chair-table | 2026-04-23 | 5 |
| hanging-rack | 購入型 | chair-table | 2026-08-19 | 5 |
| infinity-chair | 購入型 | chair-table | 2026-07-28 | 5 |
| isuka-sleeping-bag | 購入型 | sleeping-bag | 2026-09-16 | 1 |
| lantern-furusato | 問題解決/その他 | lighting | 2026-08-24 | 6 |
| large-tent-guide | ハウツー | tent | 2026-05-26 | 5 |
| lightweight-mountain-tent | 購入型 | tent | 2026-04-29 | 6 |
| log-carrier | 購入型 | bonfire | 2026-08-07 | 1 |
| logos-sleeping-bag | 購入型 | sleeping-bag | 2026-09-07 | 9 |
| low-style-bonfire | 購入型 | bonfire | 2026-09-15 | 2 |
| low-style-chair | 購入型 | chair-table | 2026-09-11 | 2 |
| low-style-table | 購入型 | chair-table | 2026-06-02 | 7 |
| montbell-sleeping-bag | 購入型 | sleeping-bag | 2026-07-22 | 4 |
| moraknife | 購入型 | cookware | 2026-07-29 | 2 |
| mountain-camp-mat | 購入型 | sleeping-bag | 2026-04-25 | 0 |
| northface-backpack | 購入型 | backpack | 2026-07-24 | 8 |
| oil-lantern | 購入型 | lighting | 2026-07-27 | 3 |
| outdoor-coffee-mill | 購入型 | cookware | 2026-08-12 | 2 |
| outdoor-kitchen-table | 購入型 | chair-table | 2026-08-12 | 2 |
| outdoor-wagon | 購入型 | chair-table | 2026-08-03 | 5 |
| petzl-headlight | 購入型 | lighting | 2026-09-16 | 5 |
| portable-cooler-aircon | 購入型 | power | 2026-07-31 | 2 |
| portable-power-vehicle-camp | 購入型 | power | 2026-04-24 | 3 |
| power-furusato | ハウツー | power | 2026-07-31 | 2 |
| rectangle-sleeping-bag | 購入型 | sleeping-bag | 2026-06-08 | 4 |
| screen-tarp | 購入型 | tent | 2026-07-27 | 5 |
| secondary-combustion-bonfire | 購入型 | bonfire | 2026-06-08 | 4 |
| sierra-cup | 購入型 | cookware | 2026-06-08 | 8 |
| sleeping-bag-summer-cospa | 購入型 | sleeping-bag | 2025-04-21 | 5 |
| sleeping-bag-winter-beginner | 購入型 | sleeping-bag | 2026-04-25 | 4 |
| snowpeak-bonfire | 購入型 | bonfire | 2026-07-23 | 7 |
| snowpeak-lantern | 購入型 | lighting | 2026-09-16 | 1 |
| snowpeak-tent | 購入型 | tent | 2026-07-22 | 5 |
| solo-camp-cot | 購入型 | chair-table | 2026-06-02 | 0 |
| solo-gear-rental | 問題解決/その他 | tent | 2026-08-28 | 6 |
| solo-tent-beginner | 購入型 | tent | 2025-04-21 | 0 |
| solo-tent-overall | 購入型 | tent | 2026-04-29 | 9 |
| soup-jar-camp | 購入型 | cookware | 2026-09-11 | 8 |
| stove-fan | 購入型 | bonfire | 2026-09-18 | 0 |
| stove-guard | 購入型 | bonfire | 2026-09-17 | 0 |
| tent-furusato | ハウツー | tent | 2026-07-31 | 1 |
| tent-wood-stove | 購入型 | bonfire | 2026-07-30 | 7 |
| thermal-bottle | 購入型 | cookware | 2026-08-11 | 3 |
| trekking-pole | 購入型 | backpack | 2026-08-25 | 6 |
| uniflame-fire-grill | 購入型 | bonfire | 2026-07-27 | 0 |
| vastland-tent | 購入型 | tent | 2026-06-08 | 3 |
| washable-sleeping-bag | 購入型 | sleeping-bag | 2026-09-15 | 6 |
| winter-camp-guide | ハウツー | tent | 2026-09-08 | 5 |
| yamadougu-rental-flow | ハウツー | backpack | 2026-09-04 | 6 |
| yamadougu-rental-trouble | 問題解決/その他 | backpack | 2026-09-18 | 0 |

</details>

## 2. クリック上位20記事

| # | slug | タイプ | カテゴリ | 公開日 | clicks | imp | CTR | pos | 楽天/Amz/A8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | osprey-backpack | 購入型 | backpack | 2026-06-15 | 158 | 3,860 | 4.09% | 8.2 | 8/4/0 |
| 2 | osprey-daily-backpack | 購入型 | backpack | 2026-08-07 | 110 | 1,256 | 8.76% | 4.8 | 5/5/0 |
| 3 | camp-backpack-capacity-guide | ハウツー | backpack | 2026-05-25 | 92 | 3,724 | 2.47% | 8.5 | 3/3/0 |
| 4 | mountain-camp-lantern | 購入型 | lighting | 2026-05-26 | 63 | 1,312 | 4.80% | 9.0 | 6/6/0 |
| 5 | family-camp-summer-tent | 購入型 | tent | 2026-04-23 | 54 | 3,816 | 1.42% | 9.9 | 5/3/0 |
| 6 | fieldoor-tent | 購入型 | tent | 2026-06-08 | 54 | 1,257 | 4.30% | 5.9 | 10/5/0 |
| 7 | inflatable-mat | 購入型 | sleeping-bag | 2026-06-02 | 48 | 1,328 | 3.61% | 11.4 | 10/2/0 |
| 8 | mysteryranch-backpack | 購入型 | backpack | 2026-06-15 | 34 | 632 | 5.38% | 8.2 | 8/2/0 |
| 9 | karrimor-backpack | 購入型 | backpack | 2026-06-15 | 34 | 553 | 6.15% | 7.2 | 8/4/0 |
| 10 | kids-sleeping-bag | 購入型 | sleeping-bag | 2026-04-28 | 32 | 1,822 | 1.76% | 23.4 | 5/1/0 |
| 11 | coleman-chair | 購入型 | chair-table | 2026-06-15 | 28 | 1,374 | 2.04% | 7.3 | 10/3/0 |
| 12 | soto-burner | 購入型 | cookware | 2026-06-15 | 25 | 1,568 | 1.59% | 6.8 | 10/5/0 |
| 13 | gregory-backpack | 購入型 | backpack | 2026-06-15 | 22 | 429 | 5.13% | 8.5 | 10/4/0 |
| 14 | deuter-backpack | 購入型 | backpack | 2026-06-15 | 19 | 222 | 8.56% | 7.9 | 10/1/0 |
| 15 | tent-size-beginner-guide | ハウツー | tent | 2026-05-25 | 17 | 693 | 2.45% | 8.1 | 3/3/0 |
| 16 | mountain-backpack-30l | 購入型 | backpack | 2026-04-23 | 17 | 383 | 4.44% | 13.0 | 5/4/0 |
| 17 | naturehike-tent | 購入型 | tent | 2026-06-02 | 15 | 234 | 6.41% | 6.1 | 10/2/0 |
| 18 | waterproof-backpack | 購入型 | backpack | 2026-06-08 | 14 | 266 | 5.26% | 10.1 | 10/1/0 |
| 19 | family-camp-cot | 購入型 | chair-table | 2026-06-08 | 13 | 43 | 30.23% | 4.7 | 10/2/0 |
| 20 | solo-tent-lightweight | 購入型 | tent | 2026-04-28 | 12 | 1,682 | 0.71% | 30.0 | 5/5/0 |

上位20記事でクリック合計の 71.9% を占める。

## 3. カテゴリ別・記事タイプ別の合計と1記事あたり平均

「記事属性の全体像」の各表に clicks合計 / impressions合計 / 1記事あたり平均 を併記済み。

## 4. 順位帯別の記事分布（impressions加重平均順位）

| 順位帯 | 記事数 | 割合 | clicks合計 | impressions合計 |
| --- | --- | --- | --- | --- |
| 1-10位 | 191 | 72.3% | 1,018 | 26,416 |
| 11-20位 | 35 | 13.3% | 121 | 3,765 |
| 21-50位 | 14 | 5.3% | 59 | 5,453 |
| 51位以下 | 0 | 0.0% | 0 | 0 |
| 圏外（表示なし） | 24 | 9.1% | 0 | 0 |

### 順位帯 × 記事タイプ（記事数）

| 順位帯 | 購入型 | ハウツー | 問題解決/その他 | 比較 |
| --- | --- | --- | --- | --- |
| 1-10位 | 161 | 13 | 16 | 1 |
| 11-20位 | 29 | 2 | 4 | 0 |
| 21-50位 | 9 | 2 | 3 | 0 |
| 51位以下 | 0 | 0 | 0 | 0 |
| 圏外（表示なし） | 21 | 0 | 3 | 0 |

## 5. 表示があるのに専用記事がないクエリ（上位30）

照合方法: クエリを空白分割し汎用語（おすすめ・キャンプ・2026 等）を除いたトークンが、いずれか1記事の「タイトル＋tags＋slug」に全て含まれれば専用記事あり。ひらがな/カタカナ・全半角は正規化。判定は機械的なので、上位から目視で確認すること。

- 取得クエリ 1000件のうち専用記事なし判定: 562件

| # | query | clicks | imp | CTR | pos |
| --- | --- | --- | --- | --- | --- |
| 1 | リュック 10リットル どのくらい | 3 | 118 | 2.54% | 7.1 |
| 2 | オスプレイ リュック | 3 | 68 | 4.41% | 8.9 |
| 3 | 子供の寝袋 | 0 | 62 | 0.00% | 31.8 |
| 4 | 子供寝袋 | 0 | 49 | 0.00% | 36.9 |
| 5 | サイズテント | 0 | 48 | 0.00% | 19.5 |
| 6 | オスプレイ デイパック | 1 | 47 | 2.13% | 10.5 |
| 7 | 一人用テント 軽い | 0 | 47 | 0.00% | 32.9 |
| 8 | シュラフ 快適温度 10度 | 0 | 44 | 0.00% | 24.7 |
| 9 | シュラフ 快適温度-10度 | 0 | 44 | 0.00% | 25.5 |
| 10 | 子供用シュラフ | 0 | 44 | 0.00% | 34.7 |
| 11 | シュラフ 快適温度 冬 | 0 | 43 | 0.00% | 21.4 |
| 12 | テント一人用 軽量 | 0 | 43 | 0.00% | 34.3 |
| 13 | テント 一人用 軽い | 0 | 41 | 0.00% | 35.0 |
| 14 | ソロキャンプ テント 前室あり 軽量 | 0 | 40 | 0.00% | 35.5 |
| 15 | オスプレー バック パック 通勤 | 5 | 38 | 13.16% | 4.7 |
| 16 | シュラフ 快適温度 5度 | 0 | 38 | 0.00% | 26.6 |
| 17 | 最軽量テント 一人用 | 0 | 38 | 0.00% | 36.3 |
| 18 | 最軽量テント一人用 | 0 | 38 | 0.00% | 37.4 |
| 19 | オスプレー ザック おすすめ | 4 | 36 | 11.11% | 6.1 |
| 20 | インフレーターマット エアマット 違い | 0 | 36 | 0.00% | 28.6 |
| 21 | 一人用軽量テント | 0 | 36 | 0.00% | 33.7 |
| 22 | テント 一人用 超軽量 | 0 | 35 | 0.00% | 33.9 |
| 23 | シュラフ 快適温度5度 | 0 | 34 | 0.00% | 23.3 |
| 24 | 寝袋 暖かさ | 0 | 34 | 0.00% | 19.4 |
| 25 | シュラフ 春 | 0 | 33 | 0.00% | 38.1 |
| 26 | 寝袋 暑い | 0 | 33 | 0.00% | 40.4 |
| 27 | シュラフ 快適温度 0度 | 0 | 28 | 0.00% | 37.9 |
| 28 | 富士山 リュック 30l | 1 | 27 | 3.70% | 11.7 |
| 29 | 寝袋 重さ | 0 | 27 | 0.00% | 44.6 |
| 30 | オスプレー 日帰りザック | 0 | 24 | 0.00% | 8.1 |

