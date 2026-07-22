const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const OUT = path.join(__dirname, "../public/images/categories");
fs.mkdirSync(OUT, { recursive: true });

const W = 1200;
const H = 630;

// ──────────────────────────────────────────────
// 共通パーツ
// ──────────────────────────────────────────────
const stars = (n = 60, seed = 1) => {
  let out = "";
  let x = seed * 9301 + 49297, m = 233280;
  for (let i = 0; i < n; i++) {
    x = (x * 9301 + 49297) % m;
    const px = (x / m) * W;
    x = (x * 9301 + 49297) % m;
    const py = (x / m) * (H * 0.6);
    x = (x * 9301 + 49297) % m;
    const r = 0.8 + (x / m) * 1.6;
    const op = 0.5 + (x / m) * 0.5;
    out += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${r.toFixed(1)}" fill="white" opacity="${op.toFixed(2)}"/>`;
  }
  return out;
};

const ground = (y = 460, color = "#2d5a1b") =>
  `<path d="M0,${y} Q300,${y - 30} 600,${y + 10} Q900,${y + 40} 1200,${y - 10} L1200,${H} L0,${H} Z" fill="${color}"/>`;

const mountains = (y = 300, c1 = "#1a3a0a", c2 = "#255214") =>
  `<polygon points="0,${H} 200,${y + 40} 400,${H}" fill="${c1}"/>
   <polygon points="150,${H} 380,${y} 620,${H}" fill="${c2}"/>
   <polygon points="500,${H} 700,${y + 60} 900,${H}" fill="${c1}"/>
   <polygon points="700,${H} 950,${y + 20} 1200,${H}" fill="${c2}"/>`;

const label = (text, sub) =>
  `<text x="600" y="548" font-family="'Hiragino Kaku Gothic Pro','Noto Sans JP','Yu Gothic','Meiryo',sans-serif" font-size="52" font-weight="700" text-anchor="middle" fill="white" opacity="0.97" letter-spacing="4">${text}</text>
   <text x="600" y="598" font-family="'Hiragino Kaku Gothic Pro','Noto Sans JP','Yu Gothic','Meiryo',sans-serif" font-size="22" font-weight="400" text-anchor="middle" fill="white" opacity="0.65" letter-spacing="2">${sub}</text>`;

const branding =
  `<text x="1160" y="615" font-family="'Helvetica Neue','Arial',sans-serif" font-size="18" font-weight="600" text-anchor="end" fill="white" opacity="0.45">CampKit Guide</text>`;

// ──────────────────────────────────────────────
// カテゴリ定義
// ──────────────────────────────────────────────
const categories = [

  // ── tent ──────────────────────────────────
  {
    slug: "tent",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0d2b5e"/>
      <stop offset="55%" stop-color="#1a6b8a"/>
      <stop offset="100%" stop-color="#2a8a3a"/>
    </linearGradient>
    <linearGradient id="tent" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e8c75a"/>
      <stop offset="100%" stop-color="#c4992a"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${stars(80, 42)}
  <!-- 月 -->
  <circle cx="950" cy="110" r="55" fill="#ffe28a" opacity="0.85" filter="url(#glow)"/>
  <circle cx="975" cy="95" r="48" fill="#1a5b78" opacity="0.9"/>
  <!-- 山シルエット -->
  <polygon points="0,630 220,250 440,630" fill="#0a2010"/>
  <polygon points="160,630 420,180 680,630" fill="#12300f"/>
  <polygon points="520,630 760,220 1000,630" fill="#0a2010"/>
  <polygon points="750,630 1010,260 1200,630" fill="#12300f"/>
  <!-- 地面 -->
  <path d="M0,480 Q300,460 600,475 Q900,490 1200,468 L1200,630 L0,630 Z" fill="#1a4a10"/>
  <!-- テント本体 -->
  <g transform="translate(600,480)">
    <polygon points="-165,0 0,-195 165,0" fill="url(#tent)" stroke="#a07820" stroke-width="2"/>
    <polygon points="-165,0 -60,-110 0,-195" fill="#d4a830" opacity="0.6"/>
    <!-- 入口 -->
    <path d="M-35,0 Q0,-60 35,0" fill="#1a1a0a" stroke="#8a6818" stroke-width="1.5"/>
    <!-- ガイライン左 -->
    <line x1="-165" y1="0" x2="-290" y2="35" stroke="#a09060" stroke-width="2" opacity="0.7"/>
    <circle cx="-290" cy="35" r="5" fill="#c0a050"/>
    <!-- ガイライン右 -->
    <line x1="165" y1="0" x2="290" y2="35" stroke="#a09060" stroke-width="2" opacity="0.7"/>
    <circle cx="290" cy="35" r="5" fill="#c0a050"/>
    <!-- 内側光 -->
    <ellipse cx="0" cy="-30" rx="30" ry="40" fill="#ffcc44" opacity="0.18"/>
  </g>
  <!-- ランタン光 -->
  <ellipse cx="600" cy="295" rx="90" ry="70" fill="#ffdd66" opacity="0.07"/>
  <rect x="0" y="490" width="1200" height="12" fill="black" opacity="0.12"/>
  ${label("テント", "TENT")}
  ${branding}
</svg>`,
  },

  // ── sleeping-bag ──────────────────────────
  {
    slug: "sleeping-bag",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#080c2a"/>
      <stop offset="50%" stop-color="#121a45"/>
      <stop offset="100%" stop-color="#1c2a1a"/>
    </linearGradient>
    <linearGradient id="bag" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2255aa"/>
      <stop offset="50%" stop-color="#1a3d88"/>
      <stop offset="100%" stop-color="#0d2255"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="12" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="softglow"><feGaussianBlur stdDeviation="20"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${stars(120, 17)}
  <!-- 天の川 -->
  <ellipse cx="400" cy="150" rx="350" ry="80" fill="white" opacity="0.04" transform="rotate(-20,400,150)"/>
  <ellipse cx="400" cy="150" rx="250" ry="40" fill="white" opacity="0.04" transform="rotate(-20,400,150)"/>
  <!-- 満月 -->
  <circle cx="200" cy="130" r="70" fill="#ffe8a0" opacity="0.15" filter="url(#softglow)"/>
  <circle cx="200" cy="130" r="50" fill="#fff3cc" opacity="0.82" filter="url(#glow)"/>
  <!-- 地面 + 木々シルエット -->
  <path d="M0,430 Q200,420 400,435 Q700,450 1000,428 Q1100,422 1200,432 L1200,630 L0,630 Z" fill="#0f1f0a"/>
  <!-- 木 左 -->
  <rect x="80" y="310" width="16" height="120" fill="#0a1508"/>
  <polygon points="88,160 30,330 146,330" fill="#0f2010"/>
  <polygon points="88,220 18,360 158,360" fill="#142814"/>
  <!-- 木 右 -->
  <rect x="1100" y="320" width="16" height="110" fill="#0a1508"/>
  <polygon points="1108,170 1048,340 1168,340" fill="#0f2010"/>
  <polygon points="1108,230 1040,365 1176,365" fill="#142814"/>
  <!-- 寝袋 本体 -->
  <g transform="translate(600,400)">
    <!-- 袋本体 (ミイラ型) -->
    <path d="M-155,-60 Q-170,-30 -168,30 Q-165,80 -100,95 Q-20,108 0,110 Q20,108 100,95 Q165,80 168,30 Q170,-30 155,-60 Q130,-150 0,-165 Q-130,-150 -155,-60 Z" fill="url(#bag)" stroke="#1a3d7a" stroke-width="2"/>
    <!-- 縫い目ライン -->
    <path d="M-155,-60 Q-140,-5 -138,45" stroke="#2255aa" stroke-width="1.5" fill="none" opacity="0.5"/>
    <path d="M155,-60 Q140,-5 138,45" stroke="#2255aa" stroke-width="1.5" fill="none" opacity="0.5"/>
    <path d="M-100,-130 Q-50,-145 0,-148 Q50,-145 100,-130" stroke="#2a5aaa" stroke-width="1.5" fill="none" opacity="0.4"/>
    <!-- フード部分 -->
    <ellipse cx="0" cy="-130" rx="90" ry="38" fill="#1a3d88" opacity="0.8"/>
    <ellipse cx="0" cy="-130" rx="65" ry="26" fill="#1535700"/>
    <!-- 顔 (シルエット) -->
    <circle cx="0" cy="-130" r="22" fill="#080c2a"/>
    <!-- ジッパー -->
    <path d="M-30,-100 Q0,-155 30,-100" stroke="#4488cc" stroke-width="2.5" fill="none" opacity="0.6"/>
    <!-- 光沢 -->
    <path d="M-140,-40 Q-155,10 -150,50" stroke="white" stroke-width="3" fill="none" opacity="0.12"/>
  </g>
  <!-- 焚き火 (遠景) -->
  <ellipse cx="900" cy="426" rx="25" ry="8" fill="#c04010" opacity="0.5"/>
  <path d="M888,426 Q895,398 900,390 Q905,398 912,426" fill="#e05020" opacity="0.6"/>
  <path d="M893,425 Q898,408 900,402 Q902,408 907,425" fill="#ffaa30" opacity="0.7"/>
  ${label("寝袋・シュラフ", "SLEEPING BAG")}
  ${branding}
</svg>`,
  },

  // ── cookware ──────────────────────────────
  {
    slug: "cookware",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a0800"/>
      <stop offset="40%" stop-color="#3d1a00"/>
      <stop offset="100%" stop-color="#1a2800"/>
    </linearGradient>
    <linearGradient id="pot" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#888888"/>
      <stop offset="100%" stop-color="#444444"/>
    </linearGradient>
    <radialGradient id="firecore" cx="50%" cy="80%" r="60%">
      <stop offset="0%" stop-color="#ffee88"/>
      <stop offset="40%" stop-color="#ff8800"/>
      <stop offset="100%" stop-color="#cc2200" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur4"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="glow"><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${stars(50, 7)}
  <!-- 地面 -->
  <path d="M0,500 Q400,485 600,495 Q900,508 1200,490 L1200,630 L0,630 Z" fill="#0f1f08"/>
  <!-- 焚き火グロー (床面反射) -->
  <ellipse cx="600" cy="500" rx="220" ry="50" fill="#ff6600" opacity="0.12" filter="url(#blur4)"/>
  <!-- 薪 -->
  <line x1="460" y1="498" x2="600" y2="490" stroke="#3a1a08" stroke-width="18" stroke-linecap="round"/>
  <line x1="600" y1="490" x2="740" y2="498" stroke="#3a1a08" stroke-width="18" stroke-linecap="round"/>
  <line x1="490" y1="498" x2="600" y2="493" stroke="#5a2a10" stroke-width="12" stroke-linecap="round"/>
  <line x1="600" y1="493" x2="710" y2="498" stroke="#5a2a10" stroke-width="12" stroke-linecap="round"/>
  <!-- 炎 (後ろ) -->
  <path d="M565,490 Q550,420 570,360 Q590,300 600,280 Q610,300 630,360 Q650,420 635,490" fill="#cc3300" opacity="0.5" filter="url(#blur4)"/>
  <!-- 炎 (メイン) -->
  <path d="M575,490 Q558,435 572,385 Q582,345 594,320 Q602,340 614,385 Q628,435 624,490" fill="#ff6600" opacity="0.85"/>
  <path d="M582,490 Q568,445 578,405 Q586,370 596,350 Q603,368 610,405 Q620,445 617,490" fill="#ffaa00" opacity="0.9"/>
  <path d="M590,490 Q578,460 585,430 Q591,408 598,392 Q604,408 609,430 Q616,460 610,490" fill="#ffee44" opacity="0.95"/>
  <!-- 炎コア光 -->
  <ellipse cx="600" cy="430" rx="60" ry="90" fill="url(#firecore)" opacity="0.6"/>
  <!-- バーナー台 -->
  <ellipse cx="600" cy="340" rx="65" ry="10" fill="#555555" opacity="0.9"/>
  <rect x="560" y="330" width="80" height="16" rx="4" fill="#666666"/>
  <!-- 五徳アーム -->
  <line x1="560" y1="340" x2="535" y2="310" stroke="#555555" stroke-width="5" stroke-linecap="round"/>
  <line x1="590" y1="332" x2="575" y2="305" stroke="#555555" stroke-width="5" stroke-linecap="round"/>
  <line x1="610" y1="332" x2="625" y2="305" stroke="#555555" stroke-width="5" stroke-linecap="round"/>
  <line x1="640" y1="340" x2="665" y2="310" stroke="#555555" stroke-width="5" stroke-linecap="round"/>
  <!-- クッカー -->
  <ellipse cx="600" cy="300" rx="85" ry="14" fill="#777777"/>
  <path d="M515,300 Q515,248 515,245 Q530,228 600,225 Q670,228 685,245 Q685,248 685,300 Z" fill="url(#pot)"/>
  <ellipse cx="600" cy="225" rx="82" ry="12" fill="#888888"/>
  <ellipse cx="600" cy="225" rx="70" ry="9" fill="#555555"/>
  <!-- 蒸気 -->
  <path d="M570,220 Q565,200 572,185 Q578,170 573,155" stroke="white" stroke-width="2.5" fill="none" opacity="0.25" stroke-linecap="round"/>
  <path d="M600,216 Q595,196 602,181 Q608,166 603,151" stroke="white" stroke-width="2.5" fill="none" opacity="0.25" stroke-linecap="round"/>
  <path d="M630,220 Q625,200 632,185 Q638,170 633,155" stroke="white" stroke-width="2.5" fill="none" opacity="0.25" stroke-linecap="round"/>
  <!-- ハンドル -->
  <path d="M515,265 Q490,265 490,250 Q490,238 515,240" stroke="#666666" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M685,265 Q710,265 710,250 Q710,238 685,240" stroke="#666666" stroke-width="6" fill="none" stroke-linecap="round"/>
  ${label("調理器具", "COOKWARE")}
  ${branding}
</svg>`,
  },

  // ── chair-table ───────────────────────────
  {
    slug: "chair-table",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a1f00"/>
      <stop offset="45%" stop-color="#2a5a18"/>
      <stop offset="100%" stop-color="#1a3a0a"/>
    </linearGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a3a6a"/>
      <stop offset="100%" stop-color="#1a6a3a"/>
    </linearGradient>
    <filter id="shadow"><feDropShadow dx="4" dy="6" stdDeviation="6" flood-color="black" flood-opacity="0.4"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${stars(40, 33)}
  <!-- 木々の稜線 -->
  <path d="M0,300 Q50,260 100,280 Q150,240 200,260 Q260,220 320,250 Q380,210 430,240 Q480,200 530,230 L530,630 L0,630 Z" fill="#0a2a08" opacity="0.8"/>
  <path d="M670,225 Q720,190 780,215 Q840,175 900,205 Q960,165 1020,195 Q1080,155 1140,185 Q1170,195 1200,180 L1200,630 L670,630 Z" fill="#0a2a08" opacity="0.8"/>
  <!-- 地面 -->
  <path d="M0,450 Q300,438 600,448 Q900,458 1200,440 L1200,630 L0,630 Z" fill="#1c3c0e"/>
  <!-- テーブル -->
  <g transform="translate(600,385)" filter="url(#shadow)">
    <!-- 天板 -->
    <rect x="-200" y="-12" width="400" height="24" rx="4" fill="#8B5E2A"/>
    <rect x="-196" y="-10" width="392" height="6" fill="#a06830" opacity="0.6"/>
    <!-- 板目 -->
    <line x1="-130" y1="-12" x2="-130" y2="12" stroke="#7a5020" stroke-width="1.5" opacity="0.5"/>
    <line x1="-40" y1="-12" x2="-40" y2="12" stroke="#7a5020" stroke-width="1.5" opacity="0.5"/>
    <line x1="50" y1="-12" x2="50" y2="12" stroke="#7a5020" stroke-width="1.5" opacity="0.5"/>
    <line x1="140" y1="-12" x2="140" y2="12" stroke="#7a5020" stroke-width="1.5" opacity="0.5"/>
    <!-- 脚 (X型) -->
    <line x1="-160" y1="12" x2="-120" y2="90" stroke="#6a4818" stroke-width="10" stroke-linecap="round"/>
    <line x1="-120" y1="12" x2="-160" y2="90" stroke="#6a4818" stroke-width="10" stroke-linecap="round"/>
    <line x1="120" y1="12" x2="160" y2="90" stroke="#6a4818" stroke-width="10" stroke-linecap="round"/>
    <line x1="160" y1="12" x2="120" y2="90" stroke="#6a4818" stroke-width="10" stroke-linecap="round"/>
    <!-- テーブル上のランタン -->
    <rect x="-18" y="-52" width="36" height="38" rx="4" fill="#d4a830" opacity="0.9"/>
    <rect x="-12" y="-68" width="24" height="16" rx="2" fill="#b08820"/>
    <ellipse cx="0" cy="-48" rx="16" ry="5" fill="#ffe060" opacity="0.7"/>
    <ellipse cx="0" cy="-40" rx="12" ry="18" fill="#ffee88" opacity="0.5"/>
  </g>
  <!-- 左チェア -->
  <g transform="translate(340,430)" filter="url(#shadow)">
    <rect x="-48" y="-20" width="96" height="18" rx="3" fill="#2a6a3a"/>
    <rect x="-36" y="-58" width="72" height="42" rx="4" fill="#2a6a3a"/>
    <line x1="-40" y1="-2" x2="-50" y2="60" stroke="#1a4a28" stroke-width="9" stroke-linecap="round"/>
    <line x1="40" y1="-2" x2="50" y2="60" stroke="#1a4a28" stroke-width="9" stroke-linecap="round"/>
    <line x1="-50" y1="60" x2="50" y2="60" stroke="#1a4a28" stroke-width="8" stroke-linecap="round"/>
    <line x1="-36" y1="-58" x2="-50" y2="-110" stroke="#1a4a28" stroke-width="9" stroke-linecap="round"/>
    <line x1="36" y1="-58" x2="50" y2="-110" stroke="#1a4a28" stroke-width="9" stroke-linecap="round"/>
    <line x1="-50" y1="-110" x2="50" y2="-110" stroke="#1a4a28" stroke-width="8" stroke-linecap="round"/>
  </g>
  <!-- 右チェア -->
  <g transform="translate(860,430)" filter="url(#shadow)">
    <rect x="-48" y="-20" width="96" height="18" rx="3" fill="#2a6a3a"/>
    <rect x="-36" y="-58" width="72" height="42" rx="4" fill="#2a6a3a"/>
    <line x1="-40" y1="-2" x2="-50" y2="60" stroke="#1a4a28" stroke-width="9" stroke-linecap="round"/>
    <line x1="40" y1="-2" x2="50" y2="60" stroke="#1a4a28" stroke-width="9" stroke-linecap="round"/>
    <line x1="-50" y1="60" x2="50" y2="60" stroke="#1a4a28" stroke-width="8" stroke-linecap="round"/>
    <line x1="-36" y1="-58" x2="-50" y2="-110" stroke="#1a4a28" stroke-width="9" stroke-linecap="round"/>
    <line x1="36" y1="-58" x2="50" y2="-110" stroke="#1a4a28" stroke-width="9" stroke-linecap="round"/>
    <line x1="-50" y1="-110" x2="50" y2="-110" stroke="#1a4a28" stroke-width="8" stroke-linecap="round"/>
  </g>
  ${label("チェア・テーブル", "CHAIR &amp; TABLE")}
  ${branding}
</svg>`,
  },

  // ── lighting ──────────────────────────────
  {
    slug: "lighting",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#040814"/>
      <stop offset="100%" stop-color="#0a1820"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#ffee88" stop-opacity="0.35"/>
      <stop offset="40%" stop-color="#ffaa22" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#ff6600" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="floor" cx="50%" cy="100%" r="40%">
      <stop offset="0%" stop-color="#cc8800" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#cc8800" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="blur20"><feGaussianBlur stdDeviation="20"/></filter>
    <filter id="glflt"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${stars(100, 55)}
  <!-- 広がる光 -->
  <ellipse cx="600" cy="260" rx="480" ry="360" fill="url(#glow)"/>
  <!-- 床面の光反射 -->
  <ellipse cx="600" cy="600" rx="300" ry="80" fill="url(#floor)"/>
  <!-- 地面 -->
  <path d="M0,510 Q300,495 600,505 Q900,518 1200,500 L1200,630 L0,630 Z" fill="#060e10"/>
  <!-- ランタン ハンガー紐 -->
  <line x1="600" y1="0" x2="600" y2="95" stroke="#888888" stroke-width="3" opacity="0.6"/>
  <!-- ランタン本体 -->
  <g transform="translate(600,200)" filter="url(#glflt)">
    <!-- キャップ上部 -->
    <path d="M-28,-100 L28,-100 L35,-88 L-35,-88 Z" fill="#888888"/>
    <rect x="-20" y="-115" width="40" height="18" rx="4" fill="#999999"/>
    <!-- メインボディ -->
    <path d="M-55,-88 L55,-88 L65,80 L-65,80 Z" fill="#ddcc88" opacity="0.95"/>
    <!-- パネルグリッド (縦) -->
    <line x1="-18" y1="-88" x2="-22" y2="80" stroke="#aaa060" stroke-width="1.5" opacity="0.5"/>
    <line x1="18" y1="-88" x2="22" y2="80" stroke="#aaa060" stroke-width="1.5" opacity="0.5"/>
    <!-- パネルグリッド (横) -->
    <line x1="-56" y1="-50" x2="56" y2="-50" stroke="#aaa060" stroke-width="1" opacity="0.4"/>
    <line x1="-59" y1="-10" x2="59" y2="-10" stroke="#aaa060" stroke-width="1" opacity="0.4"/>
    <line x1="-62" y1="30" x2="62" y2="30" stroke="#aaa060" stroke-width="1" opacity="0.4"/>
    <!-- 内側光源 -->
    <ellipse cx="0" cy="-5" rx="40" ry="55" fill="#ffee88" opacity="0.5" filter="url(#blur6)"/>
    <ellipse cx="0" cy="-5" rx="22" ry="35" fill="#ffff99" opacity="0.7"/>
    <!-- ベース -->
    <rect x="-65" y="80" width="130" height="20" rx="4" fill="#888888"/>
    <rect x="-75" y="95" width="150" height="12" rx="3" fill="#777777"/>
    <!-- ハンドル -->
    <path d="M-45,-95 Q-60,-120 0,-125 Q60,-120 45,-95" stroke="#888888" stroke-width="6" fill="none" stroke-linecap="round"/>
    <!-- 光の光線 -->
    <line x1="-100" y1="-20" x2="-180" y2="-60" stroke="#ffdd44" stroke-width="1.5" opacity="0.15"/>
    <line x1="-110" y1="20" x2="-200" y2="40" stroke="#ffdd44" stroke-width="1.5" opacity="0.12"/>
    <line x1="100" y1="-20" x2="180" y2="-60" stroke="#ffdd44" stroke-width="1.5" opacity="0.15"/>
    <line x1="110" y1="20" x2="200" y2="40" stroke="#ffdd44" stroke-width="1.5" opacity="0.12"/>
  </g>
  ${label("照明・ランタン", "LIGHTING")}
  ${branding}
</svg>`,
  },

  // ── bonfire ───────────────────────────────
  {
    slug: "bonfire",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a0500"/>
      <stop offset="50%" stop-color="#1a0a00"/>
      <stop offset="100%" stop-color="#0f1500"/>
    </linearGradient>
    <radialGradient id="firelight" cx="50%" cy="70%" r="55%">
      <stop offset="0%" stop-color="#ff8800" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="#ff4400" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#ff2200" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="groundglow" cx="50%" cy="100%" r="40%">
      <stop offset="0%" stop-color="#ff6600" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#ff6600" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter>
    <filter id="blur18"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${stars(70, 88)}
  <!-- 焚き火の広がる光 -->
  <ellipse cx="600" cy="370" rx="500" ry="350" fill="url(#firelight)"/>
  <!-- 木々シルエット -->
  <rect x="60" y="240" width="18" height="200" fill="#080500"/>
  <polygon points="69,80 10,260 128,260" fill="#0a0600"/>
  <polygon points="69,150 0,290 138,290" fill="#0d0800"/>
  <rect x="1120" y="250" width="18" height="190" fill="#080500"/>
  <polygon points="1129,90 1070,270 1188,270" fill="#0a0600"/>
  <polygon points="1129,160 1062,300 1196,300" fill="#0d0800"/>
  <!-- 遠景山 -->
  <polygon points="0,630 250,300 500,630" fill="#080500"/>
  <polygon points="200,630 500,240 800,630" fill="#0a0600"/>
  <polygon points="600,630 900,280 1200,630" fill="#080500"/>
  <!-- 地面 -->
  <path d="M0,490 Q300,475 600,482 Q900,492 1200,478 L1200,630 L0,630 Z" fill="#100800"/>
  <!-- 地面反射光 -->
  <ellipse cx="600" cy="510" rx="250" ry="60" fill="url(#groundglow)"/>
  <!-- 焚き火台 -->
  <ellipse cx="600" cy="490" rx="95" ry="22" fill="#333333"/>
  <ellipse cx="600" cy="490" rx="88" ry="16" fill="#222222"/>
  <!-- 焚き火台の脚 -->
  <line x1="520" y1="490" x2="500" y2="530" stroke="#444444" stroke-width="8" stroke-linecap="round"/>
  <line x1="680" y1="490" x2="700" y2="530" stroke="#444444" stroke-width="8" stroke-linecap="round"/>
  <line x1="560" y1="494" x2="540" y2="534" stroke="#3a3a3a" stroke-width="6" stroke-linecap="round"/>
  <line x1="640" y1="494" x2="660" y2="534" stroke="#3a3a3a" stroke-width="6" stroke-linecap="round"/>
  <!-- 薪 -->
  <line x1="500" y1="488" x2="700" y2="480" stroke="#3a1a08" stroke-width="22" stroke-linecap="round"/>
  <line x1="520" y1="492" x2="680" y2="486" stroke="#5a2a10" stroke-width="14" stroke-linecap="round"/>
  <line x1="545" y1="484" x2="655" y2="490" stroke="#3a1a08" stroke-width="18" stroke-linecap="round" transform="rotate(8,600,487)"/>
  <!-- 炎 後ろ -->
  <path d="M555,482 Q535,390 550,320 Q565,260 580,220 Q600,200 620,220 Q635,260 650,320 Q665,390 645,482" fill="#aa2200" opacity="0.4" filter="url(#blur8)"/>
  <!-- 炎 外 -->
  <path d="M562,482 Q540,400 555,335 Q568,278 582,250 Q596,228 600,220 Q604,228 618,250 Q632,278 645,335 Q660,400 638,482" fill="#dd4400" opacity="0.7"/>
  <path d="M568,482 Q548,410 560,355 Q570,308 580,280 Q588,258 597,240 Q606,258 616,280 Q626,308 637,355 Q648,410 630,482" fill="#ff6600" opacity="0.85"/>
  <!-- 炎 中 -->
  <path d="M576,482 Q558,425 568,378 Q577,338 587,312 Q594,292 600,276 Q606,292 613,312 Q623,338 632,378 Q642,425 624,482" fill="#ff8800" opacity="0.9"/>
  <path d="M582,482 Q566,437 574,396 Q581,362 589,338 Q595,318 600,302 Q605,318 611,338 Q619,362 626,396 Q634,437 618,482" fill="#ffaa00" opacity="0.95"/>
  <!-- 炎 コア -->
  <path d="M590,482 Q577,452 582,422 Q587,396 594,374 Q597,358 600,344 Q603,358 606,374 Q613,396 618,422 Q623,452 610,482" fill="#ffcc22" opacity="0.95"/>
  <path d="M596,482 Q587,460 590,438 Q594,418 599,400 Q601,390 600,378 Q602,390 604,400 Q607,418 610,438 Q613,460 604,482" fill="#ffee66"/>
  <!-- 火の粉 -->
  <circle cx="570" cy="340" r="3" fill="#ff8800" opacity="0.8"/>
  <circle cx="620" cy="300" r="2.5" fill="#ffaa00" opacity="0.7"/>
  <circle cx="548" cy="390" r="2" fill="#ff6600" opacity="0.6"/>
  <circle cx="650" cy="360" r="3" fill="#ff8800" opacity="0.65"/>
  <circle cx="580" cy="260" r="2" fill="#ffcc44" opacity="0.5"/>
  <circle cx="635" cy="250" r="2.5" fill="#ffcc44" opacity="0.45"/>
  ${label("焚き火台", "BONFIRE")}
  ${branding}
</svg>`,
  },

  // ── backpack ──────────────────────────────
  {
    slug: "backpack",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#0a2000"/>
      <stop offset="40%" stop-color="#1a5a30"/>
      <stop offset="100%" stop-color="#0d3a18"/>
    </linearGradient>
    <linearGradient id="pack" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="#4a7a2a"/>
      <stop offset="100%" stop-color="#2a5018"/>
    </linearGradient>
    <filter id="shadow"><feDropShadow dx="6" dy="8" stdDeviation="10" flood-color="black" flood-opacity="0.5"/></filter>
    <filter id="blur3"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${stars(45, 22)}
  <!-- 山 稜線 -->
  <polygon points="0,630 180,200 360,630" fill="#081a04"/>
  <polygon points="120,630 350,140 580,630" fill="#0d2608"/>
  <polygon points="420,630 640,200 870,630" fill="#081a04"/>
  <polygon points="650,630 900,160 1150,630" fill="#0d2608"/>
  <polygon points="880,630 1100,220 1200,400 1200,630" fill="#081a04"/>
  <!-- 雪山キャップ -->
  <polygon points="350,140 310,200 390,200" fill="white" opacity="0.7"/>
  <polygon points="640,200 605,255 675,255" fill="white" opacity="0.6"/>
  <!-- 地面 -->
  <path d="M0,475 Q300,458 600,468 Q900,480 1200,462 L1200,630 L0,630 Z" fill="#0a2008"/>
  <!-- 岩 -->
  <ellipse cx="380" cy="476" rx="55" ry="22" fill="#151e10"/>
  <ellipse cx="820" cy="472" rx="42" ry="18" fill="#151e10"/>
  <!-- バックパック -->
  <g transform="translate(600,360)" filter="url(#shadow)">
    <!-- 本体 -->
    <path d="M-105,-170 Q-115,-180 -110,-200 Q-100,-230 -70,-240 Q-40,-248 0,-248 Q40,-248 70,-240 Q100,-230 110,-200 Q115,-180 105,-170 Q115,-120 115,60 Q115,110 105,130 Q85,150 0,155 Q-85,150 -105,130 Q-115,110 -115,60 Q-115,-120 -105,-170 Z" fill="url(#pack)"/>
    <!-- 本体ハイライト -->
    <path d="M-95,-160 Q-100,-120 -100,60" stroke="#5a9030" stroke-width="3" fill="none" opacity="0.4" stroke-linecap="round"/>
    <!-- フロントポケット -->
    <path d="M-80,20 Q-82,80 -78,110 Q-60,125 0,128 Q60,125 78,110 Q82,80 80,20 Q60,10 0,8 Q-60,10 -80,20 Z" fill="#3a6020" stroke="#305018" stroke-width="1.5"/>
    <!-- ポケットジッパー -->
    <path d="M-68,60 Q0,50 68,60" stroke="#888888" stroke-width="2.5" fill="none" opacity="0.6"/>
    <circle cx="68" cy="60" r="5" fill="#aaaaaa" opacity="0.7"/>
    <!-- トップジッパー -->
    <path d="M-90,-165 Q0,-175 90,-165" stroke="#888888" stroke-width="3" fill="none" opacity="0.6"/>
    <!-- サイドポケット 左 -->
    <path d="M-115,0 Q-125,-20 -120,-50 Q-118,-70 -115,-60" stroke="#305018" stroke-width="2" fill="#3a6020" opacity="0.6"/>
    <!-- サイドポケット 右 -->
    <path d="M115,0 Q125,-20 120,-50 Q118,-70 115,-60" stroke="#305018" stroke-width="2" fill="#3a6020" opacity="0.6"/>
    <!-- ショルダーストラップ左 -->
    <path d="M-80,-200 Q-130,-220 -140,-160 Q-145,-100 -130,20" stroke="#2a5018" stroke-width="18" fill="none" stroke-linecap="round"/>
    <!-- ショルダーストラップ右 -->
    <path d="M80,-200 Q130,-220 140,-160 Q145,-100 130,20" stroke="#2a5018" stroke-width="18" fill="none" stroke-linecap="round"/>
    <!-- チェストストラップ -->
    <line x1="-128" y1="-100" x2="128" y2="-100" stroke="#4a7a28" stroke-width="8" stroke-linecap="round"/>
    <!-- ウエストベルト -->
    <path d="M-115,100 Q-150,110 -160,120" stroke="#3a6020" stroke-width="14" fill="none" stroke-linecap="round"/>
    <path d="M115,100 Q150,110 160,120" stroke="#3a6020" stroke-width="14" fill="none" stroke-linecap="round"/>
    <!-- トップハンドル -->
    <path d="M-28,-235 Q0,-255 28,-235" stroke="#2a5018" stroke-width="12" fill="none" stroke-linecap="round"/>
  </g>
  ${label("バックパック", "BACKPACK")}
  ${branding}
</svg>`,
  },

  // ── power ─────────────────────────────────
  {
    slug: "power",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0%" stop-color="#020818"/>
      <stop offset="50%" stop-color="#041428"/>
      <stop offset="100%" stop-color="#061820"/>
    </linearGradient>
    <linearGradient id="device" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0%" stop-color="#2a3a4a"/>
      <stop offset="100%" stop-color="#141e28"/>
    </linearGradient>
    <linearGradient id="screen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#22cc88"/>
      <stop offset="100%" stop-color="#1a9966"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#22cc88" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#22cc88" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow"><feDropShadow dx="8" dy="10" stdDeviation="12" flood-color="black" flood-opacity="0.6"/></filter>
    <filter id="ledglow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${stars(90, 63)}
  <!-- 地面 -->
  <path d="M0,500 Q400,488 600,494 Q900,504 1200,490 L1200,630 L0,630 Z" fill="#030c14"/>
  <!-- デバイス全体 グロー -->
  <ellipse cx="600" cy="370" rx="300" ry="180" fill="url(#glow)"/>
  <!-- ポータブル電源本体 -->
  <g transform="translate(600,360)" filter="url(#shadow)">
    <!-- 本体 -->
    <rect x="-200" y="-130" width="400" height="260" rx="18" fill="url(#device)"/>
    <!-- 本体ハイライト上 -->
    <rect x="-196" y="-126" width="392" height="10" rx="8" fill="white" opacity="0.06"/>
    <!-- ディスプレイパネル -->
    <rect x="-100" y="-90" width="140" height="80" rx="6" fill="#0a1420"/>
    <rect x="-96" y="-86" width="132" height="72" rx="4" fill="url(#screen)" opacity="0.9" filter="url(#ledglow)"/>
    <!-- バッテリー表示 -->
    <text x="-30" y="-50" font-family="'Helvetica Neue','Arial',monospace" font-size="32" font-weight="700" fill="white" text-anchor="middle" opacity="0.95">87%</text>
    <text x="-30" y="-28" font-family="'Helvetica Neue','Arial',monospace" font-size="12" fill="white" text-anchor="middle" opacity="0.7">BATTERY</text>
    <!-- バッテリーバー -->
    <rect x="-88" y="-12" width="120" height="8" rx="4" fill="#0a2818"/>
    <rect x="-88" y="-12" width="105" height="8" rx="4" fill="#33ee99" opacity="0.9"/>
    <!-- AC出力ポート -->
    <rect x="60" y="-85" width="80" height="55" rx="5" fill="#0a1218"/>
    <rect x="65" y="-80" width="70" height="45" rx="3" fill="#111a22"/>
    <!-- ACコンセント穴 -->
    <circle cx="87" cy="-65" r="6" fill="#060e14"/>
    <circle cx="113" cy="-65" r="6" fill="#060e14"/>
    <ellipse cx="100" cy="-50" rx="6" ry="5" fill="#060e14"/>
    <text x="100" y="-20" font-family="'Helvetica Neue','Arial',sans-serif" font-size="10" fill="#4488aa" text-anchor="middle" opacity="0.8">AC OUT</text>
    <!-- USB-Aポート -->
    <rect x="-190" y="-60" width="38" height="22" rx="3" fill="#0a1218"/>
    <rect x="-186" y="-56" width="30" height="14" rx="2" fill="#080e16"/>
    <text x="-171" y="-26" font-family="'Helvetica Neue','Arial',sans-serif" font-size="9" fill="#4488aa" text-anchor="middle" opacity="0.7">USB</text>
    <!-- USB-Cポート -->
    <rect x="-190" y="-20" width="38" height="20" rx="3" fill="#0a1218"/>
    <ellipse cx="-171" cy="-10" rx="12" ry="6" fill="#080e16"/>
    <text x="-171" y="14" font-family="'Helvetica Neue','Arial',sans-serif" font-size="9" fill="#4488aa" text-anchor="middle" opacity="0.7">USB-C</text>
    <!-- 電源ボタン -->
    <circle cx="155" cy="60" r="26" fill="#0a1628"/>
    <circle cx="155" cy="60" r="22" fill="#0d1e30"/>
    <circle cx="155" cy="60" r="16" fill="#22cc88" opacity="0.9" filter="url(#ledglow)"/>
    <!-- 電源アイコン -->
    <circle cx="155" cy="60" r="9" stroke="white" stroke-width="2.5" fill="none" opacity="0.9" stroke-dasharray="40 14" stroke-dashoffset="7"/>
    <line x1="155" y1="51" x2="155" y2="60" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.9"/>
    <!-- ハンドル -->
    <path d="M-140,-130 Q-140,-155 -120,-165 Q-80,-175 -40,-170 Q0,-166 0,-158 Q0,-166 40,-170 Q80,-175 120,-165 Q140,-155 140,-130" stroke="#2a3a4a" stroke-width="14" fill="#1a2838" stroke-linecap="round"/>
    <!-- ベント穴 -->
    <circle cx="-50" cy="95" r="4" fill="#080e16" opacity="0.6"/>
    <circle cx="-35" cy="95" r="4" fill="#080e16" opacity="0.6"/>
    <circle cx="-20" cy="95" r="4" fill="#080e16" opacity="0.6"/>
    <circle cx="-5" cy="95" r="4" fill="#080e16" opacity="0.6"/>
  </g>
  <!-- ケーブル -->
  <path d="M400,365 Q360,400 350,440 Q348,480 370,500" stroke="#1a2838" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M800,365 Q840,400 850,440 Q852,480 830,500" stroke="#1a2838" stroke-width="10" fill="none" stroke-linecap="round"/>
  ${label("ポータブル電源", "PORTABLE POWER")}
  ${branding}
</svg>`,
  },
];

// ──────────────────────────────────────────────
// 変換実行
// ──────────────────────────────────────────────
(async () => {
  for (const cat of categories) {
    const outPath = path.join(OUT, `${cat.slug}.png`);
    await sharp(Buffer.from(cat.svg))
      .png({ compressionLevel: 8 })
      .toFile(outPath);
    console.log(`✅ ${cat.slug}.png`);
  }
  console.log(`\n🎉 全${categories.length}枚を ${OUT} に保存しました`);
})();
