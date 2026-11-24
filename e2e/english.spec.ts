import { expect, test } from '@playwright/test';

/** The English site (2026-11-22): every page under /en, in English, announcing its Norwegian twin. */
const PAGES: [string, string][] = [
  ['/en', '/'],
  ['/en/about-us', '/om-oss'],
  ['/en/our-work', '/vart-arbeid'],
  ['/en/our-people', '/menneskene-bak'],
  ['/en/news-and-events', '/aktuelt'],
  ['/en/news-and-events/news', '/aktuelt/nyheter'],
  ['/en/news-and-events/events', '/aktuelt/arrangementer'],
  ['/en/news-and-events/archive', '/aktuelt/arkiv'],
  ['/en/resources', '/ressurser'],
  ['/en/contact', '/kontakt'],
  ['/en/support-us', '/stott-oss'],
  ['/en/privacy', '/personvern'],
  ['/en/terms', '/vilkar'],
];

test('every English page: lang="en", one h1, its Norwegian twin as hreflang, and no Norwegian letters in its words', async ({ page }) => {
  for (const [en, no] of PAGES) {
    const res = await page.goto(en);
    expect(res?.status(), en).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveCount(1);
    const path = async (hreflang: string) => new URL((await page.locator(`link[rel=alternate][hreflang=${hreflang}]`).getAttribute('href'))!).pathname;
    expect(await path('nb'), en).toBe(no);
    expect(await path('en'), en).toBe(en);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/en\/opengraph-image/);
    const text = await page.locator('main').innerText();
    expect(text.match(/\S*[æøå]\S*/gi) ?? [], en).toEqual([]);
  }
});

test('the Norwegian pages say lang="nb" and name their English twin', async ({ page }) => {
  for (const [en, no] of PAGES) {
    await page.goto(no);
    await expect(page.locator('html')).toHaveAttribute('lang', 'nb');
    expect(new URL((await page.locator('link[rel=alternate][hreflang=en]').getAttribute('href'))!).pathname, no).toBe(en);
  }
});

test('the switch in the foot takes you to the same page in the other language, and back', async ({ page }) => {
  await page.goto('/en/our-work');
  const foot = page.locator('footer [role=group]');
  await foot.getByRole('link', { name: 'Norsk' }).click();
  await expect(page).toHaveURL(/\/vart-arbeid$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'nb');
  await page.locator('footer [role=group]').getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en\/our-work$/);
  await expect(page.locator('h1')).toHaveText('Our work');
});

test('phone: the switch heads the open menu, above the pages, a 44 px target; desktop: in the header', async ({ page, isMobile }) => {
  await page.goto('/en/contact');
  if (isMobile) {
    await page.getByRole('button', { name: 'Menu' }).click();
    const link = page.locator('#meny [role=group]').getByRole('link', { name: 'Norsk' });
    await expect(link).toHaveAttribute('href', '/kontakt');
    await expect(link).toBeInViewport();
    const box = (await link.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    // both read in one frame: the sheet is still sliding up when the menu has just opened
    const above = await page.evaluate(() => {
      const a = document.querySelector('#meny [role=group] a')!.getBoundingClientRect();
      return a.bottom <= document.querySelector('#meny nav')!.getBoundingClientRect().top;
    });
    expect(above).toBe(true);
  } else {
    await expect(page.locator('header [role=group]').getByRole('link', { name: 'Norsk' })).toBeVisible();
  }
});

test('phone: no English page is wider than the screen at 320, 360 or 390', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phones only');
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    for (const [en] of PAGES) {
      await page.goto(en);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${en} at ${width}`).toBeLessThanOrEqual(width);
    }
  }
});

test('an English address that does not exist is the English 404, in the English shell', async ({ page }) => {
  const res = await page.goto('/en/no-such-page');
  expect(res?.status()).toBe(404);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toHaveText('This page does not exist.');
  await expect(page.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/en');
});
