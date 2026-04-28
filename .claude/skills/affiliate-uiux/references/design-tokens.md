# デザイントークン

`affiliate-uiux` スキルの一部。フォント・カラー・余白などのデザイン基本要素。

---

## フォント

### 推奨：日本語サイト向け

- **本文・日本語見出し**：Noto Sans JP
- **英数字・装飾**：Jost

理由：

- Noto Sans JP は Google が日本語向けに最適化しており可読性が高い
- Jost は幾何学的でモダンな英文フォント、Noto Sans JP との相性が良い
- 両方とも Google Fonts で配信されており、`next/font/google` で最適化込みで使える

### Next.js での実装

```tsx
import { Noto_Sans_JP, Jost } from "next/font/google";

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

// _app.tsx 等で
<main className={`${notoSansJp.variable} ${jost.variable}`}>
  ...
</main>
```

### CSS 変数として参照

```css
:root {
  --font-jp: var(--font-noto-sans-jp), "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif;
  --font-en: var(--font-jost), -apple-system, BlinkMacSystemFont, sans-serif;
}

body {
  font-family: var(--font-jp);
}

/* 英文部分（数値、英語タイトル等） */
.title-en {
  font-family: var(--font-en);
}
```

### フォントサイズ

```
本文：       16px (1rem)
H1（記事）:  2.0〜2.5rem
H2:         1.5〜1.75rem
H3:         1.25rem
小見出し:    1.1rem
キャプション:0.875rem
```

### 行間（line-height）

- 本文：1.7（日本語の可読性重視）
- 見出し：1.3（密度を高めて見出しらしく）

### 重要：日本語サイトを採用しない場合

英語のみのサイト（japan-travel-kit のような外国人向け）では別フォント構成を検討：

- 本文：Inter / IBM Plex Sans 等の英文向け
- 装飾：Playfair / Lora 等のセリフ系（旅行・ライフスタイル感）

各サイトの `CLAUDE.md` でフォント選定を明示する。

---

## カラーパレット

### 役割名（共通）

すべてのサイトで以下の役割名を CSS 変数として定義する。具体値はサイトごとに上書き：

```css
:root {
  --color-bg-base:    /* ページ背景 */;
  --color-text:       /* 本文テキスト */;
  --color-text-sub:   /* サブテキスト・キャプション */;
  --color-accent:     /* メインブランドカラー */;
  --color-accent-light: /* アクセント明度違い */;
  --color-footer-bg:  /* フッター背景 */;
  --color-card-bg:    /* カード・セクション背景 */;
  --color-border:     /* 境界線 */;
  --color-success:    /* チェックマーク・成功 */;
  --color-warning:    /* 注意・推し */;
}
```

### 推奨パレット例

汎用的に使えるパレット例（サイトごとに調整）：

```css
:root {
  --color-bg-base:      #FFFFFF;
  --color-text:         #2A2A2A;
  --color-text-sub:     #666666;
  --color-accent:       /* サイトのメインカラー */;
  --color-footer-bg:    /* accent と同色 or 暗め */;
  --color-card-bg:      #F5F5F5;
  --color-border:       #E5E7EB;
  --color-success:      #16A34A; /* 緑 */
  --color-warning:      #F59E0B; /* オレンジ */
}
```

### CTA カラー（プラットフォーム連動）

各アフィリエイトプラットフォームのブランドカラーをそのまま使う：

```css
.cta-amazon  { background: #FF9900; color: #FFFFFF; }
.cta-rakuten { background: #BF0000; color: #FFFFFF; }
.cta-yahoo   { background: #FF0033; color: #FFFFFF; }
.cta-booking { background: #003580; color: #FFFFFF; }
.cta-agoda   { background: #FF6B00; color: #FFFFFF; }
```

ユーザーが慣れた配色を使うことで「公式と連動している」感を出し、クリック率を上げる。

### コントラスト

WCAG AA 準拠：

- 通常テキスト：コントラスト比 4.5:1 以上
- 大見出しテキスト：3:1 以上

ブランドカラーが薄い場合、文字色を黒寄りにするか、CTA は別色にする。

---

## ブレークポイント（日本市場向けデフォルト）

```css
/* 大きい順から狭くしていく方式 */
@media (max-width: 1200px) { /* 大画面 PC */ }
@media (max-width: 960px)  { /* タブレット / 小型ノート */ }
@media (max-width: 600px)  { /* スマホ横〜タブレット縦 */ }
@media (max-width: 480px)  { /* スマホ縦 */ }
```

### 各ブレークポイントでの主な変化

| 幅 | 変化 |
|---|---|
| 1200px ↓ | コンテンツ幅を絞る |
| **960px ↓** | サイドバーが本文下部に移動（2カラム→1カラム）、関連記事 3列→3列維持または2列 |
| **600px ↓** | ProductCard 画像が横→縦積み、関連記事グリッド 1列、ナビがハンバーガー |
| **480px ↓** | アイキャッチ高さ縮小、CTA ボタン文字サイズ調整 |

### ブレークポイントの扱い

- まずスマホ（モバイルファースト）で設計してもよいし、PC ベースで `max-width` メディアクエリを書いていってもよい
- camp-kit-guide は `max-width` 方式（PC ベース）。シンプルで保守しやすい
- 重要なのは値の一貫性。プロジェクト全体で同じ値を使う

---

## スペーシング

### スペーシングスケール

```
0.25rem (4px)
0.5rem  (8px)
0.75rem (12px)
1rem    (16px)
1.5rem  (24px)
2rem    (32px)
3rem    (48px)
4rem    (64px)
```

CSS 変数で定義しても良い：

```css
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
}
```

### 角丸

```
小:  6px  （バッジ・小さなタグ）
中:  8〜10px （ボタン）
大:  12px （カード）
円:  9999px （アバター・ピル型）
```

### シャドウ

控えめに、層を表現する目的で：

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
```

---

## ベーススタイル

```css
html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-jp);
  color: var(--color-text);
  background: var(--color-bg-base);
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 900;
  color: var(--color-accent);
  line-height: 1.3;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

a {
  color: inherit;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
```

---

## 見出しの装飾パターン

H2 / H3 は記事内で繰り返し登場するので、視覚的な強弱とリズムが大事。

### H2：背景 + 左ボーダー（強）

```css
.h2 {
  background: var(--color-accent-bg);  /* 薄いアクセント色 */
  border-left: 4px solid var(--color-success);
  padding: 0.6rem 1rem;
  margin: 2rem 0 1rem;
}
```

### H3：左ボーダーのみ（中）

```css
.h3 {
  border-left: 3px solid var(--color-success);
  padding-left: 0.75rem;
  margin: 1.5rem 0 0.75rem;
}
```

### H4 以下：装飾なし、フォントウェイトのみ

過度な装飾は避け、本文との差を控えめに。

---

## サイト固有設定

各サイトの `CLAUDE.md` で以下を定義：

- ブランドカラーの具体値
- フォント選定（Noto Sans JP+Jost を使うか別フォントか）
- 角丸の標準値（角張ったブランドなら 0、丸い印象なら 12px+）
- 影の使用度合い
- 見出しの装飾色（success カラーの代わりに別色を使う等）
