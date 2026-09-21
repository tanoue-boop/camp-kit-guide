#!/usr/bin/env node
/**
 * Amazon リンク backfill の候補カードを抽出するスクリプト（2026-09-21 campkit-20260921-16 で常設化）
 *
 * 使い方:
 *   node scripts/list-amazon-backfill-candidates.cjs            # 候補TSVを書き出し、サマリを表示
 *   node scripts/list-amazon-backfill-candidates.cjs --min 2    # サマリの閾値（既定 2）を変更
 *
 * 処理:
 *   1. `_file/affiliate-coverage.tsv` の notes 列を
 *        Amazon未設定カード N/M (#a,#b,…)   ※ 0/M は括弧が無い（0/5 ｜…）ので括弧は任意
 *      で parse し、N>0 の記事を対象にする。
 *   2. `content/posts/<slug>.mdx` の <ProductCardMdx …/> ブロックを順に切り出し、
 *      `amazonAsin=` を持たないブロックだけを残す（台帳の数え方に合わせ、`amazonUrl=`（amzn.to）や
 *      `source="amazon"` のカードも「設定済み」として除く）。notes の位置リストと食い違えば
 *      実測（mdx）を正とし、差分を stderr に出す。
 *   3. 各ブロックから id / name / source / affiliateUrl（pc= をデコードした楽天URL）/ price /
 *      rakutenRating / rakutenReviewCount を取り、campkit-20260921-15 §8(b) の基準でスコアを付ける:
 *        型番らしいトークン +3 ／ 実在ブランド名 +2 ／ メーカー公式店URL +1 ／
 *        複数型番が並ぶ −2 ／ 汎用語のみ（ブランドも型番も無い） −3 ／
 *        型番同士が `+`/`＋` で直接連結された複合型番（例 2000021950+5103A470T）−3
 *          ※ 楽天店が組んだ「本体＋ガス」等のセット品で Amazon は単品売りのみになる型。
 *            「セット」の語だけで型番連結が無いもの（BLUETTI EB3A（…セット）等）は対象外
 *            （2026-09-21 campkit-20260921-18）／
 *        「ふるさと納税・並行輸入・訳あり・アウトレット」は除外
 *   4. 変更禁止リスト（FROZEN_SLUGS）の記事は候補から除外する。
 *   4.5 `_file/amazon-backfill-no-amazon.tsv`（slug / rank / id / judged_task / reason）があれば、
 *      slug + rank が一致するカード（過去タスクで no-amazon と判定済み）を候補から除外する。
 *      ファイルが無ければ従来どおり全件出力する。除外件数は stderr に
 *      `[excluded] N cards by amazon-backfill-no-amazon.tsv` で出す（2026-09-21 campkit-20260921-17）。
 *   5. `_file/amazon-backfill-candidates.tsv`
 *      （slug / rank / id / score / name / rakuten_url / price / score_reason）をスコア降順で出力。
 *
 * ※ 既存の `_file/_work/affiliate-coverage.cjs` は .gitignore 下で再実行できないため、
 *    その恒久対策としてこちらを scripts/ に置く。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LEDGER = path.join(ROOT, '_file', 'affiliate-coverage.tsv');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const OUT = path.join(ROOT, '_file', 'amazon-backfill-candidates.tsv');
// 判定済み（no-amazon）カードの除外リスト。無ければ除外しない
const NO_AMAZON = path.join(ROOT, '_file', 'amazon-backfill-no-amazon.tsv');

// ---------------------------------------------------------------------------
// 変更禁止リスト（2026-10-18 まで本文・frontmatter とも変更禁止。task-campkit-20260921-16 より）
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// 実在ブランド（CLAUDE.md の推奨ブランド表 ＋ backfill 実績で Amazon 出品を確認したブランド）
// [表示名の正規表現, 楽天店舗スラッグに現れる英字表記]
// ---------------------------------------------------------------------------
const BRANDS = [
  [/スノーピーク|snow\s?peak/i, 'snowpeak'], [/コールマン|coleman/i, 'coleman'], [/ロゴス|logos/i, 'logos'],
  [/YETI/i, 'yeti'], [/ダイワ|daiwa/i, 'daiwa'], [/イグルー|igloo/i, 'igloo'],
  [/jackery/i, 'jackery'], [/ecoflow/i, 'ecoflow'], [/bluetti/i, 'bluetti'], [/anker/i, 'anker'],
  [/(?<![A-Za-z])DOD(?![A-Za-z])|ディーオーディー/i, 'dod'], [/DD\s?Hammocks/i, 'ddhammocks'],
  [/ナンガ|nanga/i, 'nanga'], [/モンベル|mont-?bell/i, 'montbell'], [/イスカ|isuka/i, 'isuka'],
  [/スナグパック|snugpak/i, 'snugpak'], [/ペツル|petzl/i, 'petzl'],
  [/ブラックダイヤモンド|black\s?diamond/i, 'blackdiamond'], [/レッドレンザー|ledlenser/i, 'ledlenser'],
  [/ジェントス|gentos/i, 'gentos'], [/(?<![A-Za-z])SOTO(?![A-Za-z])|新富士バーナー/i, 'soto'],
  [/イワタニ|iwatani/i, 'iwatani'], [/プリムス|primus/i, 'primus'], [/ノルディスク|nordisk/i, 'nordisk'],
  [/(?<![A-Za-z])MSR(?![A-Za-z])/, 'msr'], [/モーラナイフ|morakniv/i, 'morakniv'], [/オピネル|opinel/i, 'opinel'],
  [/ビクトリノックス|victorinox/i, 'victorinox'], [/スパイダルコ|spyderco/i, 'spyderco'],
  [/naturehike|ネイチャーハイク/i, 'naturehike'], [/fieldoor|フィールドア/i, 'fieldoor'], [/geertop/i, 'geertop'],
  [/onetigris|ワンティグリス/i, 'onetigris'], [/(?<![A-Za-z])makku(?![A-Za-z])|マック(?!ス)/i, 'makku'],
  [/カジメイク|kajimeiku|doqment/i, 'kajimeiku'], [/namelessage|ネームレスエイジ/i, 'namelessage'],
  [/quickcamp|クイックキャンプ/i, 'quickcamp'], [/(?<![A-Za-z])IWANO(?![A-Za-z])/, 'iwano'],
  [/soomloom/i, 'soomloom'], [/camdoor/i, 'camdoor'], [/サーマレスト|therm-?a-?rest/i, 'thermarest'],
  [/キャプテンスタッグ|captain\s?stag/i, 'captainstag'], [/オスプレー|osprey/i, 'osprey'],
  [/グレゴリー|gregory/i, 'gregory'], [/ドイター|deuter/i, 'deuter'], [/カリマー|karrimor/i, 'karrimor'],
  [/ミステリーランチ|mystery\s?ranch/i, 'mysteryranch'], [/ミレー|millet/i, 'millet'],
  [/bears\s?rock|ベアーズロック/i, 'bearsrock'], [/山善|yamazen/i, 'yamazen'],
  [/アトラス|(?<![A-Za-z])atlas(?![A-Za-z])/i, 'atlas'], [/サーモス|thermos/i, 'thermos'],
  [/bundok|バンドック/i, 'bundok'], [/ヘリノックス|helinox/i, 'helinox'], [/ユニフレーム|uniflame/i, 'uniflame'],
  [/テンマクデザイン|tent-?mark/i, 'tentmark'], [/vastland/i, 'vastland'], [/(?<![A-Za-z])WAQ(?![A-Za-z])/, 'waq'],
  [/ワークマン|workman/i, 'workman'], [/ペトロマックス|petromax/i, 'petromax'], [/ベアボーンズ|barebones/i, 'barebones'],
  [/ゴールゼロ|goal\s?zero/i, 'goalzero'], [/スタンレー|stanley/i, 'stanley'], [/エバニュー|evernew/i, 'evernew'],
  [/titan\s?mania/i, 'titanmania'], [/トランギア|trangia/i, 'trangia'], [/(?<![A-Za-z])lodge(?![A-Za-z])/i, 'lodge'],
  [/hilander|ハイランダー/i, 'hilander'], [/tokyo\s?crafts/i, 'tokyocrafts'], [/kingcamp/i, 'kingcamp'],
  [/moon\s?lence/i, 'moonlence'], [/オガワ|(?<![A-Za-z])ogawa(?![A-Za-z])/i, 'ogawa'], [/ゼインアーツ|zane\s?arts/i, 'zanearts'],
  [/ノースフェイス|north\s?face/i, 'northface'], [/パタゴニア|patagonia/i, 'patagonia'], [/ミズノ|mizuno/i, 'mizuno'],
  [/サロモン|salomon/i, 'salomon'], [/(?<![A-Za-z])KEEN(?![A-Za-z])/, 'keen'], [/メレル|merrell/i, 'merrell'],
  [/コロンビア|columbia/i, 'columbia'], [/ハスクバーナ|husqvarna/i, 'husqvarna'], [/フィスカース|fiskars/i, 'fiskars'],
  [/シルキー|(?<![A-Za-z])silky(?![A-Za-z])/i, 'silky'], [/アイリスオーヤマ|iris\s?ohyama/i, 'irisohyama'],
  [/パナソニック|panasonic/i, 'panasonic'], [/象印|zojirushi/i, 'zojirushi'], [/タイガー魔法瓶|(?<![A-Za-z])tiger(?![A-Za-z])/i, 'tiger'],
  [/尾上製作所|(?<![A-Za-z])ONOE(?![A-Za-z])/, 'onoe'], [/ZEN\s?Camps/i, 'zencamps'], [/(?<![A-Za-z])Hilleberg/i, 'hilleberg'],
  [/ニーモ|(?<![A-Za-z])NEMO(?![A-Za-z])/, 'nemo'], [/シートゥサミット|sea\s?to\s?summit/i, 'seatosummit'],
  [/マムート|mammut/i, 'mammut'], [/(?<![A-Za-z])LEKI(?![A-Za-z])/, 'leki'], [/シナノ|sinano/i, 'sinano'],
  [/マキタ|makita/i, 'makita'], [/ハクキンカイロ|hakkin/i, 'hakkin'], [/カセットフー/i, 'iwatani'],
  [/エスビット|esbit/i, 'esbit'], [/バーゴ|(?<![A-Za-z])vargo(?![A-Za-z])/i, 'vargo'],
  [/ロスコ|rothco/i, 'rothco'], [/ミニマライト|minimalight/i, 'minimalight'], [/ニトリ|nitori/i, 'nitori'],
  [/tokyo\s?camp/i, 'tokyocamp'], [/picogrill|ピコグリル/i, 'picogrill'],
  [/ハイマウント|highmount/i, 'highmount'], [/ベルモント|belmont/i, 'belmont'], [/(?<![A-Za-z])YOGOTO/i, 'yogoto'],
  [/CARBABY/i, 'carbaby'], [/ハングアウト|hang\s?out/i, 'hangout'], [/ラドウェザー|lad\s?weather/i, 'ladweather'],
  [/BRUNO|ブルーノ/i, 'bruno'], [/デロンギ|delonghi/i, 'delonghi'], [/ドウシシャ|doshisha/i, 'doshisha'],
  [/ダイニチ|dainichi/i, 'dainichi'], [/コロナ(?![A-Za-z])|(?<![A-Za-z])corona(?![A-Za-z])/i, 'corona'],
  [/トヨトミ|toyotomi/i, 'toyotomi'], [/アラジン|aladdin/i, 'aladdin'], [/センゴクアラジン|sengoku/i, 'sengoku'],
  [/n-force|エヌフォース/i, 'nforce'],
];

// 「ふるさと納税・並行輸入・訳あり・アウトレット」は Amazon 同一商品が原理的に無いので除外
const EXCLUDE_RE = /ふるさと納税|並行輸入|訳あり|訳アリ|アウトレット/;

// 型番らしいトークン: 英大文字＋数字を含み、数字が2桁以上、4文字以上、ハイフン区切り可（例: AS-7100 / QC-CS180 / T2-073-TN / A2MG8A01 / OS57176）
const MODEL_TOKEN_RE = /(?<![A-Za-z0-9])[A-Z0-9]+(?:-[A-Z0-9]+)*(?![A-Za-z0-9])/g;
// 型番と誤認しやすい規格・仕様表記（300D / 210T / 1000WH / UV99 / IPX4 / USB3 / 2WAY など）
const NOT_MODEL_RE = /^(?:\d+[A-Z]{1,2}|(?:UV|UPF|SPF|PU|IPX?|USB|R|T|D|SS|SH|L|M|S|XL|XXL|LL|3L|4L|5L)\d+|(?:DC|AC)\d+V?|\d+X\d+|\d+-\d+|\d+(?:-\d+)*[A-Z]{0,2})$/;

function isModelToken(tok) {
  if (tok.length < 4) return false;
  if (!/[A-Z]/.test(tok)) return false;
  if ((tok.match(/\d/g) || []).length < 2) return false;
  if (NOT_MODEL_RE.test(tok)) return false;
  return true;
}

function modelTokens(name) {
  const found = new Set();
  for (const m of name.matchAll(MODEL_TOKEN_RE)) {
    if (isModelToken(m[0])) found.add(m[0]);
  }
  // 同一型番の派生表記（例: SCS-008T と SCS-008）は1つに数える
  const list = [...found];
  return list.filter((t) => !list.some((o) => o !== t && o.startsWith(t) && o.length > t.length));
}

// 複合型番: 型番らしいトークン同士が `+` / `＋` で直接連結されたもの（例: 2000021950+5103A470T / 205588+5103A230T /
// 2000031235+VP160401J01）。楽天店が組んだセット品の目印で、Amazon は単品売りのみ＝構成違いになる（campkit-20260921-17 で4枚混入）。
// コールマン等は型番が純数字なので、片側は英字無しでも型番とみなす（isModelToken より緩い条件）。
const COMPOUND_SIDE = '[A-Z0-9]+(?:-[A-Z0-9]+)*';
const COMPOUND_MODEL_RE = new RegExp(`(?<![A-Za-z0-9])${COMPOUND_SIDE}(?:[+＋]${COMPOUND_SIDE})+(?![A-Za-z0-9])`, 'g');
// 単位付き数値（268WH / 130W / 470G / 10CM 等）は型番ではない
const UNIT_TOKEN_RE = /^\d+(?:W|WH|V|A|AH|MAH|MM|CM|M|KG|G|L|ML|D|T|H|X|P|K)$/;

function isCompoundSide(tok) {
  if (tok.length < 4) return false;
  if ((tok.match(/\d/g) || []).length < 2) return false;
  if (UNIT_TOKEN_RE.test(tok)) return false;
  return true;
}

function compoundModels(name) {
  const found = [];
  for (const m of name.matchAll(COMPOUND_MODEL_RE)) {
    const sides = m[0].split(/[+＋]/);
    if (sides.length >= 2 && sides.every(isCompoundSide)) found.push(m[0]);
  }
  return found;
}

// ---------------------------------------------------------------------------
// 台帳・記事の読み込み
// ---------------------------------------------------------------------------
function readTsv(file) {
  const lines = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.length);
  const header = lines.shift().split('\t');
  return lines.map((l) => {
    const cols = l.split('\t');
    const row = {};
    header.forEach((h, i) => (row[h] = cols[i] ?? ''));
    return row;
  });
}

// notes 列: 「Amazon未設定カード N/M (#a,#b)」。0/M は括弧が無い（例: 「Amazon未設定カード 0/5 ｜…」）ので括弧を任意にする
const NOTES_RE = /Amazon未設定カード\s*(\d+)\/(\d+)(?:\s*\(([^)]*)\))?/;

function parseNotes(notes) {
  const m = NOTES_RE.exec(notes || '');
  if (!m) return null;
  const positions = (m[3] || '')
    .split(/[,、]/)
    .map((s) => s.trim().replace(/^#/, ''))
    .filter(Boolean)
    .map(Number);
  return { unset: Number(m[1]), total: Number(m[2]), positions };
}

// no-amazon 除外リストを `slug\trank` の Set で返す。ファイルが無ければ空 Set（従来動作）
function readNoAmazon() {
  if (!fs.existsSync(NO_AMAZON)) return new Set();
  const keys = new Set();
  for (const row of readTsv(NO_AMAZON)) {
    if (row.slug && row.rank) keys.add(`${row.slug}\t${Number(row.rank)}`);
  }
  return keys;
}

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
    // 台帳の「Amazon未設定」= amazonAsin / amazonUrl(amzn.to 等) / source="amazon" のいずれも無いカード
    const hasAmazon = /\bamazonAsin=/.test(m[1]) || /\bamazonUrl=/.test(m[1]) || attrs.source === 'amazon';
    cards.push({ index: idx, rank: Number(attrs.rank) || idx, attrs, hasAmazon });
  }
  return cards;
}

function rakutenUrl(affiliateUrl) {
  if (!affiliateUrl) return '';
  try {
    const u = new URL(affiliateUrl);
    const pc = u.searchParams.get('pc');
    if (pc) return pc;
  } catch {
    /* not a URL */
  }
  return affiliateUrl;
}

function rakutenShop(url) {
  const m = /item\.rakuten\.co\.jp\/([^/]+)\//.exec(url);
  return m ? m[1] : '';
}

// ---------------------------------------------------------------------------
// スコアリング（campkit-20260921-15 §8(b)）
// ---------------------------------------------------------------------------
function score(name, url) {
  const reasons = [];
  if (EXCLUDE_RE.test(name)) return { score: null, reason: '除外(ふるさと納税/並行輸入/訳あり/アウトレット)' };

  let s = 0;
  const tokens = modelTokens(name);
  if (tokens.length >= 1) {
    s += 3;
    reasons.push(`型番+3(${tokens[0]})`);
  }
  if (tokens.length >= 2) {
    s -= 2;
    reasons.push(`複数型番-2(${tokens.join('/')})`);
  } else if (/セット/.test(name) && /[+＋&＆]/.test(name)) {
    // 「A+B セット」型の複合ページは Amazon が単体売りのみで構成違いになりやすい（15 §8(b)）
    s -= 2;
    reasons.push('セット品-2');
  }
  // 型番＋型番の複合はセット品として更に −3（campkit-20260921-18）。「セット」の語だけのものは従来どおり
  const compounds = compoundModels(name);
  if (compounds.length) {
    s -= 3;
    reasons.push(`複合型番セット-3(${compounds[0]})`);
  }
  const brands = BRANDS.filter(([re]) => re.test(name));
  if (brands.length) {
    s += 2;
    reasons.push(`ブランド+2(${brands[0][1]})`);
  }

  const shop = rakutenShop(url).toLowerCase().replace(/[-_]/g, '');
  if (shop) {
    const official = /direct|official/.test(shop) || brands.some(([, slug]) => slug && shop.includes(slug));
    if (official) {
      s += 1;
      reasons.push(`公式店+1(${rakutenShop(url)})`);
    }
  }

  if (tokens.length === 0 && brands.length === 0) {
    s -= 3;
    reasons.push('汎用語のみ-3');
  }
  return { score: s, reason: reasons.join(' ') };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function main() {
  const argv = process.argv.slice(2);
  const minIdx = argv.indexOf('--min');
  const MIN = minIdx >= 0 ? Number(argv[minIdx + 1]) : 2;

  const rows = readTsv(LEDGER);
  const noAmazon = readNoAmazon();
  const out = [];
  const stats = {
    ledgerRows: rows.length, parsed: 0, zero: 0, positive: 0, frozen: 0, frozenCards: 0,
    articles: 0, cards: 0, excluded: 0, mismatch: 0, noAmazon: 0,
  };
  const articlesAtMin = new Set();

  for (const row of rows) {
    const p = parseNotes(row.notes);
    if (!p) continue;
    stats.parsed += 1;
    if (p.unset === 0) {
      stats.zero += 1;
      continue;
    }
    stats.positive += 1;
    if (FROZEN_SLUGS.has(row.slug)) {
      stats.frozen += 1;
      stats.frozenCards += p.unset;
      continue;
    }
    const file = path.join(POSTS_DIR, row.slug + '.mdx');
    if (!fs.existsSync(file)) {
      console.error(`[missing] ${row.slug}: mdx が見つかりません`);
      continue;
    }
    const cards = parseCards(fs.readFileSync(file, 'utf8'));
    const unset = cards.filter((c) => !c.hasAmazon);

    // 台帳 notes の位置リストと実測を突き合わせ（実測を正とする）
    const measured = unset.map((c) => c.rank).sort((a, b) => a - b).join(',');
    const noted = [...p.positions].sort((a, b) => a - b).join(',');
    if (measured !== noted) {
      stats.mismatch += 1;
      console.error(`[mismatch] ${row.slug}: notes=(${noted}) 実測=(${measured})`);
    }
    if (!unset.length) continue;

    stats.articles += 1;
    for (const c of unset) {
      if (noAmazon.has(`${row.slug}\t${c.rank}`)) {
        stats.noAmazon += 1;
        continue;
      }
      const a = c.attrs;
      const url = rakutenUrl(a.affiliateUrl);
      const sc = score(a.name || '', url);
      if (sc.score === null) {
        stats.excluded += 1;
        continue;
      }
      stats.cards += 1;
      if (sc.score >= MIN) articlesAtMin.add(row.slug);
      out.push({
        slug: row.slug, rank: c.rank, id: a.id || '', score: sc.score, name: a.name || '',
        rakuten_url: url, price: a.price || '', score_reason: sc.reason,
        source: a.source || '', rakutenRating: a.rakutenRating || '', rakutenReviewCount: a.rakutenReviewCount || '',
      });
    }
  }

  out.sort((x, y) => y.score - x.score || x.slug.localeCompare(y.slug) || x.rank - y.rank);
  const header = ['slug', 'rank', 'id', 'score', 'name', 'rakuten_url', 'price', 'score_reason'];
  const tsv = [header.join('\t')]
    .concat(out.map((r) => header.map((h) => String(r[h]).replace(/\t/g, ' ')).join('\t')))
    .join('\n') + '\n';
  fs.writeFileSync(OUT, tsv, 'utf8');

  const atMin = out.filter((r) => r.score >= MIN).length;
  console.error(`[excluded] ${stats.noAmazon} cards by amazon-backfill-no-amazon.tsv`);
  console.log(`台帳行数: ${stats.ledgerRows}（notes が「Amazon未設定カード N/M」形式: ${stats.parsed} ／ N=0: ${stats.zero} ／ N>0: ${stats.positive}）`);
  console.log(`変更禁止リストで除外: ${stats.frozen}記事 ${stats.frozenCards}枚`);
  console.log(`対象記事数: ${stats.articles} ／ 未設定カード総数: ${stats.cards}（除外語で落としたカード: ${stats.excluded} ／ notes と実測の食い違い: ${stats.mismatch}記事）`);
  console.log(`score>=${MIN}: ${atMin}枚 ／ ${articlesAtMin.size}記事`);
  console.log(`出力: ${path.relative(ROOT, OUT)}`);
}

main();
