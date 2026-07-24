const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const POSTS = path.join(__dirname, "../content/posts");
const SRC   = path.join(__dirname, "../docs/visual");
const OUT   = path.join(__dirname, "../public/images");
const W = 1200, H = 630;

// ── 1. docs/visual/ の9枚をリサイズして public/images/outdoor-NN.png に保存 ──
const SOURCES = [
  "Group 12.png",
  "Group 12-1.png",
  "Group 12-2.png",
  "Group 12-2.png",   // 9枚目が不足のため Group 12-2 を再利用して調整
  "Group 13.png",
  "Group 13-1.png",
  "Mask group.png",
  "Mask group-1.png",
  "Mask group-2.png",
  "Mask group-3.png",
];

// 重複なし9枚で確定（Group 12-2 重複を除去して9枚）
const VISUAL_FILES = [
  "Group 12.png",      // outdoor-01
  "Group 12-1.png",    // outdoor-02
  "Group 12-2.png",    // outdoor-03
  "Group 13.png",      // outdoor-04
  "Group 13-1.png",    // outdoor-05
  "Mask group.png",    // outdoor-06
  "Mask group-1.png",  // outdoor-07
  "Mask group-2.png",  // outdoor-08
  "Mask group-3.png",  // outdoor-09
];

// ── 2. カテゴリ順ソート済み47記事の割り当て定義 ──
// カテゴリ順・slug順 → 0始まりで9枚をローテーション
const ARTICLES = [
  // backpack (2)
  { slug: "camp-backpack-beginner" },
  { slug: "mountain-backpack-30l" },
  // bonfire (3)
  { slug: "bonfire-stand-beginner" },
  { slug: "camp-bbq-grill" },
  { slug: "day-camp-grill" },
  // chair-table (6)
  { slug: "camp-chair-lightweight" },
  { slug: "camp-table-folding" },
  { slug: "camp-table-set" },
  { slug: "family-camp-chair" },
  { slug: "group-camp-table" },
  { slug: "solo-camp-cot" },
  // cookware (6)
  { slug: "camp-burner-beginner" },
  { slug: "camp-cooker-beginner" },
  { slug: "camp-cooler-box-beginner" },
  { slug: "camp-cooler-box-overall" },
  { slug: "camp-knife-beginner" },
  { slug: "day-camp-cooler-box" },
  // lighting (5)
  { slug: "camp-headlight-beginner" },
  { slug: "camp-lantern-led" },
  { slug: "camp-lighting-guide" },
  { slug: "day-camp-led-lantern" },
  { slug: "family-camp-lantern" },
  // power (2)
  { slug: "camp-portable-power-beginner" },
  { slug: "portable-power-vehicle-camp" },
  // sleeping-bag (8)
  { slug: "camp-sleeping-mat" },
  { slug: "car-camp-bed-kit" },
  { slug: "kids-sleeping-bag" },
  { slug: "mountain-camp-mat" },
  // 2026-07-24 統合により削除: sleeping-bag-season-guide は
  // sleeping-bag-temperature-guide（下記）へ集約済みのため参照を無効化
  // { slug: "sleeping-bag-season-guide" },
  { slug: "sleeping-bag-summer-cospa" },
  { slug: "sleeping-bag-temperature-guide" },
  { slug: "sleeping-bag-winter-beginner" },
  // tent (15)
  { slug: "camp-tarp-beginner" },
  { slug: "day-camp-starter-set" },
  { slug: "day-camp-tarp-cheap" },
  { slug: "family-camp-summer-tent" },
  { slug: "family-camp-tent" },
  { slug: "family-summer-large-tent" },
  { slug: "group-camp-tent" },
  { slug: "lightweight-mountain-tent" },
  { slug: "mountain-camp-tent" },
  { slug: "solo-camp-beginners-guide" },
  { slug: "solo-tent-beginner" },
  { slug: "solo-tent-lightweight" },
  { slug: "solo-tent-overall" },
  { slug: "stylish-camp-tent" },
  { slug: "two-room-tent-guide" },
];

(async () => {
  // ── Step 1: 9枚をリサイズして配置 ──
  console.log("=== Step 1: 9枚をリサイズして public/images/ に保存 ===");
  for (let i = 0; i < VISUAL_FILES.length; i++) {
    const num = String(i + 1).padStart(2, "0");
    const dest = path.join(OUT, `outdoor-${num}.png`);
    await sharp(path.join(SRC, VISUAL_FILES[i]))
      .resize(W, H, { fit: "cover", position: "centre" })
      .png({ compressionLevel: 8 })
      .toFile(dest);
    const size = (fs.statSync(dest).size / 1024).toFixed(0);
    console.log(`  outdoor-${num}.png ← ${VISUAL_FILES[i]} (${size}KB)`);
  }

  // ── Step 2: 47記事のfrontmatterを更新 ──
  console.log("\n=== Step 2: 47記事の thumbnail を個別割り当て ===");
  let updated = 0;

  for (let idx = 0; idx < ARTICLES.length; idx++) {
    const { slug } = ARTICLES[idx];
    const imgNum  = String((idx % 9) + 1).padStart(2, "0");
    const imgPath = `/images/outdoor-${imgNum}.png`;
    const file    = path.join(POSTS, `${slug}.mdx`);

    if (!fs.existsSync(file)) {
      console.error(`  ⚠️  Not found: ${slug}.mdx`);
      continue;
    }

    let content  = fs.readFileSync(file, "utf8");
    const before = content;

    // thumbnail: "..." → thumbnail: "/images/outdoor-NN.png"
    if (/^thumbnail:\s*["'].*["']\s*$/m.test(content)) {
      content = content.replace(
        /^(thumbnail:\s*)["'].*["']\s*$/m,
        `$1"${imgPath}"`
      );
    } else if (!/^thumbnail:/m.test(content)) {
      // フィールドなし → category 行の後に追加
      content = content.replace(
        /^(category:\s*["']?[^"'\n]+["']?\s*)$/m,
        `$1\nthumbnail: "${imgPath}"`
      );
    }

    if (content === before) {
      console.log(`  ⏭️  No change: ${slug}.mdx`);
      continue;
    }

    fs.writeFileSync(file, content, "utf8");
    console.log(`  ✅ [${String(idx + 1).padStart(2)}] ${slug} → ${imgPath}`);
    updated++;
  }

  console.log(`\n完了: ${updated} / ${ARTICLES.length} 記事更新`);
})();
