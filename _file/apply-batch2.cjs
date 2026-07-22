const fs = require('fs');
const path = require('path');

// slug -> { cardId: amzn.to URL }  (cardId matched by brand/型番 from prompt name)
const MAP = {
  'camp-chair-highback': {
    'poncotan-ultralight-highback': 'https://amzn.to/4vlyn6Y',
    'moderndeco-zerogravity': 'https://amzn.to/3SG9Cnw',
    'onetigris-dragonhide-highback': 'https://amzn.to/4w3nd6P',
    'visionpeaks-canvas-relax': 'https://amzn.to/44n6NdF',
    'ladweather-highback': 'https://amzn.to/3QAagCw',
  },
  'solar-portable-power': {
    'sp-jackery-2000': 'https://amzn.to/4w3IuNE',
    'sp-jackery-1000': 'https://amzn.to/3QXgkoI',
    'sp-ecoflow-delta3plus': 'https://amzn.to/4vx2vfY',
    'sp-fossibot-f2400': 'https://amzn.to/4afMF0w',
    'sp-ecoflow-delta3classic': 'https://amzn.to/4eYjmSN',
  },
  'sleeping-bag-temperature-guide': {
    'camdoor-winter-25': 'https://amzn.to/3QCs7sj',
    'nebukulon-230t': 'https://amzn.to/4v1Ub6U',
    'hawkgear-mummy-15': 'https://amzn.to/43MGsWi',
    'soomloom-down-650fp': 'https://amzn.to/4eFiykD',
    // mthappy-down-mummy-25 = 該当なし（設置しない）
  },
  'nanga-sleeping-bag': {
    'ns-aurora-light-450dx': 'https://amzn.to/4eHvGpm',
    'ns-auroratex-750dx': 'https://amzn.to/4eyeen6',
    'ns-aurora-light-800dx-sq': 'https://amzn.to/4eqnqLp',
    'ns-auroratex-600dx': 'https://amzn.to/4ac8AWy',
    'ns-original-schlaf-460': 'https://amzn.to/4uRN9l2',
  },
  'dutch-oven': {
    'tsbbq-dutch10': 'https://amzn.to/3QutucJ',
    'snowpeak-wattetsu26': 'https://amzn.to/4vjYGKO',
    'captainstag-ug3048': 'https://amzn.to/4vpGDTo',
    'captainstag-ug3061': 'https://amzn.to/4eCdehD',
    'tsbbq-half-dutch': 'https://amzn.to/4uVMZc5',
  },
  'solo-tent-overall': {
    'solo-tent-rank-1': 'https://amzn.to/4uWmXFV',
    'solo-tent-rank-2': 'https://amzn.to/4xJPIbi',
    'solo-tent-rank-3': 'https://amzn.to/4uWmZh1',
    'solo-tent-rank-4': 'https://amzn.to/4uXr6JD',
    'solo-tent-rank-5': 'https://amzn.to/4vZOlDD',
  },
  'solo-tent-lightweight': {
    'tomount-ny-tent': 'https://amzn.to/4w3IOfk',
    'pykes-peak-solo': 'https://amzn.to/4b3Hcdo',
    'bears-rock-hayabusa': 'https://amzn.to/3SG9fcC',
    'fieldoor-onetouch100': 'https://amzn.to/3QXHax1',
    'bundok-solo-dome': 'https://amzn.to/43S2xTh',
  },
  'sleeping-bag-winter-beginner': {
    'nanga-aurora-light-450dx': 'https://amzn.to/4uNCrvF',
    'montbell-alpine-downhugger800-3': 'https://amzn.to/4aZ0Mrd',
    'isuka-air-810ex': 'https://amzn.to/4afjMSf',
    'coleman-tasman-campsleeperex': 'https://amzn.to/43S2zun',
    'snugpak-softie-elite5': 'https://amzn.to/4gGlorU',
  },
  'lightweight-mountain-tent': {
    'ul-tent-rank-1': 'https://amzn.to/4xOrhK4',
    'ul-tent-rank-2': 'https://amzn.to/4eFtPRK',
    'ul-tent-rank-3': 'https://amzn.to/4eX3DDs',
    'ul-tent-rank-4': 'https://amzn.to/4oLJALI',
    'ul-tent-rank-5': 'https://amzn.to/4v1UrCU',
  },
  'large-tent-guide': {
    'tent-endlessbase': 'https://amzn.to/4vusmoG',
    'tent-tansu': 'https://amzn.to/4uNCPu7',
    'tent-fieldoor-dome': 'https://amzn.to/44onMMD',
    'tent-fieldoor-hexa': 'https://amzn.to/4afN2YY',
    'tent-pykespeak': 'https://amzn.to/4vteGKE',
  },
};

let totalInserted = 0;
const notFound = [];

for (const [slug, ids] of Object.entries(MAP)) {
  const fp = path.join('content/posts', slug + '.mdx');
  let raw = fs.readFileSync(fp, 'utf8');
  const crlf = raw.includes('\r\n');
  const lines = raw.split(/\r?\n/);
  const seen = {};
  const out = [];
  for (const line of lines) {
    out.push(line);
    const m = line.match(/^(\s*)id="([^"]+)"$/);
    if (m && Object.prototype.hasOwnProperty.call(ids, m[2])) {
      const indent = m[1];
      out.push(`${indent}amazonUrl="${ids[m[2]]}"`);
      seen[m[2]] = true;
      totalInserted++;
    }
  }
  for (const id of Object.keys(ids)) {
    if (!seen[id]) notFound.push(`${slug} / ${id}`);
  }
  fs.writeFileSync(fp, out.join(crlf ? '\r\n' : '\n'), 'utf8');
  console.log(`${slug}: inserted ${Object.keys(seen).length}/${Object.keys(ids).length}`);
}

console.log('--- TOTAL inserted: ' + totalInserted);
if (notFound.length) {
  console.log('--- NOT FOUND (要手動確認):');
  notFound.forEach((x) => console.log('  ' + x));
} else {
  console.log('--- all mapped ids matched a card');
}
