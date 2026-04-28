---
name: affiliate-seo
description: SEO best practices for affiliate sites - article structure templates (intro→criteria→top-N→comparison→tips→FAQ→summary), title and meta patterns, frontmatter design, JSON-LD structured data (WebSite/Organization/BlogPosting/Product), internal linking via product anchors, E-E-A-T for affiliate content, and pre-publication checklists. Use this skill aggressively whenever drafting, editing, planning, or reviewing articles on affiliate sites; whenever working on titles, meta descriptions, schema markup, frontmatter, or keyword integration; whenever auditing existing articles for SEO quality; or whenever a task touches article-level content quality on an affiliate property. Trigger even when the user does not explicitly say "SEO" - any new article work or article quality review on affiliate sites should consult this skill.
---

# Affiliate SEO Skill

このスキルは、アフィリエイトサイト運営における **記事レベルの SEO 品質** を担保するための原則・テンプレート・チェックリストを提供する。

このプロジェクト内で立ち上がる全アフィリサイト（camp-kit-guide、japan-travel-kit、今後立ち上げる新サイト）に共通して適用する。サイト固有の数値・カテゴリ・ブランド名などは各サイトの `CLAUDE.md` に記述し、このスキルが土台となる。

---

## 起動すべき場面

以下の作業を行う前に、**必ず**このスキルを参照すること。

- 新規記事の執筆計画・ドラフト作成・公開前レビュー
- タイトル・description・frontmatter の設計や見直し
- 既存記事の SEO 品質監査
- 構造化データ（JSON-LD）の追加・修正
- 内部リンク戦略の検討
- KW（キーワード）整合性チェック
- 「この記事の SEO は大丈夫か」「品質は十分か」といった漠然とした確認依頼

ユーザーが明示的に "SEO" と言わなくても、上記に該当するなら起動する。

---

## 中核原則（5つ）

### 1. 商品データの真正性

AI の学習知識に依存して商品情報（価格・レビュー数・評価）を作らない。**実在する人気ブランドの定番モデルのみ**を扱い、価格・レビュー数は外部 API（楽天・Amazon）または手動確認による実データで補完する。架空の商品・水増しレビュー数は禁止。

### 2. KW と商品リストの整合性

検索キーワードが暗示する **予算帯** と **レベル感**（初心者/コスパ/ハイエンド）に対し、紹介する商品リスト全体が整合していること。同一記事内の商品多様性も確保する（同一ブランドへの偏りを避ける）。具体数値（価格レンジの幅・ブランド重複の上限件数）はサイトの `CLAUDE.md` に定義する。詳細は `references/kw-integrity.md`。

### 3. 構造化データの正直さ

JSON-LD の `aggregateRating` は **`reviewCount > 0` のときのみ付与する**。レビュー数 0 の商品にダミー評価を埋めて構造化データに混入させない。Google ガイドライン違反になり、ペナルティリスクがある。

### 4. 標準テンプレートの遵守

物販ランキング型アフィリ記事は「はじめに → 選び方 N 点 → おすすめ N 選 → 比較表 → Tips → FAQ → まとめ」の構造を基本とする。商材によって項目数や順序の微調整は可だが、骨子は崩さない（読者の検索意図に対する応答パターンとして実証されている形式）。

### 5. 内部回遊の設計

記事内の商品紹介ブロックには一意の `id` を付与し、記事末尾のまとめ表からアンカーリンクで戻れるようにする。これにより読者の滞在時間と回遊深度が向上し、コンバージョンも上がる。

---

## 記事構成テンプレート

```
1. はじめに（〜200字）
   なぜこの商材が必要か / 検索意図に対する即答

2. 選び方の N ポイント（通常 4 点、商材により 3〜6）
   - 商材ドメインに固有の判断軸を H3 で構造化
   - 各ポイントは「何を見るか」「どう判断するか」を明示

3. おすすめ N 選（通常 5 点、最低 3 点）
   - 各商品を H3 「第 N 位：商品名」で紹介
   - 商品紹介ブロック（ProductCard 等）を埋め込み
   - 商品説明文 100〜150 字
   - スペック段落（**主なスペック：** 形式の太字構造）

4. N 製品スペック比較表
   - ComparisonTable 等のコンポーネントで横断比較
   - 商材固有のキーで並べる（重量・サイズ・価格・評価など）

5. お手入れ・使い方 Tips（4〜5 項目）
   - **太字：** 形式で要点を抽出

6. よくある質問（5 問）
   - **Q. ...** / A. ... 形式
   - FAQPage スキーマの対象になる

7. まとめ：用途別おすすめ表
   - markdown table 形式
   - 各行から商品ブロックへアンカーリンク
```

---

## frontmatter 設計

```yaml
---
title: "記事タイトル【YYYY年版】"
description: "120〜150 字以内のSEO説明文"
date: "YYYY-MM-DD"
category: "カテゴリslug"
tags: ["主要KW", "副KW", "サイト共通タグ", "YYYY年"]
thumbnail: ""  # 空文字 OK（プレースホルダー表示あり）
---
```

ルール：

- `title`：60 字程度を上限。【YYYY年版】等の年号は鮮度シグナルとして有効
- `description`：120〜150 字。冒頭にメインKWを含める
- `date`：実際の作成日。**未来日付は禁止**（公開前チェックの必須項目）
- `tags`：3〜5 個。記事の主要 KW + サイト共通タグ
- `thumbnail`：実在する画像URL または空文字

詳細なタイトル雛形は `references/title-meta-patterns.md`。

---

## JSON-LD 構造化データの 3 層構成

```
グローバル層（_app.tsx 等で全ページ共通注入）
├─ WebSite       サイト全体のメタ情報
└─ Organization  運営主体

ページ層（記事ページで個別注入）
└─ BlogPosting   記事本体

ブロック層（コンポーネント内で個別注入）
└─ Product       商品紹介ブロックごと
   └─ AggregateRating（reviewCount > 0 の場合のみ）
```

加えて、対象に応じて以下も：

- `BreadcrumbList`：パンくずリスト
- `FAQPage`：よくある質問セクション

各スキーマの実装テンプレートは `references/schema-markup.md`。

---

## 内部リンク戦略

3 つの軸で設計する：

1. **記事内アンカー**：商品ブロックの `id` ↔ まとめ表の `[商品名](#id)` リンク
2. **カテゴリ内回遊**：同カテゴリの関連記事を 3 件程度自動表示
3. **カテゴリ↔記事**：パンくずでカテゴリページに戻れる導線

具体パターンは `references/internal-linking.md`。

---

## E-E-A-T 対応

アフィリ記事は YMYL に近い領域（健康・金銭判断に影響する商品も含む）。Google の E-E-A-T を意識した対応：

- **Experience**：商品の実使用シーンを描写。一般論で終わらせない
- **Expertise**：専門用語の正確な使用、商材ドメインの知識
- **Authoritativeness**：出典明示、メーカー公式情報の参照、運営者情報
- **Trustworthiness**：実データ（実価格・実レビュー数）、更新日明示、PR 表記

詳細は `references/eeat-affiliate.md`。

---

## 公開前チェックリスト

記事公開前に **すべて** を確認する。1 つでも未充足なら公開しない。

- [ ] **frontmatter 完備**：title / description / date / category / tags
- [ ] **description 120〜150 字**
- [ ] **date が今日以前**（未来日付になっていない）
- [ ] **title に主要 KW が含まれている**（先頭〜30 字以内が望ましい）
- [ ] **見出し階層が論理的**：H2 → H3 の構造、H1 重複なし
- [ ] **商品が N 件**（テンプレートに従う）
- [ ] **同一ブランドの偏りなし**（多様性確保。具体上限はサイトの CLAUDE.md 参照）
- [ ] **商品 ID が記事内一意**、まとめ表のアンカーと一致
- [ ] **商品データが実在する**（実ブランド・実モデル）
- [ ] **`aggregateRating` は `reviewCount > 0` のときのみ**
- [ ] **比較表のキーが商材ドメインに整合**
- [ ] **KW 整合性**：予算帯・レベル感が商品リストと整合（数値はサイトの CLAUDE.md）
- [ ] **画像が `loading="lazy" decoding="async"`**、width/height 明示
- [ ] **canonical / OGP / Twitter Card のメタタグ完備**
- [ ] **アフィリエイトリンクの `nofollow sponsored`**（プラットフォーム要件に応じて）
- [ ] **PR 表記または広告表記**（景品表示法・ステマ規制対応）
- [ ] **ビルドエラーなし**（Next.js なら `npm run build` 通過）

---

## reference ファイルへの分岐

このスキルが起動した後、**作業内容に応じて** 以下を読み込む：

| 作業 | 読むファイル |
|---|---|
| タイトル・description を考える | `references/title-meta-patterns.md` |
| JSON-LD を実装・修正する | `references/schema-markup.md` |
| 内部リンク・回遊設計を見直す | `references/internal-linking.md` |
| E-E-A-T を高める施策を考える | `references/eeat-affiliate.md` |
| KW と商品リストの整合性をチェック | `references/kw-integrity.md` |

すべてを毎回読む必要はない。SKILL.md（このファイル）の原則と公開前チェックリストで対応できる場面が大半。

---

## サイト固有設定の参照

このスキルは原則のみを定義する。以下の項目は各サイトの `CLAUDE.md` を参照すること：

- サイト名・URL・運営会社名
- カテゴリ slug 定義
- KW 整合性の具体数値（価格レンジ幅、ブランド重複上限）
- メインカラー・ブランド要素
- 商材ドメイン固有の用語・選び方フレーム
- 記事作成ワークフロー（Google Drive のドキュメント等）
