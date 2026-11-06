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
const usage = async (p) => p.evaluate(() => { const t = document.body.innerText; const m = t.match(/[^\n]*(left|reset)[^\n]*/gi); return m ? m.slice(0,4) : []; });
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
let p = await open(desk, ''); await p.screenshot({ path: OUT + '07-live-desktop.png' }); console.log('desk usage', await usage(p));
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
p = await open(phone, ''); await p.screenshot({ path: OUT + '08-live-phone.png' }); console.log('phone usage', await usage(p));
console.log('errors', errs.slice(0,5)); await browser.close();
