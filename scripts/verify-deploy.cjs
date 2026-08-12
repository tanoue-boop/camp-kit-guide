#!/usr/bin/env node
/**
 * デプロイ後の本番検証スクリプト
 *
 * 使い方:
 *   node scripts/verify-deploy.cjs                      # 直近コミットで変更された記事を自動検出
 *   node scripts/verify-deploy.cjs snowpeak-tent ...    # slug を明示指定
 *
 * 各記事について次を検証し、PASS/FAIL を出力する。
 *   1. 本番URLが 200 を返す
 *   2. <title> がローカル frontmatter の title と一致
 *   3. アフィリリンク数がローカルの ProductCardMdx 数以上
 *      （楽天 rafcid付き / Amazon dp?tag= / amzn.to を合算）
 *   4. PR表記（景表法対応）が本文に含まれる
 *   5. og:image がサムネイル規約（/images/outdoor-0X.png）に一致し、
 *      その画像URLが実際に 200 を返す
 *
 * 1件でも FAIL があれば exit code 1 で終了する。
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE = 'https://www.camp-kit-guide.com';
const POSTS_DIR = path.join(__dirname, '..', 'content', 'posts');
const PR_TEXT = 'アフィリエイト広告';
const RETRY = 20;
const RETRY_WAIT_MS = 15000;
// サムネイル規約: /images/outdoor-01.png 〜 outdoor-09.png のみ許可
const THUMB_RE = /\/images\/outdoor-0[1-9]\.png/;

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

function readLocal(slug) {
  const file = path.join(POSTS_DIR, slug + '.mdx');
  if (!fs.existsSync(file)) return null;
  const src = fs.readFileSync(file, 'utf8');
  const titleMatch = src.match(/^title:\s*"([\s\S]*?)"\s*$/m);
  const cardCount = (src.match(/<ProductCardMdx/g) || []).length;
  // Amazonボタンが出るはずのカードの目安（amazonAsin / amazonUrl / source="amazon"）
  const amazonHints = (src.match(/amazonAsin="|amazonUrl="|source="amazon"/g) || []).length;
  return { title: titleMatch ? titleMatch[1] : null, cardCount, amazonHints };
}

async function fetchWithRetry(url, expectedTitle = null) {
  let last = null;
  for (let i = 0; i < RETRY; i++) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (res.status === 200) {
        const html = await res.text();
        // 既存記事のリライトは反映前でも200(旧HTML)を返すため、200だけでは反映完了と判断できない。
        // expectedTitle が指定されていれば、本番の<title>に期待タイトルが含まれるまで
        // 「反映待ち」とみなして再試行する（新規記事の404リトライと同じ猶予をリライトにも与える）。
        if (expectedTitle) {
          const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          const liveTitle = m ? m[1].trim() : '';
          if (!liveTitle.includes(expectedTitle)) {
            last = { status: 200, html };
            if (i < RETRY - 1) {
              console.log(
                `   …本番がまだ旧タイトルを返しています（Vercel反映待ち）。${RETRY_WAIT_MS / 1000}秒待って再試行 (${i + 2}/${RETRY})`
              );
              await sleep(RETRY_WAIT_MS);
            }
            continue;
          }
        }
        return { status: 200, html };
      }
      last = { status: res.status, html: '' };
    } catch (e) {
      last = { status: 0, html: '', error: e.message };
    }
    if (i < RETRY - 1) {
      console.log(`   …未反映のようです。${RETRY_WAIT_MS / 1000}秒待って再試行 (${i + 2}/${RETRY})`);
      await sleep(RETRY_WAIT_MS);
    }
  }
  return last;
}

function extractOgImage(html) {
  // property/name どちらの並びでも拾う
  const m =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  return m ? m[1] : '';
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

function countAffiliateLinks(html) {
  // 楽天アフィリリンクは2形態ある。両方を有効としてカウントする。
  //  (1) hb.afl ラッパー形式: hb.afl.rakuten.co.jp/hgc/<affiliateId>/?pc=... （現行規約 / scheduled-task-spec.md）
  //  (2) 直リンク rafcid付き: item.rakuten.co.jp/.../?rafcid=...            （旧アフィリツール生成分）
  // ※(1)はpc=内のitem.rakuten.co.jpが%2Fエンコードされ、rafcidも無いため(2)の正規表現には当たらない＝二重計上なし
  const rakutenHb = (html.match(/hb\.afl\.rakuten\.co\.jp\/hgc\//g) || []).length;
  const rakutenDirect = (html.match(/item\.rakuten\.co\.jp\/[^"']*rafcid=/g) || []).length;
  const rakuten = rakutenHb + rakutenDirect;
  const amazonTag = (html.match(/amazon\.co\.jp\/dp\/[A-Z0-9]+\?tag=/g) || []).length;
  const amznTo = (html.match(/amzn\.to\/[A-Za-z0-9]+/g) || []).length;
  // 不正タグ検出: tag= の直後が引用符/&/空白/) = 空タグ。既知プレースホルダも検出。
  const amazonEmptyTag = (html.match(/amazon\.co\.jp\/dp\/[A-Z0-9]+\?tag=["'&\s)]/g) || []).length;
  const amazonPlaceholderTag = (html.match(/tag=your-associate-tag-22\b/g) || []).length;
  return { rakuten, amazonTag, amznTo, amazonEmptyTag, amazonPlaceholderTag, total: rakuten + amazonTag + amznTo };
}

async function verify(slug) {
  const results = [];
  const local = readLocal(slug);
  console.log(`\n■ ${slug}`);

  if (!local) {
    console.log('  FAIL  ローカルに content/posts/' + slug + '.mdx が見つかりません');
    return false;
  }

  const url = `${BASE}/posts/${slug}`;
  const res = await fetchWithRetry(url, local.title);

  // 1. HTTP 200
  const ok200 = res.status === 200;
  results.push(ok200);
  console.log(`  ${ok200 ? 'PASS' : 'FAIL'}  HTTP ${res.status || 'ERR'}  ${url}`);
  if (!ok200) return false;

  const html = res.html;

  // 2. title 一致
  // Next.js は <title data-next-head=""> のように属性を付けて出力するため属性を許容する
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const liveTitle = titleMatch ? titleMatch[1].trim() : '';
  const titleOk = Boolean(local.title) && liveTitle.includes(local.title);
  results.push(titleOk);
  console.log(`  ${titleOk ? 'PASS' : 'FAIL'}  title  期待:「${local.title}」 実際:「${liveTitle}」`);

  // 3. アフィリリンク数（＋Amazonを持つはずの記事は本番でAmazon検出>0を必須）
  const links = countAffiliateLinks(html);
  const amazonLive = links.amazonTag + links.amznTo;
  const linkOk =
    (local.cardCount === 0 ? true : links.total >= local.cardCount) &&
    (local.amazonHints === 0 || amazonLive > 0);
  results.push(linkOk);
  console.log(
    `  ${linkOk ? 'PASS' : 'FAIL'}  アフィリリンク ${links.total}件` +
      ` (楽天${links.rakuten} / Amazon-tag${links.amazonTag} / amzn.to${links.amznTo})` +
      `  ProductCard ${local.cardCount}件` +
      (local.amazonHints > 0 ? ` / Amazon期待${local.amazonHints}→実${amazonLive}` : '')
  );

  // 3b. Amazonタグ健全性: 空タグ / プレースホルダは成果が計上されないため FAIL
  const tagOk = links.amazonEmptyTag === 0 && links.amazonPlaceholderTag === 0;
  results.push(tagOk);
  console.log(
    `  ${tagOk ? 'PASS' : 'FAIL'}  Amazonタグ健全性` +
      `  空タグ${links.amazonEmptyTag} / プレースホルダ${links.amazonPlaceholderTag}`
  );

  // 4. PR表記
  const prOk = html.includes(PR_TEXT);
  results.push(prOk);
  console.log(`  ${prOk ? 'PASS' : 'FAIL'}  PR表記（景表法対応）`);

  // 5. og:image（サムネイル）検証
  const ogImage = extractOgImage(html);
  const formatOk = THUMB_RE.test(ogImage);
  let imgOk = false;
  if (formatOk) {
    const imgUrl = ogImage.startsWith('http') ? ogImage : `${BASE}${ogImage}`;
    imgOk = await imageReturns200(imgUrl);
  }
  const thumbOk = formatOk && imgOk;
  results.push(thumbOk);
  console.log(
    `  ${thumbOk ? 'PASS' : 'FAIL'}  og:image「${ogImage || '(なし)'}」` +
      `  形式${formatOk ? 'OK' : 'NG(outdoor-0X.png以外)'}` +
      (formatOk ? ` / 画像取得${imgOk ? 'OK(200)' : 'NG'}` : '')
  );

  return results.every(Boolean);
}

(async () => {
  let slugs = process.argv.slice(2);
  if (slugs.length === 0) {
    slugs = detectChangedSlugs();
    if (slugs.length === 0) {
      console.log('検証対象の記事が見つかりません。slug を引数で指定してください。');
      console.log('例: node scripts/verify-deploy.cjs snowpeak-tent');
      process.exit(0);
    }
    console.log(`直近コミットの変更記事を検証します: ${slugs.join(', ')}`);
  }

  const summary = [];
  for (const slug of slugs) {
    summary.push([slug, await verify(slug)]);
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
