# Amazonリンク穴埋め 運用ドキュメント

既存記事の `source="rakuten"` な ProductCard に、Amazon.co.jp の実在ASINを `amazonAsin="..."` として追加していく継続作業の台帳兼マニュアル。
初版は 2026-08-12 の Cowork → Claude Code 引き継ぎ書。以降は継続運用のドキュメントとして更新する。

- **最終更新: 2026-08-17**（初版のリポジトリ直下 `amazon-backfill-handover-2026-08-12.md` を `docs/` へ移設。完了済みの手順を削除し、残タスクを実データで再計測）
- 個別の採用ASIN / no-amazon理由は `_file/amazon-link-worksheet.tsv` が正（1商品1行）。本ファイルは進捗と判定ルールを持つ。

---

## 1. 進捗（2026-08-17 時点・記事ソースから実測）

| 区分 | カード数 |
|---|---|
| Amazon源カード（`source="amazon"`・コードが `dp?tag=` を生成） | 19 |
| 楽天源＋`amazonAsin` / `amazonUrl` 設置済 | 332 |
| **未設定（楽天ボタンのみ）** | **516** |
| 合計 ProductCard | 867 |

未設定カードを含む記事は **132本**。

### 完了済みバッチ（再実行不要）

| 日付 | commit | 内容 |
|---|---|---|
| 2026-08-12 | `3cb8cbb` | 第1弾 16 ASIN（backpack-large / bluetti-power / bonfire-sheet ほか8記事） |
| 2026-08-12 | `80e0e1b` | 第2〜5弾 62 ASIN＋手動1（30記事＋bonfire-stand-solo） |
| 2026-08-12 | `4931931` | ⚠️ **誤リンク撤去**：bonfire-stand-solo 第1位 TokyoCamp の `B08CZWJ7P8` は HAKOSUKA＝別モデルだったため削除し楽天のみへ差戻し |
| 2026-08-13〜 | `342e269` / `52b4193` ほか | duo-tent / infinity-chair / uniflame-fire-grill / hand-axe / oil-lantern / water-jug / fireproof-gloves ほか |

> `4931931` は「手動で入れたASINでも型番が一致しなければ撤去する」という実例。初版の引き継ぎ書には `B08CZWJ7P8` を含めるよう書かれていたが、**この指示は無効**。

---

## 2. 残タスク（未設定カードを含む132記事 / 516カード）

slug昇順。数字は `未設定/総カード数`。日次タスクで新規作成した記事も、ノーブランド品が多い場合はここに積み上がる。

```
alcohol-stove 3/5              backpack-large 3/5             bluetti-power 1/5
bonfire-sheet 2/5              bonfire-stand-solo 3/5         bonfire-tripod 4/5
camp-backpack-beginner 1/5     camp-bbq-grill 2/5             camp-coffee-dripper 3/5
camp-cooler-box-overall 1/5    camp-cooler-soft 3/5           camp-cutlery 5/5
camp-fan-summer 4/5            camp-grill-plate 3/5           camp-hammock 2/5
camp-headlight-beginner 2/5    camp-kettle-recommend 3/5      camp-lighting-guide 1/5
camp-oil-stove 2/5             camp-pillow 3/5                camp-portable-power-beginner 3/5
camp-rainwear 4/5              camp-skillet 1/5               camp-sleeping-mat 1/5
camp-smoker 5/5                camp-table-folding 1/5         camp-windscreen 4/5
car-camp-bed-kit 3/3           car-camp-lighting 3/5          car-shade 5/5
car-side-tarp 2/5              co-checker 4/5                 coleman-bonfire 3/4
coleman-chair 3/5              coleman-two-burner 4/5         compact-portable-power 1/5
cooler-box-day-camp 1/5        cooler-ice-pack 4/5            day-camp-cooler-box 2/5
day-camp-grill 4/5             day-camp-led-lantern 3/5       day-camp-starter-set 3/5
day-camp-tarp-cheap 3/5        day-camp-tent 4/4              deuter-backpack 5/5
dod-table 4/4                  dod-tent 5/5                   duo-tent 1/5
electric-blanket-camp 5/5      family-camp-bbq 5/5            family-camp-chair 5/5
family-camp-cot 5/5            family-camp-lantern 5/5        family-camp-summer-tent 2/5
family-camp-tent 5/5           family-summer-large-tent 5/5   field-rack 5/5
fire-blower 5/5                fire-extinguish-pot 5/5        fire-tongs 5/5
fireproof-gloves 4/5           folding-cutting-board 1/5      forged-peg 5/5
gas-lantern 5/5                gear-storage-box 5/5           gregory-backpack 5/5
group-camp-table 2/5           group-camp-tent 5/5            guy-rope-recommend 3/5
hand-axe 2/5                   headlight-rechargeable 5/5     hexa-tarp 5/5
hot-sandwich-maker 5/5         hot-water-bottle 5/5           infinity-chair 2/5
inflatable-mat 5/5             iwatani-stove 3/3              kids-sleeping-bag 5/5
lantern-stand 5/5              large-tarp-recommend 5/5       log-carrier 5/5
low-style-table 5/5            mestin-recommend 5/5           mobile-battery-camp 5/5
mountain-backpack-30l 5/5      mountain-camp-lantern 1/6      mountain-camp-mat 5/5
mountain-camp-tent 5/5         mountain-tent-cheap 5/5        mummy-sleeping-bag 5/5
mysteryranch-backpack 4/4      naturehike-mat 5/5             naturehike-tent 5/5
northface-backpack 5/5         oil-lantern 4/5                one-pole-tent 5/5
one-touch-tarp 5/5             osprey-backpack 4/4            outdoor-coffee-mill 5/5
outdoor-kitchen-table 5/5      outdoor-wagon 5/5              peg-hammer 5/5
portable-cooler-aircon 5/5     portable-electric-kettle 5/5   portable-fridge 5/5
portable-power-large 5/5       portable-power-vehicle-camp 5/5 pup-tent 5/5
rectangle-sleeping-bag 5/5     screen-tarp 5/5                secondary-combustion-bonfire 5/5
sierra-cup 5/5                 sleeping-bag-liner 5/5         sleeping-bag-temperature-guide 1/5
snowpeak-tent 5/5              solar-panel-folding 5/5        solo-camp-beginners-guide 5/5
solo-camp-cot 3/3              stylish-camp-tent 5/5          takibi-table 5/5
tarp-pole 5/5                  tent-wood-stove 5/5            thermal-bottle 5/5
titanium-mug 5/5               torch-burner 5/5               uniflame-burner 3/3
uniflame-fire-grill 1/5        vastland-tent 5/5              waq-chair 5/5
water-jug 4/5                  waterproof-backpack 5/5        winter-camp-gloves 5/5
```

**優先順位**：流入のある記事から着手する。ブランド品中心の記事（スノーピーク／コールマン／ユニフレーム／DOD／ナンガ等）は一致率が高く費用対効果が良い。ノーブランド汎用が並ぶ記事は no-amazon で終わることが多いので後回しでよい。

### 進捗の再計測コマンド

```
node -e "const fs=require('fs'),g=fs.readdirSync('content/posts');let a=0,s=0,u=0;for(const f of g){const t=fs.readFileSync('content/posts/'+f,'utf8');for(const c of (t.match(/<ProductCardMdx[\s\S]*?\/>/g)||[])){if(c.includes('source=\"amazon\"'))a++;else if(c.includes('amazonAsin=')||c.includes('amazonUrl='))s++;else u++;}}console.log({amazonSrc:a,set:s,unset:u})"
```

---

## 3. 照合・判定ルール

- **本体商品・型番/主要スペック一致のみ採用。誤リンク厳禁。少しでも迷えば no-amazon（付けない）＝品質優先。**
- **除外**：付属品/カバー/替刃/収納袋のみ、本体と価格が違う「セット買い」バンドル、別サイズ・別色しか無い、中古、ノーブランド汎用で同定不能。
- **サイズ/カラー選択式の統合リスティング**は、該当サイズ/色を含むなら採用可（例: LOGOS氷点下クーラーM＝S/M/L/XL選択、キャプスタ EV-65HL、アイリスCL）。親ASINを使い回さず、商品ページの `dimensionValuesDisplayData` で該当サイズ/色の子ASINを特定して確定する。
- **記事内ASIN重複の回避**：同一記事内で2枚のカードが同一Amazon製品（色違い/セット違い）に当たる場合、片方のみ採用し他方は no-amazon（例: coleman-chair のインフィニティ ベージュ/オリーブは同一ASIN B09MS61HDW のため olive のみ、coleman-two-burner のパワーハウスII 標準/レッドは red のみ）。
- **id と商品名が不一致の記事あり**（例: camp-portable-power-beginner は id が jackery/bluetti でも実商品名は EcoFlow/LACITA）。**必ず `name=` の実商品で照合**し、`id` は変更しない。
- **no-amazon が多いジャンル**：ノーブランド汎用（マット/扇風機/枕/COチェッカー等）、楽天専用ショップブランド（tousen / シェアスタイルの一部 / Pin-Eagle / dream-brother / OC STYLE / ZASHBEAR / SBN21 / FUKUBOOK 等）、ふるさと納税、構成が一致しないセット。

## 4. 安全ルール（厳守）

- 触ってよいのは対象カードへの `amazonAsin` 追加のみ。本文/他プロパティ/楽天リンク/thumbnail は不変更。既存の `amazonAsin` / `amazonUrl` は上書きしない。
- 一括 `sed` 禁止・カードごとに編集。
- コミット前に `git diff --numstat content/posts/` の削除列が全て0であること（追加のみのはず）。
- タグは `.env.local` の `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG` からコード側で `dp/{ASIN}?tag=` に付与される。SiteStripe / amzn.to / PA-API は不要。
- `docs/seo-change-log.md` への追記は不要（リンク付与のみのため）。worksheet が台帳。
- デプロイは `node scripts/deploy.cjs "<メッセージ>"` の1コマンドのみ。独自の検証ワンライナーは組み立てない（CLAUDE.md「Claude Code へのデプロイ受け渡しルール」）。
