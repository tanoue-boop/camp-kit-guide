import "../styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "../components/layout/Layout";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { pageview, GA_TRACKING_ID } from "../lib/gtag";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    if (!GA_TRACKING_ID) return;
    const handleRouteChange = (url: string) => pageview(url);
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
