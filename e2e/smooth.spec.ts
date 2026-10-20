import { expect, test, type Page } from '@playwright/test';
import { brief } from '../content/brief.no';
import { site } from '../content/site.no';

/**
 * The page's glide (lib/smooth.ts, 2026-09-25): on a touchpad, a TrackPoint or a mouse the home
 * page's scroll is smoothed, and the plates answer to it in the frame it moves — one smoothing
 * layer, so the page and the picture move as one body and come to rest together. A phone and
 * reduced motion keep the browser's own scroll.
 *
 * Gestures are CDP's scroll synthesiser: a real stream of wheel events over time, which the glide
 * can take (a listener that was there before the gesture began may cancel it). Playwright's
 * `mouse.wheel` sends a discrete notch that arrives uncancelable.
 */

async function open(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-fields][data-live]')).toBeAttached();
}

/** A gesture of `px` down the page at `speed` px/s, made in the middle of the screen. */
async function gesture(page: Page, px: number, speed: number) {
  const { width, height } = page.viewportSize()!;
  const cdp = await page.context().newCDPSession(page);
  await page.mouse.move(width / 2, height / 2);
  await cdp.send('Input.synthesizeScrollGesture', { x: width / 2, y: height / 2, xDistance: 0, yDistance: -px, speed, gestureSourceType: 'mouse' });
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

type Frame = { ts: number; y: number; open: string };
/** Every frame's final scroll and every plate's `--open`, read from a task queued in the frame (after every frame callback has run). */
async function record(page: Page) {
  await page.evaluate(() => {
    const R = { on: true, frames: [] as Frame[] };
    (window as unknown as { __frames: typeof R }).__frames = R;
    const loop = (ts: number) => {
      if (!R.on) return;
      setTimeout(() => {
        const open = [...document.querySelectorAll<HTMLElement>('[data-scene][style*="--open"]')].map((e) => e.style.getPropertyValue('--open')).join(',');
        R.frames.push({ ts, y: window.scrollY, open });
      }, 0);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}
async function stopRecording(page: Page) {
  return page.evaluate(() => {
    const R = (window as unknown as { __frames: { on: boolean; frames: Frame[] } }).__frames;
    R.on = false;
    return R.frames;
  });
}

const glides = (page: Page) => page.evaluate(() => document.documentElement.classList.contains('lenis') && 'scrollTo' in ((window as unknown as { __lenis?: object }).__lenis ?? {}));

test('the page glides: it carries on after the hand has stopped, and comes to rest exactly where the hand sent it', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the glide is for a touchpad, a TrackPoint or a mouse');
  await open(page);
  expect(await glides(page)).toBe(true);
  const from = await stillAt(page);
  await record(page);
  await gesture(page, 900, 1500);
  const lifted = await page.evaluate(() => performance.now());
  const to = await stillAt(page);
  const frames = await stopRecording(page);
  expect(Math.abs(to - from - 900)).toBeLessThanOrEqual(2);
  // Still on its way a fifth of a second after the last of the gesture: a glide, not a stop.
  let lastMove = 0;
  for (let i = 1; i < frames.length; i++) if (frames[i].y !== frames[i - 1].y) lastMove = frames[i].ts;
  expect(lastMove - lifted).toBeGreaterThan(200);
});

test('the plates move with the page and stop with it: nothing drifts on once the page stands still', async ({ page, isMobile }) => {
  test.skip(isMobile, 'a phone keeps its own scroll, and the plates their ease behind it');
  await open(page);
  const H = page.viewportSize()!.height;
  // The first plate (Visjon og misjon's), its centre 700 px below the middle of the screen: a gesture of 500 opens it most of the way.
  const centre = await page.evaluate(() => {
    const r = document.querySelector<HTMLElement>('[data-scene][style*="--open"]')!.getBoundingClientRect();
    return r.top + window.scrollY + r.height / 2;
  });
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(centre - H / 2 - 700));
  await stillAt(page);
  await record(page);
  await gesture(page, 500, 1500);
  await stillAt(page);
  await page.waitForTimeout(600);
  const frames = await stopRecording(page);
  let stop = 0;
  for (let i = 1; i < frames.length; i++) if (frames[i].y !== frames[i - 1].y) stop = i;
  expect(stop, 'the page moved').toBeGreaterThan(0);
  // The plates did move with it …
  expect(frames[stop].open).not.toBe(frames[0].open);
  // … and not one frame after it: the value is written in the frame the page moves.
  const after = frames.slice(stop).map((f) => f.open);
  expect(new Set(after).size, `after the page stopped: ${[...new Set(after)].join(' | ')}`).toBe(1);
});

test('every page glides, not the home page alone, and a link to another page stops a glide still going', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the glide is for a touchpad, a TrackPoint or a mouse');
  await page.goto('/vart-arbeid');
  // The glide starts once the page's script has run: poll for it, as open() waits for the sea on the home page.
  await expect.poll(() => glides(page)).toBe(true);
  const from = await stillAt(page);
  await record(page);
  await gesture(page, 700, 1500);
  const lifted = await page.evaluate(() => performance.now());
  const to = await stillAt(page);
  const frames = await stopRecording(page);
  expect(Math.abs(to - from - 700)).toBeLessThanOrEqual(2);
  let lastMove = 0;
  for (let i = 1; i < frames.length; i++) if (frames[i].y !== frames[i - 1].y) lastMove = frames[i].ts;
  expect(lastMove - lifted).toBeGreaterThan(200);
  // From the home page to another by the menu in the middle of a glide: the new page starts at its top and stays there.
  await open(page);
  await gesture(page, 1500, 3000);
  await page.getByRole('navigation', { name: site.header.navLabel }).getByRole('link', { name: brief.menu[2], exact: true }).click();
  await expect(page).toHaveURL(/\/vart-arbeid$/);
  expect(await stillAt(page)).toBe(0);
});

/** A thumb's swipe up the screen of `px`, as raw touch events, held still before it lifts so nothing flings (as sea.spec's). */
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

test('on a phone the plates move with the thumb and stop with the page: nothing trails behind it', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the phone');
  await open(page);
  const H = page.viewportSize()!.height;
  const centre = await page.evaluate(() => {
    const r = document.querySelector<HTMLElement>('[data-scene][style*="--open"]')!.getBoundingClientRect();
    return r.top + window.scrollY + r.height / 2;
  });
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(centre - H / 2 - H * 0.7));
  await stillAt(page);
  await record(page);
  await swipe(page, Math.round(H * 0.55));
  await stillAt(page);
  await page.waitForTimeout(600);
  const frames = await stopRecording(page);
  let stop = 0;
  for (let i = 1; i < frames.length; i++) if (frames[i].y !== frames[i - 1].y) stop = i;
  expect(stop, 'the page moved').toBeGreaterThan(0);
  expect(frames[stop].open).not.toBe(frames[0].open);
  const after = frames.slice(stop).map((f) => f.open);
  expect(new Set(after).size, `after the page stopped: ${[...new Set(after)].join(' | ')}`).toBe(1);
});

test('the name goes back into the header on the scroll and lands exactly on the header’s logo, which takes over', async ({ page }) => {
  await open(page);
  // The greeting has played (1.7 s from hydration); then half a screen down, past the dock's end.
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, Math.round(window.innerHeight * 0.5)));
  const off = () =>
    page.evaluate(() => {
      const name = document.getElementById('hovedtekst')!.getBoundingClientRect();
      const logo = [...document.querySelectorAll<HTMLElement>('#topp img[data-logo]')].find((el) => el.getBoundingClientRect().width > 0)!.getBoundingClientRect();
      return Math.max(Math.abs(name.left - logo.left), Math.abs(name.top - logo.top), Math.abs(name.width - logo.width));
    });
  await expect.poll(off, { timeout: 10_000 }).toBeLessThan(1.5);
  await expect(page.locator('#topp')).not.toHaveAttribute('data-lockup');
});

test('phone: a little scroll sends the logo into the header by itself, on the clock, and the top brings it back out', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the phone’s timed glide');
  await open(page);
  await page.waitForTimeout(2500);
  const logo = page.locator('#hovedtekst');
  const start = (await logo.boundingBox())!;
  // A small scroll, then the finger stops: the logo must still go all the way in (Hero.tsx GLIDE_MS, TOUCH_IN).
  await page.evaluate(() => window.scrollTo(0, Math.round(innerHeight * 0.15)));
  await page.waitForTimeout(200);
  // At 200 ms of 700 it is on its way: smaller than it stood, still larger than the header's logo, not landed.
  const mid = await page.evaluate(() => {
    const home = [...document.querySelectorAll<HTMLElement>('#topp img[data-logo]')].find((el) => el.getBoundingClientRect().width > 0)!;
    return { w: document.getElementById('hovedtekst')!.getBoundingClientRect().width, home: home.getBoundingClientRect().width, landed: document.getElementById('topp')!.hasAttribute('data-landed') };
  });
  expect(mid.w, 'a glide, not a jump').toBeLessThan(start.width - 1);
  expect(mid.w, 'a glide, not a jump').toBeGreaterThan(mid.home + 1);
  expect(mid.landed).toBe(false);
  await expect(page.locator('#topp')).toHaveAttribute('data-landed', '', { timeout: 1500 });
  // It lands exactly on the header's logo.
  const at = await page.evaluate(() => {
    const r = document.getElementById('hovedtekst')!.getBoundingClientRect();
    const home = [...document.querySelectorAll<HTMLElement>('#topp img[data-logo]')].find((el) => el.getBoundingClientRect().width > 0)!;
    const h = home.getBoundingClientRect();
    return { dx: Math.abs(r.left - h.left), dy: Math.abs(r.top - h.top), dw: Math.abs(r.width - h.width) };
  });
  expect(at.dx).toBeLessThan(1);
  expect(at.dy).toBeLessThan(1);
  expect(at.dw).toBeLessThan(1);
  // Back at the top it comes out again, to where it stood.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator('#topp')).not.toHaveAttribute('data-landed');
  await page.waitForTimeout(1000);
  const back = (await logo.boundingBox())!;
  expect(Math.abs(back.y - start.y)).toBeLessThan(1);
  expect(Math.abs(back.width - start.width)).toBeLessThan(1);
});

test('a phone keeps its own scroll: no glide', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the phone');
  await open(page);
  expect(await glides(page)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.classList.contains('lenis'))).toBe(false);
});

test('reduced motion keeps the browser’s own scroll: no glide', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the desktop is where the glide would be');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  expect(await glides(page)).toBe(false);
});

test('an open menu holds the page still under a gesture, and closing it gives the page back', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the glide is for a touchpad, a TrackPoint or a mouse; the phone’s drawer is shell.spec’s');
  // A narrow laptop window: the header's items move behind the menu button.
  await page.setViewportSize({ width: 820, height: 900 });
  await open(page);
  expect(await glides(page)).toBe(true);
  const from = await stillAt(page);
  await page.getByRole('button', { name: site.header.open }).click();
  await expect(page.locator('body')).toHaveAttribute('data-scroll-locked', '');
  await gesture(page, 600, 1500);
  expect(await stillAt(page)).toBe(from);
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveAttribute('data-scroll-locked', '');
  await gesture(page, 600, 1500);
  expect(Math.abs((await stillAt(page)) - from - 600)).toBeLessThanOrEqual(2);
});
