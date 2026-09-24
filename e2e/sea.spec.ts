import { expect, test, type Page } from '@playwright/test';
import { groundAt, seaAreas } from '../components/home/tide';

/**
 * Havet is Bladene (2026-09-23): the four right pages scroll natively over one sticky screen of
 * water and names, and the page nearest the middle of the screen lights its name and brings its
 * tide on its own clock. The scroll is the browser's (nothing holds, snaps or steps it), so the
 * first thing proved is that a real gesture moves the page exactly as far as the hand sent it.
 *
 * Driven with CDP's scroll synthesiser rather than Playwright's `mouse.wheel`: a real gesture
 * streams its wheel events over time, and the discrete notch a harness sends lands as one jump.
 */

/**
 * The reading line as the sea measured it (`data-line`: the middle of its screen under the header,
 * and on a phone under the band; Sea.test.tsx proves how it is measured), each page's centre, where
 * the section starts in scroll, and the header's height.
 */
async function geometry(page: Page) {
  return page.evaluate(() => {
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
    const sea = document.querySelector<HTMLElement>('[data-fields]')!;
    const line = Number(sea.dataset.line);
    const centres = [...document.querySelectorAll('[data-page]')].map((p) => {
      const r = p.getBoundingClientRect();
      return r.top + window.scrollY + r.height / 2;
    });
    const s = sea.getBoundingClientRect();
    return { header, line, centres, start: Math.round(s.top + window.scrollY - header) };
  });
}

/** Puts page `k`'s centre on the reading line, at once. */
async function toPage(page: Page, k: number) {
  const g = await geometry(page);
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(g.centres[k] - g.line));
}

/** A gesture of `px`, the way a hand makes one. */
async function gesture(page: Page, px: number, speed: number) {
  const cdp = await page.context().newCDPSession(page);
  await page.mouse.move(900, 500);
  await cdp.send('Input.synthesizeScrollGesture', { x: 900, y: 500, xDistance: 0, yDistance: -px, speed, gestureSourceType: 'mouse' });
}

/** The scroll, once it has stood still for a quarter of a second. */
async function stillAt(page: Page) {
  let last = Number.NaN;
  for (let i = 0; i < 40; i++) {
    const y = await page.evaluate(() => window.scrollY);
    if (y === last) return y;
    last = y;
    await page.waitForTimeout(250);
  }
  return last;
}

/** The playhead as the sea writes it: the field's number once its tide has landed. */
const playhead = (page: Page) => page.locator('[data-fields]').evaluate((el) => (el as HTMLElement).dataset.u);

/** Which of a set is lit. */
const lit = (page: Page, selector: string) => page.locator(selector).evaluateAll((els) => els.map((e) => e.hasAttribute('data-here')));
const only = (k: number) => seaAreas.map((_, j) => j === k);
/** The names drawn: the left page's on a desktop, the band's on a phone. */
const names = (isMobile: boolean) => (isMobile ? '[data-band] [data-item]' : '[data-index] [data-item]');

/** A finger's swipe up the screen of `px`, as raw touch events, held still before it lifts so nothing flings. */
async function swipe(page: Page, px: number) {
  const cdp = await page.context().newCDPSession(page);
  const x = 180;
  const from = Math.round(page.viewportSize()!.height * 0.85);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: from }] });
  for (let d = 16; d < px + 16; d += 16) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: from - Math.min(px, d) }] });
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(300);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function open(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-fields][data-live]')).toBeAttached();
}

test('a gesture moves the page exactly as far as the hand sent it: nothing holds, snaps or steps it', async ({ page, isMobile }) => {
  test.skip(isMobile, 'a wheel is the desktop gesture');
  await open(page);
  const { start } = await geometry(page);
  for (const [px, speed] of [[120, 900], [420, 1200], [1200, 2400], [3000, 6000]] as const) {
    await page.evaluate((y) => window.scrollTo(0, y), start);
    const from = await stillAt(page);
    await gesture(page, px, speed);
    const to = await stillAt(page);
    expect(Math.abs(to - from - px), `${px} px at ${speed}`).toBeLessThanOrEqual(2);
  }
});

// Chrome keeps the first few pixels of a finger's travel (its touch slop) before the touch counts
// as a scroll; measured at 15 on this page and on the build before the band alike.
test('on a phone a swipe moves the page as far as the finger went: nothing holds, snaps or steps it', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'a swipe is the phone’s gesture');
  // three swipes of a move every 16 px each, and a wait for the page to stand still around each:
  // 20 s on a quiet machine, and past the 40 s default on a loaded one
  test.slow();
  await open(page);
  const { start } = await geometry(page);
  for (const px of [160, 320, 480]) {
    await page.evaluate((y) => window.scrollTo(0, y), start + 200);
    const from = await stillAt(page);
    await swipe(page, px);
    const moved = (await stillAt(page)) - from;
    expect(moved, `a swipe of ${px}`).toBeGreaterThanOrEqual(px - 20);
    expect(moved, `a swipe of ${px}`).toBeLessThanOrEqual(px);
  }
});

// The crossing itself (a field is TIDE_MS, three fields at crossing(3)) is clock.test.ts's to prove,
// to the frame, and was measured landing on a real GPU by the probe; headless Chromium draws this
// water in software, so here the polls are wide open — the frames come when they come.
test('the page at the middle lights its name, and its tide lands on its field, whole, on its own clock', async ({ page, isMobile }) => {
  await open(page);
  for (const k of [1, 3, 2, 0]) {
    await toPage(page, k);
    await expect.poll(() => lit(page, '[data-page]'), { timeout: 8_000 }).toEqual(only(k));
    expect(await lit(page, names(isMobile))).toEqual(only(k));
    await expect.poll(() => playhead(page), { timeout: 10_000 }).toBe(`${k}.000`);
    // a single read here can race the exact landing (data-u can show `k.000` a frame before the
    // ground catches up), so poll it too rather than read it once right after the playhead poll
    await expect
      .poll(() => page.locator('[data-fields] [data-material="water"]').evaluate((el) => (el as HTMLElement).style.getPropertyValue('--ground')), { timeout: 10_000 })
      .toBe(groundAt(k));
  }
});

// On a phone the button is the band's: the left page is not drawn, so it is not in the accessibility tree.
test('a name takes its page to the middle with the browser’s own smooth scroll, and the focus goes with it, unringed after a click', async ({ page }) => {
  await open(page);
  await toPage(page, 0);
  const from = await stillAt(page);
  // the keyboard on a name that is not lit keeps its ring whole: its name is not dimmed while it has the focus
  const unlit = page.getByRole('button', { name: seaAreas[1].name });
  await unlit.focus();
  await expect.poll(() => unlit.evaluate((b) => Number(getComputedStyle(b.parentElement!).opacity)), { timeout: 5_000 }).toBe(1);
  // every frame's scroll while it travels: a glide passes through many, a jump through none
  await page.evaluate(() => {
    const seen: number[] = [];
    (window as unknown as { seen: number[] }).seen = seen;
    const start = performance.now();
    const f = () => {
      seen.push(window.scrollY);
      if (performance.now() - start < 3_000) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
  await page.getByRole('button', { name: seaAreas[2].name }).click();
  const to = await stillAt(page);
  const g = await geometry(page);
  expect(Math.abs(to + g.line - g.centres[2])).toBeLessThanOrEqual(2);
  const seen = await page.evaluate(() => (window as unknown as { seen: number[] }).seen);
  expect(new Set(seen.filter((y) => y > from && y < to)).size).toBeGreaterThan(0);
  await expect.poll(() => lit(page, '[data-page]')).toEqual(only(2));
  const focused = page.locator('[data-page="2"]');
  await expect(focused).toBeFocused();
  expect(await focused.evaluate((el) => el.matches(':focus-visible'))).toBe(false);
});

test('on a phone the four names stand in one band under the header while the texts go by under it, out of sight there; the band wears the fields’ colours through the tide and carries the logo; the pages carry neither', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the phone’s layout');
  await open(page);
  const band = page.locator('[data-fields] [data-band]');
  await expect(band).toBeVisible();
  await expect(band.getByRole('button')).toHaveText(seaAreas.map((a) => a.name));
  await expect(page.locator('[data-fields] [data-index]')).toBeHidden();
  for (const foot of await page.locator('[data-fields] [data-material="water"] [data-foot]').all()) await expect(foot).toBeHidden();
  for (const k of seaAreas.keys()) {
    await expect(page.locator(`[data-page="${k}"] ol`)).toHaveCount(0);
    await expect(page.locator(`[data-page="${k}"] img`)).toHaveCount(0);
  }
  const { header } = await geometry(page);
  /** A foot logo's own opacity: the span's (the img's own is always 1, and Playwright counts opacity 0 as visible). */
  const shown = (k: number) => band.locator(`[data-foot="${k}"]`).evaluate((el) => Number(getComputedStyle(el).opacity));
  for (const k of [0, 2, 3]) {
    await toPage(page, k);
    await expect.poll(() => lit(page, '[data-band] [data-item]'), { timeout: 8_000 }).toEqual(only(k));
    // pinned: whichever text is going by, the band stands under the header
    expect(Math.round(await band.evaluate((el) => el.getBoundingClientRect().top))).toBe(header);
    await expect.poll(() => band.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--band')), { timeout: 10_000 }).toBe(groundAt(k));
    // the same write as the colour's lights the field's logo, and it fades up (0.6 s) while the others stay out
    await expect(band.locator(`[data-foot="${k}"]`)).toHaveAttribute('data-on', '');
    await expect.poll(() => shown(k), { timeout: 10_000 }).toBeGreaterThan(0.8);
    for (const j of seaAreas.keys()) if (j !== k) await expect.poll(() => shown(j), { timeout: 10_000 }).toBe(0);
  }
  // a text going under it is out of sight: the band is what lies over it, and the band is solid
  const g = await geometry(page);
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(g.centres[1] - header - 40));
  await expect.poll(() => band.evaluate((el) => el.getBoundingClientRect().top)).toBe(header);
  const under = await page.locator('[data-page="1"] p').first().evaluate((p, header) => {
    const r = p.getBoundingClientRect();
    const y = Math.max(r.top, header) + 4;
    const b = document.querySelector('[data-band]')!.getBoundingClientRect();
    return { inBand: y < b.bottom, onTop: document.elementFromPoint(r.left + 8, y)?.closest('[data-band]') !== null };
  }, header);
  expect(under).toEqual({ inBand: true, onTop: true });
  const alpha = await band.evaluate((el) => {
    const c = document.createElement('canvas').getContext('2d')!;
    c.fillStyle = getComputedStyle(el).backgroundColor;
    c.fillRect(0, 0, 1, 1);
    return c.getImageData(0, 0, 1, 1).data[3];
  });
  expect(alpha).toBe(255);
});

// On a phone turned on its side the four rows of names and the header left a strip of water shorter
// than a text: 15 px of it under the band and 15 px below the screen at 667 × 375.
test('on a phone on its side the band is one row, and a whole text fits in the water under it', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the phone’s layout');
  await page.setViewportSize({ width: 667, height: 375 });
  await open(page);
  const band = page.locator('[data-fields] [data-band]');
  const first = await band.locator('button').first().boundingBox();
  const last = await band.locator('button').last().boundingBox();
  expect(Math.abs(first!.y - last!.y), 'the names in one row').toBeLessThanOrEqual(1);
  for (const k of [0, 1, 2, 3]) {
    await toPage(page, k);
    await expect.poll(() => lit(page, '[data-band] [data-item]'), { timeout: 8_000 }).toEqual(only(k));
    const fits = await page.locator(`[data-page="${k}"]`).evaluate((p) => {
      const words = [...p.querySelectorAll('p')].map((e) => e.getBoundingClientRect());
      const b = document.querySelector('[data-band]')!.getBoundingClientRect();
      return { belowTheBand: Math.min(...words.map((r) => r.top)) >= b.bottom, onTheScreen: Math.max(...words.map((r) => r.bottom)) <= window.innerHeight };
    });
    expect(fits, `page ${k}`).toEqual({ belowTheBand: true, onTheScreen: true });
  }
});
