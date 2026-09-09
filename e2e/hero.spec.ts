import { expect, test, type Page } from '@playwright/test';

/** Read off the pin spacer, not assumed from the `+=N%` the hero asks for. */
const heroPinLength = (page: Page) => page.evaluate(() => {
  const section = document.getElementById('hero')!;
  return section.parentElement!.getBoundingClientRect().height - section.getBoundingClientRect().height;
});

/** The pin is built synchronously now, so this should settle on the first poll. It stays a
 *  poll rather than a bare assertion because hydration still has to run first. */
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
    await expect(page.locator('#hero-lockup text')).toHaveText(['IQRA', 'FOUNDATION']);
    await expect(page.locator('[data-mask]')).toHaveCSS('opacity', '1');
    await expect(page.locator('[data-copy]')).toHaveCSS('opacity', '0');
    await expect(page.locator('#site-wordmark')).toHaveCSS('opacity', '0');
    // The scale is on the group, not on either line: check where it actually lands.
    const transform = await page.locator('#hero-lockup').getAttribute('transform');
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

  /**
   * The whole opening hangs off one point: the mask grows out of it, so whatever sits
   * under it is what fills the screen (Hero.tsx, ORIGIN). It has to be inside a letter,
   * and inside an upright stroke rather than a crossbar, or the film never opens through
   * the lettering. The component cannot notice when that stops being true, so check it
   * here, where there is a real font.
   *
   * The origin is read back out of the matrix GSAP applied rather than repeated from the
   * source, and the letters are redrawn on a canvas from each line's own attributes and
   * computed style. `textBaseline: 'middle'` is what Chromium renders SVG's
   * `dominant-baseline: middle` as, and Chromium is all this config runs.
   */
  test('the letters open from a point inside an upright stroke', async ({ page }) => {
    await page.goto('/');
    await heroPinned(page);
    const pin = await heroPinLength(page);
    await page.evaluate((y) => window.scrollTo(0, y), pin * 0.3);

    // svgOrigin becomes a translate of origin * (1 - scale); undo it to get the point back.
    const readOrigin = () => page.evaluate(() => {
      const m = document.getElementById('hero-lockup')?.getAttribute('transform')?.match(/matrix\(([^)]+)\)/);
      if (!m) return null;
      const [scale, , , , tx, ty] = m[1].split(',').map(Number);
      return scale > 1.5 ? { x: tx / (1 - scale), y: ty / (1 - scale) } : null;
    });
    await expect.poll(readOrigin, { timeout: 10_000, message: 'the lockup never scaled' }).not.toBeNull();
    const origin = (await readOrigin())!;

    const ink = await page.evaluate(({ x: ox, y: oy }) => {
      const W = 1000, H = 600; // the mask's viewBox, which is what the origin is in
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const line of document.querySelectorAll<SVGTextElement>('#hero-lockup text')) {
        const style = getComputedStyle(line);
        ctx.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
        ctx.font = `${style.fontWeight} ${parseFloat(style.fontSize)}px ${style.fontFamily}`;
        ctx.fillText(line.textContent ?? '', Number(line.getAttribute('x')), Number(line.getAttribute('y')));
      }
      const pixels = ctx.getImageData(0, 0, W, H).data;
      const inked = (x: number, y: number) =>
        x >= 0 && x < W && y >= 0 && y < H && pixels[(y * W + x) * 4 + 3] > 128;
      const px = Math.round(ox), py = Math.round(oy);
      // How far the ink reaches from the point, along each axis: a stem is tall, a
      // crossbar is not, and a counter is neither.
      const reach = (dx: number, dy: number) => {
        let n = 0;
        while (inked(px + dx * (n + 1), py + dy * (n + 1))) n++;
        return n;
      };
      return {
        origin: [px, py],
        onInk: inked(px, py),
        across: reach(-1, 0) + reach(1, 0) + 1,
        down: reach(0, -1) + reach(0, 1) + 1,
      };
    }, origin);

    expect(ink, 'the origin is not inside a letter').toMatchObject({ onInk: true });
    // The stem measures 206 units tall and 50 across; a crossbar or a counter edge would
    // be a fraction of that vertically.
    expect(ink.down, `the ink at ${ink.origin} is not an upright stroke: ${JSON.stringify(ink)}`)
      .toBeGreaterThan(150);
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

/**
 * The bug this guards: the hero used to build its pinned trigger inside
 * `document.fonts.ready`, so the document gained 1800px of pin spacing after first paint
 * and every section below the hero slid down under anyone already scrolling. Holding the
 * font back makes the window between paint and font load wide enough to measure in.
 */
test.describe('the page does not move when the fonts land', () => {
  test('the pin exists before the fonts do, and nothing below shifts when they arrive', async ({ page }) => {
    let release: (() => void) | undefined;
    const held = new Promise<void>((resolve) => { release = resolve; });

    // Hold every font response until we say so. `next/font` self-hosts, so these are
    // same-origin /_next/static/media/*.woff2 requests.
    await page.route(/\.(woff2?|ttf|otf)(\?|$)/, async (route) => {
      await held;
      await route.continue();
    });

    // `domcontentloaded`, not the default `load`: fonts are subresources, so holding them
    // holds the load event, and waiting for it would deadlock against our own route.
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // While the fonts are still in flight the pin must already be there.
    await heroPinned(page);
    const before = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      visjon: document.getElementById('visjon')!.getBoundingClientRect().top + window.scrollY,
      fontsDone: document.fonts.status === 'loaded',
    }));
    expect(before.fontsDone, 'the fonts were not actually held back').toBe(false);

    release!();
    await page.evaluate(() => document.fonts.ready);
    // The hero asks for one refresh once the fonts land; give it a frame to run.
    await page.waitForTimeout(500);

    const after = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      visjon: document.getElementById('visjon')!.getBoundingClientRect().top + window.scrollY,
    }));

    // 10px covers the metric-matched fallback swapping for the real face. It does not
    // come close to admitting the screen of pin spacing this is guarding against.
    expect(Math.abs(after.visjon - before.visjon),
      `Visjon moved from ${before.visjon} to ${after.visjon} when the fonts landed`)
      .toBeLessThanOrEqual(10);
    expect(Math.abs(after.height - before.height),
      `the document grew from ${before.height} to ${after.height} when the fonts landed`)
      .toBeLessThanOrEqual(10);
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
