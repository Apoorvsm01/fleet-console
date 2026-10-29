import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const svg = readFileSync('/Users/apoorv/Projects/portfolio/public/work/design-crew/pipeline.svg', 'utf8');
const out = '/Users/apoorv/Projects/fleet-console/pipeline/screens';
const b = await chromium.launch({ executablePath: process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
for (const w of [1100, 2400]) {
  const h = Math.round((w * 1350) / 2400);
  const p = await b.newPage({ viewport: { width: w, height: h } });
  const uri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  await p.setContent(`<body style="margin:0;background:#ede7db"><img src="${uri}" width="${w}" height="${h}" style="display:block"></body>`);
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/diagram-${w}.png` });
}
await b.close();
