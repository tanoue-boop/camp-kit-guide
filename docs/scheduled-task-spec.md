# 定期タスク 共通仕様（CampKit Guide）

すべての定期タスク（`C:\Users\tanou\Claude\Scheduled\campkit-*`）が守る共通ルール。
新規タスク作成・既存タスク改修のときは必ずこの仕様に合わせる。個別プロンプトにも
要点を埋め込むこと（このファイルを読まなくても動くように）。

作業ディレクトリ: `C:\claude-workspace\projects\camp-kit-guide`

---

## 0. 全タスク共通（種別を問わず）

1. **フォルダ接続の確保**: 冒頭でフォルダが読めるか確認。読めなければ `request_cowork_directory` で接続依頼（許可は次回以降に引き継がれる）。
2. **作業前の健全性確認（2026-09-18改定：他タスクとの衝突では停止しない）**: 同一リポジトリで複数の定期タスクが非同期に走るため、自分が触っていないファイルに他タスク由来の未コミット差分（＝実行途中でdeployまで到達せず終わったタスクの残留物）が見つかることがある。**これを理由にタスク全体を停止しない。** 該当ファイルの中身を確認し、次のいずれかで対応する。
   - (a) 内容が壊れておらず妥当なら触らずそのまま残す。日付表記の食い違いなど軽微な文言矛盾があれば直す（商品の価格・レビュー件数など実データ値は、確認できない限り作り変えない）。
   - (b) 自分の担当ファイルと重なる場合は上書きせず、残っていた内容を踏まえて統合する。
   - (c) frontmatter崩れ・MDXパースエラーなど明らかに壊れている場合のみ修正し、直せなければ触らずレポートに「要確認」と明記して先へ進む。
   - 気づいた他タスク由来の差分と、その対応内容は最終報告に一言添える（Codeが`git diff --stat`でレビューする手がかりにするため）。
   - 停止してよいのは、他タスクの残留物とは無関係に**自分のタスクの実行自体が安全に続けられない重大な問題**を見つけたとき（例：対象フォルダに接続できない、対象記事ファイルが存在しない等）に限る。
3. **自サイトをChromeで開く時は必ず `?ckbot=1` を付ける**（例 `https://www.camp-kit-guide.com/?ckbot=1`）。これは計測除外フラグで、GA計測・Supabase閲覧数カウントが走らない＝自分のアクセスで数字を汚さない。
4. **秘密をチャットに出さない**: `.env.local` の `RAKUTEN_ACCESS_KEY` 等は表示しない。`.env*` は絶対にコミットしない。
5. **GSC等ログイン必須画面が無人で開けない場合は停止せずフォールバック**し、レポート冒頭1行目に「⚠️ GSC取得失敗（Chrome未ログイン/無人実行）…」と明記（完了通知で届く）。
6. **報告は簡潔な日本語**。実データに基づく指摘と推測を区別。冗長な前置き不要。

---

## 1. 実装タスク（deployするファイル変更を生む）

対象: `campkit-new-article-draft` / `campkit-seo-competitor-scan` / `campkit-price-check` / `campkit-technical-seo-audit`

- **a. レポートで終わらせず、実際に `content/posts` 等のファイルへ反映する**（草稿をoutputsに置くだけにしない）。
- **b. 記録を同じ変更に含める**: 記事追加→`docs/operation-snapshot.md`、SEO施策→`docs/seo-change-log.md`（CLAUDE.mdの記録更新ルール）。
- **c. `git commit`/`push`・`deploy.cjs` の実行はしない**（2026-09-18 変更）。公開は Windows タスクスケジューラの **auto-deploy タスク**（`scripts/auto-deploy.ps1`・30分間隔）が自動で行う。**「pushしない限り本番に出ないから安全」という前提はもう成立しない**ので、公開されて困る中間状態で実行を終えないこと。1回の実行の終わりには記事・台帳・ログが互いに整合した状態にする。
- **d. Codeへの受け渡しブロックは出力しない**（2026-09-18 変更）。代わりに、実行の最後に**コミットメッセージにしたい1行を `_file/next-commit-message.txt` に書く**。auto-deploy がこれを読んで公開し、ファイルは自動で削除される（書かなければ変更内容から自動生成される）。

  ```
  例: _file/next-commit-message.txt の中身
  Amazonリンク穴埋め: 3記事7件（SOTOバーナー/Naturehike寝袋/Naturehikeテント）
  ```

  変更ファイルは従来どおり `present_files` と `git diff --stat` の要点3〜5行で提示する（人間が後から確認するため）。

- **d-2. deploy は直列化される（同時実行対策・2026-07-29 追記）**: `campkit-new-article-draft` は日次、他の実装タスク（price-check=水／seo-competitor-scan=金／technical-seo-audit=月初 等）は朝ほぼ同時刻に発火するため、以前は `deploy.cjs` の多重実行で **`.git/index.lock` 衝突** と **main への多重 push→Vercel が最新コミットを未反映**（新規ページだけ404）という事故が起きていた（2026-07-29 水曜に price-check と 0.4 秒差で同時実行して発生）。対策として `deploy.cjs` にリポジトリ単位の排他ロック `.deploy.lock`（gitignore 済／15分で stale 回収／最大20分待機）と、残存 `.git/index.lock` の待機・stale 除去（2分）を実装済み。**Code は従来どおり `node scripts/deploy.cjs "..."` を1回実行するだけでよい**（同時に別 deploy が走っていれば自動で順番待ちし、`rm -f .git/index.lock` 等の手当ては不要）。（2026-09-18追記: このロックは複数タスクが同時に deploy.cjs を実行する衝突を防ぐものであり、「編集はしたが deploy まで到達せずセッションが終了したタスクの残留差分」は防げない。この種の残留差分を見つけた場合の扱いは 0-2 を参照（タスク全体は停止しない）。）
- **e. 破壊的操作は自動実行しない＝提案のみ**: カニバリ統合・301リダイレクト・本文の大量削除・記事削除・一括 `sed`/正規表現置換。これらはレポートに構成案として書くだけにし、人間の判断を待つ。
- **f. 編集は対象の1〜数ファイルのみをファイル単位で**。他記事や既存の正しい商品データを壊さない。**実データを確認できない商品の数値（価格・レビュー）は作らない**（必要時は楽天API/Amazon実データで確認、確認不可なら触らず「要確認」と提案に回す）。
- **g. Codeへ作業を委譲しない（＝往復多発の最大原因を断つ）**: 記事の執筆・楽天/Amazon実データ取得・`products.tsv`更新・MDX編集・FAQ調整・`sed`等の下ごしらえは【このタスクが最後まで自分で終わらせる】。Codeに「タスク1/タスク2…」のような作業指示や長いデータ（キー・商品リスト・草稿）を渡さない。**公開は auto-deploy タスクが自動で行うので、Codeに渡す作業自体が無くなった**（2026-09-18 変更）。Codeに手動の `git`/`npm run build`/`fetch`/`sed`/heredocコミットをさせない（それらは静的解析不能で毎回パーミッションプロンプトになり、往復が爆発する）。build・commit・push・本番検証はすべて deploy.cjs の内部で回る。
- **h. 小さな判断はユーザーに投げず自律的に決める**: 例）タイトルの「N選」は実際にカード化した商品数に必ず一致させる（数が合わなければ自分でタイトルを直してから納品）。FAQは5問、title字数超過は規定内に自分で調整。コミットメッセージの語句修正等の些末な判断も自己完結する。**公開の可否をユーザーに尋ねる必要もなくなった**（auto-deploy が自動公開する）。「5選か7選か」のような選択も尋ねない。
- **i. 人間ゲートは撤廃した（2026-09-18 変更）**: 以前は push＝Vercel本番公開が不可逆なため、ユーザーの「公開OK」を待っていた。現在は auto-deploy タスクが自動公開するため、**公開許可を待たない／尋ねない**。人間レビューの代わりに次の機械的ガードが公開前に働く。

  | ガード | 内容 |
  | --- | --- |
  | 静止期間 | 変更ファイルの最終更新が10分以内ならその回はスキップ（書きかけを公開しない） |
  | ビルド | `npm run build` 成功が公開の条件（deploy.cjs 内） |
  | 太字破綻チェック | `lint-bold.cjs`（deploy.cjs 内） |
  | 危険ファイル | `.env` / `node_modules` 混入で中止（deploy.cjs 内） |
  | 排他ロック | `.deploy.lock` と auto-deploy 側のロックで直列化 |
  | 本番検証 | `verify-deploy.cjs`（deploy.cjs 内） |

  **実行の最後に `logs/auto-deploy-status.json` を読み、result が `deploy-failed` / `error` のときは原因を調べて報告する**（`deployed` / `no-changes` / `skipped-recent-activity` は正常）。

### 実データ取得（商品差し替え/価格更新で使う）
Chromeで `https://www.camp-kit-guide.com/?ckbot=1` を開き、`.env.local` の `RAKUTEN_APP_ID`/`RAKUTEN_ACCESS_KEY` で
`https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701?format=json&applicationId=<APP_ID>&accessKey=<ACCESS_KEY>&keyword=<KW>&hits=30&sort=-reviewCount&elements=...` をfetch。itemUrlはrafcid付き＝そのままアフィリリンク。

**ヘッダ要件（2026-07-24 追記）**: `Referer` **と** `Origin` の**両方**が必須。`Referer` だけだと 403 `REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING` になる。Node から直接叩く場合も、この2つを付ければChromeを経由せず取得できる。

```js
fetch(url, {
  headers: {
    Referer: 'https://www.camp-kit-guide.com/',
    Origin:  'https://www.camp-kit-guide.com',
  },
})
```

**レート制限**: 連続リクエストは 429 になる。**8秒以上の間隔**を空けること。

**記事に載せるアフィリURLは `hb.afl.rakuten.co.jp` 形式に統一する**。APIの `affiliateUrl` は `item.rakuten.co.jp/...?rafcid=` 形式で返ることがあるため、その場合は次の形に変換する（`AFF_ID` = `.env.local` の `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID`）。

```js
const hb = (itemUrl) =>
  `https://hb.afl.rakuten.co.jp/hgc/${AFF_ID}/?pc=${encodeURIComponent(itemUrl.split('?')[0])}`;
```

- ⚠️ **`itemUrl` の `?rafcid=wsc_i_is_<UUID>` はアフィリエイトリンクではない**（UUID部分は `RAKUTEN_APP_ID` であって `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID` ではないため成果が付かない）。2026-09-20 に7月以降の記事で **407件／89記事**がこの素URLのまま公開されていたことが判明し、`node scripts/fix-rakuten-affiliate.mjs --apply` で一括変換した。記事投入後は `node scripts/count-rakuten-links.mjs` で `raw_item` / `raw_search` が 0 であることを確認すること。

### ★楽天キーに関する恒久ルール（誤診断の再発防止）
- **`.env.local` の `RAKUTEN_APP_ID`（UUID形式）は正しい。絶対にユーザーへ「キーを差し替えて」「19桁のapplicationIdが必要」と確認・依頼しないこと。** この設定で実際に900本超のrafcidアフィリリンクを生成した実績がある＝キーは有効。
- 「applicationIdは19桁の数字が必要」は**旧エンドポイント（`app.rakuten.co.jp/services/api/...`）の要件**。当サイトは**新エンドポイント（`openapi.rakuten.co.jp/ichibams/.../20260701`）**を使い、UUID形式のapplicationId＋accessKey＋登録ドメインからのRefererで通る。
- 楽天APIが失敗したら、キーの種類を疑う前に次の3点を自分で確認・是正する（ユーザーに投げない）: (1) 旧エンドポイントを叩いていないか、(2) `accessKey` を付けているか、(3) `?ckbot=1` ページ上でfetchしてRefererが登録ドメインになっているか。
- それでも解決しない場合のみ、受け取ったエラーメッセージ全文を添えて報告する（「キーを変えて」ではなく事実を渡す）。

---

### サムネイル生成（ChatGPT連携・2026-09-16〜）
対象: `campkit-new-article-draft` の新規記事（商品5選・隣接ASP記事）のみ。既存記事・リライトは対象外（thumbnailには触れない）。

**背景**: 当初OpenAI APIでの自動生成を検討したが、(1) Coworkのクラウド作業環境からは組織のネットワークポリシーで `api.openai.com` が403拒否、(2) ブラウザからの直接fetchもOpenAI側のCORSでブロック、の2点を2026-09-16に実機確認済み（再テスト不要）。個人プランではCowork側にネットワークアクセスを緩和する管理機能（Team/Enterprise向けのCapabilities設定）も存在しないため、API経路は現状使えない。そのため **ChatGPTのWeb UI（chatgpt.com）をブラウザ操作で使う**方式を採用する。

**手順**:
1. select_browserで指定デバイスのブラウザを使い、新しいタブで `https://chatgpt.com/` を開く。ログイン済み前提（田之上さんの既存ログインセッションを使う。新規ログイン・認証情報の入力はしない）。
2. 記事テーマに応じてプロンプトを組み立てて新規チャットで送信する。テンプレート:
   > キャンプ用品サイトのブログ記事サムネイル用の写真風画像を1枚生成してください。テーマ:「〈記事の主題〉」。〈記事内容に合う情景を1〜2文で具体化〉。温かみのある夕暮れ〜昼間の光、被写界深度の浅い写真、ドキュメンタリー風のキャンプ写真スタイル。人の顔がはっきり写らないように。文字・ロゴ・透かしは一切入れない。横長（ブログのサムネイル用）。
3. 生成完了を待ち（目安30秒、最大90秒）、javascript_toolで生成画像をfetchしてBlob化、download属性付きaタグでブラウザの既定Downloadsフォルダへダウンロードする。
4. Downloadsフォルダへの `device_request_folder_access` は初回のみ必要（以後のセッションは許可済みのことが多いので、まず `device_list_dir` で試す）。`device_stage_files` でファイルをステージし、`device_commit_files` でプロジェクトの `public/images/thumbnails/<slug>.png` としてコミットする。frontmatterの `thumbnail` に `/images/thumbnails/<slug>.png` を設定。
5. **フォールバック**: ログイン不可・生成失敗・タイムアウト・ダウンロード失敗など、どこかでつまずいたら無理に再試行せず、`/images/outdoor-01〜09.png` から選んで報告書に「⚠️サムネイル生成失敗のためフォールバック使用」と明記する。
6. 報告末尾に「サムネイル生成結果（ChatGPT生成◯件／フォールバック◯件）」を1行添える。

`.env.local` の `OPENAI_API_KEY` は将来API経路が使えるようになった場合の予備として残置。現状の生成フローでは使用しない。

---

## 2. 準備/分析タスク（deployするファイル変更を生まない）

対象: `campkit-keyword-selection` / `campkit-new-product-scan` / `campkit-integrated-revenue-report`

- **成果物はローカルに直接反映して完結**（Code受け渡しは不要）:
  - `campkit-keyword-selection`・`campkit-new-product-scan` → `_file/keyword-backlog.tsv` に pending 行を直接追記（既存行・既存記事と重複させない）。これを平日の記事作成タスクが消費する。
  - `campkit-integrated-revenue-report` → 意思決定支援レポート。ファイル変更なし＝Code受け渡しなしが正。
- Code へ deploy コマンドを渡さない（deployするものが無いため）。

---

## 参考
- 公開（自動）: `scripts/auto-deploy.ps1` → `scripts/deploy.cjs`。タスク名 `campkit-auto-deploy`（30分間隔）。登録・間隔変更・削除は `scripts/setup-auto-deploy-task.ps1`（`-ListOnly` / `-IntervalMinutes N` / `-Remove`）
- 実行結果: `logs/auto-deploy-status.json`（deployed／no-changes／skipped-recent-activity／deploy-failed／error）・`logs/auto-deploy.log`・`logs/auto-deploy-deploy.log`。`logs/` は gitignore 済
- デプロイ手順（手動で回す場合）: `docs/deploy-note.md`（一括: `node scripts/deploy.cjs "msg"`）
- 検証: `scripts/verify-deploy.cjs`（200/title/アフィリリンク/PR表記/og:image、20回×15秒リトライ）
- 記事・商品・KWのルール: `CLAUDE.md`
