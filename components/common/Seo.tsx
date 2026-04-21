import Head from "next/head";

type SeoProps = {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
};

const SITE_NAME = "CampKit Guide";
const BASE_URL = "https://camp-kit-guide.com";

export default function Seo({ title, description, canonical, ogImage }: SeoProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={SITE_NAME} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  );
}
