# CampKit Guide — オペレーションスナップショット

> 作成日: 2026-04-28  
> 目的: Claude.ai セッションでリポジトリ実態を即時参照できるよう、コードベース・GAS・記事数の真実を記録する。

---

## 1. カテゴリ実装の真実（4ファイル対照表）

### 実装済みスラッグ一覧

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

**計9スラッグ。4ファイルすべてで完全一致を確認済み。**

### 確認対象ファイルと配列名

| ファイル | 配列名 | 状態 |
|---------|--------|------|
| `pages/category/[slug].tsx` | `allCategories` | ✅ 上記9スラッグと一致 |
| `pages/index.tsx` | `baseCategories` | ✅ 上記9スラッグと一致（iconフィールドあり） |
| `components/layout/Header.tsx` | `CATEGORIES` | ✅ 上記9スラッグと一致（href/label/icon） |
| `pages/posts/[slug].tsx` | `ALL_CATEGORIES` | ✅ 上記9スラッグと一致（サイドバー・パンくず用） |

---

## 2. GASスクリプト構造

### 取得状況

- **「camp-kit-guide GASコード全文」ドキュメント**: Google Drive 検索で未発見（"SLUG_CATEGORY_MAP" / "camp-kit-guide GAS" いずれのクエリでもヒットなし）
- ワークフロードキュメント（Section 11）に参照が記されているが、Drive MCP からはアクセス不可

### ワークフロードキュメントから判明している操作仕様

スプレッドシート名: **「キャンプKW戦略管理」**

| GAS 関数名（推定） | 役割 |
|------------------|------|
| `SLUG_CATEGORY_MAP` | slug → カテゴリのマッピング定義 |
| `BATCH_ARTICLES` | 記事バッチ処理の制御 |
| `RECOMMENDED_PICKS` | 推奨商品データの格納 |

### GAS が出力する TSV の仕様

- 出力先: `_file/products.tsv`
- ProductCardMdx に流し込む以下のフィールドを含む:
  - `id`, `name`, `description`, `price`, `amazonRating`, `amazonReviewCount`, `rakutenRating`, `rakutenReviewCount`, `affiliateUrl`, `source`, `badge`

### GAS 実行フロー（ワークフロードキュメント Section 7-2 より）

1. スプレッドシートの「採用商品」シートに商品データを入力
2. GAS を実行 → `_file/products.tsv` が生成される
3. Claude Code に「`_file/products.tsv` を配置した」と伝える
4. Claude Code が TSV を読み込み、MDX の ProductCardMdx プレースホルダーに値を流し込む

> ⚠️ GAS コード全文ドキュメントが Drive で見つからないため、関数名・シート名の詳細は未確認。次回セッションで再探索を推奨。

---

## 3. カテゴリ別記事数（2026-04-28 時点）

総記事数: **42件**

| カテゴリ slug | 記事数 | 記事ファイル名 |
|-------------|--------|--------------|
| tent | 11 | day-camp-tarp-cheap, day-camp-starter-set, camp-tarp-beginner, family-summer-large-tent, family-camp-summer-tent, family-camp-tent, solo-camp-beginners-guide, solo-tent-beginner, solo-tent-lightweight, stylish-camp-tent, two-room-tent-guide |
| sleeping-bag | 7 | camp-sleeping-mat, kids-sleeping-bag, mountain-camp-mat, sleeping-bag-season-guide, sleeping-bag-summer-cospa, sleeping-bag-temperature-guide, sleeping-bag-winter-beginner |
| cookware | 6 | camp-burner-beginner, camp-cooker-beginner, camp-cooler-box-overall, camp-cooler-box-beginner, camp-knife-beginner, day-camp-cooler-box |
| chair-table | 6 | camp-chair-lightweight, camp-table-folding, camp-table-set, family-camp-chair, group-camp-table, solo-camp-cot |
| lighting | 5 | camp-headlight-beginner, camp-lantern-led, camp-lighting-guide, day-camp-led-lantern, family-camp-lantern |
| bonfire | 3 | bonfire-stand-beginner, camp-bbq-grill, day-camp-grill |
| backpack | 2 | camp-backpack-beginner, mountain-backpack-30l |
| power | 2 | camp-portable-power-beginner, portable-power-vehicle-camp |
| clothing | **0** | （記事なし） |

### 優先補強カテゴリ

1. **clothing (0件)** — 最薄。KW選定の最優先候補
2. **backpack / power (各2件)** — 薄め。競合余地あり
3. **bonfire (3件)** — 焚き火特化コンテンツで伸ばしやすい

---

## 4. CLAUDE.md とワークフロードキュメントの不整合

### 不整合1: カテゴリ数の差異（重要度: 高）

| 情報源 | カテゴリ数 | 記載スラッグ |
|--------|----------|------------|
| CLAUDE.md | 9 | tent / sleeping-bag / cookware / chair-table / lighting / clothing / bonfire / backpack / power |
| ワークフロードキュメント | 11（推定） | 上記9 + **`cooler`** + **`tarp`** |
| リポジトリ実態 | **9** | CLAUDE.md と完全一致 |

**結論**: `cooler` と `tarp` はワークフロードキュメントにのみ存在し、リポジトリには実装されていない。`cooler` 系記事は `cookware` カテゴリに格納されている（例: camp-cooler-box-*）。ワークフロードキュメントは古い設計を反映している可能性が高い。

### 不整合2: 記事数の記述（重要度: 中）

| 情報源 | 記述 |
|--------|------|
| ワークフロードキュメント | 「既存22記事」 |
| 実際の記事数（2026-04-28） | **42件** |

ワークフロードキュメントの記事数記述は大幅に古い。「既存〇〇記事のMDXをコピーして」などの指示文脈は参考値として扱うこと。

### 不整合3: frontmatter フィールドの差異（重要度: 中）

| フィールド | CLAUDE.md | ワークフロードキュメント |
|-----------|-----------|----------------------|
| タグ系 | `tags` | `tags` + `keywords`（追加言及あり） |
| サムネイル | `thumbnail` | `eyecatch` |
| 更新日 | なし | `updatedAt` |

**結論**: リポジトリの実際の MDX は `thumbnail` と `tags` を使用。`eyecatch` / `keywords` / `updatedAt` は実装されていない。記事作成時は CLAUDE.md のテンプレートを正とする。

### 不整合4: GAS コードドキュメントの所在（重要度: 高）

- ワークフロードキュメント Section 11 に「camp-kit-guide GASコード全文」ドキュメントへの参照がある
- Google Drive MCP で複数クエリ検索を実施したが未発見
- GAS スクリプトは実在するが Claude Code / Claude.ai からのアクセス手段が不明

**対処**: GAS が生成する TSV のフォーマット（= ProductCardMdx のプロパティ）から逆引きして仕様を推定。コードベースの `lib/rakuten.ts`, `lib/amazon.ts` を参照すれば affiliate URL 形式は確認可能。

### 不整合5: ワークフロードキュメントのステップ参照番号（重要度: 低）

- ワークフロードキュメント Step 7-2「既存22記事のMDXをコピーして」— 記事数が古い（42件）
- ワークフロー自体は有効だが、記事数・カテゴリ数の数値は信頼しないこと

---

## 補足: 各情報源の信頼度ランキング

| 優先度 | 情報源 | 理由 |
|--------|--------|------|
| 1 | リポジトリ実態（コード・MDX） | 常に最新 |
| 2 | CLAUDE.md | リポジトリに含まれ管理されている |
| 3 | 本ドキュメント（operation-snapshot.md） | 2026-04-28 時点のスナップショット |
| 4 | ワークフロードキュメント（Drive） | 更新頻度不明、カテゴリ・記事数が古い |
| 5 | GASコードドキュメント（Drive） | 所在不明のため参照不可 |
