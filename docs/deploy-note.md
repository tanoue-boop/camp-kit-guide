# デプロイ手順（Claude Code 用）

このファイルの手順どおりに実行すれば、記事追加・修正のデプロイと本番検証まで完了する。
呼び出しは「deploy-note.md の手順でデプロイして」の一言でよい。

---

## 自動公開（2026-09-18〜・通常はこれで回る）

**定期タスクの成果は、人手を介さず自動で公開される。**Windows タスクスケジューラの `campkit-auto-deploy`（30分間隔）が `scripts/auto-deploy.ps1` を実行し、公開すべき変更があれば下の「一括デプロイ」と同じ `deploy.cjs` を起動する。

```
定期タスク（ファイルを更新＋_file/next-commit-message.txt に1行書く）
   ↓ 最大30分
auto-deploy.ps1  … 変更検知 → 静止期間10分チェック → コミットメッセージ決定
   ↓
deploy.cjs       … 排他ロック → 太字チェック → build → add → commit → push → 本番検証
```

- **コミットメッセージ**: `_file/next-commit-message.txt` の1行目が使われ、ファイルは自動削除される。無ければ変更内容から自動生成
- **公開されないケース**（いずれも正常動作）: 変更なし／変更ファイルが10分以内に書かれた（書きかけ保護）／ビルドや太字チェックの失敗／`.env`・node_modules の混入
- **結果の確認**: `logs/auto-deploy-status.json`（`deployed` / `no-changes` / `skipped-recent-activity` / `deploy-failed` / `error`）、詳細は `logs/auto-deploy.log` と `logs/auto-deploy-deploy.log`
- **止めたいとき**: `scripts\unregister-auto-deploy-task.bat`（タスク削除）。間隔変更や状態確認は `scripts\setup-auto-deploy-task.ps1 -ListOnly` / `-IntervalMinutes N`
- **公開した内容を戻す**: `git revert <commit>` → push（`git reset --hard` は使わない）

以下の手動手順は、**自動公開を待たずに今すぐ出したいとき**や、auto-deploy が失敗して原因を切り分けるときに使う。

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

検証項目は次の6点。すべて PASS なら完了、1件でも FAIL なら exit 1 になる。

0. 取得した本番HTMLが**デプロイ前の旧キャッシュでない**こと（`x-vercel-cache` / `age` ヘッダで判定。2026-09-22 追加・下記）
1. 本番URLが 200 を返す
2. `<title>` がローカル frontmatter の `title` と一致
3. アフィリリンク数
   - **楽天（2026-09-22 変更）**: 「収益の付くリンク」＝ProductCard の楽天ボタンのうち href が `hb.afl.rakuten.co.jp` のものだけを数え、**mdx から算出した期待数（`source="rakuten"` かつ `affiliateUrl` が `https://hb.afl.rakuten.co.jp/` で始まるカードの枚数）と一致**することを必須にする。`search.rakuten.co.jp` の検索URL（`source="amazon"` カードの楽天ボタン＝収益なし）は別カウントで合否に使わない。期待 0（全カード `source="amazon"`）は実測 0 で PASS
   - Amazon: `dp?tag=` / `amzn.to` の実数が期待数（`amazonAsin=`/`amazonUrl=`/`source="amazon"` の数）以上（2026-09-15追記：合算チェックのみだと「楽天リンクだけを追加したデプロイ」で旧HTMLの合計がたまたま一致し誤PASSする穴があったため個別チェックにした）
4. PR表記（景表法対応）が本文に含まれる
5. `og:image`（サムネイル）が `/images/thumbnails/<slug>.png` または `/images/outdoor-0X.png` 形式で、frontmatter の `thumbnail` と一致し、その画像URLが 200 を返す

デプロイ反映前だと 404/旧内容で FAIL することがある。スクリプトは自動で **内容不一致は 20回×15秒（最大約5分）／旧キャッシュは 30秒×6回（最大180秒）** リトライするので、**呼び出し側で待機ループを書く必要はない**。それでも FAIL する場合は Vercel のデプロイログを確認してから再実行する。判定ロジックは `node scripts/verify-deploy.cjs --test` でネットに出ずに検査できる（24ケース）。

#### 2026-09-22 追記：楽天リンク数の空振り PASS（2026-09-15 と同じ系列の穴）

`campkit-20260921-38`（旧形式 Amazon リンク 8 枚を現行形式へ統一＋楽天リンク 3 枚追加）のデプロイで、**Vercel のビルド完了前の旧 HTML（`x-vercel-cache=HIT`）に対して verify-deploy が PASS を出した**。実際の反映は作業側が手作業で `x-vercel-cache=PRERENDER`・`age=0` になるまで 30 秒間隔でポーリングしてから確認している（38 レポート §9／§11-3）。

- **原因**: 旧実装は `hb.afl.rakuten.co.jp/hgc/` の**全出現数**（＋ `item.rakuten.co.jp/…rafcid=`）を数えて「`source="rakuten"` の数**以上**」で PASS にしていた。ところが 1 枚のカードの hb.afl は本番 HTML に **3 回**（ボタン `href`／JSON-LD `offers.url`／`__NEXT_DATA__` の compiledSource）＋比較表の購入先リンク 1 回で現れるため、旧 HTML に楽天カードが 3 枚しか無くても 9 ≧ 4 で期待数を満たしてしまう。2026-09-15 の「合算チェックの穴」と同じく**旧 HTML でも条件が成り立つ**系列の穴。
  - 38 レポートは原因を「`rafcid` を数えるため検索URLも加算」と書いていたが、旧正規表現 `item\.rakuten\.co\.jp\/[^"']*rafcid=` は `search.rakuten.co.jp` に当たらない。実際の原因は上記の重複出現と `≧` 判定（本タスクで実測して確認）。
- **対策（`scripts/verify-deploy.cjs`）**: (1) 楽天は ProductCard の楽天ボタン（`class="…ProductCard…__rakuten"` の `<a>`）の `hb.afl` 数だけを数え、mdx 由来の期待数と**一致**で判定。検索URL・比較表リンク・全出現数は参考表示のみ。(2) `x-vercel-cache` が `HIT`/`STALE` で `age` が「デプロイ後の経過秒数」より大きい応答（＝push より前にキャッシュされた旧 HTML）は内容が一致していても「反映待ち」として 30 秒×最大 6 回再取得し、上限で FAIL。デプロイ時刻は `deploy.cjs` が push 直前に `--deployed-at=<epoch秒>` で渡す（手動実行時は HEAD のコミット時刻で代用）。判定用の取得には `?cb=<エポック秒>` を付ける。
- **なぜヘッダ判定を「期待文字列が出るまでポーリング」に足したか**: 内容ベースの判定は「変更が verify の観測項目に現れる」ことが前提で、38 のように観測項目の値が旧 HTML でも同じになるデプロイ（あるいは本文の文言だけの修正）では原理的に旧 HTML を弾けない。ヘッダ判定は内容に依らず「push より古いキャッシュか」だけを見るので、その死角を塞ぐ。

---

## 6. 本番ブラウザ目視＋文脈レビュー（新規/リライト記事は必須）

`verify-deploy.cjs` は HTTP レベルの整合（200・title・リンク数・PR表記・og:image）しか見ない。**レイアウト崩れ・表示上の不自然さ・文脈のおかしさ**は機械検証を通っても残るため、push 反映後に対象記事を**実際にブラウザで開いて目視レビューする**（Cowork の Claude in Chrome で `?ckbot=1` を付けて開く＝計測を汚さない）。

チェック観点（新規/リライトした各記事URLについて）:

1. **Markdownの生表示がないか** … `**` や `##`、`|` などが本文にそのまま出ていないか。特に**太字の閉じが全角括弧の直後になるケース**（`**…（〜）**` や `**…「〜」**`）は CommonMark の右フランキング規則で閉じられず、`**` がそのまま表示される。→ 対策は太字境界を括弧の外に出す（`**火吹き棒**（ふいご）` のようにする）。下の事前lintで検出できる。
2. **レイアウト崩れ** … ProductCard・比較表・CalloutCta・目次が正しく描画され、画像（商品/og）が表示されているか。
3. **文脈・事実の不自然さ** … 価格/レビュー件数/評価が本文・カード・比較表・まとめ表で食い違っていないか、KWと商品がずれていないか、日本語として不自然な繰り返し・言い回しがないか。
4. **リンク挙動** … 「Rakutenで購入する」「CalloutCtaのボタン」が別タブ・正しい遷移先か（sponsored/nofollow）。

問題があればソースを修正し、**再デプロイ（`node scripts/deploy.cjs "…"`）してから再レビュー**する。

> ⚠️ **本文の文言だけを直す修正では、`verify-deploy.cjs` のPASSを「反映確認」とみなさないこと。** verifyの5項目（HTTP 200／title／リンク数／PR表記／og:image）は本文の文言変更では値が動かないため、CDN/ブラウザのキャッシュが残っていると**修正前の古いページのままでもPASSしてしまう**（＝反映されたことの確認にならない）。文言修正の反映は、必ず `?ckbot=1` ＋キャッシュバスター（`&_=<timestamp>` 等）で再取得し、**新しい文言がブラウザに実際に出ていることを目視で確認**する。実例: 2026-08-10 camp-windscreen の2位説明文修正で、verifyは初回即PASSしたが受領していたのはキャッシュ前版だった（約30秒後の再取得で新本文に切替を目視確認）。

### 事前lint（push前に走らせると①を機械的に防げる）

太字が全角閉じ括弧の直後で閉じるパターンを検出する（ヒットしたら太字境界を括弧外へ）:

```bash
grep -nE '[）】」』〕)]\*\*' content/posts/*.mdx
```

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
