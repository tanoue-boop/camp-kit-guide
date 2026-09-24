#!/usr/bin/env node
/**
 * check-amazon-asin.cjs — 既設置 Amazon リンク（amazonAsin / amazonUrl / 旧形式 source="amazon"）の棚卸しと照合（検出専用）
 *
 * 目的（campkit-20260921-36 §B ／ キュー#16「既設置 Amazon ASIN の再確認」第1弾）:
 *   `content/posts/*.mdx` の全 <ProductCardMdx …/> について Amazon リンクの有無・形式・ASIN を棚卸しし、
 *   (1) Amazon に行かずに判る異常（静的検査）を `static_flags` に立て、
 *   (2) `--verify N` で先頭 N 件だけ Amazon の dp ページを 1 回 GET してタイトル・価格・在庫・型番を取り出し、
 *       カードの name/price と突き合わせて `verdict` を記録する。
 *   **mdx は一切変更しない。楽天にはアクセスしない。**
 *
 * 使い方:
 *   node scripts/check-amazon-asin.cjs --static                 # 静的検査のみ（ネットに一切出ない）。TSV を書き出す
 *   node scripts/check-amazon-asin.cjs --dry                    # 何も書かず件数だけ
 *   node scripts/check-amazon-asin.cjs --test                   # 単体テスト（frozen 52 slug が card-name-check.tsv と全行一致することを含む）
 *   node scripts/check-amazon-asin.cjs --verify 12              # 未照合のうち優先順で先頭 12 件を Amazon で照合
 *   node scripts/check-amazon-asin.cjs --verify 12 --max-minutes 8
 *   node scripts/check-amazon-asin.cjs --only naturehike-tent#5              # 名指し（既に verdict があっても再取得）
 *   node scripts/check-amazon-asin.cjs --only naturehike-tent#5 --cached     # 保存 HTML から再判定（fetch しない。無ければスキップ）
 *   node scripts/check-amazon-asin.cjs --verify 12 --recheck                 # verdict 済みも再取得
 *   node scripts/check-amazon-asin.cjs --judge naturehike-tent#5#nh-village13=different_product --note "…"   # 人手判定を記録（fetch しない）
 *   node scripts/check-amazon-asin.cjs --judge … --seller official                                           # 人手判定と同時に seller_type を記録
 *   node scripts/check-amazon-asin.cjs --set-seller ogawa-tent#5#ogawa-tierra5ex2=marketplace               # seller_type だけ書く（verdict/judged_task は触らない）
 *   node scripts/check-amazon-asin.cjs --list legacy_form       # static_flags に該当する行を一覧（TSV から）
 *   node scripts/check-amazon-asin.cjs --clear-verdict naturehike-tent#3#nh-dune76   # link_form=none に落ちた行の verdict/price_gap/seller_type/checked_at/judged_task/note を空に戻す
 *                                                                                    # （複数指定可。link_form≠none の行は拒否。amazon_title/amazon_price/amazon_stock は残す）
 *   node scripts/check-amazon-asin.cjs --refresh-stock --cached   # 保存 HTML のある行の amazon_stock 列だけを現行パーサで作り直す（53 §A＝キュー#29 第2弾）
 *                                                                 # （--cached 必須。--verify/--only/--judge/--set-seller/--clear-verdict と併用不可。autoVerdict は呼ばず
 *                                                                 #   verdict/note/checked_at/judged_task/amazon_title/amazon_price/seller_type は触らない。保存 HTML の無い行は不変）
 *
 * 出力 `_file/amazon-asin-check.tsv`（タブ区切り・BOM無し・CR無し・末尾改行1つ）: キー = slug + rank + id。全カード（Amazon リンクの無いカードも
 *   link_form=none で）1 行。静的検査は毎回全行を再計算し、照合結果（amazon_* / verdict / price_gap / seller_type / checked_at / judged_task / note）は既存行から引き継ぐ。
 *
 * price_gap（campkit-20260921-37 §A・36 §D-10 判断1 への回答＝verdict の値域は増やさず列を分ける）:
 *   (amazon_price − card_price) ÷ card_price を整数パーセントで四捨五入（`+24%`／`-4%`／`0%`）。verdict が空の行と、Amazon 価格が取れない行
 *   （out_of_stock／404／blocked_by_amazon、amazon_price が数値でない）は空。**書き出しのたびに amazon_price と card_price から再計算する**（手で書かない）。
 * seller_type: official（ブランド公式ストア＝「◯◯公式」「Official Store」「AnkerDirect」等）／amazon（Amazon.co.jp が販売）／marketplace（素性の分かる通常の小売店）／
 *   reseller（転売型＝店名が商材と無関係・詳細欄が空）／unknown（販売元を特定できない）。照合していない行は空。
 *   fetch 直後は機械判定（Amazon.co.jp → amazon、公式/Official/Direct を含む → official、それ以外・販売元不明 → unknown）を入れ、
 *   marketplace／reseller の区別は人手（`--judge … --seller` または `--set-seller`）で上書きする。
 *   人手分類の線引き（campkit-20260921-37 §D-12 判断 4 ／ 39 §0-4 で監督が追認・判定ロジックは機械分類のまま）:
 *     - `reseller`  … 「店名が商材と無関係」かつ「販売元の詳細欄が空」の**両方**を満たすものだけ（例: 雑-貨-酒-店・koalaストア【インボイス対応/すり替え対策店】）
 *     - `marketplace` … 商材が関連する小売店、または詳細欄がある店（例: PC FREAK＝家電小売がホットマット・bonbon lab・Victoria L-Breath・上河商会）
 *     - `official`  … ブランドの公式ストアに加え、**ブランド運営会社名義**も official（例: Legare＝TITAN MANIA・edge.＝ALBATRE・OTG Camping Gear＝OneTigris）
 *
 * amazon_stock の `redirected_to=<ASIN>`（campkit-20260921-39 §B・着地先すり替えの機械検知。51 §A＝キュー#29-① で非変種ページにも拡張）:
 *   (a) dp の HTML 中の JSON `"landingAsin"`（要求した ASIN）と `"currentAsin"`（実際に表示している ASIN。JSON が無ければ hidden input#ASIN）が
 *       **両方取れる**とき: 異なれば `redirected_to=<currentAsin>`（39 のまま・規則不変更）。
 *   (b) 両方は取れないとき: **要求した ASIN（TSV の asin 列）と dp の hidden `input#ASIN` の値**を比べ、異なれば `redirected_to=<hidden の ASIN>`。
 *       landingAsin／currentAsin の JSON は変種のあるページにしか無い（36・37 の保存 HTML 49 本中 36 本）ので、非変種ページのすり替えは (b) で拾う。
 *   (c) hidden も取れない: 何も出さない。
 *   在庫文言があれば末尾に `; redirected_to=…`。37 の naturehike-tent#3（B0CP3FSK4B が変種一覧から消え、Amazon が兄弟変種 B0CQ2DDXJN「TPUドア」¥5,990 へ
 *   黙って着地させた）を HTML の目視で見つけたのを機械化したもの。**verdict の自動判定・静的フラグの規則は変えていない**（人手判定の材料を増やすだけ）。
 *
 * amazon_stock の `successor=<ASIN>`（campkit-20260921-51 §B＝キュー#29-②・後継モデルの機械検知）:
 *   dp の「この商品には新しいモデルがあります」ブロック（`id="newerVersionFeature"`＝`newerVersion_feature_div`。無ければ product quick view の
 *   `id="pqv-newer-version"`）の先頭の `/dp/<ASIN>` を拾い、要求した ASIN と異なれば `amazon_stock` の末尾に `; successor=<ASIN>` を足す
 *   （redirected_to と併存可。順序は base; redirected_to; successor）。39 の camp-fan-summer#2（OT-F12 の dp が新モデル B0CY1XSQ77 を案内）を機械化したもの。
 *   **note には書かない・verdict も変えない**（人手判定の材料）。保存 HTML 164 枚中 17 枚（重複除き 11 ASIN）にブロックがあることを 51 で実測。
 *   既に照合済みの行へ後から載せ直すには `--refresh-stock --cached`（53 §A）を使う（`--cached --recheck` は autoVerdict が人手 verdict を上書きするので使わない）。
 *
 * link_form: amazonAsin / amazonUrl（amzn.to 短縮。amazonAsin と同居していれば描画上は amazonUrl が優先されるのでこちら）/
 *            legacy_source_amazon（source="amazon" かつ affiliateUrl が ASIN のみ）/ none
 *
 * static_flags（複数可・無ければ OK）:
 *   dup_in_article       同一記事内で同じ ASIN が 2 枚以上のカードに付いている
 *   shared_asin          同じ ASIN が複数記事で使われている（それ自体は異常ではない）
 *   inconsistent_shared  shared_asin のうち、カードの brand または型番トークンが記事間で食い違う
 *   bad_format           ASIN が ^B0[A-Z0-9]{8}$ にも旧形式 ^[A-Z0-9]{10}$ にも一致しない
 *   no_amazon_conflict   _file/amazon-backfill-no-amazon.tsv に載っている slug/rank/id なのに Amazon リンクが付いている
 *   legacy_form          旧形式（source="amazon" ＋ affiliateUrl=ASIN で、amazonAsin／amazonUrl を持たない＝link_form が legacy_source_amazon）
 *                        ＝キュー#17 の対象（campkit-20260921-38 で 8→0）
 *   asin_in_affiliate_url source="amazon" ＋ affiliateUrl=ASIN のまま amazonAsin を足したカード（38 §A-2／A-3 の 5 枚）。描画は amazonAsin を
 *                        使うので導線は現行形式だが、affiliateUrl に ASIN が残っている（楽天が見つかったら source="rakuten"＋hb.afl に置き換える）
 *   short_url            amazonUrl（amzn.to 短縮）＝キュー#18 の対象
 *   both_forms           amazonAsin と amazonUrl が同居（描画は amazonUrl。ASIN 系の検査は amazonAsin の値で行う）
 *   reseller_markup      情報フラグ（campkit-20260921-51 §C＝キュー#29-③）: 照合済み行で `price_gap` が +100% 以上かつ `seller_type=reseller`
 *                        （転売店が定価の 2 倍以上で出している導線）。mdx ではなく台帳の price_gap／seller_type から立てるので、書き出しのたびに再計算する。
 *                        OK／-／他フラグの規則・verifyPriority は変えない（他フラグと同様に OK を置き換える形で並ぶ）
 *
 * verdict の値域: ok / model_mismatch / different_product / out_of_stock / 404 / unverifiable / blocked_by_amazon
 *   fetch 直後は機械判定（404 → 404、CAPTCHA/429/503 → blocked_by_amazon、在庫切れ表示 → out_of_stock、
 *   型番トークンが Amazon 側に見つかる → ok(auto)、見つからない → unverifiable(auto)）を入れ、`--judge` で人手判定に上書きする。
 *   note の先頭に `auto:` が付いている行は人手判定前。
 *
 * Amazon へのアクセス（--verify / --only 時のみ）: UA 付き・各 ASIN 1 回だけ・間隔 INTERVAL_MS 以上・並列なし・タイムアウト FETCH_TIMEOUT_MS。
 *   429 / 503 / CAPTCHA を検知したらその時点で止めて処理済み分を保存し exit 2。
 *   取得 HTML は `_file/_work/html-asin-<回>/<slug>__<rank>__<asin>.html` に保存（.gitignore 下・コミットしない）。保存先は HTML_DIRS[0]（今回の回）、
 *   `--cached` の読み取りは HTML_DIRS を先頭から探す（36 の保存分 `html-asin-36/` も読める）。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const OUT = path.join(ROOT, '_file', 'amazon-asin-check.tsv');
const NO_AMAZON_TSV = path.join(ROOT, '_file', 'amazon-backfill-no-amazon.tsv');
const CARD_NAME_TSV = path.join(ROOT, '_file', 'card-name-check.tsv');
const HTML_DIRS = ['html-asin-39', 'html-asin-37', 'html-asin-36'].map((d) => path.join(ROOT, '_file', '_work', d));
const HTML_DIR = HTML_DIRS[0];
const TASK_ID = 'campkit-20260924-95';

const INTERVAL_MS = 2000;
const FETCH_TIMEOUT_MS = 25000;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

const COLUMNS = ['slug', 'rank', 'id', 'frozen', 'link_form', 'asin', 'amazon_url', 'card_name', 'brand', 'maker_model', 'card_price',
  'static_flags', 'amazon_title', 'amazon_price', 'amazon_stock', 'verdict', 'price_gap', 'seller_type', 'checked_at', 'judged_task', 'note'];
const LINK_FORMS = ['amazonAsin', 'amazonUrl', 'legacy_source_amazon', 'none'];
const VERDICTS = ['ok', 'model_mismatch', 'different_product', 'out_of_stock', '404', 'unverifiable', 'blocked_by_amazon'];
const SELLER_TYPES = ['official', 'amazon', 'marketplace', 'reseller', 'unknown'];
//   price_gap を空にする verdict（Amazon 価格が「買える価格」として取れていない）
const NO_PRICE_VERDICTS = new Set(['out_of_stock', '404', 'blocked_by_amazon']);
const PRICE_GAP_RE = /^(?:|0%|[+-][1-9]\d*%)$/;
const ASIN_NEW_RE = /^B0[A-Z0-9]{8}$/;
const ASIN_OLD_RE = /^[A-Z0-9]{10}$/;
//   reseller_markup（51 §C）: price_gap がこの % 以上（+100% ちょうどを含む）かつ seller_type=reseller
const RESELLER_MARKUP_MIN_PCT = 100;

// 変更禁止リスト（2026-10-18 まで。check-card-name-vs-sku.cjs と同じ 52 slug を独立に持つ。--test で TSV の frozen 列と全行一致を検証）
const FROZEN_SLUGS = new Set([
  'osprey-backpack', 'camp-backpack-capacity-guide', 'soto-burner', 'mysteryranch-backpack',
  'karrimor-backpack', 'gregory-backpack', 'deuter-backpack', 'portable-fridge',
  'camp-gear-sale-timing', 'camp-table-set', 'camp-table-folding', 'car-camp-lighting',
  'torch-burner', 'bluetti-power', 'sleeping-bag-temperature-guide', 'duo-tent',
  'fire-extinguish-pot',
  'camp-cooler-box-overall', 'portable-power-vehicle-camp', 'cooler-ice-pack', 'snowpeak-tent',
  'dod-table', 'low-style-table', 'outdoor-kitchen-table', 'solo-tent-overall',
  'solo-tent-beginner', 'coleman-tent', 'dod-tent', 'secondary-combustion-bonfire',
  'charcoal-starter', 'bonfire-sheet', 'bonfire-stand-beginner', 'car-camp-bed-kit',
  'car-camp-mat', 'camp-lantern-led', 'electric-blanket-camp', 'fire-blower', 'camp-bbq-grill',
  'family-camp-bbq', 'hand-axe', 'disaster-portable-power', 'jackery-power-station',
  'ecoflow-power', 'portable-power-large',
  'family-camp-summer-tent', 'coleman-chair', 'tent-size-beginner-guide',
  'kids-sleeping-bag', 'camp-backpack-beginner', 'solo-tent-lightweight', 'mountain-camp-lantern',
  'camp-portable-power-beginner',
]);

// 型番トークン（check-card-name-vs-sku.cjs と同じ判定を自己完結で持つ。
//   ただし 57 §B 以降、純数字の下限だけは本ファイルが 6・check-card-name-vs-sku.cjs が 7 で食い違う）
const MODEL_TOKEN_RE = /(?<![A-Za-z0-9])[A-Z0-9]+(?:-[A-Z0-9]+)*(?![A-Za-z0-9])/g;
const NOT_MODEL_RE = /^(?:\d+[A-Z]{1,2}|(?:UV|UPF|SPF|PU|IPX?|USB|R|T|D|SS|SH|L|M|S|XL|XXL|LL|3L|4L|5L)\d+|(?:DC|AC)\d+V|(?:DC|AC)(?:12|24|100|110|120|220|230|240)|\d+X\d+|\d+-\d+|\d+(?:-\d+)*[A-Z]{0,2}|A\d{4})$/;
const UNIT_TOKEN_RE = /^\d+(?:W|WH|V|A|AH|MAH|MM|CM|M|KG|G|L|ML|D|T|H|X|P|K|LM|℃)$/i;
//   57 §B: 7→6。国内メーカーのカタログ番号は 6 桁が多く（ユニフレーム 683040・コールマン 205588・イスカ 117212・カリマー 501212）、
//     7 桁だと拾えずに autoVerdict が unverifiable に落ちていた。全 1121 カードで測定し、増えるトークンは 25 個すべて実在の型番、
//     static_flags 分布（inconsistent_shared を含む）は完全に不変であることを確認して適用した。
const PURE_DIGIT_MODEL_MIN = 6;
const STORE_BRACKET_RE = /【[^】]*】|＼[^／]*／|\[[^\]]*\]/g;

function clean(v) { return String(v ?? '').replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function stripTags(s) { return (s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim(); }

function modelTokens(name) {
  const out = new Set();
  for (const m of String(name || '').toUpperCase().matchAll(MODEL_TOKEN_RE)) {
    const t = m[0];
    if (/^\d+$/.test(t)) { if (t.length >= PURE_DIGIT_MODEL_MIN) out.add(t); continue; }  // 純数字はこの桁数以上だけ（コールマン 2000015521）
    if (t.length < 3) continue;
    if (!/\d/.test(t)) continue;                       // 数字を含まないものは型番とみなさない（BLACK 等）
    if (NOT_MODEL_RE.test(t) || UNIT_TOKEN_RE.test(t)) continue;
    out.add(t);
  }
  return [...out];
}
// カード name の先頭語をブランドとみなす（【…】を除いた後の最初の空白区切り。「Snugpak(スナグパック)」は括弧前）
function brandOf(name) {
  const s = clean(String(name || '').replace(STORE_BRACKET_RE, ' '));
  const first = s.split(/\s+/)[0] || '';
  return first.replace(/[（(].*$/, '');
}
function brandKey(b) { return String(b || '').toLowerCase().replace(/[\s・･.,'’-]/g, ''); }

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
    for (const a of m[1].matchAll(/(\w+)=(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/g)) attrs[a[1]] = a[2] ?? a[3] ?? a[4] ?? '';
    cards.push({ index: idx, rank: Number(attrs.rank) || idx, id: attrs.id || '', attrs });
  }
  return cards;
}

function linkFormOf(attrs) {
  const hasAsin = Object.prototype.hasOwnProperty.call(attrs, 'amazonAsin');
  const hasUrl = Object.prototype.hasOwnProperty.call(attrs, 'amazonUrl');
  const legacy = attrs.source === 'amazon' && attrs.affiliateUrl && attrs.affiliateUrl !== '#' && !/^https?:/.test(attrs.affiliateUrl);
  let link_form = 'none';
  let asin = '';
  let amazon_url = '';
  if (hasUrl && attrs.amazonUrl) { link_form = 'amazonUrl'; amazon_url = attrs.amazonUrl; }
  if (hasAsin && attrs.amazonAsin) { asin = attrs.amazonAsin; if (link_form === 'none') link_form = 'amazonAsin'; }
  if (link_form === 'none' && legacy) { link_form = 'legacy_source_amazon'; asin = attrs.affiliateUrl; }
  if (!amazon_url && asin) amazon_url = `https://www.amazon.co.jp/dp/${asin}`;
  //   legacy（＝legacy_form フラグ）は「affiliateUrl の ASIN でしか Amazon リンクを持てない」カードだけ。amazonAsin／amazonUrl を持つカードは
  //   描画がそちらを使うので旧形式ではない（campkit-20260921-38 §A-2 で amazonAsin を足しつつ source="amazon"＋affiliateUrl=ASIN を残した
  //   5 枚がこれ。その残滓は asin_in_affiliate_url で別に立てる）
  return { link_form, asin, amazon_url, both: hasAsin && hasUrl && !!attrs.amazonAsin && !!attrs.amazonUrl, legacy: link_form === 'legacy_source_amazon', asinInAffiliate: !!legacy && link_form !== 'legacy_source_amazon' };
}

function loadAllCards() {
  const out = [];
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx')).sort();
  for (const f of files) {
    const slug = f.replace(/\.mdx$/, '');
    const mdx = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
    for (const c of parseCards(mdx)) {
      const lf = linkFormOf(c.attrs);
      out.push({
        slug, rank: c.rank, id: c.id, index: c.index, frozen: FROZEN_SLUGS.has(slug) ? 1 : 0,
        link_form: lf.link_form, asin: lf.asin, amazon_url: lf.amazon_url, both: lf.both, legacy: lf.legacy, asinInAffiliate: lf.asinInAffiliate,
        card_name: clean(c.attrs.name), brand: brandOf(c.attrs.name), maker_model: modelTokens(c.attrs.name).join(' '),
        card_price: clean(c.attrs.price),
      });
    }
  }
  out.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : a.rank - b.rank || a.index - b.index));
  return { cards: out, files: files.length };
}

// ---------------------------------------------------------------------------
// 静的検査
// ---------------------------------------------------------------------------
function readTsv(file) {
  if (!fs.existsSync(file)) return { header: [], rows: [] };
  const lines = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').replace(/\r/g, '').replace(/\n$/, '').split('\n');
  const header = lines[0].split('\t');
  const rows = lines.slice(1).filter((l) => l !== '').map((l) => {
    const c = l.split('\t');
    const o = {};
    header.forEach((h, i) => { o[h] = c[i] ?? ''; });
    return o;
  });
  return { header, rows };
}
function loadNoAmazon() {
  const { rows } = readTsv(NO_AMAZON_TSV);
  const keys = new Set();
  for (const r of rows) keys.add(`${r.slug}\t${r.rank}\t${r.id}`);
  return { keys, rows: rows.length };
}

function staticCheck(cards, noAmazonKeys) {
  const byAsin = new Map();
  for (const c of cards) if (c.asin) { if (!byAsin.has(c.asin)) byAsin.set(c.asin, []); byAsin.get(c.asin).push(c); }
  for (const c of cards) {
    const flags = [];
    if (c.asin) {
      const group = byAsin.get(c.asin);
      if (group.some((o) => o !== c && o.slug === c.slug)) flags.push('dup_in_article');
      const otherSlugs = group.filter((o) => o.slug !== c.slug);
      if (otherSlugs.length) {
        flags.push('shared_asin');
        if (isInconsistent(group)) flags.push('inconsistent_shared');
      }
      if (!ASIN_NEW_RE.test(c.asin) && !ASIN_OLD_RE.test(c.asin)) flags.push('bad_format');
    }
    if (c.link_form !== 'none' && noAmazonKeys.has(`${c.slug}\t${c.rank}\t${c.id}`)) flags.push('no_amazon_conflict');
    if (c.legacy) flags.push('legacy_form');
    if (c.asinInAffiliate) flags.push('asin_in_affiliate_url');
    if (c.link_form === 'amazonUrl') flags.push('short_url');
    if (c.both) flags.push('both_forms');
    c.static_flags = flags.length ? flags.join(',') : (c.link_form === 'none' ? '-' : 'OK');
  }
  return { byAsin };
}
// 同じ ASIN を持つカード群の brand / 型番トークンが食い違うか
//   brand: 正規化キーが「一方が他方を含む」なら同じとみなす（Snugpak / スナグパック のような和英併記は brandOf が括弧前を取るので別扱い＝要確認として立つ）
//   model: 全カードに型番トークンがあり、共通トークンが 1 つも無ければ食い違い
//   和英の表記差（オスプレー／OSPREY・コールマン／Coleman）は機械では同一と判れないので、両方 ASCII か両方非 ASCII のときだけ比較する
function isInconsistent(group) {
  const brands = [...new Set(group.map((c) => brandKey(c.brand)).filter(Boolean))];
  const ascii = (s) => /^[\x21-\x7e]+$/.test(s);
  for (let i = 0; i < brands.length; i++) for (let j = i + 1; j < brands.length; j++) {
    if (ascii(brands[i]) !== ascii(brands[j])) continue;
    if (!brands[i].includes(brands[j]) && !brands[j].includes(brands[i])) return true;
  }
  const sets = group.map((c) => new Set(c.maker_model ? c.maker_model.split(' ') : []));
  if (sets.every((s) => s.size > 0)) {
    let common = [...sets[0]];
    for (const s of sets.slice(1)) common = common.filter((t) => s.has(t));
    if (common.length === 0) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// TSV 読み書き（照合結果は既存行から引き継ぐ）
// ---------------------------------------------------------------------------
function keyOf(c) { return `${c.slug}\t${c.rank}\t${c.id}`; }
function loadExisting() {
  const { rows } = readTsv(OUT);
  const m = new Map();
  for (const r of rows) m.set(`${r.slug}\t${r.rank}\t${r.id}`, r);
  return m;
}
function toRow(c, prev) {
  const p = prev || {};
  const keep = (k) => (c[k] != null ? c[k] : (p[k] ?? ''));
  const r = {
    slug: c.slug, rank: String(c.rank), id: c.id, frozen: String(c.frozen), link_form: c.link_form, asin: c.asin, amazon_url: c.amazon_url,
    card_name: c.card_name, brand: c.brand, maker_model: c.maker_model, card_price: c.card_price, static_flags: c.static_flags,
    amazon_title: keep('amazon_title'), amazon_price: keep('amazon_price'), amazon_stock: keep('amazon_stock'),
    verdict: keep('verdict'), price_gap: keep('price_gap'), seller_type: keep('seller_type'),
    checked_at: keep('checked_at'), judged_task: keep('judged_task'), note: keep('note'),
  };
  r.price_gap = priceGapOfRow(r);
  r.static_flags = withInfoFlags(r);
  return r;
}
// price_gap の文字列（"+287%"／"-4%"／"0%"／空）→ 整数（空・不正は null）
function priceGapPct(s) {
  const m = /^([+-]?)(\d+)%$/.exec(String(s ?? ''));
  if (!m) return null;
  return (m[1] === '-' ? -1 : 1) * Number(m[2]);
}
// 台帳の照合結果から立てる情報フラグ（51 §C）: mdx 由来の static_flags に reseller_markup を足す／外す。他のフラグと OK／- の規則は触らない
function resellerMarkup(r) {
  const pct = priceGapPct(r.price_gap);
  return r.seller_type === 'reseller' && pct != null && pct >= RESELLER_MARKUP_MIN_PCT;
}
function withInfoFlags(r) {
  const flags = String(r.static_flags || '').split(',').filter((f) => f && f !== 'reseller_markup' && f !== 'OK' && f !== '-');
  if (resellerMarkup(r)) flags.push('reseller_markup');
  return flags.length ? flags.join(',') : (r.link_form === 'none' ? '-' : 'OK');
}
// --clear-verdict（51 §D＝キュー#29-⑦）: link_form=none に落ちた行の照合結果を未照合に戻す。amazon_title／amazon_price／amazon_stock は残す
//   （どの dp を見たかの痕跡）。seller_type は「verdict 空の行は price_gap／seller_type も空」の不変条件があるので一緒に空にする
const CLEAR_VERDICT_COLUMNS = ['verdict', 'price_gap', 'seller_type', 'checked_at', 'judged_task', 'note'];
function clearVerdict(rows, key) {
  const r = pickRow(rows, key);
  if (r.link_form !== 'none') throw new Error(`--clear-verdict: link_form=${r.link_form} の行には使えない（none だけ）: ${key}`);
  const before = Object.fromEntries(CLEAR_VERDICT_COLUMNS.map((k) => [k, r[k]]));
  for (const k of CLEAR_VERDICT_COLUMNS) r[k] = '';
  r.static_flags = withInfoFlags(r);
  return { row: r, before };
}
// (amazon_price − card_price) ÷ card_price を整数 % で四捨五入。どちらかが数値でなければ空。0 は "0%"、符号は必ず付ける
function priceGap(amazonPrice, cardPrice) {
  const a = Number(String(amazonPrice ?? '').replace(/[^\d.]/g, ''));
  const c = Number(String(cardPrice ?? '').replace(/[^\d.]/g, ''));
  if (!(a > 0) || !(c > 0)) return '';
  const pct = Math.round(((a - c) / c) * 100);
  if (pct === 0) return '0%';
  return `${pct > 0 ? '+' : '-'}${Math.abs(pct)}%`;
}
// amazon_stock の base 部分（`; ` で足される redirected_to／successor より前）が `no_buybox` で始まる＝購入ボックスの無いページ。
//   parseDp は id="corePrice" が取れないとページ内の任意の class="a-price-whole" にフォールバックするため、
//   この場合の amazon_price は「買える価格」ではなく（他の出品者・関連商品の値を拾っている）、card_price との比は意味を持たない。
//   例: coleman-lantern#3（カード ¥5,247 = ランタン+純正LPガス燃料セット／dp はランタン単品で出品なし）が -68% になっていた。
const NO_BUYBOX_RE = /^no_buybox(?:\s|$)/;
function hasNoBuybox(r) { return NO_BUYBOX_RE.test(String(r.amazon_stock || '').split('; ')[0]); }
// verdict が付いていて Amazon 価格が「買える価格」として取れている行だけ price_gap を持つ
//   60 §B: verdict が NO_PRICE_VERDICTS でなくても（人手で different_product 等に上書きした行でも）、
//   購入ボックスが無いページ由来の価格なら price_gap は空にする。amazon_title／amazon_price／amazon_stock／verdict／
//   seller_type／note は監査証跡として残す（空にするのは導出列の price_gap だけ）。
function priceGapOfRow(r) {
  if (!r.verdict || NO_PRICE_VERDICTS.has(r.verdict)) return '';
  if (hasNoBuybox(r)) return '';
  return priceGap(r.amazon_price, r.card_price);
}
// 販売元表示からの機械分類。marketplace／reseller は人手でしか区別できないので機械では unknown に留める
function sellerTypeOf(seller) {
  const s = clean(seller);
  if (!s) return 'unknown';
  if (/^Amazon(?:\.co\.jp|\.com)?$|Amazon\.co\.jp\s*(?:が販売|$)/i.test(s)) return 'amazon';
  if (/公式|official|direct/i.test(s)) return 'official';
  return 'unknown';
}
function writeTsv(rows) {
  const lines = [COLUMNS.join('\t')];
  for (const r of rows) {
    r.price_gap = priceGapOfRow(r);
    r.static_flags = withInfoFlags(r);   // reseller_markup は price_gap／seller_type から書き出しのたびに再計算（51 §C）
    lines.push(COLUMNS.map((k) => clean(r[k])).join('\t'));
  }
  fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');
}

// ---------------------------------------------------------------------------
// Amazon dp ページの取得と読み取り
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function fetchDp(asin) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`https://www.amazon.co.jp/dp/${asin}?th=1&psc=1`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'ja-JP,ja;q=0.9', Accept: 'text/html' }, signal: ctl.signal, redirect: 'follow',
    });
    const html = await res.text();
    return { status: res.status, html, finalUrl: res.url };
  } finally { clearTimeout(t); }
}
function parseDp(html) {
  const out = {};
  out.title = stripTags((html.match(/id="productTitle"[^>]*>([\s\S]*?)<\/span>/) || [])[1]);
  out.price = stripTags((html.match(/id="corePrice[\s\S]{0,3000}?class="a-price-whole"[^>]*>([\s\S]*?)<\/span>/) || html.match(/class="a-price-whole"[^>]*>([\s\S]*?)<\/span>/) || [])[1]).replace(/[^\d]/g, '');
  //   availability 欄の直後にインライン JSON（{"isInternal":…}）が続くページがあるので `{` 以降は落とす
  out.availability = stripTags((html.match(/id="availability"[^>]*>([\s\S]*?)<\/div>/) || [])[1]).replace(/\{[\s\S]*$/, '').trim().slice(0, 80);
  out.buybox = /id="add-to-cart-button"/.test(html) ? 'cart' : (/id="buy-now-button"/.test(html) ? 'buynow' : 'none');
  // 在庫切れの根拠は availability 欄と outOfStock ブロックだけ（ページ内の他所にある「現在お取り扱いできません」はバリエーション用のテンプレート断片で、
  //   在庫ありの dp にも現れる＝naturehike-tent#5 B0DR43CC43 で誤検知したため）
  const oos = [];
  const oosBlock = stripTags((html.match(/id="outOfStock"[^>]*>([\s\S]*?)<\/div>/) || [])[1]);
  for (const src of [out.availability, oosBlock]) { const m = src.match(/在庫切れ|現在お取り扱いできません|入荷時期は未定|この商品は現在[^。]{0,30}/); if (m) oos.push(m[0]); }
  out.oos = [...new Set(oos)];
  //   merchantInfo の探索幅は 3000（2000 だと anker-power#2/#3 の「販売元」を取り逃した＝37 §A で拡張）
  out.seller = stripTags((html.match(/id="sellerProfileTriggerId"[^>]*>([\s\S]*?)<\/a>/) || html.match(/id="merchantInfoFeature_feature_div"[\s\S]{0,3000}?<span[^>]*offer-display-feature-text-message[^>]*>([\s\S]*?)<\/span>/) || [])[1]).slice(0, 60);
  out.brand = stripTags((html.match(/id="bylineInfo"[^>]*>([\s\S]*?)<\/a>/) || [])[1]).replace(/^(ブランド|Visit the|のストアを表示|ストアを表示)[:：]?\s*/g, '').replace(/のストアを表示$/, '').trim();
  const details = {};
  for (const m of html.matchAll(/class="a-section a-spacing-small po-([a-z_]+)"[\s\S]{0,1500}?<td[^>]*>[\s\S]*?<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/g)) details['po-' + m[1]] = stripTags(m[2]).slice(0, 80);
  for (const m of html.matchAll(/<span class="a-text-bold">\s*(メーカー型番|製品型番|型番|色|ブランド|サイズ|商品の寸法|商品の重量|素材|スタイル|収容人数|容量|梱包サイズ)\s*[:：]?\s*<\/span>\s*<span[^>]*>([\s\S]*?)<\/span>/g)) details['b-' + m[1]] = stripTags(m[2]).slice(0, 80);
  for (const m of html.matchAll(/<th[^>]*class="[^"]*prodDetSectionEntry[^"]*"[^>]*>\s*([^<]{1,30})\s*<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/g)) { const k = stripTags(m[1]); if (/型番|色|ブランド|サイズ|寸法|重量|素材|収容|容量|梱包/.test(k)) details['t-' + k] = stripTags(m[2]).slice(0, 80); }
  for (const m of html.matchAll(/id="variation_([a-z_]+)"[\s\S]{0,800}?class="selection"[^>]*>([\s\S]*?)<\/span>/g)) details['sel-' + m[1]] = stripTags(m[2]);
  out.details = details;
  out.model = details['po-model_name'] || details['b-メーカー型番'] || details['b-製品型番'] || details['t-メーカー型番'] || details['t-製品型番'] || details['b-型番'] || '';
  //   57 §A: notFound を captcha より先に決め、captcha は notFound でないときだけ立てる。
  //     消滅 ASIN の正規 404 ページ（title 無し・<title>ページが見つかりません</title>）には
  //     HTML コメントの定型文「…Amazonデータの自動アクセスについては…」が入っており、旧実装では captcha が立って
  //     verify() が blocked_by_amazon で停止していた（54 camp-lighting-guide#2 B08VFHJJLG）。本物のブロックは 429/503 か Robot Check。
  out.notFound = !out.title && /dogsofamazon|ページが見つかりません|お探しのページ/.test(html);
  out.captcha = /captcha|Robot Check|自動アクセス/i.test(html) && !out.title && !out.notFound;
  //   着地先すり替えの材料（campkit-20260921-39 §B）: landingAsin は変種ページの JSON にしか無い。currentAsin は JSON → hidden input#ASIN の順
  //   51 §A: hidden input#ASIN は hiddenAsin として別に持つ（JSON が無い非変種ページで要求 ASIN と比べる材料）
  out.landingAsin = (html.match(/"landingAsin"\s*:\s*"([A-Z0-9]{10})"/) || [])[1] || '';
  out.hiddenAsin = (html.match(/<input[^>]+id="ASIN"[^>]+value="([A-Z0-9]{10})"/) || html.match(/<input[^>]+value="([A-Z0-9]{10})"[^>]+id="ASIN"/) || [])[1] || '';
  out.currentAsin = (html.match(/"currentAsin"\s*:\s*"([A-Z0-9]{10})"/) || [])[1] || out.hiddenAsin;
  //   後継モデル（51 §B）: 「この商品には新しいモデルがあります」ブロック → 無ければ product quick view の pqv-newer-version。ブロック先頭の /dp/<ASIN>
  out.successor = successorAsin(html);
  return out;
}
// 「新しいモデル」ブロック内の先頭 /dp/<ASIN>。ブロックが無ければ空（本文の他所にある /dp/ は見ない）
function successorAsin(html) {
  for (const re of [/id="newerVersionFeature"[\s\S]{0,3000}?\/dp\/([A-Z0-9]{10})/, /id="pqv-newer-version"[\s\S]{0,1500}?\/dp\/([A-Z0-9]{10})/]) {
    const m = html.match(re);
    if (m) return m[1];
  }
  return '';
}
// 着地先すり替え（51 §A で (b) を追加）:
//   (a) landingAsin と currentAsin が両方取れる → 異なれば currentAsin（39 のまま）
//   (b) 両方は取れない → 要求した ASIN と hidden input#ASIN を比べ、異なれば hidden の ASIN
//   (c) hidden も取れない（または要求 ASIN が無い）→ 空
function redirectedTo(dp, requestedAsin) {
  if (dp.landingAsin && dp.currentAsin) return dp.landingAsin !== dp.currentAsin ? dp.currentAsin : '';
  if (requestedAsin && dp.hiddenAsin) return dp.hiddenAsin !== requestedAsin ? dp.hiddenAsin : '';
  return '';
}
function autoVerdict(card, dp, status) {
  if (status === 404 || dp.notFound) return { verdict: '404', note: 'auto: HTTP 404 / dp ページなし' };
  if (!dp.title) return { verdict: 'unverifiable', note: 'auto: productTitle を取れない（HTML 構造未対応）' };
  if (dp.oos.length || dp.buybox === 'none') return { verdict: 'out_of_stock', note: `auto: ${dp.oos.join('/') || '購入ボックスなし'}（${dp.availability || 'availability 無し'}）` };
  const tokens = modelTokens(card.card_name);
  const hay = `${dp.title} ${dp.model} ${Object.values(dp.details).join(' ')}`.toUpperCase();
  const hit = tokens.filter((t) => hay.includes(t));
  if (tokens.length && hit.length) return { verdict: 'ok', note: `auto: 型番一致 ${hit.join('/')}` };
  if (tokens.length && !hit.length) return { verdict: 'unverifiable', note: `auto: カード型番 ${tokens.join('/')} が Amazon 側（${dp.model || '型番欄なし'}）に無い→要人手判定` };
  return { verdict: 'unverifiable', note: 'auto: カードに型番トークン無し→要人手判定（タイトル・仕様で判断）' };
}
function stockLabel(dp, status, requestedAsin) {
  let base;
  if (status === 404 || dp.notFound) base = '404';
  else if (dp.oos.length) base = `oos:${dp.oos.join('/')}`.slice(0, 60);
  else base = `${dp.buybox === 'none' ? 'no_buybox' : 'in_stock(' + dp.buybox + ')'}${dp.availability ? ' ' + dp.availability.slice(0, 40) : ''}`;
  //   着地先すり替え（campkit-20260921-39 §B・51 §A）と後継モデル（51 §B）: 在庫文言が空ならそのまま、あれば末尾に `; ` で足す
  const extras = [];
  const rd = redirectedTo(dp, requestedAsin);
  if (rd) extras.push(`redirected_to=${rd}`);
  if (dp.successor && dp.successor !== requestedAsin) extras.push(`successor=${dp.successor}`);
  if (!extras.length) return base;
  return base ? `${base}; ${extras.join('; ')}` : extras.join('; ');
}

// 保存 HTML の探索（--cached の読み取り規則。verify() から切り出したもので挙動は同じ）:
//   今回の保存先→過去の回の順に `<slug>__<rank>__<asin>.html` を探し、無ければ同じ ASIN を別カードで取得済みのファイル（`*__<asin>.html`）を使う
function findCachedHtml(c) {
  const cacheName = `${c.slug}__${c.rank}__${c.asin}.html`;
  return HTML_DIRS.map((d) => path.join(d, cacheName)).find((f) => fs.existsSync(f))
    || HTML_DIRS.flatMap((d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith(`__${c.asin}.html`)).map((f) => path.join(d, f)) : []))[0];
}
// --refresh-stock --cached（53 §A＝キュー#29 第2弾）: 保存 HTML のある行の amazon_stock 列だけを現行の stockLabel で作り直す。
//   verdict／note／checked_at／judged_task／amazon_title／amazon_price／seller_type は触らない（autoVerdict は呼ばない）。保存 HTML の無い行は不変。
//   htmlOf(row) は保存 HTML の文字列（無ければ null）を返す（--test では合成 HTML を差し込む）。CAPTCHA 応答が保存されていた行は触らない。
function refreshStock(rows, htmlOf = defaultHtmlOf) {
  const changes = [];
  let withHtml = 0;
  for (const r of rows) {
    if (!r.asin) continue;
    const html = htmlOf(r);
    if (html == null) continue;
    withHtml++;
    const dp = parseDp(html);
    if (dp.captcha) continue;
    const after = stockLabel(dp, 200, r.asin);
    if (after === r.amazon_stock) continue;
    changes.push({ key: `${r.slug}#${r.rank}#${r.id}`, before: r.amazon_stock, after });
    r.amazon_stock = after;
  }
  return { withHtml, changes };
}
function defaultHtmlOf(r) {
  const f = findCachedHtml(r);
  return f ? fs.readFileSync(f, 'utf8') : null;
}

// 照合の優先順: --only > 静的検査 (1)(3)(4)(5) > inconsistent_shared > TSV 順
function verifyPriority(c) {
  const f = c.static_flags || '';
  if (/dup_in_article|bad_format|no_amazon_conflict|legacy_form/.test(f)) return 0;
  if (/inconsistent_shared/.test(f)) return 1;
  return 2;
}

async function verify(cards, rows, opts) {
  const byKey = new Map(rows.map((r) => [`${r.slug}\t${r.rank}\t${r.id}`, r]));
  let targets = cards.filter((c) => c.asin);
  if (opts.only.length) {
    //   --only の並び順で処理する（タスク指定の順。同じ順位のものは TSV 順）
    const pos = (c) => opts.only.findIndex((o) => matchOnly(c, o));
    targets = targets.map((c, i) => ({ c, i, p: pos(c) })).filter((x) => x.p >= 0).sort((a, b) => a.p - b.p || a.i - b.i).map((x) => x.c);
  } else {
    targets = targets.filter((c) => !byKey.get(keyOf(c)).verdict || opts.recheck);
    targets = targets.map((c, i) => ({ c, i, p: verifyPriority(c) })).sort((a, b) => a.p - b.p || a.i - b.i).map((x) => x.c);
    targets = targets.slice(0, opts.verify);
  }
  fs.mkdirSync(HTML_DIR, { recursive: true });
  const t0 = Date.now();
  let n = 0;
  let stop = 0;
  const seen = new Set();
  for (const c of targets) {
    if (opts.maxMinutes && (Date.now() - t0) / 60000 > opts.maxMinutes) { console.log(`--max-minutes ${opts.maxMinutes} に達したため打ち切り`); break; }
    const r = byKey.get(keyOf(c));
    // 同じ ASIN は 1 回だけ取得（同一バッチ内）
    const cacheName = `${c.slug}__${c.rank}__${c.asin}.html`;
    const cacheFile = path.join(HTML_DIR, cacheName);
    //   --cached の読み取りは今回の保存先→過去の回の順で探す（同じ ASIN を別カードで取得済みならそれも使う）＝findCachedHtml
    const cachedHit = opts.cached ? findCachedHtml(c) : null;
    let html; let status;
    const same = [...seen].find((s) => s.asin === c.asin);
    if (same) { html = same.html; status = same.status; }
    else if (cachedHit) { html = fs.readFileSync(cachedHit, 'utf8'); status = 200; }
    else if (opts.cached) { console.log(`[${c.slug}#${c.rank} ${c.asin}] --cached: 保存 HTML なし→スキップ`); continue; }
    else {
      if (n > 0) await sleep(INTERVAL_MS);
      n += 1;
      try {
        const res = await fetchDp(c.asin);
        html = res.html; status = res.status;
      } catch (e) {
        r.verdict = 'unverifiable'; r.note = `auto: fetch 失敗 ${e.name || e.message}`; r.checked_at = new Date().toISOString().replace(/\.\d+Z$/, 'Z'); r.judged_task = TASK_ID;
        console.log(`[${c.slug}#${c.rank} ${c.asin}] fetch error ${e.message}`);
        continue;
      }
      fs.writeFileSync(cacheFile, html, 'utf8');
      seen.add({ asin: c.asin, html, status });
    }
    const dp = parseDp(html);
    //   57 §A: HTTP 404 は dp.captcha より先に扱う（消滅 ASIN の正規 404 ページは本物のブロックではないので停止条件に入れない）。
    //     429/503 は従来どおり無条件で停止する
    if (status === 429 || status === 503 || (status !== 404 && dp.captcha)) {
      r.verdict = 'blocked_by_amazon'; r.amazon_stock = `http=${status}${dp.captcha ? ' captcha' : ''}`;
      r.checked_at = new Date().toISOString().replace(/\.\d+Z$/, 'Z'); r.judged_task = TASK_ID; r.note = 'auto: 429/503/CAPTCHA で停止';
      console.log(`[${c.slug}#${c.rank} ${c.asin}] http=${status} captcha=${dp.captcha} → 停止 (exit 2)`);
      stop = 2;
      break;
    }
    const av = autoVerdict(c, dp, status);
    r.amazon_title = clean(dp.title).slice(0, 200);
    r.amazon_price = dp.price;
    r.amazon_stock = stockLabel(dp, status, c.asin);
    r.verdict = av.verdict;
    r.price_gap = priceGapOfRow(r);
    r.seller_type = (av.verdict === '404') ? '' : sellerTypeOf(dp.seller);
    r.note = `${av.note}${dp.model ? `｜model=${dp.model}` : ''}${dp.brand ? `｜brand=${dp.brand}` : ''}${dp.seller ? `｜seller=${dp.seller}` : ''}`.slice(0, 300);
    r.checked_at = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    r.judged_task = TASK_ID;
    console.log(`[${c.slug}#${c.rank} ${c.asin}] http=${status} verdict=${av.verdict} price=${dp.price || '-'} gap=${r.price_gap || '-'} seller=${r.seller_type}(${dp.seller || '-'}) stock=${r.amazon_stock} title=${(dp.title || '').slice(0, 60)}`);
  }
  console.log(`Amazon アクセス ${n} 回 / ${((Date.now() - t0) / 1000).toFixed(1)} 秒`);
  return stop;
}
function matchOnly(c, o) {
  const [slug, a, b] = o.split('#');
  if (slug !== c.slug) return false;
  if (a == null) return true;
  if (b != null) return String(c.rank) === a && c.id === b;
  return String(c.rank) === a || c.id === a;
}

// ---------------------------------------------------------------------------
// --test
// ---------------------------------------------------------------------------
function runTests() {
  let pass = 0; let fail = 0;
  const t = (name, got, exp) => {
    const ok = JSON.stringify(got) === JSON.stringify(exp);
    if (ok) pass++; else fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  → ${JSON.stringify(got)}${ok ? '' : `（期待 ${JSON.stringify(exp)}）`}`);
  };
  // parse / link_form
  const p = (s) => { const c = parseCards(s)[0]; return { ...linkFormOf(c.attrs), rank: c.rank, id: c.id }; };
  t('link_form amazonAsin', p('<ProductCardMdx rank="1" id="a" amazonAsin="B0DR43CC43" affiliateUrl="https://x" source="rakuten" />').link_form, 'amazonAsin');
  t('asin from amazonAsin', p('<ProductCardMdx rank="1" id="a" amazonAsin="B0DR43CC43" />').asin, 'B0DR43CC43');
  t('amazon_url built from asin', p('<ProductCardMdx rank="1" id="a" amazonAsin="B0DR43CC43" />').amazon_url, 'https://www.amazon.co.jp/dp/B0DR43CC43');
  t('link_form amazonUrl', p('<ProductCardMdx rank="2" id="b" amazonUrl="https://amzn.to/abc" />').link_form, 'amazonUrl');
  t('both → amazonUrl が優先・asin は保持', (() => { const r = p('<ProductCardMdx rank="2" id="b" amazonAsin="B0AAAAAAAA" amazonUrl="https://amzn.to/abc" />'); return [r.link_form, r.asin, r.both, r.amazon_url]; })(), ['amazonUrl', 'B0AAAAAAAA', true, 'https://amzn.to/abc']);
  t('legacy source=amazon', p('<ProductCardMdx rank="3" id="c" affiliateUrl="B09DBDH7VB" source="amazon" />').link_form, 'legacy_source_amazon');
  t('legacy asin', p('<ProductCardMdx rank="3" id="c" affiliateUrl="B09DBDH7VB" source="amazon" />').asin, 'B09DBDH7VB');
  t('source=amazon だが affiliateUrl が URL なら legacy ではない', p('<ProductCardMdx rank="3" id="c" affiliateUrl="https://www.amazon.co.jp/dp/B09DBDH7VB" source="amazon" />').link_form, 'none');
  // campkit-20260921-38 §A-2: amazonAsin を足して source="amazon"＋affiliateUrl=ASIN を残した形は旧形式ではない（描画は amazonAsin）
  t('legacy + amazonAsin → link_form は amazonAsin・legacy=false・asinInAffiliate=true', (() => { const r = p('<ProductCardMdx rank="5" id="e" affiliateUrl="B0843M38FP" amazonAsin="B0843M38FP" source="amazon" />'); return [r.link_form, r.asin, r.legacy, r.asinInAffiliate]; })(), ['amazonAsin', 'B0843M38FP', false, true]);
  t('legacy のみ → legacy=true・asinInAffiliate=false', (() => { const r = p('<ProductCardMdx rank="3" id="c" affiliateUrl="B09DBDH7VB" source="amazon" />'); return [r.legacy, r.asinInAffiliate]; })(), [true, false]);
  t('source=rakuten + amazonAsin（現行形式）→ asinInAffiliate=false', p('<ProductCardMdx rank="1" id="a" amazonAsin="B0DR43CC43" affiliateUrl="https://hb.afl.rakuten.co.jp/x" source="rakuten" />').asinInAffiliate, false);
  t('none', p('<ProductCardMdx rank="4" id="d" affiliateUrl="https://hb.afl.rakuten.co.jp/x" source="rakuten" />').link_form, 'none');
  t('amazonAsin="" は none', p('<ProductCardMdx rank="4" id="d" amazonAsin="" />').link_form, 'none');
  t('rank 無しは通し番号', p('<ProductCardMdx id="d" />').rank, 1);
  t('template literal 属性', p('<ProductCardMdx rank="1" id="a" amazonAsin={`B0DR43CC43`} />').asin, 'B0DR43CC43');
  // ASIN 書式
  t('ASIN 新形式', ASIN_NEW_RE.test('B0DR43CC43'), true);
  t('ASIN 旧形式', [ASIN_NEW_RE.test('4901234567'), ASIN_OLD_RE.test('4901234567')], [false, true]);
  t('ASIN 不正（9桁）', [ASIN_NEW_RE.test('B0DR43CC4'), ASIN_OLD_RE.test('B0DR43CC4')], [false, false]);
  t('ASIN 不正（小文字）', ASIN_OLD_RE.test('b0dr43cc43'), false);
  // 型番トークン / ブランド
  t('modelTokens', modelTokens('WAQ Reclining Low Chair WAQ-RLC1 CHARCOAL(チャコール) 8980円'), ['WAQ-RLC1']);
  t('modelTokens 単位・サイズは除外', modelTokens('Naturehike ビレッジ13 3〜4人用 耐水圧2000mm 20L XL'), []);
  t('modelTokens 純数字7桁以上', modelTokens('コールマン 2000015521 テント'), ['2000015521']);
  // 57 §B: 純数字の下限を 7→6（国内メーカーのカタログ番号）。5 桁以下は従来どおり拾わない
  t('57B modelTokens 純数字6桁を拾う（ユニフレーム 683040）', modelTokens('ユニフレーム ファイアグリル 683040'), ['683040']);
  t('57B modelTokens 純数字5桁は拾わない（価格・容量の誤検出を防ぐ）', modelTokens('メーカー 商品 12345 の 19800 円'), []);
  t('57B modelTokens 6桁が複数（uniflame-fire-grill#3 の 2 点セット）', modelTokens('ユニフレーム ファイアグリル＋収納ケース 2点セット 683040+683187'), ['683040', '683187']);
  t('57B 英数字型番と 6 桁の併存（uniflame-burner#1）', modelTokens('ユニフレーム ツインバーナー US-1900 610305'), ['US-1900', '610305']);
  t('57B PURE_DIGIT_MODEL_MIN は 6', PURE_DIGIT_MODEL_MIN, 6);
  t('modelTokens 型番複数', modelTokens('モンベル シームレスダウンハガー800 #3 R/ZIP #1121401'), ['1121401']);
  t('brandOf', brandOf('【楽天1位】FIELDOOR テント 620'), 'FIELDOOR');
  t('brandOf 括弧前', brandOf('Snugpak(スナグパック) 寝袋'), 'Snugpak');
  // 静的検査（合成データ）
  const mk = (slug, rank, id, asin, name, extra = {}) => ({ slug, rank, id, asin, link_form: asin ? 'amazonAsin' : 'none', card_name: name, brand: brandOf(name), maker_model: modelTokens(name).join(' '), legacy: false, both: false, ...extra });
  const cs = [
    mk('a', 1, 'a1', 'B0AAAAAAAA', 'X 型番 XY-100'), mk('a', 2, 'a2', 'B0AAAAAAAA', 'X 型番 XY-100'),   // dup_in_article
    mk('b', 1, 'b1', 'B0BBBBBBBB', 'Y 型番 YZ-200'), mk('c', 1, 'c1', 'B0BBBBBBBB', 'Y 型番 YZ-200 ブラック'), // shared 一致
    mk('d', 1, 'd1', 'B0CCCCCCCC', 'Z 型番 ZA-300'), mk('e', 1, 'e1', 'B0CCCCCCCC', 'Z 型番 ZB-301'),   // shared 型番不一致
    mk('f', 1, 'f1', 'B0DDDDDDDD', 'BrandF 型番 FF-1'), mk('g', 1, 'g1', 'B0DDDDDDDD', 'BrandG 型番 FF-1'), // shared ブランド不一致
    mk('h', 1, 'h1', 'BADASIN', 'H'), mk('i', 1, 'i1', '', 'I'),
    mk('j', 1, 'j1', 'B0EEEEEEEE', 'J', { legacy: true, link_form: 'legacy_source_amazon' }),
    mk('k', 1, 'k1', 'B0FFFFFFFF', 'K', { both: true, link_form: 'amazonUrl' }),
    mk('l', 1, 'l1', 'B0GGGGGGGG', 'L'),
    mk('m', 1, 'm1', '', 'M', { link_form: 'amazonUrl' }),
    mk('n', 1, 'n1', 'B0HHHHHHHH', 'N', { asinInAffiliate: true }),
  ];
  staticCheck(cs, new Set(['l\t1\tl1', 'i\t1\ti1']));
  t('dup_in_article', cs[0].static_flags, 'dup_in_article');
  t('shared_asin（一致）', cs[2].static_flags, 'shared_asin');
  t('shared_asin + inconsistent（型番）', cs[4].static_flags, 'shared_asin,inconsistent_shared');
  t('shared_asin + inconsistent（ブランド）', cs[6].static_flags, 'shared_asin,inconsistent_shared');
  t('bad_format', cs[8].static_flags, 'bad_format');
  t('none は -', cs[9].static_flags, '-');
  t('legacy_form', cs[10].static_flags, 'legacy_form');
  t('both_forms + short_url', cs[11].static_flags, 'short_url,both_forms');
  t('no_amazon_conflict', cs[12].static_flags, 'no_amazon_conflict');
  t('no-amazon 台帳に載っていてもリンクが無ければ立てない', cs[9].static_flags, '-');
  t('short_url', cs[13].static_flags, 'short_url');
  t('asin_in_affiliate_url（38 §A-2 の残滓）', cs[14].static_flags, 'asin_in_affiliate_url');
  // autoVerdict（合成 dp）
  const dp0 = { title: 'Naturehike Village 13', model: 'CNH22ZP004', details: {}, oos: [], buybox: 'cart', availability: '在庫あり' };
  t('autoVerdict ok', autoVerdict({ card_name: 'Naturehike CNH22ZP004' }, dp0, 200).verdict, 'ok');
  t('autoVerdict 型番不一致→unverifiable', autoVerdict({ card_name: 'Naturehike CNK2300ZP017' }, dp0, 200).verdict, 'unverifiable');
  t('autoVerdict oos', autoVerdict({ card_name: 'X' }, { ...dp0, oos: ['在庫切れ'] }, 200).verdict, 'out_of_stock');
  t('autoVerdict no buybox', autoVerdict({ card_name: 'X' }, { ...dp0, buybox: 'none' }, 200).verdict, 'out_of_stock');
  t('autoVerdict 404', autoVerdict({ card_name: 'X' }, { ...dp0, title: '', notFound: true }, 404).verdict, '404');
  // 57 §A（キュー#29 第3弾）: 正規 404 ページの「自動アクセス」定型文で captcha を立てない（54 camp-lighting-guide#2 B08VFHJJLG の偽陽性）
  //   実 HTML と同じ形: title 要素はあるが id="productTitle" は無い／HTML コメントに「自動アクセス」の定型文
  const html404 = '<html><head><title>ページが見つかりません</title></head><body><!-- 自動化されたデータにアクセスするには、Amazonデータの自動アクセスについては、 contact api-services-support@amazon.com にお問い合わせください。--><img src="/dogsofamazon/x.jpg"/></body></html>';
  const htmlRobot = '<html><head><title>Robot Check</title></head><body><p>申し訳ありませんが、Amazonデータの自動アクセスについては…</p><form action="/errors/validateCaptcha"></form></body></html>';
  t('57A(1) 正規 404 ページ → captcha=false・notFound=true', (() => { const d = parseDp(html404); return [d.captcha, d.notFound]; })(), [false, true]);
  t('57A(2) 本物の Robot Check → captcha=true・notFound=false', (() => { const d = parseDp(htmlRobot); return [d.captcha, d.notFound]; })(), [true, false]);
  t('57A(3) 正規 404 は autoVerdict で status 404/200 のどちらも 404', (() => { const d = parseDp(html404); return [autoVerdict({ card_name: 'X' }, d, 404).verdict, autoVerdict({ card_name: 'X' }, d, 200).verdict]; })(), ['404', '404']);
  t('57A(4) 正常な dp は本文に「自動アクセス」があっても captcha=false（!title 条件）', (() => { const d = parseDp('<html><span id="productTitle">Naturehike Village 13</span><p>Amazonデータの自動アクセスについては…</p></html>'); return [d.captcha, d.notFound, d.title]; })(), [false, false, 'Naturehike Village 13']);
  t('57A dogsofamazon のみ（404 の語なし）でも notFound 優先で captcha=false', (() => { const d = parseDp('<html><img src="/dogsofamazon/a.jpg"><p>自動アクセス</p></html>'); return [d.captcha, d.notFound]; })(), [false, true]);
  t('57A 404 の語も Robot Check も無い CAPTCHA ページは従来どおり captcha=true', parseDp('<html><p>captcha</p></html>').captcha, true);
  // 着地先すり替え（campkit-20260921-39 §B）: landingAsin / currentAsin の抽出と redirected_to
  const htmlVar = (landing, current) => `<html><input type="hidden" id="ASIN" name="ASIN" value="${current}"><script>var o = {"currentAsin" : "${current}",\n"landingAsin": "${landing}"};</script><span id="productTitle">X</span></html>`;
  t('parseDp landingAsin==currentAsin → redirected_to 無し', (() => { const d = parseDp(htmlVar('B0CP3FSK4B', 'B0CP3FSK4B')); return [d.landingAsin, d.currentAsin, redirectedTo(d)]; })(), ['B0CP3FSK4B', 'B0CP3FSK4B', '']);
  t('parseDp landingAsin≠currentAsin → redirected_to=currentAsin（37 naturehike-tent#3）', (() => { const d = parseDp(htmlVar('B0CP3FSK4B', 'B0CQ2DDXJN')); return [d.landingAsin, d.currentAsin, redirectedTo(d)]; })(), ['B0CP3FSK4B', 'B0CQ2DDXJN', 'B0CQ2DDXJN']);
  t('parseDp 片方欠落（JSON 無し・hidden#ASIN のみ）→ currentAsin は取れるが redirected_to 無し', (() => { const d = parseDp('<html><input type="hidden" id="ASIN" name="ASIN" value="B08CZWJ7P8"><span id="productTitle">X</span></html>'); return [d.landingAsin, d.currentAsin, redirectedTo(d)]; })(), ['', 'B08CZWJ7P8', '']);
  t('stockLabel: 在庫文言あり＋すり替え → 末尾に "; redirected_to="', stockLabel({ ...dp0, landingAsin: 'B0CP3FSK4B', currentAsin: 'B0CQ2DDXJN' }, 200), 'in_stock(cart) 在庫あり; redirected_to=B0CQ2DDXJN');
  t('stockLabel: すり替え無し → 従来どおり', stockLabel({ ...dp0, landingAsin: 'B0CP3FSK4B', currentAsin: 'B0CP3FSK4B' }, 200), 'in_stock(cart) 在庫あり');
  t('stockLabel: oos＋すり替え', stockLabel({ ...dp0, oos: ['在庫切れ'], landingAsin: 'B0AAAAAAAA', currentAsin: 'B0BBBBBBBB' }, 200), 'oos:在庫切れ; redirected_to=B0BBBBBBBB');
  t('autoVerdict はすり替えで変わらない（規則不変更）', autoVerdict({ card_name: 'Naturehike CNH22ZP004' }, { ...dp0, landingAsin: 'B0AAAAAAAA', currentAsin: 'B0BBBBBBBB' }, 200).verdict, 'ok');
  // 51 §A（キュー#29-①）: redirected_to を非変種ページ（JSON 無し）にも広げる。要求 ASIN と hidden input#ASIN の比較
  const htmlHidden = (hidden) => `<html><input type="hidden" id="ASIN" name="ASIN" value="${hidden}"><span id="productTitle">X</span></html>`;
  t('51A(a) JSON あり・一致 → 空（hidden が要求と違っても JSON を優先）', (() => { const d = parseDp(htmlVar('B0CP3FSK4B', 'B0CP3FSK4B')); return [d.hiddenAsin, redirectedTo(d, 'B0CP3FSK4B'), redirectedTo(d, 'B0ZZZZZZZZ')]; })(), ['B0CP3FSK4B', '', '']);
  t('51A(b′) JSON あり・不一致 → currentAsin（39 のまま・要求 ASIN は見ない）', (() => { const d = parseDp(htmlVar('B0CP3FSK4B', 'B0CQ2DDXJN')); return [redirectedTo(d, 'B0CP3FSK4B'), redirectedTo(d, 'B0CQ2DDXJN')]; })(), ['B0CQ2DDXJN', 'B0CQ2DDXJN']);
  t('51A(c) JSON なし・hidden が要求と一致 → 空', (() => { const d = parseDp(htmlHidden('B08CZWJ7P8')); return [d.landingAsin, d.hiddenAsin, d.currentAsin, redirectedTo(d, 'B08CZWJ7P8')]; })(), ['', 'B08CZWJ7P8', 'B08CZWJ7P8', '']);
  t('51A(d) JSON なし・hidden が要求と不一致 → redirected_to=hidden', (() => { const d = parseDp(htmlHidden('B0BBBBBBBB')); return redirectedTo(d, 'B0AAAAAAAA'); })(), 'B0BBBBBBBB');
  t('51A(d) stockLabel に載る', stockLabel({ ...parseDp(htmlHidden('B0BBBBBBBB')), ...dp0 }, 200, 'B0AAAAAAAA'), 'in_stock(cart) 在庫あり; redirected_to=B0BBBBBBBB');
  t('51A(e) JSON も hidden も無い → 空', (() => { const d = parseDp('<html><span id="productTitle">X</span></html>'); return [d.landingAsin, d.hiddenAsin, d.currentAsin, redirectedTo(d, 'B0AAAAAAAA')]; })(), ['', '', '', '']);
  t('51A hidden の属性順が逆（value が先）でも取れる', parseDp('<html><input type="hidden" name="ASIN" value="B0CCCCCCCC" id="ASIN"></html>').hiddenAsin, 'B0CCCCCCCC');
  t('51A landingAsin のみ（currentAsin JSON も hidden も無い）→ 空', redirectedTo({ landingAsin: 'B0AAAAAAAA', currentAsin: '', hiddenAsin: '' }, 'B0AAAAAAAA'), '');
  t('51A 要求 ASIN 無し（旧呼び出し）＋ hidden のみ → 空（既存 93 ケースと同じ挙動）', redirectedTo(parseDp(htmlHidden('B0BBBBBBBB'))), '');
  t('51A autoVerdict は (b) のすり替えでも変わらない', autoVerdict({ card_name: 'Naturehike CNH22ZP004' }, { ...parseDp(htmlHidden('B0BBBBBBBB')), ...dp0 }, 200).verdict, 'ok');
  // 51 §B（キュー#29-②）: 後継 ASIN（「この商品には新しいモデルがあります」ブロック → pqv-newer-version）
  const htmlNewer = (asin) => `<html><span id="productTitle">X</span><div id="newer-version" class="a-row"><div id="newerVersionFeature" cel_widget_id="newerVersion_feature_div" class="celwidget"><hr/><h4>この商品には新しいモデルがあります:</h4><div><a class="a-link-normal" href="/Anker-Portable/dp/${asin}/ref=dp_ob_image_wld"><img alt="x"/></a></div></div></div><a href="/dp/B0OTHEROTH/ref=x">other</a></html>`;
  const htmlPqv = (asin) => `<html><span id="productTitle">X</span><div id="pqv-newer-version" data-target="#newerVersion_feature_div" class="a-section"><h2 id="pqv-newer-version-heading">新しいバージョンがあります</h2><a class="a-link-normal" href="/BLUETTI-x/dp/${asin}?ref=dp_product_quick_view">Y</a></div></html>`;
  t('51B newerVersionFeature ブロックの先頭 /dp/ を拾う（後続の別 /dp/ は拾わない）', successorAsin(htmlNewer('B0FK9YH385')), 'B0FK9YH385');
  t('51B parseDp.successor', parseDp(htmlNewer('B0FK9YH385')).successor, 'B0FK9YH385');
  t('51B pqv-newer-version のみ（bluetti-power#1 の形）', successorAsin(htmlPqv('B0DT9FR2MP')), 'B0DT9FR2MP');
  t('51B ブロック無し → 空（本文の /dp/ は見ない）', successorAsin('<html><span id="productTitle">X</span><a href="/dp/B0OTHEROTH">o</a><script>"newerVersion_feature_div"</script></html>'), '');
  t('51B stockLabel: successor は末尾に "; successor="', stockLabel({ ...parseDp(htmlNewer('B0FK9YH385')), ...dp0 }, 200, 'B0CTYBTCH9'), 'in_stock(cart) 在庫あり; successor=B0FK9YH385');
  t('51B stockLabel: redirected_to と successor の併存（順序 redirected_to → successor）', stockLabel({ ...dp0, landingAsin: 'B0AAAAAAAA', currentAsin: 'B0BBBBBBBB', successor: 'B0CCCCCCCC' }, 200, 'B0AAAAAAAA'), 'in_stock(cart) 在庫あり; redirected_to=B0BBBBBBBB; successor=B0CCCCCCCC');
  t('51B stockLabel: oos＋successor', stockLabel({ ...dp0, oos: ['在庫切れ'], successor: 'B0CCCCCCCC' }, 200, 'B0AAAAAAAA'), 'oos:在庫切れ; successor=B0CCCCCCCC');
  t('51B successor が要求 ASIN と同じなら出さない', stockLabel({ ...dp0, successor: 'B0AAAAAAAA' }, 200, 'B0AAAAAAAA'), 'in_stock(cart) 在庫あり');
  t('51B autoVerdict は successor で変わらない', autoVerdict({ card_name: 'Naturehike CNH22ZP004' }, { ...dp0, successor: 'B0CCCCCCCC' }, 200).verdict, 'ok');
  // 51 §C（キュー#29-③）: reseller_markup 情報フラグ（price_gap >= +100% かつ seller_type=reseller）
  const rr = (price_gap, seller_type, static_flags = 'OK', link_form = 'amazonAsin') => ({ price_gap, seller_type, static_flags, link_form, verdict: 'ok' });
  t('51C priceGapPct', ['+287%', '+100%', '+99%', '0%', '-4%', '', 'x'].map(priceGapPct), [287, 100, 99, 0, -4, null, null]);
  t('51C +287% × reseller → 立つ（camp-coffee-dripper#3）', withInfoFlags(rr('+287%', 'reseller')), 'reseller_markup');
  t('51C +100% ちょうど × reseller → 立つ', withInfoFlags(rr('+100%', 'reseller')), 'reseller_markup');
  t('51C +99% × reseller → 立たない', withInfoFlags(rr('+99%', 'reseller')), 'OK');
  t('51C +287% × marketplace → 立たない', withInfoFlags(rr('+287%', 'marketplace')), 'OK');
  t('51C +287% × unknown → 立たない', withInfoFlags(rr('+287%', 'unknown')), 'OK');
  t('51C price_gap 空 × reseller → 立たない', withInfoFlags(rr('', 'reseller')), 'OK');
  t('51C 既存フラグに足す（shared_asin の後ろ）', withInfoFlags(rr('+150%', 'reseller', 'shared_asin,short_url')), 'shared_asin,short_url,reseller_markup');
  t('51C 既存フラグは保持・条件を外れたら reseller_markup だけ落ちる', withInfoFlags(rr('+50%', 'reseller', 'shared_asin,reseller_markup')), 'shared_asin');
  t('51C OK に戻る（reseller_markup だけだった行が条件を外れた）', withInfoFlags(rr('+50%', 'reseller', 'reseller_markup')), 'OK');
  t('51C link_form=none は "-" のまま', withInfoFlags(rr('', '', '-', 'none')), '-');
  t('51C 冪等（2 回通しても同じ）', withInfoFlags(rr('+287%', 'reseller', withInfoFlags(rr('+287%', 'reseller')))), 'reseller_markup');
  // 51 §D（キュー#29-⑦）: --clear-verdict（link_form=none の行だけ・verdict/price_gap/seller_type/checked_at/judged_task/note を空に）
  const mkRow = (o) => ({ slug: 'x', rank: '3', id: 'x3', link_form: 'none', static_flags: '-', asin: '', amazon_title: 'T', amazon_price: '100', amazon_stock: 'in_stock(cart)', verdict: 'different_product', price_gap: '', seller_type: 'official', checked_at: '2026-09-21T22:36:37Z', judged_task: 'campkit-20260921-49', note: '49: …', ...o });
  t('51D none 行 → 6 列が空・amazon_title/price/stock は残る・static_flags は -', (() => { const rows = [mkRow({})]; const { row, before } = clearVerdict(rows, 'x#3#x3'); return [CLEAR_VERDICT_COLUMNS.map((k) => row[k]), row.amazon_title, row.amazon_price, row.amazon_stock, row.static_flags, before.verdict, before.judged_task]; })(), [['', '', '', '', '', ''], 'T', '100', 'in_stock(cart)', '-', 'different_product', 'campkit-20260921-49']);
  t('51D link_form=amazonAsin の行は拒否（例外）', (() => { try { clearVerdict([mkRow({ link_form: 'amazonAsin', asin: 'B0AAAAAAAA', static_flags: 'OK' })], 'x#3#x3'); return 'no-throw'; } catch (e) { return /link_form=amazonAsin/.test(e.message); } })(), true);
  t('51D 対象が特定できなければ例外', (() => { try { clearVerdict([mkRow({})], 'y#1#y1'); return 'no-throw'; } catch (e) { return /対象が 0 件/.test(e.message); } })(), true);
  t('51D 拒否されたときは行を変更しない', (() => { const rows = [mkRow({ link_form: 'amazonAsin', asin: 'B0AAAAAAAA', static_flags: 'OK' })]; try { clearVerdict(rows, 'x#3#x3'); } catch (e) { /* expected */ } return [rows[0].verdict, rows[0].note]; })(), ['different_product', '49: …']);
  t('51D クリア後の行は priceGapOfRow でも空（verdict 空）', priceGapOfRow(clearVerdict([mkRow({ amazon_price: '200', card_price: '100' })], 'x#3#x3').row), '');
  // 53 §A（キュー#29 第2弾）: --refresh-stock --cached（amazon_stock 列だけを保存 HTML から作り直す）
  //   フィクスチャ: 行 a1（人手 verdict・保存 HTML に redirected_to＋successor）／a2（auto verdict・保存 HTML に在庫文言のみ）／a3（保存 HTML 無し）／
  //                 a4（未照合・保存 HTML あり）／n1（link_form=none・asin 空）
  const argErr = (argv) => { try { parseArgs(argv); return 'no-throw'; } catch (e) { return e.message; } };
  t('53A --refresh-stock 単独 → エラー（--cached 必須）', /--cached と一緒に/.test(argErr(['--refresh-stock'])), true);
  t('53A --refresh-stock --cached → 受理', (() => { const o = parseArgs(['--refresh-stock', '--cached']); return [o.refreshStock, o.cached]; })(), [true, true]);
  t('53A --refresh-stock --cached と --verify/--only/--judge/--set-seller/--clear-verdict の併用は全てエラー',
    [['--verify', '3'], ['--only', 'a#1'], ['--judge', 'a#1#x=ok'], ['--set-seller', 'a#1#x=official'], ['--clear-verdict', 'a#1#x']].map((extra) => /併用できない/.test(argErr(['--refresh-stock', '--cached', ...extra]))),
    [true, true, true, true, true]);
  t('53A --refresh-stock を付けない既存の引数解釈は不変（refreshStock=false）', [parseArgs(['--static']).refreshStock, parseArgs(['--only', 'a#1', '--cached']).refreshStock], [false, false]);
  const rsRow = (o) => ({ slug: 'a', rank: '1', id: 'a1', frozen: '0', link_form: 'amazonAsin', asin: 'B0AAAAAAAA', amazon_url: 'https://www.amazon.co.jp/dp/B0AAAAAAAA', card_name: 'X', brand: 'X', maker_model: '', card_price: '1000',
    static_flags: 'OK', amazon_title: 'T', amazon_price: '1200', amazon_stock: 'in_stock(cart) 在庫あり', verdict: 'model_mismatch', price_gap: '+20%', seller_type: 'marketplace', checked_at: '2026-09-21T22:36:37Z', judged_task: 'campkit-20260921-52', note: '52: 人手 verdict', ...o });
  const rsRows = () => [
    rsRow({}),
    rsRow({ rank: '2', id: 'a2', asin: 'B0BBBBBBBB', amazon_stock: 'in_stock(cart) 在庫あり。 {"isInternal":false,"showInsightsH', verdict: 'ok', note: 'auto: 型番一致 X', judged_task: 'campkit-20260921-36' }),
    rsRow({ rank: '3', id: 'a3', asin: 'B0CCCCCCCC', amazon_stock: 'oos:在庫切れ', verdict: 'out_of_stock', price_gap: '', seller_type: 'official' }),
    rsRow({ rank: '4', id: 'a4', asin: 'B0DDDDDDDD', amazon_title: '', amazon_price: '', amazon_stock: '', verdict: '', price_gap: '', seller_type: '', checked_at: '', judged_task: '', note: '' }),
    rsRow({ slug: 'n', rank: '1', id: 'n1', link_form: 'none', asin: '', amazon_url: '', static_flags: '-', amazon_title: '', amazon_price: '', amazon_stock: '', verdict: '', price_gap: '', seller_type: '', checked_at: '', judged_task: '', note: '' }),
  ];
  //   合成 HTML: a1 は hidden#ASIN が要求と違い（→redirected_to）かつ newerVersionFeature あり（→successor）、在庫あり＋カート。a2 は在庫文言＋カートのみ。a4 は pqv 後継のみ
  const htmlStock = (body) => `<html><span id="productTitle">X</span><div id="availability"><span>在庫あり。</span></div><input id="add-to-cart-button" type="submit">${body}</html>`;
  const rsHtml = {
    'a\t1\ta1': htmlStock(`<input type="hidden" id="ASIN" name="ASIN" value="B0AAAAAAA2">${htmlNewer('B0AAAAAAA3').replace(/^<html>|<\/html>$/g, '')}`),
    'a\t2\ta2': htmlStock(''),
    'a\t4\ta4': htmlStock(htmlPqv('B0DDDDDDD2').replace(/^<html>|<\/html>$/g, '')),
  };
  const rsHtmlOf = (r) => rsHtml[`${r.slug}\t${r.rank}\t${r.id}`] ?? null;
  const NON_STOCK = COLUMNS.filter((k) => k !== 'amazon_stock');
  const snap = (rows) => rows.map((r) => JSON.stringify(NON_STOCK.map((k) => r[k])));
  t('53A(2) 保存 HTML のある行の amazon_stock が base; redirected_to; successor の順で作り直される', (() => { const rows = rsRows(); const res = refreshStock(rows, rsHtmlOf); return [res.withHtml, res.changes.map((c) => c.key), rows[0].amazon_stock, rows[1].amazon_stock, rows[3].amazon_stock]; })(),
    [3, ['a#1#a1', 'a#2#a2', 'a#4#a4'], 'in_stock(cart) 在庫あり。; redirected_to=B0AAAAAAA2; successor=B0AAAAAAA3', 'in_stock(cart) 在庫あり。', 'in_stock(cart) 在庫あり。; successor=B0DDDDDDD2']);
  t('53A(2) changes は before/after を持つ（a2 は 36 の JSON 残滓が落ちる）', refreshStock(rsRows(), rsHtmlOf).changes[1], { key: 'a#2#a2', before: 'in_stock(cart) 在庫あり。 {"isInternal":false,"showInsightsH', after: 'in_stock(cart) 在庫あり。' });
  t('53A(3) 保存 HTML の無い行（a3）と asin 空の行（n1）は行全体が不変（全 21 列を JSON 比較）', (() => { const before = rsRows(); const rows = rsRows(); refreshStock(rows, rsHtmlOf); return [JSON.stringify(rows[2]) === JSON.stringify(before[2]), JSON.stringify(rows[4]) === JSON.stringify(before[4])]; })(), [true, true]);
  t('53A(4) amazon_stock 以外の 20 列は全行不変（人手 verdict の a1・auto の a2・未照合の a4 を含む）', (() => { const before = rsRows(); const rows = rsRows(); refreshStock(rows, rsHtmlOf); return JSON.stringify(snap(rows)) === JSON.stringify(snap(before)); })(), true);
  t('53A(4) verdict/note/judged_task/checked_at/amazon_title/amazon_price/seller_type の値そのまま（a1）', (() => { const rows = rsRows(); refreshStock(rows, rsHtmlOf); const r = rows[0]; return [r.verdict, r.note, r.judged_task, r.checked_at, r.amazon_title, r.amazon_price, r.seller_type]; })(), ['model_mismatch', '52: 人手 verdict', 'campkit-20260921-52', '2026-09-21T22:36:37Z', 'T', '1200', 'marketplace']);
  t('53A(4) 未照合の行（a4）は amazon_stock だけ埋まり verdict/checked_at/judged_task は空のまま', (() => { const rows = rsRows(); refreshStock(rows, rsHtmlOf); const r = rows[3]; return [r.verdict, r.checked_at, r.judged_task, r.amazon_title, r.note]; })(), ['', '', '', '', '']);
  t('53A(5) 冪等: 2 回目は withHtml は同じで changes が 0・行も不変', (() => { const rows = rsRows(); refreshStock(rows, rsHtmlOf); const once = rows.map((r) => JSON.stringify(r)); const res = refreshStock(rows, rsHtmlOf); return [res.withHtml, res.changes.length, JSON.stringify(rows.map((r) => JSON.stringify(r))) === JSON.stringify(once)]; })(), [3, 0, true]);
  t('53A 保存 HTML が CAPTCHA 応答なら触らない（withHtml には数える）', (() => { const rows = rsRows(); const res = refreshStock(rows, (r) => (r.id === 'a1' ? '<html><title>Robot Check</title><p>自動アクセス</p></html>' : null)); return [res.withHtml, res.changes.length, rows[0].amazon_stock]; })(), [1, 0, 'in_stock(cart) 在庫あり']);
  t('53A writeTsv 相当の再計算を通しても amazon_stock 以外は不変（price_gap／static_flags は導出値で同じ）', (() => { const rows = rsRows(); refreshStock(rows, rsHtmlOf); return rows.map((r) => [priceGapOfRow(r) === r.price_gap, withInfoFlags(r) === r.static_flags]); })(), [[true, true], [true, true], [true, true], [true, true], [true, true]]);
  t('53A findCachedHtml: asin 空でも例外にならない（実ディレクトリ探索・該当なし）', findCachedHtml({ slug: 'zz', rank: '9', asin: 'B0ZZZZZZZZ' }) == null, true);
  // matchOnly
  t('matchOnly slug#rank', matchOnly({ slug: 'a', rank: 5, id: 'x' }, 'a#5'), true);
  t('matchOnly slug#id', matchOnly({ slug: 'a', rank: 5, id: 'x' }, 'a#x'), true);
  t('matchOnly slug#rank#id', matchOnly({ slug: 'a', rank: 5, id: 'x' }, 'a#5#y'), false);
  // price_gap（campkit-20260921-37 §A）
  t('priceGap +（154000 vs 124260 → +24%）', priceGap('154000', '124260'), '+24%');
  t('priceGap -（12300 vs 12800 → -4%）', priceGap('12300', '12800'), '-4%');
  t('priceGap 0（同額）', priceGap('2980', '2980'), '0%');
  t('priceGap 四捨五入で 0 になるときも "0%"（-0% を出さない）', priceGap('9990', '10000'), '0%');
  t('priceGap 四捨五入（+10.5% → +11%）', priceGap('4980', '4482'), '+11%');
  t('priceGap Amazon 価格なし → 空', priceGap('', '12800'), '');
  t('priceGap カード価格なし → 空', priceGap('12300', ''), '');
  t('priceGap 数値でない → 空', priceGap('参考', '12800'), '');
  t('priceGapOfRow verdict 空 → 空', priceGapOfRow({ verdict: '', amazon_price: '100', card_price: '100' }), '');
  t('priceGapOfRow out_of_stock → 空（参考価格があっても）', priceGapOfRow({ verdict: 'out_of_stock', amazon_price: '10891', card_price: '26631' }), '');
  t('priceGapOfRow 404 → 空', priceGapOfRow({ verdict: '404', amazon_price: '100', card_price: '100' }), '');
  t('priceGapOfRow ok → 計算', priceGapOfRow({ verdict: 'ok', amazon_price: '3250', card_price: '2660' }), '+22%');
  t('priceGapOfRow model_mismatch も計算（別変種の価格差を読めるように）', priceGapOfRow({ verdict: 'model_mismatch', amazon_price: '21998', card_price: '23600' }), '-7%');
  t('PRICE_GAP_RE 値域', ['', '0%', '+24%', '-4%', '+0%', '-0%', '24%', '+5', 'x'].map((v) => PRICE_GAP_RE.test(v)), [true, true, true, true, false, false, false, false, false]);
  // 60 §B: 購入ボックスの無いページ（amazon_stock の base が no_buybox）は price_gap を空にする
  t('60B no_buybox かつ人手 verdict → 空（coleman-lantern#3 の -68%）', priceGapOfRow({ verdict: 'different_product', amazon_stock: 'no_buybox', amazon_price: '1680', card_price: '5247' }), '');
  t('60B no_buybox＋availability 文言 → 空', priceGapOfRow({ verdict: 'ok', amazon_stock: 'no_buybox 通常2～3日以内に発送します。 在庫状況 について', amazon_price: '3000', card_price: '2000' }), '');
  t('60B no_buybox＋redirected_to → 空', priceGapOfRow({ verdict: 'model_mismatch', amazon_stock: 'no_buybox; redirected_to=B07D2JN939', amazon_price: '3000', card_price: '2000' }), '');
  t('60B in_stock は従来どおり計算', priceGapOfRow({ verdict: 'ok', amazon_stock: 'in_stock(cart) 在庫あり。', amazon_price: '3250', card_price: '2660' }), '+22%');
  t('60B NO_PRICE_VERDICTS は在庫があっても従来どおり空', priceGapOfRow({ verdict: 'out_of_stock', amazon_stock: 'in_stock(cart)', amazon_price: '3250', card_price: '2660' }), '');
  t('60B amazon_stock 空は従来どおり計算（no_buybox とみなさない）', priceGapOfRow({ verdict: 'ok', amazon_stock: '', amazon_price: '3250', card_price: '2660' }), '+22%');
  t('60B oos: は no_buybox ではない（NO_PRICE_VERDICTS 側で扱う）', priceGapOfRow({ verdict: 'different_product', amazon_stock: 'oos:在庫切れ', amazon_price: '3250', card_price: '2660' }), '+22%');
  t('60B no_buybox は語境界で判定（no_buyboxX は対象外）', priceGapOfRow({ verdict: 'ok', amazon_stock: 'no_buyboxX', amazon_price: '3250', card_price: '2660' }), '+22%');
  // seller_type（機械分類）
  t('sellerTypeOf Amazon.co.jp', sellerTypeOf('Amazon.co.jp'), 'amazon');
  t('sellerTypeOf 公式', sellerTypeOf('Naturehike公式ショップ'), 'official');
  t('sellerTypeOf Official Store', sellerTypeOf('Travelcool Official Store'), 'official');
  t('sellerTypeOf AnkerDirect', sellerTypeOf('AnkerDirect'), 'official');
  t('sellerTypeOf 一般店は unknown（人手で marketplace/reseller）', sellerTypeOf('上河商会'), 'unknown');
  t('sellerTypeOf 空 → unknown', sellerTypeOf(''), 'unknown');
  t('SELLER_TYPES 値域', SELLER_TYPES, ['official', 'amazon', 'marketplace', 'reseller', 'unknown']);
  t('COLUMNS は 21 列・verdict の直後に price_gap / seller_type', [COLUMNS.length, COLUMNS.indexOf('price_gap') - COLUMNS.indexOf('verdict'), COLUMNS.indexOf('seller_type') - COLUMNS.indexOf('verdict')], [21, 1, 2]);
  // 実データ: frozen 列が card-name-check.tsv と全行一致
  const { cards } = loadAllCards();
  const cn = readTsv(CARD_NAME_TSV).rows;
  const cnKey = new Map(cn.map((r) => [`${r.slug}\t${r.rank}\t${r.id}`, r.frozen]));
  let mismatch = 0; let missing = 0;
  for (const c of cards) { const f = cnKey.get(keyOf(c)); if (f == null) missing++; else if (f !== String(c.frozen)) mismatch++; }
  t(`frozen 列: card-name-check.tsv ${cn.length} 行と突合（行キー欠損）`, missing, 0);
  t(`frozen 列: card-name-check.tsv と全 ${cards.length} 行一致（不一致件数）`, mismatch, 0);
  t('frozen slug 数', FROZEN_SLUGS.size, 52);
  t('frozen=1 のカード数が card-name-check.tsv と一致', cards.filter((c) => c.frozen).length, cn.filter((r) => r.frozen === '1').length);
  // 実データ: TSV 出力の書式
  if (fs.existsSync(OUT)) {
    const text = fs.readFileSync(OUT, 'utf8');
    t('TSV: BOM 無し', text.charCodeAt(0) !== 0xfeff, true);
    t('TSV: CR 無し', text.includes('\r'), false);
    t('TSV: 末尾改行 1 つ', text.endsWith('\n') && !text.endsWith('\n\n'), true);
    const lines = text.replace(/\n$/, '').split('\n');
    t('TSV: ヘッダ', lines[0], COLUMNS.join('\t'));
    t('TSV: 空行なし', lines.some((l) => l === ''), false);
    t('TSV: 全行の列数がヘッダと同じ', lines.every((l) => l.split('\t').length === COLUMNS.length), true);
    t('TSV: 全行が 21 列（行数）', lines.slice(1).filter((l) => l.split('\t').length === 21).length, lines.length - 1);
    const { rows } = readTsv(OUT);
    t('TSV: link_form 値域', rows.every((r) => LINK_FORMS.includes(r.link_form)), true);
    t('TSV: verdict 値域（空 or 許可値）', rows.every((r) => r.verdict === '' || VERDICTS.includes(r.verdict)), true);
    t('TSV: price_gap 値域（空 / 0% / ±NN%）', rows.every((r) => PRICE_GAP_RE.test(r.price_gap)), true);
    t('TSV: seller_type 値域（空 or 許可値）', rows.every((r) => r.seller_type === '' || SELLER_TYPES.includes(r.seller_type)), true);
    t('TSV: verdict 空の行は price_gap / seller_type も空', rows.filter((r) => !r.verdict).every((r) => r.price_gap === '' && r.seller_type === ''), true);
    t('TSV: price_gap は amazon_price / card_price から再計算した値と一致', rows.every((r) => r.price_gap === priceGapOfRow(r)), true);
    t('TSV: reseller_markup は price_gap / seller_type から再計算した値と一致（51 §C）', rows.every((r) => r.static_flags === withInfoFlags(r)), true);
    t('TSV: reseller_markup の行は全て seller_type=reseller かつ price_gap>=+100%', rows.filter((r) => /(^|,)reseller_markup(,|$)/.test(r.static_flags)).every((r) => resellerMarkup(r)), true);
    t('TSV: 行数 = カード数', rows.length, cards.length);
    t('TSV: キー一意', new Set(rows.map((r) => `${r.slug}\t${r.rank}\t${r.id}`)).size, rows.length);
  }
  console.log(`\n${pass} passed / ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const o = { static: false, dry: false, test: false, verify: 0, only: [], maxMinutes: 0, recheck: false, judge: [], note: '', seller: '', setSeller: [], list: '', clearVerdict: [], refreshStock: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--static') o.static = true;
    else if (a === '--dry') o.dry = true;
    else if (a === '--test') o.test = true;
    else if (a === '--recheck') o.recheck = true;
    else if (a === '--cached') o.cached = true;
    else if (a === '--verify') o.verify = Number(argv[++i]) || 0;
    else if (a === '--only') o.only = String(argv[++i] || '').split(',').filter(Boolean);
    else if (a === '--max-minutes') o.maxMinutes = Number(argv[++i]) || 0;
    else if (a === '--judge') o.judge.push(String(argv[++i] || ''));
    else if (a === '--note') o.note = String(argv[++i] || '');
    else if (a === '--seller') o.seller = String(argv[++i] || '');
    else if (a === '--set-seller') o.setSeller.push(String(argv[++i] || ''));
    else if (a === '--list') o.list = String(argv[++i] || '');
    else if (a === '--clear-verdict') o.clearVerdict.push(...String(argv[++i] || '').split(',').filter(Boolean));
    else if (a === '--refresh-stock') o.refreshStock = true;
    else throw new Error(`不明な引数: ${a}`);
  }
  if (o.seller && !SELLER_TYPES.includes(o.seller)) throw new Error(`--seller は ${SELLER_TYPES.join('|')} のいずれか: ${o.seller}`);
  if (o.clearVerdict.length && (o.verify || o.only.length || o.judge.length || o.setSeller.length)) throw new Error('--clear-verdict は --verify/--only/--judge/--set-seller と併用できない');
  //   53 §A: --refresh-stock は --cached 必須（保存 HTML だけを読む＝ネットに出ない）。照合・判定系のフラグとは併用できない
  if (o.refreshStock && !o.cached) throw new Error('--refresh-stock は --cached と一緒に指定する（保存 HTML だけを読む）');
  if (o.refreshStock && (o.verify || o.only.length || o.judge.length || o.setSeller.length || o.clearVerdict.length)) throw new Error('--refresh-stock は --verify/--only/--judge/--set-seller/--clear-verdict と併用できない');
  return o;
}
// --judge / --set-seller の対象行を 1 件に特定する
function pickRow(rows, key) {
  const target = rows.filter((r) => matchOnly({ slug: r.slug, rank: r.rank, id: r.id }, key));
  if (target.length !== 1) throw new Error(`対象が ${target.length} 件: ${key}`);
  return target[0];
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.test) return runTests();

  const { cards, files } = loadAllCards();
  const noAmazon = loadNoAmazon();
  staticCheck(cards, noAmazon.keys);
  const linked = cards.filter((c) => c.link_form !== 'none');
  const counts = {};
  for (const c of cards) for (const f of (c.static_flags || '').split(',')) counts[f] = (counts[f] || 0) + 1;
  const asinSet = new Set(cards.filter((c) => c.asin).map((c) => c.asin));
  console.log(`記事 ${files} 本 / カード ${cards.length} 枚 / Amazon リンクあり ${linked.length} 枚（amazonAsin 属性 ${cards.filter((c) => c.asin && !c.legacy).length}・amazonUrl 属性 ${cards.filter((c) => c.link_form === 'amazonUrl').length}・旧形式 ${cards.filter((c) => c.legacy).length}）/ distinct ASIN ${asinSet.size} / frozen ${cards.filter((c) => c.frozen).length} 枚 / no-amazon 台帳 ${noAmazon.rows} 行`);
  console.log(`static_flags 分布: ${Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  if (opts.dry) return;

  const existing = loadExisting();
  const rows = cards.map((c) => toRow(c, existing.get(keyOf(c))));

  if (opts.list) {
    const re = new RegExp(`(^|,)${opts.list}(,|$)`);
    const hit = rows.filter((r) => re.test(r.static_flags));
    for (const r of hit) console.log(`${r.slug}#${r.rank}#${r.id}\t${r.link_form}\t${r.asin || r.amazon_url}\t${r.card_name.slice(0, 60)}`);
    console.log(`${opts.list}: ${hit.length} 枚 / ${new Set(hit.map((r) => r.slug)).size} 記事`);
    return;
  }
  if (opts.judge.length || opts.setSeller.length) {
    for (const j of opts.judge) {
      const m = /^(.+?)=([a-z_0-9]+)$/.exec(j);
      if (!m || !VERDICTS.includes(m[2])) throw new Error(`--judge の書式: slug#rank#id=verdict（verdict は ${VERDICTS.join('|')}）: ${j}`);
      const r = pickRow(rows, m[1]);
      r.verdict = m[2];
      if (opts.note) r.note = clean(opts.note);
      if (opts.seller) r.seller_type = opts.seller;
      r.checked_at = r.checked_at || new Date().toISOString().replace(/\.\d+Z$/, 'Z');
      r.judged_task = TASK_ID;
      console.log(`judge: ${r.slug}#${r.rank}#${r.id} → ${r.verdict}${opts.seller ? ` seller_type=${opts.seller}` : ''}`);
    }
    //   --set-seller は seller_type だけを書く（verdict／note／checked_at／judged_task は触らない＝過去の回の判定行に後から列を埋める用）
    for (const j of opts.setSeller) {
      const m = /^(.+?)=([a-z_]+)$/.exec(j);
      if (!m || !SELLER_TYPES.includes(m[2])) throw new Error(`--set-seller の書式: slug#rank#id=seller_type（${SELLER_TYPES.join('|')}）: ${j}`);
      const r = pickRow(rows, m[1]);
      if (!r.verdict) throw new Error(`--set-seller: verdict が空の行には書けない: ${m[1]}`);
      r.seller_type = m[2];
      console.log(`set-seller: ${r.slug}#${r.rank}#${r.id} → ${r.seller_type}`);
    }
    writeTsv(rows);
    console.log(`→ ${path.relative(ROOT, OUT)}（計 ${rows.length} 行）`);
    return;
  }
  if (opts.clearVerdict.length) {
    //   link_form=none に落ちた行の照合結果を未照合に戻す（51 §D）。対象が 1 件でも特定できなければ何も書かずに例外で止まる
    const done = opts.clearVerdict.map((k) => clearVerdict(rows, k));
    for (const { row, before } of done) console.log(`clear-verdict: ${row.slug}#${row.rank}#${row.id} → ${CLEAR_VERDICT_COLUMNS.map((k) => `${k}=${JSON.stringify(before[k])}`).join(' ')} を空に`);
    writeTsv(rows);
    console.log(`→ ${path.relative(ROOT, OUT)}（計 ${rows.length} 行）`);
    return;
  }
  if (opts.refreshStock) {
    //   保存 HTML のある行の amazon_stock だけを作り直す（53 §A）。fetch には入らない（Amazon アクセス 0 回）
    const { withHtml, changes } = refreshStock(rows);
    for (const c of changes) console.log(`refresh-stock: ${c.key}\n  before: ${c.before}\n  after : ${c.after}`);
    writeTsv(rows);
    console.log(`refresh-stock: 保存 HTML あり ${withHtml} 行 / amazon_stock 変更 ${changes.length} 行 / Amazon アクセス 0 回`);
    console.log(`→ ${path.relative(ROOT, OUT)}（計 ${rows.length} 行）`);
    return;
  }

  let exitCode = 0;
  if (opts.verify > 0 || opts.only.length) {
    exitCode = await verify(cards, rows, { ...opts, verify: opts.verify || opts.only.length });
  }
  writeTsv(rows);
  const vc = {};
  for (const r of rows) if (r.verdict) vc[r.verdict] = (vc[r.verdict] || 0) + 1;
  console.log(`→ ${path.relative(ROOT, OUT)}（計 ${rows.length} 行）verdict 分布: ${Object.entries(vc).map(([k, v]) => `${k}=${v}`).join(' ') || '（照合なし）'} / 未照合（ASIN あり）${rows.filter((r) => r.asin && !r.verdict).length} 枚`);
  //   台帳側の static_flags（mdx 由来のフラグ＋照合結果から立てる情報フラグ reseller_markup）
  const fc = {};
  for (const r of rows) for (const f of (r.static_flags || '').split(',')) fc[f] = (fc[f] || 0) + 1;
  console.log(`static_flags 分布（台帳）: ${Object.entries(fc).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  process.exit(exitCode);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { parseCards, linkFormOf, modelTokens, brandOf, staticCheck, autoVerdict, parseDp, redirectedTo, successorAsin, stockLabel, priceGap, priceGapOfRow, priceGapPct, resellerMarkup, withInfoFlags, clearVerdict, refreshStock, findCachedHtml, sellerTypeOf, FROZEN_SLUGS, COLUMNS, SELLER_TYPES, PRICE_GAP_RE, CLEAR_VERDICT_COLUMNS };
