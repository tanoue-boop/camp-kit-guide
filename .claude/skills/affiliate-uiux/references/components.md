# コンポーネント設計詳細

`affiliate-uiux` スキルの一部。標準コンポーネントの実装パターンと意図。

---

## ProductCard（商品紹介ブロック）

### 役割

記事内で個別商品を紹介する最重要ブロック。読者の購買意欲が最も高まる地点なので、UX とコンバージョンの両立が必要。

### 構造

```
┌────────────────────────────────────┐
│ [ランクバッジ]                       │
│ ┌──────┐  ┌─────────────────────┐ │
│ │画像   │  │ [推しバッジ任意]      │ │
│ │200×  │  │ 商品名                │ │
│ │ 200  │  │ 商品説明（30〜50字）   │ │
│ │      │  │ ¥価格                │ │
│ └──────┘  │ ★ Amazon評価（件数）  │ │
│           │ ★ Rakuten評価（件数） │ │
│           └─────────────────────┘ │
├────────────────────────────────────┤
│ [Amazon CTA]    [Rakuten CTA]      │
└────────────────────────────────────┘
```

### 仕様

- **角丸**：12px、薄いボーダー（`#e5e7eb`）
- **マージン**：上下 1.5rem、記事本文と十分な間隔
- **画像**：200×200px、`object-fit: cover`、`loading="lazy"`、`decoding="async"`
- **画像なし時**：プレースホルダー SVG（背景色付き、商品名イニシャル等で代替）

### ランクバッジ

1〜3 位のみ装飾、4 位以下は表示しない（または控えめなテキストのみ）：

```css
.rank1 { background: linear-gradient(135deg, #f59e0b, #d97706); } /* 金 */
.rank2 { background: linear-gradient(135deg, #94a3b8, #64748b); } /* 銀 */
.rank3 { background: linear-gradient(135deg, #d97706, #92400e); } /* 銅 */
```

絶対配置で top-left に配置。

### 推しバッジ（badge prop、任意）

「コスパ最強」「初心者No.1」等の差別化フレーズ：

- 背景：`#fef3c7`（薄い黄色）、文字：`#92400e`（焦げ茶）
- 商品名の上に配置
- 角丸 6px、padding 控えめ

### 価格表示

- フォントサイズ：1.15rem
- font-weight：800
- カラー：アクセントカラー（または濃い色）
- フォーマット：`¥{Number(price).toLocaleString()}` で 3 桁区切り

### CTA ボタン

2 列グリッド、各プラットフォームのブランドカラー：

```css
.buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid #e5e7eb;
}
.amazon  { background: #ff9900; color: #fff; }
.rakuten { background: #bf0000; color: #fff; }
```

ユーザーが普段見慣れた配色を使うことで「公式と連動している」感を出す。

### モバイル時（600px 以下）

```css
@media (max-width: 600px) {
  .inner { flex-direction: column; }
  .imageWrap { width: 100%; }
  .image { width: 100%; height: 200px; }
}
```

画像と情報エリアを縦積みに。CTA は 2 列のままでも良いし、縦並びにしても可（ボタンが大きくなるので押しやすい）。

### MDX 統合パターン

記事を MDX で書く場合、ラッパーコンポーネントで文字列 → 数値変換：

```tsx
function ProductCardMdx({ rank, id, name, price, ... }: { rank?: string; ... }) {
  return (
    <div id={id} style={{ scrollMarginTop: "90px" }}>
      <ProductCard
        rank={rank ? Number(rank) : undefined}
        product={{
          name,
          price: Number(price),
          // 他の数値フィールドも Number() でキャスト
          ...
        }}
      />
    </div>
  );
}
```

**重要**：MDX v3 は JSX 式プロパティ（`{value}`）をサイレントにドロップする。すべての値を **文字列リテラル**で渡し、コンポーネント側で型変換する。

`scrollMarginTop` は固定ヘッダの高さに合わせて調整。アンカーリンクで遷移したときヘッダに隠れないようにする。

---

## ComparisonTable（スペック比較表）

### 役割

複数商品を 1 つの表で横断的に比較。読者の意思決定を最も助けるコンポーネント。

### 構造

```
← スクロールできます →

┌─────────┬───┬───┬───┬───┬───┐
│ 商品名   │   │   │   │   │   │ ← 第1行（最高位商品）はハイライト
│         │   │   │   │   │   │ ← 偶数行はゼブラ
│         │   │   │   │   │   │
└─────────┴───┴───┴───┴───┴───┘
sticky    横スクロール可能
```

### 仕様

- **第 1 列（商品名）は sticky**：横スクロール中も商品名が常に見える
- **第 1 行は強調背景**（最高位商品）
- **偶数行は薄いグレー背景**（ゼブラパターン）でスキャンしやすく
- **スクロールヒント**：表の上に「← スクロールできます →」テキスト
- **ヘッダー行は濃い色**（アクセントカラー、白文字）

### 特殊レンダリングキー

特定キー名で自動的に整形：

| キー | 整形 |
|---|---|
| `price` | `¥{Number(val).toLocaleString()}` |
| `rating` | `★ {Number(val).toFixed(1)}` |
| `source` | アフィリエイトリンク（"Amazon" / "楽天"） |
| 値が `○` `✓` `◎` `yes` `true` `✔` | チェックマーク SVG |

特殊整形を使いたくない場合は別キー名を使う（例：`price` ではなく `"価格"`）。

### MDX 統合

```mdx
<ComparisonTableMdx
  columns='[{"key":"name","label":"商品名"},{"key":"重量","label":"重量"}]'
  rows='[{"id":"product-1","name":"商品A","重量":"500g"}]'
/>
```

- `columns` と `rows` は **シングルクォートで囲んだ JSON 文字列**
- `name` キーは必須（第 1 列に表示）
- `id` キーで対応する ProductCard へのアンカー先を指定可能

### 商材固有のカスタムキー

`columns` と `rows` のキー名は商材ドメインに応じて自由に決められる。例：

- キャンプナイフ：`刃長`、`重量`、`刃の素材`、`ロック機構`
- ランタン：`ルーメン`、`電源`、`防水`、`点灯時間`
- ホテル：`料金`、`Wi-Fi`、`朝食`、`駅近`
- eSIM：`データ容量`、`有効期間`、`対応国`、`通信速度`

各サイトの `CLAUDE.md` でカテゴリごとの推奨キーを定義する。

---

## TableOfContents（サイドバー TOC）

### 役割

長文記事において、読者が現在地と全体構造を把握。長い記事ほど TOC があると離脱率が下がる。

### 仕様

- **位置**：右サイドバー、`position: sticky; top: 80px;`
- **見出し階層**：H2 と H3 を階層表示（H3 はインデント）
- **アクティブ追跡**：`IntersectionObserver` でスクロール位置から現在の見出しを検出
- **rootMargin**：`"-80px 0% -65% 0%"` 程度で調整（固定ヘッダの高さに合わせる）
- **クリック時**：スムーススクロールで対応見出しへ
- **モバイル**：960px 以下で非表示（インライン TOC が代わりに機能）

### 実装スケッチ

```tsx
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    },
    { rootMargin: "-80px 0% -65% 0%" }
  );

  document.querySelectorAll("h2, h3").forEach((el) => observer.observe(el));
  return () => observer.disconnect();
}, []);
```

---

## InlineTOC（記事内インライン目次）

### 役割

記事冒頭に展開可能な目次を配置。モバイルではサイドバー TOC が出ないため必須。デスクトップでも記事冒頭で全体構造を見たい層に有効。

### 仕様

- **位置**：本文の最上部（MDX レンダリング直前）
- **トグル**：「目次を表示/非表示」ボタンで開閉
- **H2 は連番**：1, 2, 3...
- **H3 はインデント表示**
- **クリック時**：スムーススクロールで対応見出しへ

---

## Sidebar（サイドバー全体）

サイドバーには以下を縦に並べる：

1. **TableOfContents**（記事TOC、最上部）
2. **人気記事 TOP5**（閲覧数+星アイコン）
3. **カテゴリ一覧**（アイコン+名前+記事数）
4. **最新記事**（最大 5 件）

各ブロックは独立カード形式（薄いボーダー + 角丸）。

### 人気記事の取得

閲覧数を取得できる仕組みが必要：

- Supabase 等のデータベースで PV カウント
- Google Analytics API
- 静的なエディトリアル選定（簡易版）

### カテゴリ一覧

各カテゴリ名にアイコン（絵文字または SVG）を付けて視認性を上げる。

---

## RecommendedPosts（関連記事）

### 役割

記事末尾で同カテゴリの他記事を回遊させる。コンバージョン直前の最後の機会。

### 仕様

- **位置**：本文の最下（まとめの後、Footer の前）
- **件数**：3 件
- **取得ロジック**：同カテゴリ内、現在記事を除く、最新順 or 人気順
- **表示要素**：カテゴリバッジ・タイトル・説明文の冒頭・日付・サムネイル
- **グリッド**：3 列（PC）→ 1 列（モバイル 600px 以下）

### 実装ロジック例

```tsx
const relatedPosts = allPosts
  .filter((p) => p.slug !== currentSlug && p.category === currentCategory)
  .slice(0, 3);
```

タグの重複度でスコア付けすると質が上がる。

---

## ShareButtons（SNS シェアボタン）

記事下部に配置。Twitter / Facebook / LINE / コピーリンク等。シェアの実数より「シェア可能性」を示すことで信頼性が上がる。
