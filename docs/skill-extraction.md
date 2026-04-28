# CampKit Guide — 汎用スキル抽出ドキュメント

> このドキュメントは camp-kit-guide プロジェクトの実装知識を Claude.ai 別セッションへ引き継ぐためのもの。
> SEO・UI/UX スキルの汎用化に使用する。

---

## 目次

1. [プロジェクトルール（CLAUDE.md全文）](#1-プロジェクトルール)
2. [コンポーネント実装](#2-コンポーネント実装)
3. [デザインシステム](#3-デザインシステム)
4. [SEO実装](#4-seo実装)
5. [実記事の構造サンプル](#5-実記事の構造サンプル)

---

## 1. プロジェクトルール

### サイト概要

| 項目 | 内容 |
|------|------|
| サイト名 | CampKit Guide |
| URL | https://www.camp-kit-guide.com |
| フレームワーク | Next.js 16 (Pages Router) |
| 言語 | TypeScript |
| スタイル | CSS Modules（ページ・コンポーネントごとに `.module.css`） |
| 記事形式 | MDX（`next-mdx-remote` v6 でレンダリング） |
| DBアクセス | Supabase（閲覧数カウント） |
| サイトマップ | `next-sitemap`（ビルド後に自動生成） |
| デプロイ先 | Vercel（`main` ブランチへの push で自動デプロイ） |

### ファイル構成

```
camp-kit-guide/
├── content/posts/        # MDX記事ファイル（1記事=1ファイル）
├── pages/
│   ├── index.tsx         # トップページ
│   ├── ranking.tsx       # ランキングページ
│   ├── category/[slug].tsx
│   ├── posts/[slug].tsx  # 記事詳細（MDXレンダリング）
│   └── _app.tsx / _document.tsx
├── components/
│   ├── layout/           # Header, Footer, Layout
│   ├── common/           # Seo, Breadcrumb
│   ├── article/          # ProductCard, ComparisonTable, TOC, Sidebar等
│   └── top/              # CategoryGrid, RankingWidget
├── styles/               # globals.css + 各ページの .module.css
├── types/                # post.ts, category.ts, product.ts
└── lib/                  # gtag.ts, amazon.ts, rakuten.ts, supabase.ts
```

### カテゴリ定義（4ファイルに分散）

カテゴリを追加・変更する場合は以下の4ファイルすべてを更新する。

| ファイル | 配列名 |
|---------|--------|
| `pages/category/[slug].tsx` | `allCategories` |
| `pages/index.tsx` | `baseCategories`（icon フィールドあり） |
| `components/layout/Header.tsx` | `CATEGORIES`（href, label, icon） |
| `pages/posts/[slug].tsx` | `ALL_CATEGORIES`（サイドバー・パンくず用） |

現在のカテゴリ一覧：

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

### frontmatter フォーマット

```yaml
---
title: "記事タイトル【2026年版】"
description: "150字以内のSEO説明文"
date: "YYYY-MM-DD"
category: "カテゴリslug"
tags: ["タグ1", "タグ2", "キャンプ", "2026年"]
thumbnail: ""
---
```

- `date` は実際の作成日（未来日付は禁止）
- `thumbnail` は空文字でOK（プレースホルダー表示あり）
- `description` は120〜150字を目標に

### 記事構成テンプレート

1. **はじめに**（〜200字）：なぜこの商品が必要か
2. **選び方の4ポイント**：`### ポイントN：` で記述
3. **おすすめ5選**：`### 第N位：商品名` で各製品を紹介
4. **5製品スペック比較表**：`<ComparisonTableMdx>` を使用
5. **お手入れ・使い方Tips**（4〜5項目、`**太字：**` 形式）
6. **よくある質問**（5問、`**Q. ...** ` / `A. ...` 形式）
7. **まとめ**：用途別おすすめ表（markdownテーブル）

### ProductCardMdx の使い方

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
  source="rakuten"
  badge="バッジテキスト（任意）"
  image="https://..."
/>
```

- `price` は数値を文字列で渡す（`"19800"`）
- `affiliateUrl` は実際のアフィリエイトURLまたは `"#"`
- `id` はページ内アンカーリンクに使う（まとめ表のリンク先）
- `source` は `"amazon"` | `"rakuten"` | `"other"`
- MDX v3 は JSX 式プロパティ（`{value}`）をサイレントにドロップするため、すべて文字列リテラルで渡す

### ComparisonTableMdx の使い方

```mdx
<ComparisonTableMdx
  columns='[{"key":"name","label":"商品名"},{"key":"カスタムキー","label":"表示ラベル"}]'
  rows='[{"id":"product-id","name":"商品名","カスタムキー":"値"}]'
/>
```

- `columns` と `rows` は**シングルクォートで囲んだJSON文字列**
- `name` キーは必須（第1列に表示）
- `price` / `rating` / `source` キーは特殊レンダリングあり。価格を文字列で表示したい場合は `"価格"` などの別キーを使う

### 商品選定ルール

- **実在する人気ブランドの定番モデルのみ**（架空の商品禁止）
- 1記事に同一ブランドが3製品以上重複しないようにする
- 価格・レビュー数は執筆時点の参考値でOK（仮データ可）
- `affiliateUrl` は現時点では `"#"` でOK（後から差し替え）

### KW整合性ルール

- 初心者KW：全5商品を想定予算の±50%以内に収める
- コスパKW：全商品が平均価格以下
- ハイエンドKW：全商品がミドル〜ハイエンド
- 5商品の最高価格÷最低価格が5倍を超えないこと

### 安全ルール

- **既存記事ファイルには触らない**（誤って上書きしないこと）
- 一括 `sed` や正規表現の一括書き換えは禁止
- コミット前に `npm run build` でビルドエラーがないことを確認
- カテゴリ追加時は4ファイルすべての更新を忘れずに

---

## 2. コンポーネント実装

### 2-1. ProductCard

**ファイル:** `components/article/ProductCard.tsx`

```tsx
import type { Product } from "../../types/product";
import JsonLd from "../seo/JsonLd";
import styles from "./ProductCard.module.css";
import { buildRakutenSearchUrl } from "@/lib/rakuten";
import { buildAmazonUrl, buildAmazonSearchUrl } from "@/lib/amazon";

// source="amazon" かつ affiliateUrl が "#" 以外 → buildAmazonUrl(affiliateUrl)
// source="other" → Google検索URL
// それ以外 → buildAmazonSearchUrl(name) でフォールバック
function getAmazonUrl(product: Product): string { ... }
function getRakutenUrl(product: Product): string { ... }

export default function ProductCard({ product, rank }) {
  // Product JSON-LD schema（aggregateRating は rakutenReviewCount > 0 の場合のみ付与）
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: product.image,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "JPY",
      availability: "https://schema.org/InStock",
      url: rakutenUrl,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: rakutenRating,
      reviewCount: rakutenReviewCount,
    },
  };

  return (
    <>
      <JsonLd data={productSchema} />
      <div className={styles.card}>
        {/* ランクバッジ（1〜3位のみ金/銀/銅グラデーション） */}
        {rankInfo && <span className={`${styles.rankBadge} ${rankInfo.className}`}>{rankInfo.label}</span>}

        <div className={styles.inner}>
          {/* 左: 商品画像 200×200px、画像なしはプレースホルダーSVG */}
          <div className={styles.imageWrap}>
            <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
          </div>

          {/* 右: 商品名・説明・価格・レビュー */}
          <div className={styles.info}>
            {product.badge && <span className={styles.badge}>{product.badge}</span>}
            <p className={styles.name}>{product.name}</p>
            <p className={styles.description}>{product.description}</p>
            <div className={styles.metaBottom}>
              <span className={styles.price}>¥{product.price.toLocaleString()}</span>
              {/* Amazon・楽天のレーティング行（それぞれ独立して表示） */}
            </div>
          </div>
        </div>

        {/* CTAボタン: Amazon（#ff9900）・楽天（#bf0000）の2列グリッド */}
        <div className={styles.buttons}>
          <a href={amazonUrl} className={`${styles.btn} ${styles.amazon}`}>amazon で購入する</a>
          <a href={rakutenUrl} className={`${styles.btn} ${styles.rakuten}`}>Rakuten で購入する</a>
        </div>
      </div>
    </>
  );
}
```

**MDXラッパー（pages/posts/[slug].tsx 内）:**

```tsx
function ProductCardMdx({
  rank, id, name, description, price, rating, reviewCount,
  amazonRating, amazonReviewCount, rakutenRating, rakutenReviewCount,
  affiliateUrl, source, badge, image,
}: { rank?: string; id?: string; name: string; ... }) {
  return (
    <div id={id} style={{ scrollMarginTop: "90px" }}>
      <ProductCard
        rank={rank ? Number(rank) : undefined}
        product={{
          id: id ?? name, name, description,
          price: Number(price),
          ...(amazonRating ? { amazonRating: Number(amazonRating) } : {}),
          // 他の数値フィールドも同様に Number() でキャスト
          affiliateUrl, source, badge,
          ...(image ? { image } : {}),
        }}
      />
    </div>
  );
}
```

### 2-2. ComparisonTable

**ファイル:** `components/article/ComparisonTable.tsx`

```tsx
// 特殊レンダリングキー:
// "price" → ¥{Number(val).toLocaleString()} で表示
// "rating" → ★ {Number(val).toFixed(1)} で表示
// "source" → affiliateUrl へのリンク（"Amazon" | "楽天"）
// ○/✓/◎/yes/true/✔ → チェックマーク SVG で表示

// 第1列は sticky（横スクロール時に固定）
// ← スクロールできます → のヒント表示あり
// 第1行（最高位商品）はハイライト色あり
// 偶数行は薄いグレー背景

export default function ComparisonTable({ products = [], columns = defaultColumns }) {
  return (
    <div className={styles.outer}>
      <p className={styles.scrollHint}>← スクロールできます →</p>
      <div className={styles.wrap}>
        <table className={styles.table}>
          <thead>...</thead>
          <tbody>
            {products.map((product, rowIndex) => {
              const isFirst = rowIndex === 0;
              const isEven = rowIndex % 2 === 0 && !isFirst;
              // 第1列: sticky + 行状態に応じた背景色
              // 第1行: styles.rowFirst（ハイライト）
              // 偶数行: styles.rowEven（薄グレー）
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**MDXラッパー:**

```tsx
function ComparisonTableMdx({ rows, columns }: { rows: string; columns?: string }) {
  const products = JSON.parse(rows);
  const cols = columns ? JSON.parse(columns) : undefined;
  return <ComparisonTable products={products} columns={cols} />;
}
```

### 2-3. TableOfContents (サイドバーTOC)

**ファイル:** `components/article/TableOfContents.tsx`

- IntersectionObserver でアクティブ見出しを追跡
- `rootMargin: "-80px 0% -65% 0%"` — スクロール位置の検出範囲を調整
- H2・H3 を階層表示（H3 はインデント）
- クリックでスムーススクロール
- 960px 以下でサイドバーごと非表示（記事本文下に移動）

### 2-4. InlineTOC (記事本文内TOC)

**ファイル:** `components/article/InlineTOC.tsx`

- 記事本文の最上部に配置（`<MDXRemote>` 直前）
- H2 アイテムに連番数字（1, 2, 3...）
- H3 はインデント表示
- 「目次を表示/非表示」トグルボタン付き

### 2-5. Sidebar

**ファイル:** `components/article/Sidebar.tsx`

- 人気記事 TOP5（閲覧数+星アイコン）
- カテゴリ一覧（アイコン+名前+記事数）
- 最新記事（最大5件）

### 2-6. RecommendedPosts

**ファイル:** `components/article/RecommendedPosts.tsx`

- 同カテゴリの関連記事を最大3件表示
- カテゴリバッジ・タイトル・説明文・日付
- 記事詳細ページの article 要素直下に配置

### 2-7. 記事ページ全体構造 (pages/posts/[slug].tsx)

```tsx
// heading ID 生成（TOCアンカー用）
function makeHeadingId(text: string): string {
  return text.trim().toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9぀-龯一-鿿-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "heading";
}

// 正規表現で MDX から H2・H3 を抽出
function extractHeadings(content: string): Heading[] {
  const regex = /^(#{2,3})\s+(.+)$/gm;
  // ...
}

// MDX カスタムコンポーネントマップ
const mdxComponents = {
  ProductCard,
  ComparisonTable,
  ArticleImage,
  ProductCardMdx,   // MDXファイルから直接使えるラッパー
  ComparisonTableMdx,
  h2: H2,           // ID付き h2（TOCリンク先）
  h3: H3,           // ID付き h3
};

// レイアウト:
// <eyecatch> → <div.layout>
//   <main> Breadcrumb → header(h1+meta) → article(InlineTOC+MDX) → ShareButtons → RelatedPosts → PostNavigation
//   <div.sidebarWrap> Sidebar (sticky top:80px, 300px幅)
```

**getStaticProps の関連記事ロジック:**

```tsx
const relatedPosts = allPosts
  .filter((p) => p.slug !== slug && p.category === data.category)
  .slice(0, 3);
```

---

## 3. デザインシステム

### CSS 変数 (styles/globals.css)

```css
:root {
  --color-bg-base:    #FFFFFF;
  --color-text:       #2A2A2A;
  --color-text-sub:   #666666;
  --color-accent:     #2A4A3A;    /* 深緑：サイトのメインカラー */
  --color-footer-bg:  #2A4A3A;
  --color-card-bg:    #F5F5F5;
  --font-jp: var(--font-noto-sans-jp), "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif;
  --font-en: var(--font-jost), -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### フォント (_app.tsx)

```tsx
// next/font/google でサブセット最適化 + display:swap
const notoSansJp = Noto_Sans_JP({
  weight: ["400", "500", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

const jost = Jost({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

// body: font-family = var(--font-jp)
// 英語見出し等: var(--font-en)
```

### ベーススタイル

```css
html  { font-size: 16px; scroll-behavior: smooth; }
body  { line-height: 1.7; -webkit-font-smoothing: antialiased; }
h1-h6 { font-weight: 900; color: var(--color-accent); line-height: 1.3; }
img   { max-width: 100%; height: auto; display: block; }
a     { color: inherit; text-decoration: none; }
```

### レスポンシブ ブレークポイント

| px | 変化内容 |
|----|---------|
| **960px** | サイドバーが記事下部へ移動（layout: 2カラム → 1カラム）、関連記事グリッドは維持 |
| **600px** | ProductCard の画像が横→縦積みに変更、関連記事グリッド 3列→1列 |
| **480px** | アイキャッチ画像の高さが縮小（360px → 240px 程度） |

### 記事ページ固有スタイル (pages/posts/post.module.css)

```css
/* 2カラムレイアウト */
.layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  max-width: 1160px;
  margin: 0 auto;
}

/* サイドバー */
.sidebarWrap {
  position: sticky;
  top: 80px;
  align-self: start;
}

/* アイキャッチ */
.eyecatch { height: 360px; }
.eyecatchImg { width: 100%; height: 100%; object-fit: cover; }
.eyecatchGradient { /* 画像なし時のグラデーションフォールバック */ background: linear-gradient(...); }

/* H2: 緑の左ボーダー + 薄緑背景 */
.h2 {
  background: #f0fdf4;
  border-left: 4px solid #16a34a;
  padding: 0.6rem 1rem;
}

/* H3: 緑の左ボーダーのみ */
.h3 { border-left: 3px solid #16a34a; padding-left: 0.75rem; }

/* 記事内テーブル */
.body table th { background: #16a34a; color: #fff; }

/* 関連記事グリッド */
.relatedGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 960px) {
  .layout { grid-template-columns: 1fr; }
  .sidebarWrap { position: static; }
}
@media (max-width: 600px) {
  .relatedGrid { grid-template-columns: 1fr; }
  .eyecatch { height: 240px; }
}
```

### ProductCard スタイル (ProductCard.module.css)

```css
.card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  margin: 1.5rem 0;
}

/* ランクバッジ: 絶対配置 top-left */
.rank1 { background: linear-gradient(135deg, #f59e0b, #d97706); }  /* 金 */
.rank2 { background: linear-gradient(135deg, #94a3b8, #64748b); }  /* 銀 */
.rank3 { background: linear-gradient(135deg, #d97706, #92400e); }  /* 銅 */

/* 画像: 200×200px、object-fit: cover */
.imageWrap { flex-shrink: 0; width: 200px; }
.image { width: 200px; height: 200px; object-fit: cover; }

/* バッジ（badge prop）: #fef3c7 背景、#92400e テキスト */
.badge { background: #fef3c7; color: #92400e; border-radius: 6px; }

/* 価格: font-size 1.15rem; font-weight 800; color #1a3c34 */
.price { font-size: 1.15rem; font-weight: 800; color: #1a3c34; }

/* CTAボタン: 2列グリッド */
.buttons { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #e5e7eb; }
.amazon  { background: #ff9900 !important; }
.rakuten { background: #bf0000 !important; }

/* モバイル（600px以下）: 画像→縦積み */
@media (max-width: 600px) {
  .inner { flex-direction: column; }
  .imageWrap { width: 100%; }
  .image, .imagePlaceholder { width: 100%; height: 200px; }
}
```

---

## 4. SEO実装

### 4-1. Seo コンポーネント

**ファイル:** `components/common/Seo.tsx`

```tsx
const SITE_NAME = "CampKit Guide";
const BASE_URL  = "https://www.camp-kit-guide.com";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-default.png`;

export default function Seo({
  title, description, canonical, ogImage,
  ogType = "website", publishedTime, modifiedTime, noindex = false,
}) {
  const fullTitle   = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* OGP */}
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:type"        content={ogType} />          {/* "website" | "article" */}
      <meta property="og:url"         content={canonicalUrl} />
      <meta property="og:image"       content={ogImage || DEFAULT_OG_IMAGE} />

      {/* 記事の場合のみ */}
      {ogType === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {ogType === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {noindex && <meta name="robots" content="noindex,follow" />}

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={ogImage || DEFAULT_OG_IMAGE} />
    </Head>
  );
}
```

### 4-2. JsonLd コンポーネント

**ファイル:** `components/seo/JsonLd.tsx`

```tsx
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

### 4-3. グローバル JSON-LD スキーマ (_app.tsx)

全ページ共通で WebSite + Organization を出力:

```tsx
const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CampKit Guide",
  url: "https://www.camp-kit-guide.com",
};

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "株式会社mjo-style",
  url: "https://www.camp-kit-guide.com",
  logo: {
    "@type": "ImageObject",
    url: "https://www.camp-kit-guide.com/logo.png",
  },
};

// _app.tsx の <Head> 内に注入
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }} />
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }} />
```

### 4-4. 記事ページ JSON-LD スキーマ

**ファイル:** `pages/posts/[slug].tsx` — BlogPosting スキーマ:

```tsx
const blogPostingSchema = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline:    frontmatter.title,
  description: frontmatter.description,
  image:       frontmatter.thumbnail || `${BASE_URL}/og-default.png`,
  datePublished: datePublished,          // frontmatter.date
  dateModified:  dateModified,           // frontmatter.updatedAt || frontmatter.date
  author: {
    "@type": "Organization",
    name: "CampKit Guide",
  },
  publisher: {
    "@type": "Organization",
    name: "CampKit Guide",
    logo: { "@type": "ImageObject", url: `${BASE_URL}/logo.png` },
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": `${BASE_URL}/posts/${slug}`,
  },
};
```

**ProductCard JSON-LD スキーマ（components/article/ProductCard.tsx）:**

```tsx
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name:        product.name,
  description: product.description || product.name,
  image:       product.image,
  offers: {
    "@type": "Offer",
    price:        product.price,
    priceCurrency: "JPY",
    availability: "https://schema.org/InStock",
    url: rakutenUrl,
  },
  // rakutenReviewCount > 0 の場合のみ付与
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue:  rakutenRating,
    reviewCount:  rakutenReviewCount,
  },
};
```

### 4-5. サイトマップ・robots.txt

**ファイル:** `next-sitemap.config.js`

```js
module.exports = {
  siteUrl: "https://www.camp-kit-guide.com",
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [{ userAgent: "*", allow: "/" }],
  },
};
```

- `npm run build` 後に自動で `/sitemap.xml` と `/robots.txt` を生成
- `next-sitemap` は全 `getStaticPaths` ページを自動収集

### 4-6. アフィリエイトリンク形式

**Rakuten（楽天）:**

```
https://hb.afl.rakuten.co.jp/hgc/{shop-id}.{hash}/?pc={encoded-item-url}&m={encoded-mobile-url}&rafcid={tracking-id}
```

**Amazon（楽天経由フォールバックあり）:**

```tsx
// lib/amazon.ts
export function buildAmazonUrl(url: string): string { ... }
export function buildAmazonSearchUrl(name: string): string {
  return `https://www.amazon.co.jp/s?k=${encodeURIComponent(name)}&tag={associate-id}`;
}

// lib/rakuten.ts
export function buildRakutenSearchUrl(name: string): string {
  return `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(name)}/`;
}
```

### 4-7. アナリティクス

**ファイル:** `lib/gtag.ts`

```tsx
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;
export const pageview = (url: string) => { window.gtag("config", GA_TRACKING_ID, { page_path: url }); };
```

`_app.tsx` で `router.events.on("routeChangeComplete", handleRouteChange)` で SPA ページ遷移を追跡。

---

## 5. 実記事の構造サンプル

以下の2記事から、見出し階層・コンポーネント配置・CTA位置・まとめ表形式を示す。

---

### サンプル1: camp-knife-beginner.mdx（ナイフ初心者向け）

**frontmatter:**

```yaml
---
title: "キャンプ用ナイフおすすめ5選【2026年版】初心者でも安心の選び方"
description: "キャンプ用ナイフを初めて選ぶ方向けに、刃の素材・刃長・収納方式・安全性の4点で選び方を解説。..."
date: "2026-04-20"
category: "cookware"
tags: ["ナイフ", "キャンプ", "ブッシュクラフト", "焚き火", "2026年"]
thumbnail: ""
---
```

**見出し階層（H1〜H3）:**

```
H1: [frontmatter.title — ページ header で出力]
H2: はじめに：キャンプナイフ選びで失敗しないために
  （本文200字前後）
H2: キャンプナイフの選び方：失敗しない4つのポイント
  H3: ポイント1：刃の素材（ステンレスvsカーボン）
  H3: ポイント2：ロック機構の種類
  H3: ポイント3：刃長（ブレード長）
  H3: ポイント4：重量とハンドルの素材
H2: おすすめキャンプ用ナイフ5選【2026年最新】
  H3: 第1位：モーラナイフ コンパニオン
    <ProductCardMdx rank="1" id="mora-companion" ... />
    （商品説明文 100〜150字）
    （スペック段落: **主なスペック：** 刃長 ／ 重量 ／ 素材 ／ タイプ）
    ---
  H3: 第2位：オピネル No.8
    <ProductCardMdx rank="2" id="opinel-no8" ... />
    ...
    ---
  （〜第5位まで同様）
H2: 5製品スペック比較表
  <ComparisonTableMdx columns='...' rows='...' />
H2: ナイフのお手入れと安全な保管方法
  **使用後の清掃：** テキスト
  **乾燥：** テキスト
  **刃の研ぎ方：** テキスト
  **保管：** テキスト
H2: よくある質問
  **Q. 飛行機でナイフを持ち込めますか？**
  A. ...
  **Q. キャンプ場でナイフを使うのに法的な制限はありますか？**
  A. ...
  （〜5問）
H2: まとめ：目的に合わせたナイフ選びで快適なキャンプを
  （リード文1〜2文）
  | 優先したいこと | おすすめモデル | 価格帯 |
  |---|---|---|
  | コスパ重視の入門ナイフ | [モーラナイフ コンパニオン](#mora-companion) | 約2,750円 |
  | デザイン・料理用途 | [オピネル No.8](#opinel-no8) | 約2,200円 |
  （〜5行）
  （締め文1〜2文）
```

**ProductCardMdx の実記述例:**

```mdx
<ProductCardMdx
  rank="1"
  id="mora-companion"
  name="アウトドア用品 キャンピング折込包丁 ステンレス製 刃渡り11.5cm..."
  description="スウェーデン生まれのコスパ最強フィクストブレードナイフ。キャンプ初心者から上級者まで幅広く支持される定番モデル。"
  price="2330"
  rakutenRating="0"
  rakutenReviewCount="0"
  affiliateUrl="https://hb.afl.rakuten.co.jp/hgc/..."
  source="rakuten"
  badge="コスパ最強・初心者No.1"
  image="https://thumbnail.image.rakuten.co.jp/@0_mall/..."
/>
```

**ComparisonTableMdx の実記述例:**

```mdx
<ComparisonTableMdx
  columns='[{"key":"name","label":"商品名"},{"key":"刃長","label":"刃長"},{"key":"重量","label":"重量"},{"key":"価格","label":"価格"},{"key":"刃の素材","label":"刃の素材"},{"key":"ロック機構","label":"ロック機構"}]'
  rows='[
    {"id":"mora-companion","name":"モーラナイフ コンパニオン","刃長":"104mm","重量":"85g","価格":"¥2,750","刃の素材":"ステンレス鋼","ロック機構":"フィクストブレード"},
    {"id":"opinel-no8","name":"オピネル No.8","刃長":"85mm","重量":"67g","価格":"¥2,200","刃の素材":"カーボン/ステンレス","ロック機構":"ロータリーロック"},
    ...
  ]'
/>
```

**まとめ表のアンカーリンク形式（商品IDに一致）:**

```md
| 優先したいこと | おすすめモデル | 価格帯 |
|---|---|---|
| コスパ重視の入門ナイフ | [モーラナイフ コンパニオン](#mora-companion) | 約2,750円 |
```

---

### サンプル2: family-camp-lantern.mdx（ファミリーキャンプ用ランタン）

**frontmatter:**

```yaml
---
title: "ファミリーキャンプ用ランタンおすすめ5選【2026年版】家族みんなで快適な夜を"
description: "ファミリーキャンプに最適なランタンを5製品厳選。明るさ・電源・防水・デザインの4ポイントで比較。LEDと燃料式のメリット・デメリット、子どもと使う安全な選び方を解説。"
date: "2026-04-24"
category: "lighting"
tags: ["ランタン", "ファミリーキャンプ", "キャンプ照明", "LED", "キャンプ", "2026年"]
thumbnail: "https://thumbnail.image.rakuten.co.jp/@0_mall/..."
---
```

**見出し階層（同一パターン）:**

```
H2: はじめに：ファミリーキャンプでランタン選びが大切な理由
H2: ファミリーキャンプ用ランタンの選び方：4つのポイント
  H3: ポイント1：明るさ（ルーメン数）の目安
  H3: ポイント2：電源の種類（LED電池式・USB充電式・燃料式）
  H3: ポイント3：防水性と耐久性
  H3: ポイント4：サイズと携帯性
H2: ファミリーキャンプ用ランタンおすすめ5選【2026年最新】
  H3: 第1位：コールマン クワッドマルチパネルランタン
    <ProductCardMdx rank="1" id="coleman-quad" ... />
    （商品説明文）
    ---
  （〜第5位まで）
H2: 5製品スペック比較表
  <ComparisonTableMdx columns='...' rows='...' />
H2: ランタンのお手入れと使い方のコツ
H2: よくある質問
H2: まとめ：家族のキャンプスタイルに合ったランタンを
```

**thumbnail の扱い:**

- 楽天の商品画像URLをそのまま `thumbnail` に指定する
- 例: `"https://thumbnail.image.rakuten.co.jp/@0_mall/{shop}/{cabinet}/{filename}.jpg"`
- アイキャッチとして記事詳細ページの最上部に全幅表示される（360px height）
- OGP `og:image` にも自動で使用される

---

## 付録: MDX 記事作成チェックリスト

記事作成時の確認事項:

- [ ] frontmatter: title/description/date/category/tags/thumbnail を記載
- [ ] description は 120〜150 字
- [ ] date は未来日付でない（今日以前）
- [ ] thumbnail は実在する楽天商品画像URL または空文字
- [ ] 商品は5件、同一ブランドの重複は最大2件まで
- [ ] ProductCardMdx: id が記事内で一意（まとめ表のアンカーと一致）
- [ ] ProductCardMdx: すべての数値フィールドが文字列リテラル
- [ ] ComparisonTableMdx: JSON は シングルクォートで囲む
- [ ] ComparisonTableMdx: price/rating/source キーを使う場合は特殊レンダリングに注意
- [ ] まとめ表: アンカーリンク `[商品名](#product-id)` が ProductCardMdx の id と一致
- [ ] `npm run build` でビルドエラーなし
