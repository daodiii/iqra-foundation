import { expect, test, type Page } from '@playwright/test';

/**
 * The editor's other sections, end to end on the production build (the second server in
 * playwright.config.ts: the test editor, saving into a throwaway folder). An event, a board member
 * and a resource are each written, saved, found in their list and deleted from the sheet; the
 * resource's PDF goes up through the upload route.
 */
const BASE = 'http://localhost:3100';

const lagre = (page: Page) => page.getByRole('button', { name: 'Lagre' }).locator('visible=true').first();
const saved = (page: Page) => expect(page.getByRole('status').locator('visible=true').first()).toContainText('Lagret', { timeout: 30_000 });

/** No sideways scroll at the widths the editor promises, the phone's own included. */
async function noSideways(page: Page) {
  const own = page.viewportSize();
  for (const width of [1024, 390, 320]) {
    await page.setViewportSize({ width, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `sideways scroll at ${width}`).toBe(true);
  }
  if (own) await page.setViewportSize(own);
}

/** Deletes the open entry with the panel's button and its one question; lands on the list. */
async function deleteOpen(page: Page, section: string, name: string) {
  await page.getByRole('button', { name: /^Slett / }).click();
  const ask = page.getByRole('dialog');
  await expect(ask).toContainText(`Slette «${name}»?`);
  await ask.getByRole('button', { name: 'Slett', exact: true }).click();
  await expect(page).toHaveURL(`${BASE}/redaksjon/${section}`);
  await expect(page.getByRole('link', { name: new RegExp(name) })).toHaveCount(0);
}

test('an event: written, listed, found by search, edited and deleted', async ({ page }, info) => {
  test.setTimeout(120_000);
  const title = `Foredrag ${info.project.name} ${Date.now()}`;
  await page.goto(`${BASE}/redaksjon/arrangementer/ny`);
  await expect(lagre(page)).toBeDisabled();
  await page.getByRole('textbox', { name: 'Tittel', exact: true }).fill(title);
  await page.getByRole('textbox', { name: 'Beskrivelse', exact: true }).fill('Et kveldsforedrag om lesing.');
  await page.locator('#redaksjon-dato').fill('2027-03-04');
  await page.locator('#redaksjon-tid').fill('18:00');
  await page.locator('#redaksjon-sted').fill('Furuset bibliotek');
  await page.locator('#redaksjon-pamelding').fill('ikke en lenke');
  await expect(lagre(page)).toBeDisabled(); // sign-up must be an address
  await page.locator('#redaksjon-pamelding').fill('https://example.org/pamelding');
  await lagre(page).click();
  await saved(page);

  // A second save of the new event keeps the same sheet: nothing is reloaded under the editor's hands.
  await page.locator('#redaksjon-beskrivelse').evaluate((el) => el.setAttribute('data-same', '1'));
  await page.getByRole('textbox', { name: 'Beskrivelse', exact: true }).fill('Et kveldsforedrag om lesing, for alle.');
  await lagre(page).click();
  await saved(page);
  await expect(page.locator('#redaksjon-beskrivelse[data-same="1"]')).toHaveCount(1);
  await expect(page.locator('#redaksjon-beskrivelse')).toHaveValue('Et kveldsforedrag om lesing, for alle.');
  await noSideways(page);

  await page.goto(`${BASE}/redaksjon/arrangementer`);
  await page.getByRole('searchbox').fill('ingen slik tittel');
  await expect(page.getByText('Ingen treff.')).toBeVisible();
  await page.getByRole('searchbox').fill(title.toLowerCase());
  await page.getByRole('link', { name: new RegExp(title) }).click();
  await expect(page.locator('#redaksjon-sted')).toHaveValue('Furuset bibliotek');
  await page.locator('#redaksjon-sted').fill('Furuset kulturhus');
  await lagre(page).click();
  await saved(page);
  const opened = await (await page.request.get(`${BASE}/api/redaksjon/arrangementer/${new URL(page.url()).pathname.split('/').pop()}`)).json();
  expect(opened.fields).toMatchObject({ title, start: '2027-03-04', time: '18:00', place: 'Furuset kulturhus', link: 'https://example.org/pamelding' });

  await deleteOpen(page, 'arrangementer', title);
});

test('a board member: written, in the list, deleted', async ({ page }, info) => {
  test.setTimeout(120_000);
  const name = `Kari Nordmann ${info.project.name} ${Date.now()}`;
  await page.goto(`${BASE}/redaksjon/menneskene/ny`);
  await page.getByRole('textbox', { name: 'Navn', exact: true }).fill(name);
  await expect(lagre(page)).toBeDisabled(); // a role is needed
  await page.locator('#redaksjon-rolle').fill('Styremedlem');
  await page.locator('#redaksjon-rekkefolge').fill('3');
  await page.getByRole('textbox', { name: 'Kort biografi', exact: true }).fill('Lærer og leser.');
  await lagre(page).click();
  await saved(page);
  await noSideways(page);

  const slug = new URL(page.url()).pathname.split('/').pop();
  const opened = await (await page.request.get(`${BASE}/api/redaksjon/menneskene/${slug}`)).json();
  expect(opened.fields).toMatchObject({ name, role: 'Styremedlem', order: 3, bio: 'Lærer og leser.', photo: null });

  await page.goto(`${BASE}/redaksjon/menneskene`);
  await page.getByRole('link', { name: new RegExp(name) }).click();
  await deleteOpen(page, 'menneskene', name);
});

test('a resource: needs a file, a video or a link; a PDF uploads; deleted', async ({ page }, info) => {
  test.setTimeout(120_000);
  const title = `Årsrapport ${info.project.name} ${Date.now()}`;
  await page.goto(`${BASE}/redaksjon/ressurser/ny`);
  await page.getByRole('textbox', { name: 'Tittel', exact: true }).fill(title);
  await page.getByRole('textbox', { name: 'Sammendrag', exact: true }).fill('Hva stiftelsen gjorde i fjor.');
  await expect(lagre(page)).toBeDisabled(); // nothing to offer yet

  // A wrong kind is refused before it leaves the browser.
  let chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Last opp fil' }).click();
  await (await chooser).setFiles({ name: 'bilde.png', mimeType: 'image/png', buffer: Buffer.from('png') });
  await expect(page.getByRole('alert').filter({ hasText: 'Filen må være PDF' })).toBeVisible();

  const sent = page.waitForResponse((r) => r.url().includes('/api/redaksjon/fil') && r.request().method() === 'PUT');
  chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Last opp fil' }).click();
  await (await chooser).setFiles({ name: 'Årsrapport 2025.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 årsrapport') });
  expect((await sent).status()).toBe(200);
  await expect(page.getByRole('link', { name: /arsrapport-2025\.pdf/ })).toBeVisible();

  await lagre(page).click();
  await saved(page);
  await noSideways(page);
  const slug = new URL(page.url()).pathname.split('/').pop();
  const opened = await (await page.request.get(`${BASE}/api/redaksjon/ressurser/${slug}`)).json();
  expect(opened.fields.file).toMatch(/^\/opplastet\/ressurser\/filer\/arsrapport-2025-[a-z0-9]{6}\.pdf$/);

  await deleteOpen(page, 'ressurser', title);
});

test('the news list shows all, only what is on the site, or only drafts', async ({ page }, info) => {
  const stamp = `${info.project.name} ${Date.now()}`;
  const make = async (title: string, publish: boolean) => {
    const r = await page.request.post(`${BASE}/api/redaksjon/nyheter`, {
      data: { fields: { title, date: '2026-11-24', summary: 'Kort.', image: null, publish, body: '' } },
    });
    expect(r.status()).toBe(201);
    return (await r.json()) as { slug: string; version: string };
  };
  const live = await make(`Ute ${stamp}`, true);
  const draft = await make(`Kladd ${stamp}`, false);

  await page.goto(`${BASE}/redaksjon/nyheter`);
  const row = (t: string) => page.getByRole('link', { name: new RegExp(`${t} ${stamp}`) });
  await expect(row('Ute')).toBeVisible();
  await expect(row('Kladd')).toBeVisible();
  await page.getByRole('button', { name: 'Utkast', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Utkast', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(row('Kladd')).toBeVisible();
  await expect(row('Ute')).toHaveCount(0);
  await page.getByRole('button', { name: 'På nettsiden', exact: true }).click();
  await expect(row('Ute')).toBeVisible();
  await expect(row('Kladd')).toHaveCount(0);

  for (const p of [live, draft]) {
    expect((await page.request.delete(`${BASE}/api/redaksjon/nyheter/${p.slug}?version=${encodeURIComponent(p.version)}`)).status()).toBe(204);
  }
});
