// Uniform screenshots of a running direction: node shoot.mjs <port> <name> [worktree]
// Shoots / and /vart-arbeid at 1440×900, 1280×720, 390×844 (DPR 2, mobile), full page and the fold,
// with the GPU flags so any simulation runs; scrolls in steps first so deferred builds land.
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const [port, name, worktree = 'iqra-foundation-identitet'] = process.argv.slice(2);
// Output goes under $SCRATCH (or ./.scratch, gitignored); pass SCRATCH=<dir> to put it elsewhere.
const OUT_ROOT = (process.env.SCRATCH ?? '.scratch') + '/shots';

if (!port || !name) { console.error('usage: node shoot.mjs <port> <name> [worktree]'); process.exit(1); }
const { chromium, devices } = await import(`file:///C:/Users/daodi/code/${worktree}/node_modules/playwright/index.mjs`);
const OUT = path.join(OUT_ROOT, name);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu', '--disable-gpu-sandbox'],
});
const sizes = [
  { tag: '1440', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  { tag: '1280', viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 },
  { tag: '1024', viewport: { width: 1024, height: 768 }, deviceScaleFactor: 2 },
  { tag: '390', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices['Pixel 7'].userAgent },
];
const pages = [['home', '/'], ['arbeid', '/vart-arbeid']];
const errors = [];
for (const s of sizes) {
  const context = await browser.newContext({ viewport: s.viewport, deviceScaleFactor: s.deviceScaleFactor, isMobile: s.isMobile, hasTouch: s.hasTouch, userAgent: s.userAgent });
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${s.tag} ${m.text().slice(0, 160)}`); });
  page.on('pageerror', (e) => errors.push(`${s.tag} pageerror ${e.message.slice(0, 160)}`));
  for (const [tag, url] of pages) {
    await page.goto(`http://localhost:${port}${url}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    // scroll in steps so IntersectionObserver-deferred work lands, then back to the top
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += Math.round(s.viewport.height * 0.6)) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(350);
    }
    await page.waitForTimeout(1600);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, `${tag}-${s.tag}-fold.png`), animations: 'disabled' });
    await page.screenshot({ path: path.join(OUT, `${tag}-${s.tag}-full.png`), fullPage: true, animations: 'disabled' });
    const sw = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    if (sw[0] > sw[1]) errors.push(`${s.tag} ${url}: horizontal overflow ${sw[0]} > ${sw[1]}`);
  }
  if (s.isMobile) {
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
    const btn = page.getByRole('button', { name: /meny/i }).first();
    if (await btn.count()) { await btn.click(); await page.waitForTimeout(400); await page.screenshot({ path: path.join(OUT, `home-${s.tag}-drawer.png`), animations: 'disabled' }); }
  }
  await context.close();
}
await browser.close();
console.log(`shots in ${OUT}`);
console.log(errors.length ? 'ISSUES:\n' + errors.join('\n') : 'no console errors, no horizontal overflow');
