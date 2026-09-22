import { expect, test, type Page } from '@playwright/test';
import { STEP } from '../components/home/step';
import { STEPS } from '../components/home/tide';

/**
 * The sea is stepped: while it holds the screen, one gesture moves one field and stops
 * there — a notch or a flick, it makes no difference — and above and below it the page
 * scrolls as it always did. The owner's ask of 2026-09-22: «if you scroll a little or a
 * lot you should just go to the next one, stop», over a second (their «half the speed» of
 * the half second they first asked for and then saw).
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

/** Put the page on a field without a gesture, and let the act catch up. */
async function stand(page: Page, k: number) {
  const s = await span(page);
  await page.evaluate((y) => window.scrollTo(0, y), s.start + ((s.end - s.start) * k) / STEPS);
  await expect.poll(() => u(page)).toBeCloseTo(k, 1);
}

/** The field the page is standing on, once it has stopped moving: a step and its rest, and some room. */
async function landed(page: Page) {
  await page.waitForTimeout(STEP + 700);
  return Math.round((await u(page)) * 100) / 100;
}

test('the sea steps: a notch and a flick both move exactly one field, and both ends hand the page back', async ({ page, isMobile }) => {
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
  const cdp = await page.context().newCDPSession(page);
  const flick = (dy: number) => Promise.all(
    Array.from({ length: 8 }, () => cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 700, y: 500, deltaX: 0, deltaY: dy, pointerType: 'mouse' })),
  );
  await flick(240);
  expect(await landed(page)).toBe(3);

  // and back, one at a time
  await page.mouse.wheel(0, -1200);
  expect(await landed(page)).toBe(2);

  // the act is over at the last field: the page scrolls on past the sea
  await stand(page, STEPS);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(700);
  expect(await u(page)).toBeGreaterThan(STEPS);

  // and under the first: the page scrolls back up into the hero
  await stand(page, 0);
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(700);
  expect(await u(page)).toBeLessThan(0);
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
  // back down
  await swipe(400);
  expect(await landed(page)).toBe(1);
});

test('a scroll that is nobody’s gesture — a key, the scrollbar — is settled onto a field', async ({ page }) => {
  await page.goto('/');
  await stand(page, 0);
  // stranded two fifths of the way in: the step it started is finished for it
  const s = await span(page);
  await page.evaluate((y) => window.scrollTo(0, y), s.start + ((s.end - s.start) * 0.4) / STEPS);
  expect(await landed(page)).toBe(1);
  // and a nudge back short of the commit returns to the field it left
  await page.evaluate((y) => window.scrollTo(0, y), s.start + ((s.end - s.start) * 0.9) / STEPS);
  expect(await landed(page)).toBe(1);
});
