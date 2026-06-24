# camp-kit-guide 運用スナップショット

サイトの現状（記事数・カテゴリ構成・GAS/インフラ構造）を記録するスナップショット。記事追加・カテゴリ変更・GAS構造変更のたびに最新化する（→ 運用ルールは CLAUDE.md「記録更新ルール」を参照）。

- **最終更新: 2026-06-23（6/23 SEO測定→既存記事テコ入れフェーズへ移行・差別化リライト着手。記事数133のまま）**
- 初版作成: 2026-04-28（当時42記事）

---

## 記事数（2026-06-24 時点）

- **総記事数: 133記事**（`ls content/posts/*.mdx | wc -l` で確認）

### カテゴリ別内訳（frontmatter `category` を集計）

| slug | 表示名 | 記事数 |
|------|--------|-------:|
| tent | テント | 32 |
| sleeping-bag | 寝袋・シュラフ | 18 |
| cookware | 調理器具 | 18 |
| chair-table | チェア・テーブル | 17 |
| lighting | 照明・ランタン | 12 |
| power | 電源・バッテリー | 13 |
| bonfire | 焚き火台 | 11 |
| backpack | バックパック | 10 |
| clothing | ウェア・装備 | 2 |
| **合計** | | **133** |

> 直近の増加分: 2026-06-08 のバッチで 90→94（施策3: 焚き火シート/火ばさみ/防寒グローブ/大容量ポータブル電源）→ 99（施策4: 防水リュック/二次燃焼焚き火台/折りたたみソーラーパネル/ダッチオーブン/封筒型寝袋）→ 102（施策5: ファミリー向けキャンプコット/VASTLANDのテント/スキレット）→ 104（施策6: アウトドア用電気毛布/シェラカップ・自動選定パイプライン経由）→ 109（施策7: WAQのチェア/FIELDOORのテント/Naturehikeのマット/コールマンのテント/DODのタープ・ブランド軸5記事）→ 114（施策8: Jackeryのポータブル電源/DODのチェア/ロゴスの焚き火台/キャプテンスタッグのテーブル/EcoFlowのポータブル電源・ブランド軸5記事）→ 119（施策9: コールマンのランタン/キャプテンスタッグのチェア/ジェントスのランタン/コールマンのチェア/Naturehikeの寝袋・ブランド軸5記事）→ 124（施策10: SOTOのバーナー/ヘリノックスのチェア/Ankerのポータブル電源/カリマーのリュック/イワタニのバーナー・空きカテゴリのブランド軸5記事）→ 128（施策11: ユニフレームのバーナー/BLUETTIのポータブル電源/グレゴリーのリュック/オスプレーのリュック・手薄カテゴリのブランド軸4記事）→ 133（施策12: コールマンの焚き火台/DODのテーブル/ドイターのリュック/ベアボーンズのランタン/ミステリーランチのリュック・空きカテゴリのブランド軸5記事）。詳細は `docs/seo-change-log.md` を参照。

> ✅ 2026-06-24 解決済み: 残存していた `cooler` カテゴリ1件（`cooler-box-day-camp.mdx`）を方針どおり `cookware` へ付け替え。これで全133記事が CLAUDE.md 定義の正式カテゴリ（cooler 除く）に収まり、未定義slugは無くなった（cookware 17→18）。

---

## カテゴリ整理・frontmatterの解決済み事項

過去に存在した不整合は以下のとおり整理済み。

- **※2026-06時点で解決済み: tarp→tent / cooler→cookware**。タープ記事は `tent` カテゴリに統合、クーラーボックス記事は `cookware` に寄せる方針（cooler残存1件も2026-06-24に付け替え完了。上記の解決済み注記を参照）。
- **有効な frontmatter キーは `tags` / `thumbnail` / `updatedAt`**。かつて一部記事で使われていた `keywords` / `eyecatch` はコードから一切参照されない死にキーのため使用禁止（commit `fb3c3d6` で全記事修正済）。新規・既存とも `tags`（タグ機能）/ `thumbnail`（OGP・カード画像）/ `updatedAt`（JSON-LD `dateModified`）を使うこと。

---

## GAS / インフラ構造

- **GAS「📊 SEOレポート」**: 手動実行で Google Search Console から順位・表示・クリック・CTRを取得し、スプレッドシートの「SEO履歴」シートに追記。GCPプロジェクト `camp-kit-gsc` で稼働。
- **SEO効果測定の仕組み（2026-06-08 構築）**: 上記 GAS SEOレポート＋SEO履歴シートで数値推移を追い、施策内容は `docs/seo-change-log.md`（施策台帳）に記録。両者を突き合わせて施策の効果を評価する運用を開始。

---

## 2026-06-23：Amazonアフィリエイト基盤整備（記事増産なし・133記事のまま）

サイトの収益化に向けてAmazonアフィリエイト連携を一気に整備。記事の増産はなし（133記事のまま）。全変更push済み・`npm run build` EXIT=0。

- **Amazonアソシエイト申請完了**: 登録ID `campkit26`、リンクは `campkit26-22` 形式。種別はコンテンツメディア/ブロガー。現在は仮登録状態で、本審査は180日以内に3件の適格販売で自動開始。サイト参加表記（アソシエイト・プログラム参加の明記）は `pages/privacy-policy.tsx` / `pages/about.tsx` に既設のため対応不要。
- **ProductCard.tsx を amazonUrl 対応に改修**: `types/product.ts` に `amazonUrl` を追加。`getAmazonUrl` は `amazonUrl` 指定時のみ実リンクを返し、無ければ `null` でAmazonボタン非表示。タグなしAmazon検索URLのフォールバックを廃止。`pages/posts/[slug].tsx` で `amazonUrl` を受け渡し。これで全記事に垂れ流していたタグなしAmazon検索URLを停止。
- **架空Amazonリンク・架空商品の修正（3記事）**: `solo-tent-beginner` / `bonfire-stand-beginner` / `sleeping-bag-summer-cospa` の比較表を、本文ProductCardの実在楽天商品で再構築。架空ASIN・ダミータグ・検索URLを撤去。
- **手動Amazon実リンク併記（3記事・12商品）**: `coleman-tent`(4) / `dod-tarp`(3) / `fieldoor-tent`(5)。SiteStripe発行の `amzn.to` 短縮リンクを設置。
- **Cowork経由Amazonリンク設置（19記事・82商品 / commit af9a482）**: 「Cowork（ログアウト検索）→まーくん（SiteStripeで `amzn.to` 発行・商品確認）→Claude Code（ProductCardに `amazonUrl` 設置）」の三者分業フローを初めて完走。型番が明確な商品群はほぼ100%一致。「該当なし」5件（TOMOUNT / tousen / family-mat 2件 / コールマンラギッド）はAmazonに無く楽天のまま据え置き。
- **全記事Amazon連携ワークシート整備**: `_file/amazon-link-worksheet.tsv`（Git管理外、130記事626商品、クリーニング済）。うち今回94商品が設置済み（手動12＋Cowork82）、残り約530商品が今後の設置対象。
- **記事数**: 133記事のまま（増産なし）。

### 追記：Coworkバッチ2 Amazonリンク設置（commit 244742a）
- Coworkバッチ2で **10記事・49商品** を設置（commit 244742a）。対象＝camp-chair-highback / solar-portable-power / sleeping-bag-temperature-guide / nanga-sleeping-bag / dutch-oven / solo-tent-overall / solo-tent-lightweight / sleeping-bag-winter-beginner / lightweight-mountain-tent / large-tent-guide。
- **Amazonリンク設置 累計143商品**（手動12＋Cowork82＋Coworkバッチ2の49）。ワークシート残りは約480商品。
- 記事数は133のまま（増産なし）。

---

## 関連ドキュメント

- `CLAUDE.md` — 作業ガイド・記事作成ルール・記録更新ルール
- `docs/seo-change-log.md` — SEO施策台帳（いつ・どの記事を・なぜ・どう変えたか）
- `docs/operation-snapshot.md` — 本ファイル（記事数・カテゴリ・GAS構造の現状）
