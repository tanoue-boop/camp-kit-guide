# camp-kit-guide SEO施策ログ

数値の推移はGAS「SEOレポート」の履歴で追う。本ファイルは「いつ・どの記事を・なぜ・どう変えたか」を記録し、次回レポートで効果を評価するための施策台帳。新しい施策は上に追記する。

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

### 次回チェック（1〜2週間後）
- 施策1の3記事のCTR変化（特にtent-size「テントサイズ 目安」のクリック）
- 施策2の6記事の順位変化
- 効果が出たパターンを横展開
