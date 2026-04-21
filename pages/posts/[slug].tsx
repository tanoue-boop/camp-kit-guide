import type { GetStaticPaths, GetStaticProps } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Seo from "../../components/common/Seo";
import Breadcrumb from "../../components/common/Breadcrumb";
import ViewCounter from "../../components/article/ViewCounter";
import ProductCard from "../../components/article/ProductCard";
import ComparisonTable from "../../components/article/ComparisonTable";
import type { PostFrontmatter } from "../../types/post";
import styles from "./post.module.css";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

// MDX-friendly wrappers: MDX v3 (used by next-mdx-remote v6) does not reliably
// parse multi-line JSX object literals as props. These wrappers accept flat
// string/number props and a JSON string for arrays instead.
// MDX v3 silently drops JSX expression props ({value} syntax), so all props
// are received as strings from MDX files. Numeric values are coerced here.
function ProductCardMdx({
  rank,
  id,
  name,
  description,
  price,
  rating,
  reviewCount,
  affiliateUrl,
  source,
  badge,
}: {
  rank?: string;
  id?: string;
  name: string;
  description: string;
  price: string;
  rating: string;
  reviewCount: string;
  affiliateUrl: string;
  source: "amazon" | "rakuten" | "other";
  badge?: string;
}) {
  return (
    <ProductCard
      rank={rank ? Number(rank) : undefined}
      product={{
        id: id ?? name,
        name,
        description,
        price: Number(price),
        rating: Number(rating),
        reviewCount: Number(reviewCount),
        affiliateUrl,
        source,
        badge,
      }}
    />
  );
}

function ComparisonTableMdx({ rows, columns }: { rows: string; columns?: string }) {
  try {
    const products = JSON.parse(rows);
    const cols = columns ? JSON.parse(columns) : undefined;
    return <ComparisonTable products={products} columns={cols} />;
  } catch {
    return null;
  }
}

const mdxComponents = {
  ProductCard,
  ComparisonTable,
  ProductCardMdx,
  ComparisonTableMdx,
};

type PostPageProps = {
  slug: string;
  frontmatter: PostFrontmatter;
  mdxSource: MDXRemoteSerializeResult;
};

export default function PostPage({ slug, frontmatter, mdxSource }: PostPageProps) {
  return (
    <>
      <Seo
        title={frontmatter.title}
        description={frontmatter.description}
        canonical={`/posts/${slug}`}
        ogImage={frontmatter.thumbnail}
      />
      <div className={styles.container}>
        <Breadcrumb
          items={[
            { label: frontmatter.category, href: `/category/${frontmatter.category}` },
            { label: frontmatter.title },
          ]}
        />
        <article className={styles.article}>
          <header className={styles.header}>
            <p className={styles.category}>{frontmatter.category}</p>
            <h1 className={styles.title}>{frontmatter.title}</h1>
            <div className={styles.meta}>
              <time className={styles.date}>{frontmatter.date}</time>
              <ViewCounter slug={slug} />
            </div>
          </header>
          <div className={styles.body}>
            <MDXRemote {...mdxSource} components={mdxComponents} />
          </div>
        </article>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  if (!fs.existsSync(POSTS_DIR)) return { paths: [], fallback: false };
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx"));
  return {
    paths: files.map((f) => ({ params: { slug: f.replace(".mdx", "") } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<PostPageProps> = async ({ params }) => {
  const slug = params?.slug as string;
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return { notFound: true };

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const mdxSource = await serialize(content);

  return {
    props: {
      slug,
      frontmatter: data as PostFrontmatter,
      mdxSource,
    },
  };
};
