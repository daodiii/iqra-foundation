/**
 * The share cards, 1200×630, one per language: `app/(no)/opengraph-image.png` and
 * `app/en/opengraph-image.png`, each with its `opengraph-image.alt.txt` (2026-11-25: until then the
 * English pages shared the Norwegian card).
 *
 * The logo on white with the thread under it in black, its dots in the site's burgundy (three
 * colours since 2026-11-20, the owner; the turquoise plate is gone),
 * set in General Sans from the repo's own font files, rendered by headless Chromium so it
 * is pixel-exact with the site. Run `node scripts/share-image.mjs` after changing the logo,
 * the thread or the fonts; the PNGs are committed because the build does not run browsers.
 *
 * Next serves each root layout's `opengraph-image.png` as the Open Graph image of every route
 * under it, and reads the `.alt.txt` beside it as its alt text.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const read = (p) => readFileSync(path.join(root, p));
const dataUrl = (p, type) => `data:${type};base64,${read(p).toString('base64')}`;

const CARDS = [
  { lang: 'nb', brief: 'content/brief.no.ts', dir: 'app/(no)' },
  { lang: 'en', brief: 'content/brief.en.ts', dir: 'app/en' },
];

const browser = await chromium.launch({ headless: true });

for (const card of CARDS) {
  // The thread, read from the content so this cannot drift from the site.
  const { brief } = await import(pathToFileURL(path.join(root, card.brief)).href);
  const line = brief.thread.line;
  const alt = `${brief.thread.name}. ${line}`;

  const html = `<!doctype html>
<html lang="${card.lang}"><head><meta charset="utf-8">
<style>
  @font-face { font-family: 'General Sans'; font-weight: 500; src: url('${dataUrl('brand/fonts/general-sans/GeneralSans-Medium.woff2', 'font/woff2')}') format('woff2'); }
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
  body { background: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 44px; font-family: 'General Sans', sans-serif; }
  img { width: 540px; height: auto; display: block; }
  p { margin: 0; color: #000000; font-size: 30px; font-weight: 500; letter-spacing: 0.02em; }
  p b { color: #67112f; font-weight: 500; }
</style></head>
<body>
  <img src="${dataUrl('public/brand/iqra-logo.svg', 'image/svg+xml')}" alt="">
  <p>${line.replace(/\./g, '<b>.</b>')}</p>
</body></html>`;

  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: 'png' });
  await page.close();

  writeFileSync(path.join(root, card.dir, 'opengraph-image.png'), png);
  writeFileSync(path.join(root, card.dir, 'opengraph-image.alt.txt'), alt + '\n');
  console.log(`${card.dir}/opengraph-image.png ${png.length} bytes; alt: ${alt}`);
}

await browser.close();
