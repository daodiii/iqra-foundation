import { expect, test } from '@playwright/test';
import { brief } from '../content/brief.no';
import { site } from '../content/site.no';

/**
 * Every page of the brief's menu exists, has its own title in the one pattern and a
 * description in the brief's words, carries its passage of the brief verbatim, and says
 * honestly when a collection is empty. The 404 is a page in the same system.
 */

const T = (page: string) => `${page} – ${site.name}`;

test('the home page is the name alone, and carries the brief’s main text, Visjon, Misjon and the four areas', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(site.name);
  expect(await page.locator('html').getAttribute('lang')).toBe('nb');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', brief.home.paragraph);
  await expect(page.locator('h1')).toHaveText(brief.home.headline);
  await expect(page.getByText(brief.home.paragraph, { exact: true })).toBeVisible();
  const main = page.getByRole('main');
  await expect(main.getByRole('link', { name: site.cta.work.label })).toHaveAttribute('href', site.cta.work.href);
  await expect(main.getByRole('link', { name: site.cta.support.label })).toHaveAttribute('href', site.cta.support.href);
  await expect(main.getByText(brief.vision.headline, { exact: true })).toBeVisible();
  await expect(main.getByText(brief.vision.paragraph, { exact: true })).toBeVisible();
  await expect(main.getByText(brief.mission.headline, { exact: true })).toBeVisible();
  await expect(main.getByText(brief.mission.paragraph, { exact: true })).toBeVisible();
  for (const a of brief.areas) {
    await expect(main.getByRole('link', { name: a.name, exact: true }).first()).toHaveAttribute('href', `/vart-arbeid#${a.key}`);
  }
  // four fields of water, each on its area's ground; the first one's link lands on its band
  const fields = main.locator('[data-fields] [data-material="water"]');
  await expect(fields).toHaveCount(4);
  await expect(fields.nth(0)).toHaveAttribute('data-ground', 'navy');
  await expect(fields.nth(3)).toHaveAttribute('data-ground', 'crimson');
  await main.getByRole('link', { name: brief.areas[1].name, exact: true }).click();
  await expect(page).toHaveURL(/\/vart-arbeid#dialog$/);
  await expect(page.locator('#dialog')).toBeInViewport();
});

test('vårt arbeid: the four areas, each its own section of water, each reachable by its anchor', async ({ page }) => {
  await page.goto('/vart-arbeid');
  await expect(page).toHaveTitle(T(site.pages.work.title));
  await expect(page.locator('h1')).toHaveText(site.pages.work.title);
  for (const a of brief.areas) {
    const section = page.locator(`#${a.key}`);
    await expect(section).toContainText(a.name);
    await expect(section).toContainText(a.text);
    await expect(section.locator('[data-material="water"]')).toHaveCount(1);
  }
  await page.goto('/vart-arbeid#samfunnsdeltakelse');
  await expect(page.locator('#samfunnsdeltakelse')).toBeInViewport();
});

test('om oss: the brief’s text and the story of the name', async ({ page }) => {
  await page.goto('/om-oss');
  await expect(page).toHaveTitle(T(site.pages.about.title));
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', site.pages.about.description);
  await expect(page.locator('h1')).toHaveText(brief.about.title);
  for (const p of brief.about.paragraphs) await expect(page.getByText(p, { exact: true })).toBeVisible();
  await expect(page.getByText(site.pages.about.story.text, { exact: true })).toBeVisible();
  // the four names in the «skjæringspunktet» line each carry their area's mark (the footer's thread has its own four)
  await expect(page.getByRole('main').locator('[data-area]')).toHaveCount(4);
});

test.describe('the collections are honest while empty', () => {
  test('arrangementer: kommende and tidligere, each with its own line', async ({ page }) => {
    await page.goto('/arrangementer');
    await expect(page).toHaveTitle(T(site.pages.events.title));
    await expect(page.getByRole('heading', { name: site.pages.events.upcoming })).toBeVisible();
    await expect(page.getByRole('heading', { name: site.pages.events.past })).toBeVisible();
    await expect(page.getByText(site.pages.events.emptyUpcoming, { exact: true })).toBeVisible();
    await expect(page.getByText(site.pages.events.emptyPast, { exact: true })).toBeVisible();
  });
  test('ressurser', async ({ page }) => {
    await page.goto('/ressurser');
    await expect(page).toHaveTitle(T(site.pages.resources.title));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', brief.resources);
    await expect(page.getByText(site.pages.resources.empty, { exact: true })).toBeVisible();
  });
  test('menneskene bak: the board paragraph now, the empty line under it', async ({ page }) => {
    await page.goto('/menneskene-bak');
    await expect(page).toHaveTitle(T(brief.people.title));
    await expect(page.locator('h1')).toHaveText(brief.people.title);
    await expect(page.getByText(brief.people.paragraph, { exact: true })).toBeVisible();
    await expect(page.getByText(site.pages.people.empty, { exact: true })).toBeVisible();
  });
  test('styringsdokumenter', async ({ page }) => {
    await page.goto('/styringsdokumenter');
    await expect(page).toHaveTitle(T(site.pages.documents.title));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', brief.documents);
    await expect(page.getByText(site.pages.documents.empty, { exact: true })).toBeVisible();
  });
});

test('kontakt: the address and the number, bracketed, and no form', async ({ page }) => {
  await page.goto('/kontakt');
  await expect(page).toHaveTitle(T(site.pages.contact.title));
  const main = page.getByRole('main');
  await expect(main.getByRole('link', { name: site.contact.email })).toHaveAttribute('href', `mailto:${site.contact.email}`);
  await expect(main).toContainText(site.contact.orgnr);
  await expect(main).toContainText(site.place);
  await expect(main.locator('form, input, textarea')).toHaveCount(0);
});

test('støtt oss: Vipps first, then the account, both bracketed, nothing that pretends to pay', async ({ page }) => {
  await page.goto('/stott-oss');
  await expect(page).toHaveTitle(T(site.pages.support.title));
  const main = page.getByRole('main');
  const text = await main.innerText();
  expect(text.indexOf(site.support.vipps.value)).toBeGreaterThan(-1);
  expect(text.indexOf(site.support.vipps.value)).toBeLessThan(text.indexOf(site.support.account.value));
  await expect(main.locator('form, input, button')).toHaveCount(0);
});

test('a page that does not exist is a page in the same system', async ({ page }) => {
  const res = await page.goto('/denne-siden-finnes-ikke');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText(site.pages.notFound.line);
  await expect(page.getByRole('navigation', { name: site.header.navLabel })).toBeAttached();
  await expect(page.getByRole('main').getByRole('link', { name: site.pages.notFound.home })).toHaveAttribute('href', '/');
});

test('the share card is the logo, on every route', async ({ page }) => {
  for (const path of ['/', '/kontakt']) {
    await page.goto(path);
    const og = page.locator('meta[property="og:image"]');
    await expect(og).toHaveAttribute('content', /\/opengraph-image/);
    const res = await page.request.get((await og.getAttribute('content'))!);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');
  }
  const icon = page.locator('link[rel="icon"]');
  await expect(icon).toHaveAttribute('href', /icon\.svg/);
});

test('with JavaScript off every page is complete: the text, the menu, the footer', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const item of site.nav) {
    await page.goto(item.href);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('contentinfo').getByRole('link', { name: brief.menu[8] })).toBeAttached();
  }
  await page.goto('/');
  await expect(page.getByText(brief.home.paragraph, { exact: true })).toBeVisible();
  await context.close();
});

test('reduced motion: the pages render and nothing is hidden waiting for an animation', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByText(brief.mission.paragraph, { exact: true })).toBeVisible();
  await page.goto('/vart-arbeid');
  for (const a of brief.areas) await expect(page.locator(`#${a.key}`)).toContainText(a.text);
  await context.close();
});
