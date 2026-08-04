# camp-kit-guide 運用スナップショット

サイトの現状（記事数・カテゴリ構成・GAS/インフラ構造）を記録するスナップショット。記事追加・カテゴリ変更・GAS構造変更のたびに最新化する（→ 運用ルールは CLAUDE.md「記録更新ルール」を参照）。

- **最終更新: 2026-08-04（日次3本追加〔商品5選2本＋ASP専用1本〕。fire-blower＝火吹き棒5選・bonfire〔楽天API実データ:山麓工房 火吹き棒¥2,680/226件・VASTLAND¥799/217件・ZEN Camps真鍮¥2,680/149件・ドットウエスト天然木¥1,599/62件・CAMPINGMOON分割式¥2,980/38件。伸縮式/分割式/木製ハンドルのタイプ軸・実勢799〜2,980円で価格比3.73x・5ブランド分散〕。fire-extinguish-pot＝火消し壺・火消し袋5選・bonfire〔楽天API実データ:ZEN Camps火消し袋アッシュキャリーM¥3,980/473件・秒速消火 火消し壺ステンレス¥3,480/465件・キャプテンスタッグ アルスターM¥2,948/106件・グリーンライフ火おこし兼用HOT-150¥2,979/118件・FIELDOOR炭処理袋4L¥1,000/152件。壺型3+袋型2で後始末カテゴリ・実勢1,000〜3,980円で価格比3.98x・キャンプ場ルール/再燃防止の安全FAQ反映〕。furusato-camp-guide＝ふるさと納税キャンプ用品いつ・限度額の完全ガイド・tent〔楽天ふるさと納税variant=furusato・情報型ピラー(制度/限度額シミュ/申込時期/ワンストップ特例)・サービス構造+CalloutCtaMdx1本。既存の○○ふるさと納税(tent/cooler/power/chair-table)は購入型カテゴリ返礼品でありこのピラーは情報型・限度額軸で非カニバリ、カテゴリ別記事への内部リンクハブ。具体自治体/寄付額は創作せず〕。products.tsvに10行・amazon-worksheetに10行追記〔商品2本の楽天源10品。Amazon存在はamzn.to発行バッチ時に検索確認予定、楽天源のため今回MDXにamazonUrl非設定〕。記事数161→164、bonfire 17→19・tent 41→42。デプロイは `deploy.cjs` で反映）**
- 前回: 2026-08-03（日次3本追加〔商品5選2本＋ASP専用1本〕。camp-oil-stove＝キャンプ向け石油ストーブ5選・bonfire〔楽天API実データ:ALPACA_TS-77NC¥29,920/494件・トヨトミ_レインボーRL-2524¥32,800/14件・トヨトミKS-67H¥30,580/64件・コロナSZ-F32A¥34,800/42件・対流型小型R.R.N¥8,800/180件。全対流式・電源不要・実勢8,800〜34,800円で価格比3.95x。一酸化炭素中毒/就寝時消火の安全FAQを反映〕。outdoor-wagon＝アウトドアワゴン5選・chair-table〔楽天API実データ:コールマン2000034673¥13,429/402件・WAQ106L耐荷150kg¥11,800/1,511件・ライシンEシリーズ最大230L¥13,800/2,049件・FIELDOOR¥8,910/928件・タンスのゲンRENEWノーパンク¥7,999/782件。耐荷重/容量/タイヤ/収納性で比較・実勢7,999〜13,800円〕。chair-table-furusato＝ふるさと納税アウトドアチェア・テーブル・chair-table〔楽天ふるさと納税variant=furusato・サービス構造+CalloutCtaMdx1本。既存cooler/power/tent-furusatoとカテゴリ別で非カニバリ。控除の仕組み/寄付上限/ワンストップ特例の制度説明＋楽天ふるさと納税アウトドアチェア検索へ誘導・具体自治体/寄付額は創作せず〕。products.tsvに10行・amazon-worksheetに10行追記〔商品2本の楽天源10品。Amazon存在はamzn.to発行バッチ時に目視確認予定、楽天源のため今回MDXにamazonUrl非設定〕。記事数158→161、bonfire 16→17・chair-table 19→21。デプロイは `deploy.cjs` で反映）**
- 前回: 2026-07-31（第2便・日次3本追加〔portable-cooler-aircon＝ポータブルクーラー5選・power／ground-sheet＝グランドシート5選・tent／cooler-furusato＝クーラーボックスふるさと納税・cookware〕。ポータブルクーラー＝コンプレッサー式スポットクーラーで統一〔アイリスオーヤマ¥29800/タンスのゲン¥29999/EENOUR¥69990/THREEUP¥25800/QUADS¥24800〕実勢24,800〜69,990円・楽天API実データ・車中泊/猛暑向けでpower記事へ内部リンク。グランドシート＝楽天供給off-intent〔ワンタッチテント/レジャーシート混在でfootprint実績薄〕のためAmazon源で作成〔GEERTOP防水8000mm¥2999・6,311件/TRIWONDER¥1680/ZEN Camps帆布¥5485/GOGlamping420D¥1504/Clostnature¥1899〕source=amazon+ASIN・実勢1,504〜5,485円。cooler-furusato＝楽天ふるさと納税variant=furusato・サービス構造+CalloutCtaMdx1本、既存power-furusato/tent-furusatoと対象カテゴリ別で非カニバリ・断熱方式/容量/控除上限の制度説明+楽天ふるさと納税検索へ誘導（具体自治体・寄付額は創作せず）。skip1件=camp-kotatsu〔『キャンプこたつ』は室内こたつ布団/パネルヒーターが大半で専用こたつ本体の実績品が5点そろわず用途一貫性を満たせない〕。products.tsvに10行・amazon-worksheetに10行追記〔アイリス/タンスのゲン/QUADSはAmazon存在確認・EENOUR/THREEUPは楽天中心で要確認・グランドシート5点はAmazon源〕。記事数155→158、power 16→17・tent 40→41・cookware 22→23。★要対応:商品KW在庫補充が必要（keyword-backlog source≠asp pending=0）。デプロイは `deploy.cjs` で反映）**
- **前回: 2026-07-31（日次3本＝全てASP専用記事〔tebura-camp＝手ぶらキャンプ・tent／tent-furusato＝テントふるさと納税・tent／power-furusato＝ポータブル電源ふるさと納税・power〕。★商品KWバックログが枯渇（source≠aspのpending=0）につき、この日は商品5選を作れず、提携済ASP案件のみで3本を構成した。tebura-camp＝hinataレンタル〔提携済8%〕variant=rentalで、camp-gear-rental〔買うvs借りる損益分岐総論〕と別角度＝道具ゼロで一泊を体験する初心者導線。tent-furusato/power-furusato＝楽天ふるさと納税〔利用可・rafcidリンク〕variant=furusato。既存にふるさと納税記事は無く新規クラスタの起点。2本はテント/電源で対象カテゴリが異なり相互非カニバリ。いずれも実質2,000円・控除上限・ワンストップ特例の制度説明＋楽天ふるさと納税検索へ誘導（具体自治体・寄付額は創作せず）。CalloutCtaMdxは各1本。products.tsv/amazon-worksheetは追記なし（ASP記事のため楽天API不使用）。記事数152→155、tent 38→40・power 15→16。★要対応:商品KW在庫補充が必要（keyword-backlogのsource≠asp pending=0）。デプロイは `deploy.cjs` で反映）**
- 前回: 2026-07-30（日次3本追加〔peg-hammer＝ペグハンマー5選・tent／tent-wood-stove＝テント内薪ストーブ5選・bonfire／yamadougu-rental＝登山道具レンタル・tent〕。ペグハンマー＝村の鍛冶屋エリッゼアルティメット〔★4.82/1638件〕/スノーピークPRO.S N-002/REIDEN/Freell/軽量360gで実勢1,680〜6,600円・比較型。薪ストーブ＝楽天供給の実態としてホンマ製作所が時計型/クッキングストーブを寡占→ブランド占有緩和を適用し同ブランド5モデル〔クッキングRS-41/ガラス窓時計1型/ステンレスセット/AR-360/レジャーカマドRM-410〕8,980〜17,800円・一酸化炭素/煙突の安全FAQ入り。Winnerwell等の高級帯は価格差5倍超で除外し記事内で言及。yamadougu-rental＝やまどうぐレンタル屋〔提携済5%〕をvariant=rentalでCalloutCtaMdx1本設置、camp-gear-rental〔campギア〕と登山ギアで非カニバリ。products.tsvに10行・amazon-link-worksheetに10行追記〔全10品Amazon検索ヒット確認済〕。スキップ2件=workman-camp-wear〔ワークマン自社チャネル専売で楽天/Amazon供給なし〕/irori-table〔楽天供給薄で5選不成立〕。記事数149→152、tent 36→38・bonfire 15→16。デプロイは `deploy.cjs` で反映）**
- 前回: 2026-07-29（新規記事1本追加〔camp-gear-rental＝キャンプ用品レンタル完全ガイド・category=tent〕。物販5選テンプレでなく「サービス構造」〔向き不向き/借りられるギア/料金目安と買うvs借りるの損益分岐表/利用の流れ/FAQ5問/まとめ早見表〕で作成。A8サービス系案件の収益化基盤として汎用CTA部品 `CalloutCta`（`CalloutCtaMdx`）を新設し `pages/posts/[slug].tsx` に登録〔tsc --noEmit エラー0〕。hinataレンタル〔申込8%・提携済〕の成約導線を variant=rental で1本設置。記事数148→149、tent 35→36。詳細は `docs/seo-change-log.md` 2026-07-29／`docs/monetization-asp-expansion.md` 実装ログ。デプロイは `.git/index.lock` 削除後に `deploy.cjs` で反映）**
- 前回: 2026-07-29（記事2本追加〔camp-coffee-dripper＝キャンプ用コーヒードリッパー5選・cookware／moraknife＝モーラナイフ5選・cookware、いずれも楽天API実データ・source="rakuten"・rafcidアフィリリンク〕。ドリッパー＝ユニフレーム コーヒーバネットcute/ステンレスメッシュ二重〔レビュー624件〕/キャンピングムーン分解式/薄型ステンレス¥1000/折りたたみスタンドで携帯性軸・実勢1,000〜2,420円構成。モーラナイフ＝コンパニオン ステンレス〔718件〕/ヘビーデューティー/カーボン/スパーク〔ファイヤースターター内蔵〕/エルドリスでブランド軸・法令FAQ入り・実勢2,200〜4,620円構成。products.tsvに10行追記・amazon-link-worksheetに10行追記〔Amazon存在確認済:モーラナイフ全5〔コンパニオンStainless ASIN:B004ZAIXSC〕・ユニフレーム・キャンピングムーン、汎用ステンレスドリッパー3点は同型特定困難で要確認〕。記事数146→148、cookware 20→22）**
- 前回: 2026-07-28（記事2本追加〔compact-portable-power＝小型ポータブル電源5選・power／infinity-chair＝インフィニティチェア5選・chair-table、いずれも楽天API実データ・source="rakuten"・rafcidアフィリリンク〕。電源＝Jackery240New/AnkerC300/BLUETTI EB3A〔130Wパネルセット〕/BLUETTI AORA30V2/Jackery100Plus〔99Wh・機内持込可〕でソロ小型99〜288Wh級構成。チェア＝コールマン/サイドテーブル付/TIMBER RIDGE〔耐荷重160kg〕/ヘッドレスト付/Re:Gearで無重力系構成。products.tsvに10行追記・amazon-link-worksheetに10行追記〔Amazon存在確認済:Jackery/Anker/BLUETTI/コールマン/TIMBER RIDGE/Re:Gear、GL・vision shopは楽天専売の可能性〕。記事数144→146、power 14→15・chair-table 18→19）**
- 前回: 2026-07-27（FAIL5記事を楽天API実データでアフィリリンク化〔screen-tarp／water-jug／cooler-ice-pack／fireproof-gloves／hand-axe〕。affiliateUrl="#"のドラフト状態を解消し、各5品を hb.afl 形式アフィリリンク・実価格・実レビューで整合〔description/badge/本文/比較表/まとめ表/intro/FAQ全面〕。products.tsv に25行追記。記事数144のまま増減なし）**
- 前回: 2026-07-27（記事5本追加〔screen-tarp＝スクリーンタープ5選・tent／water-jug＝ウォータージャグ5選・cookware／fireproof-gloves＝焚き火グローブ5選・bonfire／cooler-ice-pack＝保冷剤5選〔ロゴス氷点下XL/倍速凍結/キャプスタ/ダイワ/アイリス〕・cookware／hand-axe＝キャンプ用手斧5選〔ハスクバーナ/フィスカースX7/エストウィング/千吉/VASTLAND、刃物のため法令FAQ入り〕・bonfire。いずれも新規ドラフト、価格は参考実勢値・affiliateUrl="#"（後段Amazonリンク化フローで差替）。product-scanバックログ上位5本を消化〕。記事数139→144、tent 34→35・cookware 18→20・bonfire 13→15）**
- 前回: 2026-07-27（記事2本追加〔uniflame-fire-grill＝ユニフレームのファイアグリル5構成〔本体/solo/セット/ヘビーロストル/収納ケース〕・bonfire／oil-lantern＝オイルランタン5ブランド比較〔VASTLAND/フュアーハンド/ThousWinds/DIETZ/キャプスタ〕・lighting、いずれも楽天API実データ〕。記事数137→139、bonfire 12→13・lighting 12→13）**
- 前回: 2026-07-24（kids-sleeping-bag 全面リライト〔楽天API実データで商品5点差し替え・年齢別早見表追加〕／mountain-camp-lantern に軽量ランキング比較表＋ゴールゼロ追加。記事数137のまま増減なし）**
- 前回: 2026-07-24（寝袋カニバ整理：温度・季節・3シーズンの3記事を `sleeping-bag-temperature-guide`「寝袋（シュラフ）の選び方 完全ガイド」へ統合。統合元3本を削除し `next.config.ts` で恒久リダイレクト〔308〕。記事数140→137、sleeping-bag 19→16）**
- 前回: 2026-07-24（記事2本追加〔northface-backpack＝ノースフェイスのリュック5選／one-touch-tarp＝ワンタッチタープ5選、いずれも楽天API実データ〕。記事数138→140）**
- 前回: 2026-07-23（記事2本追加〔takibi-table＝焚き火テーブル5選／snowpeak-bonfire＝スノーピーク焚火台5構成、いずれも楽天API実データ〕。記事数136→138）
- 前回: 2026-07-22（楽天API実データ化フロー確立・記事2本追加〔snowpeak-tent＝楽天API実データ5選／montbell-sleeping-bag＝Amazon実データ4選〕。記事数134→136）
- 前回: 2026-07-21（title一括短縮61記事〔SERP見切れ対策〕・PR表記/シェアURL実装・横断ハブ記事 portable-power-guide 追加。記事数133→134）
- 前回: 2026-07-21（ブランド不整合是正 全17記事完了〔景表法/E-E-A-Tリスク解消〕・差別化リライト継続・Amazonリンク batch3 設置 +70商品）
- 前回更新: 2026-06-23（6/23 SEO測定→既存記事テコ入れフェーズへ移行・差別化リライト着手）
- 初版作成: 2026-04-28（当時42記事）

---

## 記事数（2026-08-04 時点）

- **総記事数: 164記事**（`ls content/posts/*.mdx | wc -l` で確認）

### カテゴリ別内訳（frontmatter `category` を集計）

| slug | 表示名 | 記事数 |
|------|--------|-------:|
| tent | テント | 42 |
| sleeping-bag | 寝袋・シュラフ | 16 |
| cookware | 調理器具 | 23 |
| chair-table | チェア・テーブル | 21 |
| lighting | 照明・ランタン | 13 |
| power | 電源・バッテリー | 17 |
| bonfire | 焚き火台 | 19 |
| backpack | バックパック | 11 |
| clothing | ウェア・装備 | 2 |
| **合計** | | **164** |

> 直近の増加分: 2026-06-08 のバッチで 90→94（施策3: 焚き火シート/火ばさみ/防寒グローブ/大容量ポータブル電源）→ 99（施策4: 防水リュック/二次燃焼焚き火台/折りたたみソーラーパネル/ダッチオーブン/封筒型寝袋）→ 102（施策5: ファミリー向けキャンプコット/VASTLANDのテント/スキレット）→ 104（施策6: アウトドア用電気毛布/シェラカップ・自動選定パイプライン経由）→ 109（施策7: WAQのチェア/FIELDOORのテント/Naturehikeのマット/コールマンのテント/DODのタープ・ブランド軸5記事）→ 114（施策8: Jackeryのポータブル電源/DODのチェア/ロゴスの焚き火台/キャプテンスタッグのテーブル/EcoFlowのポータブル電源・ブランド軸5記事）→ 119（施策9: コールマンのランタン/キャプテンスタッグのチェア/ジェントスのランタン/コールマンのチェア/Naturehikeの寝袋・ブランド軸5記事）→ 124（施策10: SOTOのバーナー/ヘリノックスのチェア/Ankerのポータブル電源/カリマーのリュック/イワタニのバーナー・空きカテゴリのブランド軸5記事）→ 128（施策11: ユニフレームのバーナー/BLUETTIのポータブル電源/グレゴリーのリュック/オスプレーのリュック・手薄カテゴリのブランド軸4記事）→ 133（施策12: コールマンの焚き火台/DODのテーブル/ドイターのリュック/ベアボーンズのランタン/ミステリーランチのリュック・空きカテゴリのブランド軸5記事）。詳細は `docs/seo-change-log.md` を参照。

> ✅ 2026-06-24 解決済み: 残存していた `cooler` カテゴリ1件（`cooler-box-day-camp.mdx`）を方針どおり `cookware` へ付け替え。これで全133記事が CLAUDE.md 定義の正式カテゴリ（cooler 除く）に収まり、未定義slugは無くなった（cookware 17→18）。

---

## カテゴリ整理・frontmatterの解決済み事項

過去に存在した不整合は以下のとおり整理済み。

- **※2026-06時点で解決済み: tarp→tent / cooler→cookware**。タープ記事は `tent` カテゴリに統合、クーラーボックス記事は `cookware` に寄せる方針（cooler残存1件も2026-06-24に付け替え完了。上記の解決済み注記を参照）。
- **有効な frontmatter キーは `tags` / `thumbnail` / `updatedAt`**。かつて一部記事で使われていた `keywords` / `eyecatch` はコードから一切参照されない死にキーのため使用禁止（commit `fb3c3d6` で全記事修正済）。新規・既存とも `tags`（タグ機能）/ `thumbnail`（OGP・カード画像）/ `updatedAt`（JSON-LD `dateModified`）を使うこと。

---

## GAS / インフラ構造

- **GAS「📊 SEOレポート」**: 手動実行で Google Search Console から順位・表示・クリック・CTRを取得し、スプレッドシートの「SEO履歴」シートに追記。GCPプロジェクト `camp-kit-gsc` で稼働。
- **SEO効果測定の仕組み（2026-06-08 構築）**: 上記 GAS SEOレポート＋SEO履歴シートで数値推移を追い、施策内容は `docs/seo-change-log.md`（施策台帳）に記録。両者を突き合わせて施策の効果を評価する運用を開始。

---

## 2026-06-23：Amazonアフィリエイト基盤整備（記事増産なし・133記事のまま）

サイトの収益化に向けてAmazonアフィリエイト連携を一気に整備。記事の増産はなし（133記事のまま）。全変更push済み・`npm run build` EXIT=0。

- **Amazonアソシエイト申請完了**: 登録ID `campkit26`、リンクは `campkit26-22` 形式。種別はコンテンツメディア/ブロガー。現在は仮登録状態で、本審査は180日以内に3件の適格販売で自動開始。サイト参加表記（アソシエイト・プログラム参加の明記）は `pages/privacy-policy.tsx` / `pages/about.tsx` に既設のため対応不要。
- **ProductCard.tsx を amazonUrl 対応に改修**: `types/product.ts` に `amazonUrl` を追加。`getAmazonUrl` は `amazonUrl` 指定時のみ実リンクを返し、無ければ `null` でAmazonボタン非表示。タグなしAmazon検索URLのフォールバックを廃止。`pages/posts/[slug].tsx` で `amazonUrl` を受け渡し。これで全記事に垂れ流していたタグなしAmazon検索URLを停止。
- **架空Amazonリンク・架空商品の修正（3記事）**: `solo-tent-beginner` / `bonfire-stand-beginner` / `sleeping-bag-summer-cospa` の比較表を、本文ProductCardの実在楽天商品で再構築。架空ASIN・ダミータグ・検索URLを撤去。
- **手動Amazon実リンク併記（3記事・12商品）**: `coleman-tent`(4) / `dod-tarp`(3) / `fieldoor-tent`(5)。SiteStripe発行の `amzn.to` 短縮リンクを設置。
- **Cowork経由Amazonリンク設置（19記事・82商品 / commit af9a482）**: 「Cowork（ログアウト検索）→まーくん（SiteStripeで `amzn.to` 発行・商品確認）→Claude Code（ProductCardに `amazonUrl` 設置）」の三者分業フローを初めて完走。型番が明確な商品群はほぼ100%一致。「該当なし」5件（TOMOUNT / tousen / family-mat 2件 / コールマンラギッド）はAmazonに無く楽天のまま据え置き。
- **全記事Amazon連携ワークシート整備**: `_file/amazon-link-worksheet.tsv`（Git管理外、130記事626商品、クリーニング済）。うち今回94商品が設置済み（手動12＋Cowork82）、残り約530商品が今後の設置対象。
- **記事数**: 133記事のまま（増産なし）。

### 追記：Coworkバッチ2 Amazonリンク設置（commit 244742a）
- Coworkバッチ2で **10記事・49商品** を設置（commit 244742a）。対象＝camp-chair-highback / solar-portable-power / sleeping-bag-temperature-guide / nanga-sleeping-bag / dutch-oven / solo-tent-overall / solo-tent-lightweight / sleeping-bag-winter-beginner / lightweight-mountain-tent / large-tent-guide。
- **Amazonリンク設置 累計143商品**（手動12＋Cowork82＋Coworkバッチ2の49）。ワークシート残りは約480商品。
- 記事数は133のまま（増産なし）。

### 追記：Amazonリンク batch3 設置（+70商品 / 2026-07-21）
- batch3ワークシート（`_file/amazon-links-batch3-done.tsv`）でG列にアフィリエイトURLが入った全行を、`scripts/place-amazon-batch3.cjs` で ProductCard に `amazonUrl` 設置。**21記事・70商品**（判定内訳：一致55／要確認6／該当なし9〔該当なし全27件中URLがあった9件のみ設置〕、G列URLがある行はすべて設置）。dod-tarp の重複rank1は既設カードを温存し新URLを別カードへ正しく配置。
- 対象記事: solo-tent-beginner / bonfire-stand-beginner / camp-burner-beginner / camp-chair-lightweight / camp-cooker-beginner / camp-cooler-box-beginner / camp-lantern-led / sleeping-bag-summer-cospa（各5）、barebones-light / camp-sleeping-mat（各4）、camp-lighting-guide / family-camp-summer-tent / group-camp-table / camp-table-folding（各3）、family-camp-mat / camp-headlight-beginner / backpack-large（各2）、camp-table-set / coleman-lantern / dod-tarp / two-room-tent-guide（各1）。
- **Amazonリンク設置 累計213商品（batch3で+70）**。カバー率 213/626 = **34.0%**（前回 143/626 = 22.8%）。ワークシート残りは約410商品。
- `npm run build` EXIT=0。記事数は133のまま（増産なし）。

---

## 関連ドキュメント

- `CLAUDE.md` — 作業ガイド・記事作成ルール・記録更新ルール
- `docs/seo-change-log.md` — SEO施策台帳（いつ・どの記事を・なぜ・どう変えたか）
- `docs/operation-snapshot.md` — 本ファイル（記事数・カテゴリ・GAS構造の現状）
