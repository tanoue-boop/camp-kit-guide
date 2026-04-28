---
name: affiliate-uiux
description: UI/UX patterns for affiliate sites - article page layouts (sticky sidebar 2-col on desktop, single col on mobile), ProductCard with rank badge and dual CTAs, ComparisonTable with sticky first column and scroll hint, dual TOC system (sidebar + inline), responsive breakpoints tuned for Japanese market, design tokens (Noto Sans JP + Jost recommended), mobile-first patterns, and trust signals (verified data badges, review counts, ranking medals). Use this skill aggressively whenever building, designing, or revising any UI for affiliate site components or pages; whenever creating new article layouts, product display blocks, comparison tables, navigation, or any conversion-related interface; whenever the design feels generic or AI-default and needs to follow established affiliate site patterns. Trigger even when the user does not explicitly say "UI" or "design" - any component or page work on affiliate properties (camp-kit-guide, japan-travel-kit, future sites) should consult this skill.
---

# Affiliate UI/UX Skill

このスキルは、アフィリエイトサイトの **コンバージョン重視 UI/UX パターン** を提供する。

このプロジェクト内で立ち上がる全アフィリサイトに共通して適用する。サイト固有のブランドカラー・フォント上書き・カスタムキー（比較表の項目名等）は各サイトの `CLAUDE.md` で定義し、このスキルが土台となる。

---

## 起動すべき場面

以下の作業を行う前に、**必ず**このスキルを参照すること。

- 新規ページ・コンポーネントの設計や実装
- 既存ページの UI 改善・コンバージョン最適化
- 商品表示ブロック（ProductCard 等）の追加・修正
- 比較表・ランキング表示の作成
- レスポンシブ対応・モバイル最適化
- デザインシステムの調整（カラー・タイポグラフィ・スペーシング）
- 「このページの UX を改善したい」といった漠然とした依頼

ユーザーが明示的に "UI" と言わなくても、上記に該当するなら起動する。

---

## 中核原則（5つ）

### 1. 記事ページは 2 カラム + sticky サイドバー（デスクトップ）

長文記事では、本文の左に **sticky なサイドバー TOC** を置くことで読者が常に現在地と全体構造を把握できる。サイドバーには TOC・人気記事・カテゴリ一覧を配置。モバイルでは 1 カラムに崩し、TOC はインラインに変換。

### 2. ProductCard はランクバッジ + 商品情報 + デュアル CTA

紹介商品ブロックの標準構造：

- **ランクバッジ**（1〜3 位は金/銀/銅）
- **商品画像**（200×200px、object-fit: cover、lazy loading）
- **商品名・説明・価格・レビュー** をまとめた情報エリア
- **2 列の CTA ボタン**（Amazon 橙 / 楽天 赤、または該当プラットフォームのブランドカラー）

### 3. ComparisonTable は sticky 第 1 列 + スクロールヒント

比較表は横スクロールが発生しやすい。第 1 列（商品名）を sticky にし、スクロール中も商品名が見えるようにする。表の上に「← スクロールできます →」ヒント表示。第 1 行（最高位商品）は薄い色でハイライト、偶数行はゼブラパターンで可読性を上げる。

### 4. 2 系統の TOC（サイドバー + インライン）

- **サイドバー TOC**：sticky で常時表示、IntersectionObserver でアクティブ見出しを追跡
- **記事内インライン TOC**：本文最上部に展開可能な目次

両方を併設する理由：モバイルではサイドバーが消えるため、記事内 TOC が必要。デスクトップでも記事冒頭で全体構造を見たい層がいる。

### 5. ブレークポイント：日本市場向けデフォルト

- **960px**：サイドバーが本文下部に移動（2 カラム → 1 カラム）
- **600px**：商品カードの画像が横並びから縦積みに、関連記事グリッドが 1 列に
- **480px**：アイキャッチ画像の高さを縮小

タブレット〜スマホ間の境界として 600px は重要。日本のスマホは 360〜400px 幅が主流なので、480px 以下での最終調整も忘れない。

---

## 標準レイアウト（記事ページ）

```
┌─────────────────────────────────────┐
│   Header（グローバルナビ）            │
├─────────────────────────────────────┤
│   アイキャッチ画像（高さ 360px）       │
├─────────────────────────────────────┤
│   ┌──────────────┐  ┌──────────┐  │
│   │ パンくずリスト   │  │ サイドバー │  │
│   │ H1 + メタ情報   │  │ - TOC    │  │
│   │ インライン TOC  │  │ - 人気記事 │  │
│   │                │  │ - カテゴリ │  │
│   │ 本文           │  │ - 最新記事 │  │
│   │ ProductCard×N │  │  (sticky) │  │
│   │ ComparisonTable│  └──────────┘  │
│   │ Tips           │                │
│   │ FAQ            │                │
│   │ まとめ          │                │
│   └──────────────┘                │
├─────────────────────────────────────┤
│   関連記事グリッド（3列）              │
├─────────────────────────────────────┤
│   Footer                            │
└─────────────────────────────────────┘
```

実装：

```css
.layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  max-width: 1160px;
  margin: 0 auto;
}

.sidebarWrap {
  position: sticky;
  top: 80px;
  align-self: start;
}

@media (max-width: 960px) {
  .layout { grid-template-columns: 1fr; }
  .sidebarWrap { position: static; }
}
```

詳細は `references/layouts.md`。

---

## 標準コンポーネント

| コンポーネント | 役割 | reference |
|---|---|---|
| ProductCard | 商品紹介ブロック | `references/components.md` |
| ComparisonTable | スペック横断比較 | `references/components.md` |
| TableOfContents（サイドバー） | sticky 目次 | `references/components.md` |
| InlineTOC | 記事内展開可能目次 | `references/components.md` |
| Sidebar | 人気/カテゴリ/最新 | `references/components.md` |
| RecommendedPosts | 関連記事 3 件 | `references/components.md` |

---

## デザイントークン

### 推奨フォント（日本語サイト向け）

- **本文・日本語見出し**：Noto Sans JP（400, 500, 700, 800, 900）
- **英数字・装飾**：Jost（400, 500, 700）
- 読み込みは `next/font/google` で `display: swap` + サブセット最適化

### カラーパレット（役割名）

各サイトのブランドに合わせて値を上書き。役割名は共通化：

```css
:root {
  --color-bg-base:    /* 背景：基本は白 */;
  --color-text:       /* 本文テキスト：濃いグレー */;
  --color-text-sub:   /* サブテキスト：中間グレー */;
  --color-accent:     /* アクセント：サイトのメインカラー */;
  --color-footer-bg:  /* フッター背景：通常 accent と同じか暗め */;
  --color-card-bg:    /* カード背景：薄いグレー */;
}
```

### スペーシング・タイポ

- ベースフォントサイズ：16px
- 行間：1.7（日本語の可読性重視）
- アンチエイリアス：`-webkit-font-smoothing: antialiased`
- スムーススクロール：`scroll-behavior: smooth`

詳細は `references/design-tokens.md`。

---

## モバイル最適化の重点

日本市場ではトラフィックの 60〜80% がモバイル。モバイル UX が SEO とコンバージョンに直結する。

- **タップターゲット最小 44×44px**（Apple HIG / WCAG 推奨）
- **横スクロール表は工夫**（sticky 第 1 列 + スクロールヒント）
- **fixed ヘッダ時は `scroll-margin-top` でアンカー補正**
- **画像は `loading="lazy" decoding="async"` + width/height 明示**

詳細は `references/mobile-first.md`。

---

## 信頼シグナルの可視化

アフィリ記事は **「広告ではなく信頼できる情報」と感じさせる** 設計が重要。

- 楽天・Amazon のロゴと連動した CTA カラー（ユーザーが慣れた配色）
- レビュー数を **件数として明示**（「★4.5（3,200件）」）
- ランキング 1〜3 位の金/銀/銅バッジ
- 比較表での視覚的強調（最高位ハイライト）
- 「実データ」「最新価格」等のバッジ（更新日と組み合わせて）

詳細は `references/trust-signals.md`。

---

## reference ファイルへの分岐

| 作業 | 読むファイル |
|---|---|
| コンポーネント新規作成・修正 | `references/components.md` |
| ページレイアウト設計 | `references/layouts.md` |
| カラー・フォント・余白の調整 | `references/design-tokens.md` |
| モバイル対応・レスポンシブ | `references/mobile-first.md` |
| 信頼性訴求 UI の追加 | `references/trust-signals.md` |

---

## サイト固有設定の参照

このスキルは原則と汎用パターンのみを定義する。以下の項目は各サイトの `CLAUDE.md` を参照すること：

- ブランドカラー（具体値）
- フォント選定（Noto Sans JP + Jost を採用するかの可否）
- ロゴ・OG 画像
- カテゴリアイコン
- 比較表の商材固有カスタムキー（例：camp なら「刃長」「重量」、travel なら「Wi-Fi速度」「データ容量」）
- CTA 先のアフィリエイトプラットフォーム（楽天・Amazon・Booking 等）
- 商品ブロックの特殊バリエーション
