# camp-kit-guide SEO施策ログ

数値の推移はGAS「SEOレポート」の履歴で追う。本ファイルは「いつ・どの記事を・なぜ・どう変えたか」を記録し、次回レポートで効果を評価するための施策台帳。新しい施策は上に追記する。

---
## 2026-07-27：FAIL5記事を楽天実データでアフィリリンク化（screen-tarp / water-jug / cooler-ice-pack / fireproof-gloves / hand-axe）

- **背景**: 2026-07-27の新規5記事は初回公開時 `affiliateUrl="#"`（ドラフト）で、本番検証のアフィリリンク項目がFAILしていた（収益導線なし）。楽天API実データでリンク化し収益化する。
- **取得**: 現行エンドポイント（openapi.rakuten.co.jp/.../20260701、applicationId＋accessKey、Referer＋Origin、hits=30・sort=-reviewCount、8秒間隔）でメインKW検索。採用基準＝レビュー10件以上・評価4.0以上／価格帯5倍以内／KW用途一致／ブランド多様性。アフィリURLは `hb.afl.rakuten.co.jp` 形式に統一。products.tsv に25行追記し、実データを ProductCardMdx へ注入。**description・badge・本文プロース・比較表・まとめ表・intro/FAQの価格帯まで実商品に合わせて全面整合**（ドラフトの架空ブランド名を実売品に置換）。
- **各記事の採用5品と価格比**:
  - screen-tarp（tent）: FIELDOOR 285×285 ¥9,460／FIELDOOR ワンタッチ285 ¥13,860／YOCABITO 3m×3m ¥25,980／YOCABITO ワイド4m×2.8m ¥19,980／YOCABITO 2.5m(サイドシート) ¥10,780。価格比2.75倍。**供給がFIELDOOR・YOCABITOの2ブランドに集中**（レビュー10件以上・評価4.0以上を満たす他ブランドが楽天に存在せず）。intro/metaで「実在定番5ブランド」表現を実態に修正。
  - water-jug（cookware）: FIELDOOR 折りたたみタンク15L ¥1,650／アレジア アイスコンテナ ¥5,980／VASTLAND アイスコンテナ ¥3,980／FIELDOOR アイスコンテナ3.8L ¥4,950／大容量タンク10-20L ¥2,180。価格比3.62倍。真空断熱ジャグと大容量タンクを用途で整理。
  - cooler-ice-pack（cookware）: ステンレス保冷剤S/M ¥2,980／ステンレス保冷剤(長時間) ¥1,680／ロゴス 倍速凍結・氷点下パック ¥770／業務用蓄冷剤-16℃ ¥1,320／保冷剤ハードM/L/XL ¥1,180。価格比3.87倍。**KW「保冷剤 キャンプ」はクールリング(ネッククーラー)・クーラーボックス・カイロが多数混入するため追加KW（保冷剤 氷点下／ロゴス 保冷剤 等）で真の保冷剤のみに絞り込み**、混入品を全除外。
  - fireproof-gloves（bonfire）: 耐火グローブ(革) ¥1,550／ZEN Camps 焚き火グローブ ¥3,280／TRAN 耐熱グローブ本革 ¥1,480／morso 薪ストーブグローブ ¥4,180／耐熱グローブ ロング牛革 ¥2,280。価格比2.82倍。全品を耐熱・耐火用途で統一（防寒/スキー/ペット手袋は除外）。morsoは右手用・左手用の片手売りである旨を明記。
  - hand-axe（bonfire）: OUTBEAR キャンプ斧 ¥2,980／ハスクバーナ38cm ¥7,523／プラウ ハンマー斧 ¥1,984／アストロプロダクツ600g ¥2,409／ハスクバーナ ハチェットヤンキー700g ¥5,980。価格比3.79倍。刃物ジャンルのため**FAQの持ち運び法令注意（軽犯罪法・銃刀法／シース携行）は維持**。
- **ビルド**: `npm run build` EXIT=0。全記事 ProductCard×5・比較表・FAQ5問・まとめ表を維持。「要確認」プレースホルダは全廃。
- **測定**: 反映後1〜2週間で各メインKWの掲載順位・表示・クリックとアフィリCVを確認。

---
## 2026-07-27：内部リンク強化 kids-sleeping-bag（子供用寝袋）テコ入れ

- **背景（GSC実データ／過去28日）**: 「子供 寝袋」「寝袋 子供用」「子供の寝袋」「子ども 寝袋」「こども 寝袋」「キッズ 寝袋」「幼児 寝袋」「シュラフ 子供用」等の表記ゆれクラスタで**合計180表示超**あるが、対応記事 `kids-sleeping-bag` の掲載順位が**23〜33位（page3〜4）でクリック0**。埋蔵需要が最大の損失ポイント。
- **診断**: 記事本文はFAQ5問・比較表・年齢別早見表・封筒vsマミー・ブランド解説・実売5モデルと**内容は既に充実**。本文カニバリも無し（子供×寝袋の主対応ページは kids-sleeping-bag 単独）。順位停滞の主因は**若いドメインの権威不足＋商用KWの競合の強さ**（my-best/hinata/大手EC）で、オンページ欠陥ではないと判断。
- **施策（低リスク・非破壊）**: 最も効くレバーとして、**トピック的に最適なファミリー系記事から kids-sleeping-bag への内部リンクを追加**し内部リンク流入経路と関連性シグナルを強化。ProductCard等の収益データ（rafcidアフィリリンク・価格・レビュー）には一切触れず、締めパラグラフに文脈リンクを1文追記のみ。
  - `family-camp-tent` / `family-camp-mat` / `family-camp-cot` / `family-summer-large-tent` の4記事 → kids-sleeping-bag へ文脈リンク追加（従来リンク元は family-camp-summer-tent / inflatable-mat / rectangle-sleeping-bag / sleeping-bag-temperature-guide / sleeping-bag-winter-beginner の5本のみだった）。
- **期待値（正直な見立て）**: 内部リンク単体での page3→page1 効果は限定的。ドメイン権威の自然な立ち上がりと合わせた底上げが目的で、劇的改善は見込まない。効果が薄ければ次サイクルで本文の差別化リライト（逆算型：年齢→温度/サイズ/タイプの意思決定フロー強化）を検討。
- **測定**: 反映後1〜2週間でGSCの「子供 寝袋」系クラスタの掲載順位・表示回数・クリックを再測定。

---
## 2026-07-27：新規記事 cooler-ice-pack（保冷剤）／hand-axe（キャンプ用手斧）追加

- **対象記事**: `content/posts/cooler-ice-pack.mdx`（category=cookware）／`content/posts/hand-axe.mdx`（category=bonfire）。product-scan バックログ④B 保冷剤・⑤B 手斧を消化。
- **狙い**:
  - cooler-ice-pack＝盛夏のクーラー保冷力強化需要（priority=B）。既存クーラー記事群の周辺補完として、保冷剤単体KWを新規開拓。内部リンク（camp-cooler-box-overall / camp-cooler-soft / water-jug）。低単価だが検索需要が大きく、クーラー系からの回遊も見込む。
  - hand-axe＝秋の薪割り需要立ち上がり（priority=B）。焚き火グローブ・火ばさみと並ぶ焚き火周辺装備。内部リンク（bonfire-stand-beginner / fire-tongs / fireproof-gloves）。**刃物ジャンルのため、FAQに持ち運びの法令注意（軽犯罪法・銃刀法／正当な理由・シース携行）を必須で明記**。
- **変更内容**:
  - cooler-ice-pack：実在定番5製品（ロゴス 氷点下パックXL／ロゴス 倍速凍結・氷点下パックM／キャプテンスタッグ 抗菌クールパックM／ダイワ クールインパクト-16℃／アイリスオーヤマ 保冷剤ハード）を保冷タイプ・ハード/ソフト・特徴で比較。実勢800〜2,600円（≈3.25倍）。ロゴスは保冷剤の寡占ブランドのため2製品採用（CLAUDE.md ブランド占有緩和の対象）。FAQ5問＋まとめ表。
  - hand-axe：実在定番5製品（ハスクバーナ／フィスカースX7／エストウィング キャンパーズアックス／千吉／VASTLAND）を柄の素材・重量感・特徴で比較。実勢2,500〜7,500円（≈3.00倍）。FAQ5問（構造の違い／初心者向け重量／**法令**／メンテ／価格差）＋まとめ表。
- **データ状態（要フォロー）**: 2本とも新規ドラフトのため価格は参考実勢値、`affiliateUrl="#"`・商品画像なし・レビュー件数は捏造回避で未掲載。**後段の三者分業Amazonリンク化＋楽天API実データ化で差し替える**こと。
- **測定**: 反映後1〜2週間でGSCの「保冷剤 キャンプ」「キャンプ 手斧／薪割り 斧」系クエリのインデックス・順位を確認。

---
## 2026-07-27：新規記事 water-jug（ウォータージャグ）／fireproof-gloves（焚き火グローブ）追加

- **対象記事**: `content/posts/water-jug.mdx`（category=cookware）／`content/posts/fireproof-gloves.mdx`（category=bonfire）。screen-tarp に続き product-scan バックログ上位を消化（②A ウォータージャグ、③B 焚き火グローブ）。
- **狙い**:
  - water-jug＝盛夏の給水・保冷需要（priority=A）。既存クーラー系・ケトルとは「給水タンク」という別用途で差別化し非カニバリ。内部リンク（camp-cooler-box-overall / camp-kettle-recommend / camp-table-folding）。
  - fireproof-gloves＝秋の焚き火シーズン立ち上がり（priority=B）。既存 winter-camp-gloves（clothing＝防寒）とは「耐熱・火傷防止」という用途で明確に差別化。内部リンク（bonfire-stand-beginner / fire-tongs / bonfire-sheet）。
- **変更内容**:
  - water-jug：実在定番5製品（スタンレー3.8L／イグルー2ガロン／コールマン1ガロン／キャプテンスタッグ5L／サーモス2.0L）を容量・保冷構造・コック形状で比較。実勢3,000〜12,100円（最高÷最低≈4.03倍、5倍以内でOK）。FAQ5問＋用途別まとめ表。
  - fireproof-gloves：実在定番5製品（グリップスワニーG-1／ユニフレームUFレザー／ロゴス防炎ロング／キャプテンスタッグ牛革／コールマンレザー）を素材・長さ・特徴で比較。実勢1,800〜6,600円（≈3.67倍）。FAQ5問＋用途別まとめ表。
- **データ状態（要フォロー）**: 3本とも新規ドラフトのため価格は参考実勢値、`affiliateUrl="#"`・商品画像なし・レビュー件数は捏造回避で未掲載。**後段の三者分業Amazonリンク化＋楽天API実データ化で差し替える**こと。
- **測定**: 反映後1〜2週間でGSCの「ウォータージャグ」「焚き火グローブ／耐熱グローブ」系クエリのインデックス・順位を確認。

---
## 2026-07-27：新規記事 screen-tarp（スクリーンタープ）追加

- **対象記事**: `content/posts/screen-tarp.mdx`（新規／category=tent）
- **狙い**: product-scan バックログ最上位（priority=A）を消化。盛夏の「虫・暑さ対策リビング」需要ピークを狙った季節KW。既存タープ系9記事（camp-tarp-beginner / one-touch-tarp / hexa-tarp / large-tarp-recommend / day-camp-tarp-cheap / car-side-tarp / dod-tarp / tarp-pole）とは「四方メッシュの防虫シェルター」という用途で差別化し、非カニバリを狙う。関連記事へ内部リンク（one-touch-tarp / hexa-tarp / coleman-tent）。
- **変更内容**: 実在定番5製品（コールマン スクリーンキャノピージョイントタープ3／ロゴス neos クイックジオシェルター 490-BD／クイックキャンプ ワンタッチスクリーンタープ 3.0m／FIELDOOR ワンタッチタープ メッシュシート付 3.0m／キャプテンスタッグ CSクラシックス スクリーンタープ）を、メッシュ面数・設営方式・フルクローズ性で比較。実勢価格帯13,800〜32,000円（最高÷最低≈2.3倍、KW整合性チェックOK）。FAQ5問（構造の違い／価格差／夏の暑さ／設営／冬対応）＋用途別まとめ表。
- **データ状態（要フォロー）**: 新規ドラフトのため価格は参考実勢値、`affiliateUrl="#"`・商品画像なし。レビュー件数は捏造回避のため未掲載。**後段の三者分業Amazonリンク化フロー＋楽天API実データ化で、リンク・画像・実売価格を差し替える**こと。
- **測定**: 反映後1〜2週間でGSCの「スクリーンタープ」「メッシュタープ」系クエリのインデックス・順位を確認。

---
## SEOレポート定期実施スケジュール（2週間ごと）

GASメニュー「📊 SEOレポート」を手動実行し、SEO履歴シートと本ログを日付で突き合わせて効果測定する。

- 実施頻度: 2週間ごと
- 最初の施策日: 2026-06-08〜09（タイトル変更3記事＋6記事ブラッシュアップ＋監視体制構築）
- 第1回効果測定の目安: 2026-06-22〜29
- 次回実施予定日: 2026-07-07（6/23実施済みのため2週間後に更新）
- 測定時の確認項目: ①タイトル変更3記事（camp-tarp-beginner / tent-size-beginner-guide / mountain-camp-lantern）のCTR・順位改善 ②6月以降に追加した新規記事のインデックス状況 ③テコ入れ判定（CTR改善候補=順位≤10かつCTR<3%、順位押し上げ候補=順位11-20かつ表示≥10）
- 実施したら本欄の「次回実施予定日」を2週間後に更新する

---

## 2026-07-24：kids-sleeping-bag 全面リライト／mountain-camp-lantern 軽量比較表追加（GSC実測ベース）

### 狙い（GSC 過去28日実測）

| 記事 | 表示 | 平均順位 | CTR | 施策 |
|---|---:|---:|---:|---|
| kids-sleeping-bag | 264 | 22.2 | 1.5% | サイト2位の表示数なのに埋もれ → 全面リライト |
| mountain-camp-lantern | 204 | 8.7 | - | 取りこぼし「登山 ランタン 軽量」(14表示/9.4位)獲得 |

### kids-sleeping-bag

- title を「子供用寝袋おすすめ7選【2026】コールマン・モンベルも｜年齢別の選び方」に変更。description も年齢・身長別軸へ刷新
- 構成刷新：大人用代用の可否 → 選び方4ポイント → **年齢・身長別早見表** → 封筒型vsマミー型 → おすすめ5選 → 定番ブランド解説 → 比較表 → FAQ5問 → 用途別まとめ
- 商品を**楽天API実データで全面差し替え**（取得 2026-07-24）。アフィリURLは `hb.afl.rakuten.co.jp` 形式に統一
- author は Organization「CampKit Guide編集部」に統一（個人の監修者は捏造しない。実在者確定後に reviewer 追加予定）
- 内部リンク：統合ピラー／inflatable-mat／family-camp-summer-tent へ設置し、後者2記事からの**相互リンクも追加**

⚠️ **供給上の重要な発見**：草稿で1〜3位に置いていた**コールマン キッズマミーアジャスタブル／モンベル ホローバッグ Kid's／ナンガ KIDS は、楽天市場に採用基準（レビュー10件以上・評価4.0以上）を満たす新品出品が存在しなかった**（コールマンは4件すべて中古・レビュー0、モンベルは1件のみ中古・レビュー0、ナンガはキッズ寝袋がSQUARE FOOT 300 ¥33,000のレビュー0のみ）。捏造を避けるため、この3ブランドは**商品カードを作らず解説セクションに格下げ**し、公式ストアでの確認を促す形にした。ランキングは実データを確認できた5製品で構成。

### mountain-camp-lantern

- title を「登山用ランタンおすすめ｜150g以下の超軽量LEDを重量順で比較【2026】」に変更（全対象20〜86gで事実）
- **軽量ランキング比較表（重量g昇順）**を新設。重量／明るさ／点灯時間／防水等級／充電方式／価格をメーカー公称値で掲載
- 超軽量枠として 5050WORKSHOP マイクロライト（20g）を追加。ただし楽天のレビューが1件以下で採用基準を満たさないため**比較表のみ・カードなし**、理由を本文に明記
- **ゴールゼロ ライトハウスマイクロフラッシュ（68g/150lm、¥7,480 ★4.49・245件）を商品カード化**（楽天API実データ）
- 既存比較表の防水「記載なし」→「メーカー公称なし」に変更（不明を正直表記）
- 選び方ポイント1の重量基準を「100〜200g以下」→「150g以下」に修正しタイトルと整合

### 技術メモ（重要）

楽天API は旧 `app.rakuten.co.jp/services/api/...` が廃止済み。現行 `openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701` は `applicationId` + `accessKey` に加えて **`Referer` と `Origin` の両方のヘッダが必須**（`Referer` のみだと 403 `REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING`）。`docs/scheduled-task-spec.md` には Referer のみ記載だったため追記した。連続リクエストは 429 になるため 8秒以上の間隔を空ける。

### 効果測定

反映後1〜2週間（目安 2026-08-07）に GSC で再測定。kids-sleeping-bag は順位22.2位からの押し上げとCTR1.5%からの改善、mountain-camp-lantern は「登山 ランタン 軽量」の順位9.4位からトップ3入りを観測する。

---

## 2026-07-24：寝袋「選び方」系3記事をピラーへ統合（カニバリ解消）

### 狙い

GSC実測（過去28日）で、寝袋の選び方クエリが3記事に票を分散させていた。同一検索意図に対して自サイト内で競合し、どれも上位に抜けきれない典型的なカニバリ状態のため、1本の権威ページへシグナルを集約する。

| 統合元 | 表示 | 平均順位 | クリック |
|---|---:|---:|---:|
| camp-sleeping-bag-temperature-guide | 33 | 8.5 | - |
| sleeping-bag-season-guide | 33 | 9.8 | 0 |
| sleeping-bag-temp-guide | 29 | 8.8 | - |

### 変更内容

- **統合先（ハブ）**: `/posts/sleeping-bag-temperature-guide`
  - title を「寝袋（シュラフ）の選び方 完全ガイド【2026年版】快適温度・季節別」に変更（旧: キャンプの寝袋（シュラフ）の温度別選び方完全ガイド【2026年版】）
  - description を統合内容に合わせて刷新（EN13537・快適温度/下限温度・季節別・3シーズンを明示）
  - 構成: EN13537の4指標 → 快適温度（コンフォート）と下限温度（リミット）の読み分け → 春夏秋冬の適正温度早見表 → 3シーズン用の絞り込み4ステップ → 冬用おすすめ5選 → 比較表 → FAQ5問 → まとめ表
  - 既存5商品のアフィリリンク（楽天 rafcid ＋ `amzn.to` 4件）は温存
  - `updatedAt` を 2026-07-24 に更新（`date` は初回公開日 2026-04-23 のまま）
  - 冒頭に編集主体表記を追加（author は Organization「CampKit Guide編集部」に統一。実在の監修者が確定したら reviewer として後日追加）
- **統合元3本を削除**し、`next.config.ts` の `redirects()` でハブへ恒久リダイレクト
  - Next.js の `permanent: true` は **308** を返す（301と同等にシグナル統合される。POST時のメソッド保持のための仕様）
  - ⚠️ この3スラッグはリダイレクト元として予約済み。**新規記事に再利用しないこと**
- **内部リンク8参照を張替え**（nanga-sleeping-bag / naturehike-sleeping-bag ×2 / rectangle-sleeping-bag ×2 / sleeping-bag-winter-beginner ×2 / solo-camp-cot）。旧2リンク併記だった箇所はハブ1本に集約
- 記事数 140→137、sleeping-bag カテゴリ 19→16

### 効果測定

反映後1〜2週間（目安 2026-08-07）で、GSCの「寝袋 選び方」「シュラフ 温度」「寝袋 季節」「3シーズン 寝袋」系クエリの順位・表示・クリックを再測定する。観測点は、分散していた表示数がハブに集約されて平均順位が8.5〜9.8位から押し上がるか。

---

## 2026-07-23

### 楽天API実データ記事2本追加（takibi-table / snowpeak-bonfire）

**狙い**: keyword-backlog の優先度A・status=pending だった2KWを、7/22に確立した楽天API実データフローで記事化する。いずれも既存記事とカニバらない独立KWで、手薄カテゴリ（chair-table / bonfire）の補強を兼ねる。記事数136→138。

- **#1 takibi-table（新規・chair-table）**: KW「焚き火テーブル」（購入型／初〜中級・中価格帯）。楽天の実レビュー実績5点を採用（ユニフレーム 682104 8,800円★4.79(431) ／ PYKES PEAK キャンプラック3セット 5,680円★4.58(173) ／ キャンピングムーン 耐熱焚き火テーブル 2,180円★4.49(51) ／ YOLER メッシュ 3,890円★4.49(41) ／ BUNDOK マルチ焚き火テーブルII BD-274 11,000円★4.21(29)）。**価格整合: 最高11,000÷最低2,180＝5.05倍**で、KW整合性ルールの「5倍以内」をわずかに超過（後述）。差別化軸は「天板素材（ステンレス／メッシュ）× タイプ（サイド／ラック／囲む型）」の2軸整理。
- **#2 snowpeak-bonfire（新規・bonfire）**: KW「スノーピークの焚き火台」（ブランド型／中〜上級・高価格帯）。ブランド軸記事のため**ブランド占有ルール緩和を適用**し、焚火台 S/M/L 本体3点＋M/Lスターターセット2点の5構成で比較（M ST-033R 14,692円★4.76(41) ／ S ST-031R 11,880円★4.84(19) ／ L ST-032RS 21,120円★4.67(12) ／ SET-111 21,780円★4.53(15) ／ SET-112S 27,280円★4.78(93)）。価格整合 27,280÷11,880＝2.3倍。差別化軸は「人数（S/M/L）× 本体単品かスターターセットか」。グリルブリッジ・炭床等の拡張パーツは本体と区別して「関連アイテム」として言及。
- **内部リンク**: takibi-table → camp-table-folding / camp-table-set / bonfire-stand-beginner。snowpeak-bonfire → coleman-bonfire / bonfire-stand-beginner / bonfire-sheet。いずれもリンク先の実在を確認済み。
- **thumbnail**: 7/22のサムネイル正常化方針どおり `/images/outdoor-08.png`（takibi-table）／`/images/outdoor-03.png`（snowpeak-bonfire）を設定。商品画像URLは使用しない。
- **Amazon**: 両記事の全10商品を `_file/amazon-link-worksheet.tsv` に登録（Amazon存在確認済／amzn.to未発行）。次回バッチで `amazonUrl` を注入する。
- **keyword-backlog**: 両KWの status を pending → done に更新。
- ⚠️ **要確認（takibi-table）**: 5商品の価格レンジが5.05倍とCLAUDE.mdの整合性ルール上限をわずかに超えている。最高値のBUNDOK BD-274（11,000円・囲む型）は用途が他4点（サイド置き）と異なるため許容範囲と判断したが、次回テコ入れ時に中価格帯モデルへの差し替えを検討する。
- **効果測定**: 次回GSC測定でインデックス状況と初期表示回数を確認。特に「焚き火テーブル」は競合が多いビッグKWのため、初動の掲載順位を主要観測点とする。

---

## 2026-07-22

### 楽天API実データ化フローの確立＋実データ記事2本追加

**背景**: 従来の記事作成はAIの知識ベースで商品名・価格・レビュー件数を書いており、実在はしても数値が実データでないケースがあった。楽天の実在・レビュー実績のある商品のみを採用する運用に切り替えるため、楽天商品検索APIの取得経路を確立した。

- **楽天API接続の確立（重要）**: 旧 `app.rakuten.co.jp/services/api/...` は廃止済み。現行は **`https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701`** で、`applicationId` に加えて **`accessKey` が必須**、さらに **登録ドメイン（camp-kit-guide.com）からのReferer** を要求する（直アクセスは `REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING`）。取得は「Claude in Chrome でサイトを開き、そのページ上で fetch」する方式で成立。認証情報は `.env.local` に `RAKUTEN_APP_ID` / `RAKUTEN_ACCESS_KEY` として保存（gitignore対象）。APIの `itemUrl` は **rafcid付きで返るためそのままアフィリリンクとして使える**。
- **#1 snowpeak-tent（新規・tent）**: KW「スノーピークのテント」。楽天APIでレビュー件数順に取得し、付属品・意図違いを除外して実テント5点を採用（エントリーパックTT 29,999円★4.53(32) ／ ランドネストドームS 24,800円★4.77(22) ／ ランドネストMセット 49,800円★4.84(19) ／ アメニティドームMスターターセット 75,240円★4.73(164) ／ ランドネストシェルター 87,780円★4.88(67)）。最高÷最低=3.5倍で価格帯整合。価格・レビュー・画像・アフィリリンクすべて実データ。products.tsv に5行登録（採用フラグTRUE）。
- **#2 montbell-sleeping-bag（新規・sleeping-bag）**: KW「モンベルのシュラフ」。★**楽天供給NGの誤判定と是正**: 当初「楽天にレビュー実績商品が5点そろわない」ためKWごとskipと判断したが、これは楽天だけを見た誤り。**Amazonには実在しレビューもある**ため、楽天供給フィルタの適用範囲を誤っていた。**楽天が薄いブランドはAmazonをデータ源にする**方針に是正し、Amazonの実データで4選構成（シームレスダウンハガー800#3 26,631円★4.4(43) ／ ダウンハガー650#3 29,502円★4.5(12) ／ シームレスバロウバッグ#3 19,800円★5.0(1) ／ シームレスバロウバッグ#0 24,948円★4.6(8)）。ProductCardは `source="amazon"` ＋ `affiliateUrl`にASIN指定で `dp/ASIN?tag=` のタグ付きリンクを自動生成。
- **Amazon運用の整理**: Amazonアフィリは現状API発行不可のため、①`amazonUrl`未設定ならボタン自動非表示（既存実装）②Amazon存在確認とASINは `_file/amazon-link-worksheet.tsv` に記録③amzn.to発行後にworksheet経由で一括注入、という運用に確定。今回の両記事分をworksheetへ登録。
- **恒久化**: 日次タスク `campkit-new-article-draft` を「楽天API実データ取得・レビュー実績商品のみ採用・供給NG時はKW差し替え」に更新。KW選定タスクと合わせ、以後は最初から実データで生成される。
- ⚠️ **残**: 日次タスクへ「楽天薄→Amazon源への切替」分岐の追記が未反映（文言は用意済み）。

---

## 2026-07-21

### title一括短縮（SERP見切れ対策・全61記事）＋PR表記/シェアURL実装

**狙い**: 日本語SERPのタイトル表示上限（全角約30字＋ブランドサフィックス` | CampKit Guide`）で見切れていた長尺titleを短縮し、CTRを底上げする。型番・機能を羅列していた冒頭外の後半部分を「◯◯で比較／選ぶ」に圧縮し、冒頭にメインKW＋件数＋【2026年版】を残す方針。descriptionは既存（120〜150字）を維持。

- **対象61記事**（変更前後は成果物CSV `CampKit_title短縮ログ_全61記事.csv` に全件記録）。内訳：優先12記事（osprey-backpack / soto-burner / uniflame-burner / naturehike-sleeping-bag / mysteryranch-backpack / kids-sleeping-bag / mountain-camp-lantern / day-camp-led-lantern / rectangle-sleeping-bag / jackery-power-station / coleman-tent / gregory-backpack）は title＋description を最適化（結論ファースト80〜90字メタに刷新）。残り49記事は title のみ短縮。
- **短縮していない約72記事**: 既に全角約30字以内で適切なため無変更（差分＝デプロイリスクを避けるため意図的にKEEP）。
- **未変更の型番羅列を避けた理由**: モデル名（AC70/Solix C1000/チェアワン等）はタイトルから外してもdescription・本文・比較表で拾えるため、SERPではメインKWの可読性を優先。
- **PR表記/シェアURL（別commit想定・コード変更）**: 景表法・ステマ規制対応として記事本文冒頭（H1直後）に「本記事にはアフィリエイト広告（PR）が含まれます。」を追加（`pages/posts/[slug].tsx` ＋ `post.module.css` の`.prNotice`）。あわせてLINE等シェアURLが空になるSSRバグを`ShareButtons.tsx`で修正（`url` propを受け取りSSRでも`/posts/${slug}`を出力）。
### 横断ハブ記事C1追加: portable-power-guide

- **新規記事（category: power）**: `portable-power-guide`「キャンプのポータブル電源の選び方｜容量目安ガイド【2026年版】」を追加（記事数133→134）。成功済みの逆算型ハブ `camp-backpack-capacity-guide`（グループA）の型を踏襲し、ProductCardリストではなく「使う家電の消費電力からの容量逆算＋定格出力・リン酸鉄・ソーラー」の判断軸ガイドとして構成。
- **カニバ回避**: 既存の5選リスト `camp-portable-power-beginner`（購入型）とは検索意図を分け、本記事は「ポータブル電源 選び方／容量 目安」の情報型ハブに純化。
- **内部リンク（ハブ→クラスタ 10本）**: jackery-power-station / anker-power / ecoflow-power / bluetti-power（ブランド4）＋ camp-portable-power-beginner / portable-power-large / portable-power-vehicle-camp / solar-portable-power / solar-panel-folding / mobile-battery-camp（用途別6）へ送客。
- ⚠️ **残タスク（inbound強化）**: 現状はハブ→各記事の一方向リンクのみ。ハブの評価を高めるため、クラスタ各記事の本文からハブへの被リンク（例: 「選び方の詳細は→ポータブル電源の選び方ガイド」）を後日追加すると効果的。
- **効果測定**: 次回GSC測定でタイトル変更61記事のCTR・平均掲載順位を6/23比較で確認。特に流入のあるosprey-backpack・寝袋/電源系のCTR改善を主要観測点とする。新規ハブはインデックス状況を優先確認。
- ⚠️ **ビルド未検証**: 作業時にサンドボックスVMが停止しており`npm run build`未実行。titleはYAML引用符内の文字列置換のみ（構造変更なし）だが、push前にローカルで`npm run build`成功を確認すること。

---

## 2026-06-29

### 差別化リライトの横展開（グループB継続）

6/23の差別化リライト3本（#1 backpack-capacity / #2 tent-size / #3 dutch-oven）に続き、グループB（おすすめ◯選型）の勝ち筋＝「判断軸を競合より体系的に表で整理＋買った後の実用情報＋初心者向け結論の明示（E-E-A-T偽装なし）」を残り記事へ展開した。

- **#4 solo-tent-overall（グループB・commit 2276652）**: ソロテントの選び方を自立式/非自立式・素材・重量などの判断軸で体系化したテント選定比較表中心の構成に再構築。※commitは作成済みだったが本ログへの記録が漏れていたため遡及記載。
- **#5 stylish-camp-tent（グループB・commit e7bc3f6）**: KW「おしゃれ キャンプ テント」。デザインタイプ別比較表（ワンポール／ベル型／カマボコ／パップ／ロッジ／ドームの7列×6行）・素材傾向表（ポリ／TC＝ポリコットン）・シーン別早見表を新設し、感覚的な「映え」を判断軸として体系化。ProductCard5商品・比較表1・FAQ5問はKEEP。updatedAtを6/29に更新（dateModified反映）。
- **#6 camp-chair-highback（グループB・commit 3fdc306）**: KW「ハイバックチェア キャンプ おすすめ」。①座面高タイプ別比較表（ハイ/ミドル/ロー×立ち座り・テーブル相性・焚き火距離感・用途）②リクライニング方式の判断軸表（無段階・無重力/段階式/ロッキング/固定）＋ヘッドレスト・生地（ポリ/TC/メッシュ）の使い分けを散文吸収 ③体格・用途別早見表を新設し、「くつろぎ・座り心地」を判断軸として体系化。21.7k→26.4k字、ProductCard5商品・比較表1・FAQ5問はKEEP、updatedAt6/29。カニバ防止のため食事メイン/家族向けは camp-chair-lightweight・family-camp-chair へリンク誘導し本記事は「くつろぎ」入口に純化。
- **#7 nanga-sleeping-bag（グループB・commit cb35c30）**: KW「ナンガ シュラフ おすすめ」。ブランド軸×判断軸の体系化。①DXナンバー×ダウン量×季節×快適温度×用途の対応表（快適温度は記事掲載の実数値600=-6℃/750=-8℃のみ使用、450/800は質的記述・「目安/各製品表記を確認」明記）②形状選択ガイド表（マミー/封筒）③シリーズ別比較表（オーロラライト/テックス/オリジナル）。19.6k→22.6k字、ProductCard5・比較表1・FAQ5 KEEP、updatedAt6/29。**内部リンク0→3本**（sleeping-bag-temp-guide/season-guide/mummy-sleeping-bag）。温度別の深掘りはリンク誘導に留め、温度ガイド3記事（temp-guide/temperature-guide/camp-sleeping-bag-temperature-guide）とカニバらせず「ナンガの選び方」に純化。
- **#8 one-pole-tent（グループB・commit cb35c30）**: KW「ワンポールテント おすすめ」。①形状×素材比較表（ティピー/ベル×TC/ポリ）②装備の判断軸表（煙突ポート/スカート/小川張り/火の粉耐性）③人数・スタイル別早見表。23.4k→27.3k字、ProductCard5・比較表1・FAQ5・設営手順 KEEP、updatedAt6/29。内部リンク1→4本、カニバ防止で solo-tent-overall/pup-tent/stylish-camp-tent へリンク誘導し「ワンポール」に純化。
- **cooler-box-day-camp（スキップ）**: グループB対象に挙げたが、`day-camp-cooler-box` と同一検索意図「デイキャンプ向けクーラーボックス5選」の重複記事（採用商品も AOクーラーズ/LOGOS/DODソフトくらお が重複）。片方をグループB化しても重複が深まるだけで棲み分け不能のためスキップ。クーラー系は overall/beginner も「キャンプ用クーラーボックスおすすめ5選」で重複気味＝カテゴリ全体の統廃合（canonical/統合）は別途方針判断が必要。

#### 12本バッチ（#9〜#20・本コミット／並列サブエージェントで実装→中央でgrep/wc検証＋build EXIT=0を確認）

型は #3〜#8 と同一（判断軸の体系的な表化＋実用情報、E-E-A-T偽装なし、捏造なし、数値は既存データのみ・「目安」明記、updatedAt=6/29、KEEP厳守）。各記事に新要素3つ（タイプ別比較表／判断軸／用途・シーン別早見表）。

**ロットB①：テント形状・スペック軸（solo-tent-overall/stylish/pup-tent とカニバさせず純化、4本相互＋solo-tent-overallへリンク）**
- **#9 lightweight-mountain-tent（グループB）**: 軽量・山岳特化。①スペック判断軸比較表（人数/重量/耐水圧/自立式/用途）②自立式vs非自立式・ダブル/シングルウォール判断軸 ③登山スタイル別早見表。18.2k→22.4k字、KEEP(PC5/表1/FAQ5)、内部リンク0→3（mountain-camp-tent/solo-tent-lightweight/solo-tent-overall）。
- **#10 mountain-camp-tent（グループB）**: 山岳キャンプ特化。①判断軸比較表（耐候性/前室/設営/重量）②構造の判断軸 ③季節別早見表。17.8k→20.9k字、KEEP、内部リンク0→3（lightweight-mountain-tent/solo-tent-overall/large-tent-guide）。
- **#11 large-tent-guide（グループB）**: 大型・グループ用に純化。①人数×形状比較表（ツールーム/トンネル/大型ドーム）②大型選びの判断軸 ③人数別早見表。16.6k→19.4k字、KEEP、内部リンク0→3（two-room-tent-guide/mountain-camp-tent/solo-tent-overall）。
- **#12 solo-tent-lightweight（グループB）**: ソロ×軽量に純化。①スペック比較表（重量/収納/自立式/耐水圧）②重量・収納・設営の判断軸 ③移動手段別早見表。22.1k→25.8k字、KEEP、**updatedAt空欄を正しい形式で補完**、内部リンク0→3（lightweight-mountain-tent/mountain-camp-tent/solo-tent-overall）。

**ロットB②：ギア・周辺装備軸（各単独カテゴリ・相互カニバなし）**
- **#13 camp-pillow（グループB）**: ①タイプ別比較表（インフレ/低反発/エア）②寝心地・携行性の判断軸 ③用途別早見表。21.0k→23.4k字、KEEP、内部リンク0→3（inflatable-mat/camp-sleeping-mat/mountain-camp-mat）。
- **#14 car-side-tarp（グループB）**: ①取付方式比較表 ②車種適合・設営の判断軸 ③シーン別早見表。22.4k→25.6k字、KEEP、内部リンク0→3（car-camp-lighting/car-camp-bed-kit/camp-tarp-beginner）。
- **#15 car-camp-lighting（グループB）**: ①タイプ別比較表（LEDランタン/テープライト/USB）②明るさ・電源・取付の判断軸 ③用途別早見表。16.8k→19.4k字、KEEP、内部リンク0→3（car-side-tarp/car-camp-bed-kit/camp-lantern-led）。
- **#16 camp-fan-summer（グループB）**: ①タイプ別比較表（クリップ/卓上/吊下）②風量・駆動時間・サイズの判断軸 ③使用シーン別早見表。17.9k→20.6k字、KEEP、内部リンク1→3（既存family-camp-summer-tent＋mobile-battery-camp/camp-portable-power-beginner）。
- **#17 inflatable-mat（グループB）**: ①マットタイプ比較表（インフレ/エアー/クローズドセル）②R値・厚み・収納の判断軸（R値は既存数値のみ使用）③季節別早見表。21.6k→24.6k字、KEEP、内部リンク既存4本維持。
- **#18 solar-portable-power（グループB）**: ①出力・容量比較表（容量Wh/定格出力W/ソーラーW数）②W数・接続・用途の判断軸 ③使用シーン別早見表。19.1k→21.8k字、KEEP、内部リンク1→3（既存solar-panel-folding＋portable-power-large/jackery-power-station）。

**ロットA：解説・ガイド型（逆算・結論先出し）**
- **#19 karrimor-backpack（グループA）**: ブランド軸×容量逆算。①用途→容量の結論先出し早見表 ②シリーズ・容量別比較表 ③用途別早見表。21.1k→23.2k字、**KEEP(PC4のまま＝5本目を捏造せず維持)**、内部リンク既存4本維持。
- **#20 sleeping-bag-winter-beginner（グループA）**: 冬・初心者の逆算。①「最初の1着」の結論先出し ②対応温度×素材（ダウン/化繊）の判断軸 ③予算別早見表。25.9k→28.6k字、KEEP、温度の詳細選定は temp-guide/temperature-guide へ誘導し「冬・初心者の選び方」に純化、内部リンク既存5本維持。

**バッチ検証**: 全12本で残留タグ0・KEEP件数維持（karrimorはPC4）・updatedAt6/29 を中央のgrep/wcで確認、build EXIT=0。実装は並列サブエージェント12体、最終検証とbuildはメイン側で実施。

#### データ不整合の是正：two-room-tent-guide（差別化リライトではなく事実誤認の修正・本コミット）

- **発覚した不整合**: ProductCardの name/価格/URL/画像は実在楽天商品（FIELDOOR/QuickCamp KURVE/Naturehike The hills 1LDK/TOMOUNT TriArc V4/タンスのゲン340）に差し替え済みだったが、**description/id/badge/スペック比較表/まとめ表アンカーが旧ブランド（スノーピーク/コールマン/ogawa/DOD/ロゴス）のまま放置**され、実商品と別ブランドを説明する事実誤認状態だった（例: FIELDOOR商品を「スノーピークのエントリーモデル」と説明）。比較表は実在しない旧ブランドのスペック（全高/耐水圧/価格¥47.8k〜88k）を表示。
- **是正内容**: 全5カードの description/id/badge を実商品（name基準）に書き直し、旧ブランド名・固有機能（ダークルーム等）を完全除去。比較表を実5商品で再構築（数値はname内の実値＝Naturehike2000mm/TOMOUNT2500mm・500×310×195cm/FIELDOOR260×620cm/tansu幅340cm のみ、無い項目は「—」）。まとめ表のリンクテキスト・アンカー（旧#1位等→新id）・価格を実データに張り替え。カード4の内部矛盾（name2500mm vs desc2,000mm）を2500mmに統一。Tips内のスノーピーク言及を一般表現に置換。
- **検証**: 旧ブランド名0件／旧id参照0件／ProductCard id⇔まとめ表アンカー5/5一致（切れなし）／PC5・表1・FAQ5維持／updatedAt6/29／build EXIT=0。捏造なし（name内実値のみ）。
- **注記**: 差別化リライト（判断軸表の追加）は今回未実施。グループB残としての差別化リライトは別途。

#### データ不整合の是正：sleeping-bag-winter-beginner（事実誤認の修正・本コミット）

- **発覚した不整合**: two-room と同型。ProductCardの name/価格/URL/画像は実在楽天商品（Bears Rock×3／Camdoor／AIFLYCY＝いずれも化繊・洗える寝袋）だが、**見出し・id・badge・description・各カード直後の解説本文（社史）・主なスペック・比較表・まとめ表が旧プレミアムブランド（ナンガ/モンベル/イスカ/コールマン/Snugpak）のまま放置**。「650FP/AURORA-TEX/永久保証」「800FP EXダウン」「810FP」等の偽スペックを実在しない商品に対して記載していた（重度のE-E-A-T／景表法リスク）。本記事は6/29の#20で差別化リライト済みだったが、土台のProductCardがこの不整合を抱えたままだった。
- **是正内容**: 全5カードの見出し・id・badge・description・解説本文・主なスペックを実商品（name基準）に書き直し、旧ブランド名・偽スペックを完全除去。温度は name の表記値（-30度/-25℃/-34度/-15度/3.5シーズン）を「表記・目安」と明記し、捏造の快適温度/限界温度/FP/重量/収納を削除。比較表（列＝商品名/形状/素材/対応温度(表記)/価格）とまとめ表（テキスト・アンカー・価格）を実5商品で再構築。締め本文のブランド言及も是正。
- **トーン整合（別途同コミット）**: 採用5商品が全て化繊のため、教育セクション（結論ボックス/ダウンvs化繊判断軸表/予算別早見表/ポイント2）の「冬はダウン推奨」トーンを「初心者の冬入門は扱いやすい化繊が現実的、軽さ・本格度・予算余裕でダウンへ」に整合（判断軸表はKEEP、推奨欄のみ修正）。ダウンの軽量・高保温は事実として維持。
- **検証**: 旧ブランド名は正規内部リンク（[ナンガの寝袋](/posts/nanga-sleeping-bag)）以外0件／旧id参照0件／ProductCard id⇔まとめ表アンカー5/5一致／PC5・表1・FAQ5・判断軸表3つ維持／updatedAt6/29／build EXIT=0。捏造なし。

#### 🚨 サイト横断のブランド不整合スキャン結果（重要・要対応の積み残し）

全記事を id↔name のブランド照合でスキャンした結果、**two-room/winter-beginner と同型の事実誤認が複数記事に存在**することが判明（ProductCardの name/価格/URL/画像だけ実楽天商品へ差し替え、id/description/見出し/比較表は旧ブランドのまま放置）。本番に「別ブランドを名乗る虚偽記述」が公開中＝E-E-A-T／景表法リスク。

- **✅ 是正完了（全17記事）**: two-room-tent-guide（703228d）／sleeping-bag-winter-beginner（9a5b763）／【バッチ1】bonfire-stand-beginner／camp-burner-beginner／camp-chair-lightweight／camp-cooker-beginner／camp-cooler-box-beginner（5c4e26d）／【バッチ2】camp-lantern-led／camp-lighting-guide／camp-sleeping-mat／camp-tarp-beginner／family-camp-summer-tent（1396e19）／【バッチ3・本コミット】sleeping-bag-summer-cospa／solo-tent-beginner／group-camp-table／camp-table-folding／camp-headlight-beginner。
- **🔴 未是正: なし**。本コミットで**サイト横断のブランド不整合スキャンで検出した全記事の是正が完了**。公開中の「別ブランドを名乗る虚偽記述」は解消済み。
- **⚪ 偽陽性（是正不要）**: inflatable-mat／mummy-sleeping-bag／rectangle-sleeping-bag（id`bearsrock`↔name「Bears Rock」スペース差）／family-camp-mat（id が汎用命名）。
- **優先度**: 流入のある記事・公開中の虚偽ブランド表示は早期是正が望ましい。差別化リライトより本不整合の解消を優先候補とする。

##### バッチ1是正の詳細（5記事・並列サブエージェント実装→中央でgrep/build検証）
各カードの真の正体＝`name`フィールドを基準に、id/見出し/badge/description/解説本文/主なスペック/比較表/まとめ表アンカーを実商品へ是正。捏造スペック（火力/重量/FP/保冷時間/温度等）は全削除し、nameに無い項目は「—」。汎用名カードはブランド断定せず属性のみ記述。
- **bonfire-stand-beginner**: アイリスオーヤマ TKB-ST43／トライポッドTP135／囲炉裏テーブルTB98／TRGR 焚き火台／BaTaRaN J05。※5点中2点（三脚・囲炉裏テーブル）は焚き火台本体でないため関連アクセサリとして整理。アイリス3点はブランド占有緩和（事実是正）。
- **camp-burner-beginner**: イワタニCB-JCB／SOTOアミカス／キャプテンスタッグM-6400／SOTO ST-310セット／コールマン アウトランダー。id旧ブランド（soto/primus/coleman/iwatani/snowpeak）がnameと食い違っていたためname基準で再割当。
- **camp-chair-lightweight**: 汎用(YMBStore)／ポンコタン ロー／ポンコタン ハイバック／Moon Lence CH-7／山善 DD-02WT。「32万脚」2枚は実ポンコタンとしてmodelで差別化。
- **camp-cooker-beginner**: 汎用アルミ3点／スノーピーク パーソナルクッカー／VASTLAND／コールマン パッカウェイ／チタンマニア。id=montbellの実体がスノーピーク、id=uniflameの実体がコールマン等をname基準で是正。
- **camp-cooler-box-beginner**: アイリス クーラーバッグ／ロゴス ハイパー氷点下M／アイリスHUGEL VITC-40／同VITC-20／ロゴス アクションクーラー25。旧YETI/ダイワ/イグルー/コールマンを除去し、解説の「YETI級が最強」トーンを実ラインナップ寄りに整合。
- **検証**: 全5本で旧id参照0／消えるべき旧ブランド0／id⇔アンカー5/5一致／updatedAt6/29／build EXIT=0。残存ブランドは全て実name由来（アイリスオーヤマ/SOTO/イワタニ/コールマン/スノーピーク/ロゴス/ポンコタン/Moon Lence/山善/VASTLAND/チタンマニア/TRGR/BaTaRaN）。FAQはcamp-chair-lightweight・camp-cooker-beginnerが元々無し（旧テンプレ・リグレッションではない）。

##### バッチ2是正の詳細（5記事・バッチ1と同一手順）
バッチ1と同じく `name` フィールドを真の正体として、id/見出し/badge/description/解説本文/主なスペック/比較表/まとめ表アンカーを実商品へ是正。捏造スペック（ルーメン/点灯時間/重量/R値/耐水圧等、nameに根拠のない数値）は全削除し、不明項目は「—」。汎用名カード（ブランド不詳の楽天商品）はブランドを断定せず属性のみ記述。
- **camp-lantern-led**: Soomloom Helio5000（USB Type-C・5000mAh・300lm・IPX4）／楽天総合1位 LED 63灯（USB・手回し・ソーラー・電池・車載の多電源）／ラドウェザー 1000lm（乾電池式・防滴防塵）／ブルーノ BRUNO LEDランタン（全8色・無段階調光・電池式）／充電式1000LM（5000mAh・150時間）。旧ゴールゼロ／ジェントス／コールマン クアッドマルチ／BioLite／キャプテンスタッグを完全除去。比較表の列も実商品に合わせて「明るさ・点灯時間・重量」→「明るさ・点灯時間・電源方式・防水/特徴」へ再構成。
- **camp-lighting-guide**: M.O.L MOL-L1200（1200lm）／M.O.L MOL-L400（400lm・ロープハンドル）／バルミューダ The Lantern L02A／KZM ギルバートランタン／ソーラーランタン1800lm（5000mAh・折り畳み）。
- **camp-sleeping-mat**: 厚手インフレーターマット（枕付き・幅75cm・8/10cm）／Bears Rock 自動膨張式5cm（枕付き）／コールマン キャンパーインフレーターマットハイピーク ダブル（2000036154）／FIELDOOR 折りたたみクッションマット（180×60cm・厚さ2cm）／R値8.93 インフレーターマット8cm。R値はnameに表記のある1点のみ記載し、他は捏造せず「—」。
- **camp-tarp-beginner**: DOD いつかのタープ（TT5-631-TN）／FIELDOOR ワンタッチタープテント3×3m／Bears Rock しろくまスクエアタープ（SQT-401・ポール2本付）／ヘキサタープ500×480cm（耐水圧2000mm・UPF50+）／FIELDOOR ヘキサタープM（440×470cm）。
- **family-camp-summer-tent**: TOMOUNT TriArc Tunnel Tent V4（2ルーム・耐水圧2500mm・500×310×195cm）／FIELDOOR ファミリーテント4点セット（テント+タープ+シート+ポール）／RATELWORKS BODEN（RWS0111・2ルーム）／ワンタッチファミリーテント300／WAQ Alpha TC（WAQ-TCFT1・ワンポール）。
- **検証**: 全5本で旧id参照0／消えるべき旧ブランド0（grepヒット0）／ProductCard id⇔まとめ表アンカー5/5一致（リンク切れなし）／PC5・表1維持／updatedAt6/29／build EXIT=0。FAQは4本が5問維持、**camp-lantern-led のみ元々FAQセクション自体が無い**（旧テンプレ構成＝「用途別おすすめランタン」「電池を長持ちさせるコツ」章立て。バッチ1のcamp-chair-lightweight／camp-cooker-beginnerと同様、本是正によるリグレッションではない）。→ FAQ追加は記事構成リライトとして別途対応。

##### バッチ3是正の詳細（5記事・最終バッチ／バッチ1・2と同一手順）
`name` を真の正体として、id/見出し/badge/description/解説本文/主なスペック/比較表/まとめ表アンカーを実商品へ是正。捏造スペック（ルーメン/防水等級/重量/耐水圧/耐荷重/温度等）は全削除し、nameに根拠のない項目は「—」。汎用名カードはブランドを断定せず属性のみ記述（ショップ名をブランドとして書かない）。
- **sleeping-bag-summer-cospa**: 洗える封筒型（限界-15/-5/5度の3タイプ）／Bears Rock ふわ暖 MX-604／薄手インナーシュラフ／Naturehike 3.5シーズン（連結可）／ねぶくろん。旧モンベル/コールマン/ナンガ/イスカ/スノーピークを除去。**第3位は寝袋本体でなくインナーシーツ**のため補助アイテムとして明示（bonfire-stand型の整理）。実5点が全て化繊のため、ポイント2「軽さ重視ならダウン」トーンを「夏のコスパ用途はまず化繊が現実的」へ整合（ダウンは否定せず登山用途の選択肢として残置）。まとめ本文の「軽量重視なら国内ブランドのダウン製品」も削除。
- **solo-tent-beginner**: BUNDOK ソロティピー BDK-75（ワンポール）／Bears Rock ハヤブサテント TS-201H（自立式）／BUNDOK ソロベース TC BDK-79（パップ型・TC）／BUNDOK ソロドーム BDK-08O／TOMOUNT NY TENT（耐水圧4000mm・20D・自立）。旧DOD/アライテント/MSR/コールマン/キャプテンスタッグを除去。**実5点中2点が非自立**のため、ポイント1・FAQ Q1の「迷わず自立式」断定を「設営の確実さ＝自立式／価格・焚き火＝非自立型」の選び分けへ整合。FAQ Q5の「5モデルすべてスリーシーズン」も検証不能のため一般論＋スカート付き選択可の記述へ修正。BUNDOK3点はブランド占有緩和（事実是正）。
- **group-camp-table**: ラタン調ガーデンテーブル180cm／FIELDOOR 180・240cm（6〜8人対応・高さ2段階）／waku fimac ロールトップ120×70／折りたたみテーブル180×70cm（KM-F002）／CAPTAIN STAG 木製ヘキサセンターテーブル96（2個組）。**本記事は見出し・id・カード順・比較表・まとめ表が相互に全て不整合**で全面再構築。まとめ表のアンカーは `#1位`〜`#5位` で**5本すべてリンク切れ**だったため新idへ張り替え。選び方ポイント1の旧ブランド例示、FAQ Q3「スチール天板のDODテキーラは熱に強い」、Tips「スチール天板を調理専用に」は**実5点にスチール直火対応天板が無い**ため実ラインナップ基準に書き換え（バーナー・焚き火台の直置き不可を明示）。
- **camp-table-folding**: MERMONT アルミテーブル（高さ調節・伸縮）／メッシュテーブル135×60cm（**唯一の耐荷重明記＝50kg**）／山善 YAMAZEN 木目アルミ（120/180/240cm）／FIELDOOR テーブル＋ベンチ2脚セット／キャンピングムーン フィールドラック。旧スノーピーク/コールマン/DOD/ユニフレーム/キャプテンスタッグを除去。**第5位はテーブルでなくフィールドラック（棚）**のため関連アイテムとして明示。frontmatter description が**ショップ名「ROUND-ERA」をブランドとして記載**していたため修正。ケア方法「コールマンのような天然木天板はオイル仕上げ」も実商品に天然木が無いため差し替え（山善は木目「調」アルミ）。
- **camp-headlight-beginner**: SC-200B（32g・乾電池式）／SR-01L（センサー点灯・充電式）／SC-300R・SC-400R（充電式・防水）／6200ルーメン高輝度（充電式）／LAD WEATHER（42g・IP44・センサー）。旧ペツル/ブラックダイヤモンド/レッドレンザー/ジェントスを除去。**捏造が最も深刻な記事**で、全5点のlm・IPX等級・重量・点灯時間が架空だった。name由来の実値は6200ルーメン・IP44・32g・42gのみで他は全て「—」。Tips「赤色LEDモードを活用」（実5点に赤色LED記載なし）、ポイント2「できればIPX6〜7」（該当製品ゼロ）、FAQの「ペツルのコアシリーズ/キッドシリーズ」も除去。**SR-01Lは防水表記が一切ない**ため3箇所で「雨天使用は販売ページで要確認」と明示。6200ルーメンは削除も捏造もせず「メーカー表記」と明示のうえ「lm値は測定条件で変わり各社横並び比較不可」「キャンプでは明るすぎがデメリット」の注意を追記。※name末尾にブランド明記があった第5位のみLAD WEATHERとして記述、残り4枚は汎用名扱い。
- **検証**: 全5本で旧id参照0／消えるべき旧ブランド0／id⇔アンカー5/5一致（group-camp-tableの壊れアンカー5件も解消）／PC5・表1／updatedAt6/29／build EXIT=0（149ページ生成）。FAQはcamp-table-foldingが元々セクション無し、sleeping-bag-summer-cospaが元々4問（いずれもHEAD比較で確認済・リグレッションではない）。

**効果測定（次回7/7）**
- グループBの型（判断軸の体系化＋実用情報）で各記事の順位が動くかを確認。動いた型をグループB残へ横展開する。
- **ブランド不整合の是正完了による副次効果も観測**：17記事で虚偽ブランド記述を解消したため、E-E-A-T評価・CVRへの影響が出るか（特に流入のあるcamp-tarp-beginner・two-room-tent-guide）を7/7で確認する。
- 6/29時点でテコ入れ対象22記事のうち差別化リライト済みは #1〜#7・#19・#20＋ロット系（合計17記事相当）。two-room-tent-guideは**データ不整合を是正済み**（差別化リライトは未／別途）。**未着手の主な残**: 寝袋温度ガイド3記事（カニバ統廃合のため保留）。
- **積み残しの構造課題**: クーラー系記事のカニバ（デイキャン2本＝cooler-box-day-camp/day-camp-cooler-box、汎用2本＝overall/beginner）と寝袋温度ガイド3記事のカニバは、いずれも統廃合を伴う破壊的整理のため7/7の順位確認後に判断する。

---

## 2026-06-23

### Amazon収益基盤の整備（記事増産なし・流入立ち上げ前提の足場固め）
SEO施策そのものではなく、流入が立ち上がったときに収益化できるようAmazonアフィリエイト連携を一気に整備。記事の増産はなし（133記事のまま）。
- **申請**: Amazonアソシエイト申請完了（登録ID `campkit26`／リンク `campkit26-22` 形式／仮登録状態、180日以内に3件適格販売で本審査自動開始）。
- **タグなし検索URL全停止**: ProductCardの `getAmazonUrl` を `amazonUrl` 指定時のみ実リンク化し、検索URLフォールバックを廃止（全記事で垂れ流していたタグなしAmazon検索URLを停止）。
- **架空リンク3記事修正**: solo-tent-beginner / bonfire-stand-beginner / sleeping-bag-summer-cospa の比較表を実在楽天商品で再構築。
- **手動3記事併記**: coleman-tent / dod-tarp / fieldoor-tent の12商品にSiteStripe発行の `amzn.to` を設置。
- **Cowork19記事82商品設置**: 三者分業フロー（Coworkログアウト検索→まーくんamzn.to発行→Claude Code設置）を初完走（commit af9a482）。
- **全記事ワークシート整備**: `_file/amazon-link-worksheet.tsv`（Git管理外・130記事626商品）。今回94商品設置済み、残り約530商品が今後の対象。
- 詳細は `docs/operation-snapshot.md` の 2026-06-23 セクションを参照。

### GSC現状・量産方針
- **GSC現状**: データは2026-06-08取得のまま。サイト全体でクリック約30・表示約900と低水準。次回SEOレポート定期測定は予定どおり 6/23。
- **量産方針**: 確実に5件揃うブランドは概ね枯渇。6/23の測定までは闇雲な量産を保留し、効果測定の結果を見てから横展開を判断する。

### SEO定期測定（6/8→6/23）＝第1回効果測定
- **サイト全体**: 表示 612→1283（2.1倍）／クリック 17→55（3.2倍）／GSCページ 65→112。6月の新規量産分のインデックスが進み、流入が立ち上がった。
- **ボトルネックの移行**: 「検索に乗ること」から「1ページ目に入りクリックされること」へ移行したと判断。これ以上の新規量産を止め、既存記事のテコ入れに方針転換する。
- **テコ入れ対象**: 順位11位以上かつ表示10以上の全22記事（camp-backpack-capacity-guide / two-room-tent-guide / tent-size-beginner-guide / sleeping-bag-temp-guide / stylish-camp-tent / solo-tent-overall / nanga-sleeping-bag / car-camp-lighting / lightweight-mountain-tent / camp-fan-summer / camp-chair-highback / mountain-camp-tent / inflatable-mat / solo-tent-lightweight / camp-pillow / dutch-oven / solar-portable-power / large-tent-guide / sleeping-bag-temperature-guide / karrimor-backpack / sleeping-bag-winter-beginner / car-side-tarp）。

### 競合分析で判明した重要な学び（テコ入れ方針の核）
- **competitor占有の実態**: camp-backpack-capacity-guide（順位12.8）のKW「キャンプ リュック 容量」の検索1ページ目は、Oggi / BE-PAL / カバン日和 等の**汎用大手メディア**が占有。中身は薄いがドメインが強く上位にいる。
- **結論**: テンプレ充足（FAQ追加・文字数増）では順位は動かない。勝ち筋は**「キャンプ専門サイトだけが書ける深さ・具体性」での差別化**。
- **裏付け**: 前回ブラッシュアップ済みの solo-tent-overall 等が16〜19k字で充実しているのに順位が動いていない事実とも整合（充実≠順位。ボトルネックは個別記事の薄さではなく、サイト評価＋KWミスマッチ）。

### 本日実施した施策
1. **内部リンク強化（commit bc4e3fe）**: 被リンク0本の car-side-tarp・camp-pillow に、関連記事から各3本の内部リンクを追加（一方向）。両記事とも被リンク 0→3本。
2. **テンプレ欠損補完（commit d45472b）**: lightweight-mountain-tent・mountain-camp-tent に「お手入れTips＋よくある質問（5問）」を追加、solo-tent-overall のFAQを4→5問に。※土台補完であり、それ自体は順位押し上げ施策ではない位置づけ。
3. **差別化リライト第1号（commit 784d16f）**: camp-backpack-capacity-guide を「装備から容量を逆算する」キャンプ特化ガイドに作り変え（7.7k→14.3k字、title変更、冒頭に容量早見表で結論先出し）。競合分析に基づく勝ち筋の最初の実装。

### 効果測定の観点（次回7/7前後）
- **差別化リライト記事（camp-backpack-capacity-guide）の順位が動くか** ＝「キャンプ特化の深さで汎用大手に差せるか」の実証。これが今回の最重要観測点。
- **内部リンク2記事**（car-side-tarp 11.6位 / camp-pillow 19.4位）の順位変化。
- **方針**: 1記事の結果を待たず、競合分析で得た勝ち筋を他のテコ入れ記事へ高速展開する（PDCAを高速で回す）。

### 差別化リライトの進捗（グループ別の勝ち筋を確立）

**競合分析で判明：テコ入れ記事はグループ別に勝ち筋が異なる**
- **グループA（解説・ガイド型）**: 検索1ページ目が汎用大手メディア（Oggi / BE-PAL / カバン日和 等）。相手はキャンプを薄く広く書くだけ。**勝ち筋＝キャンプ専門サイトだけが書ける「装備や条件からの逆算・具体・即答」**。
- **グループB（おすすめ◯選型）**: 検索1ページ目がキャンプ専門メディア（マイベスト / CAMP HACK / Campify 等、専門家監修・一次情報あり）。相手も既にキャンプ特化で、camp-kit-guideは監修を偽装できない。**勝ち筋＝「判断軸を競合より体系的に表で整理する情報設計＋買った後の実用情報（手入れ・NG集）＋初心者向け結論の明示」**。

**本日の差別化リライト3本**
- **#1 camp-backpack-capacity-guide（グループA・commit 784d16f）**: 装備から容量を逆算するキャンプ特化ガイドに作り変え。7.7k→14.3k字、title変更、冒頭の容量早見表で結論先出し。
- **#2 tent-size-beginner-guide（グループA・commit 34d4a6e）**: 「○人用」を鵜呑みにせず、テント内に置くものと区画から必要サイズを逆算する構成に。7.8k→12.6k字、title据え置き（施策1で最適化済のため）。
- **#3 dutch-oven（グループB・commit 9a2ff9e）**: 素材別・サイズ別の判断軸を比較表で体系化＋シーズニング/手入れ/NG集の実用情報＋初心者向け結論ボックス。23k→28k字、ProductCard5商品KEEP、E-E-A-T偽装なし。

**効果測定（次回7/7）**
- グループAの型（逆算・具体化）とグループBの型（判断軸体系化＋実用情報）で、**順位の動き方に差が出るか**が最大の観測ポイント。
- 動いた型を、同グループの残り記事へ高速展開する。グループA残：sleeping-bag-temp-guide 等。グループB残：nanga-sleeping-bag / two-room-tent-guide 他（solo-tent-overall・stylish-camp-tent・camp-chair-highback は実施済み＝6/29セクション参照）。
- **保留中**：寝袋3記事のカニバリ整理（temperature-guide を温度別選び方ハブに純化し、winter-beginner と棲み分け）。本文削除を伴う破壊的操作のため、7/7で3記事の順位を確認してから実行する。

---

## 2026-06-15

### 施策9: 新規5記事追加（ブランド軸・lighting/chair-table/sleeping-bag補強）
lighting のブランド軸が空白だった点に着目し、コールマン／ジェントスでlightingを補強。あわせて chair-table（キャプテンスタッグ／コールマン）と sleeping-bag（Naturehike）のブランド軸を追加。楽天供給フィルタ（採用フラグTRUE 5件確保）を満たすブランドを選定し、ブランド占有ルールを緩和して同一ブランドのラインナップを深掘りする方針で記事化。新規5記事＋既存記事への一方向内部リンクを追加。
- coleman-lantern（コールマンのランタン）: category=lighting / KW「コールマン ランタン」。ガス（ノーススター/ルミエール）とLED/充電式を光源タイプ・明るさ・電源で比較。camp-lantern-led・family-camp-lantern・camp-lighting-guide・lantern-stand へ内部リンク。
- captain-stag-chair（キャプテンスタッグのチェア）: category=chair-table / KW「キャプテンスタッグ チェア」。軽量ラウンジ〜背付きベンチ・クッションをタイプ・価格・装備で比較。camp-chair-highback・camp-chair-lightweight・waq-chair・family-camp-chair へ内部リンク。
- gentos-light（ジェントスのランタン）: category=lighting / KW「ジェントス ランタン」。1100lm高輝度EX-450H〜暖色フィラメント調光をルーメン・電源・調光で比較。coleman-lantern と切り口を分け（コールマン＝燃焼系含む定番、ジェントス＝LED専門・明るさ重視）差別化。camp-headlight-beginner・headlight-rechargeable・camp-lantern-led・mountain-camp-lantern へ内部リンク。
- coleman-chair（コールマンのチェア）: category=chair-table / KW「コールマン チェア」。無重力インフィニティチェア・サイドテーブル付きデッキチェア・2点セットを比較。camp-chair-highback・camp-chair-lightweight・captain-stag-chair・family-camp-chair へ内部リンク。
- naturehike-sleeping-bag（Naturehikeの寝袋）: category=sleeping-bag / KW「Naturehike 寝袋」。封筒型化繊5モデルを使用温度・サイズ/人数・連結で比較。mummy-sleeping-bag・nanga-sleeping-bag・sleeping-bag-season-guide・naturehike-mat へ内部リンク。
- KW選定の学び: lighting はブランド軸が空白で狙い目→コールマン／ジェントスで揃った。クーラー系のブランド軸（coleman-cooler/dod-cooler/logos-cooler）は保冷剤・カバー・別ブランド混入で軒並み5件未満→クーラーはブランド軸より用途軸向き。naturehike寝袋は価格幅制約で自動選定3件だったが、本体5件に手動調整して5選化した。
- カテゴリ別記事数の変化: lighting 9→11 / chair-table 13→15 / sleeping-bag 17→18。合計 114→119記事。

### 施策10: 新規5記事追加（ブランド軸・cookware/power/backpack/chair-table の空きカテゴリ補強）
空きカテゴリ・手薄カテゴリのブランド軸を狙い、cookware（SOTO／イワタニ）・power（Anker）・backpack（カリマー）・chair-table（Helinox）の4カテゴリに5記事を追加。products.tsv の採用フラグTRUE行から流し込み、ブランド占有ルールを緩和してラインナップを深掘り。新規5記事＋既存記事への一方向内部リンクを追加。
- soto-burner（SOTOのバーナー）: category=cookware / KW「SOTO バーナー」。ウインドマスターSOD-310・ST-310の調理用2機種と、マイクロトーチ/スライドガストーチ/フィールドチャッカーの着火用3機種をタイプ・ガス（CB/OD缶）・耐風性で比較。camp-burner-beginner・camp-cooker-beginner・coleman-two-burner・iwatani-stove へ内部リンク。
- helinox-chair（ヘリノックスのチェア）: category=chair-table / KW「ヘリノックス チェア」。チェアワン/チェアワンホーム/グラウンドチェア/チェアツーを座面高・サイズ・用途で比較（4選）。同一チェアワンの色/ショップ違い重複はまとめてユニーク化。camp-chair-highback・camp-chair-lightweight・waq-chair・coleman-chair へ内部リンク。
- anker-power（Ankerのポータブル電源）: category=power / KW「Anker ポータブル電源」。Solix C800(768Wh)/C1000(1024Wh)/F1200(1229Wh)と、C1000＋ソーラーセット2種を容量・定格出力・充電時間で比較。portable-power-large・jackery-power-station・ecoflow-power・solar-panel-folding へ内部リンク。
- karrimor-backpack（カリマーのリュック）: category=backpack / KW「カリマー リュック」。イクリプス27/トリビュート40/VTデイパックF/タトラ20を容量・用途で比較（4選）。同一VTデイパックFの重複はまとめてユニーク化。camp-backpack-beginner・mountain-backpack-30l・backpack-large・camp-backpack-capacity-guide へ内部リンク。
- iwatani-stove（イワタニのバーナー）: category=cookware / KW「イワタニ バーナー」。ジュニアコンパクトバーナーCB-JCB（CB缶調理）/プリムスP-153（OD缶本格）/トーチバーナーII（着火）を用途別に比較。camp-burner-beginner・soto-burner・camp-cooker-beginner・coleman-two-burner へ内部リンク。
- KW選定の学び: 空きカテゴリのブランド軸が有効。cookware（SOTO/イワタニ）・power（Anker）・backpack（カリマー＝手薄カテゴリ補強）・chair-table（Helinox＝唯一の空き）で揃った。naturehike-backpackはレビュー薄く2件で脱落（Naturehikeはテント/マット/寝袋は厚いがリュックは薄い）。iwataniにFUTURE FOX製のジュニアバーナー風防（他社アクセサリ）が混入し除外。さらにトーチバーナーIIが別ショップで重複していたためユニーク化し、本体は3モデル（ジュニアコンパクトバーナー/プリムスP-153/トーチバーナーII）の正直な3選で記事化（ブランド軸でも他社アクセサリ混入・同一モデル重複に注意）。
- カテゴリ別記事数の変化: cookware 14→16 / chair-table 15→16 / power 11→12 / backpack 5→6。合計 119→124記事。

### 施策11: 新規4記事追加（ブランド軸・cookware/power/backpack の手薄カテゴリ補強）
施策10に続き、空き・手薄カテゴリのブランド軸を狙い、cookware（ユニフレーム）・power（BLUETTI）・backpack（グレゴリー／オスプレー）に4記事を追加。products.tsv の採用フラグTRUE行から流し込み、ブランド占有ルールを緩和してラインナップを深掘り。新規4記事＋既存記事への一方向内部リンクを追加。
- uniflame-burner（ユニフレームのバーナー）: category=cookware / KW「ユニフレーム バーナー」。ツインバーナーUS-1900/テーブルトップUS-D2/セパレートUS-Sを口数・据え置き/分離・用途で比較。US-1900の3ショップ重複・US-D2の重複をユニーク化し、本体3モデルの正直な3選で記事化。soto-burner・camp-burner-beginner・iwatani-stove・coleman-two-burner へ内部リンク。
- bluetti-power（BLUETTIのポータブル電源）: category=power / KW「BLUETTI ポータブル電源」。AC70(768Wh)/AC180(1152Wh)/AORA 100 V2(1024Wh)/AORA 30 V2(288Wh)/EB3A(268Wh)+ソーラーを容量・定格出力・充電時間で比較（5選）。portable-power-large・jackery-power-station・ecoflow-power・anker-power へ内部リンク。
- gregory-backpack（グレゴリーのリュック）: category=backpack / KW「グレゴリー リュック」。デイパック/イージーピージーデイ18L/キャンパスデイM22L/ルーヌ22/カジュアルデイV2を容量・用途で比較（5選）。レビュー薄めのため件数をそのまま正直表示。camp-backpack-beginner・mountain-backpack-30l・karrimor-backpack・camp-backpack-capacity-guide へ内部リンク。
- osprey-backpack（オスプレーのリュック）: category=backpack / KW「オスプレー リュック」。デイライトプラス/ストラトス36/シラス24/フェアビュー40を容量・用途で比較（4選）。同一シラス24の重複をユニーク化。レビュー薄めのため件数をそのまま正直表示。camp-backpack-beginner・mountain-backpack-30l・karrimor-backpack・gregory-backpack へ内部リンク。
- KW選定の学び: ブランドの有名さと楽天での本体の厚さは別物。サーモス（水筒→保冷ポーチばかり）・モンベル（公式出品薄くレンタル/クリーニング混入）・スタンレー（本体ほぼ無し）が全滅。楽天で本体が厚いのはアウトドア/ガジェット系で楽天出品の多いブランド。今日は5本狙って薄いブランド連続で4本確定。グレゴリー・オスプレーはレビュー薄めだが定番ブランドとしてbackpack補強で採用（件数は誇張せず正直表示）。ユニフレームはUS-1900の多ショップ重複でユニーク本体は3モデルのみ→3選で正直に。
- カテゴリ別記事数の変化: cookware 16→17 / power 12→13 / backpack 6→8。合計 124→128記事。

### 施策12: 新規5記事追加（ブランド軸・空きカテゴリ bonfire/chair-table/backpack/lighting 補強）
施策11に続き、カニバを事前確認のうえで競合の少ない空きカテゴリのブランド軸を狙い、bonfire（コールマン）・chair-table（DOD）・backpack（ドイター／ミステリーランチ）・lighting（ベアボーンズ）に5記事を追加。products.tsv の採用フラグTRUE行から流し込み、ブランド占有ルールを緩和してラインナップを深掘り。商品名はセール表記・クーポン文言・記号を除去してクリーニングし、レビュー薄めの商品は件数をそのまま正直表示。新規5記事＋既存記事への一方向内部リンクを追加。
- coleman-bonfire（コールマンの焚き火台）: category=bonfire / KW「コールマン 焚き火台」。看板のファイアーディスクを軸に、標準本体/ソロ/シート付き2点セット/テーブル付きセットのサイズ・付属品・用途別で比較。ファイアーディスク本体のショップ違い重複（順位8/10）を最多レビューの順位8に統合し、本体・ソロ・2セットのユニーク4モデルで4選。logos-bonfire・bonfire-stand-beginner・secondary-combustion-bonfire・bonfire-sheet へ内部リンク。
- dod-table（DODのテーブル）: category=chair-table / KW「DOD テーブル」。テキーラ（鉄製カスタム）/ステルスエックスミニ（軽量多用途）/マルチキッチン（キッチンラック）/グッドラック（高さ調整・車載）の素材・用途・サイズ別で比較。テキーラTB4-746のショップ違い重複（順位3/5）を最多レビューの順位5に統合し、ユニーク4モデルで4選。camp-table-folding・low-style-table・group-camp-table・captain-stag-table へ内部リンク。
- deuter-backpack（ドイターのリュック）: category=backpack / KW「ドイター リュック」。オルチャ25/レースエアー14+3/ルガーノ20/フューチュラPro36/エアコンタクトコア60+10を容量・用途・背面通気システム別で比較（5選）。レビュー薄め（1〜4件）のため件数をそのまま正直表示し冒頭に注記。karrimor-backpack・gregory-backpack・osprey-backpack・mountain-backpack-30l へ内部リンク。
- barebones-light（ベアボーンズのランタン）: category=lighting / KW「ベアボーンズ ランタン」。エジソンライトスティック/レイルロード/ビーコンライト2.0/ミニエジソンを置き方（卓上/吊り下げ）・電源・サイズ別で比較。ビーコンのショップ違い重複（順位2/6）を順位2に統合し、ユニーク4モデルで4選。雰囲気重視のムードランタンである点を選び方で明示。coleman-lantern・gentos-light・camp-lantern-led・lantern-stand へ内部リンク。
- mysteryranch-backpack（ミステリーランチのリュック）: category=backpack / KW「ミステリーランチ リュック」。クーリー30/ギャラゲーター20L/クーリー40/ブリッツ35を容量・用途・3ジップデザイン別で比較。クーリー40のショップ違い重複（順位3/9）を最多レビューの順位9に統合し、ユニーク4モデルで4選。レビュー薄め（2〜11件）のため件数をそのまま正直表示し冒頭に注記。karrimor-backpack・gregory-backpack・osprey-backpack・deuter-backpack（同バッチ）へ内部リンク。
- **学び**: 空きカテゴリ（bonfire/lighting/backpack）のブランド軸が有効。ユニフレーム・ファイアグリルは1製品が決定版すぎてユニーク本体1モデルのみで脱落（=ブランド軸5選に不向き、汎用比較向き）。レッドレンザーは本体薄くアクセサリばかりで脱落。ドイター/ミステリーランチ/ベアボーンズは定番だがレビュー薄め＝ニッチ救済で採用（件数は誇張せず正直表示）。重複モデルはショップ違いを最多レビューに統合しユニーク化、5選にならない場合は4選で正直に。
- **内部リンク方針**: 前バッチ（施策11）と同様、新記事→既存記事の一方向リンクのみ。安定稼働中の既存記事は「既存記事に触らない」安全ルールに従い未編集。
- カテゴリ別記事数の変化: bonfire 10→11 / chair-table 16→17 / backpack 8→10 / lighting 11→12。合計 128→133記事。

---

## 2026-06-08

### 施策前スナップショット（直近3ヶ月）
- サイト全体: クリック20 / 表示679 / CTR2.9% / 平均順位14.5 / インデックス約64ページ
- camp-tarp-beginner 6.6位(表示88) / tent-size-beginner-guide 12.2位(表示50) / mountain-camp-lantern 8.2位(表示50)

### 施策1: タイトル/ディスクリプションCTR改善 (commit 2196837)
検索クエリの語をタイトルに入れCTRを上げる狙い。
- camp-tarp-beginner: title「ランキング」追加
- tent-size-beginner-guide: title「目安/人数別」追加＋description拡張
- mountain-camp-lantern: title「軽量・充電式」具体化

### 施策2: 既存6記事ブラッシュアップ (commit ed6a15d)
内部リンク追加・はじめに/FAQ/Tips補完・見出し統一。順位押し上げ狙い。
- solo-tent-overall: はじめに/Tips/FAQ追加、内部リンク6本
- stylish-camp-tent: はじめに追加、内部リンク5本
- mountain-backpack-30l: はじめに追加、内部リンク3本
- two-room-tent-guide: FAQ表記ゆれ修正、見出し統一、内部リンク5本
- sleeping-bag-winter-beginner: 内部リンク5本
- sleeping-bag-temp-guide: はじめに追加

### 施策3: 新規4記事追加（手薄カテゴリ補強・焚き火クラスター形成）
手薄カテゴリ（bonfire / clothing / power）を補強し、焚き火まわりの内部リンククラスターを形成する狙い。新規4記事＋既存記事からの双方向内部リンクを追加。
- bonfire-sheet（焚き火シート）: category=bonfire / KW「焚き火シート」。fire-tongs・焚き火台・BBQ記事へ内部リンク。
- fire-tongs（火ばさみ）: category=bonfire / KW「火ばさみ キャンプ」。bonfire-sheet・焚き火台・グリル記事へ内部リンク。
- winter-camp-gloves（防寒グローブ）: category=clothing / KW「キャンプ グローブ 防寒」。camp-rainwear・sleeping-bag-winter-beginner・fire-tongs へ内部リンク。
- portable-power-large（大容量ポータブル電源）: category=power / KW「ポータブル電源 大容量」。camp-portable-power-beginner・portable-power-vehicle-camp・solar-portable-power へ内部リンク。
- 双方向リンク（既存→新規）: bonfire-stand-beginner→bonfire-sheet / bonfire-stand-solo→fire-tongs / camp-rainwear→winter-camp-gloves / camp-portable-power-beginner→portable-power-large。
- KW選定の学び: 火ばさみは「実在の定番（スノーピーク・DOD等）があればレビュー少でも採用」のニッチ方針で救済。着火剤・薪バッグは本体（コンテンツ）が薄く今回は見送り。
- カテゴリ別記事数の変化: bonfire 6→8 / clothing 1→2 / power 6→7。合計 90→94記事。

### 施策4: 新規5記事追加（5カテゴリに分散・手薄カテゴリ補強）
backpack / bonfire / power / cookware / sleeping-bag の5カテゴリに1本ずつ分散させ、本体（コンテンツ）が厚く商品データの揃うKWを選定。採用候補にバッファを取り、脱落なく5本確定する狙い。新規5記事＋既存記事からの双方向内部リンクを追加。
- waterproof-backpack（防水リュック）: category=backpack / KW「防水リュック」。camp-backpack-beginner・mountain-backpack-30l・camp-backpack-capacity-guide・backpack-large へ内部リンク。
- secondary-combustion-bonfire（二次燃焼焚き火台）: category=bonfire / KW「二次燃焼焚き火台」。bonfire-sheet・fire-tongs・bonfire-stand-beginner・bonfire-stand-solo へ内部リンク。
- solar-panel-folding（折りたたみソーラーパネル）: category=power / KW「折りたたみソーラーパネル」。portable-power-large・solar-portable-power・camp-portable-power-beginner・mobile-battery-camp へ内部リンク。
- dutch-oven（ダッチオーブン）: category=cookware / KW「ダッチオーブン」。camp-cooker-beginner・camp-burner-beginner・mestin-recommend・camp-knife-beginner へ内部リンク。
- rectangle-sleeping-bag（封筒型寝袋）: category=sleeping-bag / KW「封筒型寝袋」。mummy-sleeping-bag・sleeping-bag-season-guide・sleeping-bag-temp-guide・kids-sleeping-bag へ内部リンク。
- 双方向リンク（既存→新規）: camp-backpack-beginner→waterproof-backpack / bonfire-stand-beginner→secondary-combustion-bonfire / solar-portable-power→solar-panel-folding / camp-cooker-beginner→dutch-oven / mummy-sleeping-bag→rectangle-sleeping-bag。
- KW選定の学び: 当初候補の camp-wagon（キャリーワゴン）はフィールドラックが商品データに混在し用途がぶれるため見送り→封筒型寝袋に差し替え。本体が厚く実在商品の揃うKWを優先することで脱落を防いだ。
- カテゴリ別記事数の変化: backpack 4→5 / bonfire 8→9 / power 7→8 / cookware 11→12 / sleeping-bag 15→16。合計 94→99記事。

### 施策5: 新規3記事追加（コット・ブランド軸・スキレット）
- family-camp-cot（ファミリー向けキャンプコット）: category=chair-table / KW「キャンプコット ファミリー」。solo-camp-cot（ソロ特化）と耐荷重・2台並べ・サイズで差別化。solo-camp-cot・camp-sleeping-mat・inflatable-mat・car-camp-bed-kit へ内部リンク。
- vastland-tent（VASTLANDのテント）: category=tent / KW「VASTLAND テント」。ブランド軸の深掘り記事。本体4種（トンネルM/S・TCティピー・2ルームドーム）を主役にし、5点目のグランドシートは「関連アイテム」として本体と区別。naturehike-tent・dod-tent・family-camp-tent・two-room-tent-guide へ内部リンク。
- camp-skillet（スキレット）: category=cookware / KW「スキレット」。キャプテンスタッグ中心にサイズ違い（ミニ/20cm/25cm/フライパン型）の使い分け＋Barebonesの違いを比較軸に。dutch-oven・mestin-recommend・camp-cooker-beginner・hot-sandwich-maker へ内部リンク。
- 双方向リンク（既存→新規）: solo-camp-cot→family-camp-cot / two-room-tent-guide→vastland-tent / dutch-oven→camp-skillet。
- **今回の重要な学び**:
  - ① ウェア類（フリース・ダウン・ジャケット）は本体が厚く見えても、サイズ・カラー展開でページが分散しレビューが薄くなるため実は記事化が難しい→ブランド指定KW（実在の定番ブランド名）でないと狙いにくい。
  - ② ブランド軸記事（VASTLAND等）と、特定ブランド寡占商材（スキレット＝キャプテンスタッグ）は、従来の「ブランド占有ルール（同一ブランド2点まで）」と構造的に衝突する。そのためブランド軸記事・寡占商材に限りブランド占有ルールを緩和して運用する（ブランド深掘りが記事の主旨のため）。
  - ③ 候補の camp-socks はカイロ（使い捨てカイロ）混入、camp-griddle は ZEOOR 独占＋ふるさと納税返礼品の混入により採用5件が安定せず脱落。
- カテゴリ別記事数の変化: chair-table 9→10 / tent 28→29 / cookware 12→13。合計 99→102記事。

### 施策6: 新規2記事追加（自動選定パイプライン経由）
- electric-blanket-camp（アウトドア用電気毛布）: category=power / KW「電気毛布 アウトドア」。portable-power-large・mobile-battery-camp・camp-portable-power-beginner・car-camp-bed-kit へ内部リンク。
- sierra-cup（シェラカップ）: category=cookware / KW「シェラカップ」。dutch-oven・camp-skillet・mestin-recommend・camp-cooker-beginner へ内部リンク。採用TRUE5件のうち本体3件（スノーピーク チタン／3個セット／キャンピングムーン深型＋せいろ）＋活用アイテム2件（シリコンリッド＝蓋／コーヒーバネット＝ドリッパー）が混在していたため、vastland-tent と同じ「本体＋関連アイテム」分離パターンで正直に記事化。
- 双方向リンク（既存→新規）: portable-power-large→electric-blanket-camp / mestin-recommend→sierra-cup。
- **学び**: 自動選定関数 `autoScreenAndPick` を導入し products.tsv の精査を自動化。消費側アイテム（電気毛布・スポットクーラー・ロッキングチェア等）と補充KW（カセットコンロ・ストリングライト等）は楽天で本体が薄く、自動選定で軒並み採用5件未満となって脱落。結果、5件が安定して揃った電気毛布・シェラカップの2件のみ記事化。今後は「KWを予測してから探す」のではなく、過去に5件揃った実績のある系統から選ぶ方針に切り替える。
- カテゴリ別記事数の変化: power 8→9 / cookware 13→14。合計 102→104記事。

### 施策7: 新規5記事追加（ブランド軸・カニバ回避）
既存slugとのカニバを事前確認したうえで、競合の少ないブランド軸KW（WAQ/FIELDOOR/Naturehike/コールマン/DOD）を選定。vastland-tent・naturehike-tent と同じブランド軸記事フォーマット（タイプ別の使い分けを選び方の軸にする）で5本作成。商品データは products.tsv の採用フラグTRUE行から流し込み、商品名はセール表記・記号を除去してクリーニング。
- waq-chair（WAQのチェア）: category=chair-table / KW「WAQ チェア」。リクライニングロー/ウッド/ハイバック/コンフォート/2脚セットのタイプ別。camp-chair-highback・camp-chair-lightweight・family-camp-chair・low-style-table へ内部リンク。
- fieldoor-tent（FIELDOORのテント）: category=tent / KW「FIELDOOR テント」。ワンタッチタープテント（2.5m/3m）・ポップアップ・ヘキサゴンドームのサイズ／遮光遮熱／用途別。naturehike-tent・dod-tent・vastland-tent・family-camp-tent へ内部リンク。
- naturehike-mat（Naturehikeのマット）: category=sleeping-bag / KW「Naturehike マット」。エアーマット/インフレーター/エアーベッドのR値・厚み・サイズ別。camp-sleeping-mat・inflatable-mat・mountain-camp-mat・family-camp-mat へ内部リンク。
- coleman-tent（コールマンのテント）: category=tent / KW「コールマン テント」。ドーム/ツーリングドーム/ダークルームシェードのタイプ別・宿泊vs日除けの使い分け。family-camp-tent・two-room-tent-guide・large-tent-guide・dod-tent へ内部リンク。
- dod-tarp（DODのタープ）: category=tent / KW「DOD タープ」。オクラ（難燃TC）/いつかの（ヘキサ）/ビートル（7角形）の本体3選＋ビッグタープポールを関連アイテムとして分離（vastland-tent と同じパターン）。camp-tarp-beginner・hexa-tarp・large-tarp-recommend・tarp-pole へ内部リンク。
- **今回の運用判断（採用TRUE行の重複への対処）**:
  - dod-tarp: 採用TRUE行に「いつかのタープ TT5-631-TN」がショップ違いで二重計上、かつビッグタープポールは採用FALSE。本体ユニークは3種のみのため、プラン「本体4＋ポール」を変更し**本体3選＋ポール（関連）**で作成（FALSEのヘキサタープは不採用）。
  - coleman-tent: 採用TRUE行で「BCクロスドーム/270」(型番2000038429)が順位1と順位8に重複。安い順位1(¥19,980)に統合し、ツーリングドームST/ポップアップシェード/クイックアップシェードと合わせ**おすすめ4選**で作成。
  - fieldoor-tarp はワンタッチタープテントで fieldoor-tent と商品が重複するため生成対象から除外。
- **内部リンク方針**: 前バッチ（vastland-tent）の実践に倣い、新記事→既存記事の一方向リンクのみ。安定稼働中の既存記事は「既存記事に触らない」安全ルールに従い未編集（逆リンクは付与せず）。
- カテゴリ別記事数の変化: chair-table 10→11 / tent 29→32 / sleeping-bag 16→17。合計 104→109記事。

### 施策8: 新規5記事追加（ブランド軸・厚い商材で勝ちパターン継続）
既存slugとのカニバを事前確認したうえで、競合の少ないブランド軸KW（Jackery/DOD/ロゴス/キャプテンスタッグ/EcoFlow）を選定。vastland-tent・dod-tarp と同じブランド軸記事フォーマット（容量・サイズ・タイプ別の使い分けを選び方の軸にする）で5本作成。商品データは products.tsv の採用フラグTRUE行から流し込み、商品名はセール表記・クーポン文言・記号を除去してクリーニング。
- jackery-power-station（Jackeryのポータブル電源）: category=power / KW「Jackery ポータブル電源」。512/1070/2042Whの容量別×本体/ソーラーセットで5選。portable-power-large・solar-portable-power・camp-portable-power-beginner・mobile-battery-camp へ内部リンク。
- dod-chair（DODのチェア）: category=chair-table / KW「DOD チェア」。グッドラックソファ（2人掛け）とスゴイッス（高さ・角度調整）の2選。camp-chair-highback・camp-chair-lightweight・waq-chair・family-camp-chair へ内部リンク。
- logos-bonfire（ロゴスの焚き火台）: category=bonfire / KW「ロゴス 焚き火台」。ピラミッドTAKIBI L焚き火台/M BBQ/L BBQのサイズ×タイプで3選。bonfire-sheet・secondary-combustion-bonfire・bonfire-stand-beginner・fire-tongs へ内部リンク。
- captain-stag-table（キャプテンスタッグのテーブル）: category=chair-table / KW「キャプテンスタッグ テーブル」。ロール/ツーウェイ/折りたたみのタイプ・サイズ・高さ別で5選。camp-table-folding・low-style-table・group-camp-table・camp-table-set へ内部リンク。
- ecoflow-power（EcoFlowのポータブル電源）: category=power / KW「EcoFlow ポータブル電源」。768/1024/2048Whの容量別×本体/ソーラーセットで5選。portable-power-large・jackery-power-station（同バッチ）・solar-panel-folding・portable-power-vehicle-camp へ内部リンク。
- **今回の運用判断（採用TRUE行の重複への対処／dod-tarpと同じ方針＝ユニークモデルで正直に）**:
  - dod-chair: グッドラックソファ（CS2-500）がBK/TN/KHの色違い・ショップ違いで4行に重複。ユニーク本体は「グッドラックソファ（カラー展開）＋スゴイッス」の2モデルのみのため、5選を名乗らず**おすすめ2選**で作成。色展開・ショップ別価格（13,750〜14,801円）は正直に明記。
  - logos-bonfire: ピラミッドTAKIBI Lが複数ショップで重複（9,900〜12,870円）。サイズ（L/M）×タイプ（焚き火台/BBQコンロ）のユニーク3種で**おすすめ3選**。ショップ違いの価格差は注記で明示。
  - jackery-power-station / ecoflow-power / captain-stag-table は採用5件が別モデルのためそのまま**5選**。
  - captain-stag-table はレビュー件数が少ない（2〜6件）モデル中心のため、件数を正直に表示し冒頭に注記。レビュー0や極端に薄い商品はなかったため「評価準備中」表記は不使用。
- **学び**: ブランド軸×厚い商材の勝ちパターンを継続。Jackery/EcoFlow/DOD/ロゴス/キャプテンスタッグで自動選定が5件揃った。coleman-coolerは商品0件・naturehike寝袋は429レート制限でエラー→揃った6枠から5枠を選び記事化。dod-chair/logos-bonfireは同一モデルの色違い・ショップ違い重複をユニークモデルで正直に構成。
- **内部リンク方針**: 前バッチ（施策7）と同様、新記事→既存記事の一方向リンクのみ。安定稼働中の既存記事は「既存記事に触らない」安全ルールに従い未編集。
- カテゴリ別記事数の変化: power 9→11 / chair-table 11→13 / bonfire 9→10。合計 109→114記事。

### インフラ
- GAS「📊 SEOレポート」実装(手動実行でSearch Console順位取得)。GCPプロジェクト camp-kit-gsc で稼働。

### 既知の課題（次回以降）
- two-room-tent-guide: ProductCard商品名(FIELDOOR等)と比較表/まとめ(スノーピーク等)の商品データ不整合。楽天実データ再取得で要修正。
- 寝袋温度系スラッグ重複(camp-sleeping-bag-temperature-guide / sleeping-bag-temp-guide / sleeping-bag-temperature-guide)のカニバ確認は順位が上がってから。

### 次回チェック（※2026-06-23に第1回効果測定として実施済み）
- 施策1の3記事のCTR変化／施策2の6記事の順位変化は、2026-06-23の第1回効果測定で確認済み。
- 次回チェック（7/7）と「効果が出たパターンの横展開」方針は、本ファイル**冒頭の「2026-06-23」セクション**に移行（最新はそちらを参照）。
