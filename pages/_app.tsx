import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import Layout from "../components/layout/Layout";
import AffiliateClickTracker from "../components/AffiliateClickTracker";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { pageview, GA_TRACKING_ID } from "../lib/gtag";
import localFont from "next/font/local";

// フォントはリポジトリ内の woff2 を使う（ビルド時に Google Fonts へ取りに行かない）。
// Google Fonts の取得失敗で Vercel ビルドごと落ちたため置き換えた（campkit-20261105-F01）。
const notoSansJp = localFont({
  src: [
    { path: "../styles/fonts/noto-sans-jp-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../styles/fonts/noto-sans-jp-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../styles/fonts/noto-sans-jp-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../styles/fonts/noto-sans-jp-latin-800-normal.woff2", weight: "800", style: "normal" },
    { path: "../styles/fonts/noto-sans-jp-latin-900-normal.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

const jost = localFont({
  src: [
    { path: "../styles/fonts/jost-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../styles/fonts/jost-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../styles/fonts/jost-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-jost",
  display: "swap",
});

const BASE_URL = "https://www.camp-kit-guide.com";

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CampKit Guide",
  url: BASE_URL,
};

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "株式会社mjo-style",
  url: BASE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${BASE_URL}/logo.png`,
  },
};

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    if (!GA_TRACKING_ID) return;
    const handleRouteChange = (url: string) => pageview(url);
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          key="ld-website"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }}
        />
        <script
          type="application/ld+json"
          key="ld-organization"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }}
        />
      </Head>
      <div className={`${notoSansJp.variable} ${jost.variable}`}>
        {/* GA4 送客クリック計測（affiliate_click）。Pages Router なので app/layout.tsx ではなく _app に1回だけ配置 */}
        <AffiliateClickTracker />
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </div>
    </>
  );
}
