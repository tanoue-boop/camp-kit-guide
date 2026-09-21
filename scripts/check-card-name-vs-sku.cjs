#!/usr/bin/env node
/**
 * check-card-name-vs-sku.cjs — ProductCard の `name`/`price` と実リンク先（楽天）SKU の整合チェック（検出専用）
 *
 * 目的（campkit-20260921-24 ／ キュー#15）:
 *   `content/posts/*.mdx` の全 <ProductCardMdx …/> について、`affiliateUrl` の `pc=` から実リンク先の楽天商品ページを
 *   1回だけ GET し、itemName / SKU属性（ブランド・メーカー型番・カラー・サイズ）/ セレクタ軸 / 現行価格 / 在庫を取り出して
 *   カードの `name`・`price` と突き合わせ、ズレの種類をフラグで `_file/card-name-check.tsv` に記録する。
 *   **mdx は一切変更しない。Amazon にはアクセスしない。**
 *
 * 使い方:
 *   node scripts/check-card-name-vs-sku.cjs --dry                 # fetch せず mdx パースと件数だけ
 *   node scripts/check-card-name-vs-sku.cjs --test                # 判定関数の単体テスト
 *   node scripts/check-card-name-vs-sku.cjs --only inflatable-mat#1,attack-pack#5   # 名指し（既存行があっても再取得）
 *   node scripts/check-card-name-vs-sku.cjs --only dod-tarp#dod-okla-tarp          # id で名指し（rank が重複する記事向け）
 *     ※ `slug#rank` で同じ rank のカードが複数あるときは該当する全枚が対象（rank は記事内で一意ではない）
 *   node scripts/check-card-name-vs-sku.cjs --limit 100           # 未チェックを slug昇順・rank昇順で N 枚
 *   node scripts/check-card-name-vs-sku.cjs --limit 100 --max-minutes 20   # 経過時間で打ち切り（TSV には処理済み分を保存）
 *   node scripts/check-card-name-vs-sku.cjs --recheck --limit 50  # 既存行も再取得
 *   node scripts/check-card-name-vs-sku.cjs --url <楽天URL> --name "<カード名>" --price 1234   # 1件を手で試す
 *
 * 出力 `_file/card-name-check.tsv`（タブ区切り・BOM無し）: キー = slug + rank + id。既に行があるカードは
 *   `--recheck` / `--only` を付けない限り再 fetch しない（次回タスクは続きから走れる）。
 *
 * フラグ（複数付与可。1つも付かなければ OK）:
 *   404               HTTP 404、または商品ページが消えている（itemInfoSku が無い／エラーページ）
 *   type_mismatch     カード name 先頭 HEAD_LEN 字の「型語」（ブランド・数値・単位を除いた語）が itemName／メーカー型番／
 *                     シリーズ名のどこにも現れない（共通語数 < TYPE_MIN_COMMON）
 *   model_mismatch    カード name の型番トークンが itemName／メーカー型番／SKU属性／説明文の「型番」欄のどこにも無い
 *                     （カード→実リンク先の向きのみ。逆向きはバンドル管理番号・JAN で誤検知するため付与しない。
 *                     管理番号・URL・説明文の自由文は照合先に含めない＝改名ページ（AC70→AORA 100 mini）を見逃さないため）
 *   spec_mismatch     カード name の単独の数値スペック（幅NNcm／NNL／N人用／N合／NNNW／NNNWh／NNcm／Nm 等）が
 *                     itemName・SKU属性・仕様欄（商品説明）のいずれにも無い。バリエーション軸にその数値が値として並ぶ
 *                     ページでは選択SKUのセレクタ値＋SKU属性だけで判定。範囲（40〜60L／50L以上）や同単位の並記
 *                     （8/10cm／1.9L 3.8L）は単独スペックではないので size_unspecified 側で扱う
 *   variant_unavailable カード name が名指しした変種（軸の値、または軸の値に現れる数値スペック「2人用」）に対応する SKU がページの
 *                     SKU 一覧に無い（軸の値としては並ぶが選べない）。「カードの商品が買えない」実態は全変種欠品と同じ（第5弾で追加・検出のみ）
 *   set_mismatch      カード name がセット表記なのに実SKUが単品（セット/単品/数量を選ぶ軸があればその既定値、無ければ
 *                     itemName／メーカー型番にセット語・「A+B」なし）、または逆（カードが単品表記なのに既定SKUがセット）
 *                     セット軸＝「なし/本体のみ/単品」の値がある・値の半数以上がセット語（全値ではない）・数量軸（1個の選択肢あり）
 *   color_unspecified カード name に色語が無い（軸の値の名指しも無い）のに色軸のセレクタ値が COLOR_AXIS_MIN 以上、
 *                     または name に「色A/色B」の並記
 *   size_unspecified  同様にサイズ軸（S/M/L・cm・L・ノーマル/ビッグ 等）。name の「サイズA/サイズB」並記・範囲・同単位並記も含む
 *   store_copy        カード name に楽天店の販促文言（【楽天1位】／送料無料／期間限定／P10倍／セール／NN%OFF／＼…／ 等）が残っている
 *   sale_page         実リンク先が色/型番の異なる商品を束ねたセール統合ページ: itemName に単一型番が無く、かつ
 *                     URL/管理番号にセール語 かつ セレクタ値合計 >= SALE_VALUES_MIN、または SKU数 >= SALE_SKU_MIN かつ
 *                     色・サイズ以外の軸（タイプ/シリーズ/本数 等）がある
 *   price_mismatch    カード price と選択SKUの現行価格の乖離が PRICE_TOL 以上
 *   url_unparsable    affiliateUrl から実リンク先URLを取り出せない（fetch しない）
 *
 * 選択SKU（価格・スペック判定の根拠。TSV 末尾列 sku_selected）: URL の variantId 指定 > 各軸で「カード name が名指しした値」
 *   （無ければ先頭値。セット/単品を選ぶ軸は常に先頭値＝着地時の既定）との一致度が最大の SKU。name が同じ軸の値を複数並記して
 *   いる（「5cm/10cm」「3mx3m 2m×2m」）ときは、同点の中から 価格がカード price と一致する変種 > name で先に出る値 の順。
 *
 * 楽天へのアクセス: UA 付き・各URL 1回だけ・リクエスト間隔 INTERVAL_MS 以上・同一ホストへ並列 GET しない。
 *   429 / 503 が返ったらその時点で走査を止めて処理済み分を保存し exit 2（リトライで押し切らない）。
 *   取得 HTML は `_file/_work/html-24/<slug>__<rank>__<id>.html`（id が空なら `<slug>__<rank>__i<記事内通し番号>.html`）に保存（.gitignore 下）。
 *   ※ 第3弾（campkit-20260921-26）まで `<slug>__<rank>.html` だったが、rank は記事内で一意ではなく（dod-tarp は rank="1" が2枚）
 *     後から書いたカードの HTML で前のカードを再判定してしまう取り違えが起きたため、id 単位に変更した。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const OUT = path.join(ROOT, '_file', 'card-name-check.tsv');
const HTML_DIR = path.join(ROOT, '_file', '_work', 'html-24');
const TASK_ID = 'campkit-20260921-29'; // 走査・再判定を行ったタスク（TSV の judged_task 列に入る）

// ---------------------------------------------------------------------------
// 閾値・定数（A-4 の回帰検証で調整する。slug / id を条件に埋め込まない）
// ---------------------------------------------------------------------------
const INTERVAL_MS = 1600;        // リクエスト間隔（>= 1.5 秒）
const FETCH_TIMEOUT_MS = 25000;  // 1リクエストのタイムアウト
const HEAD_LEN = 20;             // type_mismatch: カード name の先頭何字から型語を取るか
const TYPE_MIN_COMMON = 1;       // type_mismatch: 型語のうち実リンク先に見つかる語がこの数未満なら付与
const TYPE_BIGRAM_MIN = 0.6;     // type_mismatch: 完全一致しない型語でも、文字2-gram の被覆率がこれ以上なら「見つかった」扱い
const COLOR_AXIS_MIN = 2;        // color_unspecified: 色軸の値がこの数以上
const SIZE_AXIS_MIN = 2;         // size_unspecified: サイズ軸の値がこの数以上
const SALE_SKU_MIN = 30;         // sale_page: SKU 数がこれ以上（型番なし）
const SALE_VALUES_MIN = 6;       // sale_page: セール語あり かつ セレクタ値の合計がこれ以上（型番なし）
const PRICE_TOL = 0.03;          // price_mismatch: ±3%（23 §3-3(3) で採択）

// 変更禁止リスト（2026-10-18 まで本文・frontmatter とも変更禁止。task-campkit-20260921-16 より）。
// 走査自体は行い（読むだけ）、`frozen` 列に 1 を立てるだけ。
const FROZEN_SLUGS = new Set([
  // 施策本体（測定中）
  'osprey-backpack', 'camp-backpack-capacity-guide', 'soto-burner', 'mysteryranch-backpack',
  'karrimor-backpack', 'gregory-backpack', 'deuter-backpack', 'portable-fridge',
  'camp-gear-sale-timing', 'camp-table-set', 'camp-table-folding', 'car-camp-lighting',
  'torch-burner', 'bluetti-power', 'sleeping-bag-temperature-guide', 'duo-tent',
  'fire-extinguish-pot',
  // リンク元として 09-21 に変更済み（計27本）
  'camp-cooler-box-overall', 'portable-power-vehicle-camp', 'cooler-ice-pack', 'snowpeak-tent',
  'dod-table', 'low-style-table', 'outdoor-kitchen-table', 'solo-tent-overall',
  'solo-tent-beginner', 'coleman-tent', 'dod-tent', 'secondary-combustion-bonfire',
  'charcoal-starter', 'bonfire-sheet', 'bonfire-stand-beginner', 'car-camp-bed-kit',
  'car-camp-mat', 'camp-lantern-led', 'electric-blanket-camp', 'fire-blower', 'camp-bbq-grill',
  'family-camp-bbq', 'hand-axe', 'disaster-portable-power', 'jackery-power-station',
  'ecoflow-power', 'portable-power-large',
  // 09-20 に title/description を変更し CTR を測定中
  'family-camp-summer-tent', 'coleman-chair', 'tent-size-beginner-guide',
  // 別タスクで扱うため触らない
  'kids-sleeping-bag', 'camp-backpack-beginner', 'solo-tent-lightweight', 'mountain-camp-lantern',
  'camp-portable-power-beginner',
]);

// 販促文言（store_copy）。【…】内に含まれる場合と、name 中に裸で現れる場合の両方を見る
const STORE_COPY_WORDS = /楽天\s*(?:\d+位|ランキング|1位)|ランキング\s*\d*位|送料無料|期間限定|P\s*\d+倍|ポイント\s*\d+倍|スーパーSALE|(?<![A-Za-z])SALE(?![A-Za-z])|セール|クーポン|あす楽|即納|最安値?|激安|在庫限り|数量限定|在庫処分|今だけ|限定価格|レビュー特典|マラソン|\d+\s*[%％]\s*[O0]FF|OFF[!！]|円\s*[O0]FF|円引き?|通常価格|定価|まで延長|値下げ|割引|＼[^／]*／/i;
const STORE_COPY_BRACKET_RE = /【[^】]*】|＼[^／]*／|\[[^\]]*\]/g;

// 色語（color_unspecified）。カード name とセレクタ値の両方で使う
const COLOR_WORDS = [
  'ブラック', '黒', 'ホワイト', '白', 'グレー', 'グレイ', 'ベージュ', 'カーキ', 'オリーブ', 'グリーン', '緑', 'ブルー', '青',
  'ネイビー', '紺', 'レッド', '赤', 'オレンジ', 'イエロー', '黄', 'ブラウン', '茶', 'タン', 'サンド', 'コヨーテ', 'ピンク',
  'パープル', '紫', 'ワインレッド', 'ボルドー', 'シルバー', '銀', 'ゴールド', '金', 'チャコール', 'ターコイズ', 'ライム',
  'カモフラ', 'カモ', '迷彩', 'ネイティブ', 'マルチカム', 'スモーク', 'クリア', 'アイボリー', 'モカ', 'マスタード', 'テラコッタ',
  'ダークグリーン', 'モスグリーン', 'フォレスト', 'セージ', 'バーガンディ', 'コーラル', 'ラベンダー', 'ミント', 'サックス',
  'チャコールグレー', 'ガンメタ', 'ブロンズ', 'カッパー', 'ローズ', 'マルーン', 'ウルフ', 'デザート', 'アーミー',
  'black', 'white', 'gray', 'grey', 'green', 'blue', 'navy', 'red', 'orange', 'yellow', 'brown', 'tan', 'sand', 'khaki',
  'olive', 'coyote', 'beige', 'pink', 'purple', 'silver', 'gold', 'charcoal', 'camo', 'ivory', 'wolf', 'desert', 'army',
];
const COLOR_RE = new RegExp(COLOR_WORDS.map(escapeRe).join('|'), 'i');
const COLOR_AXIS_KEY_RE = /カラー|色|color|colour/i;
// サイズ語（size_unspecified）
const SIZE_AXIS_KEY_RE = /サイズ|size|容量|寸法|人用|人数|長さ|規格/i;
const SIZE_VALUE_RE = /^(?:[SML]{1,3}|XS|XL|XXL|LL|3L|4L|5L|\d+L|\d+(?:\.\d+)?\s*(?:cm|mm|m|インチ|inch)|\d+\s*人用?|ノーマル|ビッグ|ラージ|レギュラー|ワイド|ロング|ショート|大|中|小|特大|大型|小型|Sサイズ|Mサイズ|Lサイズ|XLサイズ|フリー|F)(?:サイズ)?$/i;
const SIZE_WORD_IN_NAME_RE = /(?<![A-Za-z])(?:XS|S|M|L|XL|XXL|LL|3L|4L|5L)(?:サイズ|size)?(?![A-Za-z])|サイズ|\d+(?:\.\d+)?\s*(?:cm|mm|m|L|ℓ|リットル)(?![A-Za-z])|\d+\s*人用|ノーマル|ビッグ|ラージ|レギュラー|ワイド|ロング|ショート|大型|小型|特大/;
// 「A/B」並記（色 or サイズ）
const SLASH_PAIR_RE = /([^\s／/、,・]{1,12})\s*[／/]\s*([^\s／/、,・]{1,12})/g;
// 同じ単位の数値が2つ並ぶサイズ並記（"1.9L 3.8L" / "8/10cm"）。× で結ばれた寸法（3m×2.5m）は対象外
//   前の数値にも同じ単位が付く（1.9L 3.8L）か、単位無しなら区切りが / のとき（8/10cm）だけ。"501212 20L" のような型番＋容量は対象外
//   「1人用 2人用」は用途の説明であって変種ではないので 人用 は対象外
const SIZE_PAIR_RE = /(\d+(?:\.\d+)?)\s*(?:(L|cm|mm)\s*[／/・\s]|[／/])\s*(\d+(?:\.\d+)?)\s*(L|cm|mm)(?![A-Za-z])/;

// 型番トークン（list-amazon-backfill-candidates.cjs と同じ判定を自己完結で持つ）
const MODEL_TOKEN_RE = /(?<![A-Za-z0-9])[A-Z0-9]+(?:-[A-Z0-9]+)*(?![A-Za-z0-9])/g;
// ※ `(?:DC|AC)\d+V?` は元の候補スクリプトでは電圧表記の除外だが、BLUETTI AC70／AC180 のような型番を落とすため
//    V 付き（AC100V／DC12V）と代表的な電圧値だけに絞る（第1バッチの bluetti-power #1: name「AC70」↔ 実リンク先「AORA 100 mini」）
const NOT_MODEL_RE = /^(?:\d+[A-Z]{1,2}|(?:UV|UPF|SPF|PU|IPX?|USB|R|T|D|SS|SH|L|M|S|XL|XXL|LL|3L|4L|5L)\d+|(?:DC|AC)\d+V|(?:DC|AC)(?:12|24|100|110|120|220|230|240)|\d+X\d+|\d+-\d+|\d+(?:-\d+)*[A-Z]{0,2}|A\d{4})$/;
const UNIT_TOKEN_RE = /^\d+(?:W|WH|V|A|AH|MAH|MM|CM|M|KG|G|L|ML|D|T|H|X|P|K|LM|℃)$/i;
const PURE_DIGIT_MODEL_MIN = 7; // 純数字の型番（コールマン 2000015521 等）はこの桁数以上

// セット表記（カード name 側）。「カセット（ガス/コンロ）」の セット は除く。
// `+`/`＋` は語と語の間にあり、かつ片側が数字でないときだけ（"40+5"（容量）・"DARKROOM ST+("（型番末尾）は除く。
// "Gen 2 ＋ PS100"／"268Wh ＋ 130W" は片側が英字なのでセット）
//   `+` の判定は plusJoin() に分離（第2バッチ: "usb led+ランタン" の複合語・括弧内の "ソーラー＋手回し＋乾電池" の仕様並記を除く）
//   「4点脚ロック」（脚の固定方式）の 点 は数量ではない（第3バッチ fieldoor-tent #5）
const SET_WORD_RE = /(?<!カ)セット|(?<![A-Za-z])set(?![A-Za-z])|[0-9０-９]+\s*点(?!脚)/i;
// セレクタ値のセット/単品判定（"MDX+" のような末尾 + は除く）
const SET_VAL_RE = /(?<!カ)セット|(?<![A-Za-z])set(?![A-Za-z])|付き|付属|同梱|\S\s*[+＋]\s*\S|入り|付$/i;
// 「カラーなし」「サイズなし」は色/サイズ軸のプレースホルダであってセット/単品の軸ではない（第2バッチ camp-knife-beginner #5）
// 「基本セット/インナーテント×1」「標準セット」のように 基本/標準 で始まるセット内容の値は本体のみ相当（着地時の既定構成）。
//   同じ店の別ページでは「テント本体セットのみ」と書かれる値で、これを既定と認識しないと オプション軸が束ね軸扱いになり sale_page になる（第4バッチ two-room-tent-guide #1）
const NONE_VAL_RE = /^(?:なし|無し|無|-|―|本体のみ|単品|単体|標準)$|本体のみ|のみ$|(?<!カラー|色|サイズ|柄)(?:なし|無し)$|^(?:基本|標準)セット(?:$|[\s/／(（])/;
// 数量を選ぶ軸（1個/2個セット・1枚/2枚…）はセット/単品の軸と同じ扱い（着地時は先頭値＝最少数量）
//   ただし「1個/1枚」の選択肢がある軸だけ（枚数 [2枚, 3枚]＝付属プレート枚数のようなモデル差の軸は除く）。
//   値は数量表記で終わるか区切り/セット/単品が続くもの（「4点脚ロックタイプ」は数量ではない）
const QTY_AXIS_KEY_RE = /数量|數量|個数|枚数|本数|セット数|脚数|入数/;
const QTY_VAL_RE = /^[0-9０-９]+\s*(?:個|枚|本|脚|点|袋|組|台|セット|set)(?:$|[\s(（/／・、,☆★]|セット|単品|入り|set)/i;
// セレクタの先頭値が注意書き（「発送予定日をご確認ください。」「選択してください」）のページでは、次の実値を先頭値とみなす
const NOTICE_VAL_RE = /ください|下さい|ご確認|選択して/;
// 実リンク先（itemName／メーカー型番）側のセット語
const PAGE_SET_RE = /(?<!カ)セット|(?<![A-Za-z])(?:set|with|bundle)(?![A-Za-z])|同梱|バンドル/i;
// 説明文中の「型番」欄（型番／品番／型式／Model の直後）。itemName／メーカー型番に型番が無いページでも、ここに書かれていれば照合先に含める
//   （第2バッチ: 日立 HHLU-S2020＝itemName に型番なし・説明文「型番 HHLU-S2020」／Jackery JE-500A＝説明文「【型番】JE-500A」）
//   meta description や本文の自由文にあるだけでは含めない（bluetti-power #1 の AORA ページは meta に旧型番 AC70 が残っている）
const DESC_MODEL_LABEL = '(?:型番|品番|型式|型名|モデル|model(?:\\s*no\\.?)?)';
// 範囲・下限上限の表記（40〜60L／50L以上／15L〜100L対応）は単一スペックではない
const RANGE_RE = /(\d+(?:\.\d+)?)\s*(L|cm|mm|人用)?\s*[~〜～\-ー–]\s*(\d+(?:\.\d+)?)\s*(L|cm|mm|人用)/g;
const BOUND_RE = /(\d+(?:\.\d+)?)\s*(L|cm|mm|人用)\s*(?:以上|以下|以内|まで|未満|対応|クラス)/g;
const SALE_URL_RE = /sale|outlet|wakeari|bargain/i;
// 「あり/なし」だけの2値軸（通気口 あり/なし 等）。価格差が PRICE_TOL 未満なら仕様オプションであって同梱セットの軸ではない（第3バッチ low-style-bonfire #2）
const TOGGLE_VAL_RE = /^(?:あり|有り|有|なし|無し|無)$/;
// 注文者の区分（個人/法人・会員）を選ぶ軸は商品を束ねる軸ではない（第3バッチ group-camp-tent #1・large-tent-guide #1「個人のお客様/法人のお客様」）
const BUYER_AXIS_RE = /お客様|個人|法人|会員|事業者/;

// 数値スペック（spec_mismatch）: [正規表現, 種別]。値は m[1]、単位は m[2]（あれば）
const SPEC_PATTERNS = [
  [/幅\s*(\d+(?:\.\d+)?)\s*(cm|mm|m)?/g, 'width'],
  //   「厚手8cm/12cm」（前の数値にも単位が付く並記）も1つの thick 並記として取る（第3バッチ naturehike-mat #1・#2）
  [/厚\s*(?:さ|み|手)?\s*(\d+(?:\.\d+)?)(?:\s*(?:cm|mm))?(?:\s*[／/]\s*(\d+(?:\.\d+)?))?\s*(cm|mm)/g, 'thick'],
  [/(\d+(?:\.\d+)?)\s*(Wh)(?![A-Za-z])/g, 'wh'],
  [/(\d+(?:\.\d+)?)\s*(W)(?![A-Za-z])/g, 'w'],
  [/(\d+(?:\.\d+)?)\s*(mAh|Ah)(?![A-Za-z])/g, 'ah'],
  [/(\d+(?:\.\d+)?)\s*(L|ℓ|リットル)(?![A-Za-z])/g, 'liter'],
  [/(\d+)\s*(人用)/g, 'person'],
  [/(\d+(?:\.\d+)?)\s*(合)(?:炊き|炊)?/g, 'gou'],
  [/(\d+(?:\.\d+)?)\s*(cm|mm|m)(?![A-Za-z])/g, 'len'],
  [/(\d+(?:,\d{3})?)\s*(ルーメン|lm)(?![A-Za-z])/gi, 'lm'],
];
// 仕様欄・属性側で単位の表記ゆれを吸収する
const UNIT_ALIASES = {
  cm: ['cm', '㎝', 'センチ', 'ｃｍ'], mm: ['mm', '㎜', 'ミリ', 'ｍｍ'], m: ['m', 'ｍ', 'メートル'],
  Wh: ['Wh', 'WH', 'wh', 'ｗｈ'], W: ['W', 'w', 'Ｗ', 'ワット'], mAh: ['mAh', 'mah', 'MAH'], Ah: ['Ah', 'AH', 'ah'],
  L: ['L', 'l', 'ℓ', 'Ｌ', 'リットル'], ℓ: ['L', 'ℓ', 'リットル'], リットル: ['L', 'ℓ', 'リットル'],
  人用: ['人用', '人', '名用', '名'], 合: ['合'], ルーメン: ['ルーメン', 'lm', 'LM'], lm: ['ルーメン', 'lm', 'LM'],
};
// 属性名 → スペック種別（属性値が単位無しの数値のときに使う）
const ATTR_SPEC_KEYS = {
  width: /幅|横/, thick: /厚/, wh: /容量|Wh/i, w: /出力|消費電力|定格/, ah: /容量/, liter: /容量/, person: /収容|人数|人用/,
  gou: /炊飯|合/, len: /幅|奥行|高さ|長さ|サイズ|直径|径|全長|寸法/, lm: /ルーメン|明るさ|光束/,
};

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ---------------------------------------------------------------------------
// 文字列正規化
// ---------------------------------------------------------------------------
function toHalfWidth(s) {
  return String(s || '')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/　/g, ' ')
    .replace(/[（]/g, '(').replace(/[）]/g, ')')
    .replace(/[〜～]/g, '~')
    .replace(/／/g, '/')
    .replace(/[×]/g, 'x');
}
function norm(s) { return toHalfWidth(s).toLowerCase(); }
function stripTags(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&times;/g, '×')
    .replace(/\s+/g, ' ');
}
function stripDecor(name) {
  return String(name || '').replace(STORE_COPY_BRACKET_RE, ' ').replace(/[★■●☆◎◇◆]/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokens(s) {
  return norm(s).split(/[\s／/・,、，【】\[\]()「」『』｜|&＆+＋×x~]+/).filter(Boolean);
}
function clean(v) { return String(v ?? '').replace(/[\t\r\n]+/g, ' ').trim(); }

// ---------------------------------------------------------------------------
// mdx パース
// ---------------------------------------------------------------------------
function parseCards(mdx) {
  const cards = [];
  const re = /<ProductCardMdx\b([\s\S]*?)\/>/g;
  let m;
  let idx = 0;
  while ((m = re.exec(mdx))) {
    idx += 1;
    const attrs = {};
    for (const a of m[1].matchAll(/(\w+)=(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/g)) {
      attrs[a[1]] = a[2] ?? a[3] ?? a[4] ?? '';
    }
    cards.push({
      index: idx,
      rank: Number(attrs.rank) || idx,
      id: attrs.id || '',
      name: attrs.name || '',
      price: attrs.price || '',
      affiliateUrl: attrs.affiliateUrl || '',
      hasAsin: /\bamazonAsin=/.test(m[1]),
      image: attrs.image || '',
    });
  }
  return cards;
}

function loadAllCards() {
  const out = [];
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx')).sort();
  for (const f of files) {
    const slug = f.replace(/\.mdx$/, '');
    const mdx = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
    for (const c of parseCards(mdx)) out.push({ slug, ...c, url: rakutenUrl(c.affiliateUrl) });
  }
  out.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : a.rank - b.rank || a.index - b.index));
  return { cards: out, files: files.length };
}

// 楽天商品ページ URL の商品コード部分（https://item.rakuten.co.jp/<shop>/<itemcode>/ の itemcode）。取れなければ ''
function itemCodeOf(url) {
  const m = /item\.rakuten\.co\.jp\/[^/]+\/([^/?#]+)/.exec(String(url || ''));
  return m ? m[1] : '';
}
// affiliateUrl → 実リンク先（楽天商品ページ）。pc= → m= → 自身が item.rakuten.co.jp の順。取れなければ ''
function rakutenUrl(affiliateUrl) {
  if (!affiliateUrl) return '';
  let u;
  try { u = new URL(affiliateUrl); } catch { return ''; }
  const pc = u.searchParams.get('pc');
  if (pc && /rakuten\.co\.jp/.test(pc)) return pc;
  const m = u.searchParams.get('m');
  if (m && /rakuten\.co\.jp/.test(m)) return m;
  if (/(^|\.)item\.rakuten\.co\.jp$/.test(u.hostname)) return affiliateUrl;
  return '';
}

// ---------------------------------------------------------------------------
// 楽天 HTML 解析（19〜23 の parse-rakuten-22.cjs 相当を関数化）
// ---------------------------------------------------------------------------
function sliceJson(html, marker, from = 0) {
  const i = html.indexOf(marker, from);
  if (i < 0) return null;
  const start = i + marker.length - 1; // '[' or '{'
  const open = html[start];
  const close = open === '[' ? ']' : '}';
  let depth = 0;
  let inStr = false;
  for (let j = start; j < html.length; j++) {
    const ch = html[j];
    if (inStr) {
      if (ch === '\\') { j++; continue; }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(html.slice(start, j + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

function jsonString(html, key) {
  // "key":"..."（JSON エスケープ解除）
  const re = new RegExp('"' + key + '":"((?:[^"\\\\]|\\\\.)*)"');
  const m = re.exec(html);
  if (!m) return '';
  try { return JSON.parse('"' + m[1] + '"'); } catch { return m[1]; }
}

// カード name がセレクタ値を名指ししている軸は、その値を「選択値」にする（例: name "… LDX+" ↔ style 軸 [MDX+, LDX+]）。
// 名指しが無い軸は先頭値。値は正規化して name に含まれるか（直前が数字でない）で判定。複数値が該当したら最長のもの
// セット/単品を選ぶ軸（値に セット/付き/入り/なし/本体のみ）は名指しに関係なく先頭値＝ページ着地時の既定値を使う。
// カードが「セット」と書いていても読者が着地するのは既定 SKU なので、その差は set_mismatch として出す
// （compact-portable-power #3: name「130Wソーラーパネルセット」・price は単体価格・既定 SKU は「なし」）
// セット/単品を選ぶ軸: 「なし/本体のみ/単品」の値がある、値の半数以上がセット語、または数量軸（1個/2個セット…）。
//   値の1つに「付き」があるだけの軸（charcoal-starter #3「五徳付き四角型／四角型／三角型」＝タイプ軸）はセット軸ではない
function isSetAxis(a) {
  if (!a.values.length) return false;
  if (a.values.some((v) => NONE_VAL_RE.test(v))) return true;
  // 全値がセット語（"original set"／"premium set" のようなシリーズ名）なら、セット/単品を選ぶ軸ではない
  const setVals = a.values.filter((v) => SET_VAL_RE.test(v)).length;
  if (setVals * 2 >= a.values.length && setVals < a.values.length) return true;
  if (!a.values.some((v) => qtyOf(v) === 1)) return false;
  if (QTY_AXIS_KEY_RE.test(a.key) && a.values.length >= 2) return true;
  return a.values.filter((v) => QTY_VAL_RE.test(toHalfWidth(v).trim())).length * 2 >= a.values.length;
}
function firstValue(a) { return a.values.find((v) => !NOTICE_VAL_RE.test(v)) ?? a.values[0]; }
// 各軸の候補値（name の出現順）。名指しが無い軸・セット軸は [先頭値]
function chosenValueLists(axes, cardName) {
  return axes.map((a) => {
    const named = isSetAxis(a) ? [] : nameSpecifiedValues(a, cardName).map((x) => x.v);
    return named.length ? named : [firstValue(a)];
  });
}
// カード name が名指ししている軸の値（無ければ ''）
//   値の括弧は外しても照合する（car-camp-bed-kit #1: 軸の値「極厚（10cm）」↔ name「極厚 10cm」）
//   複数の値が name に現れるときは name の中で先に出るものを採る（同じ位置なら長いもの）。「厚手5cm/10cm」のように並記された
//   name では先頭が採用仕様（カード price は 5cm の価格）であって、長い方（10cm）ではない（第3バッチ naturehike-mat #2）
//   並記のときは選択SKUの決定（parseRakutenHtml）で「価格がカード price と一致する変種」を優先する（group-camp-tent #2: name「3mx3m 2m×2m」・
//   カード ¥8,999 は 2m×2m の価格）。並記の name は size_unspecified で別途拾うので、恣意的な選択で price_mismatch を立てない
//   「480/600ml」「10L/18L/23L」のように単位が末尾にしか無い数値並記は、各数値に単位を配ってから照合する（480ml/600ml）。配らないと
//   先頭の値（480mL）が名指しと認識されず、末尾の値（600mL）だけが選ばれて価格乖離が恣意的になる（第4バッチ thermal-bottle #2・#3／portable-fridge #1）
function expandSlashUnits(nk) {
  return nk.replace(/((?:\d+(?:\.\d+)?\/)+)(\d+(?:\.\d+)?)([a-zℓ]+|人用|合|度|℃)/g, (m, list, last, unit) =>
    list.split('/').filter(Boolean).map((n) => n + unit).join('/') + '/' + last + unit);
}
function nameSpecifiedValues(a, cardName) {
  //   照合先は「空白を / に置換した name」を優先し、「空白を除いた name」はフォールバック。空白を除くと「DB01 10L」が「0110l」になり
  //   数字隣接ガード（175cm に 75cm を含めない）で 10L を落としてしまう（第4バッチ portable-fridge #1）
  const nkSep = expandSlashUnits(norm(cardName || '').trim().replace(/\s+/g, '/'));
  const nkRaw = expandSlashUnits(norm(cardName || '').replace(/\s+/g, ''));
  const out = [];
  for (const v of a.values) {
    const vkRaw = norm(v).replace(/\s+/g, '');
    if (vkRaw.length < 2 || NONE_VAL_RE.test(v) || NOTICE_VAL_RE.test(v)) continue;
    const vkSep = norm(v).trim().replace(/\s+/g, '/');
    const cands = [[nkSep, vkSep], [nkSep, vkSep.replace(/[()\[\]「」]/g, '')], [nkRaw, vkRaw], [nkRaw, vkRaw.replace(/[()\[\]「」]/g, '')]];
    for (const [nk, vk] of cands) {
      if (vk.length < 2) continue;
      const i = nk.indexOf(vk);
      if (i < 0) continue;
      if (i > 0 && /[0-9.]/.test(nk[i - 1]) && /^[0-9]/.test(vk)) continue;
      //   範囲「40〜60L」「2-4人用」の上限値は名指しではない（range は size_unspecified 側で扱う。第5バッチ waterproof-backpack #2: 60L が選ばれ 40L の既定SKUと違う価格で判定していた）
      if (i > 0 && /[~\-]/.test(nk[i - 1]) && /^[0-9]/.test(vk)) continue;
      out.push({ v, pos: i, len: vk.length });
      break;
    }
  }
  return out.sort((x, y) => x.pos - y.pos || y.len - x.len);
}
function nameSpecifiedValue(a, cardName) {
  const l = nameSpecifiedValues(a, cardName);
  return l.length ? l[0].v : '';
}
// 「A+B」「A＋B」の結合がセット（同梱）を表すか。
//   除く: 数字同士（容量 40+5）／右が括弧（型番末尾 ST+(）／末尾の +（MDX+）／
//         英字語に直結して右がカタカナ（"usb led+ランタン"＝複合語）／括弧内（"（ソーラー＋手回し＋乾電池）"＝仕様の並記）
//         左に密着し右に空白がある +（"UPF50+ 耐水圧"＝等級の接尾辞。第3バッチ naturehike-tent #3）
function plusJoin(s) {
  const t = toHalfWidth(s).replace(/\([^)]*\)/g, ' ');
  for (const m of t.matchAll(/(\S)(\s*)[+＋](\s*)(\S)/g)) {
    const [, l, ls, rs, r] = m;
    if (/\d/.test(l) && /\d/.test(r)) continue;
    if (/[()/／、,・]/.test(r)) continue;
    if (/[A-Za-z]/.test(l) && !/\s/.test(m[0]) && /^[ァ-ヶー]/.test(r)) continue;
    if (!ls && rs) continue;
    return true;
  }
  return false;
}
function cardHasSet(name) { return SET_WORD_RE.test(name) || plusJoin(name); }
// 数量付きのセット表現（「3セット」「2本セット」「3点セット」「3SET」）を正規化して列挙（空白除去・小文字・セット→set）
function numericSetExprs(s) {
  return [...toHalfWidth(s || '').matchAll(/[0-9]+\s*(?:点|本|個|枚|台|脚|組)?\s*(?:セット|set)/gi)].map((m) => m[0].replace(/\s+/g, '').toLowerCase().replace(/セット/g, 'set'));
}
// カード name の「3セット」が商品そのものの名前（itemName／メーカー型番にも同じ表現がある）で、かつセット軸の値がその表現を選ぶものでない
//   （オプション軸「キャンプラックのみ／ケース付き」）なら、軸の既定が「のみ」でもカードのセット表記は整合（第4バッチ takibi-table #2: 「キャンプラック 3セット」＝3台組の商品・型番 -3SET）
//   軸の値に同じ表現がある（「1本のみ／2本セット」）なら、その軸が選ぶセットなので従来どおり set_mismatch（trekking-pole #4）
function cardSetIsProduct(name, pageText, axis) {
  const ce = numericSetExprs(name);
  if (!ce.length) return false;
  const pe = numericSetExprs(pageText);
  const ae = axis.values.flatMap((v) => numericSetExprs(v));
  return ce.some((e) => pe.includes(e)) && !ce.some((e) => ae.includes(e));
}
// セレクタ値の数量（"4台（レイアウト自在！）" → 4、数量表記でなければ null）
function qtyOf(v) { const m = /^(\d+)\s*(?:個|枚|本|脚|点|袋|組|台|セット|set)(?:$|[\s(（/／・、,☆★]|セット|単品|入り|set)/i.exec(toHalfWidth(v).trim()); return m ? Number(m[1]) : null; }
// カード name がセレクタ値の文字列をそのまま含むか（空白・全角半角の差は無視。「なし/のみ」の値も対象にする点が nameSpecifiedValue と違う）
function nameContainsValue(cardName, v) {
  const vk = norm(v || '').replace(/\s+/g, '');
  if (vk.length < 2) return false;
  return norm(cardName || '').replace(/\s+/g, '').includes(vk);
}
// 「あり/なし」だけの2値軸で、選択SKUと その軸だけ違う SKU の価格差が PRICE_TOL 未満なら仕様オプション（セット軸ではない）
function toggleAxisIsSpec(page, idx) {
  const a = page.axes[idx];
  if (!a || a.values.length !== 2 || !a.values.every((v) => TOGGLE_VAL_RE.test(String(v).trim()))) return false;
  const fs0 = page.firstSku;
  if (!fs0 || !Array.isArray(page.skus) || !page.skus.length) return false;
  const other = page.skus.find((s) => s !== fs0 && s.selectorValues.length === fs0.selectorValues.length &&
    s.selectorValues.every((v, i) => (i === idx ? v !== fs0.selectorValues[i] : v === fs0.selectorValues[i])));
  if (!other || fs0.price == null || other.price == null) return false;
  return Math.abs(fs0.price - other.price) / Math.min(fs0.price, other.price) < PRICE_TOL;
}

function parseRakutenHtml(html, url, cardName = '', cardPrice = '') {
  const page = {
    itemName: '', makerModel: '', brand: '', color: '', size: '', series: '', manageNumber: '', variantId: '',
    axes: [], skus: [], skuCount: 0, firstSku: null, currentPrice: null, stock: '', attrsText: '', descText: '',
    gone: false, title: (/<title>([^<]*)<\/title>/.exec(html) || ['', ''])[1].trim(),
  };
  const infoIdx = html.indexOf('"itemInfoSku":{');
  if (infoIdx < 0) { page.gone = true; return page; }
  const info = sliceJson(html, '"itemInfoSku":{', 0) || {};
  page.itemName = stripTags(String(info.title || jsonString(html.slice(infoIdx, infoIdx + 4000), 'title'))).trim();
  page.manageNumber = info.manageNumber || '';
  page.variantId = info.variantId || jsonString(html, 'variantId');
  // セレクタ軸（label があればそれをキー名に）
  const sel = sliceJson(html, '"variantSelectors":[');
  if (Array.isArray(sel)) {
    page.axes = sel.map((s) => ({
      key: String(s.label || s.key || ''),
      values: (s.values || []).map((v) => String(v.label ?? v.value ?? '')),
    }));
  }
  const axisSold = sliceJson(html, '"axis":[');
  const soldOutMap = {};
  if (Array.isArray(axisSold)) {
    for (const a of axisSold) for (const v of a.values || []) soldOutMap[String(v.value)] = !!v.isSoldOut;
  }
  // SKU 配列
  const skus = sliceJson(html, '"sku":[');
  const inv = {};
  for (const m of html.matchAll(/\{"sku":"([^"]+)","inventoryId":"[^"]*","quantity":(\d+)\}/g)) inv[m[1]] = Number(m[2]);
  if (Array.isArray(skus) && skus.length) {
    page.skus = skus.map((s) => ({
      variantId: String(s.variantId || ''),
      selectorValues: (s.selectorValues || []).map(String),
      price: s.taxIncludedPrice != null ? Number(s.taxIncludedPrice) : null,
      qty: inv[s.variantId],
      hidden: !!s.hidden,
      attrs: (s.attributes || []).map((a) => ({ title: String(a.title || ''), value: String(a.value ?? ''), unit: String(a.unit || '') })),
    }));
    page.skuCount = page.skus.length;
    // 選択SKU: URL の variantId 指定 > 各軸の選択値（カード name が名指しした値、無ければ先頭値）との一致度（前の軸ほど重い）
    //   が最大の SKU（同点なら非hidden→安値）
    //   ※ 全軸の先頭値の組み合わせが SKU として存在しないページがある（inflatable-mat #1: 幅70×8cm×ベージュ が無い）ため
    //     完全一致を要求せず、先頭軸から順に一致数で選ぶ
    //   name が同じ軸の値を複数並記している（「3mx3m 2m×2m」「5cm/10cm」）ときは、一致数が同点の SKU のうち
    //   価格がカード price と一致するもの → name で先に出る値のもの の順で選ぶ
    let pinned = '';
    try { pinned = new URL(url).searchParams.get('variantId') || ''; } catch { /* ignore */ }
    const lists = chosenValueLists(page.axes, cardName);
    const n = lists.length;
    const scoreOf = (s) => lists.reduce((acc, list, i) => acc + (list.includes(s.selectorValues[i]) ? 2 ** (n - 1 - i) : 0), 0);
    const orderOf = (s) => lists.reduce((acc, list, i) => { const k = list.indexOf(s.selectorValues[i]); return acc + (k < 0 ? list.length : k) * 2 ** (n - 1 - i); }, 0);
    const cp = Number(String(cardPrice).replace(/[^0-9.]/g, ''));
    const priceHit = (s) => (cp > 0 && s.price === cp ? 1 : 0);
    const ranked = [...page.skus].sort((a, b) =>
      scoreOf(b) - scoreOf(a) || priceHit(b) - priceHit(a) || orderOf(a) - orderOf(b) || Number(a.hidden) - Number(b.hidden) || (a.price ?? Infinity) - (b.price ?? Infinity));
    page.firstSku = (pinned && page.skus.find((s) => s.variantId === pinned)) || ranked[0];
  } else {
    // 単一SKU
    const price = /"taxIncludedPrice":([0-9.]+)/.exec(html) || /"minPrice":([0-9.]+)/.exec(html);
    const qty = /"newPurchaseSku":\{[^}]*"quantity":(\d+)/.exec(html) || /"variantMappedInventories":\[\{"sku":"[^"]*","inventoryId":"[^"]*","quantity":(\d+)/.exec(html);
    const attrs = sliceJson(html, '"attributes":[');
    page.firstSku = {
      variantId: page.variantId, selectorValues: [], price: price ? Number(price[1]) : null,
      qty: qty ? Number(qty[1]) : undefined, hidden: false,
      attrs: Array.isArray(attrs) ? attrs.map((a) => ({ title: String(a.title || ''), value: String(a.value ?? ''), unit: String(a.unit || '') })) : [],
    };
    page.skuCount = page.firstSku.price != null ? 1 : 0;
  }
  const fs0 = page.firstSku;
  if (fs0) {
    page.currentPrice = fs0.price;
    const attr = (re) => (fs0.attrs.find((a) => re.test(a.title)) || {}).value || '';
    page.brand = attr(/^ブランド名$/) || attr(/ブランド/);
    page.makerModel = attr(/メーカー型番|型番|品番/);
    page.color = attr(/^カラー$|代表カラー|色/);
    page.size = attr(/サイズ/);
    page.series = attr(/シリーズ名/);
    page.attrsText = fs0.attrs.map((a) => `${a.title}=${a.value}${a.unit}`).join('; ');
    const sold = fs0.selectorValues.some((v) => soldOutMap[v]);
    if (fs0.qty === 0 || sold) {
      // 選択SKUが売り切れでも他の変種に在庫があれば併記（ページ全体の欠品と区別する）
      const others = page.skus.filter((s) => s !== fs0 && s.qty > 0).length;
      page.stock = others ? `soldout(others:${others})` : 'soldout';
    } else if (fs0.qty != null) page.stock = `qty=${fs0.qty}`;
    else page.stock = '?';
  }
  // 仕様欄: 商品説明（HTML）をテキスト化
  const descs = [];
  for (const k of ['productDescription', 'newProductDescription', 'salesDescription']) {
    const d = jsonString(html, k);
    if (d) descs.push(stripTags(d));
  }
  const meta = /<meta\s+name="description"\s+content="([^"]*)"/.exec(html);
  if (meta) descs.push(meta[1]);
  page.descText = descs.join(' ').slice(0, 20000);
  if (!page.itemName && page.skuCount === 0) page.gone = true;
  return page;
}

// ---------------------------------------------------------------------------
// 判定ヘルパ
// ---------------------------------------------------------------------------
function isModelToken(tok) {
  if (/^\d+$/.test(tok)) return tok.length >= PURE_DIGIT_MODEL_MIN;
  if (tok.length < 4) return false;
  if (!/[A-Z]/.test(tok)) return false;
  if ((tok.match(/\d/g) || []).length < 2) return false;
  if (NOT_MODEL_RE.test(tok)) return false;
  if (UNIT_TOKEN_RE.test(tok)) return false;
  return true;
}
// 直後に %／OFF／倍／円／pt が続く英数字（「MAX35％OFF」「P10倍」）は販促の数値であって型番ではない（第4バッチ stylish-camp-tent #4: name 先頭の【MAX35％OFFクーポン配布中！】）
const PROMO_AFTER_RE = /^\s*(?:[%％]|OFF|倍|円|pt|ポイント)/i;
function modelTokens(name) {
  const found = new Set();
  const s = toHalfWidth(name).replace(/###[^#]*###/g, ' ');
  for (const m of s.matchAll(MODEL_TOKEN_RE)) {
    if (!isModelToken(m[0])) continue;
    if (PROMO_AFTER_RE.test(s.slice(m.index + m[0].length))) continue;
    found.add(m[0]);
  }
  const list = [...found];
  return list.filter((t) => !list.some((o) => o !== t && o.startsWith(t) && o.length > t.length));
}
// 全角ハイフン・ダッシュ類も同一視（第2バッチ camp-nata #3: メーカー型番「ＤＧ－Ｎ００１」↔ name「DG-N001」）
function modelKey(tok) { return norm(tok).replace(/[-－‐‑–—\s_.]/g, ''); }
// 説明文の「型番」欄に、その型番が書かれているか（ラベル直後 12 文字以内。ハイフン・空白の有無は無視）
function descHasLabeledModel(descText, tok) {
  const key = modelKey(tok);
  if (!key) return false;
  const body = key.split('').map(escapeRe).join('[-－‐‑–—\\s_.]?');
  const re = new RegExp(DESC_MODEL_LABEL + '[^A-Za-z0-9]{0,12}' + body + '(?![A-Za-z0-9])', 'i');
  return re.test(toHalfWidth(descText || ''));
}

function hasColorWord(s) { return COLOR_RE.test(toHalfWidth(s)); }
function isColorAxis(axis) {
  if (!axis.values.length) return false;
  const colorVals = axis.values.filter((v) => hasColorWord(v)).length;
  const sizeVals = axis.values.filter((v) => SIZE_VALUE_RE.test(toHalfWidth(v).trim())).length;
  if (colorVals * 2 >= axis.values.length && colorVals > 0) return true;
  return COLOR_AXIS_KEY_RE.test(axis.key) && sizeVals * 2 < axis.values.length && colorVals > 0;
}
function isSizeAxis(axis) {
  if (!axis.values.length) return false;
  const sizeVals = axis.values.filter((v) => SIZE_VALUE_RE.test(toHalfWidth(v).trim())).length;
  if (sizeVals * 2 >= axis.values.length && sizeVals > 0) return true;
  const colorVals = axis.values.filter((v) => hasColorWord(v)).length;
  return SIZE_AXIS_KEY_RE.test(axis.key) && colorVals * 2 < axis.values.length && !/セット|set/i.test(axis.key);
}

// 「A/B」並記のうち、両側が色語 or サイズ語のもの
function slashPairs(name) {
  const out = { color: false, size: false, sizeText: '' };
  for (const m of toHalfWidth(name).matchAll(SLASH_PAIR_RE)) {
    const a = m[1], b = m[2];
    if (/^\d/.test(a) && /^\d/.test(b)) continue; // 8/10cm のような数値並記は SIZE_PAIR_RE で扱う
    if (hasColorWord(a) && hasColorWord(b)) out.color = true;
    const sizeish = (x) => SIZE_VALUE_RE.test(x) || /サイズ$/.test(x) || /^(ノーマル|ビッグ|ラージ|レギュラー|ワイド|ロング|ショート|大|中|小)/.test(x);
    if (sizeish(a) && sizeish(b)) { out.size = true; out.sizeText = m[0]; }
  }
  const sp = SIZE_PAIR_RE.exec(toHalfWidth(name));
  if (sp && (!sp[2] || sp[2] === sp[4]) && sp[1] !== sp[3]) { out.size = true; out.sizeText = sp[0]; }
  return out;
}

function bigrams(s) { const o = []; for (let i = 0; i + 1 < s.length; i++) o.push(s.slice(i, i + 2)); return o; }
// 型語: name 先頭 HEAD_LEN 字（飾り除去後）のトークンから、ブランドっぽい英字語・数値・単位語・色語を除いたもの
// name の先頭トークンは CLAUDE.md の規約（"メーカー名 商品名"）上ブランドなので、複数トークンあるときは除く
function typeWords(name, brand) {
  // 先頭トークン（規約上ブランド）と直後の「(別名)」を外した残りから HEAD_LEN 字を取る。ブランド込みで数えると「Coleman(コールマン) 調味料入れ スパイスボックス」の
  //   15 字をブランドが使い、商品名の「スパイスボックス」が型語から切れて「調味料入れ」だけで照合してしまう（第4バッチ spice-box #2）
  // 語の途中で切らない（camp-backpack-beginner #2: 「ボルケニックブラック」が「ボルケニックブラ」になり色語判定を外れる）
  const full = toHalfWidth(stripDecor(name));
  const SEP = '\\s／/・,、，【】\\[\\]()「」『』｜|&＆+＋×x~';
  //   先頭の「…」（「お買い物マラソン」＝販促の括弧書き）は飛ばしてからブランドを外す（camp-chair-lightweight #4）
  let rest = full;
  if (tokens(full).length > 1) {
    const lead = new RegExp('^(?:「[^」]*」\\s*)?[^' + SEP + ']+\\s*(?:\\([^)]*\\)\\s*)?').exec(full);
    if (lead) rest = full.slice(lead[0].length);
  }
  const head = rest.slice(0, HEAD_LEN) + (new RegExp('^[^' + SEP + ']*').exec(rest.slice(HEAD_LEN)) || [''])[0];
  const brandKeys = tokens(brand || '').concat(tokens(brand || '').map((t) => t.replace(/\(.*$/, '')));
  // 販促文言は複合語のまま先に外す（「お買い物マラソン」を分割すると「お買い物」が型語に残る）
  const all = tokens(head).filter((t) => !STORE_COPY_WORDS.test(t));
  // 「ファミリー封筒型寝袋」のようにカタカナ語と漢字語が連結した複合語は、カタカナ↔漢字/かな の境界で分けて個別に照合する
  //   （第3バッチ naturehike-sleeping-bag #4: 実リンク先は「寝袋 シュラフ 封筒型 家族用」で、複合語のままだと 2-gram 被覆率が 0.33）
  const split = all.flatMap((t) => t.split(/(?<=[ァ-ヶー])(?=[一-龠ぁ-ん])|(?<=[一-龠ぁ-ん])(?=[ァ-ヶー])/).filter((x) => x.length >= 2));
  return split.filter((t) => {
    if (t.length < 2) return false;
    if (/^[a-z]{4,}$/.test(t)) return !brandKeys.includes(t); // 英字だけの語（catalyst／scree／darkroom）は型語として照合してよい（型番・単位は含まない）
    if (/^[a-z0-9-]+$/.test(t)) return false;          // 英数字混じり・短い英字（ブランド・型番・単位）は除く
    if (/^\d/.test(t)) return false;                    // 数値始まり（200cm / 2~4人用）。「ズール35」のような語末の数字は型語のまま
    if (STORE_COPY_WORDS.test(t)) return false;         // 販促文言（送料無料・通常価格より2000円OFF 等）は型語ではない
    if (hasColorWord(t) && t.length <= 6) return false; // 色語
    if (brandKeys.includes(t)) return false;
    return true;
  });
}
function typeWordFound(word, hay) {
  if (hay.includes(word)) return true;
  const bg = bigrams(word);
  if (!bg.length) return false;
  const hit = bg.filter((b) => hay.includes(b)).length;
  return hit / bg.length >= TYPE_BIGRAM_MIN;
}
// 英字の商品名（「ZZZ BAG」のように英字語が2語以上連続する固有名）が実リンク先に連続して現れれば、型語（寝袋）が無くても同じ商品とみなす。
//   店が「ブランド＋商品名」だけで itemName を書き、カテゴリ語（寝袋/テント）を入れないページで type_mismatch にしない（第5バッチ washable-sleeping-bag #5:
//   name「NANGA ZZZ BAG 10 寝袋」↔ itemName「ナンガ(NANGA) ZZZ BAG 10 REGULAR FGY」）。1語だけの一致（BAG）は根拠にしない。ブランド語・単位語は除く
function englishPhraseFound(name, hay, brand) {
  const brandKeys = new Set(tokens(brand || '').concat(tokens(brand || '').map((t) => t.replace(/\(.*$/, ''))));
  const toks = tokens(toHalfWidth(stripDecor(name)));
  const hayNoSpace = hay.replace(/\s+/g, '');
  for (let i = 0; i + 1 < toks.length; i++) {
    const a = toks[i], b = toks[i + 1];
    if (![a, b].every((t) => /^[a-z]{2,}$/.test(t) && !brandKeys.has(t) && !UNIT_TOKEN_RE.test(t))) continue;
    if (hay.includes(`${a} ${b}`) || hayNoSpace.includes(a + b)) return true;
  }
  return false;
}

// 数値スペック抽出: [{kind, value, unit, raw}]
function specs(name) {
  // 桁区切りのカンマ（耐水圧2,000mm／1,500mm）は外してから数値を取る。外さないと「000mm」が単独スペックになる（第4バッチ one-pole-tent #5）
  const s = toHalfWidth(name).replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
  const out = [];
  const used = [];
  // 範囲（40〜60L）・下限上限（50L以上）は kind='range' として先に取り、単一スペックの対象から外す
  for (const re of [RANGE_RE, BOUND_RE]) {
    re.lastIndex = 0;
    for (const m of s.matchAll(re)) {
      const unit = re === RANGE_RE ? m[4] : m[2];
      if (re === RANGE_RE && m[2] && m[2] !== m[4]) continue; // 単位が違う（3m×2.5m 等）は範囲ではない
      out.push({ kind: 'range', value: m[1], unit, raw: m[0] });
      used.push([m.index, m.index + m[0].length]);
    }
  }
  for (const [re, kind] of SPEC_PATTERNS) {
    re.lastIndex = 0;
    for (const m of s.matchAll(re)) {
      const start = m.index, end = m.index + m[0].length;
      if (used.some(([a, b]) => start < b && end > a)) continue; // 既に別パターンが取った範囲
      if (kind === 'thick') {
        out.push({ kind, value: m[1], unit: m[3], raw: m[0] });
        if (m[2]) out.push({ kind, value: m[2], unit: m[3], raw: m[0] });
      } else {
        out.push({ kind, value: m[1].replace(/,/g, ''), unit: m[2] || (kind === 'width' ? 'cm' : ''), raw: m[0] });
      }
      used.push([start, end]);
    }
  }
  return out;
}
// バリエーション軸のどれかが、そのスペックと同じ単位の数値を値に持つか（例: 幅70cm/75cm 軸、8cm/10cm 軸、40L/50L/60L 軸）
function axesCarryUnit(axes, sp) {
  const units = UNIT_ALIASES[sp.unit] || (sp.unit ? [sp.unit] : []);
  if (!units.length) return false;
  const re = new RegExp('\\d+(?:\\.\\d+)?\\s*(?:' + units.map(escapeRe).join('|') + ')(?![A-Za-z])', 'i');
  return (axes || []).some((a) => a.values.length >= 2 && a.values.filter((v) => re.test(toHalfWidth(v))).length * 2 >= a.values.length);
}
// その軸の値の中に、このスペックと同じ数値＋単位が実際に現れるか（600W が 130W/100W 軸の値に無ければ軸の管轄外＝全文で見る）
function axesCarryValue(axes, sp) {
  if (!axesCarryUnit(axes, sp)) return false;
  const units = UNIT_ALIASES[sp.unit] || [sp.unit];
  const re = new RegExp('(?<![0-9.])' + escapeRe(sp.value) + '\\s*(?:' + units.map(escapeRe).join('|') + ')(?![A-Za-z])', 'i');
  return axes.some((a) => a.values.some((v) => re.test(toHalfWidth(v))));
}
function specFound(sp, hayText, attrs) {
  const hay = norm(hayText).replace(/(\d),(\d{3})(?!\d)/g, '$1$2'); // 照合先の桁区切り（耐水圧 2,000mm）も外す

  const val = sp.value;
  const units = UNIT_ALIASES[sp.unit] || (sp.unit ? [sp.unit] : ['']);
  const cands = [];
  for (const u of units) cands.push(norm(val + u), norm(val + ' ' + u));
  // 単位換算（m ↔ cm、cm ↔ mm）
  const n = Number(val);
  if (sp.unit === 'm' && Number.isFinite(n)) for (const u of UNIT_ALIASES.cm) cands.push(norm((n * 100) + u));
  if (sp.unit === 'cm' && Number.isFinite(n)) {
    for (const u of UNIT_ALIASES.mm) cands.push(norm((n * 10) + u));
    if (n % 100 === 0) for (const u of UNIT_ALIASES.m) cands.push(norm((n / 100) + u));
  }
  if (sp.kind === 'width') for (const u of UNIT_ALIASES.cm) cands.push(norm('幅' + val + u), norm('幅 ' + val + u));
  //   「幅20×奥行20×高さ7.5cm」のように単位が末尾にしか無い寸法列は、照合先も同じ書き方（幅20x奥行20x…）なので「幅20」の直後が数字・小数点・mm でなければ一致
  //   （第5バッチ wooden-tableware #2: 仕様欄「本体サイズ（約）：幅20×奥行20×高さ7.5cm」が name と同一表記なのに 20cm の候補だけで探して不一致になった）
  if (sp.kind === 'width' && new RegExp('幅\\s*' + escapeRe(norm(val)) + '(?![0-9.]|\\s*mm)').test(hay)) return true;
  if (sp.kind === 'person') cands.push(norm(val + '人'), norm(val + '名'));
  for (const c of cands) {
    if (!c) continue;
    const i = hay.indexOf(c);
    if (i >= 0) {
      // 直前が数字なら別の数（例: 175cm に 75cm がマッチ）
      const prev = hay[i - 1];
      if (prev && /[0-9.]/.test(prev)) continue;
      return true;
    }
  }
  // 属性（単位無しの数値）: 属性名が種別に合い、値が一致
  const keyRe = ATTR_SPEC_KEYS[sp.kind];
  if (keyRe) {
    for (const a of attrs || []) {
      if (!keyRe.test(a.title)) continue;
      const nums = (toHalfWidth(a.value).match(/\d+(?:\.\d+)?/g) || []).map(Number);
      if (nums.some((x) => x === n)) return true;
      if (sp.unit === 'cm' && nums.some((x) => x === n * 10 || x === n / 100)) return true;
      if (sp.unit === 'm' && nums.some((x) => x === n * 100 || x === n * 1000)) return true;
      if (sp.unit === 'mm' && nums.some((x) => x === n / 10)) return true;
    }
  }
  return false;
}

// variant_unavailable（作業D・campkit-20260921-28）: カード name が名指しした変種（軸の値、または軸の値に現れる数値スペック）に対応する
//   SKU がページの SKU 一覧に無い（軸の値としては並ぶが選べない＝販売終了か非表示）。「カードに書いてある商品が買えない」点で
//   pup-tent #4（購入可能 SKU がスノースカート付きのみ）／solo-tent-overall #4（1-2人用 SKU が無く 3-4人用のみ）と同じ実態。
//   - 名指しの判定は nameSpecifiedValues（セット軸は除く）。並記（5cm/10cm）は1つでも SKU にあれば整合
//   - 数値スペック（2人用）は、軸の値にその数値＋単位が現れる（axesCarryValue）のに、その値を持つ SKU が無いとき。name が同じ軸の値を
//     文字列で名指ししていればそちらの判定に任せる
//   - 軸の値が SKU の selectorValues に1つも現れない軸（label と value が違うページ）は判定しない（誤検知ガード）
//   - 軸に「1.5L」と「1.5L│2～3人・調理」のように新旧ラベルが並び SKU が長い方だけを使うページがある（camp-kettle-recommend #1）ので、
//     名指しした値を含む SKU 値があれば整合
//   在庫 0（qty=0）は out_of_stock の管轄なので SKU の在庫は見ない
function variantUnavailable(name, page) {
  if (!page || !Array.isArray(page.skus) || !page.skus.length || !page.axes.length) return [];
  const miss = [];
  const skuHas = (i, v) => { const vk = norm(v).replace(/\s+/g, ''); return page.skus.some((s) => norm(s.selectorValues[i] || '').replace(/\s+/g, '').includes(vk)); };
  const namedByAxis = page.axes.map((a, i) => {
    if (isSetAxis(a) || !a.values.some((v) => skuHas(i, v))) return null;
    return nameSpecifiedValues(a, name).map((x) => x.v);
  });
  namedByAxis.forEach((named, i) => {
    if (named && named.length && !named.some((v) => skuHas(i, v))) miss.push(`${page.axes[i].key}:${named.join('|')}`);
  });
  for (const sp of specs(name)) {
    if (sp.kind === 'range' || !axesCarryValue(page.axes, sp)) continue;
    const units = UNIT_ALIASES[sp.unit] || [sp.unit];
    const re = new RegExp('(?<![0-9.])' + escapeRe(sp.value) + '\\s*(?:' + units.map(escapeRe).join('|') + ')(?![A-Za-z])', 'i');
    const vals = [];
    page.axes.forEach((a, i) => { if (namedByAxis[i] && !namedByAxis[i].length) a.values.forEach((v) => { if (re.test(toHalfWidth(v))) vals.push([i, v]); }); });
    if (vals.length && !vals.some(([i, v]) => skuHas(i, v))) miss.push(sp.raw.trim());
  }
  return uniq(miss);
}

// ---------------------------------------------------------------------------
// 判定本体（純関数）: card={name, price}, page=parseRakutenHtml の結果 or {http:404}
// ---------------------------------------------------------------------------
function judge(card, page, http) {
  const flags = [];
  const name = card.name || '';
  const notes = [];

  // name だけで判定できるもの（404 でも出す）
  if (STORE_COPY_WORDS.test(name) || /^\s*【/.test(name) && STORE_COPY_WORDS.test(name.slice(0, 20))) flags.push('store_copy');
  const pairs = slashPairs(name);

  if (http === 404 || !page || page.gone) {
    flags.unshift('404');
    if (pairs.color) flags.push('color_unspecified');
    if (pairs.size) flags.push('size_unspecified');
    return { flags: uniq(flags), notes };
  }

  const itemName = page.itemName || '';
  const first = page.firstSku || { attrs: [], selectorValues: [] };
  const keyText = [itemName, page.makerModel, page.series, page.brand].join(' ');
  const skuText = [keyText, page.attrsText, page.manageNumber, page.variantId, first.selectorValues.join(' ')].join(' ');
  const allText = [skuText, page.descText].join(' ');

  // model_mismatch（カード → 実リンク先の向きのみ）
  //   逆向き（実SKUのメーカー型番がカードに無い）は第1バッチで 3/3 がノイズ（Anker のバンドル管理番号 B1763/B1761、
  //   メーカー型番欄に JAN 4976790764001 が入っている例）だったため付与しない。カード側の型番が実リンク先のどこにも無い場合だけ
  //   照合先は itemName／メーカー型番／SKU属性（商品名としての欄）に限り、店舗の管理番号・URL・説明文は含めない。
  //   含めると bluetti-power #1（name「AC70」↔ itemName「AORA 100 mini」・管理番号 bluettijapan_ac70＝改名後のページ）を見逃す
  //   例外: 説明文の「型番」欄（型番／品番／型式 の直後）に書かれている型番は一致扱い（descHasLabeledModel）。
  const cm = modelTokens(name);
  const hayModel = modelKey([keyText, page.attrsText].join(' '));
  const missing = cm.filter((t) => !hayModel.includes(modelKey(t)) && !descHasLabeledModel(page.descText, t));
  if (missing.length) { flags.push('model_mismatch'); notes.push(`model:${missing.join('|')}`); }

  // type_mismatch
  //   カードの型番が itemName／メーカー型番に全部見つかっている（model_mismatch なし）なら型語の照合は省く。型番一致は型語より強い根拠で、
  //   店が商品名に別の呼び方（「リラックスローチェア F-1002C」↔「ハイバックチェア」）を使っているだけの誤検知を避ける（第3バッチ fireproof-chair #5）
  //   英字だけの型語（catalyst／scree）は「見つかった」側の根拠にだけ使う。英字語しか無い name（「キャンピングムーン CAMPINGMOON ガスランタン」の
  //   先頭20字＝英字ブランド名だけ）で照合を始めると、店が英字名を書いていないだけで type_mismatch になる（gas-lantern #5）
  //   英字2語以上の固有名（ZZZ BAG）が itemName に連続して一致していれば、カテゴリ語（寝袋）が無くても同じ商品（englishPhraseFound）
  const tw = typeWords(name, page.brand);
  const twJp = tw.filter((w) => !/^[a-z]+$/.test(w));
  if (twJp.length && !(cm.length && !missing.length)) {
    const hay = norm(keyText);
    const found = tw.filter((w) => typeWordFound(w, hay));
    if (found.length < TYPE_MIN_COMMON && !englishPhraseFound(name, hay, page.brand)) { flags.push('type_mismatch'); notes.push(`type:${tw.join('|')}`); }
  }

  // spec_mismatch
  //   バリエーション軸にその数値＋単位が値として並ぶページ（幅70cm/75cm・8cm/10cm・40L/50L/60L 等）では itemName・仕様欄が
  //   全変種の数値を列挙しているので、選択SKUのセレクタ値＋SKU属性だけを根拠にする（軸の値に無い数値は従来どおり全文で見る）。
  //   範囲・下限（40〜60L／50L以上）は単一スペックではないので spec_mismatch にせず、軸がその単位を持つなら size_unspecified
  //   同じ種類・単位の寸法/容量が name に2値以上並ぶ（7L 20L 25L／8/10cm／1.9L 3.8L）のも並記＝size_unspecified 扱いにして
  //   個別の spec_mismatch には数えない（幅75cm のような単独スペックは従来どおり）
  const sps = specs(name);
  const selText = [first.selectorValues.join(' '), page.attrsText].join(' ');
  let rangeSize = false;
  const multi = new Set();
  {
    const groups = {};
    //   容量（5000mAh/10000mAh）の並記も同様（第3バッチ mobile-battery-camp #5）。W／Wh は「600W（サージ1200W）」のように同一商品の2値があるので含めない
    for (const sp of sps) if (['liter', 'len', 'thick', 'width', 'ah'].includes(sp.kind)) (groups[sp.kind + sp.unit] ||= new Set()).add(sp.value);
    for (const [k, vals] of Object.entries(groups)) if (vals.size >= 2) multi.add(k);
  }
  const missSpec = sps.filter((sp) => {
    if (sp.kind === 'range') { if (axesCarryUnit(page.axes, sp)) rangeSize = true; return false; }
    if (multi.has(sp.kind + sp.unit)) { rangeSize = true; return false; }
    const hay = axesCarryValue(page.axes, sp) ? selText : allText;
    return !specFound(sp, hay, first.attrs);
  });
  if (missSpec.length) { flags.push('spec_mismatch'); notes.push(`spec:${missSpec.map((s) => s.raw.trim()).join('|')}`); }

  // variant_unavailable（name が名指しした変種の SKU がページに無い。作業D・campkit-20260921-28。検出のみ・起票は 29 以降）
  const vu = variantUnavailable(name, page);
  if (vu.length) { flags.push('variant_unavailable'); notes.push(`variant:${vu.join('|')}`); }

  // set_mismatch
  //   セット/単品を選ぶ軸（値に セット/付き/入り、または なし/本体のみ を含む軸）があればその選択SKUの値で判定。
  //   無ければ itemName／メーカー型番のセット語で判定（逆向きは itemName のセット語が SEO ノイズになりやすいので軸がある時だけ）
  //   itemName の「A+B」（coleman-lantern #3: ルミエールランタン+純正LPガス燃料）もセット語として扱う
  //   「あり/なし」だけの2値軸は、あり↔なし の SKU の価格差が PRICE_TOL 未満なら仕様オプション（通気口 あり/なし）でセット軸ではない
  //   （low-style-bonfire #2: 6,490↔6,390）。差が大きければ同梱品（logos-sleeping-bag #3: シュラフコンフォーター あり 9,610↔なし 4,980）
  const cardSet = cardHasSet(toHalfWidth(stripDecor(name)));
  const setAxisIdx = page.axes.findIndex((a, i) => isSetAxis(a) && !toggleAxisIsSpec(page, i));
  if (setAxisIdx >= 0) {
    const sel = first.selectorValues[setAxisIdx] || '';
    const axisHasNone = page.axes[setAxisIdx].values.some((v) => NONE_VAL_RE.test(v));
    const qn = qtyOf(sel); // 数量軸: 2以上ならセット扱い（camp-table-folding #5: 既定「4台」）。1個入り／1枚 は単品（第3バッチ field-rack #5・headlight-rechargeable #5）
    const skuIsSet = qn === 1 ? false : !NONE_VAL_RE.test(sel) && (SET_VAL_RE.test(sel) || axisHasNone || (qn != null && qn >= 2));
    // カード name が選択値そのもの（「テント本体セットのみ」）を名指ししていれば、セット語の有無に関わらず整合（第3バッチ fieldoor-tent #2）
    const named = nameContainsValue(name, sel);
    if (named) { /* 整合 */ }
    else if (cardSet && !skuIsSet && cardSetIsProduct(stripDecor(name), [itemName, page.makerModel].join(' '), page.axes[setAxisIdx])) { /* 整合: カードの「Nセット」は商品自体の名前 */ }
    else if (cardSet && !skuIsSet) { flags.push('set_mismatch'); notes.push(`set:card=set,sku=single(${sel})`); }
    else if (!cardSet && skuIsSet) { flags.push('set_mismatch'); notes.push(`set:card=single,sku=set(${sel})`); }
  } else if (cardSet && !PAGE_SET_RE.test([itemName, page.makerModel].join(' ')) && !plusJoin([itemName, page.makerModel].join(' '))) {
    flags.push('set_mismatch'); notes.push('set:card=set,sku=single');
  }

  // color_unspecified / size_unspecified
  //   name の「A/B」並記は、それ自体が軸の値（例: グレゴリーの "SM/MD"）なら並記ではない
  const colorAxes = page.axes.filter(isColorAxis);
  const sizeAxes = page.axes.filter(isSizeAxis);
  const colorN = Math.max(0, ...colorAxes.map((a) => a.values.length));
  const sizeN = Math.max(0, ...sizeAxes.map((a) => a.values.length));
  const axisValueKeys = page.axes.flatMap((a) => a.values.map((v) => norm(v).replace(/\s+/g, '')));
  const pairIsAxisValue = (pairText) => axisValueKeys.some((k) => k === norm(pairText).replace(/\s+/g, ''));
  const sizePair = pairs.size && !(pairs.sizeText && pairIsAxisValue(pairs.sizeText));
  // name が軸の値を名指ししていれば（"SM/MD"・"LDX+"・"ブラック" 等）その軸は指定済み
  const colorNamed = colorAxes.some((a) => nameSpecifiedValue(a, name));
  const sizeNamed = sizeAxes.some((a) => nameSpecifiedValue(a, name));
  if ((colorN >= COLOR_AXIS_MIN && !hasColorWord(name) && !colorNamed) || pairs.color) flags.push('color_unspecified');
  if ((sizeN >= SIZE_AXIS_MIN && !SIZE_WORD_IN_NAME_RE.test(toHalfWidth(name)) && !sizeNamed) || sizePair || rangeSize) flags.push('size_unspecified');

  // sale_page
  //   itemName の「セール/SALE」は SEO 常套句で根拠にならない（第1バッチで camp-hammock #3/#5・camp-cooler-soft #4 が誤検知）ので
  //   URL/管理番号のセール語、または SKU 数が多く かつ 色・サイズ以外の軸（タイプ/シリーズ/本数 等＝別商品を束ねる軸）があること
  const itemModels = modelTokens(itemName);
  const totalVals = page.axes.reduce((s, a) => s + a.values.length, 0);
  //   セール語は店舗の管理番号（URL の商品コード）だけで見る。店名（futon-outlet 等）に含まれるものは根拠にしない（第3バッチ hot-water-bottle #5）
  const saleUrl = SALE_URL_RE.test(page.manageNumber || '') || SALE_URL_RE.test(itemCodeOf(card.url));
  //   セット/数量の軸はオプションであって別商品を束ねる軸ではない。カード name が値を名指ししている軸も、そのカードにとっては曖昧でない
  //   （第2バッチ car-camp-mat #4: サイズ×タイプ×色×セットの 70 SKU だが name が S／大型二重バルブ／ベージュ を名指し）
  //   注文者区分（個人/法人）の軸も商品を束ねる軸ではない
  const bundlingAxis = page.axes.some((a) => a.values.length >= 2 && !isColorAxis(a) && !isSizeAxis(a) && !isSetAxis(a) && !nameSpecifiedValue(a, name)
    && !(BUYER_AXIS_RE.test(a.key) || a.values.every((v) => BUYER_AXIS_RE.test(v))));
  if (itemModels.length === 0 && ((saleUrl && totalVals >= SALE_VALUES_MIN) || (page.skuCount >= SALE_SKU_MIN && bundlingAxis))) flags.push('sale_page');

  // price_mismatch
  const cp = Number(String(card.price).replace(/[^0-9.]/g, ''));
  if (Number.isFinite(cp) && cp > 0 && page.currentPrice != null && Number.isFinite(page.currentPrice)) {
    const diff = Math.abs(page.currentPrice - cp) / cp;
    if (diff >= PRICE_TOL) { flags.push('price_mismatch'); notes.push(`price:${cp}->${page.currentPrice}(${(diff * 100).toFixed(1)}%)`); }
  }

  return { flags: uniq(flags), notes };
}
function uniq(a) { return [...new Set(a)]; }

// ---------------------------------------------------------------------------
// TSV 入出力
// ---------------------------------------------------------------------------
// 指示の17列 ＋ 末尾に sku_selected（価格・スペック判定の根拠にした選択SKU: variantId/選択値…）
const COLUMNS = ['slug', 'rank', 'id', 'frozen', 'http', 'card_name', 'rakuten_item_name', 'maker_model', 'brand',
  'axis_count', 'axis_first', 'card_price', 'current_price', 'stock', 'flags', 'checked_at', 'judged_task', 'sku_selected'];
function rowKey(r) { return `${r.slug}\t${r.rank}\t${r.id}`; }
function readTsv() {
  if (!fs.existsSync(OUT)) return [];
  const lines = fs.readFileSync(OUT, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
  const header = lines.shift().split('\t');
  return lines.map((l) => {
    const cells = l.split('\t');
    const o = {};
    header.forEach((h, i) => { o[h] = cells[i] ?? ''; });
    return o;
  });
}
function writeTsv(rows) {
  const lines = [COLUMNS.join('\t')];
  for (const r of rows) lines.push(COLUMNS.map((c) => clean(r[c])).join('\t'));
  fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');
}
function nowIso() { return new Date().toISOString().replace(/\.\d+Z$/, 'Z'); }

// ---------------------------------------------------------------------------
// fetch
// ---------------------------------------------------------------------------
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
async function fetchHtml(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'ja,en;q=0.5', accept: 'text/html' }, redirect: 'follow', signal: ctl.signal });
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get('content-type') || '';
    const head = buf.slice(0, 2000).toString('latin1');
    const metaCs = /charset=["']?([A-Za-z0-9_-]+)/i.exec(ct) || /charset=["']?([A-Za-z0-9_-]+)/i.exec(head);
    const cs = (metaCs ? metaCs[1] : 'utf-8').toLowerCase();
    const enc = /euc/.test(cs) ? 'euc-jp' : /shift|sjis|windows-31j/.test(cs) ? 'shift_jis' : 'utf-8';
    let html;
    try { html = new TextDecoder(enc).decode(buf); } catch { html = buf.toString('utf8'); }
    return { status: res.status, html, finalUrl: res.url };
  } finally { clearTimeout(timer); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// 1カードの処理
// ---------------------------------------------------------------------------
function baseRow(card) {
  return {
    slug: card.slug, rank: String(card.rank), id: card.id, frozen: FROZEN_SLUGS.has(card.slug) ? '1' : '0',
    http: '', card_name: card.name, rakuten_item_name: '', maker_model: '', brand: '', axis_count: '', axis_first: '',
    card_price: card.price, current_price: '', stock: '', flags: '', checked_at: nowIso(), judged_task: TASK_ID, sku_selected: '',
  };
}
// 保存 HTML のパス。rank は記事内で一意ではない（dod-tarp は rank="1" が2枚）ので id まで含める。
// id が空のカードは記事内の通し番号（parseCards の index）で区別する
function cacheFileOf(card) {
  const idPart = card.id ? card.id : `i${card.index}`;
  return path.join(HTML_DIR, `${card.slug}__${card.rank}__${idPart}.html`);
}
async function checkCard(card, opts = {}) {
  const row = baseRow(card);
  if (!card.url) { row.flags = 'url_unparsable'; return { row, page: null }; }
  let res;
  const cacheFile = cacheFileOf(card);
  if (opts.cached && !fs.existsSync(cacheFile)) throw new Error(`--cached: 保存 HTML がありません: ${cacheFile}`);
  try {
    if (opts.cached) {
      // 保存済み HTML を再利用（楽天へは行かない）。HTTP は保存時の値が無いのでページ内容から推定
      const html = fs.readFileSync(cacheFile, 'utf8');
      const gone = /<title>【楽天市場】エラー<\/title>/.test(html) || !html.includes('"itemInfoSku":{');
      res = { status: gone ? 404 : 200, html, finalUrl: card.url, cached: true };
    } else {
      res = await fetchHtml(card.url);
    }
  } catch (e) {
    row.http = 'ERR';
    row.flags = 'fetch_error';
    row.axis_first = clean(e.message).slice(0, 80);
    return { row, page: null, error: e };
  }
  row.http = String(res.status);
  if (opts.saveHtml !== false && !res.cached) {
    fs.mkdirSync(HTML_DIR, { recursive: true });
    fs.writeFileSync(cacheFile, res.html, 'utf8');
  }
  if (res.status === 429 || res.status === 503) { row.flags = `http_${res.status}`; return { row, page: null, throttled: true }; }
  const page = res.status === 404 ? null : parseRakutenHtml(res.html, card.url, card.name, card.price);
  if (page) {
    row.rakuten_item_name = page.itemName;
    row.maker_model = page.makerModel;
    row.brand = page.brand;
    row.axis_count = page.axes.map((a) => `${a.key}:${a.values.length}`).join('|');
    row.axis_first = page.axes.map((a) => `${a.key}:${a.values[0] ?? ''}`).join('|');
    row.current_price = page.currentPrice != null ? String(page.currentPrice) : '';
    row.stock = page.stock;
    if (page.firstSku) row.sku_selected = [page.firstSku.variantId, ...page.firstSku.selectorValues].filter(Boolean).join('/');
  }
  const j = judge(card, page, res.status);
  row.flags = j.flags.length ? j.flags.join(',') : 'OK';
  return { row, page, notes: j.notes, cached: !!res.cached };
}

// ---------------------------------------------------------------------------
// 単体テスト（A-3 の各フラグにつき最低1ケース）
// ---------------------------------------------------------------------------
function mkPage(o) {
  const attrs = (o.attrs || []).map(([title, value]) => ({ title, value: String(value), unit: '' }));
  const first = { variantId: o.variantId || 'v1', selectorValues: o.selectorValues || [], price: o.price ?? null, qty: o.qty, hidden: false, attrs };
  // o.skus: [[selectorValues[], price], …]（先頭を選択SKUにする）
  const skus = (o.skus || []).map(([selectorValues, price], i) => ({ variantId: `s${i}`, selectorValues, price, qty: 1, hidden: false, attrs: [] }));
  if (skus.length) { first.selectorValues = skus[0].selectorValues; first.price = skus[0].price; skus[0] = first; }
  return {
    itemName: o.itemName || '', makerModel: o.makerModel || '', brand: o.brand || '', series: o.series || '',
    manageNumber: o.manageNumber || '', variantId: o.variantId || '', axes: o.axes || [], skus, skuCount: o.skuCount ?? 1,
    firstSku: first, currentPrice: first.price, stock: '', attrsText: attrs.map((a) => `${a.title}=${a.value}`).join('; '),
    descText: o.desc || '', gone: !!o.gone, title: '',
  };
}
function runTests() {
  const T = [];
  const t = (label, card, page, http, expect, notExpect = []) => T.push({ label, card, page, http, expect, notExpect });

  t('404: HTTP 404', { name: 'Soomloom パップテント TC', price: '15000' }, null, 404, ['404']);
  t('404: 200 だがエラーページ（itemInfoSku 無し）', { name: 'Soomloom パップテント TC', price: '15000' }, mkPage({ gone: true }), 200, ['404']);
  t('type_mismatch: ワンタッチテント ↔ サンシェード', { name: 'FIELDOOR ワンタッチテント 200cm', price: '8910' },
    mkPage({ itemName: 'FIELDOOR サンシェード 200cm 日よけ', makerModel: 'フルクローズ サンシェード 200cm', brand: 'FIELDOOR', price: 8910 }), 200, ['type_mismatch']);
  t('type_mismatch なし: 型語が itemName にある', { name: 'FIELDOOR ワンタッチテント 200cm', price: '8910' },
    mkPage({ itemName: 'FIELDOOR テント ワンタッチテント 200cm', brand: 'FIELDOOR', price: 8910 }), 200, [], ['type_mismatch']);
  t('type_mismatch なし: 表記ゆれ（インフレーターマット ↔ インフレータブルマット）', { name: 'WAQ インフレーターマット 8cm', price: '8910' },
    mkPage({ itemName: 'WAQ インフレータブルマット 8cm', brand: 'WAQ', price: 8910, attrs: [['厚さ', '8']] }), 200, [], ['type_mismatch']);
  t('model_mismatch: カード型番が実SKUに無い', { name: 'SOTO レギュレーターストーブ ST-310', price: '6000' },
    mkPage({ itemName: 'SOTO レギュレーターストーブ ST-340', makerModel: 'ST-340', brand: 'SOTO', price: 6000 }), 200, ['model_mismatch']);
  t('model_mismatch なし: ハイフン差は同一視', { name: 'SOTO レギュレーターストーブ ST-310', price: '6000' },
    mkPage({ itemName: 'SOTO レギュレーターストーブ ST310', makerModel: 'ST310', brand: 'SOTO', price: 6000 }), 200, [], ['model_mismatch']);
  t('model_mismatch: AC70 は型番（電圧表記ではない）', { name: 'BLUETTI ポータブル電源 AC70 768Wh 1000W', price: '88000' },
    mkPage({ itemName: 'BLUETTI ポータブル電源 AORA 100 mini 768Wh 1000W', makerModel: 'AORA 100 mini', brand: 'BLUETTI', price: 96800 }), 200, ['model_mismatch']);
  t('model_mismatch なし: AC100V／DC12V は電圧', { name: 'ポータブル電源 AC100V DC12V 出力', price: '30000' },
    mkPage({ itemName: 'ポータブル電源 家庭用コンセント対応', price: 30000 }), 200, [], ['model_mismatch']);
  t('model_mismatch: 純数字型番（コールマン）', { name: 'コールマン ノーススター 2000015521', price: '10846' },
    mkPage({ itemName: 'Coleman ノーススター LPガスランタン', makerModel: '2000015523', brand: 'Coleman', price: 10846 }), 200, ['model_mismatch']);
  t('spec_mismatch: 幅75cm・10cm が実SKUに無い', { name: 'Aiflycy インフレーターマット 厚手8/10cm 枕付き 幅75cm 自動膨張式', price: '6680' },
    mkPage({ itemName: 'Aiflycy インフレーターマット 厚手8cm 自動膨張式', brand: 'Aiflycy', price: 6680, attrs: [['本体横幅', '70'], ['厚さ', '8']], desc: '厚さ8cm 幅70cm 長さ190cm' }), 200, ['spec_mismatch']);
  t('spec_mismatch なし: 属性の単位無し数値で一致', { name: 'FIELDOOR テント 200cm 4人用', price: '8910' },
    mkPage({ itemName: 'FIELDOOR テント', brand: 'FIELDOOR', price: 8910, attrs: [['本体横幅', '200'], ['最大収容人数', '4']] }), 200, [], ['spec_mismatch']);
  t('spec_mismatch なし: 3m ↔ 300cm の換算', { name: 'FIELDOOR タープ 3m', price: '8910' },
    mkPage({ itemName: 'FIELDOOR タープ 300cm', brand: 'FIELDOOR', price: 8910 }), 200, [], ['spec_mismatch']);
  t('spec_mismatch: 175cm に 75cm は含まれない', { name: 'マット 幅75cm', price: '3000' },
    mkPage({ itemName: 'マット 175cm', price: 3000 }), 200, ['spec_mismatch']);
  t('spec_mismatch: 軸に同単位が並ぶページは先頭値SKUの値で判定（itemName に幅75cm があっても）', { name: 'Aiflycy インフレーターマット 厚手8/10cm 枕付き 幅75cm', price: '6680' },
    mkPage({ itemName: 'キャンプ マット【枕付き史上最大幅75cm追加】インフレーターマット 8/10cm', brand: 'camdoor', price: 7480, selectorValues: ['プレミアムサイズ（幅70cm）', '8cm', 'ブラック'],
      axes: [{ key: '幅さ', values: ['プレミアムサイズ（幅70cm）', 'ゴージャスサイズ（幅75cm）'] }, { key: '厚さ', values: ['8cm', '10cm'] }, { key: 'カラー', values: ['ベージュ', 'ブラック'] }],
      attrs: [['本体横幅', '70cm']], desc: '幅75cm 10cm' }), 200, ['spec_mismatch', 'color_unspecified', 'price_mismatch']);
  t('set_mismatch: カードがセット・実SKUが単体', { name: 'BLUETTI EB3A 130Wソーラーパネルセット', price: '49800' },
    mkPage({ itemName: 'BLUETTI EB3A ポータブル電源 268Wh', makerModel: 'EB3A', brand: 'BLUETTI', price: 29800 }), 200, ['set_mismatch']);
  t('set_mismatch: セット軸の先頭値が「なし」', { name: 'BLUETTI EB3A 268Wh（130Wソーラーパネルセット）', price: '32900' },
    mkPage({ itemName: 'BLUETTI ポータブル電源 268Wh EB3A セット130Wソーラーパネル', makerModel: 'EB3A', brand: 'BLUETTI', price: 32900, selectorValues: ['EB3A 268Wh スチールグレー', 'なし'],
      axes: [{ key: 'ポータブル電源のカラー', values: ['EB3A 268Wh スチールグレー'] }, { key: 'ソーラーパネル', values: ['なし', '130Wソーラーパネル', '100Wソーラーパネル'] }] }), 200, ['set_mismatch']);
  t('set_mismatch なし: 型番末尾の + はセット扱いしない', { name: 'Coleman ツーリングドームエアー DARKROOM ST+(スタート)', price: '30000' },
    mkPage({ itemName: 'コールマン ツーリングドームエアー DARKROOM ST+', brand: 'Coleman', price: 30000 }), 200, [], ['set_mismatch']);
  t('set_mismatch なし: 容量 "40+5" はセットではない', { name: 'ミレー サースフェー NX 40+5 MIS0754 ブラック Mサイズ', price: '29700' },
    mkPage({ itemName: 'ミレー サースフェー NX 40+5 MIS0754', makerModel: 'MIS0754', brand: 'ミレー', price: 29700, selectorValues: ['DEEP RED', 'M'], axes: [{ key: 'カラー', values: ['DEEP RED', 'BLACK'] }, { key: 'サイズ', values: ['M', 'L'] }] }), 200, [], ['set_mismatch']);
  t('set_mismatch なし: 「カセットガス」の セット は除く', { name: 'イワタニ カセットガス ジュニアコンパクトバーナー CB-JCB', price: '4500' },
    mkPage({ itemName: 'Iwatani カセットガス バーナー CB-JCB', makerModel: 'CB-JCB', brand: 'Iwatani', price: 4500, selectorValues: ['単品'], axes: [{ key: 'セット購入がお得！', values: ['単品', 'カセットガス3本セット'] }] }), 200, [], ['set_mismatch']);
  t('set_mismatch なし: 軸の値 "MDX+" の末尾 + はセットではない', { name: 'Coleman タフスクリーン2ルームエアー DARKROOM LDX+', price: '87800' },
    mkPage({ itemName: 'コールマン タフスクリーン2ルームエアー DARKROOM LDX+/MDX+', brand: 'Coleman', price: 87800, selectorValues: ['LDX+'], axes: [{ key: 'style', values: ['MDX+', 'LDX+'] }] }), 200, [], ['set_mismatch']);
  t('set_mismatch なし: itemName の英語 with はセット語', { name: 'Anker Solix C1000 Gen 2 ＋ PS100 ソーラーパネル セット', price: '159900' },
    mkPage({ itemName: 'Anker Solix C1000 Gen 2 with Anker Solix PS100', makerModel: 'B1763', brand: 'ANKER', price: 159900 }), 200, [], ['set_mismatch', 'model_mismatch']);
  // ── 第2バッチ（campkit-20260921-25）で潰した誤検知 ──
  t('set_mismatch なし: "usb led+ランタン" の + は複合語（セットではない）', { name: 'LEDランタン ライト 充電式 1個/お得2個 Type-C usb led+ランタン', price: '1000' },
    mkPage({ itemName: 'LEDランタン ライト 充電式 1個/お得2個', price: 1000, selectorValues: ['1個単品', 'メール便'], axes: [{ key: '個数', values: ['1個単品', 'お得2個セット'] }, { key: '配送方法', values: ['メール便', '宅配便'] }] }), 200, [], ['set_mismatch']);
  t('set_mismatch: 数量軸の既定が 1個 でカードが 2個セット', { name: 'LEDランタン お得2個セット', price: '1800' },
    mkPage({ itemName: 'LEDランタン 1個/お得2個', price: 1000, selectorValues: ['1個単品'], axes: [{ key: '個数', values: ['1個単品', 'お得2個セット'] }] }), 200, ['set_mismatch']);
  t('set_mismatch なし: 括弧内の「ソーラー＋手回し＋乾電池」は仕様の並記', { name: 'LAD WEATHER 防災ラジオ ブラック（AM/FM・ソーラー＋手回し＋乾電池）', price: '5680' },
    mkPage({ itemName: 'ラジオ 防災グッズ 防災ラジオ ソーラー 手回し', brand: 'LAD WEATHER', price: 5680, axes: [{ key: 'カラー', values: ['01.オレンジ', '02.ブラック'] }] }), 200, [], ['set_mismatch']);
  t('set_mismatch なし: itemName の「A+B」はセット', { name: 'コールマン ルミエールランタン 純正LPガス燃料セット 205588', price: '5247' },
    mkPage({ itemName: 'Coleman(コールマン) ルミエールランタン+純正LPガス燃料[Tタイプ] 205588+5103A230T', makerModel: '205588+5103A230T', brand: 'Coleman', price: 5247 }), 200, [], ['set_mismatch']);
  t('set_mismatch なし: 「カラーなし」はセット軸の値ではない', { name: 'ロゴス Bamboo ナイフ＆まな板セット 81280009', price: '4950' },
    mkPage({ itemName: 'ロゴス Bamboo ナイフ＆まな板セット 81280009', makerModel: '81280009', brand: 'LOGOS', price: 4950, selectorValues: ['カラーなし', 'FREE'], axes: [{ key: 'カラー', values: ['カラーなし'] }, { key: 'サイズ', values: ['FREE', '選択してください'] }] }), 200, [], ['set_mismatch']);
  t('set_mismatch なし: 値の1つに「付き」があるだけのタイプ軸はセット軸ではない', { name: 'キャンピングムーン 折りたたみ火起し器 FD', price: '3125' },
    mkPage({ itemName: 'キャンピングムーン 火起こし器 チャコールスターター', makerModel: 'MT-19', brand: 'キャンピングムーン', price: 3125, selectorValues: ['五徳付き四角型（調理OK／2WAY）'], axes: [{ key: 'タイプを選ぶ', values: ['五徳付き四角型（調理OK／2WAY）', '四角型（スタンダード）', '三角型（コンパクト収納）'] }] }), 200, [], ['set_mismatch']);
  t('model_mismatch なし: 全角ハイフンの型番（ＤＧ－Ｎ００１）', { name: '大進 鉈 鋼付 両刃 165mm DG-N001', price: '3200' },
    mkPage({ itemName: '大進 鉈 鋼付 両刃 165mm ＤＧ－Ｎ００１', makerModel: 'ＤＧ－Ｎ００１', brand: 'DAISHIN', price: 3200, desc: '165mm' }), 200, [], ['model_mismatch']);
  t('model_mismatch なし: 説明文の「型番」欄にある（HHLU-S2020）', { name: '日立 ホットカーペット HHLU-S2020 2畳 本体', price: '14980' },
    mkPage({ itemName: '日立 ホットカーペット 電気カーペット 2畳 本体', brand: '日立', price: 14980, desc: '※画像はイメージです。 型番 HHLU-S2020 JANコード 4526044016167 重量 約3kg' }), 200, [], ['model_mismatch']);
  t('model_mismatch なし: 説明文の「【型番】JE-500A」', { name: 'Jackery ポータブル電源 500 New 512Wh（JE-500A）', price: '59800' },
    mkPage({ itemName: 'Jackery ポータブル電源 500 New 512Wh', makerModel: '500New', brand: 'Jackery', price: 59800, desc: '商品説明 【ポータブル電源・型番】JE-500A 【業界最軽量ボディ】 512Wh' }), 200, [], ['model_mismatch']);
  t('model_mismatch: 説明文に型番があっても「型番」欄でなければ見逃さない（AORA ページの meta に残る AC70）', { name: 'BLUETTI ポータブル電源 AC70 768Wh', price: '88000' },
    mkPage({ itemName: 'BLUETTI ポータブル電源 AORA 100 mini 1004.8Wh 700W', makerModel: 'AORA 100 mini', brand: 'BLUETTI', price: 96800, desc: '【安心の公式ショップ】BLUETTI AC70 768Wh/1000W (サージ2000W) 純正弦波' }), 200, ['model_mismatch']);
  t('type_mismatch なし: 先頭の販促文言（通常価格より2000円OFF）は型語にしない', { name: '☆シルバーコーティングタイプ 通常価格より2000円OFF！☆【楽天1位】 ワンタッチタープ 2.5m', price: '9980' },
    mkPage({ itemName: 'ワンタッチタープ 2.5m ワンタッチテント 遮光', makerModel: 'QC-TP250', brand: 'クイックキャンプ', price: 9980, desc: '2.5m' }), 200, ['store_copy'], ['type_mismatch']);
  t('spec_mismatch なし: 軸の値「極厚（10cm）」を name が「極厚 10cm」で名指し', { name: 'キャンプ マット 車中泊 [ 極厚 10cm 撥水 ] キャンプマット', price: '4980' },
    mkPage({ itemName: 'キャンプ マット 車中泊 [ 極厚 10cm 撥水 ]', brand: 'LAD WEATHER', price: 4980, selectorValues: ['01.ブラック', '極厚（10cm）', 'マット単品'],
      axes: [{ key: 'カラー', values: ['01.ブラック', '02.グレー'] }, { key: '厚み', values: ['中厚（8cm）', '極厚（10cm）'] }, { key: 'オプション', values: ['マット単品', '枕付き'] }] }), 200, ['color_unspecified'], ['spec_mismatch']);
  t('sale_page なし: 多SKUでも name が非色・非サイズ軸の値を名指し（car-camp-mat #4）', { name: 'FIELDOOR 車中泊マット Sサイズ 60×188cm 厚さ10cm ベージュ 大型二重バルブタイプ', price: '5940' },
    mkPage({ itemName: '【楽天1位】FIELDOOR 車中泊マット 厚さ10cm S M L エアーマット', makerModel: '車中泊マット', brand: 'FIELDOOR', price: 6710, skuCount: 70, manageNumber: 'max-a09610',
      selectorValues: ['S：幅60x長さ188cm', '大型二重バルブタイプ', 'ベージュ', 'マット1枚単品'],
      axes: [{ key: 'サイズ', values: ['S：幅60x長さ188cm', 'M：幅90x長さ195cm', 'L：幅120x長さ195cm'] }, { key: 'タイプ', values: ['大型二重バルブタイプ', '電動ポンプ内蔵タイプ'] }, { key: 'カラー', values: ['ベージュ', 'ブラウン', 'ブラック', 'カーキ'] }, { key: 'セット', values: ['マット1枚単品', 'マット2枚セット'] }] }), 200, ['price_mismatch'], ['sale_page', 'set_mismatch']);
  t('sale_page: SKU 多・name が指定しないタイプ軸あり（セット軸は根拠にしない）', { name: 'タープテント 2.5m ワンタッチタープテント 遮熱 遮光', price: '8999' },
    mkPage({ itemName: 'タープテント 2.5m 遮光 遮熱 ワンタッチタープテント', brand: 'モダンデコ', price: 9999, skuCount: 140, manageNumber: 'r-sku00000016',
      selectorValues: ['ベーシック', 'グレージュ', 'テント本体のみ'],
      axes: [{ key: 'タイプ', values: ['ベーシック', 'オーニング', 'ハイルーフ', 'ワイド'] }, { key: 'カラー', values: ['グレージュ', 'アースブラウン', 'ピスタチオグリーン', 'オールドセピア', 'テラコッタ', 'オリーブグリーン', 'サンドベージュ'] }, { key: 'オプション', values: ['テント本体のみ', 'サイドシート1枚', 'サイドシート2枚', '補強フレーム・ホワイト', '補強フレーム・ブラック'] }] }), 200, ['sale_page']);
  t('sale_page なし: 非色・非サイズ軸がセット/数量軸だけ（1枚/2枚 × サイズ13）', { name: '保冷剤 ステンレス製 アイスパック', price: '1680' },
    mkPage({ itemName: '【保冷剤 ステンレス製】驚異の保冷力 アイスパック', brand: 'COVELL KEVIN', price: 1580, skuCount: 70, manageNumber: 'bxgbp',
      selectorValues: ['1枚', '円形S(6.3*2.5cm)'],
      axes: [{ key: '数量', values: ['1枚', '2枚', '3枚', '4枚', '5枚', '6枚'] }, { key: 'サイズ', values: ['円形S(6.3*2.5cm)', '円形M(9.5*2cm)', '四角形S(12.7*7.6*1.6cm)', '四角形M(17.5*11.5*1.3cm)', 'ボトル形(4*4*16cm)'] }] }), 200, [], ['sale_page']);
  t('type_mismatch なし: 先頭20字が語の途中でも「ズール35」を型語として照合', { name: 'グレゴリー ズール35 ボルケニックブラック SM/MD', price: '33000' },
    mkPage({ itemName: 'グレゴリー ズール35 GREGORY ZULU 35 メンズ レディース', brand: 'GREGORY', price: 33000, selectorValues: ['SM／MD', 'ボルケニックブラック'], axes: [{ key: 'サイズ', values: ['SM／MD', 'MD／LG'] }, { key: 'カラー', values: ['ボルケニックブラック'] }] }), 200, []);
  t('sale_page: 全値が "set" のシリーズ軸はセット軸ではなく束ね軸（camp-cutlery #2: 31SKU・本数×シリーズ×色）', { name: 'ステンレス カトラリーセット（楽天1位）', price: '1980' },
    mkPage({ itemName: 'クーポン利用で２個目５０％OFF カトラリーセット 【楽天1位】 カトラリー シルバー ゴールド', makerModel: 'J-MAX.CO.LTD', brand: 'JH-STUDIO', price: 2998, skuCount: 31, manageNumber: '10000105',
      selectorValues: ['５本セット', 'original set', 'ティファニーブルーシルバー'],
      axes: [{ key: '本数', values: ['５本セット', '３本セット'] }, { key: 'シリーズ', values: ['original set', 'Vitella premium set'] }, { key: 'カラー', values: ['ティファニーブルーシルバー', 'ホワイトシルバー', 'ブラックシルバー', 'グレーシルバー', 'マットシルバー', 'ブラックゴールド', 'ホワイトゴールド', 'ピングゴールド'] }] }), 200, ['sale_page', 'price_mismatch'], ['set_mismatch']);
  t('set_mismatch なし: 数量軸の既定「4台」はセット扱い（カードもセット表記）', { name: 'キャンピングムーン フィールドラック 4個 セット ケース付き', price: '2680' },
    mkPage({ itemName: 'フィールドラック キャンピングムーン ラック 3段', makerModel: 'T-235-4T', brand: 'キャンピングムーン', price: 9680, selectorValues: ['4台（レイアウト自在！）', 'ラック＋収納ケース'],
      axes: [{ key: 'ラック数', values: ['4台（レイアウト自在！）', '3台（人気！）', '2台（定番！）', '1台（お試し！）'] }, { key: 'セット内容', values: ['ラック＋収納ケース', 'ラック＋天板＋収納ケース', 'ラックのみ'] }] }), 200, ['price_mismatch'], ['set_mismatch']);
  t('set_mismatch なし: 枚数 [2枚, 3枚]（付属プレート枚数＝モデル差）は数量軸ではない', { name: 'アイリスオーヤマ ホットプレート 焼肉プレート2枚・たこ焼きプレート3枚付き PIHA-A20B', price: '9980' },
    mkPage({ itemName: 'ホットプレート 焼肉 焼肉プレート コンパクト', makerModel: 'PIHA-A20B', brand: 'アイリスオーヤマ', price: 9980, selectorValues: ['通常モデル', '2枚'], axes: [{ key: 'モデル', values: ['ネット限定モデル', '通常モデル'] }, { key: '枚数', values: ['2枚', '3枚'] }] }), 200, [], ['set_mismatch']);
  t('set_mismatch なし: 「4点脚ロックタイプ」は数量ではない（sale_page は維持）', { name: 'FIELDOOR ワンタッチタープテント 3m×3m 頑丈スチールフレーム', price: '8800' },
    mkPage({ itemName: '【楽天1位】FIELDOOR ワンタッチタープテント 3m×3m', makerModel: 'ワンタッチタープテント', brand: 'FIELDOOR', price: 10780, skuCount: 151, manageNumber: 'a04309_sale',
      selectorValues: ['4点脚ロックタイプ', '標準：グリーン', 'タープ本体のみ'],
      axes: [{ key: '【選べるロックタイプ】', values: ['4点脚ロックタイプ', 'センターロックタイプ'] }, { key: '【選べるトップカバー】', values: ['標準：グリーン', '標準：ブルー', '標準：オレンジ'] }, { key: '【追加で選べるオプションセット】', values: ['タープ本体のみ', 'Ａ：フレーム強化サポートセット', 'Ｂ：バグガードスクリーンセット'] }] }), 200, ['sale_page', 'price_mismatch'], ['set_mismatch']);
  t('spec/size: 範囲 "40〜60L" は spec_mismatch にせず、L 軸があれば size_unspecified', { name: 'tousen 登山リュック 40〜60L 大容量', price: '4280' },
    mkPage({ itemName: '登山リュック 40～60L', price: 4280, selectorValues: ['40L', 'レッド'], axes: [{ key: 'サイズ', values: ['40L', '50L', '60L'] }, { key: 'カラー', values: ['レッド', 'ブラック'] }] }), 200, ['size_unspecified', 'color_unspecified'], ['spec_mismatch']);
  t('spec: 軸の値に無い数値（600W）は全文で見る', { name: 'BLUETTI EB3A 268Wh 600W出力', price: '32900' },
    mkPage({ itemName: 'BLUETTI EB3A 268Wh 600W出力', makerModel: 'EB3A', brand: 'BLUETTI', price: 32900, selectorValues: ['なし'], axes: [{ key: 'ソーラーパネル', values: ['なし', '130Wソーラーパネル'] }] }), 200, [], ['spec_mismatch']);
  t('size_unspecified なし: "SM/MD" が軸の値そのもの', { name: 'グレゴリー ズール35 ボルケニックブラック SM/MD', price: '33000' },
    mkPage({ itemName: 'グレゴリー ズール35', brand: 'GREGORY', price: 33000, selectorValues: ['SM／MD', 'ボルケニックブラック'], axes: [{ key: 'サイズ', values: ['SM／MD', 'MD／LG'] }, { key: 'カラー', values: ['ボルケニックブラック'] }] }), 200, [], ['size_unspecified']);
  t('size_unspecified なし: 「1人用 2人用」は用途の説明', { name: 'アイリスオーヤマ たき火台 1人用 2人用 TKB-ST43', price: '9880' },
    mkPage({ itemName: 'たき火台 1人用 2人用 TKB-ST43', makerModel: 'TKB-ST43', price: 9880 }), 200, [], ['size_unspecified']);
  t('store_copy: 「5/6まで延長63%0FF！＼…／」', { name: '5/6まで延長63%0FF！＼アレンジ自由自在の秘密基地／ GIMMICK (ギミック) パップテント m8 GM-TT3000', price: '20000' }, null, 404, ['404', 'store_copy']);
  t('set_mismatch: カードが単品・先頭SKUがセット', { name: 'FIELDOOR ワンタッチテント 200cm', price: '8910' },
    mkPage({ itemName: 'FIELDOOR ワンタッチテント 200cm', brand: 'FIELDOOR', price: 12320, selectorValues: ['グレー', 'グランドシート付セット'], axes: [{ key: 'カラー', values: ['グレー', 'ベージュ'] }, { key: 'セット', values: ['グランドシート付セット', 'テント本体のみ'] }] }), 200, ['set_mismatch']);
  t('set_mismatch なし: 両方セット', { name: 'Coleman ガスランタン 3点セット', price: '10846' },
    mkPage({ itemName: 'Coleman ガスランタン+ガス+マントル【お得な3点セット】', brand: 'Coleman', price: 10846 }), 200, [], ['set_mismatch']);
  t('color_unspecified: 色軸2値以上・name に色なし', { name: 'カリマー タトラ20 デイパック', price: '9900' },
    mkPage({ itemName: 'カリマー karrimor タトラ20 tatra 20', brand: 'karrimor', price: 9900, axes: [{ key: 'カラー', values: ['Black', 'Navy', 'Olive'] }] }), 200, ['color_unspecified']);
  t('color_unspecified なし: name に色あり', { name: 'カリマー タトラ20 ブラック', price: '9900' },
    mkPage({ itemName: 'カリマー karrimor タトラ20 tatra 20', brand: 'karrimor', price: 9900, axes: [{ key: 'カラー', values: ['Black', 'Navy', 'Olive'] }] }), 200, [], ['color_unspecified']);
  t('color_unspecified なし: 軸名が「カラー」でも値がサイズ', { name: 'ラドウェザー 防寒グローブ', price: '1480' },
    mkPage({ itemName: '防寒グローブ', brand: 'ラドウェザー', price: 1480, axes: [{ key: 'カラー', values: ['Sサイズ', 'Mサイズ', 'Lサイズ'] }] }), 200, ['size_unspecified'], ['color_unspecified']);
  t('color_unspecified: name に「黒/白」並記', { name: 'ZEN Camps アッシュキャリー 黒/白', price: '3000' },
    mkPage({ itemName: 'アッシュキャリー', price: 3000 }), 200, ['color_unspecified']);
  t('size_unspecified: サイズ軸2値以上・name にサイズなし', { name: 'モンベル ダウンハガー', price: '30000' },
    mkPage({ itemName: 'mont-bell ダウンハガー', brand: 'モンベル', price: 30000, axes: [{ key: 'サイズ', values: ['S', 'M', 'L'] }] }), 200, ['size_unspecified']);
  t('size_unspecified: name に「ノーマル/ビッグサイズ」並記（404 でも出す）', { name: 'Soomloom パップテント TC ノーマル/ビッグサイズ', price: '15000' }, null, 404, ['404', 'size_unspecified']);
  t('size_unspecified: name に「1.9L 3.8L」の同単位並記', { name: 'VASTLAND アイスコンテナ 1.9L 3.8L', price: '3980' },
    mkPage({ itemName: 'VASTLAND アイスコンテナ 1.9L 3.8L', brand: 'VASTLAND', price: 3980, selectorValues: ['シルバー', '1.9L'], axes: [{ key: 'カラー', values: ['シルバー', 'ブラック'] }, { key: 'サイズ', values: ['1.9L', '3.8L'] }] }), 200, ['size_unspecified'], ['spec_mismatch']);
  t('size_unspecified なし: 「3m×2.5m」は寸法であって並記ではない', { name: 'FIELDOOR タープ 3m×2.5m', price: '3980' },
    mkPage({ itemName: 'FIELDOOR タープ 300×250cm', brand: 'FIELDOOR', price: 3980 }), 200, [], ['size_unspecified']);
  t('size_unspecified なし: 「501212 20L」（型番＋容量）は並記ではない', { name: 'カリマー タトラ20 KARRIMOR tatra20 501212 20L ブラック', price: '9900' },
    mkPage({ itemName: 'カリマー タトラ20 karrimor tatra 20 501212 20L', brand: 'karrimor', price: 9900 }), 200, [], ['size_unspecified']);
  t('size_unspecified なし: name に M サイズ', { name: 'ZEN Camps アッシュキャリー Mサイズ', price: '3000' },
    mkPage({ itemName: 'アッシュキャリー', price: 3000, axes: [{ key: 'サイズ', values: ['S', 'M', 'L'] }] }), 200, [], ['size_unspecified']);
  t('store_copy: 【楽天1位】', { name: '【楽天1位】DOD ワンポールテント', price: '20000' },
    mkPage({ itemName: 'DOD ワンポールテント', brand: 'DOD', price: 20000 }), 200, ['store_copy']);
  t('store_copy: 送料無料（裸）・404 でも出す', { name: '送料無料 テント ワンタッチ', price: '20000' }, null, 404, ['404', 'store_copy']);
  t('store_copy なし: 通常の name', { name: 'DOD ワンポールテントS T3-44-TN', price: '20000' },
    mkPage({ itemName: 'DOD ワンポールテントS T3-44-TN', makerModel: 'T3-44-TN', brand: 'DOD', price: 20000 }), 200, [], ['store_copy']);
  t('sale_page: SKU 151・型番なし', { name: 'FIELDOOR ワンタッチタープテント 3m×3m', price: '8800' },
    mkPage({ itemName: '【楽天1位】遮光/遮熱モデル追加！FIELDOOR ワンタッチタープテント 3m×3m', makerModel: 'ワンタッチタープテント', brand: 'FIELDOOR', price: 10780, skuCount: 151, manageNumber: 'a04309_sale',
      axes: [{ key: 'タイプ', values: ['4点脚ロック', 'センターロック'] }, { key: 'カラー', values: ['グリーン', 'ブルー', 'オレンジ', 'ブラック', 'ホワイト', 'カーキ'] }] }), 200, ['sale_page', 'price_mismatch']);
  t('sale_page なし: itemName の「セール sale」は根拠にしない（色×色の 21 SKU）', { name: 'OSOTO ゆらふわモック ノーマルタイプ 自立式ハンモック', price: '8082' },
    mkPage({ itemName: '【送料無料】 自立式ハンモック ゆらふわモック ノーマルタイプ セール sale', price: 8480, skuCount: 21, manageNumber: 'ss-yurafuwamock',
      axes: [{ key: '＜スタンドカラー＞', values: ['スタンドカラー/ホワイト', 'ブラック', 'ブラウン'] }, { key: '＜ネットカラー＞', values: ['ネットカラー/レインボー', 'ホワイト', 'ブラウン', 'ブラック', 'モスグリーン', 'イエロー', 'ベージュ'] }] }), 200, [], ['sale_page']);
  t('sale_page なし: サイズ×色だけの 49 SKU は通常の変種ページ', { name: 'DAICHU リュックカバー ブラック XS', price: '1000' },
    mkPage({ itemName: 'リュック カバー レインカバー', price: 1000, skuCount: 49, manageNumber: '20230207-backpack-cover',
      axes: [{ key: 'サイズ', values: ['XS(15-25L)', 'S(30-40L)', 'M(40-50L)', 'L(55-65L)', 'XL(70-75L)', 'XXL(75-85L)', 'XXXL(90-100L)'] }, { key: 'カラー', values: ['ブラック', 'シルバー', 'カーキ', '蛍光黄色', 'オレンジ', 'ブルー', 'ネイビー'] }] }), 200, [], ['sale_page']);
  t('sale_page なし: 色軸が多くても SKU 少・セール語なし', { name: 'カリマー タトラ20 ブラック', price: '9900' },
    mkPage({ itemName: 'カリマー karrimor タトラ20 tatra 20', brand: 'karrimor', price: 9900, skuCount: 12, axes: [{ key: 'カラー', values: ['Black', 'Navy', 'Olive', 'Red', 'Blue', 'Gray', 'Green', 'Tan', 'Sand', 'Pink', 'White', 'Khaki'] }] }), 200, [], ['sale_page']);
  t('price_mismatch: +3% 以上', { name: 'SOTO ST-310', price: '6000' },
    mkPage({ itemName: 'SOTO ST-310', makerModel: 'ST-310', price: 6400 }), 200, ['price_mismatch']);
  t('price_mismatch なし: +1.6%', { name: 'SOTO ST-310', price: '6000' },
    mkPage({ itemName: 'SOTO ST-310', makerModel: 'ST-310', price: 6096 }), 200, [], ['price_mismatch']);
  t('OK: 全部一致', { name: 'DOD ワンポールテントS T3-44-TN タン 3人用', price: '20000' },
    mkPage({ itemName: 'DOD ワンポールテントS T3-44-TN タン', makerModel: 'T3-44-TN', brand: 'DOD', price: 20000, attrs: [['最大収容人数', '3']], axes: [{ key: 'カラー', values: ['タン', 'ブラック'] }] }), 200, []);

  // ── 第3バッチ（campkit-20260921-26）で潰した誤検知 ──
  t('set_mismatch なし: 数量軸の「1個入り」は単品（field-rack #5）', { name: 'PYKES PEAK キャンプラック（2〜4段対応）', price: '2480' },
    mkPage({ itemName: 'キャンプラック 大きい 2枚 3枚 収納 セット', makerModel: 'P0324SRCK1-BLK', brand: 'PYKES PEAK', price: 2480, selectorValues: ['1個入り'], axes: [{ key: '入り数', values: ['1個入り', '2個入り', '3個入り'] }] }), 200, [], ['set_mismatch']);
  t('set_mismatch なし: name が選択値「テント本体セットのみ」を名指し（fieldoor-tent #2）', { name: 'FIELDOOR トンネルテント480 3〜4人用 2ルーム カーキ 標準タイプ（テント本体セットのみ）耐水圧1,500mm', price: '19800' },
    mkPage({ itemName: '【楽天1位】FIELDOOR テント 大型 ドームテント トンネルテント 480', makerModel: 'トンネルテント480', brand: 'FIELDOOR', price: 19800, selectorValues: ['ライトベージュ：標準タイプ', 'テント本体セットのみ'],
      axes: [{ key: 'カラー/生地', values: ['ライトベージュ：標準タイプ', 'カーキ：標準タイプ'] }, { key: 'セット', values: ['テント本体セットのみ', 'グランドシート付', 'インナーマット付', 'フルセット'] }] }), 200, [], ['set_mismatch']);
  t('set_mismatch なし: 「4点脚ロック」の 点 は数量ではない（fieldoor-tent #5）', { name: 'FIELDOOR ワンタッチタープテント 2.5m×2.5m サイドシート1枚付 4点脚ロック 標準生地 ホワイト', price: '11990' },
    mkPage({ itemName: 'FIELDOOR ワンタッチタープテント 2.5m×2.5m サイドシート1枚付 横幕セット', makerModel: 'ワンタッチタープテント', brand: 'FIELDOOR', price: 11990, selectorValues: ['4点脚ロックタイプ', '標準：グリーン', 'タープ本体/シート1枚のみ'],
      axes: [{ key: 'ロックタイプ', values: ['4点脚ロックタイプ', 'センターロックタイプ'] }, { key: 'トップカバー', values: ['標準：グリーン', '標準：ホワイト'] }, { key: 'オプション', values: ['タープ本体/シート1枚のみ', 'Ａ：フレーム強化サポートセット'] }] }), 200, [], ['set_mismatch']);
  t('set_mismatch なし: 「UPF50+ 耐水圧」の + は等級の接尾辞（naturehike-tent #3）', { name: 'Naturehike Dune7.6 2ルーム ドーム型テント UVカット UPF50+ 耐水圧2000mm 2人用', price: '49990' },
    mkPage({ itemName: 'テント 2ルーム ドーム型テント Dune7.6 Naturehike', makerModel: 'CNH22ZP028', brand: 'Naturehike', price: 49990, selectorValues: ['テント'], axes: [{ key: 'バリエーション', values: ['テント', 'テント+インナーテント', 'テント+薪ストーブ', 'テント+グランドシート'] }], desc: '2000mm 2人用' }), 200, [], ['set_mismatch']);
  t('set_mismatch なし: 「通気口 あり/なし」は価格差 1.6% の仕様オプション（low-style-bonfire #2）', { name: 'LUHANA 焚き火台 八炎 ロースタイルver.', price: '6390' },
    mkPage({ itemName: '焚き火台 大型 【LUHANA 八炎 YAEN】直径45cm', makerModel: 'TD-YEN-001', brand: 'LUHANA', axes: [{ key: 'サイズ', values: ['直径45cm'] }, { key: '通気口', values: ['あり', 'なし'] }],
      skus: [[['直径45cm', 'あり'], 6490], [['直径45cm', 'なし'], 6390]] }), 200, [], ['set_mismatch']);
  t('set_mismatch: 「シュラフコンフォーター あり/なし」は価格差 93% の同梱品（logos-sleeping-bag #3）', { name: 'LOGOS ロゴス 抗菌防臭 丸洗いディープスリーパーSC 封筒型', price: '4980' },
    mkPage({ itemName: '【ロゴス公式】抗菌防臭 丸洗いディープスリーパーSC LOGOS ロゴス 寝袋 封筒型', makerModel: '72602055', brand: 'LOGOS', axes: [{ key: '商品をお選びください。', values: ['ディープスリーパーSC・5', 'ディープスリーパーSC・0'] }, { key: 'シュラフコンフォーター・体感6℃', values: ['あり', 'なし'] }],
      skus: [[['ディープスリーパーSC・5', 'あり'], 9610], [['ディープスリーパーSC・5', 'なし'], 4980]] }), 200, ['set_mismatch', 'price_mismatch']);
  t('type_mismatch なし: 型番 F-1002C が一致していれば店の呼び方（ハイバックチェア）が違ってもよい（fireproof-chair #5）', { name: 'CAMPING MOON リラックスローチェア F-1002C コヨーテ 帆布', price: '8712' },
    mkPage({ itemName: 'キャンピングムーン アウトドアチェア ハイバック 折りたたみチェア', makerModel: 'F-1002C', brand: 'CAMPINGMOON', price: 9680, selectorValues: ['コヨーテ'], axes: [{ key: 'カラー', values: ['ブラック', 'コヨーテ', 'カーキ'] }] }), 200, ['price_mismatch'], ['type_mismatch']);
  t('type_mismatch: 型番が一致しなければ型語の照合はする（dod-tarp のポール取り違え）', { name: 'DOD オクラタープ TT8-583-TN ポリコットン 難燃 オクタタープ', price: '18900' },
    mkPage({ itemName: 'DOD ポール ビッグタープポール XP5-507 dod アウトドア キャンプ テント タープ ポール', makerModel: 'XP5-507R', brand: 'DOD（ディーオーディー）', price: 4180 }), 200, ['type_mismatch', 'model_mismatch', 'price_mismatch']);
  t('type_mismatch なし: 複合語「ファミリー封筒型寝袋」を カタカナ/漢字 で分けて照合（naturehike-sleeping-bag #4）', { name: 'Naturehike ファミリー封筒型寝袋 1〜4人使用可能 200×115cm 幅広 ワイド 連結可能 丸洗い', price: '7990' },
    mkPage({ itemName: 'ポイント15倍 寝袋 シュラフ 封筒型 家族用 200x115cm 幅広 ワイド オールシーズン 洗える Naturehike 連結可', makerModel: 'cnk2300019', brand: 'Naturehike', price: 7990, axes: [{ key: 'カラー', values: ['ブラウン', 'グリーン'] }] }), 200, ['color_unspecified'], ['type_mismatch']);
  t('type_mismatch なし: 英字の型語「catalyst」が itemName の「CATALYST 22」に一致（mysteryranch-backpack #1）', { name: 'ミステリーランチ カタリスト22 CATALYST 22 ブラック 21L', price: '25300' },
    mkPage({ itemName: '【日本正規品】 ミステリーランチ リュック メンズ レディース 大容量 MYSTERY RANCH 21L A4 B4 CATALYST 22', makerModel: 'MTR00117', brand: 'MYSTERY RANCH / ミステリーランチ', price: 25300, attrs: [['バッグの容量', '21L']], selectorValues: ['BLACK'], axes: [{ key: 'カラー', values: ['BLACK', 'PONDEROSA'] }] }), 200, [], ['type_mismatch']);
  t('type_mismatch なし: 先頭20字が英字ブランド名（CAMPINGMOON）だけの name は英字語だけで照合しない（gas-lantern #5）', { name: 'キャンピングムーン CAMPINGMOON ガスランタン ガスキャンドル ランタン ガスランプ キャンプ', price: '4260' },
    mkPage({ itemName: 'キャンピングムーン ガスランタン ガスキャンドル ランタン ガスランプ キャンプ', makerModel: 'BKT-1D15', brand: 'キャンピングムーン', price: 4260 }), 200, [], ['type_mismatch']);
  t('sale_page なし: 店名（futon-outlet）のセール語は根拠にしない（hot-water-bottle #5）', { name: 'スリーププラス 充電式ソフト湯たんぽ 暖ループ（カバー付き）', price: '2300', url: 'https://item.rakuten.co.jp/futon-outlet/10002239/' },
    mkPage({ itemName: '充電式 湯たんぽ あったかカバー付き ゆたんぽ 暖ループ ECO', price: 2300, skuCount: 8, manageNumber: '10002239', selectorValues: ['ノーマル', 'ブラウン／シープ'],
      axes: [{ key: 'タイプ', values: ['ノーマル'] }, { key: 'カラー', values: ['ネイビー／サンゴ', 'ベージュ／サンゴ', 'ブラウン／シープ', '杢グレー', '杢ベージュ'] }] }), 200, ['color_unspecified'], ['sale_page']);
  t('sale_page: 商品コード（a04309_sale）のセール語は従来どおり根拠にする', { name: 'FIELDOOR ワンタッチタープテント 3m×3m', price: '8800', url: 'https://item.rakuten.co.jp/smile88/a04309_sale/' },
    mkPage({ itemName: 'FIELDOOR ワンタッチタープテント 3m×3m', makerModel: 'ワンタッチタープテント', brand: 'FIELDOOR', price: 10780, skuCount: 20, manageNumber: 'a04309_sale',
      axes: [{ key: 'タイプ', values: ['4点脚ロック', 'センターロック'] }, { key: 'カラー', values: ['グリーン', 'ブルー', 'オレンジ', 'ブラック'] }] }), 200, ['sale_page']);
  t('sale_page なし: 注文者区分（個人/法人）の軸は束ね軸ではない（group-camp-tent #1）', { name: '特大 3×6m ワンタッチ タープテント 大型 6人', price: '24999' },
    mkPage({ itemName: '楽天1位 法人価格有 特大 3×6m ワンタッチ タープテント 3m 6m 大型テント 6人用', brand: 'タンスのゲン', price: 32800, skuCount: 36, manageNumber: '1900002000', selectorValues: ['オリーブ', '本体のみ', '有り', '個人のお客様'],
      axes: [{ key: 'カラー', values: ['オリーブ', 'オフホワイト', 'ネイビー'] }, { key: 'オプション', values: ['本体のみ', 'サイドシート2枚付', 'サイドシート3枚付'] }, { key: 'おもり', values: ['有り', '無し'] }, { key: 'ご注文者様', values: ['個人のお客様', '法人のお客様'] }] }), 200, ['price_mismatch'], ['sale_page']);
  t('spec_mismatch なし: 「厚手8cm/12cm」は厚さの並記（naturehike-mat #1）', { name: 'Naturehike 高R値 エアーマット R4.6/R5.8/R8.8 厚手8cm/12cm 超軽量 連接可能 インフレーターマット', price: '12490' },
    mkPage({ itemName: 'エアーマット シングル 高R値 厚手 8cm/12cm Naturehike', makerModel: 'CNK2450WS014', brand: 'Naturehike', price: 12490, selectorValues: ['R4.6（厚さ8CM）', 'グリーン', 'レクタ型M（186x58cm）'],
      axes: [{ key: 'R値', values: ['R4.6（厚さ8CM）', 'R5.8（厚さ8CM）', 'R8.8（厚さ12CM）'] }, { key: 'カラー', values: ['グリーン', 'シルバー'] }, { key: 'サイズ', values: ['マミー型S（168x58cm）', 'レクタ型M（186x58cm）'] }] }), 200, ['size_unspecified'], ['spec_mismatch']);
  t('spec_mismatch なし: 「5000mAh/10000mAh」は容量の並記（mobile-battery-camp #5）', { name: 'モバイルバッテリー 5000mAh/10000mAh 小型 軽量 ケーブル内蔵', price: '1760' },
    mkPage({ itemName: 'モバイルバッテリー 超マット加工 大容量 小型 5000/10000mAh', makerModel: '100-1', brand: 'inklink', price: 2660, selectorValues: ['LCタイプ', '10000mAh', 'さくらピンク'],
      axes: [{ key: 'コネクタタイプ', values: ['LCタイプ', 'CCタイプ'] }, { key: '容量・表示タイプ', values: ['5000mAh　ベーシック', '5000mAh　デジタル', '10000mAh'] }, { key: 'カラー', values: ['さくらピンク', 'ブラック'] }] }), 200, ['size_unspecified', 'price_mismatch'], ['spec_mismatch']);

  // ── 第4バッチ（campkit-20260921-27）で潰した誤検知 ──
  t('model_mismatch なし: 「MAX35％OFF」の販促数値は型番ではない（stylish-camp-tent #4）', { name: '【MAX35％OFFクーポン配布中！GW応援】 Naturehike ワンタッチテント ロッジ型 テント 前室 Ti BLACK 小屋 2-4人用 UPF11000+ ポール付き', price: '39990' },
    mkPage({ itemName: 'ポイント15倍＆5％OFFクーポン配布中！ ワンタッチテント ロッジ型 テント Naturehike wuji6 前室 Ti BLACK 小屋 2-4人用 UPF11000+ ポール付き', makerModel: 'Village 6.0', brand: 'Naturehike', price: 39990, selectorValues: ['Village 6.0'], axes: [{ key: 'バリエーション', values: ['Village 6.0', 'Village 6.0 Plus'] }] }), 200, ['store_copy'], ['model_mismatch']);
  t('model_mismatch: 販促数値を除いても実在の型番（ST-760）はそのまま照合する（torch-burner #3: ST-760 はボンベの型番で本体は ST-451）', { name: 'SOTO（新富士バーナー）フィールドチャッカー ST-760 パワートーチ', price: '3290' },
    mkPage({ itemName: 'PSLPG適合品 フィールドチャッカー 日本製 パワートーチ ガスバーナー ST-700付属 ST-451 SOTO ソト', makerModel: 'ST-451', brand: '新富士バーナー / ソト / SOTO', price: 3290, desc: '使用ボンベ：ST-760、ST-700、ST-712' }), 200, ['model_mismatch']);
  t('set_mismatch なし: 「キャンプラック 3セット」は商品自体の名前（itemName「3セット」・型番 -3SET）でオプション軸「のみ」は付属品の話（takibi-table #2）', { name: 'PYKES PEAK キャンプラック 3セット（焚き火テーブル）', price: '5680' },
    mkPage({ itemName: 'キャンプ ラック 3セット キャンピングラック グラウンド 焚き火テーブル PYKES PEAK', makerModel: 'P0078CRCK3-BLK-3SET', brand: 'PYKES PEAK', price: 5680, selectorValues: ['ブラック', 'キャンプラックのみ'],
      axes: [{ key: 'カラー', values: ['ブラック'] }, { key: 'オプション', values: ['キャンプラックのみ', 'ケース付き（オリーブ）'] }] }), 200, [], ['set_mismatch']);
  t('set_mismatch: 「2本セット」が軸の値にある（1本のみ/2本セット）なら軸が選ぶセットなので従来どおり（trekking-pole #4）', { name: 'TheBestDay A7075アルミ トレッキングポール 260g 2本セット', price: '4980' },
    mkPage({ itemName: 'トレッキングポール 登山ストック 折りたたみ式 軽量A7075アルミ製 260g 1本 2本', makerModel: 'SENUN-955', brand: 'SENUN', price: 2980, selectorValues: ['ブラック（長さ100～120cm）', '1本のみ'],
      axes: [{ key: 'カラー', values: ['ブラック（長さ100～120cm）', 'レッド（長さ100～120cm）'] }, { key: 'セット内容', values: ['1本のみ', '2本セット'] }] }), 200, ['set_mismatch', 'price_mismatch']);
  t('sale_page なし: 「基本セット/インナーテント×1」は本体のみ相当＝セット軸（束ね軸ではない）（two-room-tent-guide #1）', { name: '【楽天1位】FIELDOOR テント 大型 ドームテント トンネルテント 620 260cm×620cm 2ルームテント 4人用 6人用 8人用 インナーテント付き', price: '28710' },
    mkPage({ itemName: '【楽天1位】FIELDOOR テント 大型 ドームテント トンネルテント 620 260cm×620cm 2ルームテント 4人用 6人用 8人用 インナーテント付き', makerModel: 'トンネルテント620', brand: 'FIELDOOR', price: 28710, skuCount: 32, manageNumber: 'a16865',
      selectorValues: ['ライトベージュ：標準タイプ', '基本セット/インナーテント×1'],
      axes: [{ key: 'カラー/生地', values: ['ライトベージュ：標準タイプ', 'ダークブラウン：標準タイプ', 'カーキ：標準タイプ', 'グレー：遮光高耐水タイプ'] }, { key: 'セット', values: ['基本セット/インナーテント×1', 'A/基本＆180cm追加ポール2組', 'B/基本＆追加インナーテント', 'C/基本＆専用グランドシート1枚', 'D/基本＆追加インナー/ポール', 'E/基本＆ポール/グランドシート1枚', 'F/基本＆追加インナー/シート2枚', 'G/基本＆インナー/シート2/ポール'] }] }), 200, ['store_copy'], ['sale_page', 'set_mismatch']);
  t('set_mismatch: 「基本セット」が既定でもカードがセット表記（グランドシートセット）なら従来どおり', { name: 'FIELDOOR トンネルテント620 グランドシートセット', price: '32560' },
    mkPage({ itemName: 'FIELDOOR テント トンネルテント 620', makerModel: 'トンネルテント620', brand: 'FIELDOOR', price: 28710, selectorValues: ['ライトベージュ：標準タイプ', '基本セット/インナーテント×1'],
      axes: [{ key: 'カラー/生地', values: ['ライトベージュ：標準タイプ', 'カーキ：標準タイプ'] }, { key: 'セット', values: ['基本セット/インナーテント×1', 'C/基本＆専用グランドシート1枚'] }] }), 200, ['set_mismatch', 'price_mismatch']);
  t('spec_mismatch なし: 「耐水圧2,000mm」の桁区切りカンマ（one-pole-tent #5）', { name: 'ワンポールテント 軽量 UVカット メッシュ インナーシート 4人用 ポリエステル 耐水圧2,000mm 大型', price: '7980' },
    mkPage({ itemName: 'テント ポールテント ワンポールテント 軽量 UVカット メッシュ インナーシート 4人 2000mmポリエステル', brand: 'モダンデコ', price: 12980, axes: [{ key: 'カラー', values: ['サンドベージュ', 'アッシュホワイト'] }] }), 200, ['color_unspecified', 'price_mismatch'], ['spec_mismatch']);
  t('spec_mismatch なし: 照合先が「2,000mm」表記でも一致', { name: 'テント 耐水圧2000mm', price: '7980' },
    mkPage({ itemName: 'テント 耐水圧2,000mm', price: 7980 }), 200, [], ['spec_mismatch']);
  t('spec_mismatch: カンマを外しても数値が違えば従来どおり（2,000mm ↔ 1500mm）', { name: 'テント 耐水圧2,000mm', price: '7980' },
    mkPage({ itemName: 'テント 耐水圧1500mm', price: 7980 }), 200, ['spec_mismatch']);
  t('type_mismatch なし: 「Coleman(コールマン)」の別名込みで先頭20字を数えず、「スパイスボックス」を型語に含める（spice-box #2）', { name: 'Coleman(コールマン) 調味料入れ スパイスボックス', price: '2174' },
    mkPage({ itemName: '【最大10万P当選★要エントリー★9/20～9/30】 コールマン (Coleman) スパイスボックス (コヨーテ) キャンプ用品 ファミリークックウェア コヨーテ 218581', makerModel: '2185814', brand: 'コールマン', price: 1680, selectorValues: ['コヨーテ', '.'], axes: [{ key: 'カラー', values: ['コヨーテ'] }, { key: 'サイズ', values: ['.'] }] }), 200, ['price_mismatch'], ['type_mismatch']);
  t('type_mismatch: ブランド別名を外しても型語が実リンク先に無ければ従来どおり', { name: 'Coleman(コールマン) 調味料入れ スパイスボックス', price: '2174' },
    mkPage({ itemName: 'コールマン (Coleman) クーラーボックス 25QT', brand: 'コールマン', price: 2174 }), 200, ['type_mismatch']);
  t('type_mismatch なし: 先頭の「お買い物マラソン」は飛ばし、分割前に販促文言を外す（camp-chair-lightweight #4 の副作用）', { name: '「お買い物マラソン」Moon Lence アウトドアチェア キャンプ椅子 折りたたみ コンパクト 超軽量907g CH-7', price: '3799' },
    mkPage({ itemName: 'Moon Lence アウトドアチェア 折りたたみ キャンプ椅子 コンパクト 907g超軽量 耐荷重150kg CH-7', makerModel: 'CH-7B', brand: 'MOON LENCE', price: 3799, axes: [{ key: 'カラー', values: ['ブラック', 'オレンジ'] }] }), 200, ['store_copy', 'color_unspecified'], ['type_mismatch']);

  // ── 第5バッチ（campkit-20260921-28）で潰した誤検知 ──
  t('type_mismatch なし: 英字の商品名「ZZZ BAG」が itemName に連続して一致すればカテゴリ語（寝袋）が無くてもよい（washable-sleeping-bag #5）', { name: '[ナンガ] NANGA ZZZ BAG 10 寝袋', price: '11190' },
    mkPage({ itemName: 'ナンガ(NANGA) ZZZ BAG 10 REGULAR FGY N2600-2C091E154071', makerModel: 'N2600-2C091E154071', brand: 'ナンガ(NANGA)', price: 12650 }), 200, ['price_mismatch'], ['type_mismatch']);
  t('type_mismatch: 英字の並びが一致しなければ従来どおり（ZZZ BAG ↔ オーロラライト）', { name: '[ナンガ] NANGA ZZZ BAG 10 寝袋', price: '11190' },
    mkPage({ itemName: 'ナンガ(NANGA) オーロラライト 450DX REGULAR', makerModel: 'N14DX', brand: 'ナンガ(NANGA)', price: 11190 }), 200, ['type_mismatch']);
  t('type_mismatch: 英字1語（BAG）だけの一致・ブランド語（NANGA）との並びは根拠にしない', { name: 'NANGA BAG 寝袋', price: '11190' },
    mkPage({ itemName: 'ナンガ(NANGA) BAG ダウンジャケット', brand: 'ナンガ(NANGA)', price: 11190 }), 200, ['type_mismatch']);
  t('spec_mismatch なし: 「幅20×奥行20×高さ7.5cm」の 幅20 は仕様欄の同じ表記に一致（wooden-tableware #2）', { name: '不二貿易 アカシア 木製食器 サラダボウル 幅20×奥行20×高さ7.5cm', price: '1554' },
    mkPage({ itemName: '不二貿易 アカシア ラウンドボウル XL 30144 acacia tableware series [30144]', makerModel: '30144', brand: '不二貿易', price: 1980, desc: '■ 仕 様 ■ カラー：ブラウン 本体サイズ（約）：幅20×奥行20×高さ7.5cm 材質：天然木（アカシア材）' }), 200, ['price_mismatch'], ['spec_mismatch']);
  t('spec_mismatch: 幅が違えば従来どおり（幅20 ↔ 幅25）', { name: '不二貿易 アカシア サラダボウル 幅20×奥行20×高さ7.5cm', price: '1554' },
    mkPage({ itemName: '不二貿易 アカシア ラウンドボウル', brand: '不二貿易', price: 1554, desc: '本体サイズ（約）：幅25×奥行25×高さ7.5cm' }), 200, ['spec_mismatch']);
  t('spec_mismatch: 「幅20」は「幅200」「幅20mm」には一致しない', { name: '不二貿易 アカシア サラダボウル 幅20×奥行20×高さ7.5cm', price: '1554' },
    mkPage({ itemName: '不二貿易 アカシア ラウンドボウル', brand: '不二貿易', price: 1554, desc: '本体サイズ：幅200×奥行200×高さ7.5cm 幅20mm' }), 200, ['spec_mismatch']);
  // ── 作業D（campkit-20260921-28）: variant_unavailable ──
  t('variant_unavailable: name「2人用」に対応する軸の値「1-2人用」が SKU に無く 3-4人用しか買えない（solo-tent-overall #4）', { name: '【在庫処分77%OFF】テント 2人用 1人用テント 前室後室あり 4000mm耐水圧 ソロテント', price: '5680' },
    mkPage({ itemName: '【在庫処分78%OFF】テント 2人用 1人用テント 前室後室あり 4000mm耐水圧', makerModel: 'HFJTD01', brand: 'HOMFINE', axes: [{ key: 'サイズ', values: ['1-2人用', '3-4人用'] }, { key: 'カラー', values: ['サンドカーキ', 'オリーブグリーン'] }],
      skus: [[['3-4人用', 'サンドカーキ'], 5280], [['3-4人用', 'オリーブグリーン'], 5280]], desc: '4000mm' }), 200, ['variant_unavailable', 'spec_mismatch']);
  t('variant_unavailable なし: 「1-2人用」の SKU があれば整合', { name: 'テント 2人用 1人用テント 前室後室あり 4000mm耐水圧', price: '5680' },
    mkPage({ itemName: 'テント 2人用 1人用テント 前室後室あり 4000mm耐水圧', makerModel: 'HFJTD01', axes: [{ key: 'サイズ', values: ['1-2人用', '3-4人用'] }, { key: 'カラー', values: ['サンドカーキ', 'オリーブグリーン'] }],
      skus: [[['1-2人用', 'サンドカーキ'], 5680], [['3-4人用', 'サンドカーキ'], 5280]] }), 200, ['color_unspecified'], ['variant_unavailable', 'spec_mismatch']);
  t('variant_unavailable: 名指しした色「ブラウン」が軸にはあるが SKU に無い', { name: 'OneTigris ROC SHIELD パップテント ブラウン', price: '24800' },
    mkPage({ itemName: 'OneTigris ROC SHIELD パップテント', brand: 'OneTigris', axes: [{ key: 'カラー', values: ['ブラウン', 'グリーン'] }],
      skus: [[['グリーン'], 34100]] }), 200, ['variant_unavailable']);
  t('variant_unavailable なし: 軸の新旧ラベル（「1.5L」と「1.5L│2～3人・調理」）で SKU が長い方だけを使う（camp-kettle-recommend #1）', { name: 'キャンピングムーン キャンプケトル 直火 やかん 1L/1.5L/2.0L アルミ', price: '2680' },
    mkPage({ itemName: 'キャンピングムーン キャンプケトル 直火 やかん', brand: 'キャンピングムーン', axes: [{ key: 'サイズ', values: ['1.0L', '1.5L', '2.0L', '1.0L│1～2人・定番', '1.5L│2～3人・調理', '2.0L│ファミリー・大容量'] }],
      skus: [[['1.0L│1～2人・定番'], 2380], [['1.5L│2～3人・調理'], 2680], [['2.0L│ファミリー・大容量'], 2980]] }), 200, ['size_unspecified'], ['variant_unavailable']);
  t('variant_unavailable なし: 軸の値が SKU の selectorValues に1つも現れない軸（label≠value）は判定しない', { name: 'テント ブラウン', price: '24800' },
    mkPage({ itemName: 'テント', axes: [{ key: 'カラー', values: ['ブラウン', 'グリーン'] }], skus: [[['c01'], 24800], [['c02'], 24800]] }), 200, [], ['variant_unavailable']);
  t('variant_unavailable なし: 並記「5cm/10cm」は1つでも SKU にあれば整合', { name: 'Naturehike キャンプマット 厚手5cm/10cm', price: '5990' },
    mkPage({ itemName: 'Naturehike キャンプマット', brand: 'Naturehike', axes: [{ key: '厚さ', values: ['5cm', '10cm'] }], skus: [[['10cm'], 7990]] }), 200, ['size_unspecified', 'price_mismatch'], ['variant_unavailable']);

  // url_unparsable は rakutenUrl() の単体テストで担保
  const urlCases = [
    ['https://hb.afl.rakuten.co.jp/hgc/x/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fluxim647%2F3sp02%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Fluxim647%2Fi%2F10000005%2F', 'https://item.rakuten.co.jp/luxim647/3sp02/'],
    ['https://hb.afl.rakuten.co.jp/hgc/x/?m=http%3A%2F%2Fm.rakuten.co.jp%2Fluxim647%2Fi%2F10000005%2F', 'http://m.rakuten.co.jp/luxim647/i/10000005/'],
    ['https://item.rakuten.co.jp/shop/abc/', 'https://item.rakuten.co.jp/shop/abc/'],
    ['#', ''],
    ['https://amzn.to/abc', ''],
    ['', ''],
  ];

  let pass = 0, fail = 0;
  for (const c of T) {
    const r = judge(c.card, c.page, c.http);
    const ok = c.expect.every((f) => r.flags.includes(f)) && c.notExpect.every((f) => !r.flags.includes(f)) && (c.expect.length || c.notExpect.length || r.flags.length === 0);
    if (ok) pass++; else fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.label}  → [${r.flags.join(',')}]${ok ? '' : `  期待=[${c.expect.join(',')}] 非期待=[${c.notExpect.join(',')}]`}${r.notes.length ? '  ' + r.notes.join(' ') : ''}`);
  }
  for (const [inp, exp] of urlCases) {
    const got = rakutenUrl(inp);
    const ok = got === exp;
    if (ok) pass++; else fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  rakutenUrl(${JSON.stringify(inp).slice(0, 60)}) → ${JSON.stringify(got)}${ok ? '' : ` 期待=${JSON.stringify(exp)}`}`);
  }
  // ── 第3弾（campkit-20260921-26）: rank 重複記事での保存HTML取り違え／--only の解決 ──
  //   dod-tarp は rank="1" が2枚（dod-okla-tarp／dod-big-tarp-pole）。旧命名 <slug>__<rank>.html では同じファイルを共有し、
  //   後から書いたポールの HTML でタープ本体を再判定してしまった。
  const dupMdx = [
    '<ProductCardMdx rank="1" id="dod-okla-tarp" name="DOD オクラタープ TT8-583-TN" price="18900" affiliateUrl="https://item.rakuten.co.jp/a-price/4589946139280/" />',
    '<ProductCardMdx rank="1" id="dod-big-tarp-pole" name="DOD ビッグタープポール XP5-507" price="4180" affiliateUrl="https://item.rakuten.co.jp/a-price/4589946135053/" />',
    '<ProductCardMdx rank="2" id="dod-itsukano-tarp" name="DOD いつかのタープ TT5-631-TN" price="10157" affiliateUrl="#" />',
    '<ProductCardMdx rank="3" name="id なしのカード" price="100" affiliateUrl="#" />',
  ].join('\n');
  const dupCards = parseCards(dupMdx).map((c) => ({ slug: 'dod-tarp', ...c }));
  const cacheCases = [];
  const ct = (label, ok, got) => { cacheCases.push({ label, ok, got }); };
  {
    const files = dupCards.map((c) => path.basename(cacheFileOf(c)));
    ct('cache: rank 重複（dod-tarp rank1 ×2）でも保存HTMLのパスが衝突しない', new Set(files).size === files.length, files.join(' '));
    ct('cache: ファイル名が <slug>__<rank>__<id>.html', files[0] === 'dod-tarp__1__dod-okla-tarp.html' && files[1] === 'dod-tarp__1__dod-big-tarp-pole.html', files.slice(0, 2).join(' '));
    ct('cache: id が空なら <slug>__<rank>__i<index>.html', files[3] === 'dod-tarp__3__i4.html', files[3]);
    const byRank = resolveOnly(dupCards, 'dod-tarp#1');
    ct('--only slug#rank: rank 重複なら該当する全枚（2枚）', !!byRank && byRank.length === 2 && byRank.map((c) => c.id).join(',') === 'dod-okla-tarp,dod-big-tarp-pole', byRank && byRank.map((c) => c.id).join(','));
    const byId = resolveOnly(dupCards, 'dod-tarp#dod-big-tarp-pole');
    ct('--only slug#id: id 指定で1枚に解決', !!byId && byId.length === 1 && byId[0].id === 'dod-big-tarp-pole', byId && byId.map((c) => c.id).join(','));
    ct('--only: 該当なしは []', Array.isArray(resolveOnly(dupCards, 'dod-tarp#9')) && resolveOnly(dupCards, 'dod-tarp#9').length === 0, JSON.stringify(resolveOnly(dupCards, 'dod-tarp#9')));
    ct('--only: 書式不正（# なし）は null', resolveOnly(dupCards, 'dod-tarp') === null, String(resolveOnly(dupCards, 'dod-tarp')));
    const keys = dupCards.map(rowKey);
    ct('rowKey: rank 重複でも行キーは id 込みで一意', new Set(keys).size === keys.length, keys.join(' | '));
    // 選択値: 「厚手5cm/10cm」は先頭の 5cm を採用仕様とみなす（naturehike-mat #2: カード ¥5,990 は 5cm の価格）
    const got = nameSpecifiedValue({ key: '厚さ', values: ['5cm', '10cm'] }, 'Naturehike キャンプマット 厚手5cm/10cm 自動膨張');
    ct('nameSpecifiedValue: 並記「5cm/10cm」は name で先に出る 5cm を採る', got === '5cm', got);
    const got2 = nameSpecifiedValue({ key: '厚み', values: ['中厚（8cm）', '極厚（10cm）'] }, 'キャンプ マット [ 極厚 10cm 撥水 ]');
    ct('nameSpecifiedValue: 括弧を外した照合は維持（極厚（10cm））', got2 === '極厚（10cm）', got2);
    const got3 = nameSpecifiedValue({ key: 'style', values: ['MDX+', 'LDX+'] }, 'Coleman タフスクリーン2ルームエアー DARKROOM LDX+');
    ct('nameSpecifiedValue: 名指しが1つだけなら従来どおり（LDX+）', got3 === 'LDX+', got3);
    // 選択SKU: 並記 name では価格がカード price と一致する変種を優先、無ければ name で先に出る値
    const html = '<title>t</title>{"itemInfoSku":{"title":"タープテント 2m 3m","manageNumber":"x"},"variantSelectors":[{"label":"サイズ","values":[{"label":"2m×2m"},{"label":"3m×3m"}]}],"sku":[{"variantId":"a","selectorValues":["2m×2m"],"taxIncludedPrice":8999},{"variantId":"b","selectorValues":["3m×3m"],"taxIncludedPrice":9999}]}';
    const nm = '楽天1位 2m / 3m タープテント ワンタッチ 3mx3m 2m×2m';
    const s1 = parseRakutenHtml(html, '', nm, '8999').firstSku.selectorValues[0];
    ct('選択SKU: 並記「3mx3m 2m×2m」でカード ¥8,999 と一致する 2m×2m を選ぶ（group-camp-tent #2）', s1 === '2m×2m', s1);
    const s2 = parseRakutenHtml(html, '', nm, '9999').firstSku.selectorValues[0];
    ct('選択SKU: カード ¥9,999 なら 3m×3m', s2 === '3m×3m', s2);
    const s3 = parseRakutenHtml(html, '', nm, '').firstSku.selectorValues[0];
    ct('選択SKU: 価格が無ければ name で先に出る 3m×3m', s3 === '3m×3m', s3);
    const s4 = parseRakutenHtml(html, '', 'タープテント 2m×2m', '9999').firstSku.selectorValues[0];
    ct('選択SKU: 名指しが1値なら価格に関わらずその値（2m×2m）', s4 === '2m×2m', s4);
    // 第4バッチ: 単位が末尾にしか無い数値並記（480/600ml）
    const got4 = nameSpecifiedValues({ key: '容量', values: ['360mL', '480mL', '600mL'] }, 'タイガー 真空断熱ボトル SAHARA 480/600ml').map((x) => x.v).join(',');
    ct('nameSpecifiedValues: 「480/600ml」は 480mL・600mL の両方を名指し（先頭は 480mL）（thermal-bottle #2）', got4 === '480mL,600mL', got4);
    const got5 = nameSpecifiedValues({ key: 'サイズ', values: ['10L', '18L', '23L', 'D23 PLUS'] }, 'EENOUR ポータブル冷蔵庫 DB01 10L/18L/23L バッテリータイプ').map((x) => x.v).join(',');
    ct('nameSpecifiedValues: 「10L/18L/23L」は 3 値とも名指し（portable-fridge #1）', got5 === '10L,18L,23L', got5);
    const html2 = '<title>t</title>{"itemInfoSku":{"title":"象印 ボトル","manageNumber":"x"},"variantSelectors":[{"label":"容量","values":[{"label":"600ml"},{"label":"720ml"},{"label":"950ml"}]}],"sku":[{"variantId":"a","selectorValues":["600ml"],"taxIncludedPrice":3220},{"variantId":"b","selectorValues":["720ml"],"taxIncludedPrice":3680},{"variantId":"c","selectorValues":["950ml"],"taxIncludedPrice":3980}]}';
    const s5 = parseRakutenHtml(html2, '', '象印 シームレス ステンレスボトル 600/720/950ml', '3220').firstSku.selectorValues[0];
    ct('選択SKU: 「600/720/950ml」でカード ¥3,220 と一致する 600ml を選ぶ（thermal-bottle #3）', s5 === '600ml', s5);
    const s6 = parseRakutenHtml(html2, '', '象印 シームレス ステンレスボトル 600/720/950ml', '9999').firstSku.selectorValues[0];
    ct('選択SKU: 価格一致が無ければ name で先に出る 600ml', s6 === '600ml', s6);
    // 第5バッチ: 範囲「40〜60L」の上限は名指しではない
    const got6 = nameSpecifiedValues({ key: 'サイズ', values: ['40Ｌ', '60Ｌ'] }, 'tousen 登山リュック 40〜60L 大容量 防水').map((x) => x.v).join(',');
    ct('nameSpecifiedValues: 範囲「40〜60L」の上限 60L は名指しではない（waterproof-backpack #2）', got6 === '', got6 || '(なし)');
    const got7 = nameSpecifiedValues({ key: 'サイズ', values: ['40Ｌ', '60Ｌ'] }, 'tousen 登山リュック 60L 大容量 防水').map((x) => x.v).join(',');
    ct('nameSpecifiedValues: 単独の「60L」は従来どおり名指し', got7 === '60Ｌ', got7);
    ct('itemCodeOf: 店名を除いた商品コード',itemCodeOf('https://item.rakuten.co.jp/futon-outlet/10002239/') === '10002239' && itemCodeOf('https://item.rakuten.co.jp/smile88/a04309_sale/?variantId=1') === 'a04309_sale', itemCodeOf('https://item.rakuten.co.jp/futon-outlet/10002239/'));
  }
  for (const c of cacheCases) {
    if (c.ok) pass++; else fail++;
    console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.label}  → ${c.got}`);
  }

  console.log(`\n${pass} passed / ${fail} failed（判定 ${T.length} ケース＋URL ${urlCases.length} ケース＋キャッシュ/--only ${cacheCases.length} ケース）`);
  return fail === 0;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
// --only の1指定を解決する。`slug#rank`（数字）→ その rank の全カード（rank は記事内で一意ではない）、
// `slug#id` → id が一致するカード。書式不正なら null、該当なしなら []
function resolveOnly(cards, spec) {
  const m = /^(.+?)#(.+)$/.exec(spec);
  if (!m) return null;
  const [, slug, key] = m;
  if (/^\d+$/.test(key)) {
    const byRank = cards.filter((c) => c.slug === slug && c.rank === Number(key));
    if (byRank.length) return byRank;
  }
  return cards.filter((c) => c.slug === slug && c.id === key);
}

function parseArgs(argv) {
  const o = { limit: 0, only: [], recheck: false, dry: false, test: false, cached: false, maxMinutes: 0, url: '', name: '', price: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--limit') o.limit = Number(argv[++i]) || 0;
    else if (a === '--only') o.only = String(argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--recheck') o.recheck = true;
    else if (a === '--cached') o.cached = true;
    else if (a === '--dry') o.dry = true;
    else if (a === '--test') o.test = true;
    else if (a === '--max-minutes') o.maxMinutes = Number(argv[++i]) || 0;
    else if (a === '--url') o.url = argv[++i] || '';
    else if (a === '--name') o.name = argv[++i] || '';
    else if (a === '--price') o.price = argv[++i] || '';
    else { console.error(`不明な引数: ${a}`); process.exit(1); }
  }
  return o;
}

async function main() {
  const opt = parseArgs(process.argv.slice(2));
  if (opt.test) { process.exit(runTests() ? 0 : 1); }

  if (opt.url) {
    const card = { slug: '(adhoc)', rank: 0, id: '', name: opt.name, price: opt.price, url: opt.url };
    const r = await checkCard(card, { saveHtml: false });
    console.log(JSON.stringify(r.row, null, 2));
    if (r.notes) console.log('notes:', r.notes.join(' '));
    return;
  }

  const { cards, files } = loadAllCards();
  const parsable = cards.filter((c) => c.url).length;
  const unparsable = cards.length - parsable;
  console.log(`記事 ${files} 本 / カード ${cards.length} 枚 / 楽天URL取得 ${parsable} 枚 / url_unparsable ${unparsable} 枚 / frozen ${cards.filter((c) => FROZEN_SLUGS.has(c.slug)).length} 枚`);

  const existing = readTsv();
  const byKey = new Map(existing.map((r) => [rowKey(r), r]));

  let targets;
  if (opt.only.length) {
    targets = [];
    for (const spec of opt.only) {
      const hits = resolveOnly(cards, spec);
      if (!hits) { console.error(`--only の書式は slug#rank または slug#id: ${spec}`); process.exit(1); }
      if (!hits.length) { console.error(`見つかりません: ${spec}`); process.exit(1); }
      for (const h of hits) if (!targets.includes(h)) targets.push(h);
    }
  } else {
    targets = cards.filter((c) => opt.recheck || !byKey.has(rowKey(c)));
    // --cached は「楽天へ行かない」モード。保存 HTML が無いカードは対象から外す（--recheck と組んでも fetch しない）
    if (opt.cached) targets = targets.filter((c) => fs.existsSync(cacheFileOf(c)));
    if (opt.limit > 0) targets = targets.slice(0, opt.limit);
  }
  console.log(`既存行 ${existing.length} / 今回の対象 ${targets.length} 枚${opt.dry ? '（--dry: fetch しない）' : ''}`);
  if (opt.dry) {
    for (const c of targets.slice(0, 20)) console.log(`  ${c.slug}#${c.rank} ${c.id} | ${c.name.slice(0, 40)} | ${c.url || '(url_unparsable)'}`);
    if (targets.length > 20) console.log(`  … 他 ${targets.length - 20} 枚`);
    // url_unparsable の一覧
    const up = cards.filter((c) => !c.url);
    if (up.length) { console.log('\nurl_unparsable:'); for (const c of up) console.log(`  ${c.slug}#${c.rank} ${c.id} | ${c.affiliateUrl.slice(0, 60)}`); }
    return;
  }

  const started = Date.now();
  let done = 0, stopped = '';
  const dist = {};
  for (const card of targets) {
    if (opt.maxMinutes && Date.now() - started > opt.maxMinutes * 60000) { stopped = `--max-minutes ${opt.maxMinutes} 経過`; break; }
    const r = await checkCard(card, { cached: opt.cached });
    byKey.set(rowKey(r.row), r.row);
    done++;
    for (const f of r.row.flags.split(',')) dist[f] = (dist[f] || 0) + 1;
    console.log(`[${done}/${targets.length}] ${card.slug}#${card.rank} ${card.id} http=${r.row.http} flags=${r.row.flags}${r.notes && r.notes.length ? '  (' + r.notes.join(' ') + ')' : ''}`);
    if (r.throttled) { stopped = `HTTP ${r.row.http}（${done} 枚目 ${card.slug}#${card.rank} ${card.id}）で停止`; break; }
    if (card.url && !r.cached) await sleep(INTERVAL_MS);
  }
  // 既存順を保ちつつ追記
  const rows = [];
  const seen = new Set();
  for (const r of existing) { const k = rowKey(r); rows.push(byKey.get(k)); seen.add(k); }
  for (const c of cards) { const k = rowKey(c); if (!seen.has(k) && byKey.has(k)) { rows.push(byKey.get(k)); seen.add(k); } }
  writeTsv(rows);
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n処理 ${done} 枚 / ${secs} 秒（1枚あたり ${(done ? secs / done : 0).toFixed(2)} 秒）→ ${path.relative(ROOT, OUT)}（計 ${rows.length} 行）`);
  console.log('フラグ分布: ' + Object.entries(dist).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' '));
  const remaining = cards.filter((c) => !byKey.has(rowKey(c))).length;
  console.log(`未チェック残: ${remaining} 枚`);
  if (stopped) { console.log(`停止理由: ${stopped}`); if (/HTTP/.test(stopped)) process.exit(2); }
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { parseCards, loadAllCards, rakutenUrl, parseRakutenHtml, judge, specs, modelTokens, typeWords, variantUnavailable, cacheFileOf, resolveOnly, rowKey, FROZEN_SLUGS, HTML_DIR };
