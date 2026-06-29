# camp-kit-guide SEO施策ログ

数値の推移はGAS「SEOレポート」の履歴で追う。本ファイルは「いつ・どの記事を・なぜ・どう変えたか」を記録し、次回レポートで効果を評価するための施策台帳。新しい施策は上に追記する。

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

## 2026-06-29

### 差別化リライトの横展開（グループB継続）

6/23の差別化リライト3本（#1 backpack-capacity / #2 tent-size / #3 dutch-oven）に続き、グループB（おすすめ◯選型）の勝ち筋＝「判断軸を競合より体系的に表で整理＋買った後の実用情報＋初心者向け結論の明示（E-E-A-T偽装なし）」を残り記事へ展開した。

- **#4 solo-tent-overall（グループB・commit 2276652）**: ソロテントの選び方を自立式/非自立式・素材・重量などの判断軸で体系化したテント選定比較表中心の構成に再構築。※commitは作成済みだったが本ログへの記録が漏れていたため遡及記載。
- **#5 stylish-camp-tent（グループB・commit e7bc3f6）**: KW「おしゃれ キャンプ テント」。デザインタイプ別比較表（ワンポール／ベル型／カマボコ／パップ／ロッジ／ドームの7列×6行）・素材傾向表（ポリ／TC＝ポリコットン）・シーン別早見表を新設し、感覚的な「映え」を判断軸として体系化。ProductCard5商品・比較表1・FAQ5問はKEEP。updatedAtを6/29に更新（dateModified反映）。
- **#6 camp-chair-highback（グループB・commit 3fdc306）**: KW「ハイバックチェア キャンプ おすすめ」。①座面高タイプ別比較表（ハイ/ミドル/ロー×立ち座り・テーブル相性・焚き火距離感・用途）②リクライニング方式の判断軸表（無段階・無重力/段階式/ロッキング/固定）＋ヘッドレスト・生地（ポリ/TC/メッシュ）の使い分けを散文吸収 ③体格・用途別早見表を新設し、「くつろぎ・座り心地」を判断軸として体系化。21.7k→26.4k字、ProductCard5商品・比較表1・FAQ5問はKEEP、updatedAt6/29。カニバ防止のため食事メイン/家族向けは camp-chair-lightweight・family-camp-chair へリンク誘導し本記事は「くつろぎ」入口に純化。
- **#7 nanga-sleeping-bag（グループB・本コミット）**: KW「ナンガ シュラフ おすすめ」。ブランド軸×判断軸の体系化。①DXナンバー×ダウン量×季節×快適温度×用途の対応表（快適温度は記事掲載の実数値600=-6℃/750=-8℃のみ使用、450/800は質的記述・「目安/各製品表記を確認」明記）②形状選択ガイド表（マミー/封筒）③シリーズ別比較表（オーロラライト/テックス/オリジナル）。19.6k→22.6k字、ProductCard5・比較表1・FAQ5 KEEP、updatedAt6/29。**内部リンク0→3本**（sleeping-bag-temp-guide/season-guide/mummy-sleeping-bag）。温度別の深掘りはリンク誘導に留め、温度ガイド3記事（temp-guide/temperature-guide/camp-sleeping-bag-temperature-guide）とカニバらせず「ナンガの選び方」に純化。
- **#8 one-pole-tent（グループB・本コミット）**: KW「ワンポールテント おすすめ」。①形状×素材比較表（ティピー/ベル×TC/ポリ）②装備の判断軸表（煙突ポート/スカート/小川張り/火の粉耐性）③人数・スタイル別早見表。23.4k→27.3k字、ProductCard5・比較表1・FAQ5・設営手順 KEEP、updatedAt6/29。内部リンク1→4本、カニバ防止で solo-tent-overall/pup-tent/stylish-camp-tent へリンク誘導し「ワンポール」に純化。
- **cooler-box-day-camp（スキップ）**: グループB対象に挙げたが、`day-camp-cooler-box` と同一検索意図「デイキャンプ向けクーラーボックス5選」の重複記事（採用商品も AOクーラーズ/LOGOS/DODソフトくらお が重複）。片方をグループB化しても重複が深まるだけで棲み分け不能のためスキップ。クーラー系は overall/beginner も「キャンプ用クーラーボックスおすすめ5選」で重複気味＝カテゴリ全体の統廃合（canonical/統合）は別途方針判断が必要。

**効果測定（次回7/7）**
- グループBの型（判断軸の体系化＋実用情報）で各記事の順位が動くかを確認。動いた型をグループB残（two-room-tent-guide＝被リンク7本・要データ不整合修正 他）へ横展開する。
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
