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
 *   legacy_form          旧形式（source="amazon" ＋ affiliateUrl=ASIN）＝キュー#17 の対象
 *   short_url            amazonUrl（amzn.to 短縮）＝キュー#18 の対象
 *   both_forms           amazonAsin と amazonUrl が同居（描画は amazonUrl。ASIN 系の検査は amazonAsin の値で行う）
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
const HTML_DIRS = ['html-asin-37', 'html-asin-36'].map((d) => path.join(ROOT, '_file', '_work', d));
const HTML_DIR = HTML_DIRS[0];
const TASK_ID = 'campkit-20260921-37';

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

// 型番トークン（check-card-name-vs-sku.cjs と同じ判定を自己完結で持つ）
const MODEL_TOKEN_RE = /(?<![A-Za-z0-9])[A-Z0-9]+(?:-[A-Z0-9]+)*(?![A-Za-z0-9])/g;
const NOT_MODEL_RE = /^(?:\d+[A-Z]{1,2}|(?:UV|UPF|SPF|PU|IPX?|USB|R|T|D|SS|SH|L|M|S|XL|XXL|LL|3L|4L|5L)\d+|(?:DC|AC)\d+V|(?:DC|AC)(?:12|24|100|110|120|220|230|240)|\d+X\d+|\d+-\d+|\d+(?:-\d+)*[A-Z]{0,2}|A\d{4})$/;
const UNIT_TOKEN_RE = /^\d+(?:W|WH|V|A|AH|MAH|MM|CM|M|KG|G|L|ML|D|T|H|X|P|K|LM|℃)$/i;
const PURE_DIGIT_MODEL_MIN = 7;
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
  return { link_form, asin, amazon_url, both: hasAsin && hasUrl && !!attrs.amazonAsin && !!attrs.amazonUrl, legacy: !!legacy };
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
        link_form: lf.link_form, asin: lf.asin, amazon_url: lf.amazon_url, both: lf.both, legacy: lf.legacy,
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
  return {
    slug: c.slug, rank: String(c.rank), id: c.id, frozen: String(c.frozen), link_form: c.link_form, asin: c.asin, amazon_url: c.amazon_url,
    card_name: c.card_name, brand: c.brand, maker_model: c.maker_model, card_price: c.card_price, static_flags: c.static_flags,
    amazon_title: keep('amazon_title'), amazon_price: keep('amazon_price'), amazon_stock: keep('amazon_stock'),
    verdict: keep('verdict'), price_gap: keep('price_gap'), seller_type: keep('seller_type'),
    checked_at: keep('checked_at'), judged_task: keep('judged_task'), note: keep('note'),
  };
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
// verdict が付いていて Amazon 価格が「買える価格」として取れている行だけ price_gap を持つ
function priceGapOfRow(r) {
  if (!r.verdict || NO_PRICE_VERDICTS.has(r.verdict)) return '';
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
  out.captcha = /captcha|Robot Check|自動アクセス/i.test(html) && !out.title;
  out.notFound = !out.title && /dogsofamazon|ページが見つかりません|お探しのページ/.test(html);
  return out;
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
function stockLabel(dp, status) {
  if (status === 404 || dp.notFound) return '404';
  if (dp.oos.length) return `oos:${dp.oos.join('/')}`.slice(0, 60);
  return `${dp.buybox === 'none' ? 'no_buybox' : 'in_stock(' + dp.buybox + ')'}${dp.availability ? ' ' + dp.availability.slice(0, 40) : ''}`;
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
    //   --cached の読み取りは今回の保存先→過去の回の順で探す（同じ ASIN を別カードで取得済みならそれも使う）
    const cachedHit = opts.cached ? HTML_DIRS.map((d) => path.join(d, cacheName)).find((f) => fs.existsSync(f))
      || HTML_DIRS.flatMap((d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith(`__${c.asin}.html`)).map((f) => path.join(d, f)) : []))[0] : null;
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
    if (status === 429 || status === 503 || dp.captcha) {
      r.verdict = 'blocked_by_amazon'; r.amazon_stock = `http=${status}${dp.captcha ? ' captcha' : ''}`;
      r.checked_at = new Date().toISOString().replace(/\.\d+Z$/, 'Z'); r.judged_task = TASK_ID; r.note = 'auto: 429/503/CAPTCHA で停止';
      console.log(`[${c.slug}#${c.rank} ${c.asin}] http=${status} captcha=${dp.captcha} → 停止 (exit 2)`);
      stop = 2;
      break;
    }
    const av = autoVerdict(c, dp, status);
    r.amazon_title = clean(dp.title).slice(0, 200);
    r.amazon_price = dp.price;
    r.amazon_stock = stockLabel(dp, status);
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
  // autoVerdict（合成 dp）
  const dp0 = { title: 'Naturehike Village 13', model: 'CNH22ZP004', details: {}, oos: [], buybox: 'cart', availability: '在庫あり' };
  t('autoVerdict ok', autoVerdict({ card_name: 'Naturehike CNH22ZP004' }, dp0, 200).verdict, 'ok');
  t('autoVerdict 型番不一致→unverifiable', autoVerdict({ card_name: 'Naturehike CNK2300ZP017' }, dp0, 200).verdict, 'unverifiable');
  t('autoVerdict oos', autoVerdict({ card_name: 'X' }, { ...dp0, oos: ['在庫切れ'] }, 200).verdict, 'out_of_stock');
  t('autoVerdict no buybox', autoVerdict({ card_name: 'X' }, { ...dp0, buybox: 'none' }, 200).verdict, 'out_of_stock');
  t('autoVerdict 404', autoVerdict({ card_name: 'X' }, { ...dp0, title: '', notFound: true }, 404).verdict, '404');
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
  const o = { static: false, dry: false, test: false, verify: 0, only: [], maxMinutes: 0, recheck: false, judge: [], note: '', seller: '', setSeller: [], list: '' };
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
    else throw new Error(`不明な引数: ${a}`);
  }
  if (o.seller && !SELLER_TYPES.includes(o.seller)) throw new Error(`--seller は ${SELLER_TYPES.join('|')} のいずれか: ${o.seller}`);
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

  let exitCode = 0;
  if (opts.verify > 0 || opts.only.length) {
    exitCode = await verify(cards, rows, { ...opts, verify: opts.verify || opts.only.length });
  }
  writeTsv(rows);
  const vc = {};
  for (const r of rows) if (r.verdict) vc[r.verdict] = (vc[r.verdict] || 0) + 1;
  console.log(`→ ${path.relative(ROOT, OUT)}（計 ${rows.length} 行）verdict 分布: ${Object.entries(vc).map(([k, v]) => `${k}=${v}`).join(' ') || '（照合なし）'} / 未照合（ASIN あり）${rows.filter((r) => r.asin && !r.verdict).length} 枚`);
  process.exit(exitCode);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { parseCards, linkFormOf, modelTokens, brandOf, staticCheck, autoVerdict, parseDp, priceGap, priceGapOfRow, sellerTypeOf, FROZEN_SLUGS, COLUMNS, SELLER_TYPES, PRICE_GAP_RE };
