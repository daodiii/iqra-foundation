/**
 * The share card: `app/opengraph-image.png`, 1200×630.
 *
 * The logo on its turquoise plate — the guide's main logo — with the red thread under it,
 * set in General Sans from the repo's own font files, rendered by headless Chromium so it
 * is pixel-exact with the site. Run `node scripts/share-image.mjs` after changing the logo,
 * the thread or the fonts; the PNG is committed because the build does not run browsers.
 *
 * Next serves `app/opengraph-image.png` as the Open Graph and Twitter image of every route
 * and reads `app/opengraph-image.alt.txt` beside it as its alt text.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const read = (p) => readFileSync(path.join(root, p));
const dataUrl = (p, type) => `data:${type};base64,${read(p).toString('base64')}`;

// The thread, read from the content so this cannot drift from the site.
const { brief } = await import(pathToFileURL(path.join(root, 'content/brief.no.ts')).href);
const line = brief.thread.line;
const alt = `${brief.thread.name}. ${line}`;

const html = `<!doctype html>
<html lang="nb"><head><meta charset="utf-8">
<style>
  @font-face { font-family: 'General Sans'; font-weight: 500; src: url('${dataUrl('brand/fonts/general-sans/GeneralSans-Medium.woff2', 'font/woff2')}') format('woff2'); }
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
  body { background: #67c1bf; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 44px; font-family: 'General Sans', sans-serif; }
  img { width: 540px; height: auto; display: block; }
  p { margin: 0; color: #2c394b; font-size: 30px; font-weight: 500; letter-spacing: 0.02em; }
  p b { color: #ab5261; font-weight: 500; }
</style></head>
<body>
  <img src="${dataUrl('public/brand/iqra-logo.svg', 'image/svg+xml')}" alt="">
  <p>${line.replace(/\./g, '<b>.</b>')}</p>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const png = await page.screenshot({ type: 'png' });
await browser.close();

writeFileSync(path.join(root, 'app/opengraph-image.png'), png);
writeFileSync(path.join(root, 'app/opengraph-image.alt.txt'), alt + '\n');
console.log(`app/opengraph-image.png ${png.length} bytes; alt: ${alt}`);
