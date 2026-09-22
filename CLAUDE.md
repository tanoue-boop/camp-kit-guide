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
- `thumbnail`（新規記事・2026-09-16〜）は **ChatGPT（chatgpt.com、ログイン済みブラウザ）で記事テーマに応じて生成した写真風画像**を `public/images/thumbnails/<slug>.png` として保存し、そのパスを指定する。生成手順・プロンプトテンプレートは `docs/scheduled-task-spec.md` の「サムネイル生成（ChatGPT連携）」を参照。
  - ★背景: OpenAI APIはCoworkのクラウド作業環境から到達不可（組織ネットワークポリシーで403）、ブラウザからの直接fetchもOpenAI側のCORSでブロックされるため（2026-09-16に実機確認済み）、APIキーではなくChatGPTのWeb UIをブラウザ操作で使う。`.env.local` の `OPENAI_API_KEY` は将来API経路が使えるようになった場合の予備で、現状は未使用。
  - **生成に失敗した場合のみ**、フォールバックとして従来通り `/images/outdoor-01〜09.png` のローカル画像プールから記事内容に合うものを指定する（既存記事と偏らないよう番号を分散）。空文字にするとプレースホルダー /og-default.png にフォールバックする。
  - 既存記事のthumbnailは変更しない（リライトでも thumbnail には触れない：既存ルールのまま）。既存の `/images/outdoor-01〜09.png` はフォールバック専用として引き続き残す。
  - ⚙️ **デプロイ側の対応**（2026-09-17 修正済み・重要）: 生成サムネイルを本番へ出すには次の2点が必要で、両方とも対応済み。
    1. `scripts/deploy.cjs` の `NON_ARTICLE_PATHS` に `public` を含める（含めないと `public/images/thumbnails/*.png` が未追跡のままコミットされず、本番で404になる）。
    2. `scripts/verify-deploy.cjs` の `THUMB_RE` が `/images/thumbnails/<slug>.png` を許可する（旧正規表現は `outdoor-0X.png` のみ許可で、生成サムネイルを設定すると og:image 検証が形式NGで FAIL する）。
  - 📌 2026-09-17 の経緯: 9/16に本ルールを追加した時点では上記2点が未対応で、9/16・9/17の新規記事は「画像は生成・配置できているのに frontmatter はフォールバックのまま」という状態だった。9/17に2点を修正し、9/17分の4記事の thumbnail を生成サムネイルへ差し替え済み（9/16分の4記事は未差し替え＝フォールバックのまま）。
- ⚠️ **`thumbnail` に楽天など商品画像のURLを使わない**：小サイズ・URL変動・既存規約との不統一のため。商品画像（楽天画像URL）は各 `ProductCardMdx` の `image=` にのみ使う。frontmatter の `thumbnail` はローカル画像（生成サムネイル or フォールバック画像プール）限定
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

### ⚠ 太字（`**`）の書き方（2026-08-26 追加・全記事に影響）

日本語の本文で `**強調（補足）**の…` のように**閉じる `**` の直前が約物（全角括弧・鉤括弧・読点・中黒など）**になると、CommonMark の right-flanking 条件を満たせず太字にならず、`**` がそのまま本文に表示される。ビルドは通ってしまうため気づきにくい。

```
NG: **スカート（裾のフラップ）**で地面との隙間を塞ぐ   → ** が生表示される
OK: **スカート**（裾のフラップ）で地面との隙間を塞ぐ

NG: **「充電を忘れても電池を買えばすぐ復帰できる」**という点   → ** が生表示される
OK: 「**充電を忘れても電池を買えばすぐ復帰できる**」という点
```

- **原則**：太字の境界は必ず「文字」で始まり「文字」で終わらせる。約物は太字の外に出す。
- **開始側も同様**：`利点は**「…**` のように `**` の直後が約物で直前が文字の場合も開けない。
- **検証**：`node scripts/lint-bold.cjs`（実際に micromark へ通すため偽陽性なし）。`deploy.cjs` の手順1.5に組み込み済みで、破綻があれば push 前に停止する。
- **一括修正**：`node scripts/fix-bold.cjs --apply`（本文ブロックのみ・文言不変を1行ずつ検証・括弧の対応が崩れる案は不採用。安全な案が無い行は触らず報告するので、その分は手で直す）。
- 2026-08-26 に既存213本を一括検査し、**92ファイル137箇所**を修正。**全件が本番反映済みで解消済み**（内訳: 83ファイル125箇所＝commit 75bb97c／6ファイル6箇所＝commit 7d7090f（Amazonリンク穴埋めに同梱）／2ファイル6箇所＝commit 5496de0（価格更新に同梱））。HEAD で `node scripts/lint-bold.cjs` が PASS（213ファイル走査）することを確認済み。
- ✅ **この一括修正の残タスクは無い**。以後は新規記事・リライトで再発しないよう、手順1.5のlintに任せる（`deploy.cjs` が push 前に自動で停止する）。
- 💡 **同居変更のハンドリングの学び**: 一括修正の一部を「同じファイルに他タスクの未コミット変更が同居している」という理由でスコープ外にすると、そのファイルを次に触るタスクが自動的に巻き取る形になる。実際に上記6ファイル＋2ファイルはこの経路で解消した。ただし**いつ解消するかは他タスク次第**なので、残件を CLAUDE.md に列挙したまま放置せず、巻き取られた時点でこの節を更新すること。

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
  affiliateUrl="https://hb.afl.rakuten.co.jp/hgc/<AFF_ID>/?pc=<URLエンコードした楽天商品URL>"
  amazonAsin="B0XXXXXXXX"
  source="rakuten"
  badge="バッジテキスト（任意）"
/>
```

- `price` は数値を文字列で渡す（例: `"19800"`）
- `affiliateUrl` は**楽天の hb.afl アフィリエイトURL**（`scripts/rakuten-search.mjs` が出力する形）または `"#"`
- ⚠️ **Amazon リンクは必ず `amazonAsin="<ASIN>"` で持つ。ASIN を `affiliateUrl` に入れない**（2026-09-22 追加・campkit-20260921-38）。`source` は仕入れ先に合わせ、楽天リンクがあれば `source="rakuten"`、Amazon 実データのみで楽天に同一商品が無いときは `source="amazon"` ＋ `affiliateUrl="#"` ＋ `amazonAsin` にする。旧テンプレート（`source="amazon"` ＋ `affiliateUrl="<ASIN>"`）は `ProductCard` が ASIN として読める（`getAmazonUrl` の後方互換）ため Amazon ボタンは出るが、楽天ボタンが**アフィリエイト収益の付かない検索URL**にフォールバックし、`scripts/check-card-name-vs-sku.cjs` でも `url_unparsable` になって照合できない。2026-07〜09 の「Amazon源5選／Amazon実データ5選」記事（montbell-sleeping-bag／wooden-tableware／ogawa-tent／sleeping-bag-cover／spice-box／air-frame-tent）がこの形で生まれ、2026-09-20（42枚）・09-22（8枚）で現行形式へ統一済み
- ⚠️ **`amazonUrl`（amzn.to 短縮リンク）を ProductCardMdx に新規で書かない。Amazon は `amazonAsin` を使う**（2026-09-22 追加・campkit-20260921-41・キュー#18）。短縮URLは中身が見えずリンク先の差し替わりを検知できず、`amazonAsin` と同居させると描画で `amazonUrl` が優先されて台帳の ASIN と読者の飛び先が食い違いうる。既存の `amazonUrl` は `check-amazon-asin.cjs --static` の `short_url` フラグで棚卸しし、キュー#18 で順次 `amazonAsin` へ置き換える（第1弾 47枚／12記事は 09-22 に置換済み・残 161枚／38記事）
- `id` はページ内アンカーリンクに使う（まとめ表のリンク先）
- ⚠️ **バリエーション商品は `name` にカラー/サイズ/容量を必ず含める（2026-08-19 追加）**：楽天で色・サイズ・R値・容量などの選択肢がある商品は、**実際に採用した1つの仕様を `name` に書く**
  - ◯「DOD ワンポールテントS T3-44-TN(タン) 3人用」／「ZEN Camps アッシュキャリー Mサイズ(32×29cm)」／「deuter オルチャ 25 ブラック」
  - ✕「deuter オルチャ 25 デイパック」（色なし）／「FIELDOOR ヘキサタープ Mサイズ」（色なし）
  - 理由：Amazonは色・サイズごとに**子ASINが分かれている**ため、`name` に仕様が無いとAmazonリンクを付けられない。2026-08-19の穴埋めでは「該当なし」47件のうち**18件がこの理由**（deuter全5点／Gregory 4点／FIELDOORタープ2点／Bears Rock／DOEARTH Gussuri 他）
  - 仕様の確認元は**楽天商品ページの「カラー：」「サイズ：」欄**。⚠️ 楽天の商品タイトル・キーワード欄の数値は実スペックと違うことがあるので根拠にしない（実例：Civil Lifeトライポッドはタイトル「耐荷重20kg」だが実スペックは10kg）
  - 比較表・まとめ表の商品名も `name` の表記と食い違わせない
  - 仕様が1種類しかない商品は従来どおりでよい

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

#### Amazon二重掲載の優先ルール（2026-09-08 追加）

`_file/amazon-backfill-state.tsv`（穴埋め台帳）の実績分析で、Amazonリンクが「該当なし」になる原因の内訳が判明した。

| 原因 | 割合 |
|---|---|
| バリエーション（色/サイズ）を1つに特定できない | 35% |
| 無名OEM品でスペックが一致するAmazon商品がない | 33% |
| 楽天がセット品・Amazonが単体売りなど構成違い | 14% |
| 無名OEM品でAmazon側に対応する出品自体がない | 9% |
| **実在ブランドなのにAmazon非対応** | **5%** |

つまり失敗の91%は「無名・汎用のOEM品を選んでしまったこと」が原因で、「ちゃんとしたブランド品なのにAmazonに無い」ケースは1割に満たない。実績でも、ブランド名＋型番が明記された商品はAmazon一致率が約70〜80%だったのに対し、無名汎用品は約20%にとどまった（2026-09-08のAmazon穴埋め実行時の計測）。

- **商品選定（手順2d）の時点でこれを採用基準に組み込む**: レビュー実績が同程度の候補が複数あるときは、ブランド名＋型番が商品名に明記された商品を無名OEM品より優先する。
- 型番までは無くても、少なくともメーカー名が商品名に入っていればAmazon側の検索・一致がしやすい。
- ただしこれは同程度の実績の候補間でのタイブレークであり、reviewCount・価格帯整合性など既存の採用基準を犠牲にしてまで無理にブランド品を選ぶことはしない。安価な消耗品・汎用グッズ等、無名OEM品しか候補がないジャンルではこの限りではなく、該当なしを許容する。
- この優先ルールは商品選定時点の話であり、事後のAmazon穴埋め作業（`campkit-amazon-backfill`）自体の判定基準（型番一致・スペック3点一致等）は変えない。

---

## 隣接ASP収益化（CalloutCta ／ 日次4本ルール・2026-07-29〜）

物販（Amazon/楽天）に加え、単価の高いキャンプ隣接ASPを収益化に導入している。管理台帳は `_file/asp-programs.tsv`（案件名／ASP／プログラムID／料率／提携状況／アフィリリンク／挿入先カテゴリ／備考／**最終確認日**）。

- **CTA部品**: サービス系案件（レンタル・ふるさと納税・体験予約）の成約導線は `components/article/CalloutCta.tsx` を使う。MDXでは `<CalloutCtaMdx variant="rental|furusato|leisure" title=… body=… linkText=… href=… note=… />`。物販の `ProductCardMdx` とは別建て。外部リンクは `rel="sponsored nofollow"` 固定・PR表記（note）必須。ボタンは原色オレンジ＋白文字。
- **提携状況は実確認してから使う（台帳の記載を鵜呑みにしない・ASP記事に着手する前の必須フロー）**: `asp-programs.tsv` の『提携状況』列は手動更新のスナップショットで、A8側で承認が進んでも古いままになり得る。ASP記事を作る前に必ず次を回す。
  1. **審査中は使わない**（従来どおり）。リンクを貼らない・記事化しない。
  2. **昇格（審査中→提携済）の判断は実確認必須**。A8.net にログイン済みの Chrome セッションがあれば『参加プログラム／提携管理』ページで現況を読み取り、`提携状況` と `最終確認日` を更新してから使う（**新規ログイン＝認証情報の入力はしない**。ログイン済みセッションが無い自律実行では、審査中案件を勝手に提携済へ昇格させない）。
  3. **提携済でも `最終確認日` が空 or 60日超なら「未再確認」扱い**。実確認できる回に現況を見て `最終確認日`（YYYY-MM-DD）を更新する。実確認できない自律回は、実績のある確実な提携済案件（hinataレンタル／hinataストア／やまどうぐレンタル屋／BLUETTI）に限定してリンクを挿入し、それ以外は使用を保留する。
  4. **報告での表現**: 提携状況に触れるときは「実確認済（YYYY-MM-DD）」か「台帳ベース（最終確認: … ／未確認）」かを必ず明示し、未確認を承認済みのように断定しない。
- **承認され次第**: 審査中案件（例: さとふる・アソビュー・ふるさとチョイス）は、上記フローで提携済を実確認できた時点で `href` を発行し `最終確認日` を記録してから、該当variant（furusato/leisure）で記事に差し込む。
- **日次タスク（campkit-new-article-draft）は平日4件（2026-08-17に3件→4件へ増枠）**: 既定は商品5選2本＋隣接ASP専用1本＋**既存記事リライト1本**。ただし後述の既存記事修正キューに pending があれば、それを最優先で当日1件消化し、その分だけ新規商品記事を1本減らす（例: 既存修正1＋商品5選1＋ASP1＋リライト1）。**リライト枠は減らさない**。ASP記事はサービス構造（`content/posts/camp-gear-rental.mdx` が手本）。ASP用KWは `_file/keyword-backlog.tsv` に `source=asp` でタグ。カニバリしない承認済み角度が無い日は商品記事に振り替えて『ASP在庫補充が必要』と報告（品質優先の安全弁）。
- **第一弾**: `content/posts/camp-gear-rental.mdx`（hinataレンタル／申込8%）。詳細は `docs/monetization-asp-expansion.md`。

### ASP在庫の管理（補給線＝campkit-new-product-scan ／ 2026-08-17〜）

ASP枠は日次で1本ずつ消費される一方、長らく**補給タスクが存在せず** 2026-08-17 に枯渇した。以後 `campkit-new-product-scan`（月曜・週1）がASP在庫の補給を兼務する。

**在庫の数え方（最重要）**: 有効在庫は「`source=asp` かつ `status=pending` かつ **notes に書かれた案件が提携済**」の行のみ。審査中案件に紐づく pending は**在庫に数えない**。2026-08-17 に「pending 1本あるから在庫あり」と誤認した原因がこれ（アソビューが審査中でリンク発行できず、書けない在庫だった）。

**`status=blocked` の新設**: 審査中案件の角度は、承認前でも設計だけして `blocked` で積んでおく。日次タスクは `pending` のみを消費するので blocked は拾われない。承認を実確認できた週に `pending` へ昇格させる。**承認を検知してから角度をゼロで考え始めると、承認から公開までのリードタイムが丸ごと無駄になる。**

**角度の作り方＝「提携済案件 × 検索意図の型」**: 1案件＝1記事で作ると提携済5件ぶんで即枯れる。サービス系は同じ案件でもクエリが別物になるため、意図型（費用・相場／比較／手順・流れ／不安解消／シーン・季節／属性／時期・締切）と掛け合わせて非カニバリで複数本立てる。積む前に「既存ASP記事とどう役割分担するか」を notes に1文で書けないものは落とす。

**ASP枠に載せないもの**: BLUETTI は物販で CalloutCta の variant（rental/furusato/leisure）に載らない。BLUETTI角度は `source=product-scan` の商品5選枠として積む。

**構造的な赤字に注意**: ASP枠の消費は週5本、補給は週1回。毎週5本積めない週は在庫が減り続ける。有効在庫が3営業日分を切ったら、ASP枠の一部を商品記事へ振り替える設定変更を検討する。

---

## 既存記事の修正キュー（article-fix-backlog ／ 2026-08-12〜）

価格チェック等で見つかる「価格更新では済まない案件（廃番・掲載ページ404・同URLで別商品に差し替わり・型番差し替えが要る等）」を、提案で埋もれさせず自動で次の作業に乗せるためのキュー。台帳は `_file/article-fix-backlog.tsv`（列: status／priority／target_slug／position(第N位＋商品名)／issue_type(discontinued_404｜product_swap｜price_unconfirmed 等)／detail／rakuten_url／source／added_date／notes）。

- **積む側（detector）**: `campkit-price-check`（水）が、確定できず提案に回す案件を pending 行で自動追記する（同一 target_slug＋position の重複は追記せず最新化）。他の実装タスクも同様に積んでよい。
- **消化する側（executor）**: `campkit-new-article-draft`（平日日次）が、新規作成より前に pending 最上位1件を手順Fで差し替え実行し、当日3枠の1つに充てる（＝新規商品記事を1本減らす）。差し替え商品は楽天API/Amazonの実在・レビュー実績データで選び直し、KW整合性（価格帯・用途）を満たすこと。
- **例外の範囲**: 手順Fは「既存記事は上書きしない」原則の明示的な例外。ただし触ってよいのは【対象の該当ProductCard＋その商品に紐づく比較表行・まとめ表行・description中の該当価格/商品名】のみ。記事の他の商品・構成・アフィリリンク・thumbnailは変更しない。適切な代替が無い/構成の作り直しが要る重い案件は status=needs-human にして notes に論点を残し、当日枠は新規に振り替える（品質優先）。
- **記録**: 差し替えを実行したら `docs/seo-change-log.md` に「対象記事・旧→新・理由(issue_type)」を追記し、backlog 行を status=done（notes に日付）にする。
- **2026-09-21 追加（campkit-20260921-25）**: `scripts/check-card-name-vs-sku.cjs`（ProductCard の name/price と楽天実SKUの整合検出）の結果から一括起票した。追加語彙は次の2つ。
  - `issue_type=name_fix`: 商品は合っているが name の書き方だけ直す案件（複数型番の並記／楽天商品名の全選択肢列挙）。商品差し替え不要で、name を採用した1仕様に固定するだけ。
  - `issue_type=asin_mismatch`（2026-09-22 追加・campkit-20260921-36 §B・キュー#16）: 既設置の `amazonAsin` が別変種（サイズ違い・Plus モデル等＝verdict `model_mismatch`）や別商品（本体のカードにグランドシートの ASIN 等＝`different_product`）を指している案件。対処は **`amazonAsin` の差し替えのみ**（name／price／本文は触らない）。detail に Amazon 側の変種一覧から拾った候補 ASIN を書くが**未照合**なので、差し替え前に dp ページで変種名・価格を確認する。検出は `scripts/check-amazon-asin.cjs`（`--static` は静的検査のみでネットに出ない／`--verify N` で Amazon dp を N 件だけ照合・間隔 2 秒・429/503/CAPTCHA で exit 2／`--judge slug#rank#id=verdict --note …` で人手判定を記録）。出力 `_file/amazon-asin-check.tsv`（全 1121 カード・`link_form`＝amazonAsin／amazonUrl／legacy_source_amazon／none）。第1弾（20 枚照合）では **air-frame-tent が 5 枚中 4 枚誤り**（Cowork の Amazon 実データ選定時に変種 ASIN を取り違えた記事）だったので、同経路（`fce3941` 系「Amazon実データ5選」）の記事を優先して照合する。
    - **2026-09-22 追加（campkit-20260921-37 §A）**: TSV は 21 列。`verdict` の直後に `price_gap`（(Amazon価格−カードprice)÷カードprice の整数%・`+24%`／`-4%`／`0%`・書き出しのたびに自動再計算するので手で書かない）と `seller_type`（`official`／`amazon`／`marketplace`／`reseller`／`unknown`。fetch 直後は機械分類＝Amazon.co.jp→amazon・公式/Official/Direct→official・他→unknown。marketplace／reseller は `--judge … --seller X` か `--set-seller slug#rank#id=X` で人手記入）を持つ。**価格乖離や非公式店は verdict を変えず（ok のまま）この 2 列で読む**。`verdict=unverifiable` は台帳に起票しない。第2弾（30 枚）の誤りは 3 枚＝色違い変種 2（camp-cooler-soft#3・camp-dust-stand#2）＋ASIN 消滅で兄弟変種（アクセサリ）に着地 1（naturehike-tent#3）。
    - **2026-09-22 追加（campkit-20260921-39・第3弾 30 枚）**: `parseDp` が dp の `landingAsin`／`currentAsin` を拾い、異なれば `amazon_stock` に **`redirected_to=<ASIN>`** を出す（Amazon が失効 ASIN を兄弟変種へ黙って着地させるケースの機械検知。verdict の自動判定は変えない）。**候補 ASIN が無い `asin_mismatch` は、dp の変種一覧とブランド公式ストアから同一商品の別 ASIN を 1 回だけ再探索し、無ければ `amazonAsin` を除去して楽天のみの導線にしてよい**（監督 2026-09-22 判断。除去は日次の手順 F ではなく専用タスクでまとめて実施。該当行の notes に明記済み）。`seller_type` の人手分類は `reseller`＝「店名が商材と無関係」かつ「詳細欄が空」の両方を満たすものだけ、ブランド運営会社名義は `official`（`check-amazon-asin.cjs` 先頭コメントに明文化）。第3弾の誤りは 2 枚＝旧モデル ASIN（camp-fan-summer#2 OT-F12→dp が新モデル B0CY1XSQ77 を案内）＋失効 ASIN の同モデル別サイズ着地（camp-gift#2・redirected_to で検知）。naturehike-tent #4/#5 は「#4→B0DYF6W1C5（village13-Plus）／#5→B0DYF5RNY2（Ti Black）」の振り分け案を台帳 #5 行に記載（差し替え未実施）
    - **2026-09-22 追加（campkit-20260921-38・キュー#17）**: 旧形式 8 枚（`source="amazon"`＋`affiliateUrl=<ASIN>`）を現行形式へ統一し `legacy_form` は 8→0。楽天に同一商品（公式店 or 型番完全一致・価格差 ±3% 超は `price_unconfirmed` 起票）が見つかった 3 枚（air-frame-tent#3 TOMOUNT 公式／sleeping-bag-cover#3 OUTBEAR 公式／wooden-tableware#1 Joshin 30149）は `source="rakuten"`＋hb.afl＋`amazonAsin`。楽天に無い 5 枚（ogawa-tent#5＝在庫あり出品なし／sleeping-bag-cover#4＝中古のみ／spice-box#3・#5＝転売系のみで価格 +34〜49%／montbell-sleeping-bag#1＝転売系のみ +64% かつ Amazon 新品出品なし→`product_swap` priority A 起票）は `amazonAsin` を足して `source="amazon"`＋`affiliateUrl=<ASIN>` を残した。この 5 枚は静的検査で **`asin_in_affiliate_url`**（情報フラグ。描画は `amazonAsin` を使うので導線は現行形式）として見える。楽天が見つかった時点で `source="rakuten"`＋hb.afl に置き換える。
    - **2026-09-22 追加（campkit-20260921-48・キュー#35 拡張）**: `conflict`（`amazonAsin` と `amazonUrl` の解決先が食い違う）3 枚を dp で確定し、正しい ASIN を `amazonAsin` に残して `amazonUrl` 行を削除（coleman-lantern#1→B00I03IDXA・dod-tarp#1 pole は B01N8XAGUC 据え置き・naturehike-sleeping-bag#1→B08CV9F2XP）。**同一記事内の 2 カードが同一商品（logos-bonfire#1/#3＝81064162）のときは後位カードの `amazonAsin` を削除**して `dup_in_article` を 0 に戻す（楽天ボタンは残す）。学び: (1) 2 つの ASIN が**どちらも不一致**でも、同 dp の変種一覧に name の変種があれば dp を直接照合して差し替えてよい（naturehike#1: 既設置＝色違い・amzn.to＝別出品のサイズ違い→変種一覧から ブラウン右開き M を特定）。(2) `redirected_to` は**失効 ASIN が別商品のカードに付いているケース**を機械的に炙り出す（naturehike#3 の B08CV8XM26 は 190×75cm ファミリーへ着地＝225×75cm とは別商品）。(3) Amazon の「セット品 ASIN」（ノーススター＋スタンド 2 パック）は型番・色が一致しても構成違いなので `different_product`。候補の無い `asin_mismatch`（naturehike-sleeping-bag#3）と対象外記事（sleeping-bag-summer-cospa#4）は mdx 不変更で起票のみ。
    - **2026-09-22 追加（campkit-20260921-49・キュー#28 拡張）**: 候補の無い `asin_mismatch` 6 枚／5 記事を「再探索 1 回 → 差し替え or `amazonAsin` 除去」で着地（差し替え 4＝sleeping-bag-summer-cospa#4→B08CV9F2XP／naturehike-sleeping-bag#3→B0DY4L64WG／naturehike-tent#5→B0DYF6W1C5／camp-dust-stand#2→B093L3G2MB、除去 2＝naturehike-tent#3・camp-cooler-soft#3）。`inconsistent_shared` 2→0。学び: (1) **再探索は Amazon 検索ページ 1 回（`/s?k=<ブランド＋商品名＋寸法>`）で、結果の title を機械で読んで「温度帯・寸法・型番シリーズ」が一致する出品を候補にし、その dp の変種一覧から色・サイズを選ぶ**（naturehike-sleeping-bag#3: 検索結果の「快適温度2℃~12℃・上下連結」が楽天の LD150/250/350 の温度帯と一致→変種一覧で LD150 ホワイト を特定）。(2) **仕様が一致してもブランド欄・販売元が別ブランド（windhike 等）の出品は「公式の同一商品」と確定しない**（naturehike-tent#3 は ¥49,990・320×240×180cm・7.5kg まで一致したが windhike 出品のみ→除去して QUESTION）。(3) **楽天の商品説明に「◯◯限定カラー」とある色は Amazon に構造的に無い**ので、検索で無ければ即除去でよい（camp-cooler-soft#3 コヨーテ＝山と遊ぶ限定）。(4) 同一記事の 2 カードが同じファミリーを指すとき（naturehike-tent#4/#5）は、**セット内容（前幕×1 の有無・ペグ本数・重量）で変種を割り当てる**＝タイトルの「拡張キャノピー／前幕」表記は両変種にあって決め手にならない。(5) 検出器の `HTML_DIRS` は変更禁止なので、49 で取得した HTML は `html-asin-49/`（正本）に置き、同名で `html-asin-39/` へ複製して `--only … --cached` で TSV に書いた（Amazon への再アクセス 0 回）
    - **2026-09-22 追加（campkit-20260921-51／52・キュー#29 第1弾の運用メモ）**: (1) `amazon_stock` の追記フラグ **`redirected_to=<ASIN>`**（着地先すり替え。JSON の landing/current が両方取れればその比較、取れなければ要求 ASIN と hidden `input#ASIN` の比較）と **`successor=<ASIN>`**（dp の「新しいモデルがあります」ブロック。`id=newerVersionFeature` → `id=pqv-newer-version` の順で先頭の `/dp/`）。**どちらも verdict を動かさない情報**。(2) 情報フラグ **`reseller_markup`**（`seller_type=reseller` かつ `price_gap ≧ +100%`。`writeTsv` のたびに再計算される導出フラグで手で書かない。`validate-backlog-tsv` の `static_flags` 値域は `\S+` なので値域追加は不要）。(3) **`--clear-verdict <slug#rank#id>`**（`link_form=none` の行だけ・`verdict`／`price_gap`／`seller_type`／`checked_at`／`judged_task`／`note` を空に・`amazon_title`／`amazon_price`／`amazon_stock` は監査証跡として残す・1 件でも失敗すれば何も書かない）。(4) **`git checkout -- <台帳TSV>` で復元した直後は `--static` を 1 回流してから `--test` を実行する**（`core.autocrlf=true` のため作業コピーが CRLF になり、`--test` の「CR 無し」「ヘッダ」が FAIL する。内容は同一で `git status` は clean のまま）。
    - **2026-09-22 追加（campkit-20260921-53・キュー#29 第2弾）**: **`--refresh-stock --cached`**＝保存 HTML（`HTML_DIRS`）のある行の **`amazon_stock` 列だけ**を現行パーサで作り直す（`base; redirected_to; successor` の順）。`--cached` 必須（ネットに出ない・Amazon GET 0 回）・`--verify`／`--only`／`--judge`／`--set-seller`／`--clear-verdict` と併用不可・**`autoVerdict` を呼ばない**ので `verdict`／`note`／`checked_at`／`judged_task`／`amazon_title`／`amazon_price`／`seller_type` は不変・保存 HTML の無い行は不変。照合済み行へ後継 ASIN を後から載せ直す用（`--cached --recheck` は人手 verdict を上書きするので使わない）。保存 HTML の探索は `--cached` と同じ規則（同 ASIN を別カードで取得済みならそれも使う）なので、未照合の行にも `amazon_stock` だけ入ることがある（53 の初回実行で 20 行）。
  - `status=blocked`: 変更禁止リスト（task-16・**2026-10-18 まで**）の記事に対する起票。日次タスクは `pending` だけを消費するので拾われない。2026-10-19 以降に `pending` へ昇格させる（keyword-backlog の `blocked` と同じ運用）。
  - ⚠️ **ProductCard の `rank` は記事内で一意ではない**（dod-tarp／mountain-camp-lantern／sierra-cup／vastland-tent は本体と関連アイテムが同じ rank）。カードを特定するキーは必ず `slug＋rank＋id` にする。2026-09-21（campkit-20260921-26）に、保存HTMLを rank だけで管理していたことによる取り違え（dod-tarp のオクラタープをポールのHTMLで判定→誤起票）を修正し、誤起票行は削除した。起票の `position` には `（id: …）` を必ず含める。
- **2026-09-22 追加（campkit-20260921-31）: ProductCard `name` の書き方の基準（キュー#15-b の name 修正で適用）**。①販促文言を落とし「ブランド＋商品名＋型番＋主要スペック」に整える。②色・サイズは着地時既定（各軸の先頭値）に固定するが、**カード `price` と一致する変種があればそちらを優先**し、**既定の SKU が qty=0 で同一構成・同価格の購入可能な SKU があれば、その在庫のある値（軸順で最初）を書く**（売切の XS/S を読者に名指ししない。同価格の在庫が無ければ既定のまま据え置き、理由を report に書く）。③並記・範囲（「8/10cm」「20〜30cm 4〜16本」）は1仕様に絞る。楽天の軸値が「ライトベージュ：標準タイプ」のように「色：タイプ」形式のときは**値を「：」込みでそのまま書く**（検出器が名指しとして拾える）。1文字サイズ（S/M/L）はサイズ軸に限り独立トークン（前後が空白・区切り）で書けば名指しになる（`check-card-name-vs-sku.cjs` §A・2026-09-22）。レンタル品の「【レンタル】」・返礼品の「【ふるさと納税】」は商品の性質なので残す。
  - **売切既定の書き直し（②後段・§B）の軸の動かし方（2026-09-22・campkit-20260921-32 で確定）**: (1) まず構成（セット/単品などの軸）と色を保ったまま、軸順で最初に在庫のある「サイズ」へ動かす（XL・XXL のように極端でも構成と色を保てる限りこれを優先）。(2) 同一構成・同価格で在庫のあるサイズが1つも無い場合に限り色（または構成）を動かし、軸順で最初に在庫のある値を採る。(3) 同価格で在庫のある SKU が無ければ既定のまま据え置き、理由を report に書いて台帳に起票する（価格を動かしてまで在庫に寄せない）。(4) 既定 SKU が qty=1〜2 の薄在庫は qty=0 ではないので §B を適用しない。また **name は記事の内容に合う変種を指す**（買える・価格が合うという理由で記事と食い違う変種＝ベンチ／グランドシート等を名指ししない。SKU が無ければ `variant_unavailable` のまま out_of_stock で起票）。検出器が名指しを認めない軸（「有り｜無し」のような NONE 値を含むオプション軸）は name に書いても選択SKUは動かないので、書かずに台帳 notes で扱う。
  - **2026-09-22 追加（campkit-20260921-33 §0 で確定）**: (a) **店側の表記ノイズ（誤字・値の先頭に付いた区切り記号「‐」など）は name に写さず読者に自然な表記を書いてよい**。条件は①選択SKUが変わらない・②対象フラグ（color/size/store_copy）が消える の両方で、シミュレータで確認して report に列挙する（検出器は緩めない）。(b) **軸の先頭値に SKU が無いときは、着地時に実際に選ばれる variantId の値を「既定」とみなして固定する**（軸順で最初に SKU がある値に寄せなくてよい）。(c) **§B で動かした先が qty=1〜2 の薄在庫しか無い場合は既定のまま据え置き**（軸順先頭が薄在庫でその先に qty≥3 の値があれば、薄在庫を飛ばしてそちらを採る。理由を report に書く）。
  - **2026-09-22 追加（campkit-20260921-34 §A で確定）**: (d) **§B(2)（同価格・同構成で在庫のあるサイズが無いときに色を動かす）は、記事の見出し・本文・比較表が色を名指ししていないカードに限る。** 名指ししている場合は既定のまま据え置き、`out_of_stock` で起票する（買える変種でも記事と食い違う変種は名指ししない＝32 Q3 と同じ原則。実例: nanga-down-jacket#5 は見出しが「レディース ブラック」なので、ブラック全サイズ qty=0 でも モカグレー へ動かさず WS/ブラック のまま起票）。「NN.」形式の連番接頭辞（例「01.グレー」）は (a) の表記ノイズとして落としてよい（条件は (a) と同じ）。
  - **2026-09-22 追加（campkit-20260921-35 §A・34 §11 Q1/Q3 の回答を反映）**: (e) **記事の記述が正しいときはカードを記事に合わせる（34 §A・32 Q3）。記事の記述自体が実リンク先の商品と食い違っているときは、カードは実リンク先の SKU に合わせ、記事側の誤りを台帳に起票する**（実例: `sierra-cup#campingmoon-seiro` は見出し「深型シェラカップ＋せいろセット」だが実リンク先の SKU は「せいろ＋蓋」のみ→カードは SKU どおり「1段＋蓋」とし、見出し・本文の修正は台帳の detail に残して 2026-10-19 以降にまとめて行う）。記事に合わせるために `qty=0` や価格の合わない変種を名指ししない。 (f) **同一商品が複数記事に入っている場合は、既定では同じ SKU・同じ表記に揃える。ただしカード `price` の一致先が記事ごとに違う／記事本文が別の変種を指している場合は、理由を report に書いたうえで分けてよい**（実例: MERMONT 選べる4タイプ＝`sleeping-bag-summer-cospa#1` はカード ¥2,080 と一致する 限界温度5℃/650g、`rectangle-sleeping-bag#5` はカード ¥1,750 に一致する SKU が無いので既定 -5℃ のまま。32 のタンスのゲンと同じ扱い）。
  - **2026-09-22 追加（campkit-20260921-36 §A・35 QUESTION 1 の回答を反映）**: (g) **軸の値が `ENGLISH(和名)` 形式（例 `CHARCOAL(チャコール)`・`BLACK(ブラック)`・`TAN(タン)`）のときは、和名だけを書くと `color_unspecified` は消えるが選択SKUは既定のまま動かない。必ず軸値の形（`CHARCOAL(チャコール)`）で書く。**（実例: `low-style-chair#1` は「チャコール」と書いていたため flags=OK のまま選択SKUが BLACK に着地していた＝campkit-20260921-35 QUESTION 1・36 §A で `CHARCOAL(チャコール)` に修正し waq-rlc1-charcoal へ移動）。同一商品でも記事が色を名指ししていないカード（`waq-chair#1`）は既定色 `BLACK(ブラック)` のまま＝(f) の例外。
- **2026-09-22 追加（campkit-20260921-30）: 台帳 TSV を書き換えたら必ず `node scripts/validate-backlog-tsv.cjs` を通す**。29 で `position` 8行を手編集（Edit ツールの文字列置換）した際に `issue_type` と `detail` の間のタブが落ち、その8行だけ9列に潰れたまま push された（ビルドは通るので気づけない）。同スクリプトは `article-fix-backlog.tsv`／`rewrite-backlog.tsv`／`card-name-check.tsv` の列数・ヘッダ名・status/issue_type の値ドメイン・行数を検査して NG なら非0終了する。`deploy.cjs` の手順1.6 に組み込み済みで、崩れていれば push 前に自動停止する。**台帳の編集は手作業の文字列置換ではなく、列を配列として扱う小スクリプトで行う**（`_file/_work/t30-fix-backlog.cjs` が例）。

---

## 既存記事のリライトキュー（rewrite-backlog ／ 2026-08-17〜）

記事数が190本を超え、**新規KWの調達難度が上がる一方で既存記事の順位改善余地が大きくなった**ため、日次枠を3→4本に増やしてリライト専用枠を新設した。`article-fix-backlog`（廃番・商品差し替え＝**商品データの問題**）とは別物で、こちらは**検索順位の問題**を扱う。台帳は `_file/rewrite-backlog.tsv`（列: status／priority／target_slug／cluster／gsc_impressions／gsc_position／lever／detail／source／added_date／notes）。

- **積む側（detector）**: `campkit-keyword-selection`（月）と `campkit-seo-competitor-scan`（金）が、GSCで「表示回数はあるが順位が低い／あと一押しでページ1」のクラスタを見つけたら pending 行で追記する。新規記事KWは `keyword-backlog.tsv`、既存記事の改善は `rewrite-backlog.tsv` と使い分ける（**既に対応記事がある領域に新規記事を立ててカニバらせない**ための仕分け）。
- **消化する側（executor）**: `campkit-new-article-draft`（平日日次）が pending 最上位1件を手順Rで実行し、当日4枠の1つに充てる。

### lever（施策の型）

| lever | 内容 | 注意 |
|-------|------|------|
| `synonym-coverage` | 表記ゆれ・同義語・共起語を本文に自然に補う（子供/子ども/こども/幼児/キッズ、寝袋/シュラフ 等） | 羅列・不自然な詰め込みは禁止 |
| `structure` | 検索意図に対応する不足見出しを**追記**する | 既存の見出し・商品カード・順位構成は残す（低リグレッション） |
| `internal-link` | 関連記事から対象記事へ内部リンクを集中させる | リンク元は該当箇所への1行追加のみ |
| `freshness` | 内容の実態に合わせて `updatedAt` を更新 | **中身を変えずに日付だけ更新するのは禁止** |
| `cannibal-check` | カニバリの有無を調査する | 統合・リダイレクトは破壊的操作のため**実行しない**。`needs-human` にして論点を残す |

- **例外の範囲**: 手順Rは「既存記事は上書きしない」原則の明示的な例外。触ってよいのは【本文の該当セクション／frontmatter の title・description・tags・updatedAt／内部リンク】のみ。**ProductCardMdx の商品・価格・レビュー数・アフィリリンク・amazonAsin・thumbnail・比較表の商品行は変更しない**（商品差し替えが要る案件は `article-fix-backlog` の管轄なので、そちらに pending を積んで本件は needs-human にする）。
- **順位が付いている記事（10位以内）は慎重に**: まず title/description と導入部の最適化に留め、商品順序の入れ替えは行わない。
- **記録**: 実行したら `docs/seo-change-log.md` に「対象記事・狙ったクエリ・変更した見出し・変更前後の狙い」を具体的に追記し、backlog 行を status=done（notes に実施日と要約）にする。**効果測定は2〜3週間後の `campkit-seo-competitor-scan`（金）で行うため、何を変えたかの記録がないと検証できない**。
- **在庫切れ時**: pending が無い日はリライト枠を新規商品記事1本に振り替え、報告末尾に『リライト在庫補充が必要』と明記する。

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

- **実行して良いのは `node scripts/deploy.cjs "<メッセージ>"` の1コマンドのみ。** build → 太字lint(1.5) → 台帳検査(1.6) → commit → push → 本番検証は deploy.cjs が内部で実施する。
- **本番検証（verify-deploy.cjs）の楽天リンクは `hb.afl` 限定（2026-09-22・campkit-20260921-40）**: ProductCard の楽天ボタンの `hb.afl.rakuten.co.jp` 数が、mdx から算出した期待数（`source="rakuten"` かつ `affiliateUrl` が hb.afl のカード数）と**一致**して PASS。`search.rakuten.co.jp` の検索URL（`source="amazon"` カード）は数えない（期待 0 は実測 0 で PASS）。
- **本番検証の Amazon リンクも同じ「ボタン枚数＝カード単位の期待数（一致）」（2026-09-22・campkit-20260921-45・キュー#32）**: ProductCard の Amazon ボタン（`class="…ProductCard…__amazon"`）の枚数が、mdx をカード単位に見て `ProductCard.getAmazonUrl()` と同じ優先順（`amazonUrl` → `amazonAsin` → `source="amazon"` のとき `affiliateUrl` を ASIN とみなす）で「ボタンが出るカード」を数えた期待数と**一致**して PASS（期待 0 は実測 0 で PASS）。JSON-LD／`__NEXT_DATA__`／比較表の `dp?tag=`・`amzn.to` は数えない（参考表示のみ）。旧規則（`dp?tag=`/`amzn.to` 全出現数 ≧ 属性出現数）は `source="amazon"` カードの JSON-LD・`amazonUrl` カードの `__NEXT_DATA__` の重複出現で偶然つじつまが合っていた（ogawa-tent／coleman-lantern／dod-tarp で実測）。`--test` は 34 ケース。
- **本番検証はリンクの「値」もカード単位で照合する（2026-09-22・campkit-20260921-47・キュー#34）**: 枚数一致だけでは「枚数が変わらない変更」（ASIN の差し替え・`amazonUrl`→同一商品の `amazonAsin` 置換・楽天 `affiliateUrl` の差し替え）で旧HTMLに PASS を出す穴が残っていた（44 で発生・45 でも検出不可）。ProductCard の楽天ボタン（hb.afl）／Amazon ボタンの href を、mdx から算出した期待 href（楽天＝`affiliateUrl` そのまま／Amazon＝`getAmazonUrl()` と同じ優先順で `amazonUrl` はそのまま・`amazonAsin`／legacy は `https://www.amazon.co.jp/dp/<ASIN>`）と**多重集合として一致**（順序は問わない・Amazon dp の `?tag=` は照合対象外・HTML エンティティは復号）で PASS。合否は「楽天枚数一致 && Amazon枚数一致 && 楽天値一致 && Amazon値一致」（従来の `total ≧ cardCount` は外した）。不一致なら反映待ちとして再取得し、上限で FAIL（不足／余剰の href を最大 3 件表示）。**FAIL したときに mdx で辻褄を合わせない**（旧HTMLのまま＝反映待ちが効いている材料）。
- **反映待ちの扱い（同上）**: `x-vercel-cache=HIT` で `age` が push（`deploy.cjs` が `--deployed-at` で渡す）より古い応答は内容が合っていても「旧キャッシュ」として 30秒×最大6回再取得し、上限で FAIL する。FAIL したら Vercel の反映を確認して `node scripts/verify-deploy.cjs` を再実行（手動時は HEAD のコミット時刻で判定）。手作業の `?cb=` ポーリングは不要。判定ロジックは `node scripts/verify-deploy.cjs --test`（45ケース・ネット不使用）。
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
