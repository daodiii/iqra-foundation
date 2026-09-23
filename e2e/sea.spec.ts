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

/** The reading line and each page's centre, read the way Sea.tsx reads them, and where the section starts in scroll. */
async function geometry(page: Page) {
  return page.evaluate(() => {
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
    const line = header + (window.innerHeight - header) / 2;
    const centres = [...document.querySelectorAll('[data-page]')].map((p) => {
      const r = p.getBoundingClientRect();
      return r.top + window.scrollY + r.height / 2;
    });
    const s = document.querySelector('[data-fields]')!.getBoundingClientRect();
    return { line, centres, start: Math.round(s.top + window.scrollY - header) };
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

// The crossing itself (a field is TIDE_MS, three fields at crossing(3)) is clock.test.ts's to prove,
// to the frame, and was measured landing on a real GPU by the probe; headless Chromium draws this
// water in software, so here the polls are wide open — the frames come when they come.
test('the page at the middle lights its name, and its tide lands on its field, whole, on its own clock', async ({ page }) => {
  await open(page);
  for (const k of [1, 3, 2, 0]) {
    await toPage(page, k);
    await expect.poll(() => lit(page, '[data-page]'), { timeout: 8_000 }).toEqual(only(k));
    expect(await lit(page, '[data-item]')).toEqual(only(k));
    await expect.poll(() => playhead(page), { timeout: 10_000 }).toBe(`${k}.000`);
    // a single read here can race the exact landing (data-u can show `k.000` a frame before the
    // ground catches up), so poll it too rather than read it once right after the playhead poll
    await expect
      .poll(() => page.locator('[data-fields] [data-material="water"]').evaluate((el) => (el as HTMLElement).style.getPropertyValue('--ground')), { timeout: 10_000 })
      .toBe(groundAt(k));
  }
});

test('a name takes its page to the middle with the browser’s own smooth scroll, and the focus goes with it, unringed after a click', async ({ page, isMobile }) => {
  test.skip(isMobile, 'on a phone the names head every page and are not buttons');
  await open(page);
  await toPage(page, 0);
  const from = await stillAt(page);
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

test('on a phone each page carries the four names, its own lit, and its own logo; the screen draws neither', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the phone’s layout');
  await open(page);
  for (const [k, a] of seaAreas.entries()) {
    const p = page.locator(`[data-page="${k}"]`);
    await expect(p.locator('ol')).toBeVisible();
    await expect(p.locator('ol li')).toHaveText(seaAreas.map((x) => x.name));
    expect(await p.locator('ol li').evaluateAll((els) => els.map((e) => e.hasAttribute('data-here')))).toEqual(only(k));
    await expect(p.locator('img')).toBeVisible();
    await expect(p.locator('img')).toHaveAttribute('data-logo', a.ground);
  }
  await expect(page.locator('[data-fields] [data-index]')).toBeHidden();
  for (const foot of await page.locator('[data-fields] [data-foot]').all()) await expect(foot).toBeHidden();
});
