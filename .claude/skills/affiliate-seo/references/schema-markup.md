# JSON-LD スキーマ実装テンプレート

`affiliate-seo` スキルの一部。構造化データを実装・修正する際に参照する。

---

## 3 層構成のおさらい

```
グローバル層（_app.tsx 等で全ページ共通）
├─ WebSite
└─ Organization

ページ層（記事ページ）
└─ BlogPosting

ブロック層（商品紹介ブロック）
└─ Product
   └─ AggregateRating（reviewCount > 0 の場合のみ）

その他随時：BreadcrumbList、FAQPage
```

---

## JsonLd コンポーネント（共通）

```tsx
// components/seo/JsonLd.tsx
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

`dangerouslySetInnerHTML` を使うため、`data` 内に外部入力をそのまま入れない（XSS 対策）。

---

## WebSite スキーマ（全ページ共通）

```tsx
const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "{サイト名}",
  url: "https://{サイトドメイン}",
  // 検索ボックス連携を入れる場合：
  potentialAction: {
    "@type": "SearchAction",
    target: "https://{サイトドメイン}/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};
```

`_app.tsx` の `<Head>` 内に注入。

---

## Organization スキーマ（全ページ共通）

```tsx
const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "{運営会社名}",
  url: "https://{サイトドメイン}",
  logo: {
    "@type": "ImageObject",
    url: "https://{サイトドメイン}/logo.png",
  },
  // 必要に応じて：
  sameAs: [
    "https://twitter.com/{account}",
    "https://www.instagram.com/{account}",
  ],
};
```

---

## BlogPosting スキーマ（記事ページ）

```tsx
const blogPostingSchema = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline:    frontmatter.title,
  description: frontmatter.description,
  image:       frontmatter.thumbnail || `${BASE_URL}/og-default.png`,
  datePublished: frontmatter.date,
  dateModified:  frontmatter.updatedAt || frontmatter.date,
  author: {
    "@type": "Organization",  // または Person（著者を出す場合）
    name: "{サイト名 or 著者名}",
  },
  publisher: {
    "@type": "Organization",
    name: "{サイト名}",
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/logo.png`,
    },
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": `${BASE_URL}/posts/${slug}`,
  },
};
```

ポイント：

- `headline` は 110 字以内が推奨（Google）
- `image` は記事のサムネイル。なければサイト共通の OG 画像で代用
- `dateModified` は更新日。記事を改修したら必ず更新する（鮮度シグナル）
- 著者を Person で出す場合、別途 `Person` スキーマも必要

---

## Product + AggregateRating スキーマ（商品ブロック）

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
    priceCurrency: "JPY",  // サイトターゲット国の通貨
    availability: "https://schema.org/InStock",
    url:          product.affiliateUrl,
  },
};

// reviewCount > 0 のときのみ aggregateRating を付与する
if (product.reviewCount > 0) {
  productSchema.aggregateRating = {
    "@type": "AggregateRating",
    ratingValue: product.rating,
    reviewCount: product.reviewCount,
  };
}
```

### 重要原則：reviewCount > 0 のときのみ AggregateRating

- ダミーデータや 0 件のレビューを構造化データに入れると **Google ペナルティの対象**
- 楽天 API・Amazon API で実数を取得できない場合は AggregateRating を **付与しない**
- 「実数を取れない場合は付けない」がデフォルト判断

---

## BreadcrumbList スキーマ

```tsx
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "ホーム",
      item: `${BASE_URL}/`,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: categoryName,
      item: `${BASE_URL}/category/${categorySlug}`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: articleTitle,
      item: `${BASE_URL}/posts/${slug}`,
      // 末尾アイテムは item を省略しても可
    },
  ],
};
```

---

## FAQPage スキーマ（よくある質問セクション）

```tsx
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};
```

注意点：

- FAQ セクションが本文中に存在する場合のみ付与
- 質問文と回答が記事本文と一致していること（不一致は違反）
- 商品紹介や CTA を回答に含めない

---

## 多言語サイト（japan-travel-kit など）の hreflang

英語サイトや多言語展開する場合、`<link>` タグで hreflang を指定：

```html
<link rel="alternate" hreflang="en" href="https://en.example.com/page" />
<link rel="alternate" hreflang="ja" href="https://example.com/page" />
<link rel="alternate" hreflang="x-default" href="https://example.com/page" />
```

JSON-LD ではなく `<link>` で表現するが、構造化データの一部として把握しておく。

---

## バリデーション

実装後は必ず以下でバリデーション：

- [Google リッチリザルトテスト](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)

特に **Product スキーマで AggregateRating を付与した場合は必ず確認**。reviewCount や ratingValue の不整合は警告対象。

---

## サイト固有設定

各サイトの `CLAUDE.md` で以下を定義：

- `BASE_URL`、`SITE_NAME`、運営会社名
- ロゴ URL、デフォルト OG 画像 URL
- `priceCurrency`（JPY / USD など、ターゲット市場による）
- 著者を Organization にするか Person にするか
- SNS アカウント URL（`sameAs`）
