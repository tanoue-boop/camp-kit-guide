const sharp = require("sharp");
const path = require("path");

const SRC = path.join(__dirname, "../docs/visual");
const OUT = path.join(__dirname, "../public/images/categories");
const W = 1200, H = 630;

// 9ファイルから8枚を割り当て（Group 13-1.png は除外）
const MAP = [
  { src: "Group 12.png",      dest: "tent.png" },
  { src: "Group 12-1.png",    dest: "sleeping-bag.png" },
  { src: "Group 12-2.png",    dest: "cookware.png" },
  { src: "Group 13.png",      dest: "chair-table.png" },
  { src: "Mask group.png",    dest: "lighting.png" },
  { src: "Mask group-1.png",  dest: "bonfire.png" },
  { src: "Mask group-2.png",  dest: "backpack.png" },
  { src: "Mask group-3.png",  dest: "power.png" },
];

(async () => {
  for (const { src, dest } of MAP) {
    const srcPath = path.join(SRC, src);
    const outPath = path.join(OUT, dest);
    const meta = await sharp(srcPath).metadata();

    await sharp(srcPath)
      .resize(W, H, { fit: "cover", position: "centre" })
      .png({ compressionLevel: 8 })
      .toFile(outPath);

    const outMeta = await sharp(outPath).metadata();
    console.log(`✅ ${src} (${meta.width}x${meta.height}) → ${dest} (${outMeta.width}x${outMeta.height})`);
  }
  console.log("\n完了: 8枚を public/images/categories/ に上書き保存しました");
})();
