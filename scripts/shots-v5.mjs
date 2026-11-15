// Usage: node scripts/shots-v5.mjs <baseUrl> [tag]  → screenshots/<tag>-*.png (v5: office + rec deck + two residence floors)
// Local preview (vite preview) has no /api, so the feed reads "feed error" and bots idle — fine for layout shots.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = process.argv[2] || 'http://127.0.0.1:4173';
const TAG = process.argv[3] || 'v5';
const PW = process.env.SHOT_PASSWORD;
const OUT = new URL('../screenshots/', import.meta.url).pathname; mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const errs = [];
const VW = 1440, VH = 900;
async function open(ctx, q) {
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && !/404|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await page.goto(BASE + '/' + q, { waitUntil: 'networkidle' });
  if (page.url().includes('/login') && PW) { await page.fill('input[name=password]', PW); await Promise.all([page.waitForNavigation(), page.click('button[type=submit]')]); if (q) await page.goto(BASE + '/' + q, { waitUntil: 'networkidle' }); }
  await page.waitForFunction(() => window.__hq && document.querySelector('#feedtext').textContent !== 'connecting…', null, { timeout: 120000 });
  await page.waitForTimeout(2500);
  return page;
}
async function zoomTo(page, world, clicks) {
  const p = await page.evaluate((w) => window.__hq.project(...w), world);
  await page.mouse.move(p[0], p[1]); await page.mouse.down(); await page.mouse.move(VW / 2, VH / 2, { steps: 12 }); await page.mouse.up();
  await page.waitForTimeout(300);
  for (let i = 0; i < clicks; i++) { await page.mouse.wheel(0, -120); await page.waitForTimeout(100); }
  await page.waitForTimeout(1500);
}
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
const F = (k) => -k * 4.3;
const shots = [
  ['office', '?hq=1&ao=0&bloom=0&tod=day&sleep=0'],
  ['office-desks', '?hq=1&ao=0&bloom=0&tod=day&sleep=0', [-4, 0.6, -8], 4],
  ['office-south', '?hq=1&ao=0&bloom=0&tod=day&sleep=0', [-6, 0.6, 8], 4],
  ['rec-deck', '?hq=1&ao=0&bloom=0&tod=day&floor=rec&sleep=0'],
  ['rec-pool', '?hq=1&ao=0&bloom=0&tod=day&floor=rec&sleep=0', [5, F(1) + 0.6, -9], 5],
  ['rec-kitchen-lounge', '?hq=1&ao=0&bloom=0&tod=day&floor=rec&sleep=0', [-14, F(1) + 0.6, 0], 4],
  ['rec-games-tennis', '?hq=1&ao=0&bloom=0&tod=day&floor=rec&sleep=0', [4, F(1) + 0.6, 9], 4],
  ['residences-a', '?hq=1&ao=0&bloom=0&tod=evening&floor=apt&sleep=1'],
  ['residences-a-zoom', '?hq=1&ao=0&bloom=0&tod=evening&floor=apt&sleep=1', [-10, F(2) + 0.6, -8], 4],
  ['residences-b', '?hq=1&ao=0&bloom=0&tod=evening&floor=apt2&sleep=1'],
  ['residences-b-zoom', '?hq=1&ao=0&bloom=0&tod=evening&floor=apt2&sleep=1', [-8, F(3) + 0.6, 9], 4],
  ['night-exterior', '?hq=1&ao=0&bloom=0&tod=night&sleep=0'],
];
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
for (const [name, q, world, clicks] of shots) {
  if (only && !only.includes(name)) continue;
  const p = await open(ctx, q);
  if (q.includes('sleep=1')) await p.waitForTimeout(1500);
  if (world) await zoomTo(p, world, clicks);
  await p.screenshot({ timeout: 180000, path: `${OUT}${TAG}-${name}.png` }); console.log('shot', name);
  await p.close();
}
console.log('errors:', errs.length ? [...new Set(errs)].slice(0, 10) : 'none');
await browser.close();
