# 楽天API実データ化 受け渡し（2026-07-27 / product-scan発の新規5本）

## 背景
- Cowork セッションで新規5記事をドラフト作成済み。ただし **Cowork環境は楽天APIドメイン（openapi.rakuten.co.jp）がサンドボックスのプロキシで遮断（CONNECT 403）** のため、楽天実データを取得できず、全 `ProductCardMdx` の `affiliateUrl="#"`・商品画像なし・価格は参考実勢値・レビュー未掲載の状態。
- 構成・本文・内部リンク・FAQ5問・まとめ表・KW整合性チェック（価格5倍以内）は完成済み。**足りないのは楽天実データ（rafcid実リンク／画像／実価格／レビュー）のみ**。
- ⚠️ `#` リンクのまま公開しないこと（マネタイズ不可）。

## Code側でやること
`docs/scheduled-task-spec.md`「実データ取得（商品差し替え/価格更新で使う）」に従い、下記5ファイルを楽天API実データ化する。

1. 各記事のKWで楽天API（`openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701`、`Referer`＋`Origin`両方必須・8秒以上間隔・`sort=-reviewCount`）を叩く。
2. **採用5商品はAPIのレビュー実績上位から確定**（下の「採用候補」は出発点。実在・両モール流通・KW整合性〔初心者KWは価格±50%等〕を満たすものに置換してよい）。確定商品に合わせて各 `ProductCardMdx`（name/description/price/rating/reviewCount/image/affiliateUrl/source）と本文の該当段落・比較表・まとめ表アンカーを整合させる。
3. `affiliateUrl` は `hb.afl.rakuten.co.jp/hgc/${NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID}/?pc=<itemUrl>` 形式に統一（`buildRakutenUrl` と同形）。`image=` に楽天 mediumImageUrls を設定。
4. タイトルの「5選」は実採用数に一致させる（数が変われば自分で調整）。FAQは5問維持。
5. 記録更新：`docs/operation-snapshot.md` の該当行と `docs/seo-change-log.md` の該当エントリを「楽天API実データ化」済みに追記（現状は「参考実勢値・#」と記載済み）。
6. Amazon分は従来どおり後段バッチ（`amazonUrl` 設置）で対応＝今回は対象外。
7. `node scripts/deploy.cjs "新規5記事: 楽天API実データ化して公開（screen-tarp/water-jug/fireproof-gloves/cooler-ice-pack/hand-axe）"` で build→commit→push→本番検証。※コミット前に `rm -f .git/index.lock` が必要な場合あり。

## 対象5ファイルと採用候補（出発点）

| slug / file | カテゴリ | 主KW（検索用） | 採用候補（実在定番・要API確定） | 備考 |
|---|---|---|---|---|
| `content/posts/screen-tarp.mdx` | tent | スクリーンタープ / メッシュタープ | コールマン スクリーンキャノピージョイントタープ3／ロゴス neos クイックジオシェルター490-BD／クイックキャンプ ワンタッチスクリーンタープ3.0m／FIELDOOR ワンタッチタープ メッシュ付3.0m／キャプテンスタッグ CSクラシックス スクリーンタープ | 夏の防虫リビング。既存タープ9本と非カニバリ |
| `content/posts/water-jug.mdx` | cookware | ウォータージャグ / 給水タンク 保冷 | スタンレー ウォータージャグ3.8L／イグルー 2ガロン(約7.6L)／コールマン ジャグ1ガロン／キャプテンスタッグ ウォータージャグ5L／サーモス 真空断熱スポーツジャグ2.0L | 価格差は5倍以内を維持 |
| `content/posts/fireproof-gloves.mdx` | bonfire | 焚き火グローブ / 耐熱グローブ | グリップスワニー G-1／ユニフレーム UFレザーグローブ／ロゴス 防炎・耐熱グローブ(ロング)／キャプテンスタッグ 牛革 焚火グローブ／コールマン レザーグローブ | 防寒グローブ(clothing)と用途で別記事 |
| `content/posts/cooler-ice-pack.mdx` | cookware | 保冷剤 キャンプ / 氷点下パック | ロゴス 氷点下パックXL／ロゴス 倍速凍結・氷点下パックM／キャプテンスタッグ 抗菌クールパックM／ダイワ クールインパクト-16℃／アイリスオーヤマ 保冷剤ハード | ロゴスは寡占ブランドで2点採用可（占有緩和対象）。ふるさと納税混入に注意 |
| `content/posts/hand-axe.mdx` | bonfire | キャンプ 手斧 / 薪割り 斧 | ハスクバーナ 手斧／フィスカース X7 ハチェット／エストウィング キャンパーズアックス／千吉 キャンプ用手斧／VASTLAND 手斧 | **刃物＝法令FAQ入り済み**。持ち運び注意の記述は残すこと |

## KW整合性メモ（確定時に維持）
- screen-tarp：比較/購入型。実勢13,800〜32,000円（≈2.3倍）。
- water-jug：比較型。3,000〜12,100円（≈4.0倍）。
- fireproof-gloves：購入型。1,800〜6,600円（≈3.7倍）。
- cooler-ice-pack：比較型。800〜2,600円（≈3.3倍）。
- hand-axe：比較型。2,500〜7,500円（≈3.0倍）。刃物のため法令FAQ必須。

backlog（`_file/keyword-backlog.tsv`）では該当5行を `status=done / note=drafted 2026-07-27` 済み。楽天API実データ化が済んだら note を「rakuten-linked 2026-07-27」等に更新してもよい。
