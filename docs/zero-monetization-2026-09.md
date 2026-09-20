# 導線ゼロ記事の個別判定（2026-09）

- 作成日: 2026-09-20（campkit-20260920-14）
- 判定の正: `content/posts/*.mdx` の実体（264本）を再スキャン。`_file/diagnosis-articles.tsv` は補助にとどめ、リンク数はすべて数え直した
- GSC期間: 2026-06-20 〜 2026-09-17（90日 / `_file/gsc-pages.tsv` 410行・記事slug 243件・記事に突合できたもの 240件）
- 判定テーブル: `_file/zero-monetization-articles.tsv`（GSC記事別数値を含むため `.gitignore` 済み・公開リポには入れない）
- 記事本文（`content/posts/**`）は本タスクでは1文字も変更していない

## 数え方（機械的ルール）

| 列 | 有効とみなすもの |
| --- | --- |
| 楽天（有効） | `hb.afl.rakuten.co.jp` 形式のURLのみ。ProductCard の `affiliateUrl`／比較表JSON／CalloutCta の href／本文リンクを区別せず加算。商品画像URL（`thumbnail.image.rakuten.co.jp`）は数えない |
| 楽天（無効） | 素URL（`item.rakuten.co.jp`／`search.rakuten.co.jp`／`www.rakuten.co.jp`）。クリックされても報酬が付かないため別カウント |
| Amazon | ProductCard の `amazonUrl`／`amazonAsin`／`source="amazon"` かつ `affiliateUrl` が `#` 以外（=ProductCard がAmazonボタンを描画する条件）＋カード外の `amzn.to`／`amazon.co.jp` URL |
| その他ASP | `px.a8.net`（バリューコマース／もしも／afb／アクセストレード等のドメインも検索したが記事内に出現なし） |

**導線ゼロ = 楽天（有効）0 かつ Amazon 0 かつ その他ASP 0**。

## 結果：現時点の導線ゼロ記事は 0本

| 区分 | 記事数 |
| --- | --- |
| 対象記事（content/posts） | 264 |
| **導線ゼロ（有効楽天0・Amazon0・ASP0）** | **0** |
| 無効リンクのみ（素URLしか無い） | 0 |
| 無効リンクを1本でも含む記事（全264本中） | 0 |
| 物販（楽天 or Amazon）あり | 241 |
| ASP（A8）のみ・物販なし | 23 |
| 楽天のみ・Amazon 0 | 14 |
| Amazon のみ・楽天 0 | 0 |

独立した方法（`hb.afl.rakuten.co.jp｜amzn.to/｜amazon.co.jp/｜px.a8.net｜amazonAsin="…"｜amazonUrl="http` の grep）でも264ファイル全件がヒットし、スクリプトの結果と一致した。

### 「53本」からの増減とその理由

6月時点の「導線ゼロ53本」の原典（Drive `経緯まとめ_運用体制再構築_20260920.md`）は本セッションの許可ディレクトリ外で参照できないため、53という数字の定義（素URLを有効に数えていたか、ASP記事を含めていたか）は確認できない。ローカルに残る記録から追える経路は次のとおり。

| 時点 | 記録 | 導線ゼロ相当 |
| --- | --- | --- |
| 2026-09-20 診断フェーズ1（`result-diagnosis-phase1.md`） | 収益リンク0本の記事 3本（`camp-backpack-capacity-guide`／`portable-power-guide`／`tent-size-beginner-guide`）、Amazon 0 の記事 23本 | 3（物販基準では「リンクなし 26」＝3本＋ASP専用23本） |
| campkit-20260920-01 | 上記3本に商品カード各3枚（楽天＋Amazon）を追加、Amazon 0 の10本中9本に `amazonAsin` 27件追加 | 「リンクなし 26→23（残りはASP専用記事）」（`docs/seo-change-log.md` 2026-09-20 節） |
| campkit-20260920-09〜11（commit `d26d056`／`79fd160`） | 楽天素URL 407件（89記事）を `hb.afl` へ変換、Amazon一本足10記事42カードに楽天リンク追加 | 素URLが有効リンクに変わり「無効リンクのみ」が 0 に |
| 本タスク（再スキャン） | ASP専用23本は A8 リンクを持つため導線ありと数える | **0** |

つまり「53」は現時点では古く、(1) 9/20-01 のハウツー3本へのカード追加、(2) 9/20-09〜11 の楽天素URL修復・楽天リンク追加、(3) ASP専用記事を「導線あり」として正しく分類し直したこと、の3点で解消している。**#4 リンク修復（407件）の取りこぼしは無い**（素URLを含む記事 0本）。

## A1/A2/B/C/要判断 の件数内訳

| verdict | 件数 |
| --- | --- |
| A1 | 0 |
| A2 | 0 |
| B | 0 |
| C | 0 |
| 要判断 | 0 |

判定対象（導線ゼロ記事）が存在しないため、`_file/zero-monetization-articles.tsv` はヘッダ行のみ（1行）。A1 の一覧も無し。

## 次タスクでの作業見積り

- **導線ゼロ記事へのリンク付与: 0本**（作業不要）。次タスクは「#6 導線ゼロ記事へのリンク付与」としては着手対象が無いため、下記「参考」の薄い導線の扱いを本人判断で決めてから、必要なら別タスクとして切り直すのが妥当。

## 参考：導線は「ある」が薄い記事（本タスクの定義外・判定は付けていない）

導線ゼロではないが、収益リンクが1〜3本しか無い記事が36本ある（内訳: ASP1本のみ 23本／ふるさと納税CTA1本のみ 13本）。導線ゼロ判定の定義には入らないので verdict は付けていないが、次タスクの当たりとして impressions 上位を挙げる（記事別数値のみ・クエリは記載しない）。

### ASP（A8）1本のみの記事（23本）— 物販カード0

| slug | category | clicks | impressions | position | 備考 |
| --- | --- | --- | --- | --- | --- |
| camp-gear-sale-timing | tent | 7 | 162 | 6.3 | 情報型。物販導線を足すなら「セール対象になりやすい定番ギア」の紐づけ余地あり |
| camp-gear-where-to-buy | tent | 0 | 56 | 9.2 | 情報型 |
| camp-rental-price | tent | 0 | 50 | 6.6 | レンタル系（hinata） |
| yamadougu-rental-price | backpack | 0 | 28 | 6.6 | レンタル系（やまどうぐ） |
| camp-rental-hygiene | sleeping-bag | 5 | 27 | 4.2 | レンタル系。CTRが高い |
| tebura-camp | tent | 1 | 27 | 7.4 | レンタル系 |
| camp-rainy-day-plan | tent | 2 | 24 | 7.0 | ハウツー。タープ／レインウェア記事への内部リンク余地 |
| yamadougu-rental | tent | 0 | 22 | 8.9 | レンタル系 |
| camp-gear-initial-cost | tent | 0 | 16 | 20.8 | 情報型 |
| winter-camp-rental | tent | 0 | 15 | 13.0 | レンタル系 |
| disaster-camp-gear | power | 0 | 14 | 17.1 | ハウツー。ポータブル電源／ラジオ記事への内部リンク余地 |
| family-gear-rental | tent | 1 | 12 | 7.8 | レンタル系 |
| camp-gear-rental | tent | 0 | 11 | 17.5 | レンタル系（第一弾） |
| camp-rental-flow | tent | 1 | 7 | 8.9 | レンタル系 |
| camp-rental-trouble | tent | 1 | 7 | 5.4 | レンタル系 |
| solo-gear-rental | tent | 1 | 6 | 6.8 | レンタル系 |
| yamadougu-rental-flow | backpack | 1 | 6 | 7.0 | レンタル系 |
| fuji-climb-rental-vs-buy | backpack | 0 | 4 | 5.8 | レンタル系（比較） |
| group-camp-rental | tent | 0 | 2 | 5.0 | レンタル系 |
| camp-activity-booking | tent | 0 | 1 | 8.0 | 体験予約系 |
| camp-activity-booking-flow | tent | 0 | 1 | 1.0 | 体験予約系 |
| autumn-hiking-rental | backpack | 0 | 0 | – | GSCデータ無し（9/17公開） |
| yamadougu-rental-trouble | backpack | 0 | 0 | – | GSCデータ無し（9/18公開） |

ASP専用記事は設計上「サービス成約（レンタル8%等）」を狙う記事で、物販カードを入れない構造（`camp-gear-rental` が手本）。導線が1本なのは意図した設計であり、ここに物販を足すかは方針判断。

### ふるさと納税CTA 1本のみの記事（13本）— 楽天ふるさと納税検索リンクのみ・Amazon 0

| slug | category | clicks | impressions | position |
| --- | --- | --- | --- | --- |
| furusato-year-end | tent | 0 | 48 | 31.8 |
| furusato-camp-ticket | tent | 1 | 38 | 11.3 |
| sleeping-bag-furusato | sleeping-bag | 1 | 22 | 5.1 |
| bonfire-furusato | bonfire | 0 | 6 | 7.8 |
| lantern-furusato | lighting | 0 | 6 | 9.3 |
| furusato-shipping-timing | tent | 1 | 5 | 19.2 |
| camp-furusato | cookware | 1 | 4 | 9.5 |
| chair-table-furusato | chair-table | 0 | 4 | 6.8 |
| cooler-furusato | cookware | 0 | 4 | 7.0 |
| power-furusato | power | 0 | 2 | 10.0 |
| cookware-furusato | cookware | 0 | 1 | 6.0 |
| tent-furusato | tent | 0 | 1 | 10.0 |
| furusato-camp-guide | tent | 0 | 0 | –（GSCデータ無し） |

Amazon にふるさと納税の対応商品は存在しないため Amazon 0 は構造的（9/20-01 の判断どおり）。

### その他

- `backpack-rain-cover`（楽天5・Amazon0・impressions 46）: 無名OEM×5 のため Amazon 保留を維持中（`_file/amazon-backfill-state.tsv`）。導線ゼロではない。
- GSC にあるが記事が存在しない slug 3件（`camp-sleeping-bag-temperature-guide` 83／`sleeping-bag-season-guide` 69／`sleeping-bag-temp-guide` 44 impressions）は 2026-07-24 の寝袋カニバ統合で `sleeping-bag-temperature-guide` へ 308 リダイレクト済みの旧URL。対応不要。
