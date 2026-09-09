import { expect, test, type Page } from '@playwright/test';
import { site } from '@/content/site.no';
import { film } from '@/lib/film';

/** Every section below measures against the hero's pin spacing, and that pin is built
 *  inside `document.fonts.ready`. Scrolling past the hero before it exists would put
 *  every `docTop` below 2700px out, so wait for the pin rather than for a fixed delay. */
async function pastHero(page: Page) {
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => document.getElementById('hero')?.parentElement?.classList.contains('pin-spacer') ?? false),
      { timeout: 15_000, message: 'the hero never pinned' })
    .toBe(true);
  const pin = await pinOf(page, 'hero');
  await page.evaluate((y) => window.scrollTo(0, y + 200), pin);
  await page.waitForTimeout(600);
}

/**
 * How far a section is actually held, read off its own pin spacer rather than assumed
 * from the `+=N%` in the source. Every scroll target below is a fraction of this, so
 * tuning a pin length is a one-line change in the component and no change here.
 */
const pinOf = (page: Page, id: string) => page.evaluate((sel) => {
  const section = document.getElementById(sel)!;
  const spacer = section.parentElement!;
  if (!spacer.classList.contains('pin-spacer')) return 0;
  return spacer.getBoundingClientRect().height - section.getBoundingClientRect().height;
}, id);

const docTop = (page: Page, sel: string) => page.evaluate((s) => {
  const el = document.querySelector(s)!;
  return el.getBoundingClientRect().top + window.scrollY;
}, sel);

/**
 * Anything drawn at all on the TREE's canvas, sampled across the whole of it rather than
 * down one column: the tree is a line drawing and a single column of pixels can miss it
 * honestly.
 *
 * Scoped to `[data-tree]` and not to `#visjon canvas`, which now matches the ink first. The
 * ink is WebGL and `getContext('2d')` on it returns null — the query would not fail, it
 * would throw somewhere that reads like the tree being broken.
 */
const treeHasInk = (page: Page) => page.evaluate(() => {
  const c = document.querySelector('#visjon [data-tree] canvas') as HTMLCanvasElement;
  const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
  for (let y = 0; y < c.height; y += 3) {
    for (let x = 0; x < c.width; x += 3) if (data[(y * c.width + x) * 4 + 3] > 40) return true;
  }
  return false;
});

/**
 * What every box has to be true of, whether or not the simulation runs.
 *
 * The ink is deliberately optional: `createInk` declines wherever WebGL2 or a float colour
 * buffer is missing, and CI's headless GPU is exactly the kind of place that happens. An
 * assertion that the canvas painted would fail on a page that is behaving correctly — the
 * same trap as asserting a value that is meant to change. So this asserts the contract
 * instead: the box carries its ground and a still picture, and where the simulation DID
 * start, its canvas has been sized to the box rather than left at the 300×150 default.
 */
async function boxIsPainted(page: Page, id: string, ground: string) {
  const box = await page.evaluate((sel) => {
    const canvas = document.querySelector(`${sel} canvas[data-ink]`) as HTMLCanvasElement | null;
    if (!canvas) return null;
    const el = canvas.parentElement!;
    const cs = getComputedStyle(el);
    return {
      background: cs.backgroundColor,
      still: cs.backgroundImage,
      bitmap: [canvas.width, canvas.height] as [number, number],
      css: Math.round(el.getBoundingClientRect().width),
    };
  }, `#${id}`);

  expect(box, `#${id} has no ink canvas`).not.toBeNull();
  const rgb = ground.match(/\w\w/g)!.map((h) => parseInt(h, 16)).join(', ');
  expect(box!.background, `#${id} lost its ground`).toBe(`rgb(${rgb})`);
  expect(box!.still, `#${id} lost its still picture`).toContain('gradient');
  // Either the simulation started and sized its bitmap to the box, or it declined and the
  // canvas is untouched. A bitmap that is neither means resize ran and got a broken measure.
  const started = box!.bitmap[0] !== 300 || box!.bitmap[1] !== 150;
  if (started) expect(box!.bitmap[0]).toBeGreaterThan(box!.css * 0.3);
}

/** The three limb names then the root, in the order the tree paints them. From the content
 *  file, so renaming a limb there does not leave a test asserting a name nothing renders. */
const TREE_NAMES = [...site.vision.tree.limbs, site.vision.tree.root];

/** `data-on-dark` is the whole wordmark contract. Nothing after the hero is dark any more,
 *  so below the film it must read false everywhere — including over Støtt oss, which used
 *  to be the one night section and is the assertion most likely to rot silently. */
const wordmark = (page: Page) => page.locator('#site-wordmark');

/**
 * The pins are the page's whole scroll geometry, and nothing below the e2e level can see
 * them: vitest.setup.ts stubs matchMedia to `matches: false`, so no `mm.add` branch ever
 * runs in jsdom. One spacer, not two: Visjon's tree opens on a clock and gave its pin back,
 * so the hero is the only thing on the page that holds you. A second spacer here means
 * something below the film has started sticking again.
 */
test('desktop: the hero is the only pin, and it pins where its spacer sits', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the hero pins on phones too, but the rest of this file is desktop');
  await page.goto('/');
  await expect(page.locator('.pin-spacer')).toHaveCount(1, { timeout: 15_000 });

  const spacers = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('.pin-spacer')).map((sp) => ({
      id: sp.querySelector('section')?.id ?? '(no section)',
      top: sp.offsetTop,
      height: sp.offsetHeight,
    })),
  );
  expect(spacers.map((s) => s.id)).toEqual(['hero']);

  // A stale measurement leaves the spacer where it is but sends the trigger's start
  // somewhere else, so ask the page instead: at the top of each spacer the section it
  // holds must actually be pinned against the top of the viewport.
  for (const s of spacers) {
    await page.evaluate((y) => window.scrollTo(0, y + 10), s.top);
    await expect
      .poll(() => page.evaluate((id) => Math.abs(document.getElementById(id)!.getBoundingClientRect().top), s.id), {
        timeout: 5_000,
        message: `#${s.id} is not pinned at the top of its own spacer (${s.top})`,
      })
      .toBeLessThanOrEqual(1);
  }
});

/**
 * The tree used to be scrubbed by a pin here, and this test scrolled through the pin to
 * open it. It runs on a clock now, so arriving IS the interaction — nothing below scrolls
 * a pixel after the first line, and what follows is what arriving has to be worth.
 */
test('desktop: visjon does not pin; the lines arrive, the tree opens, the box holds ink', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the two-column layout is desktop only');
  await pastHero(page);
  const top = await docTop(page, '#visjon');
  await page.evaluate((y) => window.scrollTo(0, y + 10), top);
  await expect(page.locator('#visjon [data-line]').first()).toHaveCSS('opacity', '1', { timeout: 5_000 });
  // Generous, because this is a 3s tween finishing on its own and not a scroll we drive.
  for (const name of TREE_NAMES) {
    await expect(page.locator('#visjon [data-limb], #visjon [data-root]').filter({ hasText: name })).toHaveCSS('opacity', '1', { timeout: 12_000 });
  }
  expect(await treeHasInk(page)).toBe(true);
  await boxIsPainted(page, 'visjon', film.vision.ground);
  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false');
  await expect(page.locator('.pin-spacer')).toHaveCount(1); // the section holds nothing
});

/**
 * The hand-set lines are the whole reason the headline is sized against its card. They are
 * `nowrap`, so a size that stops fitting shows as an overflow rather than as a silent
 * re-wrap — and this is the only level that can see it, since jsdom has no layout.
 */
test('desktop: visjon’s hand-set lines each fit on one line', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the phone layout has its own type scale');
  await pastHero(page);
  const overflow = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('#visjon [data-line]'))
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => el.textContent));
  expect(overflow, 'a hand-set line ran out of its card').toEqual([]);
});

/**
 * Three `onRefresh` guards exist for this and nothing pinned them: on a refresh the hero's
 * scrubbed `onUpdate` re-fires at progress 1 and paints the wordmark white, which over
 * Visjon's light box is invisible. Resize the WIDTH only: every pin length is a percentage
 * of viewport height, so the document geometry and the scroll position we are standing at
 * are untouched, while `resize` still puts ScrollTrigger through a full `_refreshAll`.
 */
test('desktop: a resize on Visjon keeps the wordmark navy and the tree on screen', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the two-column layout is desktop only');
  await pastHero(page);
  const top = await docTop(page, '#visjon');
  await page.evaluate((y) => window.scrollTo(0, y + 10), top);
  await page.waitForTimeout(4500); // the tree opens on a 3s clock; there has to be one to lose
  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false');
  expect(await treeHasInk(page)).toBe(true);

  await page.setViewportSize({ width: 1180, height: 900 });
  await page.waitForTimeout(1200); // ScrollTrigger debounces resize by 200ms; the tree's own is 240ms

  // Only meaningful if we are still looking at the thing, so say so rather than assume it.
  const onScreen = await page.evaluate(() => {
    const r = document.querySelector('#visjon [data-tree] canvas')!.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  });
  expect(onScreen, 'the resize took Visjon off screen').toBe(true);
  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false');
  // The resize resized the canvas, which wipes its bitmap. It has to come back: the names
  // are repositioned by the same function, so a blank canvas leaves labels floating in
  // white. tree.ts repaints synchronously at the end of size() rather than trusting the
  // frame loop, whose visibility gate can be stale for a batch of observer entries.
  expect(await treeHasInk(page), 'the tree went blank after the resize').toBe(true);
});

/**
 * Misjon is where the page lands: the copy arrives once and the section then sits still.
 * The wordmark assertion is the one that would silently rot — it used to turn white over a
 * night still, and white on this light box is invisible.
 */
test('desktop: misjon does not pin, the copy arrives and the wordmark stays navy', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the phone layout has its own test');
  await pastHero(page);
  const top = await docTop(page, '#misjon');
  await page.evaluate((y) => window.scrollTo(0, y + window.innerHeight * 0.4), top);
  await page.waitForTimeout(1500);

  const stanza = page.locator('#misjon p[data-rise]').nth(1);
  await expect(stanza).toHaveCSS('opacity', '1', { timeout: 5_000 });
  const mission = page.locator('[data-mission-text]');
  await expect(mission).toContainText('bygger vi broer');
  await expect(mission.getByRole('link', { name: site.hero.cta }))
    .toHaveAttribute('href', `mailto:${site.contact.email}`);
  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false');
  await expect(page.locator('.pin-spacer')).toHaveCount(1); // only the hero
  await boxIsPainted(page, 'misjon', film.mission.ground);
});

/**
 * Støtt oss, rebuilt. It is a light box now like the two above it, which is why the
 * wordmark assertion here matters more than it looks: this section used to own the page's
 * one handoff to white, and a wordmark left white over a light box looks like no wordmark.
 *
 * The three routes lead because they are the part that works today — no payment is wired,
 * every number is a placeholder, and a number you copy into your own bank needs nothing
 * built. So all three are on screen with nothing to open, which is the thing that would
 * regress if a disclosure panel ever came back.
 */
test('desktop: støtt oss shows all three routes and the amount follows the tiers', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the phone layout has its own test');
  await pastHero(page);
  const top = await docTop(page, '#stott-oss');
  await page.evaluate((y) => window.scrollTo(0, y + 10), top);
  await page.waitForTimeout(1500);

  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false');
  await expect(page.locator('.pin-spacer')).toHaveCount(1); // still just the hero
  await boxIsPainted(page, 'stott-oss', film.support.ground);

  const section = page.locator('#stott-oss');
  const s = site.support;

  for (const route of s.routes) {
    await expect(section.getByText(route.value, { exact: true })).toBeVisible();
    await expect(section.getByText(route.how)).toBeVisible();
  }

  const tiers = section.getByRole('group', { name: s.giver.amountLabel }).getByRole('button');
  await expect(tiers).toHaveCount(s.tiers.length);
  await expect(section.locator('[data-amount]')).toHaveText(String(s.tiers[s.giver.preselect]));
  await tiers.last().click();
  await expect(section.locator('[data-amount]')).toHaveText(/1\s*000/);
  await expect(tiers.last()).toHaveAttribute('aria-pressed', 'true');

  // The card is the film's last scene and the only additive ink on the site. It is a
  // separate simulation from the box, so it gets its own check.
  const card = await page.evaluate(() => {
    const c = document.querySelector('#stott-oss canvas[data-ink-card]') as HTMLCanvasElement;
    const cs = getComputedStyle(c.parentElement!);
    return { background: cs.backgroundColor, bitmap: [c.width, c.height] };
  });
  expect(card.background).toBe('rgb(12, 19, 29)'); // film.supportCard.ground, #0c131d

  // There is no frequency toggle any more, and no panel to open for a number.
  await expect(section.getByRole('group', { name: /hvor ofte/i })).toHaveCount(0);
  await expect(section.locator('#stott-detaljer')).toHaveCount(0);
});

/**
 * The heading measures its own words and scales to the measure, and it does that again once
 * the font arrives — measured in the fallback face it comes out several points too small,
 * and nothing about the page changes afterwards to trigger a re-measure. Both lines are
 * `nowrap`, so a fit that failed shows as an overflow.
 */
test('desktop: the støtt oss heading fills its measure without overflowing', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the phone measure is much narrower');
  await pastHero(page);
  const top = await docTop(page, '#stott-oss');
  await page.evaluate((y) => window.scrollTo(0, y + 10), top);
  const fit = await page.evaluate(() => {
    const h2 = document.querySelector('#stott-oss [data-title]') as HTMLElement;
    const measure = h2.clientWidth;
    const widest = Math.max(...Array.from(h2.querySelectorAll('span')).map((s) => {
      const r = document.createRange();
      r.selectNodeContents(s);
      return r.getBoundingClientRect().width;
    }));
    return { measure, widest, overflow: h2.scrollWidth - h2.clientWidth };
  });
  expect(fit.overflow, 'the heading ran out of its card').toBeLessThanOrEqual(1);
  // It is meant to LAND on the measure, not merely fit inside it — a heading sized to half
  // the column would pass an overflow check and fail the design.
  expect(fit.widest).toBeGreaterThan(fit.measure * 0.75);
});

/**
 * The wordmark assertions are the point of this test as much as the tree is: both phone
 * bugs found by hand during the earlier build were wordmark handoffs, and neither is
 * visible to any check below this level, because the phone branches live in
 * `mm.add('(max-width: 767px)')` blocks that jsdom never enters.
 */
test('phone: no pins after the hero; the tree grows and every section stays legible', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'stacked layout is the phone layout');
  await pastHero(page);
  await expect(page.locator('.pin-spacer')).toHaveCount(1); // the hero is the only pin

  const top = await docTop(page, '#visjon');
  // +10, not the exact top: the handoff sits on a `top top` trigger and ScrollTrigger's
  // isActive is `scroll > start`, so at exactly the top the old colour still stands.
  await page.evaluate((y) => window.scrollTo(0, y + 10), top);
  // Navy on Visjon's light box. The hero pins on phones too and leaves data-on-dark="true"
  // behind, so this is a real handoff, not the initial attribute never having changed.
  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false');
  for (const name of TREE_NAMES) {
    await expect(page.locator('#visjon [data-limb], #visjon [data-root]').filter({ hasText: name })).toHaveCSS('opacity', '1', { timeout: 8_000 });
  }

  const mtop = await docTop(page, '#misjon');
  await page.evaluate((y) => window.scrollTo(0, y + 10), mtop);
  await page.waitForTimeout(800);
  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false');
  await expect(page.locator('#misjon p[data-rise]').nth(1)).toHaveCSS('opacity', '1', { timeout: 8_000 });
  await expect(page.locator('[data-mission-text]')).toContainText('bygger vi broer');

  const stop = await docTop(page, '#stott-oss');
  await page.evaluate((y) => window.scrollTo(0, y + 10), stop);
  await page.waitForTimeout(800);
  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false');
  // Stacked, the three routes become one column; all three still have to be reachable
  // without opening anything.
  for (const route of site.support.routes) {
    await expect(page.locator('#stott-oss').getByText(route.value, { exact: true })).toBeVisible();
  }
});

/** The hand-set lines shrink faster than the desktop clamp on a phone, or they run out of
 *  the card. Same contract as the desktop test, at the width that actually breaks it. */
test('phone: no hand-set line runs out of its card', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the phone type scale');
  await pastHero(page);
  const overflow = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('#visjon [data-line], #misjon [class*="line"]'))
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => el.textContent));
  expect(overflow, 'a hand-set line ran out of its card').toEqual([]);
});
