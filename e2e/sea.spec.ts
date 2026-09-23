import { expect, test, type Page } from '@playwright/test';
import { HOME } from '../components/home/step';
import { STEPS } from '../components/home/tide';

/**
 * The sea holds once, on the navy, and is the visitor's after that. The owner's ask of
 * 2026-09-22 was for the four fields to be stepped one gesture at a time; over three rounds on
 * the running page that became «only once, like when you scroll down», then «lock the first one
 * — when you see the navy, lock it», and finally, standing on the navy: «I just scroll a bit and
 * it moves a lot more than to navy» — from which, asked, they chose the navy as the only hold.
 *
 * Driven with CDP's scroll synthesiser rather than Playwright's `mouse.wheel`: a real gesture
 * streams its wheel events over time, and the discrete notch a harness sends is not the same
 * animal — it is not even cancelable, so a page answering it would be answering something no
 * visitor can produce. The one thing this cannot drive is a page OPENING inside the sea — neither
 * a reload nor a scroll before hydration reproduces a restored position here — so that half of the
 * rule is read in `step.test.ts` instead.
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

/** A gesture of `px`, the way a hand makes one. */
async function scrollBy(page: Page, px: number, speed = 900) {
  const cdp = await page.context().newCDPSession(page);
  await page.mouse.move(700, 500);
  await cdp.send('Input.synthesizeScrollGesture', { x: 700, y: 500, xDistance: 0, yDistance: -px, speed, gestureSourceType: 'mouse' });
}

/** Where the page is once it has stopped moving — the hold takes a moment to decide. */
async function landed(page: Page) {
  await page.waitForTimeout(HOME + 900);
  return Math.round((await u(page)) * 1000) / 1000;
}

/** A visitor arriving at the sea from the hero, and left standing on the navy. */
async function arrive(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-fields][data-live]')).toBeVisible();
  await page.evaluate((y) => window.scrollTo(0, y), 700);
  await page.waitForTimeout(500);
  await scrollBy(page, 400);
  expect(await landed(page)).toBe(0);
}

test('however hard the scroll that reaches it, the page comes to rest on the navy', async ({ page, isMobile }) => {
  test.skip(isMobile, 'a wheel is the desktop gesture');
  for (const [px, speed] of [[900, 800], [1400, 1600], [2200, 3000], [3500, 6000]] as const) {
    await page.goto('/');
    await expect(page.locator('[data-fields][data-live]')).toBeVisible();
    await page.waitForTimeout(400);
    await scrollBy(page, px, speed);
    expect(await landed(page), `${px}px at ${speed}`).toBe(0);
  }
});

test('a scroll that stops short of the sea is left where it stopped', async ({ page, isMobile }) => {
  test.skip(isMobile, 'a wheel is the desktop gesture');
  await page.goto('/');
  await expect(page.locator('[data-fields][data-live]')).toBeVisible();
  await page.waitForTimeout(400);
  await scrollBy(page, 400);
  const at = await landed(page);
  expect(at).toBeLessThan(0);
  expect(at).toBeGreaterThan(-1);
});

test('and then the sea is the visitor’s: a small scroll moves a little, not a field, and is left alone', async ({ page, isMobile }) => {
  test.skip(isMobile, 'a wheel is the desktop gesture');
  await arrive(page);
  // a nudge is a nudge: it used to take a whole screen
  await scrollBy(page, 200);
  const after = await landed(page);
  expect(after).toBeGreaterThan(0);
  expect(after).toBeLessThan(0.45);
  // and nothing tidies it onto a field afterwards
  expect(Math.abs(after - Math.round(after))).toBeGreaterThan(0.02);
  // the way back up is its own too
  await scrollBy(page, -150);
  const back = await landed(page);
  expect(back).toBeLessThan(after);
  expect(back).toBeGreaterThan(-0.2);
});

test('the hold is spent: leaving the sea and coming back does not hold again', async ({ page, isMobile }) => {
  test.skip(isMobile, 'a wheel is the desktop gesture');
  await arrive(page);
  // up into the hero …
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  // … and down again, landing in the first tide, where it stays
  const s = await span(page);
  await page.evaluate((y) => window.scrollTo(0, y), s.start + ((s.end - s.start) * 0.5) / STEPS);
  const at = await landed(page);
  expect(at).toBeGreaterThan(0.3);
  expect(at).toBeLessThan(0.7);
});
