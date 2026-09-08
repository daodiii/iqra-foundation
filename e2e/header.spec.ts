import { expect, test } from '@playwright/test';
import { site } from '@/content/site.no';

const wordmark = '#site-wordmark';
const nav = '#site-nav';        // the element the hero fades
const navLink = '#site-nav a';  // the link inside it

/**
 * The hero's pin is built inside `document.fonts.ready`, so scrolling before it exists
 * just scrolls the page past the hero and lands somewhere else entirely. Wait for the
 * spacer, never for a fixed delay.
 */
async function intoTheFilm(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => document.getElementById('hero')?.parentElement?.classList.contains('pin-spacer') ?? false),
      { timeout: 15_000, message: 'the hero never pinned' })
    .toBe(true);
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2.6));
  await page.waitForTimeout(900);
}

/**
 * The header starts hidden and the hero fades it in once the letters have opened. That
 * is the hero's doing, not the stylesheet's — which matters because every page has a
 * header and only this one has a hero.
 */
test('landing: the header is hidden at the top and arrives with the film', async ({ page }) => {
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => document.getElementById('hero')?.parentElement?.classList.contains('pin-spacer') ?? false),
      { timeout: 15_000, message: 'the hero never pinned' })
    .toBe(true);
  await expect(page.locator(wordmark)).toHaveCSS('opacity', '0');
  await expect(page.locator(nav)).toHaveCSS('opacity', '0');

  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2.6));
  await page.waitForTimeout(900);
  await expect(page.locator(wordmark)).toHaveCSS('opacity', '1', { timeout: 5_000 });
  await expect(page.locator(nav)).toHaveCSS('opacity', '1');
});

/**
 * The bug this guards: the wordmark used to be hidden by the stylesheet and turned back
 * on only by the hero's timeline, so on any page without a hero the header was invisible
 * and nothing failed anywhere.
 */
test('om oss: the header is visible on a page that has no hero', async ({ page }) => {
  await page.goto('/om-oss');
  await expect(page.locator(wordmark)).toHaveCSS('opacity', '1');
  await expect(page.locator(nav)).toHaveCSS('opacity', '1');
  await expect(page.locator(navLink)).toHaveText(site.about.label);
});

test('the nav link gets you to Om oss and the wordmark gets you home', async ({ page }) => {
  await intoTheFilm(page);
  await page.locator(navLink).click();
  await expect(page).toHaveURL(/\/om-oss$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(site.about.cover.title);

  await page.locator(wordmark).click();
  await expect(page).toHaveURL((url) => url.pathname === '/');
});

/**
 * One attribute for the whole header: the nav reads the wordmark's `data-on-dark`
 * through a sibling selector. Over the film both must be light, or the nav is navy on
 * near-black and simply gone.
 */
test('landing: the nav goes light over the film, with the wordmark', async ({ page }) => {
  await intoTheFilm(page);
  await expect(page.locator(wordmark)).toHaveAttribute('data-on-dark', 'true');
  const colour = await page.locator(navLink).evaluate((el) => getComputedStyle(el).color);
  const [r, g, b] = colour.match(/\d+/g)!.map(Number);
  expect(Math.min(r, g, b), `the nav stayed dark over the film (${colour})`).toBeGreaterThan(150);
});
