// Zoomed views: SHOT_PASSWORD=… node scripts/shots-look.mjs <baseUrl> <tag> <name:x,y,z,zoom[,tod[,deskAll]]> ... → shots/v3/<tag>-<name>.png
// deskAll=1 seats every bot at its desk in this headless page only (a screenshot pose, never sent to the API).
import { chromium } from 'playwright';
const [BASE, TAG, ...VIEWS] = process.argv.slice(2);
const OUT = new URL('../shots/v3/', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const errs = [];
for (const v of VIEWS) {
  const [name, rest] = v.split(':'); const [x, y, z, zoom, tod = 'day', deskAll = '0'] = rest.split(',');
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(e.message));
  const q = `/?hq=1&tod=${tod}${process.env.Q || ""}`;
  await page.goto(BASE + q, { waitUntil: 'networkidle' });
  if (page.url().includes('/login')) { await page.fill('input[name=password]', process.env.SHOT_PASSWORD); await Promise.all([page.waitForNavigation(), page.click('button[type=submit]')]); await page.goto(BASE + q, { waitUntil: 'networkidle' }); }
  await page.waitForFunction(() => window.__hq && document.querySelector('#feedtext').textContent !== 'connecting…', null, { timeout: 90000 });
  await page.waitForTimeout(2500);
  await page.evaluate(([x, y, z, zoom, deskAll]) => { const H = window.__hq, c = H.camera; H.controls.maxZoom = 30;
    if (deskAll === '1') H.bots.forEach((b) => { b.want = 'working'; H.place(b, 'desk'); });
    c.zoom = zoom; c.updateProjectionMatrix(); H.controls.update(); c.updateMatrixWorld();
    const [px, py] = H.project(x, y, z); const upp = (c.right - c.left) / c.zoom / innerWidth;
    const r = new (c.position.constructor)().setFromMatrixColumn(c.matrixWorld, 0), u = new (c.position.constructor)().setFromMatrixColumn(c.matrixWorld, 1);
    const d = r.multiplyScalar((px - 560) * upp).add(u.multiplyScalar(-(py - 450) * upp)); c.position.add(d); H.controls.target.add(d); c.updateMatrixWorld(); H.controls.update(); }, [+x, +y, +z, +zoom, deskAll]);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}${TAG}-${name}.png` }); console.log('shot', name); await page.close();
}
console.log('errors', errs); await browser.close();
