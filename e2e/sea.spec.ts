import { expect, test, type Page } from '@playwright/test';
import { STEP } from '../components/home/step';
import { STEPS } from '../components/home/tide';

/**
 * The sea is stepped on the way in, once: while it holds the screen, a gesture downwards
 * moves one field and stops there — a notch or a flick, it makes no difference — and then,
 * the four seen, the page is the visitor's again, up and down, free. The owner's ask of
 * 2026-09-22: «if you scroll a little or a lot you should just go to the next one, stop»,
 * over a second (their «half the speed» of the half second they first asked for and then
 * saw), and then: «make it that it's only once, like when you scroll down — after that …
 * much much more free-flowing … when you scroll back up, make it different», and «lock the
 * first one — when you see the navy, lock it».
 *
 * Measured by where the page lands, not by how it felt: headless Chromium has no smooth
 * scrolling and a wheel notch there is one jump, so a build that let the wheel through
 * would land wherever the notch fell, and one that stepped whole fields lands on a field.
 */

/** Where the act reaches, read the way Sea.tsx sets it: the stage's top under the header, its bottom at the foot of the screen. */
async function span(page: Page) {
  return page.locator('[data-fields]').evaluate((el) => {
    const r = el.getBoundingClientRect();
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
    return { start: window.scrollY + r.top - header, end: window.scrollY + r.bottom - window.innerHeight };
  });
}

/** The playhead: 0 at the first field, 3 at the last. */
async function u(page: Page) {
  const s = await span(page);
  return ((await page.evaluate(() => window.scrollY)) - s.start) / ((s.end - s.start) / STEPS);
}

/**
 * Put the page on a field without a gesture, and let the act catch up. By way of the first
 * field, always: arriving at the sea locks onto the navy until it has been stood on, so a
 * test that means to start further in has to have been there — as a visitor would.
 */
async function stand(page: Page, k: number) {
  const s = await span(page);
  const to = (at: number) => page.evaluate((y) => window.scrollTo(0, y), s.start + ((s.end - s.start) * at) / STEPS);
  await to(0);
  await expect.poll(() => u(page)).toBeCloseTo(0, 1);
  // and stands there long enough for the act to see it standing — the arrival is what spends the lock
  await page.waitForTimeout(400);
  if (k === 0) return;
  await to(k);
  await expect.poll(() => u(page)).toBeCloseTo(k, 1);
}

/** A trackpad's flick: notches in the same instant, tail and all. */
async function flick(page: Page, notches: number, delta: number) {
  const cdp = await page.context().newCDPSession(page);
  await Promise.all(Array.from({ length: notches }, () => cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 700, y: 500, deltaX: 0, deltaY: delta, pointerType: 'mouse' })));
}

/** The field the page is standing on, once it has stopped moving: a step and its rest, and some room. */
async function landed(page: Page) {
  await page.waitForTimeout(STEP + 700);
  return Math.round((await u(page)) * 100) / 100;
}

test('the way in steps: a notch and a flick both move exactly one field, and both ends hand the page back', async ({ page, isMobile }) => {
  test.skip(isMobile, 'a wheel is the desktop gesture; the thumb is tested below');
  await page.goto('/');
  await expect(page.locator('[data-fields]')).toHaveAttribute('data-live', '');
  await stand(page, 0);
  // where a hand's cursor rests, over the sea itself
  await page.mouse.move(700, 500);

  // a notch: one field, and it lands ON the field
  await page.mouse.wheel(0, 100);
  expect(await landed(page)).toBe(1);

  // a flick ten times as long: still one field
  await page.mouse.wheel(0, 1000);
  expect(await landed(page)).toBe(2);

  // a trackpad's flick: eight notches in the same instant, tail and all, are one gesture — so one field
  await flick(page, 8, 240);
  expect(await landed(page)).toBe(3);

  // the act is over at the last field: the page scrolls on past the sea
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(700);
  expect(await u(page)).toBeGreaterThan(STEPS);

  // and under the first: the page scrolls back up into the hero
  await page.reload();
  await stand(page, 0);
  await page.mouse.move(700, 500);
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(700);
  expect(await u(page)).toBeLessThan(0);
});

test('only once, and only downwards: the way back up is free, and so is the sea after the four have been seen', async ({ page, isMobile }) => {
  test.skip(isMobile, 'a wheel is the desktop gesture');
  await page.goto('/');
  await expect(page.locator('[data-fields]')).toHaveAttribute('data-live', '');
  await stand(page, 1);
  await page.mouse.move(700, 500);

  // up, mid-way in: the page goes where the wheel sent it and is left there — no step, no settle
  const before = await u(page);
  await page.mouse.wheel(0, -200);
  await page.waitForTimeout(STEP + 700);
  const after = await u(page);
  expect(after).toBeLessThan(before);
  expect(before - after).toBeLessThan(0.5);
  expect(Math.abs(after - Math.round(after))).toBeGreaterThan(0.02);

  // down again is still the way in, so it steps
  await stand(page, 0);
  await page.mouse.wheel(0, 100);
  expect(await landed(page)).toBe(1);

  // once the last field has been reached, the sea is free both ways for the rest of the visit
  await stand(page, STEPS);
  await page.mouse.wheel(0, -200);
  await page.waitForTimeout(STEP + 700);
  const up = await u(page);
  expect(STEPS - up).toBeLessThan(0.5);
  expect(Math.abs(up - Math.round(up))).toBeGreaterThan(0.02);
  const wasAt = await u(page);
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(STEP + 700);
  const down = await u(page);
  expect(down).toBeGreaterThan(wasAt);
  expect(down - wasAt).toBeLessThan(0.5);
});

test('arriving fast from above locks onto the first field: the navy is never skipped, and never left in between', async ({ page, isMobile }) => {
  test.skip(isMobile, 'a wheel is the desktop gesture');
  await page.goto('/');
  await expect(page.locator('[data-fields]')).toHaveAttribute('data-live', '');
  await page.mouse.move(700, 500);
  // from the top of the page, a flick whose momentum used to carry the page to the second
  // field (four notches) or the third (eight): the arrival is owed, so it comes back to the navy
  for (const notches of [4, 8]) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.reload();
    await expect(page.locator('[data-fields]')).toHaveAttribute('data-live', '');
    await page.mouse.move(700, 500);
    await flick(page, notches, 240);
    expect(await landed(page), `${notches} notches from the top`).toBe(0);
  }
  // and from there the way in steps as it did
  await page.mouse.wheel(0, 100);
  expect(await landed(page)).toBe(1);
});

test('a step takes about the second it is set to, and the field is on the water when it lands', async ({ page, isMobile }) => {
  test.skip(isMobile, 'measured with a wheel');
  await page.goto('/');
  await stand(page, 0);
  await page.mouse.move(700, 500);
  const t0 = Date.now();
  await page.mouse.wheel(0, 120);
  await expect.poll(() => u(page), { timeout: 3000, intervals: [16] }).toBeCloseTo(1, 1);
  const took = Date.now() - t0;
  expect(took).toBeGreaterThan(STEP / 2);
  expect(took).toBeLessThan(STEP + 800);
  // the second field's words are up and on the water, the first's gone
  const words = page.locator('[data-fields] [data-field]');
  await expect.poll(() => words.nth(1).evaluate((el) => (el as HTMLElement).style.getPropertyValue('--on')), { timeout: 3000 }).toBe('1.000');
  await expect(words.nth(1)).toHaveAttribute('data-on', '');
  await expect(words.nth(0)).not.toHaveAttribute('data-on');
});

test('a thumb steps one field a swipe, and the page is not dragged with it', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the thumb is the phone gesture');
  await page.goto('/');
  await expect(page.locator('[data-fields]')).toHaveAttribute('data-live', '');
  await stand(page, 0);
  const cdp = await page.context().newCDPSession(page);
  const swipe = async (dy: number) => {
    const { width, height } = page.viewportSize()!;
    const x = width / 2;
    const y = height / 2;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 6; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + (dy * i) / 6 }] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  // a swipe up of a third of the screen: one field, and only one
  await swipe(-260);
  expect(await landed(page)).toBe(1);
  // a long swipe: still one
  await swipe(-600);
  expect(await landed(page)).toBe(2);
  // a thumb carrying the page back up is its own: it goes where it was sent, not a whole field
  const before = await u(page);
  await swipe(400);
  const after = await landed(page);
  expect(after).toBeLessThan(before);
  expect(before - after).toBeLessThan(0.9);
  expect(Math.abs(after - Math.round(after))).toBeGreaterThan(0.02);
});

test('a scroll that is nobody’s gesture — a key, the scrollbar — is settled onto a field', async ({ page }) => {
  await page.goto('/');
  await stand(page, 0);
  // stranded two fifths of the way in: the step it started is finished for it
  const s = await span(page);
  await page.evaluate((y) => window.scrollTo(0, y), s.start + ((s.end - s.start) * 0.4) / STEPS);
  expect(await landed(page)).toBe(1);
  // going back up it is left where it was put: the way back is the visitor's own
  await page.evaluate((y) => window.scrollTo(0, y), s.start + ((s.end - s.start) * 0.6) / STEPS);
  const back = await landed(page);
  expect(back).toBeCloseTo(0.6, 1);
});
