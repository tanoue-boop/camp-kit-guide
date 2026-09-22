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
   - **Amazon（2026-09-22 変更・campkit-20260921-45）**: ProductCard の Amazon ボタン（`class="…ProductCard…__amazon"` の `<a>`）の枚数が、**mdx をカード単位に解析して「そのカードに Amazon ボタンが出るか」を `ProductCard.getAmazonUrl()` と同じ優先順（`amazonUrl` → `amazonAsin` → `source="amazon"` のとき `affiliateUrl` を ASIN とみなす）で判定した期待数と一致**することを必須にする。JSON-LD／`__NEXT_DATA__`／比較表に出る `dp?tag=`・`amzn.to` は数えない（全出現数と旧期待値＝属性出現数は参考表示のみ）。期待 0 は実測 0 で PASS。旧規則（`dp?tag=`/`amzn.to` の全出現数 ≧ `amazonAsin=`/`amazonUrl=`/`source="amazon"` の mdx 全文出現数）は下記の追記を参照（2026-09-15追記：合算チェックのみだと「楽天リンクだけを追加したデプロイ」で旧HTMLの合計がたまたま一致し誤PASSする穴があったため個別チェックにした、という経緯はそのまま）
   - **リンクの値（href）の照合（2026-09-22 追加・campkit-20260921-47／キュー#34）**: 枚数一致に加えて、ProductCard の**楽天ボタン（hb.afl）／Amazon ボタンの href** を文書順に取り出し、mdx から算出した**期待 href**（楽天＝`source="rakuten"` かつ hb.afl の `affiliateUrl` そのもの／Amazon＝`getAmazonUrl()` と同じ優先順で `amazonUrl` はその文字列そのまま・`amazonAsin`／legacy は `https://www.amazon.co.jp/dp/<ASIN>`）と**多重集合として一致**することを必須にする。順序は問わない（カードの並べ替えだけで反映待ちにしない）。Amazon dp の `?tag=` 以降は照合対象外（ローカルの `.env.local` はプレースホルダで Vercel 側のタグを verify から知れない。タグの健全性は 3b の別検査が担当）。href は HTML エンティティを復号して比べる（hb.afl の `&m=…&rafcid=…` は本番 HTML で `&amp;`）。JSON-LD／`__NEXT_DATA__`／比較表／本文リンクは対象外。**合否は「楽天枚数一致 && Amazon枚数一致 && 楽天値一致 && Amazon値一致」**。従来の「ProductCard 件数 ≦ 全リンク出現数」は 47 で外した（`getRakutenUrl()` は常に URL を返す＝楽天ボタンは必ず 1 枚出るので「リンクが 1 本も無いカード」は原理的に無く、混在カウントで判定として意味が薄い）
4. PR表記（景表法対応）が本文に含まれる
5. `og:image`（サムネイル）が `/images/thumbnails/<slug>.png` または `/images/outdoor-0X.png` 形式で、frontmatter の `thumbnail` と一致し、その画像URLが 200 を返す

デプロイ反映前だと 404/旧内容で FAIL することがある。スクリプトは自動で **内容不一致は 20回×15秒（最大約5分）／旧キャッシュは 30秒×6回（最大180秒）** リトライするので、**呼び出し側で待機ループを書く必要はない**。それでも FAIL する場合は Vercel のデプロイログを確認してから再実行する。判定ロジックは `node scripts/verify-deploy.cjs --test` でネットに出ずに検査できる（45ケース＝40 の 24＋45 の Amazon 10＋47 の値照合 11）。

#### 2026-09-22 追記：楽天リンク数の空振り PASS（2026-09-15 と同じ系列の穴）

`campkit-20260921-38`（旧形式 Amazon リンク 8 枚を現行形式へ統一＋楽天リンク 3 枚追加）のデプロイで、**Vercel のビルド完了前の旧 HTML（`x-vercel-cache=HIT`）に対して verify-deploy が PASS を出した**。実際の反映は作業側が手作業で `x-vercel-cache=PRERENDER`・`age=0` になるまで 30 秒間隔でポーリングしてから確認している（38 レポート §9／§11-3）。

- **原因**: 旧実装は `hb.afl.rakuten.co.jp/hgc/` の**全出現数**（＋ `item.rakuten.co.jp/…rafcid=`）を数えて「`source="rakuten"` の数**以上**」で PASS にしていた。ところが 1 枚のカードの hb.afl は本番 HTML に **3 回**（ボタン `href`／JSON-LD `offers.url`／`__NEXT_DATA__` の compiledSource）＋比較表の購入先リンク 1 回で現れるため、旧 HTML に楽天カードが 3 枚しか無くても 9 ≧ 4 で期待数を満たしてしまう。2026-09-15 の「合算チェックの穴」と同じく**旧 HTML でも条件が成り立つ**系列の穴。
  - 38 レポートは原因を「`rafcid` を数えるため検索URLも加算」と書いていたが、旧正規表現 `item\.rakuten\.co\.jp\/[^"']*rafcid=` は `search.rakuten.co.jp` に当たらない。実際の原因は上記の重複出現と `≧` 判定（本タスクで実測して確認）。
- **対策（`scripts/verify-deploy.cjs`）**: (1) 楽天は ProductCard の楽天ボタン（`class="…ProductCard…__rakuten"` の `<a>`）の `hb.afl` 数だけを数え、mdx 由来の期待数と**一致**で判定。検索URL・比較表リンク・全出現数は参考表示のみ。(2) `x-vercel-cache` が `HIT`/`STALE` で `age` が「デプロイ後の経過秒数」より大きい応答（＝push より前にキャッシュされた旧 HTML）は内容が一致していても「反映待ち」として 30 秒×最大 6 回再取得し、上限で FAIL。デプロイ時刻は `deploy.cjs` が push 直前に `--deployed-at=<epoch秒>` で渡す（手動実行時は HEAD のコミット時刻で代用）。判定用の取得には `?cb=<エポック秒>` を付ける。
- **なぜヘッダ判定を「期待文字列が出るまでポーリング」に足したか**: 内容ベースの判定は「変更が verify の観測項目に現れる」ことが前提で、38 のように観測項目の値が旧 HTML でも同じになるデプロイ（あるいは本文の文言だけの修正）では原理的に旧 HTML を弾けない。ヘッダ判定は内容に依らず「push より古いキャッシュか」だけを見るので、その死角を塞ぐ。

#### 2026-09-22 追記：Amazon リンク数も楽天と同じ「ボタン枚数＝カード単位の期待数（一致）」に揃えた（campkit-20260921-45／キュー#32）

40 で楽天を直した時点で、Amazon 側には同じ形の穴が残っていた（40 §10-1 の QUESTION）。

- **旧規則の穴**: 期待側は `amazonAsin=`／`amazonUrl=`／`source="amazon"` の **mdx 全文の属性出現数**、実測側は `dp?tag=`／`amzn.to` の**全出現数**で「期待数以上」。ところが (1) `source="amazon"` カードは `dp?tag=` が**ボタン href と JSON-LD `offers.url` の 2 回**出る、(2) `amazonUrl`（amzn.to）カードは `amzn.to` が**ボタン href と `__NEXT_DATA__` の 2 回**出る、(3) `amazonUrl` と `amazonAsin` を両方持つカードは属性 2 つ（期待 2）に対しボタンは 1 つ、(4) `source="amazon"`＋`affiliateUrl="#"` はボタンが出ないのに期待に数える——ため、期待と実測が別々の理由でずれ、**旧 HTML にボタンが足りなくても重複出現ぶんで期待数を満たして PASS しえた**。45 の空撃ちで確認した実例: ogawa-tent／sleeping-bag-cover は旧期待 6（`amazonAsin`×5＋`source="amazon"`×1）に対し `dp?tag=` 全出現 6（ボタン 5＋JSON-LD 1）、coleman-lantern は旧期待 6（`amazonAsin`×5＋`amazonUrl`×1）に対し dp 4＋amzn.to 2＝6、dod-tarp は旧期待 5 に対し dp 3＋amzn.to 2＝5——いずれも**偶然つじつまが合っていただけ**（実際のボタンは 5／5／5／4 枚）。
- **対策（`scripts/verify-deploy.cjs`）**: 実測は ProductCard の Amazon ボタン（`class="…ProductCard…__amazon"` の `<a>`）の枚数だけ（href が dp か amzn.to かは内訳表示）。期待は mdx をカード単位に解析し、`components/article/ProductCard.tsx` の `getAmazonUrl()` と同じ優先順（`amazonUrl` → `amazonAsin` → `source="amazon"` かつ `affiliateUrl` が空でも `"#"` でもない）で「そのカードにボタンが出るか」を 0/1 で数える。合否は**一致**（期待 0 は実測 0 で PASS）。反映待ち判定（`pendingReasons`）も同じ一致条件に変更（旧規則は「未達」のみ再取得）。`dp?tag=`／`amzn.to` の全出現数と旧期待値（属性出現数）は参考表示に残す。「Amazonタグ健全性」「ASIN重複なし」の 2 検査、40 の楽天判定・キャッシュ判定、`deploy.cjs` との `--deployed-at` インタフェースは不変更。`judgeAmazon` を `module.exports` に追加。
- **テスト**: `--test` 24→34（D-1〜D-10）。旧 HTML（JSON-LD／`__NEXT_DATA__` の重複出現で旧規則 PASS）が新規則で FAIL する再現、ボタン過多で FAIL、JSON-LD／`__NEXT_DATA__`／比較表の `dp?tag=` を数えない、期待 0・実測 0 PASS、`amazonUrl` 優先（両方持ちで期待 1）、`source="amazon"` の `affiliateUrl`=ASIN で期待 1（`"#"` は 0）、Amazon だけ足りない旧 HTML を反映待ちとして再取得——を含む。フィクスチャは 2026-09-22 に ogawa-tent／camp-table-folding の本番 HTML を取得して構造（JSON-LD → カード div → ボタン群、`__NEXT_DATA__` に属性がそのまま入る）を合わせた。
- **空撃ち（読み取りのみ）**: 13 記事（ogawa-tent／sleeping-bag-cover＋44 の 11 記事）に新ロジックを実行し **13/13 PASS**（Amazon ボタンの期待＝実測が全記事一致。mdx の修正は不要だった）。

#### 2026-09-22 追記：枚数が変わらない変更でも旧 HTML を弾けるよう、リンクの「値」をカード単位で照合（campkit-20260921-47／キュー#34）

44（キュー#18 第2弾）の実変更は「1 カードの `amazonUrl`（amzn.to）を同一商品の `amazonAsin` に置き換える」もので**ボタン枚数は変わらない**。45 の枚数一致は「枚数が変わる変更」の穴は閉じたが、この型（ASIN の差し替え・amzn.to→dp 置換・楽天 `affiliateUrl` の差し替え・name/price のみの変更）では旧 HTML でも期待 5＝実測 5 で `pendingReasons` が空になり PASS してしまう（47 §B で 45 時点のコードに 44 型フィクスチャを流して再現・検出不可を確認）。

- **対策（`scripts/verify-deploy.cjs`）**: `parseLocal` がカードごとに期待 href（`rakutenExpectedHrefs`／`amazonExpectedHrefs`）を積み、`countAffiliateLinks` がボタンの href（`rakutenHbHrefs`／`amazonButtonHrefs`・エンティティ復号済み・dp はタグ無しに正規化）を文書順に積む。`judgeRakutenHrefs`／`judgeAmazonHrefs` が多重集合として比べ `{ ok, missing, extra }` を返す。`pendingReasons` は枚数が一致しているときだけ href 不一致の理由（不足／余剰の href を最大 3 件＋件数）を足す（枚数不一致時は枚数の理由で既に反映待ちになるので重ねない）。`judgeLinks` が合否を「楽天枚数 && Amazon枚数 && 楽天値 && Amazon値」にまとめ、`verify()` の従来チェック `links.total >= cardCount` は外した（45 QUESTION-1 への監督判断）。表示は既存 1 行の末尾に `href照合 楽天OK・AmazonOK`（不一致時だけ差分）を足した。40 の楽天判定・キャッシュ判定、45 の Amazon 枚数判定、`RETRY`／`STALE_*` 定数、「Amazonタグ健全性」「ASIN重複なし」、`deploy.cjs` との `--deployed-at` インタフェースは不変更。
- **タグの扱い**: Amazon dp URL は `?tag=` 以降を落とした `https://www.amazon.co.jp/dp/<ASIN>` で比べる。ローカルの `.env.local` は `your-associate-tag-22`（プレースホルダ）で、`lib/amazon.ts` のフォールバック `campkit26-22` と本番の実タグは今日は一致しているが、Vercel 側の `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG` を verify 側から知る手段が無く、タグだけの違いで全記事が FAIL する事故を避けた。タグの健全性（空タグ 0／プレースホルダ 0）は 3b の別検査がそのまま担当する。`amazonUrl`（amzn.to）は文字列そのまま照合。
- **テスト**: `--test` 34→45（E-1〜E-11・ネット不使用・既存 34 は不変更）。ASIN だけ違う旧 HTML（枚数 5=5）で FAIL、44 型（amzn.to→dp）で FAIL、並べ替えのみ PASS、同一 ASIN 2 カード（shared_asin）は 2 回出れば PASS・回数違いは FAIL（多重集合）、楽天 `affiliateUrl` 差し替えで FAIL、`affiliateUrl="#"`＋Amazon 属性なしでも楽天ボタン 1 枚で PASS（`total ≧ cardCount` を外しても落ちない）、`&amp;` 復号、タグ・www・http の正規化、`fetchWithRetry` が href 不一致で再取得、不一致列挙の上限、既存枚数判定の不変。フィクスチャの `buildHtmlCards` は href の `&` を React と同じく `&amp;` にエスケープするよう合わせた（2026-09-22 camp-bbq-grill の本番 HTML で確認。JSON-LD の `offers.url` は `&` のまま）。
- **空撃ち（読み取りのみ・46 の 10 記事）**: href 照合は **10/10 で楽天・Amazon とも OK**。logos-bonfire だけ既存検査「ASIN重複なし」で FAIL（#1/#3 が同一 `B0792FP76X`＝46 が `dup_in_article` として QUESTION に上げ mdx を据え置いたもの。値照合由来ではない）。

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
