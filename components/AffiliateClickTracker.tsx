"use client";

// GA4 送客クリック計測（affiliate_click イベント）
//
// 記事MDX・ProductCard を個別に書き換えず、document レベルのクリック委譲で
// 楽天／Amazon／A8 へ向かう <a> を捕捉して gtag('event','affiliate_click', …) を送る。
// pages/_app.tsx に1回だけ配置する。gtag 未ロード（GA無効・ckbot=1 等）でも
// エラーにはしない。

import { useEffect } from "react";

type Platform = "rakuten" | "amazon" | "a8";

const PLATFORM_HOST_PATTERNS: Array<{ platform: Platform; re: RegExp }> = [
  // 楽天: hb.afl.rakuten.co.jp / item.rakuten.co.jp / search.rakuten.co.jp など rakuten.co.jp 全般
  { platform: "rakuten", re: /(^|\.)rakuten\.co\.jp$/i },
  // Amazon: amazon.co.jp / amzn.to
  { platform: "amazon", re: /(^|\.)amazon\.co\.jp$|^amzn\.to$/i },
  // A8.net: px.a8.net（CalloutCta のサービス系案件 hinataレンタル／hinataストア 等）
  { platform: "a8", re: /^px\.a8\.net$/i },
];

const LINK_URL_MAX = 200;
const PRODUCT_NAME_MAX = 100;

function detectPlatform(href: string): Platform | null {
  let host = "";
  try {
    host = new URL(href, window.location.href).hostname;
  } catch {
    return null;
  }
  for (const { platform, re } of PLATFORM_HOST_PATTERNS) {
    if (re.test(host)) return platform;
  }
  return null;
}

function isAffiliateAnchor(a: HTMLAnchorElement): boolean {
  return detectPlatform(a.href) !== null;
}

// /posts/<slug>/ から slug を抽出。取れなければ pathname をそのまま返す。
function extractArticleSlug(pathname: string): string {
  const m = pathname.match(/^\/posts\/([^/]+)\/?$/);
  return m ? m[1] : pathname;
}

function cleanText(text: string | null | undefined): string | undefined {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (!t) return undefined;
  return t.length > PRODUCT_NAME_MAX ? t.slice(0, PRODUCT_NAME_MAX) : t;
}

// 祖先要素から商品名を拾う。
//  1. ProductCard / CalloutCta: 親要素の data-product-name 属性
//     （ProductCard.tsx は商品名、CalloutCta.tsx はボタン文言 linkText を付与）
//  2. ProductCard(フォールバック): CSS Modules のクラス名 ProductCard_card / ProductCard_name
//  3. ComparisonTable: 同じ行(tr)の第1セル（商品名列）
function extractProductName(a: HTMLAnchorElement): string | undefined {
  const withAttr = a.closest<HTMLElement>("[data-product-name]");
  if (withAttr) {
    const v = cleanText(withAttr.dataset.productName);
    if (v) return v;
  }
  const card = a.closest<HTMLElement>('[class*="ProductCard_card"]');
  if (card) {
    const nameEl = card.querySelector<HTMLElement>('[class*="ProductCard_name"]');
    const v = cleanText(nameEl?.textContent);
    if (v) return v;
  }
  const row = a.closest<HTMLTableRowElement>("tr");
  if (row) {
    const firstCell = row.querySelector<HTMLElement>("th, td");
    const v = cleanText(firstCell?.textContent);
    if (v) return v;
  }
  return undefined;
}

// ページ内のアフィリエイトリンク（DOM順）の中で何番目か（0始まり）
// ※ A8 リンクも母集団に含む（CalloutCta を持つ記事では楽天/Amazon の位置番号がずれる）
function linkPosition(a: HTMLAnchorElement): number {
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]")).filter(isAffiliateAnchor);
  return anchors.indexOf(a);
}

export default function AffiliateClickTracker() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      try {
        const target = e.target as Element | null;
        const a = target?.closest?.("a[href]") as HTMLAnchorElement | null;
        if (!a) return;

        const href = a.href;
        const platform = detectPlatform(href);
        if (!platform) return;

        const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
        if (typeof gtag !== "function") return;

        const params: Record<string, string | number> = {
          platform,
          article_slug: extractArticleSlug(window.location.pathname),
          link_url: href.length > LINK_URL_MAX ? href.slice(0, LINK_URL_MAX) : href,
          link_position: linkPosition(a),
          transport_type: "beacon",
        };
        const productName = extractProductName(a);
        if (productName) params.product_name = productName;

        gtag("event", "affiliate_click", params);
      } catch {
        // 計測はページ遷移を妨げない（握りつぶす）
      }
    };

    // 中クリック（新規タブ）は click ではなく auxclick で来るので両方を捕捉する
    const auxHandler = (e: MouseEvent) => {
      if (e.button === 1) handler(e);
    };
    document.addEventListener("click", handler, { capture: true });
    document.addEventListener("auxclick", auxHandler, { capture: true });
    return () => {
      document.removeEventListener("click", handler, { capture: true });
      document.removeEventListener("auxclick", auxHandler, { capture: true });
    };
  }, []);

  return null;
}
