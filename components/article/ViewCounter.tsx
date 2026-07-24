import { useEffect, useState } from "react";
import { getViewCount, incrementViewCount } from "../../lib/supabase";

type ViewCounterProps = {
  slug: string;
};

export default function ViewCounter({ slug }: ViewCounterProps) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    // 自動アクセス（Claude等のbot／内部確認）はカウントしない。
    // URLに ?ckbot=1 が付くか、同一セッションで記録済みなら計上をスキップし、表示のみ取得する。
    let isBot = false;
    try {
      isBot =
        window.location.search.indexOf("ckbot=1") > -1 ||
        window.sessionStorage.getItem("ckbot") === "1";
      if (isBot) window.sessionStorage.setItem("ckbot", "1");
    } catch {
      isBot = false;
    }

    if (isBot) {
      getViewCount(slug).then(setViews);
      return;
    }

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
