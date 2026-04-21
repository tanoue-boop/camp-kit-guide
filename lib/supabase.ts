import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder";

export const supabase = createClient(supabaseUrl, supabaseKey);

const isConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_url_here";

export async function getViewCount(slug: string): Promise<number> {
  if (!isConfigured) return 0;
  const { data } = await supabase
    .from("page_views")
    .select("count")
    .eq("slug", slug)
    .single();
  return data?.count ?? 0;
}

export async function incrementViewCount(slug: string): Promise<void> {
  if (!isConfigured) return;
  await supabase.rpc("increment_view", { page_slug: slug });
}
