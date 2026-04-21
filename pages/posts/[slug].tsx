import type { GetStaticPaths, GetStaticProps } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Seo from "../../components/common/Seo";
import Breadcrumb from "../../components/common/Breadcrumb";
import ViewCounter from "../../components/article/ViewCounter";
import ProductCard from "../../components/article/ProductCard";
import ComparisonTable from "../../components/article/ComparisonTable";
import ArticleImage from "../../components/article/ArticleImage";
import Sidebar from "../../components/article/Sidebar";
import InlineTOC from "../../components/article/InlineTOC";
import ShareButtons from "../../components/article/ShareButtons";
import PostNavigation from "../../components/article/PostNavigation";
import type { PostFrontmatter, Post } from "../../types/post";
import type { Category } from "../../types/category";
import type { Heading } from "../../components/article/TableOfContents";
import styles from "./post.module.css";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

const ALL_CATEGORIES: Category[] = [
  { slug: "tent", name: "テント", description: "", icon: "⛺" },
  { slug: "sleeping-bag", name: "寝袋・シュラフ", description: "", icon: "🛏️" },
  { slug: "cookware", name: "調理器具", description: "", icon: "🍳" },
  { slug: "chair-table", name: "チェア・テーブル", description: "", icon: "🪑" },
  { slug: "lighting", name: "照明・ランタン", description: "", icon: "🔦" },
  { slug: "clothing", name: "ウェア・装備", description: "", icon: "🧥" },
];

// ─── heading helpers ─────────────────────────────────────────────────────────

function makeHeadingId(text: string): string {
  const id = text.trim().toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u3040-\u9faf\u4e00-\u9fff-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return id || "heading";
}

function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const regex = /^(#{2,3})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    headings.push({ level, text, id: makeHeadingId(text) });
  }
  return headings;
}

// ─── post helpers ─────────────────────────────────────────────────────────────

function readAllPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs.readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
      const { data } = matter(raw);
      return {
        slug: file.replace(".mdx", ""),
        title: data.title ?? "",
        description: data.description ?? "",
        date: data.date ?? "",
        category: data.category ?? "",
        tags: data.tags ?? [],
        ...(data.thumbnail ? { thumbnail: data.thumbnail } : {}),
      } as Post;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ─── MDX-friendly wrappers ────────────────────────────────────────────────────
// MDX v3 silently drops JSX expression props ({value}), so numeric values must
// be passed as string literals from MDX files and coerced here.

function ProductCardMdx({
  rank, id, name, description, price, rating, reviewCount, affiliateUrl, source, badge,
}: {
  rank?: string; id?: string; name: string; description: string;
  price: string; rating: string; reviewCount: string;
  affiliateUrl: string; source: "amazon" | "rakuten" | "other"; badge?: string;
}) {
  return (
    <ProductCard
      rank={rank ? Number(rank) : undefined}
      product={{
        id: id ?? name, name, description,
        price: Number(price), rating: Number(rating), reviewCount: Number(reviewCount),
        affiliateUrl, source, badge,
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

// Custom heading components that add anchor IDs for TOC
function H2({ children }: { children?: React.ReactNode }) {
  const text = String(children ?? "");
  const id = makeHeadingId(text);
  return <h2 id={id} className={styles.h2}>{children}</h2>;
}

function H3({ children }: { children?: React.ReactNode }) {
  const text = String(children ?? "");
  const id = makeHeadingId(text);
  return <h3 id={id} className={styles.h3}>{children}</h3>;
}

const mdxComponents = {
  ProductCard,
  ComparisonTable,
  ArticleImage,
  ProductCardMdx,
  ComparisonTableMdx,
  h2: H2,
  h3: H3,
};

// ─── types ────────────────────────────────────────────────────────────────────

type PostPageProps = {
  slug: string;
  frontmatter: PostFrontmatter;
  mdxSource: MDXRemoteSerializeResult;
  headings: Heading[];
  relatedPosts: Post[];
  recentPosts: Post[];
  prevPost: Post | null;
  nextPost: Post | null;
  categories: Category[];
};

// ─── component ────────────────────────────────────────────────────────────────

export default function PostPage({
  slug, frontmatter, mdxSource, headings, relatedPosts, recentPosts, prevPost, nextPost, categories,
}: PostPageProps) {
  const catName = ALL_CATEGORIES.find((c) => c.slug === frontmatter.category)?.name ?? frontmatter.category;

  return (
    <>
      <Seo
        title={frontmatter.title}
        description={frontmatter.description}
        canonical={`/posts/${slug}`}
        ogImage={frontmatter.thumbnail}
      />

      {/* Eyecatch */}
      <div className={styles.eyecatch}>
        {frontmatter.thumbnail ? (
          <img src={frontmatter.thumbnail} alt={frontmatter.title} className={styles.eyecatchImg} />
        ) : (
          <div className={styles.eyecatchGradient}>
            <span className={styles.eyecatchCat}>{catName}</span>
            <h1 className={styles.eyecatchTitle}>{frontmatter.title}</h1>
          </div>
        )}
      </div>

      <div className={styles.layout}>
        {/* Main column */}
        <main className={styles.main}>
          <Breadcrumb
            items={[
              { label: catName, href: `/category/${frontmatter.category}` },
              { label: frontmatter.title },
            ]}
          />

          <header className={styles.header}>
            <Link href={`/category/${frontmatter.category}`} className={styles.catBadge}>{catName}</Link>
            {frontmatter.thumbnail && (
              <h1 className={styles.title}>{frontmatter.title}</h1>
            )}
            <div className={styles.meta}>
              <time className={styles.date}>{frontmatter.date}</time>
              <ViewCounter slug={slug} />
            </div>
          </header>

          <article className={styles.body}>
            <InlineTOC headings={headings} />
            <MDXRemote {...mdxSource} components={mdxComponents} />
          </article>

          <ShareButtons title={frontmatter.title} />

          {/* Related posts below article */}
          {relatedPosts.length > 0 && (
            <section className={styles.relatedSection}>
              <h2 className={styles.relatedTitle}>関連記事</h2>
              <div className={styles.relatedGrid}>
                {relatedPosts.slice(0, 3).map((post) => (
                  <Link key={post.slug} href={`/posts/${post.slug}`} className={styles.relatedCard}>
                    <div className={styles.relatedThumb}>
                      {post.thumbnail ? (
                        <img src={post.thumbnail} alt={post.title} className={styles.relatedImg} />
                      ) : (
                        <div className={styles.relatedPlaceholder} />
                      )}
                    </div>
                    <div className={styles.relatedInfo}>
                      <p className={styles.relatedCat}>{catName}</p>
                      <p className={styles.relatedCardTitle}>{post.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <PostNavigation prevPost={prevPost} nextPost={nextPost} />
        </main>

        {/* Sidebar */}
        <div className={styles.sidebarWrap}>
          <Sidebar
            popularPosts={relatedPosts}
            recentPosts={recentPosts}
            categories={categories}
          />
        </div>
      </div>
    </>
  );
}

// ─── data fetching ────────────────────────────────────────────────────────────

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
  const headings = extractHeadings(content);

  const allPosts = readAllPosts();
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const relatedPosts = allPosts.filter((p) => p.slug !== slug && p.category === data.category).slice(0, 5);
  const recentPosts = allPosts.filter((p) => p.slug !== slug).slice(0, 5);

  // Compute postCount for category list
  const countByCategory: Record<string, number> = {};
  allPosts.forEach((p) => {
    countByCategory[p.category] = (countByCategory[p.category] || 0) + 1;
  });
  const categories: Category[] = ALL_CATEGORIES.map((c) => ({
    ...c,
    postCount: countByCategory[c.slug] || 0,
  }));

  return {
    props: {
      slug,
      frontmatter: data as PostFrontmatter,
      mdxSource,
      headings,
      relatedPosts,
      recentPosts,
      prevPost,
      nextPost,
      categories,
    },
  };
};
