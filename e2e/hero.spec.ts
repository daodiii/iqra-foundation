import { expect, test, type Page } from '@playwright/test';

const heroPinLength = (page: Page) => page.evaluate(() => window.innerHeight * 3);

/** The hero builds its timeline inside `document.fonts.ready`, so the pin lands some way
 *  after load — how far after depends on the font cache. Wait for the pin, not for a guess. */
const heroPinned = (page: Page) =>
  expect
    .poll(() => page.evaluate(() => document.getElementById('hero')?.parentElement?.classList.contains('pin-spacer') ?? false),
      { timeout: 15_000, message: 'the hero never pinned' })
    .toBe(true);

/**
 * The letters have fully dissolved by 68% of the pin: the mask tween ends at 0.80 of a
 * timeline 1.18 long. Measured at the 60% the brief used, the mask still sits at 0.69 and
 * stays there, so the scroll target has to clear the fade, not merely enter it.
 */
const MASK_GONE = 0.72;

/** Computed style cannot see an element that is painted over; a hit test at its own
 *  centre can. Returns what is really in front, so a failure names the culprit. */
async function whatIsOnTop(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return 'no element';
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (!hit) return 'nothing (the centre is outside the viewport)';
    return el.contains(hit) ? 'itself' : `${hit.tagName.toLowerCase()}.${hit.getAttribute('class') || '(no class)'}`;
  }, selector);
}

test.describe('hero', () => {
  test('at the top the letters are closed and the copy hidden', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#hero-word')).toHaveCount(1);
    await expect(page.locator('[data-mask]')).toHaveCSS('opacity', '1');
    await expect(page.locator('[data-copy]')).toHaveCSS('opacity', '0');
    await expect(page.locator('#site-wordmark')).toHaveCSS('opacity', '0');
    const transform = await page.locator('#hero-word').getAttribute('transform');
    expect(transform === null || /^matrix\(1,0,0,1,0,0\)$/.test(transform)).toBe(true);
  });

  test('scrolling opens the letters into the film and lands the headline', async ({ page }) => {
    await page.goto('/');
    await heroPinned(page);
    const pin = await heroPinLength(page);
    await page.evaluate((y) => window.scrollTo(0, y), pin * MASK_GONE);
    await expect(page.locator('[data-mask]')).toHaveCSS('opacity', '0', { timeout: 5_000 });
    await page.evaluate((y) => window.scrollTo(0, y), pin * 0.95);
    await expect(page.locator('[data-copy]')).toHaveCSS('opacity', '1', { timeout: 5_000 });
    await expect(page.locator('#site-wordmark')).toHaveCSS('opacity', '1', { timeout: 5_000 });
    await expect(page.locator('#site-wordmark')).toHaveAttribute('data-on-dark', 'true');
    const t = await page.evaluate(() => (document.querySelector('#hero video') as HTMLVideoElement).currentTime);
    expect(t).toBeGreaterThan(0);

    // Hero.tsx reaches the wordmark by id and quietly does nothing when it cannot find
    // it, so the reveal has to be checked in both directions: back at the top the header
    // is over the closed letters again and must be invisible, not white-on-white.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator('#site-wordmark')).toHaveCSS('opacity', '0', { timeout: 5_000 });
    await expect(page.locator('#site-wordmark')).toHaveAttribute('data-on-dark', 'false');
  });

  test('the loop never reaches the logo card', async ({ page }) => {
    await page.goto('/');
    const duration = await page.evaluate(async () => {
      const v = document.querySelector('#hero video') as HTMLVideoElement;
      if (v.readyState < 1) await new Promise((r) => v.addEventListener('loadedmetadata', r, { once: true }));
      return v.duration;
    });
    expect(duration).toBeLessThanOrEqual(4.35);
  });
});

test.describe('reduced motion', () => {
  // Not `test.use({ reducedMotion: 'reduce' })`: Playwright 1.55 has no such test option
  // — tsc rejects it and the runner drops it in silence, so the whole block would have
  // run with motion on and quietly asserted the wrong page. This is the spelling
  // Playwright's own types document, and it reaches the context before the first paint.
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('nothing pins or plays; the copy and the wordmark are simply there', async ({ page }) => {
    await page.goto('/');
    // The src is only set from the client effect, so this is proof that the effect RAN —
    // without it "no pins" would also pass before hydration. It says nothing about which
    // branch was taken: the src is assigned before the reducedMotion early return. The
    // pin-spacer count and `paused` below are what establish the reduced branch.
    await expect(page.locator('#hero video')).toHaveAttribute('src', /iqra-loop-\d+\.(webm|mp4)$/);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    await expect(page.locator('[data-copy]')).toBeVisible();
    await expect(page.locator('#site-wordmark')).toHaveCSS('opacity', '1');
    const paused = await page.evaluate(() => (document.querySelector('#hero video') as HTMLVideoElement).paused);
    expect(paused).toBe(true);

    // The copy once had opacity 1, the right colour and the right coordinates while an
    // oversized sibling rect painted straight over it, which computed style cannot see.
    await page.locator('[data-copy]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-copy]')).toBeInViewport();
    expect(await whatIsOnTop(page, '[data-copy]')).toBe('itself');
  });
});
