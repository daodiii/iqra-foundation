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
  await page.evaluate((y) => window.scrollTo(0, y), (await heroPin(page)) * 0.87);
  await page.waitForTimeout(900);
}

/** Read off the pin spacer, so tuning the hero's length does not move these targets. */
const heroPin = (page: Page) => page.evaluate(() => {
  const section = document.getElementById('hero')!;
  return section.parentElement!.getBoundingClientRect().height - section.getBoundingClientRect().height;
});

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

  await page.evaluate((y) => window.scrollTo(0, y), (await heroPin(page)) * 0.87);
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

/**
 * The header is transparent at the top of the landing page, so the first Tab used to
 * land on an invisible link with an invisible focus ring: the ring was drawn, on
 * something at opacity 0. Both halves are asserted because they are fixed differently —
 * the wordmark shows itself on `:focus-visible`, the nav has to do it on the container,
 * since that is the element the hero fades and no child can climb out of its parent's
 * opacity. The call to action cannot do either for the same reason, so it leaves the tab
 * order instead until the copy has arrived.
 */
test('landing: nothing invisible can be tabbed to without showing itself', async ({ page }) => {
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => document.getElementById('hero')?.parentElement?.classList.contains('pin-spacer') ?? false),
      { timeout: 15_000, message: 'the hero never pinned' })
    .toBe(true);
  await expect(page.locator(wordmark)).toHaveCSS('opacity', '0');

  await page.keyboard.press('Tab');
  await expect(page.locator(wordmark)).toBeFocused();
  await expect(page.locator(wordmark), 'the wordmark took focus while invisible').toHaveCSS('opacity', '1');

  await page.keyboard.press('Tab');
  await expect(page.locator(navLinks).first()).toBeFocused();
  await expect(page.locator(nav), 'the nav took focus while invisible').toHaveCSS('opacity', '1');

  // Out of the tab order while the copy it belongs to is still transparent, and back in
  // once the copy has landed. Read as a property rather than by tabbing: what follows
  // the nav when the CTA is skipped is browser chrome, which Playwright cannot see.
  const ctaTabIndex = () => page.locator('#hero [data-copy] a').evaluate((el) => el.tabIndex);
  expect(await ctaTabIndex(), 'the hidden call to action is still a tab stop').toBe(-1);

  await page.evaluate((y) => window.scrollTo(0, y), (await heroPin(page)) * 0.95);
  await expect(page.locator('#hero [data-copy]')).toHaveCSS('opacity', '1', { timeout: 8_000 });
  await expect.poll(ctaTabIndex, { timeout: 5_000, message: 'the call to action never came back' }).toBe(0);
});

/**
 * The only two links a phone visitor has before the foot of the page, and both were
 * 11px tall: real text at a real size, with no padding to stand on. WCAG asks 24, Apple
 * 44. The width matters as much as the height and neither is visible in a screenshot.
 */
test('phone: the header and footer links are targets a thumb can hit', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch targets');
  await page.goto('/om-oss'); // no hero here, so the header is visible from the start
  const targets = [
    ['wordmark', page.locator(wordmark)],
    ['nav: Om oss', linkNamed(page, site.about.label)],
    ['nav: Støtt oss', linkNamed(page, site.support.label)],
    ['footer email', page.locator('footer a')],
  ] as const;
  for (const [name, locator] of targets) {
    const box = await locator.boundingBox();
    expect(box, `${name} has no box`).not.toBeNull();
    expect(Math.round(box!.height), `${name} is only ${box!.height}px tall`).toBeGreaterThanOrEqual(44);
    expect(Math.round(box!.width), `${name} is only ${box!.width}px wide`).toBeGreaterThanOrEqual(44);
  }
});
