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

### インフラ
- GAS「📊 SEOレポート」実装(手動実行でSearch Console順位取得)。GCPプロジェクト camp-kit-gsc で稼働。

### 既知の課題（次回以降）
- two-room-tent-guide: ProductCard商品名(FIELDOOR等)と比較表/まとめ(スノーピーク等)の商品データ不整合。楽天実データ再取得で要修正。
- 寝袋温度系スラッグ重複(camp-sleeping-bag-temperature-guide / sleeping-bag-temp-guide / sleeping-bag-temperature-guide)のカニバ確認は順位が上がってから。

### 次回チェック（1〜2週間後）
- 施策1の3記事のCTR変化（特にtent-size「テントサイズ 目安」のクリック）
- 施策2の6記事の順位変化
- 効果が出たパターンを横展開
