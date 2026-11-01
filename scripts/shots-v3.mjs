// Usage: SHOT_PASSWORD=… node scripts/shots-v3.mjs <baseUrl> <tag>   → shots/v3/<tag>-*.png
// Zoom shots: pan a world point to screen center (drag), then wheel-zoom. Uses __hq.project when present, else fixed pixels.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = process.argv[2] || 'http://127.0.0.1:8787';
const TAG = process.argv[3] || 'local';
const PW = process.env.SHOT_PASSWORD;
const OUT = new URL('../shots/v3/', import.meta.url).pathname; mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const errs = [];
const VW = 1440, VH = 900;
async function open(ctx, q) {
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(BASE + '/' + q, { waitUntil: 'networkidle' });
  if (page.url().includes('/login')) {
    await page.fill('input[name=password]', PW);
    await Promise.all([page.waitForNavigation(), page.click('button[type=submit]')]);
    if (q) await page.goto(BASE + '/' + q, { waitUntil: 'networkidle' });
  }
  await page.waitForFunction(() => window.__hq && document.querySelector('#feedtext').textContent !== 'connecting…', null, { timeout: 90000 });
  await page.waitForTimeout(3000);
  return page;
}
async function zoomTo(page, world, px, clicks) {
  let p = px;
  const proj = await page.evaluate((w) => window.__hq.project ? window.__hq.project(...w) : null, world);
  if (proj) p = proj;
  await page.mouse.move(p[0], p[1]); await page.mouse.down(); await page.mouse.move(VW / 2, VH / 2, { steps: 12 }); await page.mouse.up();
  await page.waitForTimeout(400);
  for (let i = 0; i < clicks; i++) { await page.mouse.wheel(0, -120); await page.waitForTimeout(120); }
  await page.waitForTimeout(1800);
}
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
const shots = [
  ['full-day', '?hq=1&tod=day'],
  ['full-night', '?hq=1&tod=night'],
  ['lounge', '?hq=1&tod=day', [7.35, 0.6, 7.5], [905, 565], 6],
  ['desks-north', '?hq=1&tod=day&simulate=1', [-7, 0.6, -9], [560, 330], 5, 25000],
  ['gym-breakroom', '?hq=1&tod=day', [15.5, 0.6, 9], [1110, 520], 5],
  ['usage-board', '?hq=1&tod=day', [-0.2, 2.2, -13.9], [632, 222], 7],
  ['building-below', '?hq=1&tod=evening', [8, -6, 12], [1000, 800], 2],
];
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
for (const [name, q, world, px, clicks, wait] of shots) {
  if (only && !only.includes(name)) continue;
  const p = await open(ctx, q);
  if (wait) await p.waitForTimeout(wait);
  if (world) await zoomTo(p, world, px, clicks);
  await p.screenshot({ path: `${OUT}${TAG}-${name}.png` }); console.log('shot', name);
  await p.close();
}
const p = await open(ctx, '');
console.log('usage', await p.evaluate(() => JSON.stringify(window.__hq.live().usage)));
console.log('fps', await p.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => { n++; performance.now() - t0 < 3000 ? requestAnimationFrame(f) : r(n / 3); }; requestAnimationFrame(f); })));
console.log('errors:', errs.length ? errs.slice(0, 8) : 'none');
await browser.close();
