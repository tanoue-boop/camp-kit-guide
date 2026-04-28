# モバイルファースト設計

`affiliate-uiux` スキルの一部。日本市場向けアフィリ記事のモバイル UX 最適化。

---

## なぜモバイル優先か

- 日本市場ではアフィリ記事の **トラフィックの 60〜80% がモバイル**
- 商品リサーチは「移動中・ベッド・ソファ」等のモバイル文脈が多い
- Google は **モバイルファーストインデックス** を採用：モバイル版がランキング評価対象
- 購買検討の比較もモバイル → 購入もモバイル直接、というシナリオが増加中

---

## タップターゲット

### 最小サイズ：44×44px

Apple HIG と WCAG が推奨する最小値。これより小さい要素は誤タップを誘発する。

- ボタン
- リンク（特にナビゲーション）
- アイコンボタン（メニュー・閉じる・SNS シェア等）
- フォームの送信ボタン

### 隣接要素の間隔

タップターゲット間に **最低 8px** の隙間を確保。リスト形式のリンクは行間 16px 以上が望ましい。

### CTA ボタンの大きさ

CTA は最も重要なタップ要素。最小値ギリギリではなく、十分大きく：

```css
.cta-button {
  min-height: 48px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 700;
}
```

---

## 横スクロールの扱い

### ❌ ページ全体の横スクロール（基本的に NG）

ページが横にもスクロールできるのは UX を損なう。`overflow-x: hidden` で防ぐか、レスポンシブ設計で発生させない。

### ⭕ 特定要素の横スクロール（許容、要工夫）

比較表など、どうしても横長になる要素は **その要素内だけで横スクロール**。

実装：

```css
.tableWrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
```

スクロール可能であることを明示：

```html
<p class="scrollHint">← スクロールできます →</p>
<div class="tableWrap">
  <table>...</table>
</div>
```

第 1 列を sticky にして、商品名を常に見せる：

```css
.table th:first-child,
.table td:first-child {
  position: sticky;
  left: 0;
  background: var(--color-bg-base);
  z-index: 1;
}
```

---

## 固定ヘッダとアンカーリンクの干渉

ヘッダーが `position: sticky` で常時表示されている場合、アンカーリンクで遷移すると **目的の見出しがヘッダの裏に隠れる**。

### 解決策：scroll-margin-top

各見出し要素に `scroll-margin-top` を設定：

```css
h2, h3 {
  scroll-margin-top: 90px;  /* ヘッダ高さ + 余白 */
}
```

または商品ブロック等のアンカー先：

```tsx
<div id={id} style={{ scrollMarginTop: "90px" }}>
  <ProductCard ... />
</div>
```

ヘッダ高さが変動する場合は CSS 変数で管理：

```css
:root { --header-height: 80px; }
h2, h3 { scroll-margin-top: calc(var(--header-height) + 16px); }
```

---

## 画像最適化

### 必須属性

```html
<img
  src="..."
  alt="..."
  width="200"
  height="200"
  loading="lazy"
  decoding="async"
/>
```

- **`loading="lazy"`**：画面外の画像を遅延読み込み
- **`decoding="async"`**：デコードを別スレッドで実行
- **`width` / `height` 明示**：レイアウトシフト（CLS）防止

### Next.js なら `next/image`

```tsx
import Image from "next/image";

<Image
  src="/path/to/image.jpg"
  alt="商品画像"
  width={200}
  height={200}
  loading="lazy"
/>
```

`next/image` は自動で WebP 変換・最適サイズ配信を行う。ただし外部画像（楽天画像等）の場合は `next.config.js` で許可ドメイン設定が必要。

### アイキャッチ

- モバイルではアスペクト比を変える（16:9 → 4:3 等）こともあり
- 高さ：480px 以下では 240px 程度に縮小

---

## ハンバーガーメニュー

### 実装ポイント

- 閉じるボタン（×）を見える位置に
- メニュー外側タップでも閉じる
- スクロールロック（背面のスクロール防止）：`body { overflow: hidden; }`
- 開閉アニメーション（slide-in 等）

### アクセシビリティ

```html
<button
  aria-label="メニューを開く"
  aria-expanded="false"
  onClick={...}
>
  <svg>...</svg>
</button>
```

開いたら `aria-expanded="true"` に切り替える。

---

## フォーム入力

### モバイル特有の最適化

```html
<!-- メールアドレス：自動的にメール用キーボード -->
<input type="email" inputmode="email" />

<!-- 数値：数字キーボード -->
<input type="text" inputmode="numeric" />

<!-- 電話番号：電話キーボード -->
<input type="tel" inputmode="tel" />

<!-- URL：URL用キーボード -->
<input type="url" inputmode="url" />
```

`inputmode` 属性でキーボード種別を制御。

### iOS のズームを防ぐ

input の `font-size` が 16px 未満だと、iOS Safari は自動でズームインする。**必ず 16px 以上**にする：

```css
input, textarea {
  font-size: 16px;
}
```

---

## モバイル時のサイドバー

### 戦略

デスクトップ：右側 sticky サイドバー
モバイル：本文下部に縦並び（または非表示）

```css
.sidebarWrap {
  position: sticky;
  top: 80px;
}

@media (max-width: 960px) {
  .sidebarWrap {
    position: static;  /* sticky 解除 */
    margin-top: 3rem;  /* 本文との間に余白 */
  }
}
```

### サイドバー TOC は非表示にして、インライン TOC を機能させる

```css
@media (max-width: 960px) {
  .sidebarToc { display: none; }
}
```

記事冒頭のインライン TOC が代わりにナビゲーション機能を担う。

---

## モバイル時の ProductCard

### 縦積みレイアウト（600px 以下）

```css
@media (max-width: 600px) {
  .productCard .inner {
    flex-direction: column;
  }
  .productCard .imageWrap {
    width: 100%;
    height: auto;
  }
  .productCard .image {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
}
```

### CTA ボタン

2 列のままでも良いし、各ボタンを大きく見せたい場合は 1 列縦並びに：

```css
@media (max-width: 480px) {
  .productCard .buttons {
    grid-template-columns: 1fr;  /* 1 列に */
  }
}
```

---

## 関連記事グリッド

```css
.relatedGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 960px) {
  .relatedGrid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 600px) {
  .relatedGrid { grid-template-columns: 1fr; }
}
```

---

## モバイル UX チェックリスト

実装後に以下を確認：

- [ ] タップターゲットがすべて 44×44px 以上
- [ ] 隣接タップ要素間に十分な余白（8px+）
- [ ] フォーム input が 16px 以上で iOS ズームを起こさない
- [ ] ハンバーガーメニューが正しく開閉、× ボタンが見える
- [ ] 横スクロールが特定要素以外で発生しない
- [ ] スクロール可能な表に「← スクロールできます →」ヒント
- [ ] アンカーリンクで遷移したとき固定ヘッダに隠れない
- [ ] 画像に `loading="lazy"` `decoding="async"` width/height
- [ ] サイドバーが 960px 以下で本文下に移動 or 非表示
- [ ] ProductCard が 600px 以下で縦積み
- [ ] CTA ボタンが押しやすいサイズ（最小高 48px）
- [ ] アイキャッチが 480px 以下で適切に縮小
- [ ] フォントサイズが小さすぎない（本文 16px、注釈でも 14px 以上）

---

## サイト固有設定

各サイトの `CLAUDE.md` で以下を定義：

- 固定ヘッダの高さ（`scroll-margin-top` 値の根拠）
- ブレークポイント値（960/600/480 を使うか別の値か）
- ハンバーガーメニューの動作詳細（slide-in 方向等）
- モバイル固有の機能（クリックトゥコール等）
