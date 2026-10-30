// Usage: node scripts/shots.mjs <baseUrl> <prefix-mode: local|live>
// Password comes from env SHOT_PASSWORD (never printed).
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
const BASE = process.argv[2] || 'http://127.0.0.1:8787';
const MODE = process.argv[3] || 'local';
const PW = process.env.SHOT_PASSWORD;
const OUT = new URL('../shots/', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const errs = [];
async function login(page) {
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.fill('input[name=password]', PW);
  await Promise.all([page.waitForNavigation(), page.click('button[type=submit]')]);
  await page.waitForFunction(() => window.__hq && document.querySelector('#feedtext').textContent !== 'connecting…', null, { timeout: 30000 });
  await page.waitForTimeout(2500);
}
const status = (...a) => execFileSync('bash', [new URL('./status.sh', import.meta.url).pathname, ...a], { encoding: 'utf8' }).trim();
const desk = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const page = await desk.newPage();
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
if (MODE === 'local') {
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: OUT + '01-login.png' });
  await login(page);
  await page.screenshot({ path: OUT + '02-office-idle.png' });
  await page.waitForTimeout(1000); await page.screenshot({ path: OUT + '06a-idle.png' });
  await page.waitForTimeout(1000); await page.screenshot({ path: OUT + '06b-idle.png' });
  // live test statuses (local only), then reset
  console.log(status('moneybot', 'working', 'Testing the live status feed'));
  console.log(status('kimchi', 'waiting', 'Waiting on a decision'));
  console.log(status('scribe', 'error', 'Test error marker'));
  console.log(status('superseller', 'done', 'Test handoff'));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(9000);
  await page.hover('.tag:has-text("Kimchi")').catch(() => {});
  await page.screenshot({ path: OUT + '03-office-live.png' });
  for (const b of ['moneybot', 'kimchi', 'scribe', 'superseller']) console.log(status(b, 'idle', ''));
  const sim = await desk.newPage();
  await sim.goto(BASE + '/?simulate=1', { waitUntil: 'networkidle' }); await sim.waitForTimeout(14000);
  await sim.screenshot({ path: OUT + '04-simulate.png' });
  await sim.close();
}
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const pp = await phone.newPage();
pp.on('pageerror', (e) => errs.push('phone: ' + e.message));
await login(pp);
await pp.screenshot({ path: OUT + (MODE === 'local' ? '05-phone.png' : '08-live-phone.png') });
if (MODE === 'live') await page.goto(BASE + '/').then(() => login(page)).then(() => page.screenshot({ path: OUT + '07-live-desktop.png' }));
const gl = await page.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2'); return c ? c.getParameter(c.VERSION) : 'none'; });
console.log('webgl:', gl, '| errors:', errs.length ? errs.slice(0, 5) : 'none');
await browser.close();
