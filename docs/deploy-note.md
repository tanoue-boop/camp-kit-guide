# デプロイ手順（Claude Code 用）

このファイルの手順どおりに実行すれば、記事追加・修正のデプロイと本番検証まで完了する。
呼び出しは「deploy-note.md の手順でデプロイして」の一言でよい。

---

## 前提

- 対象リポジトリ: `C:\claude-workspace\projects\camp-kit-guide`
- `main` への push で Vercel が自動デプロイする
- `.env.local` は gitignore 対象（`RAKUTEN_APP_ID` / `RAKUTEN_ACCESS_KEY` / `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG` などを含む）。**絶対にコミットしない**

---

## 推奨：一括デプロイ（1コマンド／確認プロンプトが出ない）

**通常はこれ1本でよい。** build → 安全確認 → git add → commit → push → 本番検証をまとめて実行する。

```bash
node scripts/deploy.cjs "記事追加: <変更内容を簡潔に>"
```

- git / build はスクリプト内部で回るため、Claude Code から見えるのは `node scripts/deploy.cjs ...` の**1コマンドだけ**。許可ルール `Bash(node *)` に収まるので、個別の許可プロンプト（`git add` / `commit` / `push` / `curl` 等）が出ない。
- 途中の `for … curl` や `sleep $(...)` のような**独自の待機ループを書かないこと**（コマンド置換を含む行は許可プレフィックスに照合できず必ず確認が出る）。反映待ちは verify 側が 20回×15秒（最大約5分）で自動リトライする。
- 安全装置：コミットメッセージ未指定／変更なし／`.env*`・`node_modules` の混入／ビルド失敗／検証FAIL のいずれかで中止する。

うまくいかない場合や個別に確認したい場合のみ、下の「手動手順」を使う。

---

## 手動手順（個別に確認したいとき）

### 1. 変更確認

```bash
git status
git diff --stat
```

想定される変更は次のいずれか。想定外の差分（`.env*`、`node_modules`、巨大バイナリ等）があれば**停止して報告**する。

- `content/posts/*.mdx` … 記事の追加・修正
- `_file/products.tsv` … 楽天商品の登録（採用フラグTRUE）
- `_file/amazon-link-worksheet.tsv` … Amazon存在確認・amzn.to管理
- `_file/keyword-backlog.tsv` … KWバックログのstatus更新
- `docs/*.md` … 記録の更新
- `pages/` `components/` `styles/` `scripts/` … コード変更

### 2. ビルド確認（必須）

```bash
npm run build
```

**EXIT 0 を確認してから次へ進む。** 失敗したら push せず、原因を報告して停止する。

よくある失敗原因: frontmatter の YAML 崩れ（`title:` の引用符閉じ忘れ）、MDX のパースエラー、`ComparisonTableMdx` の JSON 文字列不正。

### 3. コミット

```bash
git add content/posts _file docs pages components styles scripts
git status   # .env* が含まれていないか最終確認
git commit -m "<変更内容を簡潔に>"
```

記事追加時のコミットメッセージ例:
`記事追加: スノーピークのテント(楽天API実データ5選)＋モンベルのシュラフ(Amazon実データ4選)`

### 4. push（＝本番デプロイ）

```bash
git push origin main
```

### 5. 本番検証（自動）

Vercel のビルド完了を少し待ってから実行する。

```bash
node scripts/verify-deploy.cjs
```

引数なしで実行すると、直近コミットで変更された `content/posts/*.mdx` を自動検出して検証する。
slug を明示したい場合:

```bash
node scripts/verify-deploy.cjs snowpeak-tent montbell-sleeping-bag
```

検証項目は次の5点。すべて PASS なら完了、1件でも FAIL なら exit 1 になる。

1. 本番URLが 200 を返す
2. `<title>` がローカル frontmatter の `title` と一致
3. アフィリリンク数がローカルの `ProductCardMdx` 数以上（楽天 rafcid / Amazon `dp?tag=` / `amzn.to` を合算）
4. PR表記（景表法対応）が本文に含まれる
5. `og:image`（サムネイル）が `/images/outdoor-0X.png` 形式で、その画像URLが 200 を返す

デプロイ反映前だと 404/旧内容で FAIL することがある。スクリプトは自動で **20回×15秒（最大約5分）** リトライするので、**呼び出し側で待機ループを書く必要はない**。それでも FAIL する場合は Vercel のデプロイログを確認してから再実行する。

---

## 記録更新のルール（CLAUDE.md より）

デプロイ内容に応じて、同じコミットに以下を含める。

- 記事を追加した → `docs/operation-snapshot.md` の記事数・カテゴリ別内訳を更新
- SEO施策（title/meta変更・リライト等）をした → `docs/seo-change-log.md` に「日付・対象記事・狙い・変更内容」を追記

---

## やらないこと

- `.env.local` のコミット
- 既存記事の一括 `sed` / 正規表現置換（ファイルごとに確認する）
- ビルド未確認での push
