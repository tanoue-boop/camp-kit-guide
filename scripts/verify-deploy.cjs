#!/usr/bin/env node
/**
 * デプロイ後の本番検証スクリプト
 *
 * 使い方:
 *   node scripts/verify-deploy.cjs                      # 直近コミットで変更された記事を自動検出
 *   node scripts/verify-deploy.cjs snowpeak-tent ...    # slug を明示指定
 *   node scripts/verify-deploy.cjs --deployed-at=<epoch秒> ...
 *                                                       # deploy.cjs が push 直前の時刻を渡す（反映待ち判定に使う）。
 *                                                       # 未指定なら HEAD のコミット時刻で代用する
 *   node scripts/verify-deploy.cjs --test               # ネットに出ないフィクスチャで判定ロジックを検査する
 *
 * 各記事について次を検証し、PASS/FAIL を出力する。
 *   0. 取得した本番HTMLが「旧キャッシュ」でないこと（2026-09-22 追加・campkit-20260921-40 §B）
 *      x-vercel-cache / age ヘッダを見て、キャッシュされた時刻がデプロイ（push）より古い応答は
 *      「反映待ち」とみなし 30秒間隔・最大180秒で再取得する。上限に達したら FAIL して理由を出す。
 *      判定用の取得には必ず ?cb=<エポック秒> を付ける。
 *   1. 本番URLが 200 を返す
 *   2. <title> がローカル frontmatter の title と一致
 *   3. アフィリリンク数
 *      - 楽天: 「収益の付くリンク」＝ ProductCard の楽天ボタン（<a class="…ProductCard…__rakuten">）のうち
 *        href が hb.afl.rakuten.co.jp のものだけを数え、mdx から算出した期待数
 *        （source="rakuten" かつ affiliateUrl が https://hb.afl.rakuten.co.jp/ で始まるカードの枚数）と
 *        【一致】することを必須にする（2026-09-22 追記・campkit-20260921-40 §A）。
 *        search.rakuten.co.jp の検索URL（source="amazon" カードの楽天ボタン＝収益なし）は別カウントにして
 *        合否に使わない。期待数 0（全カード source="amazon"）は実測 0 で PASS。
 *        ★旧実装の穴: hb.afl/rafcid の全出現数を数えて「期待数以上」で PASS にしていたが、1枚のカードの
 *        hb.afl は本番HTMLに 3 回（ボタン href／JSON-LD offers.url／__NEXT_DATA__）＋比較表の購入先リンクで
 *        現れるため、旧HTMLに 3 枚しか楽天カードが無くても 9 ≧ 4 で PASS した（38 で実際に発生。
 *        docs/deploy-note.md 2026-09-15 の追記と同じ系列の穴）。
 *      - Amazon: ProductCard の Amazon ボタン（<a class="…ProductCard…__amazon">）の枚数が、mdx をカード単位に
 *        解析して「そのカードに Amazon ボタンが出るか」を ProductCard.getAmazonUrl() と同じ優先順
 *        （amazonUrl → amazonAsin → source="amazon" のとき affiliateUrl を ASIN とみなす）で判定した期待数と
 *        【一致】することを必須にする（2026-09-22 追記・campkit-20260921-45／キュー#32。楽天と同じ形）。
 *        期待数 0（Amazon リンクを持つカードが無い）は実測 0 で PASS。
 *        ★旧実装の穴: 期待側は amazonAsin=/amazonUrl=/source="amazon" の mdx 全文出現数、実測側は dp?tag= と
 *        amzn.to の全出現数で「期待数以上」だった。source="amazon" カードは dp?tag= がボタン href と JSON-LD
 *        offers.url の 2 回、amazonUrl カードは amzn.to がボタン href と __NEXT_DATA__ の 2 回出るため、
 *        旧HTMLにボタンが足りなくても重複出現ぶんで期待数を満たして PASS しえた（ogawa-tent／sleeping-bag-cover の
 *        「期待6→実6」は amazonAsin×5＋source="amazon"×1 と ボタン5＋JSON-LD1 が偶然つじつまの合った例）。
 *        dp?tag=／amzn.to の全出現数は参考表示に残す（合否対象外）。
 *        （2026-09-15 追記：合算チェックだけだと「楽天リンクだけを追加したデプロイ」で旧HTMLの合計が
 *        たまたま一致し誤PASSする穴があったため個別チェックにした、という経緯はそのまま）
 *   4. PR表記（景表法対応）が本文に含まれる
 *   5. og:image がサムネイル規約（/images/thumbnails/<slug>.png または /images/outdoor-0X.png）に一致し、
 *      【ローカル frontmatter の thumbnail と同じ画像】であり、その画像URLが実際に 200 を返す
 *      （2026-09-17追記：形式と200しか見ていなかったため、サムネイルだけを差し替えたデプロイで
 *      Vercelビルド完了前の旧HTMLを取得し、旧 og:image のまま即PASSする穴があった。
 *      期待値と一致するまでリトライする扱いに変更）
 *
 * 1件でも FAIL があれば exit code 1 で終了する。
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE = 'https://www.camp-kit-guide.com';
const POSTS_DIR = path.join(__dirname, '..', 'content', 'posts');
const PR_TEXT = 'アフィリエイト広告';
// 内容ベースの反映待ち（title / リンク数 / og:image が期待と食い違う間）: 20回×15秒＝最大約5分
const RETRY = 20;
const RETRY_WAIT_MS = 15000;
// ヘッダベースの反映待ち（x-vercel-cache=HIT かつ age がデプロイより古い間）: 30秒×6回＝最大180秒
const STALE_RETRY = 6;
const STALE_WAIT_MS = 30000;
// 「キャッシュがデプロイより古い」と判定するときの時計ずれ許容（秒）
const STALE_SLACK_SEC = 5;
// サムネイル規約: 生成サムネイル /images/thumbnails/<slug>.png（2026-09-16〜の新方式）と、
// フォールバック画像プール /images/outdoor-01.png 〜 outdoor-09.png の両方を許可する。
// 2026-09-17 追記: 旧正規表現が outdoor-0X.png しか通さず、生成サムネイルを設定した記事が
// 形式NGで FAIL していたため thumbnails/ を追加した。
const THUMB_RE = /\/images\/(?:outdoor-0[1-9]|thumbnails\/[a-z0-9-]+)\.png/;
const HB_AFL_PREFIX = 'https://hb.afl.rakuten.co.jp/';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function detectChangedSlugs() {
  try {
    const out = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' });
    return out
      .split('\n')
      .filter((f) => f.startsWith('content/posts/') && f.endsWith('.mdx'))
      .map((f) => path.basename(f, '.mdx'));
  } catch {
    return [];
  }
}

// deploy.cjs から --deployed-at が渡されなかったとき（手動再実行）は HEAD のコミット時刻で代用する。
// deploy.cjs は commit → push を数秒で行うので、push 時刻の下限としてほぼ同じ意味になる。
function detectDeployedAt() {
  try {
    const out = execSync('git log -1 --format=%ct', { encoding: 'utf8' }).trim();
    const n = Number(out);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

// ── ローカル mdx の解析（期待値の算出） ───────────────────────────────────
function parseLocal(src) {
  const titleMatch = src.match(/^title:\s*"([\s\S]*?)"\s*$/m);
  // frontmatter の thumbnail（og:image の期待値）。空文字は /og-default.png へフォールバックするので照合対象外。
  const thumbMatch = src.match(/^thumbnail:\s*"([^"]*)"\s*$/m);
  const cards = src.match(/<ProductCardMdx[\s\S]*?\/>/g) || [];
  const cardCount = cards.length;
  // 楽天の「収益の付くリンク」が出るはずのカード＝ source="rakuten" かつ affiliateUrl が hb.afl で始まるもの。
  // それ以外（source="amazon"／affiliateUrl="#"）は ProductCard が楽天ボタンを検索URL（rafcid付き・収益なし）
  // で描画するので、期待値には数えず rakutenSearchExpected に分ける（合否には使わない参考値）。
  let rakutenExpected = 0;
  let rakutenSearchExpected = 0;
  // Amazon ボタンが出るはずのカードの枚数。ProductCard.getAmazonUrl() と同じ優先順で「カードごとに 0 or 1」を数える:
  //   amazonUrl（空でない）→ amazonAsin（空でない）→ source="amazon" かつ affiliateUrl が空でも "#" でもない（ASIN とみなす）
  // amazonUrl と amazonAsin を両方持つカードでもボタンは 1 つなので 1 と数える（2026-09-22・campkit-20260921-45）。
  let amazonExpected = 0;
  for (const card of cards) {
    const source = (card.match(/\bsource="([^"]*)"/) || [])[1] || '';
    const aff = (card.match(/\baffiliateUrl="([^"]*)"/) || [])[1] || '';
    if (source === 'rakuten' && aff.startsWith(HB_AFL_PREFIX)) rakutenExpected++;
    else if (source !== 'other') rakutenSearchExpected++;
    if (cardHasAmazonButton(card, source, aff)) amazonExpected++;
  }
  // 参考: 旧実装が期待値にしていた「amazonAsin= / amazonUrl= / source="amazon" の mdx 全文出現数」（合否には使わない）
  const amazonHints = (src.match(/amazonAsin="|amazonUrl="|source="amazon"/g) || []).length;
  // 同一記事内での amazonAsin 重複検出（別商品に同じASIN＝誤リンク。例: ST/LX に同じ親ASIN）
  const asins = [...src.matchAll(/amazonAsin="([A-Z0-9]{10})"/g)].map((m) => m[1]);
  const dupAsins = [...new Set(asins.filter((a, i) => asins.indexOf(a) !== i))];
  const thumbnail = thumbMatch && thumbMatch[1] ? thumbMatch[1] : null;
  return {
    title: titleMatch ? titleMatch[1] : null,
    thumbnail,
    cardCount,
    amazonExpected,
    amazonHints,
    rakutenExpected,
    rakutenSearchExpected,
    dupAsins,
  };
}

// components/article/ProductCard.tsx の getAmazonUrl() を mdx 属性の上で再現する。
//   if (product.amazonUrl) return product.amazonUrl;
//   if (product.amazonAsin) return buildAmazonUrl(product.amazonAsin);
//   if (product.source === "amazon" && product.affiliateUrl && product.affiliateUrl !== "#") return buildAmazonUrl(affiliateUrl);
//   return null;   → ボタンなし
// ProductCardMdx は属性文字列をそのまま渡すので、空文字（amazonUrl=""）は falsy＝ボタンなし。
function cardHasAmazonButton(card, source, aff) {
  const amazonUrl = (card.match(/\bamazonUrl="([^"]*)"/) || [])[1] || '';
  const amazonAsin = (card.match(/\bamazonAsin="([^"]*)"/) || [])[1] || '';
  if (amazonUrl) return true;
  if (amazonAsin) return true;
  if (source === 'amazon' && aff && aff !== '#') return true;
  return false;
}

function readLocal(slug) {
  const file = path.join(POSTS_DIR, slug + '.mdx');
  if (!fs.existsSync(file)) return null;
  return parseLocal(fs.readFileSync(file, 'utf8'));
}

// ── 本番HTMLの計測 ────────────────────────────────────────────────────────
function extractOgImage(html) {
  // property/name どちらの並びでも拾う
  const m =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  return m ? m[1] : '';
}

function countAffiliateLinks(html) {
  // 楽天: ProductCard の楽天ボタン（<a … class="…ProductCard…__rakuten…">）だけを数える。
  //   href が hb.afl.rakuten.co.jp → rakutenHb（収益の付くリンク・合否に使う）
  //   href が search.rakuten.co.jp → rakutenSearch（source="amazon" カードの検索URL・収益なし・参考値）
  // 属性順に依存しないよう <a …> タグ全体を取り出してから href / class を読む。
  // Amazon: ProductCard の Amazon ボタン（<a … class="…ProductCard…__amazon…">）だけを数える（2026-09-22・campkit-20260921-45）。
  //   href が amazon.co.jp/dp/<ASIN>?tag= → amazonButtonDp、amzn.to/… → amazonButtonShort。合否は合計 amazonButtons で見る。
  //   JSON-LD offers.url／__NEXT_DATA__／比較表／本文中のリンクに出る dp?tag=・amzn.to は数えない（参考値 amazonTag / amznTo に残る）。
  let rakutenHb = 0;
  let rakutenSearch = 0;
  let rakutenTableHb = 0;
  let amazonButtonDp = 0;
  let amazonButtonShort = 0;
  let amazonButtonOther = 0;
  for (const tag of html.match(/<a\s[^>]*>/g) || []) {
    const href = (tag.match(/\bhref="([^"]*)"/) || [])[1] || '';
    const cls = (tag.match(/\bclass="([^"]*)"/) || [])[1] || '';
    if (/ProductCard[^\s"]*__rakuten\b/.test(cls)) {
      if (href.startsWith(HB_AFL_PREFIX)) rakutenHb++;
      else if (/^https?:\/\/search\.rakuten\.co\.jp\//.test(href)) rakutenSearch++;
    } else if (/ProductCard[^\s"]*__amazon\b/.test(cls)) {
      if (/^https?:\/\/(?:www\.)?amazon\.co\.jp\/dp\/[A-Z0-9]+\?tag=/.test(href)) amazonButtonDp++;
      else if (/^https?:\/\/amzn\.to\/[A-Za-z0-9]+/.test(href)) amazonButtonShort++;
      else amazonButtonOther++;
    } else if (/ComparisonTable[^\s"]*__link\b/.test(cls) && href.startsWith(HB_AFL_PREFIX)) {
      rakutenTableHb++;
    }
  }
  const amazonButtons = amazonButtonDp + amazonButtonShort + amazonButtonOther;
  // 参考: 旧実装が数えていた「hb.afl の全出現数」（ボタン＋JSON-LD＋__NEXT_DATA__＋比較表＝1カードにつき3〜4回）
  const rakutenHbAll = (html.match(/hb\.afl\.rakuten\.co\.jp\/hgc\//g) || []).length;
  // 参考: 旧実装が合否に使っていた「dp?tag= / amzn.to の全出現数」（ボタン＋JSON-LD／__NEXT_DATA__＝1カードにつき最大2回）
  const amazonTag = (html.match(/amazon\.co\.jp\/dp\/[A-Z0-9]+\?tag=/g) || []).length;
  const amznTo = (html.match(/amzn\.to\/[A-Za-z0-9]+/g) || []).length;
  // 不正タグ検出: tag= の直後が引用符/&/空白/) = 空タグ。既知プレースホルダも検出。
  const amazonEmptyTag = (html.match(/amazon\.co\.jp\/dp\/[A-Z0-9]+\?tag=["'&\s)]/g) || []).length;
  const amazonPlaceholderTag = (html.match(/tag=your-associate-tag-22\b/g) || []).length;
  return {
    rakuten: rakutenHb,
    rakutenHb,
    rakutenSearch,
    rakutenTableHb,
    rakutenHbAll,
    amazonButtons,
    amazonButtonDp,
    amazonButtonShort,
    amazonButtonOther,
    amazonTag,
    amznTo,
    amazonEmptyTag,
    amazonPlaceholderTag,
    total: rakutenHb + amazonTag + amznTo,
  };
}

// 楽天リンクの合否（§A）。期待数（mdx 由来）と実測（ボタンの hb.afl 数）の一致だけを見る。
// 期待 0 は実測 0 で PASS（source="amazon" カードは正当に存在する）。
function judgeRakuten(local, links) {
  return links.rakutenHb === local.rakutenExpected;
}

// Amazon リンクの合否（campkit-20260921-45）。期待数（mdx をカード単位に見て Amazon ボタンが出る枚数）と
// 実測（ProductCard の Amazon ボタン枚数）の一致だけを見る。期待 0 は実測 0 で PASS。
function judgeAmazon(local, links) {
  return links.amazonButtons === local.amazonExpected;
}

// ── 反映待ちの判定 ────────────────────────────────────────────────────────
// 本番HTMLが「まだ反映されていない」と見なす理由を列挙する（空＝反映済みとみなす）。
// title / Amazonリンク数 / 楽天 hb.afl 数 / og:image のいずれかが期待と食い違えば反映待ち。
function pendingReasons(html, local) {
  const reasons = [];
  if (local.title) {
    const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const liveTitle = m ? m[1].trim() : '';
    if (!liveTitle.includes(local.title)) reasons.push('本番がまだ旧タイトルを返しています');
  }
  const l = countAffiliateLinks(html);
  // 本文のみ変更(title不変)のデプロイでは、期待ありなのに本番Amazonリンクが足りない＝未反映のことがある。
  // 旧実装は「実0本」のときしか再試行しなかったため、1本でも旧リンクが残っていると
  // 【デプロイ前の古いHTML】をそのまま検証してPASSしていた（毎回「期待N→実N-1」が出る原因）。
  // 2026-09-22（campkit-20260921-45）: 楽天と同じく「ボタン枚数の一致」で見る（多くても少なくても反映待ち）。
  // 旧実装の「dp?tag=/amzn.to 全出現数 ≧ mdx 全文の属性出現数」は JSON-LD／__NEXT_DATA__ の重複出現で
  // 期待数を満たしてしまい、ボタンが足りない旧HTMLを反映待ちとして検出できなかった。
  if (!judgeAmazon(local, l)) {
    reasons.push(`本番のAmazonリンク(ボタン)が${l.amazonButtons}本で期待${local.amazonExpected}本と不一致です`);
  }
  // 楽天は「一致」で見る（多くても少なくても反映待ち）。旧実装の「hb.afl/rafcid 全出現数 ≧ 期待」では
  // 旧HTMLの重複出現（1カード3〜4回）で期待数を満たしてしまい、反映待ちを検出できなかった。
  if (!judgeRakuten(local, l)) {
    reasons.push(`本番の楽天リンク(hb.afl ボタン)が${l.rakutenHb}本で期待${local.rakutenExpected}本と不一致です`);
  }
  // サムネイルだけを差し替えたデプロイ（title・リンク数は不変）は上の条件では検出できない
  // （2026-09-17 に実際に発生）ため og:image も期待値と照合する。
  if (local.thumbnail) {
    const liveOg = extractOgImage(html) || '';
    if (!liveOg.endsWith(local.thumbnail)) {
      reasons.push(`本番の og:image が「${liveOg || '(なし)'}」で期待「${local.thumbnail}」と不一致です`);
    }
  }
  return reasons;
}

// x-vercel-cache / age ヘッダから「デプロイより古いキャッシュに当たっている」かを判定する（§B）。
//   headers: { cache: x-vercel-cache の値, age: age の値 }
//   deployedAt: push 時刻（epoch秒）。null なら判定不能＝stale 扱いにしない（理由を返す）
//   now: 現在時刻（epoch秒）
// 判定: cache が HIT/STALE で、age > (now - deployedAt) + 許容 ＝ キャッシュされた時刻が push より前 → stale。
// PRERENDER / MISS はデプロイ済みの成果物から直接返っているので fresh。
function judgeCache(headers, deployedAt, now) {
  const cache = String(headers.cache || '').toUpperCase() || '(なし)';
  const ageRaw = Number(headers.age);
  const age = Number.isFinite(ageRaw) && ageRaw > 0 ? ageRaw : 0;
  const fromCache = cache === 'HIT' || cache === 'STALE';
  if (!fromCache) return { stale: false, cache, age, reason: `x-vercel-cache=${cache} / age=${age}s（キャッシュ経由でない）` };
  if (deployedAt == null) {
    return { stale: false, cache, age, reason: `x-vercel-cache=${cache} / age=${age}s（デプロイ時刻が不明のため判定せず）` };
  }
  const sinceDeploy = Math.max(0, now - deployedAt);
  if (age > sinceDeploy + STALE_SLACK_SEC) {
    return {
      stale: true,
      cache,
      age,
      reason: `x-vercel-cache=${cache} / age=${age}s がデプロイ後経過${Math.round(sinceDeploy)}s より大きい（デプロイ前の旧キャッシュ）`,
    };
  }
  return { stale: false, cache, age, reason: `x-vercel-cache=${cache} / age=${age}s（デプロイ後にキャッシュされたもの）` };
}

// 本番HTMLを「反映済み」と判定できるまで取得を繰り返す。
//   - 内容ベースの反映待ち（pendingReasons）: RETRY 回 × RETRY_WAIT_MS
//   - ヘッダベースの反映待ち（judgeCache）: STALE_RETRY 回 × STALE_WAIT_MS。上限に達したら staleTimeout=true で返す
// テストから差し替えられるよう fetch / sleep / now / log を注入可能にしてある。
async function fetchWithRetry(url, local, opts = {}) {
  const fetchImpl = opts.fetchImpl || fetch;
  const sleepImpl = opts.sleepImpl || sleep;
  const nowSec = opts.now || (() => Date.now() / 1000);
  const log = opts.log || console.log;
  const deployedAt = opts.deployedAt == null ? null : opts.deployedAt;
  let last = null;
  let contentRetry = 0;
  let staleRetry = 0;
  let fetches = 0;
  for (;;) {
    let res = null;
    try {
      // 判定用の取得には必ず ?cb=<エポック秒> を付ける（既存の慣行）
      const target = url + (url.includes('?') ? '&' : '?') + 'cb=' + Math.floor(nowSec());
      fetches++;
      res = await fetchImpl(target, { redirect: 'follow' });
    } catch (e) {
      last = { status: 0, html: '', error: e.message, fetches };
    }
    if (res) {
      if (res.status === 200) {
        const html = await res.text();
        const headers = { cache: res.headers.get('x-vercel-cache'), age: res.headers.get('age') };
        const cache = judgeCache(headers, deployedAt, nowSec());
        const reasons = pendingReasons(html, local);
        last = { status: 200, html, headers, cache, reasons, fetches };
        if (!cache.stale && reasons.length === 0) return last;
        if (cache.stale) {
          if (staleRetry >= STALE_RETRY) {
            last.staleTimeout = true;
            return last;
          }
          staleRetry++;
          log(
            `   …本番がデプロイ前の旧キャッシュを返しています（${cache.reason}）。` +
              `${STALE_WAIT_MS / 1000}秒待って再取得 (${staleRetry}/${STALE_RETRY})`
          );
          await sleepImpl(STALE_WAIT_MS);
          continue;
        }
        if (contentRetry >= RETRY - 1) return last;
        contentRetry++;
        log(`   …${reasons[0]}（Vercel反映待ち）。${RETRY_WAIT_MS / 1000}秒待って再試行 (${contentRetry + 1}/${RETRY})`);
        await sleepImpl(RETRY_WAIT_MS);
        continue;
      }
      last = { status: res.status, html: '', fetches };
    }
    if (contentRetry >= RETRY - 1) return last;
    contentRetry++;
    log(`   …未反映のようです。${RETRY_WAIT_MS / 1000}秒待って再試行 (${contentRetry + 1}/${RETRY})`);
    await sleepImpl(RETRY_WAIT_MS);
  }
}

async function imageReturns200(url) {
  // ページが200を返した後なので静的アセットは即時公開されているはず。軽く3回だけ試す。
  for (let i = 0; i < 3; i++) {
    try {
      let res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      // HEAD 非対応の環境向けに GET フォールバック
      if (res.status === 405 || res.status === 501) {
        res = await fetch(url, { method: 'GET', redirect: 'follow' });
      }
      if (res.status === 200) return true;
    } catch {
      /* リトライ */
    }
    if (i < 2) await sleep(3000);
  }
  return false;
}

// ── 記事1本の検証 ─────────────────────────────────────────────────────────
async function verify(slug, deployedAt) {
  const results = [];
  const local = readLocal(slug);
  console.log(`\n■ ${slug}`);

  if (!local) {
    console.log('  FAIL  ローカルに content/posts/' + slug + '.mdx が見つかりません');
    return false;
  }

  const url = `${BASE}/posts/${slug}`;
  const res = await fetchWithRetry(url, local, { deployedAt });

  // 0. 反映待ちの上限（旧キャッシュのまま STALE_RETRY 回を超えた）
  if (res.staleTimeout) {
    console.log(
      `  FAIL  反映待ちが上限（${STALE_WAIT_MS / 1000}秒×${STALE_RETRY}回）に達しました: ${res.cache.reason}` +
        `  ※Vercel のデプロイ完了を確認して再実行してください（本番アクセス ${res.fetches} 回）`
    );
    return false;
  }

  // 1. HTTP 200
  const ok200 = res.status === 200;
  results.push(ok200);
  console.log(`  ${ok200 ? 'PASS' : 'FAIL'}  HTTP ${res.status || 'ERR'}  ${url}`);
  if (!ok200) return false;
  console.log(`  INFO  取得 ${res.fetches} 回 / ${res.cache.reason}`);

  const html = res.html;

  // 2. title 一致
  // Next.js は <title data-next-head=""> のように属性を付けて出力するため属性を許容する
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const liveTitle = titleMatch ? titleMatch[1].trim() : '';
  const titleOk = Boolean(local.title) && liveTitle.includes(local.title);
  results.push(titleOk);
  console.log(`  ${titleOk ? 'PASS' : 'FAIL'}  title  期待:「${local.title}」 実際:「${liveTitle}」`);

  // 3. アフィリリンク数
  //   楽天: ボタンの hb.afl 数が mdx 由来の期待数と一致（§A・2026-09-22）
  //   Amazon: ボタンの枚数が mdx 由来（カード単位・getAmazonUrl と同じ優先順）の期待数と一致（campkit-20260921-45・2026-09-22）
  //   （ProductCard 件数 ≦ 全リンク出現数 の従来チェックは残す）
  const links = countAffiliateLinks(html);
  const rakutenOk = judgeRakuten(local, links);
  const amazonOk = judgeAmazon(local, links);
  const linkOk =
    (local.cardCount === 0 ? true : links.total >= local.cardCount) &&
    amazonOk &&
    rakutenOk;
  results.push(linkOk);
  console.log(
    `  ${linkOk ? 'PASS' : 'FAIL'}  アフィリリンク  ProductCard ${local.cardCount}件` +
      ` / 楽天hb.afl 期待${local.rakutenExpected}→実${links.rakutenHb}${rakutenOk ? '' : ' ✖不一致'}` +
      `（検索URL${links.rakutenSearch}・比較表hb.afl${links.rakutenTableHb}・hb.afl全出現${links.rakutenHbAll}は合否対象外）` +
      ` / Amazonボタン 期待${local.amazonExpected}→実${links.amazonButtons}${amazonOk ? '' : ' ✖不一致'}` +
      `（dp${links.amazonButtonDp}・amzn.to${links.amazonButtonShort}${links.amazonButtonOther ? `・その他${links.amazonButtonOther}` : ''}）` +
      `（dp?tag=全出現${links.amazonTag}・amzn.to全出現${links.amznTo}・旧期待値(属性出現数)${local.amazonHints}は合否対象外）`
  );

  // 3b. Amazonタグ健全性: 空タグ / プレースホルダは成果が計上されないため FAIL
  const tagOk = links.amazonEmptyTag === 0 && links.amazonPlaceholderTag === 0;
  results.push(tagOk);
  console.log(
    `  ${tagOk ? 'PASS' : 'FAIL'}  Amazonタグ健全性` +
      `  空タグ${links.amazonEmptyTag} / プレースホルダ${links.amazonPlaceholderTag}`
  );

  // 3c. 同一記事内で同じ amazonAsin が複数カードに付いていないか（別商品に同じASIN＝誤リンク）
  const dupOk = !local.dupAsins || local.dupAsins.length === 0;
  results.push(dupOk);
  console.log(
    `  ${dupOk ? 'PASS' : 'FAIL'}  ASIN重複なし` +
      (dupOk ? '' : `  重複ASIN: ${local.dupAsins.join(', ')}`)
  );

  // 4. PR表記
  const prOk = html.includes(PR_TEXT);
  results.push(prOk);
  console.log(`  ${prOk ? 'PASS' : 'FAIL'}  PR表記（景表法対応）`);

  // 5. og:image（サムネイル）検証
  // 形式・画像取得に加えて【ローカル frontmatter の thumbnail と一致するか】も照合する
  // （2026-09-17 追加。形式＋200だけでは旧HTMLでもPASSしてしまうため。Amazon/楽天リンク数と同じ扱い）。
  const ogImage = extractOgImage(html);
  const formatOk = THUMB_RE.test(ogImage);
  const matchOk = local.thumbnail ? (ogImage || '').endsWith(local.thumbnail) : true;
  let imgOk = false;
  if (formatOk) {
    const imgUrl = ogImage.startsWith('http') ? ogImage : `${BASE}${ogImage}`;
    imgOk = await imageReturns200(imgUrl);
  }
  const thumbOk = formatOk && matchOk && imgOk;
  results.push(thumbOk);
  console.log(
    `  ${thumbOk ? 'PASS' : 'FAIL'}  og:image「${ogImage || '(なし)'}」` +
      `  形式${formatOk ? 'OK' : 'NG(thumbnails/<slug>.png・outdoor-0X.png以外)'}` +
      (local.thumbnail ? ` / frontmatter一致${matchOk ? 'OK' : `NG(期待「${local.thumbnail}」)`}` : '') +
      (formatOk ? ` / 画像取得${imgOk ? 'OK(200)' : 'NG'}` : '')
  );

  return results.every(Boolean);
}

// ── --test: ネットに出ないフィクスチャで判定ロジックを検査する ─────────────
function buildMdx({ rakuten = 0, amazonLegacy = 0, hashUrl = 0, title = 'テスト記事', thumbnail = '/images/thumbnails/test-slug.png' } = {}) {
  let s = `---\ntitle: "${title}"\nthumbnail: "${thumbnail}"\n---\n`;
  let n = 0;
  for (let i = 0; i < rakuten; i++) {
    n++;
    s += `<ProductCardMdx rank="${n}" id="p${n}" name="商品${n}" price="1000" affiliateUrl="https://hb.afl.rakuten.co.jp/hgc/abc/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fshop%2F${n}%2F" amazonAsin="B00000000${n}" source="rakuten" />\n`;
  }
  for (let i = 0; i < amazonLegacy; i++) {
    n++;
    s += `<ProductCardMdx rank="${n}" id="p${n}" name="商品${n}" price="1000" affiliateUrl="B0LEGACY00${n}" amazonAsin="B0LEGACY00${n}" source="amazon" />\n`;
  }
  for (let i = 0; i < hashUrl; i++) {
    n++;
    s += `<ProductCardMdx rank="${n}" id="p${n}" name="商品${n}" price="1000" affiliateUrl="#" source="rakuten" />\n`;
  }
  return s;
}

// 本番HTMLの形を模したフィクスチャ。hb.afl は 1 カードにつき「JSON-LD offers.url／ボタン href／__NEXT_DATA__」の
// 3 回＋比較表リンク 1 回で現れる（実測: 2026-09-22 anker-power／air-frame-tent）。
function buildHtml({ hbButtons = 0, searchButtons = 0, tableLinks = 0, title = 'テスト記事', og = '/images/thumbnails/test-slug.png', amazonTag = 1, emptyTag = 0 } = {}) {
  const hb = (i) => `https://hb.afl.rakuten.co.jp/hgc/abc/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fshop%2F${i}%2F`;
  let h = `<html><head><title data-next-head="">${title} | CampKit Guide</title><meta property="og:image" content="https://www.camp-kit-guide.com${og}"/></head><body><p>本ページはアフィリエイト広告を含みます</p>`;
  let nextData = '';
  for (let i = 1; i <= hbButtons; i++) {
    h += `<script type="application/ld+json">{"@type":"Product","offers":{"@type":"Offer","availability":"https://schema.org/InStock","url":"${hb(i)}"}}</script>`;
    h += `<div class="ProductCard-module__ZglCRW__card"><div class="ProductCard-module__ZglCRW__buttons">`;
    if (amazonTag > 0) h += `<a href="https://www.amazon.co.jp/dp/B00000000${i}?tag=campkit26-22" target="_blank" rel="noopener noreferrer nofollow" class="ProductCard-module__ZglCRW__btn ProductCard-module__ZglCRW__amazon">amazon</a>`;
    h += `<a href="${hb(i)}" target="_blank" rel="noopener noreferrer nofollow" class="ProductCard-module__ZglCRW__btn ProductCard-module__ZglCRW__rakuten">Rakuten</a></div></div>`;
    nextData += `\\n  affiliateUrl: \\"${hb(i)}\\",`;
  }
  for (let i = 1; i <= searchButtons; i++) {
    h += `<div class="ProductCard-module__ZglCRW__buttons">`;
    if (amazonTag > 0) h += `<a href="https://www.amazon.co.jp/dp/B0LEGACY00${i}?tag=campkit26-22" target="_blank" rel="noopener noreferrer nofollow" class="ProductCard-module__ZglCRW__btn ProductCard-module__ZglCRW__amazon">amazon</a>`;
    h += `<a href="https://search.rakuten.co.jp/search/mall/%E5%95%86%E5%93%81${i}/?rafcid=wsc_i_is_1234567890" target="_blank" rel="noopener noreferrer nofollow" class="ProductCard-module__ZglCRW__btn ProductCard-module__ZglCRW__rakuten">Rakuten</a></div>`;
  }
  for (let i = 1; i <= tableLinks; i++) {
    h += `<td><a href="${hb(i)}" target="_blank" rel="noopener noreferrer nofollow" class="ComparisonTable-module__9iG2zW__link">楽天</a></td>`;
  }
  for (let i = 1; i <= emptyTag; i++) h += `<a href="https://www.amazon.co.jp/dp/B0EMPTY0000?tag=">amazon</a>`;
  h += `<script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"source":{"compiledSource":"${nextData}"}}}}</script></body></html>`;
  return h;
}

function fakeResponse({ status = 200, html = '', cache = 'PRERENDER', age = '0' } = {}) {
  const map = new Map([['x-vercel-cache', cache], ['age', age]]);
  return { status, headers: { get: (k) => (map.has(k) ? map.get(k) : null) }, text: async () => html };
}

// ── §D（campkit-20260921-45）: カード単位のフィクスチャ ──────────────────────
// mdx 側。cards = [{ amazonUrl?, amazonAsin?, source?, affiliateUrl? }]。属性は実記事と同じく1行1属性で書く。
// affiliateUrl 未指定は hb.afl（source="rakuten" の通常カード）。
const FX_HB = (i) => `https://hb.afl.rakuten.co.jp/hgc/abc/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fshop%2F${i}%2F`;
const FX_DP = (asin) => `https://www.amazon.co.jp/dp/${asin}?tag=campkit26-22`;
function buildMdxCards(cards, { title = 'テスト記事', thumbnail = '/images/thumbnails/test-slug.png' } = {}) {
  let s = `---\ntitle: "${title}"\nthumbnail: "${thumbnail}"\n---\n`;
  cards.forEach((c, i) => {
    const n = i + 1;
    const aff = c.affiliateUrl === undefined ? FX_HB(n) : c.affiliateUrl;
    s += `<ProductCardMdx\n  rank="${n}"\n  id="p${n}"\n  name="商品${n}"\n  description="説明${n}"\n  price="1000"\n  affiliateUrl="${aff}"\n`;
    if (c.amazonUrl !== undefined) s += `  amazonUrl="${c.amazonUrl}"\n`;
    if (c.amazonAsin !== undefined) s += `  amazonAsin="${c.amazonAsin}"\n`;
    s += `  source="${c.source || 'rakuten'}"\n/>\n`;
  });
  return s;
}
// 本番HTML側。実HTML（2026-09-22 ogawa-tent／camp-table-folding を取得して確認）の構造:
//   カードごとに <script type="application/ld+json"> の offers.url（source="amazon" かつ Amazon リンクありなら Amazon URL、
//   それ以外は楽天URL）→ カード div → ボタン群（Amazon ボタンは getAmazonUrl() が null なら出ない／楽天ボタンは常に出る）。
//   __NEXT_DATA__ の compiledSource には mdx 属性がそのまま入る（amazonAsin は ASIN 文字列のまま＝dp URL にはならない、
//   amazonUrl は amzn.to の URL がそのまま入る＝amzn.to が 1 回余分に出る）。
// cards = [{ amazonHref: null|URL, rakutenHref: URL, source, nextData: { amazonAsin?, amazonUrl? } }]
function buildHtmlCards(cards, { title = 'テスト記事', og = '/images/thumbnails/test-slug.png', tableAmazonLinks = 0, tableRakutenLinks = 0 } = {}) {
  let h = `<html><head><title data-next-head="">${title} | CampKit Guide</title><meta property="og:image" content="https://www.camp-kit-guide.com${og}"/></head><body><p>本ページはアフィリエイト広告を含みます</p>`;
  let nextData = '';
  cards.forEach((c, i) => {
    const n = i + 1;
    const rakutenHref = c.rakutenHref || FX_HB(n);
    const ldUrl = c.source === 'amazon' && c.amazonHref ? c.amazonHref : rakutenHref;
    h += `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"商品${n}","description":"説明${n}","offers":{"@type":"Offer","price":1000,"priceCurrency":"JPY","availability":"https://schema.org/InStock","url":"${ldUrl}"}}</script>`;
    h += `<div id="p${n}" style="scroll-margin-top:90px"><div class="ProductCard-module__ZglCRW__card" data-product-name="商品${n}"><div class="ProductCard-module__ZglCRW__buttons">`;
    if (c.amazonHref) {
      h += `<a href="${c.amazonHref}" target="_blank" rel="noopener noreferrer nofollow" class="ProductCard-module__ZglCRW__btn ProductCard-module__ZglCRW__amazon"><span class="ProductCard-module__ZglCRW__btnBrand">amazon</span></a>`;
    }
    h += `<a href="${rakutenHref}" target="_blank" rel="noopener noreferrer nofollow" class="ProductCard-module__ZglCRW__btn ProductCard-module__ZglCRW__rakuten"><span class="ProductCard-module__ZglCRW__btnBrand">Rakuten</span></a></div></div></div>`;
    nextData += `\\n  affiliateUrl: \\"${(c.nextData && c.nextData.affiliateUrl) || rakutenHref}\\",`;
    if (c.nextData && c.nextData.amazonUrl) nextData += `\\n  amazonUrl: \\"${c.nextData.amazonUrl}\\",`;
    if (c.nextData && c.nextData.amazonAsin) nextData += `\\n  amazonAsin: \\"${c.nextData.amazonAsin}\\",`;
  });
  for (let i = 1; i <= tableAmazonLinks; i++) {
    h += `<td class="ComparisonTable-module__9iG2zW__td"><a href="${FX_DP('B0TABLE000' + i)}" target="_blank" rel="noopener noreferrer nofollow" class="ComparisonTable-module__9iG2zW__link">Amazon</a></td>`;
  }
  for (let i = 1; i <= tableRakutenLinks; i++) {
    h += `<td class="ComparisonTable-module__9iG2zW__td"><a href="${FX_HB(i)}" target="_blank" rel="noopener noreferrer nofollow" class="ComparisonTable-module__9iG2zW__link">楽天</a></td>`;
  }
  h += `<script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"source":{"compiledSource":"${nextData}"}}}}</script></body></html>`;
  return h;
}

async function runTests() {
  const cases = [];
  const t = (name, fn) => cases.push({ name, fn });
  const eq = (a, b, m) => {
    if (a !== b) throw new Error(`${m || ''} 期待=${JSON.stringify(b)} 実=${JSON.stringify(a)}`);
  };

  // ── §A: 期待値は mdx から算出 ─────────────────────────────────────────
  t('A-1 mdx: source="rakuten"+hb.afl ×5 → 期待5・検索0', () => {
    const l = parseLocal(buildMdx({ rakuten: 5 }));
    eq(l.cardCount, 5); eq(l.rakutenExpected, 5); eq(l.rakutenSearchExpected, 0);
  });
  t('A-2 mdx: rakuten×4 + source="amazon"(affiliateUrl=ASIN)×1 → 期待4・検索1', () => {
    const l = parseLocal(buildMdx({ rakuten: 4, amazonLegacy: 1 }));
    eq(l.cardCount, 5); eq(l.rakutenExpected, 4); eq(l.rakutenSearchExpected, 1);
  });
  t('A-3 mdx: 全カード source="amazon" → 期待0（FAIL にしない前提の期待値）', () => {
    const l = parseLocal(buildMdx({ amazonLegacy: 5 }));
    eq(l.rakutenExpected, 0); eq(l.rakutenSearchExpected, 5);
  });
  t('A-4 mdx: source="rakuten" でも affiliateUrl="#" は期待に数えない', () => {
    const l = parseLocal(buildMdx({ rakuten: 3, hashUrl: 2 }));
    eq(l.rakutenExpected, 3); eq(l.rakutenSearchExpected, 2);
  });
  t('A-5 mdx: title / thumbnail / amazonHints / dupAsins は従来どおり取れる', () => {
    const l = parseLocal(buildMdx({ rakuten: 2 }) + '<ProductCardMdx rank="9" id="x" name="x" price="1" affiliateUrl="#" amazonAsin="B000000001" source="rakuten" />');
    eq(l.title, 'テスト記事'); eq(l.thumbnail, '/images/thumbnails/test-slug.png'); eq(l.amazonHints, 3); eq(l.dupAsins.join(','), 'B000000001');
  });

  // ── §A/§C: 本番HTMLの計測と合否 ───────────────────────────────────────
  t('C-1 旧HTML（hb.afl 無し・検索URLのみ）は期待5に対し FAIL', () => {
    const local = parseLocal(buildMdx({ rakuten: 5 }));
    const links = countAffiliateLinks(buildHtml({ hbButtons: 0, searchButtons: 5 }));
    eq(links.rakutenHb, 0, 'hb.afl'); eq(links.rakutenSearch, 5, '検索URL');
    eq(judgeRakuten(local, links), false, '合否');
    const reasons = pendingReasons(buildHtml({ hbButtons: 0, searchButtons: 5 }), local);
    eq(reasons.some((r) => r.includes('楽天リンク')), true, '反映待ち理由');
  });
  t('C-2 新HTML（hb.afl ボタン5・比較表5・JSON-LD/__NEXT_DATA__ 込み）は期待5で PASS', () => {
    const local = parseLocal(buildMdx({ rakuten: 5 }));
    const html = buildHtml({ hbButtons: 5, tableLinks: 5 });
    const links = countAffiliateLinks(html);
    eq(links.rakutenHb, 5, 'ボタン'); eq(links.rakutenTableHb, 5, '比較表'); eq(links.rakutenHbAll, 20, '全出現(3×5+5)');
    eq(judgeRakuten(local, links), true, '合否'); eq(pendingReasons(html, local).length, 0, '反映待ちなし');
  });
  t('C-3 旧規則の穴の再現: 旧HTML=楽天3枚（hb.afl 全出現9≧期待4）→ 新規則では FAIL', () => {
    const local = parseLocal(buildMdx({ rakuten: 4, amazonLegacy: 1 }));
    const links = countAffiliateLinks(buildHtml({ hbButtons: 3, searchButtons: 2 }));
    eq(links.rakutenHbAll >= local.rakutenExpected, true, '旧規則なら PASS していた');
    eq(links.rakutenHb, 3); eq(judgeRakuten(local, links), false, '新規則は FAIL');
  });
  t('C-4 検索URLは楽天リンクに加算されない（rakuten4+検索1 の記事＝期待4・実4 で PASS）', () => {
    const local = parseLocal(buildMdx({ rakuten: 4, amazonLegacy: 1 }));
    const links = countAffiliateLinks(buildHtml({ hbButtons: 4, searchButtons: 1 }));
    eq(links.rakutenHb, 4); eq(links.rakutenSearch, 1); eq(judgeRakuten(local, links), true);
  });
  t('C-5 期待0（全 source="amazon"）は実測0で PASS（検索URL5は無視）', () => {
    const local = parseLocal(buildMdx({ amazonLegacy: 5 }));
    const links = countAffiliateLinks(buildHtml({ hbButtons: 0, searchButtons: 5 }));
    eq(links.rakutenHb, 0); eq(links.rakutenSearch, 5); eq(judgeRakuten(local, links), true);
  });
  t('C-6 実測が期待より多い（旧HTMLに旧楽天カードが残る）も不一致＝FAIL', () => {
    const local = parseLocal(buildMdx({ rakuten: 4, amazonLegacy: 1 }));
    const links = countAffiliateLinks(buildHtml({ hbButtons: 5 }));
    eq(judgeRakuten(local, links), false);
  });
  t('C-7 属性順が違う <a> でも楽天ボタンを拾う', () => {
    const html = '<a class="ProductCard-module__X__btn ProductCard-module__X__rakuten" href="https://hb.afl.rakuten.co.jp/hgc/a/?pc=x">R</a>';
    eq(countAffiliateLinks(html).rakutenHb, 1);
  });
  t('C-8 Amazon 側の既存チェックは不変（dp?tag= 数・空タグ検出）', () => {
    const links = countAffiliateLinks(buildHtml({ hbButtons: 4, searchButtons: 1, amazonTag: 1, emptyTag: 1 }));
    eq(links.amazonTag, 6, 'dp?tag= 数(5+空タグ1)'); eq(links.amazonEmptyTag, 1, '空タグ'); eq(links.amazonPlaceholderTag, 0);
    const local = parseLocal(buildMdx({ rakuten: 4, amazonLegacy: 1 }));
    eq(local.amazonHints, 6, 'amazonHints(amazonAsin×5 + source="amazon"×1)');
  });
  t('C-9 og:image / title の反映待ち判定は従来どおり', () => {
    const local = parseLocal(buildMdx({ rakuten: 1 }));
    eq(pendingReasons(buildHtml({ hbButtons: 1, og: '/images/outdoor-03.png' }), local).some((r) => r.includes('og:image')), true);
    eq(pendingReasons(buildHtml({ hbButtons: 1, title: '旧タイトル' }), local).some((r) => r.includes('旧タイトル')), true);
  });

  // ── §B: x-vercel-cache / age による反映待ち ─────────────────────────────
  const NOW = 1_800_000_000;
  t('B-1 HIT かつ age がデプロイ後経過より大きい → 反映待ち（stale）', () => {
    const c = judgeCache({ cache: 'HIT', age: '3600' }, NOW - 120, NOW);
    eq(c.stale, true); eq(c.cache, 'HIT'); eq(c.age, 3600);
  });
  t('B-2 PRERENDER / age=0 → fresh', () => {
    eq(judgeCache({ cache: 'PRERENDER', age: '0' }, NOW - 120, NOW).stale, false);
  });
  t('B-3 HIT でも age がデプロイ後経過以内 → fresh（新デプロイの成果物がキャッシュされたもの）', () => {
    eq(judgeCache({ cache: 'HIT', age: '30' }, NOW - 120, NOW).stale, false);
  });
  t('B-4 MISS / ヘッダ無し → fresh', () => {
    eq(judgeCache({ cache: 'MISS', age: null }, NOW - 120, NOW).stale, false);
    eq(judgeCache({ cache: null, age: null }, NOW - 120, NOW).stale, false);
  });
  t('B-5 STALE も HIT と同じ扱い／小文字も許容', () => {
    eq(judgeCache({ cache: 'stale', age: '999' }, NOW - 10, NOW).stale, true);
  });
  t('B-6 デプロイ時刻が不明なら stale 扱いにしない（理由に明記）', () => {
    const c = judgeCache({ cache: 'HIT', age: '99999' }, null, NOW);
    eq(c.stale, false); eq(c.reason.includes('不明'), true);
  });
  t('B-7 fetchWithRetry: 旧キャッシュ→新 の順で返る本番は 1 回待って PASS（?cb= 付与も確認）', async () => {
    const local = parseLocal(buildMdx({ rakuten: 5 }));
    const seq = [
      fakeResponse({ html: buildHtml({ hbButtons: 5 }), cache: 'HIT', age: '5000' }),
      fakeResponse({ html: buildHtml({ hbButtons: 5 }), cache: 'PRERENDER', age: '0' }),
    ];
    const urls = [];
    const waits = [];
    const r = await fetchWithRetry('https://example.test/posts/x', local, {
      deployedAt: NOW - 60, now: () => NOW, log: () => {},
      fetchImpl: async (u) => { urls.push(u); return seq.shift(); },
      sleepImpl: async (ms) => { waits.push(ms); },
    });
    eq(r.status, 200); eq(r.staleTimeout, undefined); eq(r.fetches, 2); eq(waits.join(','), String(STALE_WAIT_MS));
    eq(urls[0], `https://example.test/posts/x?cb=${NOW}`, '?cb=');
  });
  t('B-8 fetchWithRetry: 旧キャッシュが続く → 上限（6回×30秒）で staleTimeout（無限ループしない）', async () => {
    const local = parseLocal(buildMdx({ rakuten: 5 }));
    let n = 0; const waits = [];
    const r = await fetchWithRetry('https://example.test/posts/x', local, {
      deployedAt: NOW - 60, now: () => NOW, log: () => {},
      fetchImpl: async () => { n++; return fakeResponse({ html: buildHtml({ hbButtons: 5 }), cache: 'HIT', age: '5000' }); },
      sleepImpl: async (ms) => { waits.push(ms); },
    });
    eq(r.staleTimeout, true); eq(n, STALE_RETRY + 1, '取得回数'); eq(waits.length, STALE_RETRY, '待機回数');
    eq(waits.reduce((a, b) => a + b, 0), STALE_RETRY * STALE_WAIT_MS, '合計待機=180秒');
  });
  t('B-9 fetchWithRetry: 内容不一致（旧HTML・fresh ヘッダ）は内容ベースで再試行し、新HTMLで PASS', async () => {
    const local = parseLocal(buildMdx({ rakuten: 5 }));
    const seq = [
      fakeResponse({ html: buildHtml({ hbButtons: 0, searchButtons: 5 }), cache: 'MISS', age: '0' }),
      fakeResponse({ html: buildHtml({ hbButtons: 5 }), cache: 'PRERENDER', age: '0' }),
    ];
    const waits = [];
    const r = await fetchWithRetry('https://example.test/posts/x', local, {
      deployedAt: NOW - 60, now: () => NOW, log: () => {},
      fetchImpl: async () => seq.shift(), sleepImpl: async (ms) => { waits.push(ms); },
    });
    eq(r.fetches, 2); eq(waits.join(','), String(RETRY_WAIT_MS)); eq(r.reasons.length, 0);
  });
  t('B-10 fetchWithRetry: 旧HTMLが続く → 内容ベース上限（20回）で最後の応答を返し、合否は FAIL になる', async () => {
    const local = parseLocal(buildMdx({ rakuten: 5 }));
    let n = 0;
    const r = await fetchWithRetry('https://example.test/posts/x', local, {
      deployedAt: NOW - 60, now: () => NOW, log: () => {},
      fetchImpl: async () => { n++; return fakeResponse({ html: buildHtml({ hbButtons: 0, searchButtons: 5 }), cache: 'MISS', age: '0' }); },
      sleepImpl: async () => {},
    });
    eq(n, RETRY); eq(r.status, 200); eq(judgeRakuten(local, countAffiliateLinks(r.html)), false);
  });

  // ── §D（campkit-20260921-45）: Amazon はボタン枚数＝カード単位の期待数（一致） ───────
  const ASIN = (i) => `B0ASIN0000${i}`;
  const SHORT = (i) => `https://amzn.to/4fAr7P${i}`;
  // 旧規則（44 以前）の合否をそのまま再現する関数。テストの中で「旧規則なら PASS していた」ことを示すために使う。
  const oldRule = (local, links) => local.amazonHints === 0 || links.amazonTag + links.amznTo >= local.amazonHints;

  t('D-1 旧規則の穴の再現(JSON-LD): 旧HTMLはボタン4枚だが legacy カードの JSON-LD dp?tag= で全出現5≧属性5 → 旧PASS・新FAIL', () => {
    // mdx: rakuten+amazonAsin ×4 ＋ 旧形式 legacy（source="amazon"・affiliateUrl=ASIN・amazonAsin なし）×1 → 属性出現5・ボタン期待5
    const mdx = buildMdxCards([
      { amazonAsin: ASIN(1) }, { amazonAsin: ASIN(2) }, { amazonAsin: ASIN(3) }, { amazonAsin: ASIN(4) },
      { source: 'amazon', affiliateUrl: ASIN(5) },
    ]);
    const local = parseLocal(mdx);
    eq(local.amazonHints, 5, '旧期待値(属性出現)'); eq(local.amazonExpected, 5, '新期待値(ボタン)');
    // 旧HTML: 4枚目にまだ amazonAsin が付いていない（今回のデプロイで足した）＝ボタンは 3＋legacy 1 の 4 枚。
    // legacy カードは JSON-LD offers.url にも dp?tag= が出るので全出現は 5。
    const html = buildHtmlCards([
      { amazonHref: FX_DP(ASIN(1)), nextData: { amazonAsin: ASIN(1) } },
      { amazonHref: FX_DP(ASIN(2)), nextData: { amazonAsin: ASIN(2) } },
      { amazonHref: FX_DP(ASIN(3)), nextData: { amazonAsin: ASIN(3) } },
      { amazonHref: null },
      { amazonHref: FX_DP(ASIN(5)), source: 'amazon', rakutenHref: 'https://search.rakuten.co.jp/search/mall/x/?rafcid=wsc_i_is_1', nextData: { affiliateUrl: ASIN(5) } },
    ]);
    const links = countAffiliateLinks(html);
    eq(links.amazonTag, 5, 'dp?tag= 全出現(ボタン4＋JSON-LD1)'); eq(links.amazonButtons, 4, 'ボタン');
    eq(oldRule(local, links), true, '旧規則なら PASS していた');
    eq(judgeAmazon(local, links), false, '新規則は FAIL');
    eq(pendingReasons(html, local).some((r) => r.includes('Amazonリンク(ボタン)が4本で期待5本')), true, '反映待ち理由');
  });
  t('D-2 旧規則の穴の再現(__NEXT_DATA__): 旧HTMLはボタン3枚だが amzn.to が __NEXT_DATA__ にも出て全出現6≧属性5 → 旧PASS・新FAIL', () => {
    // mdx: amazonUrl ×3 ＋ amazonAsin ×2 → 属性出現5・ボタン期待5
    const mdx = buildMdxCards([
      { amazonUrl: SHORT(1) }, { amazonUrl: SHORT(2) }, { amazonUrl: SHORT(3) }, { amazonAsin: ASIN(4) }, { amazonAsin: ASIN(5) },
    ]);
    const local = parseLocal(mdx);
    eq(local.amazonHints, 5); eq(local.amazonExpected, 5);
    // 旧HTML: amazonAsin の 2 枚はまだ無い。amzn.to はボタン3＋__NEXT_DATA__3＝6。
    const html = buildHtmlCards([
      { amazonHref: SHORT(1), nextData: { amazonUrl: SHORT(1) } },
      { amazonHref: SHORT(2), nextData: { amazonUrl: SHORT(2) } },
      { amazonHref: SHORT(3), nextData: { amazonUrl: SHORT(3) } },
      { amazonHref: null }, { amazonHref: null },
    ]);
    const links = countAffiliateLinks(html);
    eq(links.amznTo, 6, 'amzn.to 全出現'); eq(links.amazonButtons, 3); eq(links.amazonButtonShort, 3);
    eq(oldRule(local, links), true, '旧規則なら PASS していた'); eq(judgeAmazon(local, links), false, '新規則は FAIL');
  });
  t('D-3 ボタンが期待より多い（旧HTMLに旧 Amazon ボタンが残る）も不一致＝FAIL', () => {
    // mdx: 4枚に amazonAsin・1枚は Amazon なし → 期待4。旧HTML は 5 枚全部にボタン（今回のデプロイで 5 枚目の amazonAsin を除去した）
    const local = parseLocal(buildMdxCards([{ amazonAsin: ASIN(1) }, { amazonAsin: ASIN(2) }, { amazonAsin: ASIN(3) }, { amazonAsin: ASIN(4) }, {}]));
    eq(local.amazonExpected, 4);
    const links = countAffiliateLinks(buildHtmlCards([1, 2, 3, 4, 5].map((i) => ({ amazonHref: FX_DP(ASIN(i)), nextData: { amazonAsin: ASIN(i) } }))));
    eq(links.amazonButtons, 5); eq(judgeAmazon(local, links), false);
  });
  t('D-4 JSON-LD／__NEXT_DATA__／比較表の dp?tag= はボタンに数えない（ボタン5・全出現15 でも 期待5 で PASS）', () => {
    // mdx: source="amazon"＋amazonAsin ×5（現行形式の Amazon 源記事）→ 期待5。
    // HTML: 5 カードとも JSON-LD offers.url が dp?tag=、比較表にも Amazon dp リンク 5 本 → dp?tag= 全出現 15。
    const local = parseLocal(buildMdxCards([1, 2, 3, 4, 5].map((i) => ({ source: 'amazon', affiliateUrl: ASIN(i), amazonAsin: ASIN(i) }))));
    eq(local.amazonExpected, 5); eq(local.amazonHints, 10, '旧期待値は 2×5');
    const html = buildHtmlCards(
      [1, 2, 3, 4, 5].map((i) => ({ amazonHref: FX_DP(ASIN(i)), source: 'amazon', rakutenHref: `https://search.rakuten.co.jp/search/mall/x${i}/?rafcid=wsc_i_is_1`, nextData: { affiliateUrl: ASIN(i), amazonAsin: ASIN(i) } })),
      { tableAmazonLinks: 5 }
    );
    const links = countAffiliateLinks(html);
    eq(links.amazonTag, 15, 'dp?tag= 全出現(ボタン5＋JSON-LD5＋比較表5)'); eq(links.amazonButtons, 5); eq(links.amazonButtonDp, 5);
    eq(judgeAmazon(local, links), true); eq(judgeRakuten(local, links), true, '楽天は期待0・実0');
    eq(pendingReasons(html, local).length, 0, '反映待ちなし');
  });
  t('D-5 期待0（Amazon リンクを持つカードが無い）は実測0で PASS', () => {
    const local = parseLocal(buildMdxCards([{}, {}, {}, {}, {}]));
    eq(local.amazonExpected, 0); eq(local.amazonHints, 0);
    const links = countAffiliateLinks(buildHtmlCards([{}, {}, {}, {}, {}], { tableRakutenLinks: 5 }));
    eq(links.amazonButtons, 0); eq(links.amazonTag, 0); eq(judgeAmazon(local, links), true); eq(judgeRakuten(local, links), true);
  });
  t('D-6 amazonUrl 優先: amazonUrl と amazonAsin を両方持つカードでもボタンは 1 つ＝期待1（旧期待値は 2 で食い違う）', () => {
    const local = parseLocal(buildMdxCards([{ amazonUrl: SHORT(1), amazonAsin: ASIN(1) }]));
    eq(local.amazonExpected, 1); eq(local.amazonHints, 2, '旧期待値は属性2つで 2');
    // 実HTML: ボタン href は amazonUrl（amzn.to）。__NEXT_DATA__ には両属性が入る（amzn.to は 2 回出るが ASIN は dp URL にならない）
    const html = buildHtmlCards([{ amazonHref: SHORT(1), nextData: { amazonUrl: SHORT(1), amazonAsin: ASIN(1) } }]);
    const links = countAffiliateLinks(html);
    eq(links.amazonButtons, 1); eq(links.amazonButtonShort, 1); eq(links.amazonButtonDp, 0); eq(links.amznTo, 2); eq(links.amazonTag, 0);
    eq(judgeAmazon(local, links), true);
    eq(oldRule(local, links), true, '旧規則も偶然 PASS（amzn.to の重複出現 2≧2）だったが理由が違う');
  });
  t('D-7 source="amazon" で affiliateUrl を ASIN とみなすカードは期待1／affiliateUrl="#" や amazonUrl="" は 0', () => {
    eq(parseLocal(buildMdxCards([{ source: 'amazon', affiliateUrl: ASIN(1) }])).amazonExpected, 1, 'legacy 形式=ボタンあり');
    eq(parseLocal(buildMdxCards([{ source: 'amazon', affiliateUrl: '#' }])).amazonExpected, 0, 'source="amazon"+"#"=ボタンなし');
    eq(parseLocal(buildMdxCards([{ source: 'rakuten', affiliateUrl: ASIN(1) }])).amazonExpected, 0, 'source="rakuten" では affiliateUrl を ASIN とみなさない');
    eq(parseLocal(buildMdxCards([{ amazonUrl: '' }])).amazonExpected, 0, 'amazonUrl="" は falsy=ボタンなし');
    eq(parseLocal(buildMdxCards([{ amazonAsin: '' }])).amazonExpected, 0, 'amazonAsin="" は falsy=ボタンなし');
    eq(parseLocal(buildMdxCards([{ amazonUrl: '', amazonAsin: ASIN(1) }])).amazonExpected, 1, 'amazonUrl="" なら amazonAsin に落ちる');
    // 旧期待値は source="amazon"+"#" でも 1 と数えていた（ボタンが出ないのに期待に入る＝旧規則の別の穴）
    eq(parseLocal(buildMdxCards([{ source: 'amazon', affiliateUrl: '#' }])).amazonHints, 1);
  });
  t('D-8 属性順が違う <a> でも Amazon ボタンを拾う／dp・amzn.to 以外の href は「その他」に分類（合計には入る）', () => {
    const html =
      '<a class="ProductCard-module__X__btn ProductCard-module__X__amazon" href="https://amzn.to/abc123">A</a>' +
      '<a class="ProductCard-module__X__btn ProductCard-module__X__amazon" href="https://www.amazon.co.jp/dp/B0ASIN00001?tag=campkit26-22">A</a>' +
      '<a class="ProductCard-module__X__btn ProductCard-module__X__amazon" href="https://www.amazon.co.jp/s?k=x&tag=campkit26-22">A</a>';
    const links = countAffiliateLinks(html);
    eq(links.amazonButtonShort, 1); eq(links.amazonButtonDp, 1); eq(links.amazonButtonOther, 1); eq(links.amazonButtons, 3);
  });
  t('D-9 fetchWithRetry: Amazon ボタンだけが足りない旧HTML（title・楽天・og は一致）を反映待ちとして再取得し、新HTMLで PASS', async () => {
    const local = parseLocal(buildMdxCards([{ amazonAsin: ASIN(1) }, { amazonAsin: ASIN(2) }, {}, {}, {}]));
    eq(local.amazonExpected, 2);
    const oldHtml = buildHtmlCards([{ amazonHref: FX_DP(ASIN(1)), nextData: { amazonAsin: ASIN(1) } }, {}, {}, {}, {}]);
    const newHtml = buildHtmlCards([{ amazonHref: FX_DP(ASIN(1)), nextData: { amazonAsin: ASIN(1) } }, { amazonHref: FX_DP(ASIN(2)), nextData: { amazonAsin: ASIN(2) } }, {}, {}, {}]);
    // 旧規則では期待2→全出現1 で「未達」も検出できていたが、D-1/D-2 型（重複出現で満たす）は検出できなかった。新規則は不一致で反映待ち。
    eq(pendingReasons(oldHtml, local).length, 1); eq(pendingReasons(oldHtml, local)[0].includes('Amazonリンク(ボタン)'), true);
    eq(pendingReasons(newHtml, local).length, 0);
    const seq = [fakeResponse({ html: oldHtml, cache: 'MISS' }), fakeResponse({ html: newHtml, cache: 'PRERENDER' })];
    const waits = [];
    const r = await fetchWithRetry('https://example.test/posts/x', local, {
      deployedAt: NOW - 60, now: () => NOW, log: () => {}, fetchImpl: async () => seq.shift(), sleepImpl: async (ms) => { waits.push(ms); },
    });
    eq(r.fetches, 2); eq(waits.join(','), String(RETRY_WAIT_MS)); eq(judgeAmazon(local, countAffiliateLinks(r.html)), true);
  });
  t('D-10 既存の楽天判定・キャッシュ判定はカード単位フィクスチャでも不変（rakuten 期待5・実5／HIT+古い age は stale）', () => {
    const local = parseLocal(buildMdxCards([{ amazonAsin: ASIN(1) }, {}, {}, {}, {}]));
    const links = countAffiliateLinks(buildHtmlCards([{ amazonHref: FX_DP(ASIN(1)) }, {}, {}, {}, {}], { tableRakutenLinks: 5 }));
    eq(local.rakutenExpected, 5); eq(links.rakutenHb, 5); eq(links.rakutenTableHb, 5); eq(links.rakutenHbAll, 20); eq(judgeRakuten(local, links), true);
    eq(judgeCache({ cache: 'HIT', age: '3600' }, NOW - 120, NOW).stale, true);
  });

  let pass = 0;
  let fail = 0;
  for (const c of cases) {
    try {
      await c.fn();
      pass++;
      console.log(`  PASS  ${c.name}`);
    } catch (e) {
      fail++;
      console.log(`  FAIL  ${c.name}\n        ${e.message}`);
    }
  }
  console.log(`\n--test 結果: PASS ${pass} / FAIL ${fail} / 全${cases.length}件`);
  process.exit(fail ? 1 : 0);
}

// ── エントリポイント ──────────────────────────────────────────────────────
if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);
    if (args.includes('--test')) {
      await runTests();
      return;
    }
    let deployedAt = null;
    const slugs = [];
    for (const a of args) {
      const m = a.match(/^--deployed-at=(\d+)$/);
      if (m) deployedAt = Number(m[1]);
      else if (!a.startsWith('--')) slugs.push(a);
    }
    if (deployedAt == null) deployedAt = detectDeployedAt();
    console.log(
      `反映待ち判定の基準時刻: ${deployedAt ? new Date(deployedAt * 1000).toISOString() : '(不明・x-vercel-cache/age 判定は無効)'}` +
        `${args.some((a) => a.startsWith('--deployed-at=')) ? '（deploy.cjs から受領）' : '（HEAD のコミット時刻で代用）'}`
    );

    let targets = slugs;
    if (targets.length === 0) {
      targets = detectChangedSlugs();
      if (targets.length === 0) {
        console.log('検証対象の記事が見つかりません。slug を引数で指定してください。');
        console.log('例: node scripts/verify-deploy.cjs snowpeak-tent');
        process.exit(0);
      }
      console.log(`直近コミットの変更記事を検証します: ${targets.join(', ')}`);
    }

    const summary = [];
    for (const slug of targets) {
      summary.push([slug, await verify(slug, deployedAt)]);
    }

    console.log('\n===== 結果 =====');
    for (const [slug, ok] of summary) {
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${slug}`);
    }

    const failed = summary.filter(([, ok]) => !ok);
    if (failed.length > 0) {
      console.log(`\n${failed.length}件 FAIL。Vercelのデプロイ完了を待って再実行するか、内容を確認してください。`);
      process.exit(1);
    }
    console.log('\nすべて PASS。デプロイ検証完了。');
  })();
}

module.exports = { parseLocal, countAffiliateLinks, judgeRakuten, judgeAmazon, pendingReasons, judgeCache, fetchWithRetry, extractOgImage };
