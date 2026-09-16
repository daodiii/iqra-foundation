// Drive Keystatic's admin (local mode, next dev on 3031) to create one event, then show the file it wrote.
import { chromium } from 'file:///C:/Users/daodi/code/iqra-foundation-identitet/node_modules/playwright/index.mjs';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

// Output goes under $SCRATCH (or ./.scratch, gitignored); pass SCRATCH=<dir> to put it elsewhere.
const OUT_ROOT = (process.env.SCRATCH ?? '.scratch') + '/keystatic';

const ROOT = 'C:/Users/daodi/code/iqra-foundation-identitet';
const OUT = OUT_ROOT;
const dir = path.join(ROOT, 'content/arrangementer');
const before = new Set(readdirSync(dir));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('console', (m) => { if (m.type() === 'error') console.log('console error:', m.text().slice(0, 200)); });
await page.goto('http://localhost:3031/keystatic/collection/arrangementer/create', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${OUT}/01-create.png` });

await page.getByLabel('Tittel').fill('Testkveld');
await page.getByLabel('Sted').fill('Oslo');
await page.getByLabel('Tekst').fill('En test.');
await page.getByLabel('Klokkeslett').fill('18:00');
await page.getByLabel('Bildebeskrivelse').fill('');
// What is the date field? Print its markup, then fill it the way it wants.
const date = page.getByLabel('Dato').first();
const html = await date.evaluate((e) => e.outerHTML.slice(0, 400));
console.log('date field:', html);
const type = await date.evaluate((e) => e.getAttribute('type'));
if (type === 'date') {
  await date.fill('2027-01-20');
} else {
  await date.click();
  await page.keyboard.type('01202027');
}
await page.screenshot({ path: `${OUT}/02-filled.png` });

await page.getByRole('button', { name: /^Create$/ }).click();
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/03-after.png` });
console.log('url after save:', page.url());

const after = readdirSync(dir).filter((f) => !before.has(f));
console.log('new files:', after);
for (const f of after) console.log(f, '=>', readFileSync(path.join(dir, f), 'utf8'));
// any image directory created?
const imgDir = path.join(ROOT, 'public/media/arrangementer');
console.log('image dir exists:', existsSync(imgDir), existsSync(imgDir) ? readdirSync(imgDir) : '');
await browser.close();
