#!/usr/bin/env node
// batch3: G列(アフィリエイトURL)にamzn.toがある全行を ProductCardMdx へ amazonUrl 設置
// ルール: (slug,rank) ごとに、まだ amazonUrl を持たない最初の rank 一致カードへ source= の直前に挿入
const fs = require('fs');
const path = require('path');

const tsv = fs.readFileSync(path.join(process.cwd(), '_file/amazon-links-batch3-done.tsv'), 'utf8');
const lines = tsv.split(/\r?\n/).slice(1).filter(Boolean);
// map: slug -> [{rank, url}]
const bySlug = {};
const seen = new Set();
for (const l of lines) {
  const c = l.split('\t');
  const slug = c[1], rank = c[2], url = c[6];
  if (!url || !/amzn\.to/.test(url)) continue;
  const key = slug + '|' + rank + '|' + url;
  if (seen.has(key)) continue; // dedup (two-room-tent-guide rank4)
  seen.add(key);
  (bySlug[slug] = bySlug[slug] || []).push({ rank, url });
}

let totalInserted = 0;
const report = [];
for (const slug of Object.keys(bySlug)) {
  const file = path.join(process.cwd(), 'content/posts/' + slug + '.mdx');
  let src = fs.readFileSync(file, 'utf8');
  const fileLines = src.split('\n');

  // 各カードの (start,end,rank,hasAmazon,sourceIdx) を収集
  const cards = [];
  let cur = null;
  for (let i = 0; i < fileLines.length; i++) {
    const line = fileLines[i];
    if (/<ProductCardMdx/.test(line)) cur = { start: i, rank: null, hasAmazon: false, sourceIdx: -1, endIdx: -1 };
    if (cur) {
      const m = line.match(/rank="(\d+)"/);
      if (m && cur.rank === null) cur.rank = m[1];
      if (/amazonUrl=/.test(line)) cur.hasAmazon = true;
      if (/^\s*source=/.test(line) && cur.sourceIdx === -1) cur.sourceIdx = i;
      if (/^\s*\/>/.test(line)) { cur.endIdx = i; cards.push(cur); cur = null; }
    }
  }

  // 挿入を降順で適用（行番号がずれないように、後で一括処理）
  const inserts = []; // {atIdx, text}
  for (const { rank, url } of bySlug[slug]) {
    const target = cards.find(c => c.rank === rank && !c.hasAmazon && !c._used);
    if (!target) {
      report.push(`  SKIP ${slug} rank${rank} (該当カードなし/既設) ${url}`);
      continue;
    }
    target._used = true;
    const atIdx = target.sourceIdx !== -1 ? target.sourceIdx : target.endIdx;
    inserts.push({ atIdx, text: `  amazonUrl="${url}"` });
    report.push(`  OK   ${slug} rank${rank} -> ${url}`);
    totalInserted++;
  }
  if (!inserts.length) continue;
  inserts.sort((a, b) => b.atIdx - a.atIdx);
  for (const ins of inserts) fileLines.splice(ins.atIdx, 0, ins.text);
  fs.writeFileSync(file, fileLines.join('\n'));
  report.push(`== ${slug}: ${inserts.length}件挿入 ==`);
}
console.log(report.join('\n'));
console.log('\nTOTAL inserted: ' + totalInserted);
