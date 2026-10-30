// Usage: SHOT_PASSWORD=… node scripts/shots-v2.mjs [baseUrl]   → shots/v2/
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = process.argv[2] || 'http://127.0.0.1:8787';
const PW = process.env.SHOT_PASSWORD;
const OUT = new URL('../shots/v2/', import.meta.url).pathname; mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const errs = [];
async function open(ctx, q) {
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(BASE + '/' + q, { waitUntil: 'networkidle' });
  if (page.url().includes('/login')) {
    await page.fill('input[name=password]', PW);
    await Promise.all([page.waitForNavigation(), page.click('button[type=submit]')]);
    if (q) await page.goto(BASE + '/' + q, { waitUntil: 'networkidle' });
  }
  await page.waitForFunction(() => window.__hq && document.querySelector('#feedtext').textContent !== 'connecting…', null, { timeout: 60000 });
  await page.waitForTimeout(2500);
  return page;
}
const only = process.env.ONLY || '';
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
if (!only || only.includes('1')) { const p = await open(desk, '?hq=1&tod=day'); await p.screenshot({ path: OUT + '01-day-idle.png' });
  await p.screenshot({ path: OUT + '05a-idle.png' }); await p.waitForTimeout(1000); await p.screenshot({ path: OUT + '05b-idle.png' }); await p.close(); }
if (!only || only.includes('2')) { const p = await open(desk, '?hq=1&tod=night'); await p.screenshot({ path: OUT + '02-night.png' }); await p.close(); }
if (!only || only.includes('3')) { const p = await open(desk, '?simulate=1&hq=1&tod=day'); await p.waitForTimeout(30000); await p.screenshot({ path: OUT + '03-simulate.png' }); await p.close(); }
if (!only || only.includes('4')) {
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const p = await open(phone, '?hq=1&tod=day'); await p.screenshot({ path: OUT + '04-phone.png' });
}
if (!only || only.includes('3')) { const p = await open(desk, '?hq=1&tod=day'); console.log('fps', await p.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => { n++; performance.now() - t0 < 3000 ? requestAnimationFrame(f) : r(n / 3); }; requestAnimationFrame(f); }))); await p.close(); }
console.log('errors:', errs.length ? errs.slice(0, 8) : 'none');
await browser.close();
