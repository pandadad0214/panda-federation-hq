// Character close-ups: SHOT_PASSWORD=… node scripts/shots-chars.mjs <baseUrl> <tag> → shots/v3/<tag>-chars*.png
import { chromium } from 'playwright';
const BASE = process.argv[2] || 'http://127.0.0.1:8787', TAG = process.argv[3] || 'local';
const OUT = new URL('../shots/v3/', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(BASE + '/?hq=1&tod=day', { waitUntil: 'networkidle' });
if (page.url().includes('/login')) { await page.fill('input[name=password]', process.env.SHOT_PASSWORD); await Promise.all([page.waitForNavigation(), page.click('button[type=submit]')]); await page.goto(BASE + '/?hq=1&tod=day', { waitUntil: 'networkidle' }); }
await page.waitForFunction(() => window.__hq && document.querySelector('#feedtext').textContent !== 'connecting…', null, { timeout: 90000 });
await page.waitForTimeout(2000);
await page.evaluate(() => { window.__center = (x, y, z, sx, sy) => { const H = window.__hq, c = H.camera; c.updateMatrixWorld();
  const [px, py] = H.project(x, y, z); const upp = (c.right - c.left) / c.zoom / innerWidth;
  const r = new (c.position.constructor)().setFromMatrixColumn(c.matrixWorld, 0), u = new (c.position.constructor)().setFromMatrixColumn(c.matrixWorld, 1);
  const d = r.multiplyScalar((px - sx) * upp).add(u.multiplyScalar(-(py - sy) * upp)); c.position.add(d); H.controls.target.add(d); c.updateMatrixWorld(); H.controls.update(); }; });
const ZOOM = Number(process.env.ZOOM || 3.2);
for (const [name, ry, pose] of [['chars', -Math.PI / 4, 'static'], ['chars-back', Math.PI * 0.75, 'static'], ['chars-sit', -Math.PI / 4, 'sit']]) {
  await page.evaluate(([ry, pose, Z]) => { const H = window.__hq; const cx = 7.2, cz = 11.2;
    H.bots.forEach((b, i) => { b.path = []; b.root.position.set(cx + (i - 4.5) * 0.9 * 0.7071, 0, cz + (i - 4.5) * 0.9 * 0.7071); b.root.rotation.y = ry; });
    window.__pose = pose;
    const off = { x: cx - H.controls.target.x, y: 0.75 - H.controls.target.y, z: cz - H.controls.target.z };
    H.camera.position.x += off.x; H.camera.position.y += off.y; H.camera.position.z += off.z; H.controls.target.set(cx, 0.75, cz);
    H.camera.zoom = Z; H.camera.updateProjectionMatrix(); H.controls.update();
    window.__center(cx, 0.75, cz, 600, 450); }, [ry, pose, ZOOM]);
  if (pose === 'sit') await page.evaluate(() => window.__hq.bots.forEach((b) => { b.clip = null; const a = b.acts.sit; b.mixer.stopAllAction(); a.reset(); a.play(); b.mixer.update(0); a.paused = true; b.root.position.y = 0.6; }));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}${TAG}-${name}.png`, clip: { x: 20, y: 250, width: 1160, height: 400 } });
}
console.log('errors', errs); await browser.close();
