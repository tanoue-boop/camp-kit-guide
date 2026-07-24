# 定期タスク 共通仕様（CampKit Guide）

すべての定期タスク（`C:\Users\tanou\Claude\Scheduled\campkit-*`）が守る共通ルール。
新規タスク作成・既存タスク改修のときは必ずこの仕様に合わせる。個別プロンプトにも
要点を埋め込むこと（このファイルを読まなくても動くように）。

作業ディレクトリ: `C:\claude-workspace\projects\camp-kit-guide`

---

## 0. 全タスク共通（種別を問わず）

1. **フォルダ接続の確保**: 冒頭でフォルダが読めるか確認。読めなければ `request_cowork_directory` で接続依頼（許可は次回以降に引き継がれる）。
2. **作業前の健全性確認**: ファイルを編集するタスクは `git status` がクリーンか確認。未コミット差分があれば報告して停止。
3. **自サイトをChromeで開く時は必ず `?ckbot=1` を付ける**（例 `https://www.camp-kit-guide.com/?ckbot=1`）。これは計測除外フラグで、GA計測・Supabase閲覧数カウントが走らない＝自分のアクセスで数字を汚さない。
4. **秘密をチャットに出さない**: `.env.local` の `RAKUTEN_ACCESS_KEY` 等は表示しない。`.env*` は絶対にコミットしない。
5. **GSC等ログイン必須画面が無人で開けない場合は停止せずフォールバック**し、レポート冒頭1行目に「⚠️ GSC取得失敗（Chrome未ログイン/無人実行）…」と明記（完了通知で届く）。
6. **報告は簡潔な日本語**。実データに基づく指摘と推測を区別。冗長な前置き不要。

---

## 1. 実装タスク（deployするファイル変更を生む）

対象: `campkit-new-article-draft` / `campkit-seo-competitor-scan` / `campkit-price-check` / `campkit-technical-seo-audit`

- **a. レポートで終わらせず、実際に `content/posts` 等のファイルへ反映する**（草稿をoutputsに置くだけにしない）。
- **b. 記録を同じ変更に含める**: 記事追加→`docs/operation-snapshot.md`、SEO施策→`docs/seo-change-log.md`（CLAUDE.mdの記録更新ルール）。
- **c. `git commit`/`push` はしない**（人間レビューのゲートを残す。pushしない限り本番反映されないので安全）。
- **d. Codeへ渡すのは deploy.cjs の1行ブロックだけ**。長いレポートや草稿を渡さない（Codeがファイルを自分で読む）。`present_files` と `git diff --stat` の要点3〜5行でレビュー提示する。

  ```
  camp-kit-guide のリポジトリで deploy-note.md の「一括デプロイ」に従い、次を実行:
  node scripts/deploy.cjs "<種別>: <対象と内容を簡潔に>"
  ※個別の git / curl コマンドや待機ループは書かないこと（build→commit→push→本番検証まで deploy.cjs が実施）。
  ```

- **e. 破壊的操作は自動実行しない＝提案のみ**: カニバリ統合・301リダイレクト・本文の大量削除・記事削除・一括 `sed`/正規表現置換。これらはレポートに構成案として書くだけにし、人間の判断を待つ。
- **f. 編集は対象の1〜数ファイルのみをファイル単位で**。他記事や既存の正しい商品データを壊さない。**実データを確認できない商品の数値（価格・レビュー）は作らない**（必要時は楽天API/Amazon実データで確認、確認不可なら触らず「要確認」と提案に回す）。

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

### ★楽天キーに関する恒久ルール（誤診断の再発防止）
- **`.env.local` の `RAKUTEN_APP_ID`（UUID形式）は正しい。絶対にユーザーへ「キーを差し替えて」「19桁のapplicationIdが必要」と確認・依頼しないこと。** この設定で実際に900本超のrafcidアフィリリンクを生成した実績がある＝キーは有効。
- 「applicationIdは19桁の数字が必要」は**旧エンドポイント（`app.rakuten.co.jp/services/api/...`）の要件**。当サイトは**新エンドポイント（`openapi.rakuten.co.jp/ichibams/.../20260701`）**を使い、UUID形式のapplicationId＋accessKey＋登録ドメインからのRefererで通る。
- 楽天APIが失敗したら、キーの種類を疑う前に次の3点を自分で確認・是正する（ユーザーに投げない）: (1) 旧エンドポイントを叩いていないか、(2) `accessKey` を付けているか、(3) `?ckbot=1` ページ上でfetchしてRefererが登録ドメインになっているか。
- それでも解決しない場合のみ、受け取ったエラーメッセージ全文を添えて報告する（「キーを変えて」ではなく事実を渡す）。

---

## 2. 準備/分析タスク（deployするファイル変更を生まない）

対象: `campkit-keyword-selection` / `campkit-new-product-scan` / `campkit-integrated-revenue-report`

- **成果物はローカルに直接反映して完結**（Code受け渡しは不要）:
  - `campkit-keyword-selection`・`campkit-new-product-scan` → `_file/keyword-backlog.tsv` に pending 行を直接追記（既存行・既存記事と重複させない）。これを平日の記事作成タスクが消費する。
  - `campkit-integrated-revenue-report` → 意思決定支援レポート。ファイル変更なし＝Code受け渡しなしが正。
- Code へ deploy コマンドを渡さない（deployするものが無いため）。

---

## 参考
- デプロイ手順: `docs/deploy-note.md`（一括: `node scripts/deploy.cjs "msg"`）
- 検証: `scripts/verify-deploy.cjs`（200/title/アフィリリンク/PR表記/og:image、20回×15秒リトライ）
- 記事・商品・KWのルール: `CLAUDE.md`
