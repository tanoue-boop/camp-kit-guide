@AGENTS.md

# CampKit Guide — Claude 作業ガイド

---

## 記録更新ルール（作業のたびに必ず実施）

作業内容に応じて、以下のドキュメントを必ず最新化してからpushする。スナップショットの放置で現状と乖離するのを防ぐため。

- **SEO施策（タイトル/メタ変更・記事ブラッシュアップ・新記事のSEO的狙い等）をしたら** → `docs/seo-change-log.md` に「日付・対象記事・狙い・変更内容」を追記
- **記事を追加した／カテゴリ・GAS構造を変えたら** → `docs/operation-snapshot.md` の記事数・カテゴリ・GAS構造を最新化
- **記事作成ルール自体を変えたら** → この CLAUDE.md を更新

作業をまとめてpushする際は、成果物（記事等）と一緒に上記ドキュメントの更新も同じcommitに含める。

---

## プロジェクト概要

| 項目 | 内容 |
|------|------|
| サイト名 | CampKit Guide |
| URL | https://www.camp-kit-guide.com |
| リポジトリ | https://github.com/tanoue-boop/camp-kit-guide |
| フレームワーク | Next.js 16 (Pages Router) |
| 言語 | TypeScript |
| スタイル | CSS Modules（ページ・コンポーネントごとに `.module.css`） |
| 記事形式 | MDX（`next-mdx-remote` v6 でレンダリング） |
| DBアクセス | Supabase（閲覧数カウント） |
| サイトマップ | `next-sitemap`（ビルド後に自動生成） |
| デプロイ先 | Vercel（`main` ブランチへの push で自動デプロイ） |

---

## ファイル構成

```
camp-kit-guide/
├── content/posts/        # MDX記事ファイル（1記事=1ファイル）
├── pages/
│   ├── index.tsx         # トップページ（カテゴリグリッド・新着記事）
│   ├── ranking.tsx       # ランキングページ
│   ├── category/[slug].tsx  # カテゴリ一覧ページ
│   ├── posts/[slug].tsx  # 記事詳細ページ（MDXレンダリング）
│   └── _app.tsx / _document.tsx
├── components/
│   ├── layout/           # Header, Footer, Layout
│   ├── common/           # Seo, Breadcrumb
│   ├── article/          # ProductCard, ComparisonTable, TOC, Sidebar 等
│   └── top/              # CategoryGrid, RankingWidget
├── styles/               # globals.css + 各ページの .module.css
├── types/                # post.ts, category.ts, product.ts
└── lib/                  # gtag.ts, amazon.ts, rakuten.ts, supabase.ts
```

---

## カテゴリ定義（重要：4ファイルに分散）

カテゴリを追加・変更する場合は**以下の4ファイルすべて**を更新すること。

| ファイル | 配列名 |
|---------|--------|
| `pages/category/[slug].tsx` | `allCategories` |
| `pages/index.tsx` | `baseCategories`（icon フィールドあり） |
| `components/layout/Header.tsx` | `CATEGORIES`（href, label, icon） |
| `pages/posts/[slug].tsx` | `ALL_CATEGORIES`（サイドバー・パンくず用） |

### 現在のカテゴリ一覧

| slug | 表示名 | アイコン |
|------|--------|---------|
| tent | テント | ⛺ |
| sleeping-bag | 寝袋・シュラフ | 🛏️ |
| cookware | 調理器具 | 🍳 |
| chair-table | チェア・テーブル | 🪑 |
| lighting | 照明・ランタン | 🔦 |
| clothing | ウェア・装備 | 🧥 |
| bonfire | 焚き火台 | 🔥 |
| backpack | バックパック | 🎒 |
| power | 電源・バッテリー | 🔋 |

---

## 記事作成ルール（重要）

### frontmatter フォーマット

```yaml
---
title: "記事タイトル【2026年版】"
description: "120〜150字のSEO説明文（実商品名・価格帯を含めると◎）"
date: "YYYY-MM-DD"
updatedAt: "YYYY-MM-DD"
category: "カテゴリslug"
tags: ["タグ1", "タグ2", "キャンプ", "2026年"]
thumbnail: ""
---
```

- `date` は初回公開日（未来日付は禁止）
- `updatedAt` は最終更新日。新規公開時は `date` と同じ値を入れる（コードがJSON-LD `dateModified` で参照）
- `description` は120〜150字（メタディスクリプション最適長）
- `thumbnail` は **`/images/outdoor-01〜09.png` のローカル画像プールから記事内容に合うものを指定する**（サイト内の既存記事はすべてこの方式で統一。同じ画像をカテゴリをまたいで再利用してよい）。空文字にするとプレースホルダー /og-default.png にフォールバックする
- ⚠️ **`thumbnail` に楽天など商品画像のURLを使わない**：小サイズ・URL変動・既存規約との不統一のため。商品画像（楽天画像URL）は各 `ProductCardMdx` の `image=` にのみ使う。frontmatter の `thumbnail` はローカル画像限定
- ⚠️ **`keywords` / `eyecatch` は使用禁止**：コードから一切参照されない死んだキー（commit `fb3c3d6` で全記事を修正済）。使っても thumbnail が表示されず tags も機能しない。**必ず `tags` / `thumbnail` を使うこと**

### 記事構成テンプレート

1. **はじめに**（〜200字）：なぜこの商品が必要か、選び方の重要性

2. **選び方の4ポイント**：カテゴリに応じた重要要素を `### ポイントN：` で記述

3. **おすすめ5選**：`### 第N位：商品名` で各製品を紹介

4. **5製品スペック比較表**：`<ComparisonTableMdx>` コンポーネントを使用

5. **お手入れ・使い方Tips**
   - 見出し：`## お手入れ・使い方Tips`
   - 4〜5項目、`**タイトル：** 説明文` 形式
   - 各項目60〜100字
   - 想定テーマ：使用後の手入れ／保管方法／長持ちのコツ／注意点／応用テクニック

6. **よくある質問**
   - 見出し：`## よくある質問`（表記ゆれ禁止）
   - **5問固定**（欠損禁止）
   - Q：15〜25字（明確な疑問形）
   - A：80〜150字（具体的な数値・根拠を含む）
   - 形式：`**Q. 質問**` 改行 `A. 回答`
   - **テーマ選定（5問のうち最低3つは以下から選ぶ）**：
     1. 構造・スペックの違い（例：自立式vs非自立式）
     2. 価格帯による違い（安いものと高いものの違い）
     3. 素材・形状の比較
     4. メンテナンス・耐久性・寿命
     5. 季節・シーン適合性
     6. 初心者向け推奨モデル
     7. 法令・規制（ナイフ・刃物等の該当ジャンルのみ）
   - FAQ後：`---` 区切り → `## まとめ` へ

7. **まとめ：用途別おすすめ一覧**
   - 見出し：`## まとめ：[メインKW]の用途別おすすめ一覧`
   - **3列5行のmarkdown table（必須）**：
     - 列1：優先したいこと（用途・ニーズ）
     - 列2：おすすめモデル（採用商品から選ぶ）
     - 列3：価格帯（◯◯円台 形式）
   - 表の後に締めパラグラフ（3〜5文）

### MDXコンポーネントの使い方

#### ProductCardMdx

```mdx
<ProductCardMdx
  rank="1"
  id="product-id"
  name="メーカー名 商品名"
  description="30〜50字の商品説明"
  price="19800"
  amazonRating="4.5"
  amazonReviewCount="3200"
  rakutenRating="4.4"
  rakutenReviewCount="980"
  affiliateUrl="#"
  source="amazon"
  badge="バッジテキスト（任意）"
/>
```

- `price` は数値を文字列で渡す（例: `"19800"`）
- `affiliateUrl` は実際のアフィリエイトURLまたは `"#"`
- `id` はページ内アンカーリンクに使う（まとめ表のリンク先）

#### ComparisonTableMdx

```mdx
<ComparisonTableMdx
  columns='[{"key":"name","label":"商品名"},{"key":"カスタムキー","label":"表示ラベル"}]'
  rows='[{"id":"product-id","name":"商品名","カスタムキー":"値"}]'
/>
```

- `columns` と `rows` は**シングルクォートで囲んだJSON文字列**
- `name` キーは必須（第1列に表示）
- `price` / `rating` / `source` キーは特殊レンダリングあり。数値として扱われるため、価格は `"価格"` などの別キーを使うこと

---

## 商品選定ルール

- **実在する人気ブランドの定番モデルのみ**（架空の商品禁止）
- Amazonと楽天の両方で購入できることを確認
- `affiliateUrl` は現時点では `"#"` でOK（後から差し替え）
- 価格・レビュー数は執筆時点の参考値でOK（仮データ可）
- 1記事に同一ブランドが3製品以上重複しないようにする

### カテゴリ別推奨ブランド

| カテゴリ | 参考ブランド |
|---------|-------------|
| クーラーボックス | コールマン / YETI / ロゴス / ダイワ / イグルー |
| ポータブル電源 | Jackery / EcoFlow / BLUETTI / Anker |
| タープ | スノーピーク / DOD / コールマン / DD Hammocks / ロゴス |
| 寝袋（冬） | ナンガ / モンベル / イスカ / コールマン / スナグパック |
| ヘッドライト | ペツル / ブラックダイヤモンド / レッドレンザー / ジェントス |
| バーナー | スノーピーク / SOTO / コールマン / イワタニ / プリムス |
| テント | スノーピーク / コールマン / ノルディスク / MSR / ロゴス |
| ナイフ | モーラナイフ / オピネル / ビクトリノックス / スパイダルコ |

### KW整合性ルール（CVR最大化のため必須）

キーワード選定 → 記事作成 → 商品選定の流れで、
KWの検索意図と紹介商品が一致しなければCVRが落ちる。
記事作成前に必ず以下を確認する。

#### ステップ1：KWから購入者像を特定

対象KWについて以下を分析する：

1. **購入者の経験レベル**：初心者 / 中級者 / 上級者
2. **想定予算**：低価格帯（〜5,000円）/ 中価格帯（5,000〜15,000円）/ 高価格帯（15,000円〜）
3. **用途の具体性**：汎用 / 特定用途（料理・焚き火・薪割りなど）
4. **検索意図**：購入型 / 比較型 / 情報型 / ブランド型

#### ステップ2：商品選定の縛り

選定する5商品すべてが、購入者像に合致する必要がある。

**価格帯の分散ルール**

- 初心者KW：全商品が想定予算の±50%以内に収まる
  - 例：「初心者」なら全5商品を ¥2,000〜¥6,000 に収める
- 比較KW：価格帯を幅広く配置OK（ただし全商品が該当ジャンル内）
- コスパKW：全商品が平均価格以下
- 本格KW・ハイエンドKW：全商品がミドル〜ハイエンド

**用途の一貫性**

- 料理KW：全商品が調理に適した刃長・形状
- ブッシュクラフトKW：全商品がフィクストブレード or 堅牢構造
- 調理KWと薪割りKWを混ぜた商品選定はNG

**ブランドKW**

- 「モーラナイフ」KW：5商品すべてモーラナイフの異なるモデル
- 「モーラナイフ vs オピネル」KW：両ブランドを並行して紹介

#### ステップ3：整合性チェック（記事公開前に必ず確認）

- [ ] 5商品の 最高価格 ÷ 最低価格 が 5倍を超えていない
- [ ] 5商品すべてがKWの用途に対応している
- [ ] 初心者KWなのに上級者向け商品が混ざっていない
- [ ] ブランドKWなのに他ブランドを混ぜていない

#### NG例（直近の既存記事にもある要修正パターン）

- ❌ 「キャンプナイフ初心者おすすめ5選」で¥11,000のハイエンド商品を入れる
- ❌ 「調理ナイフおすすめ」にブッシュクラフト用フィクストブレードを入れる
- ❌ 特定ブランドKWで他ブランドを混ぜる

#### 商品実在性の担保

- Claudeの知識だけで架空の商品名・価格・レビュー数を書かない
- 不確実な場合は「価格帯：約〇〇円〜」のように幅で書く
- Amazon/楽天で実在確認できない商品は選ばない

### KW選定の強化ルール（楽天供給フィルタ・ブランド占有の運用）

実運用で得た学びをもとに、KW選定時に以下を追加で確認する。

#### 楽天供給フィルタの追加除外類型

- **ウェア類（フリース／ダウン／ジャケット等）**は、サイズ・カラーでページが分散してレビューが薄くなり、採用5件が安定しない。**ブランド指定KW（ワークマン／モンベル等の実在定番ブランド名）でのみ狙う**こと。汎用KW（「キャンプ 防寒着」等）では記事化が困難。
- 採用候補に**カイロ（使い捨てカイロ）・ふるさと納税返礼品・特定1ショップの独占商品**が混入するKWは、用途がぶれる／供給が偏るため脱落しやすい。事前に products.tsv で混入を確認する（例: camp-socks＝カイロ混入、camp-griddle＝ZEOOR独占＋ふるさと納税混入で脱落）。

#### ブランド占有ルールの緩和（ブランド軸記事・寡占商材）

- 通常は「1記事に同一ブランド3製品以上の重複を避ける」が原則（[商品選定ルール](#商品選定ルール)）。
- ただし**ブランド軸記事（例: VASTLANDのテント）**と**特定ブランドが寡占する商材（例: スキレット＝キャプテンスタッグ）**は、ブランド深掘りが記事の主旨のため、この**ブランド占有ルールを緩和してよい**（同一ブランドを3点以上採用可）。
- ブランド軸記事では、本体ラインナップを主役にし、付属品・関連アイテム（グランドシート等）は「あると便利な関連アイテム」として本体と区別して紹介する（本体N選のように見せない）。

---

## 隣接ASP収益化（CalloutCta ／ 日次3本ルール・2026-07-29〜）

物販（Amazon/楽天）に加え、単価の高いキャンプ隣接ASPを収益化に導入している。管理台帳は `_file/asp-programs.tsv`（案件名／ASP／プログラムID／料率／提携状況／アフィリリンク／挿入先カテゴリ／備考／**最終確認日**）。

- **CTA部品**: サービス系案件（レンタル・ふるさと納税・体験予約）の成約導線は `components/article/CalloutCta.tsx` を使う。MDXでは `<CalloutCtaMdx variant="rental|furusato|leisure" title=… body=… linkText=… href=… note=… />`。物販の `ProductCardMdx` とは別建て。外部リンクは `rel="sponsored nofollow"` 固定・PR表記（note）必須。ボタンは原色オレンジ＋白文字。
- **提携状況は実確認してから使う（台帳の記載を鵜呑みにしない・ASP記事に着手する前の必須フロー）**: `asp-programs.tsv` の『提携状況』列は手動更新のスナップショットで、A8側で承認が進んでも古いままになり得る。ASP記事を作る前に必ず次を回す。
  1. **審査中は使わない**（従来どおり）。リンクを貼らない・記事化しない。
  2. **昇格（審査中→提携済）の判断は実確認必須**。A8.net にログイン済みの Chrome セッションがあれば『参加プログラム／提携管理』ページで現況を読み取り、`提携状況` と `最終確認日` を更新してから使う（**新規ログイン＝認証情報の入力はしない**。ログイン済みセッションが無い自律実行では、審査中案件を勝手に提携済へ昇格させない）。
  3. **提携済でも `最終確認日` が空 or 60日超なら「未再確認」扱い**。実確認できる回に現況を見て `最終確認日`（YYYY-MM-DD）を更新する。実確認できない自律回は、実績のある確実な提携済案件（hinataレンタル／hinataストア／やまどうぐレンタル屋／BLUETTI）に限定してリンクを挿入し、それ以外は使用を保留する。
  4. **報告での表現**: 提携状況に触れるときは「実確認済（YYYY-MM-DD）」か「台帳ベース（最終確認: … ／未確認）」かを必ず明示し、未確認を承認済みのように断定しない。
- **承認され次第**: 審査中案件（例: さとふる・アソビュー・ふるさとチョイス）は、上記フローで提携済を実確認できた時点で `href` を発行し `最終確認日` を記録してから、該当variant（furusato/leisure）で記事に差し込む。
- **日次タスク（campkit-new-article-draft）は平日3件**: 既定は商品5選2本＋隣接ASP専用1本。ただし後述の既存記事修正キューに pending があれば、それを最優先で当日1件消化し、その分だけ新規商品記事を1本減らす（例: 既存修正1＋商品5選1＋ASP1）。ASP記事はサービス構造（`content/posts/camp-gear-rental.mdx` が手本）。ASP用KWは `_file/keyword-backlog.tsv` に `source=asp` でタグ。カニバリしない承認済み角度が無い日は商品記事に振り替えて『ASP在庫補充が必要』と報告（品質優先の安全弁）。
- **第一弾**: `content/posts/camp-gear-rental.mdx`（hinataレンタル／申込8%）。詳細は `docs/monetization-asp-expansion.md`。

---

## 既存記事の修正キュー（article-fix-backlog ／ 2026-08-12〜）

価格チェック等で見つかる「価格更新では済まない案件（廃番・掲載ページ404・同URLで別商品に差し替わり・型番差し替えが要る等）」を、提案で埋もれさせず自動で次の作業に乗せるためのキュー。台帳は `_file/article-fix-backlog.tsv`（列: status／priority／target_slug／position(第N位＋商品名)／issue_type(discontinued_404｜product_swap｜price_unconfirmed 等)／detail／rakuten_url／source／added_date／notes）。

- **積む側（detector）**: `campkit-price-check`（水）が、確定できず提案に回す案件を pending 行で自動追記する（同一 target_slug＋position の重複は追記せず最新化）。他の実装タスクも同様に積んでよい。
- **消化する側（executor）**: `campkit-new-article-draft`（平日日次）が、新規作成より前に pending 最上位1件を手順Fで差し替え実行し、当日3枠の1つに充てる（＝新規商品記事を1本減らす）。差し替え商品は楽天API/Amazonの実在・レビュー実績データで選び直し、KW整合性（価格帯・用途）を満たすこと。
- **例外の範囲**: 手順Fは「既存記事は上書きしない」原則の明示的な例外。ただし触ってよいのは【対象の該当ProductCard＋その商品に紐づく比較表行・まとめ表行・description中の該当価格/商品名】のみ。記事の他の商品・構成・アフィリリンク・thumbnailは変更しない。適切な代替が無い/構成の作り直しが要る重い案件は status=needs-human にして notes に論点を残し、当日枠は新規に振り替える（品質優先）。
- **記録**: 差し替えを実行したら `docs/seo-change-log.md` に「対象記事・旧→新・理由(issue_type)」を追記し、backlog 行を status=done（notes に日付）にする。

---

## 安全ルール

- **既存記事ファイルには触らない**（誤って上書きしないこと）
- 一括 `sed` や正規表現の一括書き換えは禁止。ファイルごとに確認
- カテゴリ追加時は4ファイルすべての更新を忘れずに
- コミット前に `npm run build` でビルドエラーがないことを確認

---

## デプロイ手順

```bash
# ビルド確認
npm run build

# コミット
git add <変更ファイル>
git commit -m "コミットメッセージ"

# push → Vercel が自動デプロイ
git push origin main
```

`main` ブランチに push するだけで Vercel が自動的にビルド・デプロイを実行する。
Vercel のダッシュボードでデプロイログを確認できる。

### ⚠️ Claude Code へのデプロイ受け渡しルール（確認プロンプト削減／2026-08-12）

Cowork の穴埋め等を Claude Code に渡してデプロイする際、**Claude Code 側で独自の検証bashを生成しないこと**。`git diff`＋`grep`／`awk`／`for`ループ／`exec`／`$(...)` を含む照合ワンライナーは、command-substitution を含むため許可リストでも毎回「Do you want to proceed?」が出て手間になる（`Bash(*)` 許可や bypass でも `exec`/`$()` は確認対象）。

- **実行して良いのは `node scripts/deploy.cjs "<メッセージ>"` の1コマンドのみ。** build → commit → push → 本番検証は deploy.cjs が内部で実施する。
- ASIN数の照合・記事内重複チェック・書式検証などの**独自ワンライナーは組み立てない／実行しない**（deploy.cjs の検証に一任）。
- どうしても事前確認が要る場合でも `git diff --numstat content/posts/`（削除列が0か）程度の単純コマンドに留め、`$(...)`・`exec`・ループは使わない。
- Cowork 側がデプロイ受け渡しを報告する際は、この方針（「deploy.cjs 単体実行・検証bash不要」）を受け渡し文に明記する。

---

## ファイル配置（ハイブリッド構成 / 2026-06-01 整理）

「作業ファイルはローカルSSD、参照資料・成果物はGoogleドライブ」のハイブリッド構成で管理。

| 区分 | 場所 | 内容 |
|------|------|------|
| (a) 作業ファイル | `C:\claude-workspace\projects\camp-kit-guide\`（ここ） | コード一式（pages / components / lib / styles / types / scripts）、設定、`.git` |
| (b) 参照資料 | `G:\マイドライブ\_claude\_reference\camp-kit-guide\` | `content\`・`design\`・`_file\` の控え |
| (c) 成果物 | `G:\マイドライブ\_claude\deliverables\camp-kit-guide\` | `docs\`（skill-extraction / handover / test-log / operation-snapshot、`visual\` 画像） |
| (d) 一時/再生成可能 | ローカルのまま（コピーしない） | `node_modules\`、`.next\` |

### ⚠️ ビルド必須データ（ローカルにも実体を置く）

次の2つは `next build` / メンテスクリプトが参照するため、**ローカルworkspace側に実体が必要**。
Driveの `_reference` 側はバックアップ控え。**編集はローカル側を正とする**。

| パス | 参照元 | 役割 |
|------|--------|------|
| `content\posts\*.mdx` | `pages/index・ranking・category/[slug]・posts/[slug]・404` が `path.join(process.cwd(),"content/posts")` で読込 | 記事ソース（SSG） |
| `_file\products.tsv` | `scripts/update_products.cjs` | 商品データ更新スクリプトの入力 |

- `design\`（モックアップPNG）は `.gitignore` 対象でコードからの参照なし → **Driveのみ**でOK。
- `node_modules` はこのフォルダに無い。初回は `npm install`（実績: 207 packages / build成功）。
- `CUserstanoucamp-kit-guidedocs`（壊れたパス由来の空フォルダ）は移行せず
  `C:\claude-workspace\_archive\camp-kit-guide-broken\` に隔離済み（中身は空）。

### 整理後のビルド確認（2026-06-01）
`npm install` → `npm run build` ともに成功（exit 0）。全SSGページのプリレンダリングと
`next-sitemap` 生成まで通過することを確認済み。

---

## 次回TODO

> ⚠️ 6/23の第1回SEO効果測定は実施済み（表示2.1倍・クリック3.2倍に立ち上がり）。新規量産を止め、既存22記事のテコ入れ（差別化リライト）フェーズに移行済み。詳細は `docs/seo-change-log.md` 冒頭の2026-06-23セクション。

- **7/7 SEOレポート定期測定**: GASメニュー「📊 SEOレポート」を実行し、6/23比較で効果測定する。最大の観測点は、6/23の差別化リライト（グループA=逆算型／グループB=判断軸の体系化型）で順位の動き方に差が出るか。
- **差別化リライトの横展開**: 7/7で動いた型を同グループの残り記事へ展開。実施済み4本＝backpack-capacity／tent-size（グループA）、dutch-oven／solo-tent-overall（グループB）。グループB残：two-room-tent-guide（被リンク7本・要データ不整合修正）／stylish-camp-tent／camp-chair-highback／nanga-sleeping-bag 他。グループA残：現在なし（旧「グループA残」に挙げていた寝袋温度系は下記の統合で解消済み）。
- **寝袋カニバ整理（2026-07-24 完了）**: 温度・季節・3シーズンで票が分散していた3記事を `sleeping-bag-temperature-guide`（「寝袋（シュラフ）の選び方 完全ガイド」）へ統合済み。統合元の `camp-sleeping-bag-temperature-guide` / `sleeping-bag-season-guide` / `sleeping-bag-temp-guide` は削除し、`next.config.ts` の `redirects()` でハブへ恒久リダイレクト（Next.jsの `permanent: true` は 308 を返す＝301と同等にシグナル統合される）。**この3スラッグは新規記事に再利用しないこと**（リダイレクト元として予約済み）。反映後1〜2週間でGSCの対象クエリ順位を再測定する。
- **Cowork Amazonリンク化フローの継続展開**: `_file/amazon-link-worksheet.tsv` の残り約480商品を、三者分業（Coworkログアウト検索 → まーくんが `amzn.to` 発行 → Claude Code が ProductCard に `amazonUrl` 設置）でバッチ展開する（累計143商品設置済み＝手動12＋Cowork82＋バッチ2の49）。流入のある記事から優先。同一商品の型番違いは楽天商品ID／バッジで区別する。
