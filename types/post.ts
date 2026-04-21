export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  thumbnail?: string;
  views?: number;
};

export type PostFrontmatter = Omit<Post, "slug">;
