import { expect, test, type Page } from '@playwright/test';
import { site } from '@/content/site.no';

const wordmark = '#site-wordmark';
const nav = '#site-nav';         // the element the hero fades
const navLinks = '#site-nav a';  // both links inside it
const linkNamed = (page: Page, name: string) => page.locator(nav).getByRole('link', { name });

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
  await expect(page.locator(navLinks)).toHaveText([site.about.label, site.support.label]);
});

test('the nav link gets you to Om oss and the wordmark gets you home', async ({ page }) => {
  await intoTheFilm(page);
  await linkNamed(page, site.about.label).click();
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
  // Every link, not the first: the sibling selector paints the whole nav, so a second
  // link that missed it would be navy on near-black and nothing else here would notice.
  const colours = await page.locator(navLinks).evaluateAll((els) => els.map((el) => getComputedStyle(el).color));
  expect(colours).toHaveLength(2);
  for (const colour of colours) {
    const [r, g, b] = colour.match(/\d+/g)!.map(Number);
    expect(Math.min(r, g, b), `the nav stayed dark over the film (${colour})`).toBeGreaterThan(150);
  }
});

/**
 * Støtt oss sits at the foot of the landing page behind two pinned sections, so this
 * link is the only way to reach it without scrolling the whole page. An anchor into a
 * pinned document is exactly the thing that lands in the wrong place — and the jump has
 * to leave the section's own entrance in a state someone can read, since that entrance
 * is waiting on a scroll trigger it has just been carried straight past.
 */
test('landing: the nav link lands on Støtt oss and its copy is there when it arrives', async ({ page }) => {
  await intoTheFilm(page);
  await linkNamed(page, site.support.label).click();
  await expect(page).toHaveURL(/#stott-oss$/);

  await expect
    .poll(() => page.evaluate(() => Math.round(document.getElementById('stott-oss')!.getBoundingClientRect().top)),
      { timeout: 8_000, message: 'the anchor did not land on Støtt oss' })
    .toBeLessThanOrEqual(80);
  // The figure, which is the second thing the entrance raises.
  await expect(page.locator('#stott-oss [data-rise]').nth(1)).toHaveCSS('opacity', '1', { timeout: 8_000 });
});

/** The reason the href is rooted: from here a bare `#stott-oss` points at nothing. */
test('om oss: the Støtt oss link goes back to the landing page and finds the section', async ({ page }) => {
  await page.goto('/om-oss');
  await linkNamed(page, site.support.label).click();
  await expect(page).toHaveURL((url) => url.pathname === '/' && url.hash === '#stott-oss');
  await expect(page.locator('#stott-oss')).toBeVisible();
});
