const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'posts');
const TSV_PATH = path.join(__dirname, '..', '_file', 'products.tsv');

// Parse TSV: col indices (0-based)
// [0]=slug [3]=順位 [4]=name [5]=price [6]=rating [7]=reviewCount [8]=image [9]=url [12]=採用フラグ
const lines = fs.readFileSync(TSV_PATH, 'utf8').split('\n');
const products = {};

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trimEnd();
  if (!line) continue;
  const cols = line.split('\t');
  if ((cols[12] || '').trim() !== 'TRUE') continue;

  const slug = cols[0];
  if (!products[slug]) products[slug] = [];
  products[slug].push({
    name: cols[4].replace(/"/g, '&quot;'),
    price: cols[5],
    rating: cols[6],
    reviewCount: cols[7],
    image: (cols[8] || '').replace(/\?_ex=\d+x\d+$/, ''),
    affiliateUrl: cols[9],
  });
}

for (const [slug, list] of Object.entries(products)) {
  if (list.length !== 5) {
    console.log(`WARNING: ${slug} has ${list.length} products (expected 5)`);
  }
}

function getAttr(block, attr) {
  const m = block.match(new RegExp(`  ${attr}="([^"]*)"`));
  return m ? m[1] : '';
}

function buildBlock(rank, id, description, badge, d) {
  const parts = [
    '<ProductCardMdx',
    `  rank="${rank}"`,
    `  id="${id}"`,
    `  name="${d.name}"`,
    `  description="${description}"`,
    `  price="${d.price}"`,
    `  rakutenRating="${d.rating}"`,
    `  rakutenReviewCount="${d.reviewCount}"`,
    `  affiliateUrl="${d.affiliateUrl}"`,
    `  source="rakuten"`,
  ];
  if (badge) parts.push(`  badge="${badge}"`);
  parts.push(`  image="${d.image}"`);
  parts.push('/>');
  return parts.join('\n');
}

const blockPattern = /<ProductCardMdx\n(  [^\n]+\n)+\/>/g;
let totalBlocks = 0;
let totalFiles = 0;

for (const [slug, list] of Object.entries(products)) {
  const filepath = path.join(CONTENT_DIR, slug + '.mdx');
  if (!fs.existsSync(filepath)) {
    console.log(`MISSING: ${slug}.mdx`);
    continue;
  }

  let content = fs.readFileSync(filepath, 'utf8');
  const blocks = content.match(blockPattern) || [];

  if (blocks.length !== 5) {
    console.log(`WARNING: ${slug} has ${blocks.length} blocks (expected 5)`);
  }

  const count = Math.min(blocks.length, list.length);
  for (let i = 0; i < count; i++) {
    const id = getAttr(blocks[i], 'id');
    const description = getAttr(blocks[i], 'description');
    const badge = getAttr(blocks[i], 'badge');
    const newBlock = buildBlock(String(i + 1), id, description, badge, list[i]);
    content = content.replace(blocks[i], newBlock);
    totalBlocks++;
  }

  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`OK: ${slug}.mdx (${count} blocks)`);
  totalFiles++;
}

console.log(`\nDone: ${totalFiles} files, ${totalBlocks} blocks replaced.`);
