const fs = require("fs");
const path = require("path");

const POSTS = path.join(__dirname, "../content/posts");

// カテゴリ → 画像パス
const THUMB = {
  "tent":        "/images/categories/tent.png",
  "sleeping-bag":"/images/categories/sleeping-bag.png",
  "cookware":    "/images/categories/cookware.png",
  "chair-table": "/images/categories/chair-table.png",
  "lighting":    "/images/categories/lighting.png",
  "bonfire":     "/images/categories/bonfire.png",
  "backpack":    "/images/categories/backpack.png",
  "power":       "/images/categories/power.png",
};

// 未設定22記事（slug : category）
const TARGETS = {
  "bonfire-stand-beginner":     "bonfire",
  "camp-backpack-beginner":     "backpack",
  "camp-burner-beginner":       "cookware",
  "camp-chair-lightweight":     "chair-table",
  "camp-cooker-beginner":       "cookware",
  "camp-cooler-box-beginner":   "cookware",
  "camp-headlight-beginner":    "lighting",
  "camp-knife-beginner":        "cookware",
  "camp-lantern-led":           "lighting",
  "camp-lighting-guide":        "lighting",
  "camp-portable-power-beginner":"power",
  "camp-sleeping-mat":          "sleeping-bag",
  "camp-table-folding":         "chair-table",
  "camp-tarp-beginner":         "tent",
  "family-camp-summer-tent":    "tent",
  "group-camp-table":           "chair-table",
  "mountain-backpack-30l":      "backpack",
  "sleeping-bag-summer-cospa":  "sleeping-bag",
  "sleeping-bag-winter-beginner":"sleeping-bag",
  "solo-camp-beginners-guide":  "tent",
  "solo-tent-beginner":         "tent",
  "two-room-tent-guide":        "tent",
};

let updated = 0;

for (const [slug, cat] of Object.entries(TARGETS)) {
  const file = path.join(POSTS, `${slug}.mdx`);
  if (!fs.existsSync(file)) {
    console.error(`⚠️  Not found: ${slug}.mdx`);
    continue;
  }

  const imgPath = THUMB[cat];
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  // パターン1: thumbnail: "" または thumbnail: '' → 値を置換
  if (/^thumbnail:\s*["']["']\s*$/m.test(content)) {
    content = content.replace(
      /^(thumbnail:\s*)["']["']\s*$/m,
      `$1"${imgPath}"`
    );
  }
  // パターン2: thumbnailフィールドなし → category: 行の直後に挿入
  else if (!/^thumbnail:/m.test(content)) {
    content = content.replace(
      /^(category:\s*["']?[^"'\n]+["']?\s*)$/m,
      `$1\nthumbnail: "${imgPath}"`
    );
  }
  // パターン3: 既に値あり → スキップ
  else {
    console.log(`⏭️  Skip (already set): ${slug}.mdx`);
    continue;
  }

  if (content === original) {
    console.error(`❌ No change made: ${slug}.mdx — check manually`);
    continue;
  }

  fs.writeFileSync(file, content, "utf8");
  console.log(`✅ ${slug}.mdx → thumbnail: "${imgPath}"`);
  updated++;
}

console.log(`\n完了: ${updated} / ${Object.keys(TARGETS).length} ファイル更新`);
