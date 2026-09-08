import { expect, test, type Page } from '@playwright/test';
import { site } from '@/content/site.no';

/** Every section below measures against the hero's pin spacing, and that pin is built
 *  inside `document.fonts.ready`. Scrolling past the hero before it exists would put
 *  every `docTop` below 2700px out, so wait for the pin rather than for a fixed delay. */
async function pastHero(page: Page) {
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => document.getElementById('hero')?.parentElement?.classList.contains('pin-spacer') ?? false),
      { timeout: 15_000, message: 'the hero never pinned' })
    .toBe(true);
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3.2));
  await page.waitForTimeout(600);
}

const docTop = (page: Page, sel: string) => page.evaluate((s) => {
  const el = document.querySelector(s)!;
  return el.getBoundingClientRect().top + window.scrollY;
}, sel);

const canvasHasInk = (page: Page) => page.evaluate(() => {
  const c = document.querySelector('#visjon canvas') as HTMLCanvasElement;
  const ctx = c.getContext('2d')!;
  const x = Math.floor(c.width / 2);
  const data = ctx.getImageData(x, 0, 1, c.height).data;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 40) return true;
  return false;
});

/** The three limb names then the root, in the order the tree paints them. From the content
 *  file, so renaming a limb there does not leave a test asserting a name nothing renders. */
const TREE_NAMES = [...site.vision.tree.limbs, site.vision.tree.root];

/** `data-on-dark` is the whole wordmark contract: navy over white, white over the film and
 *  the night still. It flips on `top top` triggers whose `isActive` is `scroll > start`, so
 *  read it a few pixels INSIDE a section, never at exactly its top. */
const wordmark = (page: Page) => page.locator('#site-wordmark');

/**
 * The pins are the page's whole scroll geometry, and nothing below the e2e level can see
 * them: vitest.setup.ts stubs matchMedia to `matches: false`, so no `mm.add` branch ever
 * runs in jsdom. This checks the contract the sections depend on — one spacer each, in
 * document order, laid end to end, and each section really pinned at the top of its own
 * spacer, which is what goes wrong when a trigger's start is measured against a document
 * that has not been pinned yet.
 *
 * Two, not three: Misjon is where the page lands and no longer pins. If a third spacer
 * appears here, something has started holding the scroll again.
 */
test('desktop: the two pins lie end to end, and each section pins where its spacer sits', async ({ page, isMobile }) => {
  test.skip(isMobile, 'only the hero pins on phones');
  await page.goto('/');
  await expect(page.locator('.pin-spacer')).toHaveCount(2, { timeout: 15_000 });

  const spacers = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('.pin-spacer')).map((sp) => ({
      id: sp.querySelector('section')?.id ?? '(no section)',
      top: sp.offsetTop,
      height: sp.offsetHeight,
    })),
  );
  expect(spacers.map((s) => s.id)).toEqual(['hero', 'visjon']);
  for (let i = 1; i < spacers.length; i++) {
    expect(spacers[i].top).toBeGreaterThanOrEqual(spacers[i - 1].top + spacers[i - 1].height);
  }

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

test('desktop: visjon pins, the lines arrive, the tree grows and its names appear', async ({ page, isMobile }) => {
  test.skip(isMobile, 'pinned layout is desktop only');
  await pastHero(page);
  const top = await docTop(page, '#visjon');
  await page.evaluate((y) => window.scrollTo(0, y + 10), top);
  await page.waitForTimeout(1500);
  await expect(page.locator('#visjon [data-line]').first()).toHaveCSS('opacity', '1', { timeout: 5_000 });
  await page.evaluate((y) => window.scrollTo(0, y + window.innerHeight * 1.6), top);
  await page.waitForTimeout(2500);
  for (const name of TREE_NAMES) {
    await expect(page.locator('#visjon [data-limb], #visjon [data-root]').filter({ hasText: name })).toHaveCSS('opacity', '1', { timeout: 5_000 });
  }
  expect(await canvasHasInk(page)).toBe(true);
  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false');
});

/**
 * Three `onRefresh` guards exist for this and nothing pinned them: on a refresh the hero's
 * scrubbed `onUpdate` re-fires at progress 1 and paints the wordmark white, which over
 * Visjon's white section is invisible. Visjon refreshes after the hero (priority 1 vs 2)
 * and says it again. Resize the WIDTH only: every pin length is a percentage of viewport
 * height, so the document geometry and the scroll position we are standing at are
 * untouched, while `resize` still puts ScrollTrigger through a full `_refreshAll`.
 */
test('desktop: a resize while Visjon is pinned keeps the wordmark navy and the tree on screen', async ({ page, isMobile }) => {
  test.skip(isMobile, 'pinned layout is desktop only');
  await pastHero(page);
  const top = await docTop(page, '#visjon');
  // Deep in the pin, so the tree is grown and there is something to lose.
  await page.evaluate((y) => window.scrollTo(0, y + window.innerHeight * 1.5), top);
  await page.waitForTimeout(2500);
  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false');
  expect(await canvasHasInk(page)).toBe(true);

  await page.setViewportSize({ width: 1180, height: 900 });
  await page.waitForTimeout(1200); // ScrollTrigger debounces resize by 200ms; the tree's own is 240ms

  // Only meaningful if we are still where we think we are, so say so rather than assume it.
  const pinnedTop = await page.evaluate(() => document.getElementById('visjon')!.getBoundingClientRect().top);
  expect(Math.abs(pinnedTop), 'the resize moved us out of Visjon\'s pin').toBeLessThanOrEqual(1);
  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false');
  // The resize resized the canvas, which wipes its bitmap. It has to come back: the names
  // are repositioned by the same function, so a blank canvas leaves labels floating in
  // white. tree.ts repaints synchronously at the end of size() rather than trusting the
  // frame loop, whose visibility gate can be stale for a batch of observer entries.
  expect(await canvasHasInk(page), 'the tree went blank after the resize').toBe(true);
});

/**
 * Misjon is white now and does not pin: the copy arrives once and the section then sits
 * still. The wordmark assertion is the one that would silently rot — it used to turn
 * white over the night still, and white on this white section is invisible.
 */
test('desktop: misjon does not pin, the copy arrives and the wordmark stays navy', async ({ page, isMobile }) => {
  test.skip(isMobile, 'pinned layout is desktop only');
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
  await expect(page.locator('.pin-spacer')).toHaveCount(2); // hero, visjon

  // The drape is the section's only ornament, so a blank canvas is a blank section.
  const painted = await page.evaluate(() => {
    const c = document.querySelector('#misjon canvas') as HTMLCanvasElement;
    const ctx = c.getContext('2d')!;
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 20) return true;
    return false;
  });
  expect(painted, 'the drape never painted').toBe(true);
});

/**
 * The wordmark assertions are the point of this test as much as the tree is: both phone
 * bugs found by hand during the build were wordmark handoffs — white on Visjon's white,
 * then navy on the night still — and neither is visible to any check above this level,
 * because the phone handoffs live in `mm.add('(max-width: 767px)')` branches that jsdom
 * never enters (vitest.setup.ts stubs matchMedia to `matches: false`).
 */
test('phone: no pins after the hero; the tree grows, the wordmark hands off, the text arrives', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'stacked layout is the phone layout');
  await pastHero(page);
  await expect(page.locator('.pin-spacer')).toHaveCount(1); // only the hero pins on phones
  const top = await docTop(page, '#visjon');
  // +10, not the exact top: both handoffs sit on `top top` triggers and ScrollTrigger's
  // isActive is `scroll > start`, so at exactly the top the old colour still stands.
  await page.evaluate((y) => window.scrollTo(0, y + 10), top);
  // Navy on Visjon's white. The hero pins on phones too and leaves data-on-dark="true"
  // behind, so this is a real handoff, not the initial attribute never having changed.
  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false');
  for (const name of TREE_NAMES) {
    await expect(page.locator('#visjon [data-limb], #visjon [data-root]').filter({ hasText: name })).toHaveCSS('opacity', '1', { timeout: 8_000 });
  }
  const mtop = await docTop(page, '#misjon');
  await page.evaluate((y) => window.scrollTo(0, y + 10), mtop);
  await page.waitForTimeout(600);

  // The drape is a band above the copy here, not a column beside it, and the renderer
  // turns the bundle a quarter turn to fill it. A band that still drew the side geometry
  // would paint a diagonal smear in one corner and leave most of the strip empty, so
  // this checks both the shape of the box and that colour actually reaches across it.
  const band = await page.evaluate(() => {
    const section = document.getElementById('misjon')!;
    const c = section.querySelector('canvas') as HTMLCanvasElement;
    const ctx = c.getContext('2d')!;
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let painted = 0;
    const columns = new Set<number>();
    for (let y = 0; y < c.height; y += 3) {
      for (let x = 0; x < c.width; x += 3) {
        if (data[(y * c.width + x) * 4 + 3] > 20) { painted++; columns.add(Math.round(x / (c.width / 10))); }
      }
    }
    return { w: c.width, h: c.height, sectionH: section.clientHeight, painted, columns: columns.size };
  });
  expect(band.h, 'the drape is not a band').toBeLessThan(band.sectionH * 0.6);
  expect(band.painted, 'the band never painted').toBeGreaterThan(0);
  expect(band.columns, 'the colour only reached part of the band').toBeGreaterThanOrEqual(8);
  // Navy, not white: Misjon is a white section now, so this is the handoff that would
  // have been left saying "on dark" from the old night still and shown nothing.
  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false');
  await expect(page.locator('#misjon p[data-rise]').nth(1)).toHaveCSS('opacity', '1', { timeout: 8_000 });
  await expect(page.locator('[data-mission-text]')).toContainText('bygger vi broer');
});

/**
 * Støtt oss is the first dark ground since the hero, so it owns a wordmark handoff in
 * both directions. The way back up is Misjon's to make, and that is the half that rots
 * silently: a wordmark left white over Misjon's white section looks like no wordmark.
 */
test('desktop: støtt oss goes dark, the field fills it, and the second route follows the frequency', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the phone layout has its own test');
  await pastHero(page);
  const top = await docTop(page, '#stott-oss');
  await page.evaluate((y) => window.scrollTo(0, y + 10), top);
  await page.waitForTimeout(1500);

  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'true');
  await expect(page.locator('.pin-spacer')).toHaveCount(2); // still just hero and visjon

  const section = page.locator('#stott-oss');
  const s = site.support;

  // How far across the section the drape actually reaches, in tenths from the left. It
  // is deliberately not the whole width — the cool edge feathers out around a third of
  // the way in and the night ground takes over, which is what the white type sits on.
  const painted = await page.evaluate(() => {
    const c = document.querySelector('#stott-oss canvas') as HTMLCanvasElement;
    const ctx = c.getContext('2d')!;
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    const hit = new Array(10).fill(0);
    for (let y = 0; y < c.height; y += 4) {
      for (let x = 0; x < c.width; x += 4) {
        if (data[(y * c.width + x) * 4 + 3] > 20) {
          hit[Math.min(9, Math.floor(x / (c.width / 10)))]++;
        }
      }
    }
    const inked = hit.map((n, i) => (n > 200 ? i : -1)).filter((i) => i >= 0);
    return { columns: inked.length, leftmost: inked[0] ?? 10 };
  });
  expect(painted.columns, 'the field never painted').toBeGreaterThanOrEqual(6);

  /*
   * The amount opens the field out, and this is the only assertion that can tell a field
   * from Misjon's fixed 51 % column: the cover is a number the section drives, so if the
   * wiring from the chosen amount back to the renderer ever breaks, the page still looks
   * entirely plausible and nothing else here would notice.
   */
  const tiers = section.getByRole('group', { name: s.amountLabel }).getByRole('button');
  await tiers.nth(4).click();
  await expect(section.locator('[data-amount]')).toHaveText(/2\s*500/);
  await page.waitForTimeout(1800); // the cover tween is 0.9s
  const opened = await page.evaluate(() => {
    const c = document.querySelector('#stott-oss canvas') as HTMLCanvasElement;
    const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    const hit = new Array(10).fill(0);
    for (let y = 0; y < c.height; y += 4) {
      for (let x = 0; x < c.width; x += 4) {
        if (data[(y * c.width + x) * 4 + 3] > 20) {
          hit[Math.min(9, Math.floor(x / (c.width / 10)))]++;
        }
      }
    }
    return hit.findIndex((n) => n > 200);
  });
  expect(opened, 'the largest gift did not spread the field any further')
    .toBeLessThan(painted.leftmost);
  await tiers.nth(1).click();
  await expect(section.locator('[data-amount]')).toHaveText(`250 ${s.unit.once}`);

  /*
   * Shut until asked for, which is two separate things: the panel collapses to no height
   * at all, and its contents go inert so they are not in the tab order or the
   * accessibility tree while they are out of sight. Neither is `toBeHidden` — a row
   * clipped by an ancestor's overflow keeps a box of its own, and Playwright rightly
   * calls it visible — so measure the clip and read the attribute.
   */
  const clip = '#stott-detaljer > div';
  const shut = await page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement;
    return {
      height: Math.round(el.getBoundingClientRect().height),
      inert: el.firstElementChild!.hasAttribute('inert'),
    };
  }, clip);
  expect(shut).toEqual({ height: 0, inert: true });

  await section.getByRole('button', { name: s.alt.once }).click();
  await expect(section.getByRole('heading', { name: s.transfer.title })).toBeVisible();
  await expect(section.getByText(s.account)).toBeVisible();
  await expect
    .poll(() => page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLElement;
      return el.firstElementChild!.hasAttribute('inert') ? -1 : Math.round(el.getBoundingClientRect().height);
    }, clip), { timeout: 5_000, message: 'the panel never opened' })
    .toBeGreaterThan(150);

  // AvtaleGiro is the recurring mechanism, so «hver måned» has to offer it instead of a
  // transfer nobody can make repeat on their own.
  await section.getByRole('button', { name: s.frequency.month }).click();
  await expect(section.getByRole('button', { name: s.alt.month })).toBeVisible();
  await expect(section.getByRole('heading', { name: s.avtalegiro.title })).toBeVisible();
  await expect(section.getByText(s.kid)).toBeVisible();
  await expect(section.getByRole('button', { name: /Vipps/ })).toHaveText(/i måneden/);

  // Back up into Misjon, which is white and has to take the wordmark back.
  const mtop = await docTop(page, '#misjon');
  await page.evaluate((y) => window.scrollTo(0, y + 10), mtop);
  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false', { timeout: 5_000 });
});

test('phone: støtt oss hands the wordmark over, and the button spans the column', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the phone layout');
  await pastHero(page);
  const top = await docTop(page, '#stott-oss');
  await page.evaluate((y) => window.scrollTo(0, y + 10), top);
  await page.waitForTimeout(800);
  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'true');

  const section = page.locator('#stott-oss');
  const s = site.support;
  await section.getByRole('button', { name: s.frequency.month }).click();
  await section.getByRole('button', { name: s.alt.month }).click();
  await expect(section.getByText(s.kid)).toBeVisible();

  // The one thing the phone layout changes: a payment button sized to its own words
  // leaves a 58px target adrift in the middle of a 375px screen.
  const box = await section.getByRole('button', { name: /Vipps/ }).boundingBox();
  const width = page.viewportSize()!.width;
  expect(box!.width, 'the Vipps button is not the width of the column')
    .toBeGreaterThan(width - 2 * 24 - 4); // --margin is 24px below 768
});
