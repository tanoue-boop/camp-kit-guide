import { useEffect, useState } from "react";
import { getViewCount, incrementViewCount } from "../../lib/supabase";

type ViewCounterProps = {
  slug: string;
};

export default function ViewCounter({ slug }: ViewCounterProps) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    incrementViewCount(slug).then(() => {
      getViewCount(slug).then(setViews);
    });
  }, [slug]);

  if (views === null) return null;
  return (
    <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
      👁 {views.toLocaleString()} views
    </span>
  );
}
