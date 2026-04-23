const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'posts');

const REPLACEMENTS = {
  'camp-lighting-guide': [
    {name:'BALMUDA The Lantern L02A 無段階調光 充電式',price:'15950',rakutenRating:'4.81',rakutenReviewCount:'974',affiliateUrl:'https://item.rakuten.co.jp/plywood/14939010/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/plywood/cabinet/501/14939010.jpg?_ex=128x128'},
    {name:'KZM ギルバートランタン LED レトロアンティーク',price:'19800',rakutenRating:'3.5',rakutenReviewCount:'4',affiliateUrl:'https://item.rakuten.co.jp/sanho-store/kzm-k21t3o02/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/sanho-store/cabinet/cart/kzm-k21t3o02_cart.jpg?_ex=128x128'},
    {name:'M.O.L MOL-L400 充電式 400LM LEDランタン',price:'2980',rakutenRating:'4.66',rakutenReviewCount:'243',affiliateUrl:'https://item.rakuten.co.jp/minatodenk/mt-0024146/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/minatodenk/cabinet/018/mt-0024146.jpg?_ex=128x128'},
    {name:'M.O.L MOL-L1200 充電式 1200LM LEDランタン',price:'4280',rakutenRating:'4.27',rakutenReviewCount:'22',affiliateUrl:'https://item.rakuten.co.jp/minatodenk/mt-0025335/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/minatodenk/cabinet/021/mt-0025335.jpg?_ex=128x128'},
    {name:'ソーラーランタン 1800LM 折り畳み式 5000mAh USB充電',price:'2900',rakutenRating:'4.60',rakutenReviewCount:'508',affiliateUrl:'https://item.rakuten.co.jp/aideall/s-yyd-rt101-bk/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/aideall/cabinet/10896179/10915808/1-1.jpg?_ex=128x128'},
  ],
  'group-camp-table': [
    {name:'FIELDOOR アウトドアテーブル 180/240cm 6〜8人対応 三つ折り',price:'7260',rakutenRating:'4.41',rakutenReviewCount:'160',affiliateUrl:'https://item.rakuten.co.jp/smile88/a15890/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/smile88/cabinet/master/1st2/a15890.jpg?_ex=128x128'},
    {name:'waku fimac ロールトップテーブル 120×70 高さ調整',price:'9980',rakutenRating:'4.60',rakutenReviewCount:'240',affiliateUrl:'https://item.rakuten.co.jp/auc-topsense/10005150/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/auc-topsense/cabinet/ftp10/10005150_19.jpg?_ex=128x128'},
    {name:'CAPTAIN STAG ヘキサセンターテーブル 96 2個組 組合せ可能',price:'27313',rakutenRating:'5.0',rakutenReviewCount:'1',affiliateUrl:'https://item.rakuten.co.jp/goodlifeshop/pup-1040/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/goodlifeshop/cabinet/outdoor2/pup-1040-012.gif?_ex=128x128'},
    {name:'Helinox テーブルワン ハードトップ L 軽量コンパクト',price:'18800',rakutenRating:'0',rakutenReviewCount:'0',affiliateUrl:'https://item.rakuten.co.jp/camp-link/cl-1000003101291/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/camp-link/cabinet/16756/cl-1000003101291.jpg?_ex=128x128'},
    {name:'お宝ワールド 折りたたみテーブル 180×70cm 頑丈',price:'5980',rakutenRating:'4.0',rakutenReviewCount:'251',affiliateUrl:'https://item.rakuten.co.jp/otakaratuuhan/10005450/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/otakaratuuhan/cabinet/shohin/shohin11/km-f002.jpg?_ex=128x128'},
  ],
  'two-room-tent-guide': [
    {name:'FIELDOOR トンネルテント 620 4〜8人用 2ルーム 大型',price:'28710',rakutenRating:'4.10',rakutenReviewCount:'190',affiliateUrl:'https://item.rakuten.co.jp/maxshare/a16865/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/maxshare/cabinet/master/1st/a16865.jpg?_ex=128x128'},
    {name:'クーヴァ KURVE 5人用 2ルーム トンネルテント',price:'53480',rakutenRating:'4.10',rakutenReviewCount:'21',affiliateUrl:'https://item.rakuten.co.jp/esports/6000000035579/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/esports/cabinet/6000-205/6000000035579.jpg?_ex=128x128'},
    {name:'Naturehike The hills 2人用 1LDK ツールーム 煙突穴付',price:'39990',rakutenRating:'4.30',rakutenReviewCount:'30',affiliateUrl:'https://item.rakuten.co.jp/naturehike-direct/cnk2300zp017/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/naturehike-direct/cabinet/08942882/09903595/08.jpg?_ex=128x128'},
    {name:'TOMOUNT TriArc 2ルーム トンネルテント 4人用',price:'39999',rakutenRating:'4.40',rakutenReviewCount:'15',affiliateUrl:'https://item.rakuten.co.jp/tomount/triarc-tunnel-tent-v4/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/tomount/cabinet/triarc/1000/1-1.jpg?_ex=128x128'},
    {name:'タンスのゲン ツールームテント 340cm 4〜6人用',price:'29999',rakutenRating:'4.04',rakutenReviewCount:'53',affiliateUrl:'https://item.rakuten.co.jp/tansu/44400010/?rafcid=wsc_i_is_ea4b84f0-cfca-4a84-b96e-a8423bbc252f',image:'https://thumbnail.image.rakuten.co.jp/@0_mall/tansu/cabinet/07131939/44400010_10.jpg?_ex=128x128'},
  ],
};

function getAttr(block, attr) {
  // quoted: attr="value"
  let m = block.match(new RegExp('  ' + attr + '="([^"]*)"'));
  if (m) return m[1];
  // JSX number: attr={value}
  m = block.match(new RegExp('  ' + attr + '=\\{([^}]*)\\}'));
  if (m) return m[1];
  return '';
}

function buildBlock(rank, id, description, badge, d) {
  const lines = [
    '<ProductCardMdx',
    `  rank="${rank}"`,
    `  id="${id}"`,
    `  name="${d.name}"`,
    `  description="${description}"`,
    `  price="${d.price}"`,
    `  rakutenRating="${d.rakutenRating}"`,
    `  rakutenReviewCount="${d.rakutenReviewCount}"`,
    `  affiliateUrl="${d.affiliateUrl}"`,
    `  source="rakuten"`,
  ];
  if (badge) lines.push(`  badge="${badge}"`);
  lines.push(`  image="${d.image}"`);
  lines.push('/>');
  return lines.join('\n');
}

let total = 0;
for (const [stem, reps] of Object.entries(REPLACEMENTS)) {
  const filepath = path.join(CONTENT_DIR, stem + '.mdx');
  let content = fs.readFileSync(filepath, 'utf8');
  const blockPattern = /<ProductCardMdx\n(  [^\n]+\n)+\/>/g;
  const blocks = content.match(blockPattern) || [];
  let replaced = 0;
  for (const block of blocks) {
    const rankStr = getAttr(block, 'rank');
    const rankIdx = parseInt(rankStr, 10) - 1;
    if (isNaN(rankIdx) || rankIdx < 0 || rankIdx >= reps.length) {
      console.log(`  bad rank="${rankStr}" in ${stem}`);
      continue;
    }
    const id = getAttr(block, 'id');
    const description = getAttr(block, 'description');
    const badge = getAttr(block, 'badge');
    const newBlock = buildBlock(rankStr, id, description, badge, reps[rankIdx]);
    content = content.replace(block, newBlock);
    replaced++;
    total++;
  }
  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`OK: ${stem}.mdx (${replaced}/${blocks.length} replaced)`);
}
console.log(`\nDone: ${total} blocks replaced.`);
