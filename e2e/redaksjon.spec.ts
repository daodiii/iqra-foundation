import { expect, test } from '@playwright/test';
import sharp from 'sharp';

/**
 * The editor, end to end on the production build (the second server in playwright.config.ts: the
 * test editor, saving into a throwaway folder). A news post is written with a large photo as its
 * cover, saved, found on the start page, edited and deleted.
 */
const BASE = 'http://localhost:3100';

test('the editor is off on the plain build', async ({ request }) => {
  expect((await request.get('/redaksjon')).status()).toBe(404);
  expect((await request.get('/api/redaksjon/nyheter')).status()).toBe(404);
});

test('a news post goes from the sheet to the start page and back out', async ({ page, request }, info) => {
  test.setTimeout(120_000);
  const title = `Åpen dag ${info.project.name} ${Date.now()}`;

  // A phone photo: 6000 × 4000, several megabytes.
  const w = 6000, h = 4000;
  const raw = Buffer.alloc(w * h * 3);
  for (let i = 0; i < raw.length; i++) raw[i] = ((i * 2654435761) >>> 24) ^ ((i / 3 / w) & 0xff);
  const photo = await sharp(raw, { raw: { width: w, height: h, channels: 3 } }).jpeg({ quality: 90 }).toBuffer();

  await page.goto(`${BASE}/redaksjon`);
  await expect(page.getByRole('heading', { name: 'Hva vil du dele i dag?' })).toBeVisible();
  await page.getByRole('link', { name: /Ny nyhet/ }).click();
  // The text editor mounts after the page's script has loaded; a loaded machine can take over 5 s.
  await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 15_000 });

  const lagre = page.getByRole('button', { name: 'Lagre' }).locator('visible=true').first();
  await expect(lagre).toBeDisabled();

  await page.getByRole('textbox', { name: 'Overskrift', exact: true }).fill(title);
  await page.getByRole('textbox', { name: 'Ingress', exact: true }).fill('Kom innom og se lokalene.');
  await page.locator('.ProseMirror').click();
  await page.keyboard.type('Velkommen til ');
  await page.keyboard.press('ControlOrMeta+b');
  await page.keyboard.type('åpen dag');

  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /Legg til bilde/ }).click();
  await (await chooser).setFiles({ name: 'IMG_2041.jpg', mimeType: 'image/jpeg', buffer: photo });
  await expect(page.locator('#redaksjon-alt')).toBeVisible({ timeout: 30_000 });
  await expect(lagre).toBeDisabled(); // a picture needs its description
  await page.locator('#redaksjon-alt').fill('Folk samlet i et lyst rom');
  await page.getByText('Vis på nettsiden', { exact: true }).click();
  await expect(page.getByRole('switch')).toBeChecked();

  const sent = page.waitForRequest((r) => r.url().includes('/api/redaksjon/nyheter') && r.method() === 'POST');
  await lagre.click();
  await expect(page.getByRole('status').locator('visible=true').first()).toContainText('Lagret', { timeout: 30_000 });
  const body = JSON.parse((await sent).postData() ?? '{}') as { uploads: { name: string; data: string }[] };
  expect(body.uploads).toHaveLength(1);
  const webp = Buffer.from(body.uploads[0].data, 'base64');
  const meta = await sharp(webp).metadata();
  expect(meta.format).toBe('webp');
  expect(meta.width).toBeLessThanOrEqual(2000);
  expect(webp.length).toBeLessThan(1.5 * 1024 * 1024);

  const slug = new URL(page.url()).pathname.split('/').pop()!;
  expect(slug).toMatch(/^apen-dag-/);

  // On the start page, marked as on the site.
  await page.goto(`${BASE}/redaksjon`);
  const row = page.getByRole('link', { name: new RegExp(title) });
  await expect(row).toBeVisible();
  await expect(row).toContainText('På nettsiden');

  // Edit and save again.
  await row.click();
  const ingress = page.getByRole('textbox', { name: 'Ingress', exact: true });
  await expect(ingress).toHaveValue('Kom innom og se lokalene.');
  await ingress.fill('Kom innom, se lokalene og møt oss.');
  await page.getByRole('button', { name: 'Lagre' }).locator('visible=true').first().click();
  await expect(page.getByRole('status').locator('visible=true').first()).toContainText('Lagret', { timeout: 30_000 });

  const opened = await (await request.get(`${BASE}/api/redaksjon/nyheter/${slug}`)).json();
  expect(opened.fields.summary).toBe('Kom innom, se lokalene og møt oss.');
  expect(opened.fields.body).toBe('Velkommen til **åpen dag**\n');
  expect(opened.fields.image.src).toBe(`/opplastet/nyheter/${slug}/${body.uploads[0].name}`);

  // No sideways scroll on the writing page.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  // Delete (the button comes with the section lists; the API is what it will call).
  expect((await request.delete(`${BASE}/api/redaksjon/nyheter/${slug}?version=${encodeURIComponent(opened.version)}`)).status()).toBe(204);
  await page.goto(`${BASE}/redaksjon`);
  await expect(page.getByRole('link', { name: new RegExp(title) })).toHaveCount(0);
});
