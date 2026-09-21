# リライト台帳（rewrite-log）

既存記事のリライトが**効いたかどうかを後から機械的に判定する**ための台帳。候補抽出は機械的ルール（下記）、ベースラインは施策前の GSC 直近28日の値で固定する。
公開リポジトリに入るため **記事 slug と数値のみ** を書き、検索クエリの生値は書かない（クエリ付きの全件版は `.gitignore` 済みの `_file/rewrite-candidates.tsv`）。

- 初回作成: 2026-09-20（campkit-20260920-16）。データは `_file/gsc-meta.json` の期間（2026-06-20〜09-17・90日）と、同APIで追加取得した直近28日（2026-08-21〜09-17）
- 抽出ルール（90日・slug単位に正規化＝URL変種は impressions 加重で position 合成）: **Tier1** impressions≥100 かつ position 5.0〜15.0 ／ **Tier2** impressions≥100 かつ position 15.1〜30.0 ／ **Tier3** position≤10 かつ CTR<2.08%（サイト平均4.16%の半分）
- 抽出結果: Tier1 32本 ／ Tier2 5本 ／ Tier3 91本（Tier3 は表示数の下限を置いていないため表示数1桁の記事を多数含む。impressions≥100 は4本で全て Tier1 と重複）
- `検証予定日` は施策日＋28日。`結果` は検証日に同じ28日窓の impressions / clicks / ctr / position をベースラインと並べて記入する
- 施策の実行は campkit-20260920-17 から順次（1サイクル目: 2026-09-21 に3本実施）。slug／URL は変更しない

## Tier1 上位10本（90日 impressions 降順）— ベースラインと仮説

| slug | 対象クエリ数 | baseline_impressions | baseline_clicks | baseline_ctr | baseline_position | baseline_期間 | 仮説type | 仮説 | 施策日 | 検証予定日 | 結果 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| osprey-backpack | 22 | 1726 | 60 | 3.48% | 8.1 | 2026-08-21〜2026-09-17（28日） | 意図ズレ | ブランド名の表記ゆれ（記事は片方の表記のみ・もう一方は本文0回）と、日帰り小容量（デイパック）意図の受け皿が弱い。日常使い意図は osprey-daily-backpack が上位で受けているため本記事では追わず、表記ゆれ併記＋デイパック帯の見出し追加で取りに行く | 2026-09-21 | 2026-10-18 | |
| family-camp-summer-tent | 40 | 3194 | 14 | 0.44% | 9.8 | 2026-08-21〜2026-09-17（28日） | CTR | 最大クエリで28日2,700表示・0クリック（順位9.8）。09-20に title/description を変更済み（campkit-20260920-06）のため、まずその効果を測る。人数を限定しない汎用の夏向けテント意図に対し H1 がファミリー限定なのが意図ズレの二次仮説。表示は季節性が強く（8/22〜9/11に集中）検証は表示数でなくCTR・順位で行う | | 施策日＋28日 | |
| camp-backpack-capacity-guide | 64 | 2694 | 60 | 2.23% | 8.1 | 2026-08-21〜2026-09-17（28日） | 不足トピック | 28日最大の質問クエリ群（小容量10L帯の収納量を問うもの・表記ゆれ4種・合計約300表示・順位6〜8）に対応する専用見出しが無く、10〜80L一覧表の1行で受けている。10L帯の専用H2を追加して順位5以内を狙う（GSCクエリ根拠・競合見出しは未取得） | 2026-09-21 | 2026-10-18 | |
| soto-burner | 24 | 1363 | 20 | 1.47% | 6.5 | 2026-08-21〜2026-09-17（28日） | CTR | 28日表示の約6割が「メーカー名とブランド名の関係（同じ会社か）」を問う意図（表記ゆれ4種・順位5.8〜6.5）で、答えは本文H2にあるのに title ではその語が全角30字目以降（SERPで見切れる位置）。答えを title 先頭30字以内に置き直す。09-20 の title 変更は ST-310 追加が主で、この点は未対応 | 2026-09-21 | 2026-10-18 | |
| coleman-chair | 23 | 390 | 8 | 2.05% | 7.6 | 2026-08-21〜2026-09-17（28日） | 要判断 | 28日390表示のうち約217表示がアンカー付きURL（0クリック）で、基準URL単体のCTRは4.6%とサイト平均並み。90日→28日で表示が1/3に減少（季節性）。09-20に title 変更済みのため追加施策の根拠なし、測定待ち | | 施策日＋28日 | |
| inflatable-mat | 73 | 928 | 28 | 3.02% | 10.7 | 2026-08-21〜2026-09-17（28日） | 要判断 | 28日で73クエリと最も分散。比較・耐久性・寿命・厚さ・寝心地・デメリット系の情報クエリに対応するH2は既にある（08-19／09-18追記）のに順位18〜48で、見出しの有無ではなく深さの問題の可能性。競合の見出し構成を取得できなかったため保留 | | 施策日＋28日 | |
| mountain-camp-lantern | 18 | 687 | 31 | 4.51% | 9.2 | 2026-08-21〜2026-09-17（28日） | 意図ズレ | 主要クエリは登山用途だが、順位付き5製品のうち登山向け定番は0（ソーラー2・インテリア系電池式1・汎用ソーラー1・4個入り1）。定番モデルは本文追記のみで順位外。08-26の構造リライト（H2×3追加）後も順位9〜11で横ばい＝構造施策は出尽くし。商品差し替えが必要なため article-fix-backlog（product_swap）へ回す（article-fix-backlog へ product_swap で登録済み・2026-09-21） | | 施策日＋28日 | |
| fieldoor-tent | 28 | 675 | 15 | 2.22% | 6.2 | 2026-08-21〜2026-09-17（28日） | 意図ズレ | ブランド指名クエリが順位2で0クリック（公式サイト目的・改善不能）を除くと、残る「テント」意図に対し採用5製品のうち3製品がタープテント。テント本体（ドーム・ワンポール）のラインナップが無い。updatedAt が 06-08 のまま（上位10本で唯一未更新）。商品構成の見直しは article-fix-backlog 管轄（article-fix-backlog へ product_swap で登録済み・2026-09-21） | | 施策日＋28日 | |
| tent-size-beginner-guide | 16 | 354 | 12 | 3.39% | 7.9 | 2026-08-21〜2026-09-17（28日） | 要判断 | 主要クエリは順位3〜10に散在し、不足見出しは GSC からは特定できず。09-20 に title/description 変更済みのため測定待ち | | 施策日＋28日 | |
| mysteryranch-backpack | 11 | 439 | 20 | 4.56% | 7.7 | 2026-08-21〜2026-09-17（28日） | 内部リンク不足 | 自サイトから本記事への内部リンクが0本（上位10本で唯一。osprey-backpack は6本）。同ブランド軸のバックパック記事4本と容量ガイドから1行ずつ送る。09-20 に4枠中3枠の商品差し替え済みのためベースラインはそれ以前の値 | 2026-09-21 | 2026-10-18 | |

補足（ベースラインの前提）:

- `対象クエリ数` は直近28日に GSC が記事に紐づけて返したクエリ数（匿名化されたクエリは含まない）。mysteryranch-backpack は表示439に対し11件しか返らず、クエリ根拠が薄い
- 2026-09-20 に別タスクで frontmatter の title/description を変更済み: family-camp-summer-tent／camp-backpack-capacity-guide／soto-burner／coleman-chair／tent-size-beginner-guide（campkit-20260920-06）。ベースライン期間（〜09-17）はこの変更より前なので、次の施策とは切り分けて CTR を読む
- 2026-09-20 に mysteryranch-backpack の4枠中3枠を商品差し替え済み（campkit-20260920-07）。ベースラインは差し替え前の値
- family-camp-summer-tent は表示が 8/22〜9/11 に集中する季節性が強く、施策後28日（10月）は表示自体が落ちる。比較は impressions でなく CTR・position で行う
- 競合ページの見出し取得は本セッションで外部HTTPが許可されず未実施。`不足トピック` の仮説は GSC クエリと自記事の見出し照合のみを根拠にしている

## Tier1 11位以下（22本・90日 impressions 降順）— ベースラインと仮説・着手可否

2サイクル目（campkit-20260921-01・2026-09-21）で追加。上位10本と同じ列構成で、ベースラインは同じ直近28日（2026-08-21〜09-17）。`仮説` 列の先頭に **着手可否** を `着手可否=○ ／ 2026-10-18まで待機 ／ 測定継続` で記載する。**2026-09-20〜09-21 に title／description／本文を変更した記事は `2026-10-18まで待機`**（09-20/21 の変更と次施策が同じ28日窓に混ざると切り分けできないため。09-21 の mysteryranch 向け内部リンク1行＋updatedAt の変更も本文変更として扱う）。09-20 の楽天リンク形式変換（d26d056）は本文・title に触れていないため待機対象にしない。内部リンク本数は `content/posts/*.mdx` 内の `[…](/posts/<slug>)` を持つ記事数（自記事除く・2026-09-21 時点）。

| slug | 対象クエリ数 | baseline_impressions | baseline_clicks | baseline_ctr | baseline_position | baseline_期間 | 仮説type | 仮説 | 施策日 | 検証予定日 | 結果 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| karrimor-backpack | 24 | 204 | 12 | 5.88% | 6.4 | 2026-08-21〜2026-09-17（28日） | 要判断 | 着手可否=2026-10-18まで待機（09-21 に内部リンク1行＋updatedAt 変更）。CTR 5.88%・順位6.4 でサイト平均を上回り、09-04 までに絞り込み・容量帯・兼用可否の H2 を追加済み。ブランド＋おすすめ意図のクエリが順位17だが表示9で根拠薄。追加施策の優先度は低い | | 施策日＋28日 | |
| camp-table-set | 30 | 282 | 8 | 2.84% | 11.9 | 2026-08-21〜2026-09-17（28日） | 内部リンク不足 | 着手可否=2026-10-18まで待機（09-21 に内部リンク3本を受領・4サイクル目で施策済。本体は本文・title・updatedAt とも不変更）。主要クエリ5種（テーブルセットの表記ゆれ）がいずれも順位14前後で page2 に揃っており、CTR でなく順位の問題。09-04 に人数別・単品との違いの H2 を追加済みで構造施策は実施済み。自サイトからの内部リンクは施策前3本（captain-stag-table／solo-camp-cot／takibi-table）。同じテーブル系で camp-table-folding にはリンクしていた dod-table／low-style-table／outdoor-kitchen-table から「椅子付きセット」文脈で各1行送付（→6本）。hanging-rack／water-jug は文脈が遠いため未使用 | 2026-09-21 | 2026-10-18 | |
| gregory-backpack | 20 | 364 | 13 | 3.57% | 8.5 | 2026-08-21〜2026-09-17（28日） | 不足トピック | 着手可否=2026-10-18まで待機（09-21 に内部リンク1行＋updatedAt 変更）。主要クエリの上位3種（合計36表示・順位9〜11）が「容量別・サイズ比較」意図なのに、H2 はテンプレ標準のみで容量帯を横断する見出しが無い（karrimor-backpack にある「容量帯で見る位置づけ」相当が無い）。待機明けに既存5モデルの容量を並べて比較する H2 を追加する | | 施策日＋28日 | |
| mountain-backpack-30l | 37 | 288 | 13 | 4.51% | 13.5 | 2026-08-21〜2026-09-17（28日） | 要判断 | 着手可否=○（09-11 以降未更新）。最大クエリは富士登山向け（21表示・順位11.7）で、H3「ポイント5：富士登山で使うなら」は既にある（本文「富士」13回）。おすすめ系クエリは順位20前後。見出しの有無でなく順位の深さの問題で、TSV と本文からは次の一手を特定できない。内部リンクは10本で十分 | | 施策日＋28日 | |
| portable-fridge | 8 | 210 | 1 | 0.48% | 7.7 | 2026-08-21〜2026-09-17（28日） | CTR | 着手可否=2026-10-18まで待機（09-21 に title 変更＋内部リンク3本を受領・3サイクル目で施策済）。順位7.7 で CTR 0.48%（90日でも 2.35%）とサイト平均の1/8。クエリ判明は8件（表示の1割）で、判明分の「車載冷蔵庫」系は順位3.1。title は「ポータブル冷蔵庫」のみで「車載冷蔵庫」表記が無かった（本文には11回・第5位の商品名にもある）ため、title 先頭14字以内に「車載冷蔵庫」を併記（全角32→36字・description は既に「車載」を含むため不変更）。あわせて自サイトからの内部リンクが0本だったので、camp-cooler-box-overall／portable-power-vehicle-camp／cooler-ice-pack から各1行送付 | 2026-09-21 | 2026-10-18 | |
| waterproof-backpack | 11 | 226 | 11 | 4.87% | 9.9 | 2026-08-21〜2026-09-17（28日） | 要判断 | 着手可否=○（06-08 以降未更新）。CTR 4.87% はサイト平均並み。判明クエリは表示20/226 と薄く、雨対策系（順位25）はレインカバー意図で backpack-rain-cover が担当のため追わない。残りの匿名クエリの意図が読めず保留 | | 施策日＋28日 | |
| camp-rainwear | 3 | 147 | 3 | 2.04% | 8.7 | 2026-08-21〜2026-09-17（28日） | 要判断 | 着手可否=○（06-01 公開以降未更新）。順位8.7 で CTR 2.04% と低いが、判明クエリが3件（各1表示）で原因を特定できない。title が全角38字と長く末尾の季節語が SERP で見切れる可能性はあるが根拠不足。梅雨向けで季節性が強い | | 施策日＋28日 | |
| naturehike-tent | 4 | 204 | 13 | 6.37% | 6.0 | 2026-08-21〜2026-09-17（28日） | 要判断 | 着手可否=○（06-02 公開以降未更新）。CTR 6.37%・順位6.0 で良好。判明クエリ4件のうちカナ表記（順位17）と英字表記（順位24.7）は合計表示7で薄い。本文にカナ表記は3回あり表記ゆれの欠落ではない。改善余地小 | | 施策日＋28日 | |
| car-camp-lighting | 11 | 174 | 9 | 5.17% | 8.8 | 2026-08-21〜2026-09-17（28日） | 内部リンク不足 | 着手可否=2026-10-18まで待機（09-21 に内部リンク4本受領＋まとめH2語順修正・6サイクル目で施策済。リンク元: car-camp-bed-kit／car-camp-mat／electric-blanket-camp の各まとめ締め段落直後と camp-lantern-led の「用途別おすすめランタン」末尾に1行。本体はまとめ H2「まとめ：ライト 車中泊の用途別おすすめ一覧」→「まとめ：車中泊ライトの用途別おすすめ一覧」の1行＋updatedAt のみ変更。title／description／slug・商品部分は不変更。**本体の見出し変更と被リンク追加の混合施策のため 10-18 の判定で要因分離はできない**）。施策前の状態: 06-29 以降未更新。主要クエリ（照明・ライト・ランタン×車中泊）が順位8〜15で page1 下部〜page2。自サイトからの内部リンクは2本（car-side-tarp／car-shade）で、同じ車中泊系の car-camp-bed-kit からは0本。まとめの H2 が「ライト 車中泊の用途別」と KW 倒置になっており、内部リンク追加と同時に自然な語順へ直す | 2026-09-21 | 2026-10-18 | |
| deuter-backpack | 9 | 157 | 13 | 8.28% | 8.2 | 2026-08-21〜2026-09-17（28日） | 不足トピック | 着手可否=2026-10-18まで待機（09-21 に内部リンク1行＋updatedAt 変更）。判明クエリの7割が「普段使い」意図（22表示・順位6.3）で、本文に「普段使い」5回・「通勤」6回の言及はあるが専用見出しが無い。osprey のような普段使い専用記事は無いので、本記事に普段使い向けモデルの H2 を追加する。内部リンクも1本（mysteryranch-backpack）のみで、待機明けにリンク元追加を併せる | | 施策日＋28日 | |
| bluetti-power | 3 | 90 | 1 | 1.11% | 11.7 | 2026-08-21〜2026-09-17（28日） | 内部リンク不足 | 着手可否=2026-10-18まで待機（09-21 に内部リンク4本受領・6サイクル目で施策済。リンク元: disaster-portable-power の第3位 BLUETTI AC70 段落直後と jackery-power-station／ecoflow-power／portable-power-large の各まとめ締め段落直後に1行。本体は本文・title・updatedAt とも不変更。**判定は position**＝順位24〜29 が競合起因なら内部リンクでは動かない可能性あり）。施策前の状態: 09-07 以降未更新。判明クエリ3件はいずれもブランド＋おすすめ意図で順位24〜29（page3）。title・H2 はブランドの英字・カナを併記済みで on-page の表記ゆれではない。自サイトからの内部リンクは1本（portable-power-guide）のみ。電源カテゴリの他記事から1行ずつ送る。順位24〜29 が競合起因なら内部リンクでは動かない可能性あり | 2026-09-21 | 2026-10-18 | |
| car-side-tarp | 7 | 129 | 4 | 3.1% | 10.0 | 2026-08-21〜2026-09-17（28日） | 要判断 | 着手可否=○（06-29 以降未更新）。判明クエリはブランド無指定の「おすすめ」意図が順位30台で、合成順位10.0 との乖離が大きい（匿名クエリが上位）。本文・見出しは主要表記を含み、TSV からは不足見出しを特定できない。内部リンクは4本 | | 施策日＋28日 | |
| closed-cell-mat | 11 | 191 | 5 | 2.62% | 9.8 | 2026-08-21〜2026-09-17（28日） | 要判断 | 着手可否=測定継続（09-04 公開でベースライン窓の半分しか含まれていない。09-20 の変更は楽天リンク形式のみ）。順位9.8・CTR 2.62% は公開直後の値で安定していない。10-18 の窓で再評価 | | 施策日＋28日 | |
| logos-bonfire | 4 | 129 | 7 | 5.43% | 7.1 | 2026-08-21〜2026-09-17（28日） | 要判断 | 着手可否=○（06-08 以降未更新）。判明クエリは「網サイズ」「サイズ」意図（順位7.5〜9.3）で、本文に「網」は13回あり情報自体はある。CTR 5.43% は平均超。表示の9割が匿名で追加施策の根拠なし | | 施策日＋28日 | |
| camp-gear-sale-timing | 4 | 156 | 7 | 4.49% | 6.2 | 2026-08-21〜2026-09-17（28日） | 内部リンク不足 | 着手可否=2026-10-18まで待機（09-21 に内部リンク2本を受領・3サイクル目で施策済。本体は本文・title・updatedAt とも不変更）。順位6.2・CTR 4.49% と良好だが、自サイトからの内部リンクが0本だった。判明クエリ（テント／クーラーボックスの安い時期）に対応して、snowpeak-tent（テント）と camp-cooler-box-overall（クーラーボックス）の締めパラグラフから各1行送付 | 2026-09-21 | 2026-10-18 | |
| group-camp-tent | 1 | 119 | 8 | 6.72% | 8.3 | 2026-08-21〜2026-09-17（28日） | 要判断 | 着手可否=○（04-29 公開以降未更新・11位以下で最古）。CTR 6.72% は良好。H2 が選び方／5選／比較表／まとめの4本のみで、お手入れTips・FAQ が無い旧構成。判明クエリが1件（人数意図・順位25）で不足見出しを特定できないが、FAQ 追加（人数・サイズ意図）は構造面の候補 | | 施策日＋28日 | |
| forged-peg | 7 | 134 | 5 | 3.73% | 11.3 | 2026-08-21〜2026-09-17（28日） | 要判断 | 着手可否=○（06-02 公開以降未更新）。主要クエリ（おすすめ意図 21表示・順位11.8／単体KW 16表示・順位21.4）が page2。title・H2 は主要KWを含み標準構成。内部リンクは3本（ground-sheet／guy-rope-recommend／peg-hammer）でペグ関連のみ。テント記事からの誘導追加は候補だが、順位差が競合起因かは判断できず | | 施策日＋28日 | |
| torch-burner | 2 | 78 | 7 | 8.97% | 8.7 | 2026-08-21〜2026-09-17（28日） | 内部リンク不足 | 着手可否=2026-10-18まで待機（09-21 に内部リンク4本受領・6サイクル目で施策済。リンク元: fire-blower／family-camp-bbq／hand-axe の各まとめ末尾と camp-bbq-grill の Tips 末尾に「炭・薪の着火・火起こし」文脈で1行。指定候補8本のうち「着火／火起こし／炙り／着火剤」の言及があったのは fire-blower（4件）のみで、残り7本は0件だったため、同じ語の言及がある焚き火・BBQ系の camp-bbq-grill（3件）／family-camp-bbq（3件）と「火付け」言及のある hand-axe を補った。本体は本文・title・updatedAt とも不変更）。施策前の状態: 09-20 の変更は楽天リンク形式のみ。CTR 8.97% と高いが自サイトからの内部リンクが0本。判明クエリの火起こし用途意図（順位18.8）に対応して、charcoal-starter（火起こし）・焚き火台系（logos-bonfire／coleman-bonfire／captain-stag-bonfire）・iwatani-stove／soto-burner から送る（本記事から iwatani-stove へは既にリンクあり）。→ charcoal-starter／soto-burner は5サイクル目までの待機中、logos-bonfire／iwatani-stove は Tier1在庫のため実際には使わなかった | 2026-09-21 | 2026-10-18 | |
| mountain-tent-cheap | 0 | 90 | 8 | 8.89% | 8.9 | 2026-08-21〜2026-09-17（28日） | 要判断 | 着手可否=○（05-26 公開以降未更新）。28日の判明クエリが0件で仮説を立てる材料が無い。CTR 8.89% は良好。内部リンクは1本（solo-tent-overall） | | 施策日＋28日 | |
| camp-table-folding | 2 | 70 | 1 | 1.43% | 9.2 | 2026-08-21〜2026-09-17（28日） | CTR | 着手可否=2026-10-18まで待機（09-21 に title/description/updatedAt を変更・4サイクル目積み残しで施策済）。監督判断によりA案（折りたたみ主要KW先頭化）で実施: title「キャンプ用折りたたみテーブル5選【2026年版】サイズ・重量で比較」（33字）→「折りたたみテーブルおすすめ5選【2026年版】耐荷重50kg・サイズ比較」（36字・主要KWを先頭に・本文実在の数値フック）、description は先頭1文で用途＋実測価格帯（約2,700〜7,900円）を明示（136→157字）。本文不変更。順位9.2 で CTR 1.43%（90日 0.91%）とサイト平均の1/3以下が90日通して続く。判明クエリ2件は合計4表示・順位19〜21で、表示の9割超は匿名クエリ。H2 が「この記事でわかること」「各製品の詳細レビュー」「比較表まとめ」と旧テンプレ構成（2024-06 公開・最古）。内部リンクは8本と十分。構成の標準化は待機明けの候補 | 2026-09-21 | 2026-10-18 | |
| day-camp-tent | 3 | 26 | 3 | 11.54% | 11.8 | 2026-08-21〜2026-09-17（28日） | 要判断 | 着手可否=測定継続（08-24 に H2×3 追加済み）。90日107→28日26表示と季節性で減少中。施策済みの効果測定を優先し、来季の表示回復まで追加施策は保留 | | 施策日＋28日 | |
| iwatani-stove | 1 | 43 | 5 | 11.63% | 6.6 | 2026-08-21〜2026-09-17（28日） | 要判断 | 着手可否=○（06-15 公開以降未更新）。CTR 11.63%・順位6.6 で改善余地が小さく、判明クエリ1件。追加施策不要 | | 施策日＋28日 | |

補足（11位以下の読み方）:

- 着手可能（`着手可否=○`）かつ仮説が `要判断` 以外の記事は **無し**（3サイクル目で portable-fridge／camp-gear-sale-timing、4サイクル目で camp-table-set、4サイクル目積み残し（campkit-20260921-04）で camp-table-folding、6サイクル目（campkit-20260921-06）で car-camp-lighting／bluetti-power／torch-burner を消化）。Tier2＋Tier3 上位の台帳（後述）で着手可だった3本も5サイクル目で消化済みのため、**着手可在庫は 0本**。7サイクル目以降は 10-18 の検証結果を見て待機明け候補（gregory-backpack／deuter-backpack 等）から選ぶか、article-fix-backlog の product_swap 消化・backpack-rain-cover の内部リンク追加に振り替える
- `2026-10-18まで待機` は karrimor-backpack／gregory-backpack／deuter-backpack（09-21 に mysteryranch-backpack への内部リンク1行＋updatedAt を変更）と portable-fridge／camp-gear-sale-timing（09-21 に3サイクル目で施策済）、camp-table-set（09-21 に4サイクル目で施策済）、camp-table-folding（09-21 に title/description 変更・監督判断A案）、car-camp-lighting／torch-burner／bluetti-power（09-21 に6サイクル目で施策済）の10本。待機明けの候補は gregory-backpack（容量別 H2）と deuter-backpack（普段使い H2＋リンク元追加）
- 3サイクル目（09-21）でリンク元として本文1行＋updatedAt を変更した Tier1 台帳外の記事: **camp-cooler-box-overall／portable-power-vehicle-camp／cooler-ice-pack／snowpeak-tent** の4本。4サイクル目（09-21）で同様に変更した Tier1 台帳外の記事: **dod-table／low-style-table／outdoor-kitchen-table** の3本。5サイクル目（09-21）で同様に変更した Tier1 台帳外の記事: **solo-tent-overall／solo-tent-beginner／coleman-tent／dod-tent**（→duo-tent）と **secondary-combustion-bonfire／charcoal-starter／bonfire-sheet／bonfire-stand-beginner**（→fire-extinguish-pot）の8本。6サイクル目（09-21）で同様に変更した Tier1 台帳外の記事: **car-camp-bed-kit／car-camp-mat／camp-lantern-led／electric-blanket-camp**（→car-camp-lighting）、**fire-blower／camp-bbq-grill／family-camp-bbq／hand-axe**（→torch-burner）、**disaster-portable-power／jackery-power-station／ecoflow-power／portable-power-large**（→bluetti-power）の12本。いずれも 2026-10-18 まで待機扱い（Tier2 以下を台帳化する際に、この計27本は 09-21 変更ありとして扱う）
- 商品構成そのものが問題と判断できた記事: 6サイクル目の施策③でリンク元候補を確認した際に **camp-portable-power-beginner**（Tier1／Tier2 台帳外）の H3 見出し5本（Jackery 1000 Pro／EcoFlow DELTA 2／BLUETTI AC180／Anker SOLIX C800／Jackery 300 Plus）と ProductCard の実商品（無名500Wh／LACITA エナーボックス444Wh／EcoFlow DELTA 3 1000 Air／EcoFlow RIVER 2／BLUETTI AC50B）が **全5枠不一致**であることを検出し、`_file/article-fix-backlog.tsv` へ product_swap（priority B＝GSC 28日で表示0。ただし内部リンク7本を受ける初心者ハブ）で登録した（camp-backpack-beginner と同型）。同記事はリンク元として使わなかった
- 内部リンク0本の記事: 無し（torch-burner は 09-21 に4本で解消。portable-fridge／camp-gear-sale-timing は 09-21 に解消）
- Tier3 閾値の引き下げ（`impressions_28d ≥ 25` の次点4本の台帳化）は **見送りと決定**（campkit-20260921-06 監督判断・2026-09-21）。次点4本はベースライン窓の途中公開で順位・CTR が安定せず、10-18 の検証結果を見てから再検討する

## Tier2＋Tier3 上位（9本）— ベースラインと仮説・着手可否

5サイクル目の先行タスク（campkit-20260921-04・2026-09-21）で追加。Tier1 11位以下と同じ列構成・同じ直近28日（2026-08-21〜09-17）のベースライン。対象は **Tier2 の5本すべて**と、**Tier3 のうち `impressions_28d ≥ 30` かつ Tier1 と重複しない4本**（camp-gear-where-to-buy／backpack-rain-cover／fire-extinguish-pot／camp-rental-price。次点の coleman-sleeping-bag は28日29表示で閾値未満。Tier3 の残り83本は28日表示が2桁前半〜1桁で仮説が立たないため今回は台帳化しない）。着手可否は Tier1 11位以下と同じ3値（`○ ／ 2026-10-18まで待機 ／ 測定継続`）。9本のうち 09-20〜09-21 に title／本文を変更した記事は無い（kids-sleeping-bag／duo-tent／backpack-rain-cover／fire-extinguish-pot の 09-20 コミットは楽天リンク形式変換 d26d056 のみで待機対象外）。ベースラインは slug 単位に正規化した値（アンカー付きURL変種を impressions 加重で合成）。内部リンク本数は 2026-09-21 時点の実測（自記事除く）。

| slug | 対象クエリ数 | baseline_impressions | baseline_clicks | baseline_ctr | baseline_position | baseline_期間 | 仮説type | 仮説 | 施策日 | 検証予定日 | 結果 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| kids-sleeping-bag | 25 | 1013 | 11 | 1.09% | 23.5 | 2026-08-21〜2026-09-17（28日） | 意図ズレ | 着手可否=○（ただしリライト枠では扱わず article-fix-backlog へ product_swap で登録済み・2026-09-21）。判明25クエリの大半が「子供・キッズ・幼児×寝袋・シュラフ」の表記ゆれで順位33〜44（page4）に揃う。08-27 に表記ゆれ網羅（本文: 子ども40回・子供14回・キッズ23回・幼児11回・シュラフ23回）と内部リンク集中（17本・Tier2/3 で最多）のリライト済みだが、90日23.4→28日23.5 で動かず on-page 施策は出尽くし。順位付き5製品のうち子供専用は第1〜2位の2製品のみ（第3位は大人用汎用・第4位は2人用・第5位はインナーシュラフ）で、意図に対する商品構成の問題。基準URL単体は表示789・順位28.0で、アンカー付きURL変種（順位7〜8・0クリック）が合成順位を押し上げている | | 施策日＋28日 | |
| solo-tent-lightweight | 52 | 1149 | 4 | 0.35% | 30.0 | 2026-08-21〜2026-09-17（28日） | 要判断 | 着手可否=○（08-28 以降未更新。article-fix-backlog へ needs-human で論点登録済み・2026-09-21）。判明52クエリ（Tier2/3 で最多）はほぼ全て「一人用×軽量／超軽量／最軽量」意図で各20〜50表示・順位31〜38（page3〜4）に揃い、CTR 0.35% はサイト平均の1/12。08-28 に「一人用テントは何kgが軽量か」の H2 を追加済みで、本文の「一人用」9回・「1人用」15回・「前室」15回と表記ゆれ・不足見出しは解消済み。順位付き5製品は 1.8〜3.3kg の入門価格帯で超軽量（1kg前後）クラスが0のため、意図との差は商品構成側。ただし1kg級に寄せると lightweight-mountain-tent（90日表示6）と役割が重なる。内部リンクは3本（lightweight-mountain-tent／solo-tent-overall／tent-size-beginner-guide）で、方針が決まるまでリンク追加も保留 | | 施策日＋28日 | |
| sleeping-bag-temperature-guide | 49 | 1272 | 8 | 0.63% | 22.2 | 2026-08-21〜2026-09-17（28日） | 不足トピック | 着手可否=2026-10-18まで待機（09-21 に逆引き早見表 H2「快適温度○℃の寝袋はいつ使える？（逆引き早見表）」を `## 1.` 末尾・`## 2.` 直前に追加＋updatedAt 更新・5サイクル目で施策済。title／description／slug・ProductCard・比較表は不変更。表の値は既存の温度別早見表と季節別ガイドから機械的に反転した6行＝快適温度 15／10／5／0／-5／-10℃）。施策前の状態: 09-01 以降未更新。07-24 に3記事を統合したハブ。判明49クエリのうち「快適温度／最低使用温度／限界温度／3シーズン×温度」の温度表記系が各24〜51表示・順位17〜28（page2〜3）で最大の塊。中でも「快適温度＋具体的な温度値（10度／5度／0度／-10度）」の組み合わせが各26〜37表示・順位24〜38 あるが、本文の早見表は「外気温→必要な快適温度」の順引きのみで、「快適温度X℃の寝袋はどの季節・最低気温まで使えるか」の逆引きが無い。逆引き早見表の H2（快適温度 15／10／5／0／-5／-10℃ → 使える季節・想定最低気温・併用装備）を `## 1.` の末尾または `## 2.` の直前に追加する。季節系（春・夏・暑い）は順位38〜48、サイズ・重さ系は順位45〜60 で別記事（sleeping-bag-summer-cospa 等）の領域のため追わない。内部リンクは16本で十分。CTR 0.63% は順位22 に起因するため title は変えない | 2026-09-21 | 2026-10-18 | |
| duo-tent | 2 | 66 | 3 | 4.55% | 10.1 | 2026-08-21〜2026-09-17（28日） | 内部リンク不足 | 着手可否=2026-10-18まで待機（09-21 に内部リンク4本受領・5サイクル目で施策済。リンク元: solo-tent-overall／solo-tent-beginner／coleman-tent／dod-tent の各まとめ末尾に1行。本体は本文・title・updatedAt とも不変更）。施策前の状態: 09-11 以降未更新。08-11 公開で 90日21.3→28日10.1 と順位が上がっている途中。自サイトからの内部リンクが **0本**（Tier2 で唯一）だった。判明クエリは2件（デュオ系・順位6〜15）で薄いが、リンク0本は仮説に依存しない改善点。リンク元候補はテント系で 10-18 待機中でない記事: solo-tent-overall／solo-tent-beginner／family-camp-tent／coleman-tent／dod-tent（第1・4位コールマン ツーリングドーム、第2・5位 DOD の同ブランド記事）／one-touch-tent。tent-size-beginner-guide（09-20 title 変更）・snowpeak-tent（09-21 リンク元）・naturehike-tent（Tier1 着手可在庫）は使わない | 2026-09-21 | 2026-10-18 | |
| camp-backpack-beginner | 15 | 140 | 0 | 0% | 18.6 | 2026-08-21〜2026-09-17（28日） | 意図ズレ | 着手可否=○（ただしリライト枠では扱わず article-fix-backlog へ product_swap（priority A）で登録済み・2026-09-21）。Tier2 で唯一クリック0。着手前の実測で、H3 見出し・本文・主なスペックは「オスプレー ケストレル48／グレゴリー バルトロ65／ドイター／ミレー／カリマー」のブランド定番モデルなのに、ProductCardMdx の商品名・価格・画像・リンクは無名OEM品（タクティカル／登山リュック40〜60L／HAWK GEAR 80L・55L／帆布リュック）で **全5枠が不一致**。見出しとカードの整合が先で、title／内部リンク（7本）の施策は差し替え後に判断する。frontmatter に updatedAt が無い（最終コミット 06-22）。判明クエリの最大は「キャンプ×リュック」系（順位44.5）で本文「リュック」11回・「バックパック」36回 | | 施策日＋28日 | |
| backpack-rain-cover | 1 | 46 | 0 | 0% | 8.2 | 2026-08-21〜2026-09-17（28日） | 内部リンク不足 | 着手可否=測定継続（09-10 公開でベースライン窓の8日分しか含まれず順位・CTR が安定していない）。自サイトからの内部リンクは **0本**（本記事から waterproof-backpack へは2本送っている片方向）。判明クエリ1件（順位26）で仮説は立てられないが、10-18 の窓で再評価する際、内部リンク0本の解消（waterproof-backpack／camp-rainwear／mountain-backpack-30l／camp-backpack-capacity-guide 等の登山・雨対策系から）を最初の施策にする | | 施策日＋28日 | |
| camp-gear-where-to-buy | 0 | 42 | 0 | 0% | 8.6 | 2026-08-21〜2026-09-17（28日） | 要判断 | 着手可否=○（08-17 公開以降未更新）。順位8.6 で CTR 0%（90日 56表示・0クリック）と page1 にいながら全くクリックされていないが、判明クエリが **0件**で、どの意図で表示されているか読めない。hinataストア導線の ASP 記事（title 36字）。内部リンクは3本（camp-gear-initial-cost／camp-gear-sale-timing／disaster-camp-gear）。クエリが取れるまで title の当てずっぽうな変更はしない | | 施策日＋28日 | |
| fire-extinguish-pot | 0 | 35 | 0 | 0% | 8.0 | 2026-08-21〜2026-09-17（28日） | 内部リンク不足 | 着手可否=2026-10-18まで待機（09-21 に内部リンク4本受領・5サイクル目で施策済。リンク元: secondary-combustion-bonfire／charcoal-starter／bonfire-sheet の「使用後の灰・炭の片付け」Tips 直後と bonfire-stand-beginner の「使用後のケア」段落直後に各1行。本体は本文・title・updatedAt とも不変更で発リンク0本のまま）。施策前の状態: 08-04 公開以降未更新・updatedAt 08-04。自サイトからの内部リンクが **0本**で、本記事からの発リンクも0本（焚き火系ハブから孤立）だった。判明クエリ0件で CTR 0% の原因は読めないが、リンク0本は仮説に依存しない。リンク元候補は焚き火台・火起こし系で 10-18 待機中でも Tier1 着手可在庫でもない記事: coleman-bonfire／captain-stag-bonfire／snowpeak-bonfire／secondary-combustion-bonfire／low-style-bonfire／bonfire-stand-beginner／bonfire-stand-solo／charcoal-starter／fire-tongs／fire-blower／bonfire-sheet（「焚き火の後始末」文脈で各1行）。logos-bonfire（Tier1・着手可在庫）は使わない | 2026-09-21 | 2026-10-18 | |
| camp-rental-price | 3 | 31 | 0 | 0% | 6.2 | 2026-08-21〜2026-09-17（28日） | 要判断 | 着手可否=○（08-18 公開以降未更新）。順位6.2 で CTR 0%（90日 50表示・0クリック）。判明クエリ3件は各1表示（キャンプ場側のレンタル有無・レンタル一般・ブランド指名のレンタル意図）で順位3〜6 と上位だが、料金相場の意図と一致しないクエリが混じる。hinataレンタル導線の ASP 記事で、camp-rental-flow／camp-rental-trouble／solo-gear-rental／yamadougu-rental-price 等からの内部リンク6本と十分。表示31 では CTR の分母が小さく、title 変更の判定材料にならない | | 施策日＋28日 | |

補足（Tier2＋Tier3 上位の読み方）:

- 着手可能（`着手可否=○`）かつ仮説が `要判断` 以外で、リライト枠で扱える記事は **無し**（sleeping-bag-temperature-guide／duo-tent／fire-extinguish-pot の3本は 09-21 の5サイクル目で施策済・10-18 まで待機）。Tier1 残の3本（car-camp-lighting／bluetti-power／torch-burner）も 09-21 の6サイクル目で施策済のため、**着手可在庫は 0本**。Tier3 の閾値を `impressions_28d ≥ 25` に下げた次点4本（28日表示: coleman-sleeping-bag 29／yamadougu-rental-price 28／car-camp-mat 26／attack-pack 25。公開日が 08-18／09-03／09-09／09-03 でベースライン窓に満たない記事が多く、いずれも判明クエリ0〜4件）による補充は **見送りと決定**（campkit-20260921-06 監督判断）。10-18 の検証結果を見てから再検討する。なお car-camp-mat は6サイクル目で car-camp-lighting のリンク元として本文1行を変更したため、仮に台帳化する場合も 10-18 まで待機扱い
- 商品構成の問題として `_file/article-fix-backlog.tsv` へ回した記事: **camp-backpack-beginner**（product_swap・priority A・見出しとカードの全5枠不一致）／**kids-sleeping-bag**（product_swap・priority B・子供専用が5枠中2枠）／**solo-tent-lightweight**（product_swap・needs-human・1kg級へ寄せるか lightweight-mountain-tent との役割分担を決めるか）。3本ともリライト枠では扱わない
- `測定継続` は backpack-rain-cover（09-10 公開）の1本。`2026-10-18まで待機` は sleeping-bag-temperature-guide（09-21 に逆引き早見表 H2 追加）／duo-tent（09-21 に内部リンク4本受領・本体不変更）／fire-extinguish-pot（09-21 に内部リンク4本受領・本体不変更）の3本（いずれも5サイクル目）
- 内部リンク0本の記事: backpack-rain-cover の1本（duo-tent／fire-extinguish-pot は 09-21 に各4本で解消。Tier1 の torch-burner も 09-21 の6サイクル目に4本で解消し、台帳全体で残るのは backpack-rain-cover のみ）
- Tier2 上位3本（kids-sleeping-bag／solo-tent-lightweight／sleeping-bag-temperature-guide）は 28日で各1,000〜1,300表示と Tier1 の2〜3位級の表示があり、順位22〜30 を page2 上位に上げられれば流入インパクトは Tier1 残3本より大きい。ただし2本は商品構成側の問題で、リライト枠で動かせるのは sleeping-bag-temperature-guide のみ

## Tier1 全件（90日・参考）

| # | slug | impressions | clicks | ctr | position | 公開日 |
|---|---|---|---|---|---|---|
| 1 | osprey-backpack | 3860 | 158 | 4.09% | 8.2 | 2026-06-15 |
| 2 | family-camp-summer-tent | 3816 | 54 | 1.42% | 9.9 | 2026-04-23 |
| 3 | camp-backpack-capacity-guide | 3724 | 92 | 2.47% | 8.5 | 2026-05-25 |
| 4 | soto-burner | 1568 | 25 | 1.59% | 6.8 | 2026-06-15 |
| 5 | coleman-chair | 1374 | 28 | 2.04% | 7.3 | 2026-06-15 |
| 6 | inflatable-mat | 1328 | 48 | 3.61% | 11.4 | 2026-06-02 |
| 7 | mountain-camp-lantern | 1312 | 63 | 4.8% | 9 | 2026-05-26 |
| 8 | fieldoor-tent | 1257 | 54 | 4.3% | 5.9 | 2026-06-08 |
| 9 | tent-size-beginner-guide | 693 | 17 | 2.45% | 8.1 | 2026-05-25 |
| 10 | mysteryranch-backpack | 632 | 34 | 5.38% | 8.2 | 2026-06-15 |
| 11 | karrimor-backpack | 553 | 34 | 6.15% | 7.2 | 2026-06-15 |
| 12 | camp-table-set | 443 | 12 | 2.71% | 10.8 | 2026-06-02 |
| 13 | gregory-backpack | 429 | 22 | 5.13% | 8.5 | 2026-06-15 |
| 14 | mountain-backpack-30l | 383 | 17 | 4.44% | 13 | 2026-04-23 |
| 15 | portable-fridge | 340 | 8 | 2.35% | 7.9 | 2026-06-02 |
| 16 | waterproof-backpack | 266 | 14 | 5.26% | 10.1 | 2026-06-08 |
| 17 | camp-rainwear | 246 | 6 | 2.44% | 8.5 | 2026-06-01 |
| 18 | naturehike-tent | 234 | 15 | 6.41% | 6.1 | 2026-06-02 |
| 19 | car-camp-lighting | 231 | 11 | 4.76% | 8.4 | 2026-05-26 |
| 20 | deuter-backpack | 222 | 19 | 8.56% | 7.9 | 2026-06-15 |
| 21 | bluetti-power | 199 | 1 | 0.5% | 11 | 2026-06-15 |
| 22 | car-side-tarp | 194 | 8 | 4.12% | 9.6 | 2026-06-02 |
| 23 | closed-cell-mat | 191 | 5 | 2.62% | 9.8 | 2026-09-04 |
| 24 | logos-bonfire | 169 | 9 | 5.33% | 7.2 | 2026-06-08 |
| 25 | camp-gear-sale-timing | 162 | 7 | 4.32% | 6.3 | 2026-08-20 |
| 26 | group-camp-tent | 156 | 11 | 7.05% | 8 | 2026-04-29 |
| 27 | forged-peg | 156 | 6 | 3.85% | 10.8 | 2026-06-02 |
| 28 | torch-burner | 138 | 12 | 8.7% | 9.8 | 2026-08-07 |
| 29 | mountain-tent-cheap | 138 | 11 | 7.97% | 8.8 | 2026-05-26 |
| 30 | camp-table-folding | 110 | 1 | 0.91% | 9.1 | 2024-06-20 |
| 31 | day-camp-tent | 107 | 4 | 3.74% | 11.7 | 2026-05-26 |
| 32 | iwatani-stove | 100 | 8 | 8% | 7.1 | 2026-06-15 |

## Tier2 全件（90日・参考）

| slug | impressions | clicks | ctr | position | 公開日 |
|---|---|---|---|---|---|
| kids-sleeping-bag | 1822 | 32 | 1.76% | 23.4 | 2026-04-28 |
| solo-tent-lightweight | 1682 | 12 | 0.71% | 30 | 2026-04-28 |
| sleeping-bag-temperature-guide | 1554 | 9 | 0.58% | 22 | 2026-04-23 |
| duo-tent | 186 | 4 | 2.15% | 21.3 | 2026-08-11 |
| camp-backpack-beginner | 161 | 0 | 0% | 18.3 | 2026-04-14 |

## 更新履歴

- 2026-09-20: 初版（候補抽出・ベースライン記録・仮説。リライト本体は未実施）
- 2026-09-21: リライト1サイクル目（campkit-20260920-17）。soto-burner（title 差し替え）／camp-backpack-capacity-guide（10L帯の H2＋FAQ 1問追加）／mysteryranch-backpack（リンク元5本から内部リンク各1本）を実施し、施策日・検証予定日（2026-10-18）を記入。mountain-camp-lantern／fieldoor-tent は article-fix-backlog へ product_swap で登録。検証は同じ28日窓（2026-09-21〜10-18）の CTR・position で行う（impressions は季節性で比較不可）
- 2026-09-21: リライト2サイクル目（campkit-20260921-01）。osprey-backpack（ブランド名の表記ゆれ「オスプレイ」を本文2箇所に併記＋H2「オスプレーの日帰り用デイパックはどれを選ぶ？（20〜24L）」新設・osprey-daily-backpack への内部リンク1本）を実施し、施策日・検証予定日（2026-10-18・1サイクル目と同じ窓に揃える）を記入。Tier1 11位以下22本のベースライン・仮説・着手可否の表を追加（次サイクル用キュー）。10-18 の検証対象は4本（soto-burner／camp-backpack-capacity-guide／mysteryranch-backpack／osprey-backpack）
- 2026-09-21: リライト3サイクル目（campkit-20260921-02）。portable-fridge（title に「車載冷蔵庫」を先頭14字以内に併記・全角32→36字・description 不変更＋camp-cooler-box-overall／portable-power-vehicle-camp／cooler-ice-pack から内部リンク各1本）／camp-gear-sale-timing（snowpeak-tent／camp-cooler-box-overall から内部リンク各1本・本体不変更）を実施し、施策日・検証予定日（2026-10-18・1〜2サイクル目と同じ窓に揃える）を記入。10-18 の検証対象は6本（上記4本＋portable-fridge／camp-gear-sale-timing）。判定は CTR・position で行う（portable-fridge は CTR 0.48%→サイト平均 4.16% への接近度、camp-gear-sale-timing は position 6.2 からの上昇幅）
- 2026-09-21: リライト4サイクル目（campkit-20260921-03）。camp-table-set（dod-table／low-style-table／outdoor-kitchen-table から「椅子付きセット」文脈で内部リンク各1本・本体不変更）を実施し、施策日・検証予定日（2026-10-18・1〜3サイクル目と同じ窓に揃える）を記入。camp-table-folding の title/description 変更は、判明クエリ2件に「折りたたみ」系意図が無かったため実行せず保留（監督判断待ち・着手可否は○のまま）。10-18 の検証対象は7本（上記6本＋camp-table-set）。camp-table-set の判定は position 11.9 からの上昇幅（page1 入り）で行う
- 2026-09-21: リライト4サイクル目の積み残し（campkit-20260921-04）。camp-table-folding の title/description を監督判断A案（「折りたたみテーブル」を主要KWとして先頭化・本文実在の数値フック「耐荷重50kg」・description 先頭1文に用途＋実測価格帯）で変更（frontmatter 3行のみ・本文不変更）。施策日・検証予定日（2026-10-18・1〜4サイクル目と同じ窓）を記入し、着手可否を待機に変更（着手可 4→3本）。10-18 の検証対象は8本（上記7本＋camp-table-folding）。camp-table-folding の判定は CTR 1.43% からサイト平均 4.16% への接近度と position 9.2 の維持で行う
- 2026-09-21: 5サイクル目の先行タスク（campkit-20260921-04 パートB）。Tier2 5本＋Tier3 上位4本（`impressions_28d ≥ 30`）の計9本を Tier1 11位以下と同じ列構成で台帳化（ベースライン・内部リンク実測・仮説type・着手可否）。リライト枠で着手可は sleeping-bag-temperature-guide（不足トピック＝快適温度の逆引き早見表）／duo-tent（内部リンク0本）／fire-extinguish-pot（内部リンク0本）の3本で、Tier1 残3本と合わせて着手可在庫6本。camp-backpack-beginner（見出しとカードの全5枠不一致・priority A）／kids-sleeping-bag（子供専用が5枠中2枠）は article-fix-backlog へ product_swap、solo-tent-lightweight は同 backlog へ needs-human（1kg級へ寄せるか lightweight-mountain-tent との役割分担）で登録。本文の変更なし
- 2026-09-21: リライト5サイクル目・施策①（campkit-20260921-05）。sleeping-bag-temperature-guide に H2「快適温度○℃の寝袋はいつ使える？（逆引き早見表）」（快適温度 15／10／5／0／-5／-10℃ → 使える季節・想定最低気温・併用装備の4列6行＋導入2文＋注意1文）を `## 1.` 末尾・`## 2.` 直前に追加し updatedAt を 09-21 に更新（title／description／slug・商品部分は不変更）。表の値は既存の温度別早見表と季節別ガイドの値を反転しただけで新規数値なし。施策日・検証予定日（2026-10-18・1〜4サイクル目と同じ窓）を記入し、着手可否を待機に変更（着手可 6→5本）。10-18 の検証対象は9本（上記8本＋sleeping-bag-temperature-guide）。判定は「快適温度＋温度値」系クエリの順位（24〜38→page2 上位）と記事全体の position 22.2 の上昇幅・CTR 0.63% で行う
- 2026-09-21: リライト5サイクル目・施策②③（campkit-20260921-05）。duo-tent（solo-tent-overall／solo-tent-beginner／coleman-tent／dod-tent の各まとめ末尾から「2人用サイズ・デュオ転用」文脈で内部リンク各1本＝0→4本・本体不変更）／fire-extinguish-pot（secondary-combustion-bonfire／charcoal-starter／bonfire-sheet／bonfire-stand-beginner の「使用後の灰・炭の片付け」箇所から「焚き火の後始末・消火」文脈で内部リンク各1本＝0→4本・本体不変更）を実施し、施策日・検証予定日（2026-10-18・同じ窓）を記入。着手可否を待機に変更（着手可 5→3本＝Tier1 残の car-camp-lighting／bluetti-power／torch-burner のみ）。10-18 の検証対象は11本（上記9本＋duo-tent／fire-extinguish-pot）。判定は duo-tent が position 10.1 からの上昇幅（page1 定着）、fire-extinguish-pot が position 8.0 の維持と CTR 0% からの脱却（表示35 で分母が小さいため参考値）
- 2026-09-21: リライト6サイクル目・施策①（campkit-20260921-06）。car-camp-lighting のまとめ H2 を「まとめ：ライト 車中泊の用途別おすすめ一覧」→「まとめ：車中泊ライトの用途別おすすめ一覧」（KW 倒置の語順修正・見出し1行のみ）に変更し updatedAt を 09-21 に更新（title／description／slug・商品部分は不変更）。あわせて car-camp-bed-kit／car-camp-mat／camp-lantern-led／electric-blanket-camp から「車中泊の夜の明かり」文脈で内部リンク各1本（2→6本）。施策日・検証予定日（2026-10-18・1〜5サイクル目と同じ窓）を記入し、着手可否を待機に変更（着手可 3→2本）。10-18 の検証対象は12本（上記11本＋car-camp-lighting）。判定は position 8.8 からの上昇幅（主要クエリの page1 定着）と CTR 5.17% の維持。**本体の見出し変更と被リンク追加の混合施策のため要因分離はできない**
- 2026-09-21: リライト6サイクル目・施策②③（campkit-20260921-06）。torch-burner（fire-blower／camp-bbq-grill／family-camp-bbq／hand-axe から「炭・薪の着火・火起こし」文脈で内部リンク各1本＝0→4本・本体不変更）／bluetti-power（disaster-portable-power／jackery-power-station／ecoflow-power／portable-power-large から「容量別の選び方・ブランド比較」文脈で内部リンク各1本＝1→5本・本体不変更）を実施し、施策日・検証予定日（2026-10-18・同じ窓）を記入。着手可否を待機に変更（着手可 2→0本＝**在庫切れ**）。10-18 の検証対象は14本（上記12本＋torch-burner／bluetti-power）。判定は torch-burner が position 8.7 からの上昇幅（火起こし用途意図の順位18.8 の改善）と CTR 8.97% の維持、bluetti-power が **position**（11.7・判明クエリ順位24〜29 からの上昇幅。競合起因なら動かない可能性あり）。Tier3 閾値の引き下げは見送り（監督判断）。リンク元候補の確認中に camp-portable-power-beginner の全5枠不一致を検出し article-fix-backlog へ product_swap（priority B）で登録
- 2026-09-21: 10-18 待機期間中の代替作業として product_swap を実施（campkit-20260921-07）。camp-backpack-beginner（Tier2・article-fix-backlog priority A）の全5枠を見出しどおりのブランド定番モデルへ差し替え（詳細は docs/seo-change-log.md）。リライト施策ではないため台帳の施策行には追加せず、10-18 の検証対象14本にも加えない。検証対象14本・リンク元27本は不変更
- 2026-09-21: 10-18 待機期間中の代替作業として product_swap を実施（campkit-20260921-09）。camp-portable-power-beginner（Tier1／Tier2 台帳外・article-fix-backlog priority B）の全5枠を、見出し側ブランドの入門価格帯・256〜858Wh の定番モデル（Jackery 500 New／EcoFlow RIVER 3 Max Plus／BLUETTI AORA 30 V2／Anker Solix C300／Jackery 240 New）へ差し替え（詳細は docs/seo-change-log.md）。リライト施策ではないため台帳の施策行には追加せず、10-18 の検証対象14本にも加えない。検証対象14本・リンク元27本は不変更
- 2026-09-21: 10-18 待機期間中の代替作業として product_swap を実施（campkit-20260921-11）。**fieldoor-tent（Tier1 上位10本の第8位・ベースライン表に行あり・article-fix-backlog priority B）の商品構成の是正を 2026-09-21 に実施（リライト施策ではない）**。旧5枠（タープテント3＋日帰り用ポップアップ1＋ヘキサゴン1）を テント本体4（ワンタッチテント300／トンネルテント480／ヘキサゴン／フォークテント280プラス）＋併用タープ1 へ差し替え、選び方・Tips・FAQ・description もテント本体前提に書き換え、updatedAt を 09-21 に更新（詳細は docs/seo-change-log.md）。台帳の施策行（施策日・検証予定日）には記入せず、10-18 の検証対象14本にも加えない。**10-18 以降にベースライン表（表示675／CTR 2.22%／順位6.2）と比較する際は、09-21 の商品構成変更が混ざっていることに注意**。検証対象14本・リンク元27本は不変更
