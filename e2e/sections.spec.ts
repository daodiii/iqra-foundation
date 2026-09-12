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
 * Anything drawn at all on a canvas, sampled across the whole of it rather than down one
 * column: the tree is a line drawing and a single column of pixels can miss it honestly.
 *
 * Scoped by the caller — `#visjon canvas` alone matches the ink first, which is WebGL:
 * `getContext('2d')` on it returns null, and the query would not fail, it would throw
 * somewhere that reads like the tree being broken.
 */
const canvasHasPaint = (page: Page, selector: string) => page.evaluate((sel) => {
  const c = document.querySelector(sel) as HTMLCanvasElement;
  const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
  for (let y = 0; y < c.height; y += 3) {
    for (let x = 0; x < c.width; x += 3) if (data[(y * c.width + x) * 4 + 3] > 40) return true;
  }
  return false;
}, selector);
const treeHasInk = (page: Page) => canvasHasPaint(page, '#visjon [data-tree] canvas');

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
    const canvas = document.querySelector(`${sel} canvas[data-ink], ${sel} canvas[data-water]`) as HTMLCanvasElement | null;
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

/** The three cards around the tree, from the content file, so renaming a value there does
 *  not leave a test asserting a name nothing renders. */
const VALUE_CARDS = site.vision.values.map((v) => `#visjon [data-value="${v.key}"]`);

/**
 * How far the timeline's hairline is drawn from the centre of its pegs, in pixels.
 *
 * The line is a pseudo-element on the list and the pegs are in the stops, so the two are
 * positioned by different rules and only agree by arithmetic. Read from the computed style
 * because a pseudo-element has no box to measure: it is placed from the top on a desktop,
 * where the rows either side of it are equal, and from the bottom on a phone, where they
 * are not.
 */
const lineAgainstPegs = (page: Page) => page.evaluate(() => {
  const rail = document.querySelector('#arrangementer [role="region"]')!;
  const axis = rail.querySelector('ol')!;
  const box = axis.getBoundingClientRect();
  const peg = rail.querySelector('[data-today] [class*="peg"]')!.getBoundingClientRect();
  const style = getComputedStyle(axis, '::before');
  const drawn = style.top === 'auto'
    ? box.bottom - parseFloat(style.bottom)
    : box.top + parseFloat(style.top);
  return Math.abs(drawn - (peg.top + peg.height / 2));
});

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
 * a pixel after the first line, and what follows is what arriving has to be worth: the
 * arch drawn, the sky inside it, the three cards surfaced in its wake, the name under the
 * roots.
 */
test('desktop: visjon does not pin; the cards surface, the tree opens, the sky is painted, the box holds ink', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the arch with the cards on its flanks is the desktop layout');
  await pastHero(page);
  const top = await docTop(page, '#visjon');
  await page.evaluate((y) => window.scrollTo(0, y + 10), top);
  // Generous, because this is a 3s tween finishing on its own and not a scroll we drive.
  for (const card of VALUE_CARDS) {
    await expect(page.locator(card)).toHaveCSS('opacity', '1', { timeout: 12_000 });
  }
  await expect(page.locator('#visjon [data-root]')).toHaveCSS('opacity', '1', { timeout: 12_000 });
  expect(await treeHasInk(page)).toBe(true);
  expect(await canvasHasPaint(page, '#visjon [data-scene]'), 'the sky never opened inside the arch').toBe(true);
  expect(await canvasHasPaint(page, '#visjon [data-stroke]'), 'the arch was never drawn').toBe(true);
  await boxIsPainted(page, 'visjon', film.vision.ground);
  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false');
  await expect(page.locator('.pin-spacer')).toHaveCount(1); // the section holds nothing
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

  // The cards are placed by CSS and the stage by JS from where they landed; after a resize
  // both have to agree — every card inside the figure, and the stage inside the column.
  const inside = await page.evaluate(() => {
    const fig = document.querySelector('#visjon [data-figure]')!.getBoundingClientRect();
    const cards = Array.from(document.querySelectorAll('#visjon [data-value]')).map((c) => c.getBoundingClientRect());
    const stage = document.querySelector('#visjon [data-tree]')!.getBoundingClientRect();
    return cards.every((r) => r.left >= fig.left - 1 && r.right <= fig.right + 1)
      && stage.bottom <= fig.bottom + 1 && stage.top >= cards[1].bottom;
  });
  expect(inside, 'a card left the box, or the stage overlaps the top card').toBe(true);
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
  await boxIsPainted(page, 'stott-oss', film.supportWater.ground);

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

  // The card is the film's last scene and the only night water on the site. It is a
  // separate simulation from the box, so it gets its own check.
  const card = await page.evaluate(() => {
    const c = document.querySelector('#stott-oss canvas[data-water-card]') as HTMLCanvasElement;
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
 * The order IS the argument.
 *
 * The page walks the film's scenes and thins its material as it goes: ink for the cave and
 * the mosque, then the page's own white, then clear water over Arafat and green water under
 * the ask. Arrangementer · Nyheter has to stay between the ink and the water — it is the
 * breath that makes the change of material read as the ink clearing rather than as one more
 * coloured rectangle — and Teamet has to stay directly above Støtt oss, whose headline is
 * «Tjue stykker gjør arbeidet». A reordering would leave every section working and the page
 * saying something else.
 */
test('the page walks from ink through white into water, in that order', async ({ page }) => {
  await page.goto('/');
  const order = await page.evaluate(() =>
    Array.from(document.querySelectorAll('main section')).map((s) => s.id));
  expect(order).toEqual(['hero', 'visjon', 'misjon', 'arrangementer', 'om-oss-teamet', 'stott-oss']);
});

test('desktop: om oss · teamet is water over Arafat, with the story and the team on it', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the phone layout has its own test');
  await pastHero(page);
  const top = await docTop(page, '#om-oss-teamet');
  await page.evaluate((y) => window.scrollTo(0, y + 10), top);
  await page.waitForTimeout(1200);

  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false');
  await boxIsPainted(page, 'om-oss-teamet', film.people.ground);

  const section = page.locator('#om-oss-teamet');
  const [story, menneskene] = site.about.chapters;
  // Both cards are the book's own chapters, so this is also the check that the landing page
  // and /om-oss cannot drift: the words are read from the same place the book reads them.
  await expect(section.getByText(story.lede)).toBeVisible();
  await expect(section.getByText(menneskene.lede)).toBeVisible();
  await expect(section.getByText(menneskene.paras[0])).toBeVisible();
  // Held back on purpose: the link below is only an offer if something was not said here.
  await expect(section.getByText(story.paras[2])).toHaveCount(0);
  await expect(section.getByRole('link', { name: new RegExp(site.people.more) }))
    .toHaveAttribute('href', '/om-oss');
  // One card for one person at a time, under the two: it opens on the first member, sits
  // below the team card with the portrait left of the name, and the arrow steps to the
  // next — wrapping to the first after the last, so it never stops working.
  const card = section.locator('[data-row]');
  await expect(card).toHaveCount(1);
  await expect(card).toContainText(menneskene.team[0].role);
  await expect(card).toContainText(`1 / ${menneskene.team.length}`);
  const teamCard = section.getByText(menneskene.lede).locator('..');
  expect((await card.boundingBox())!.y).toBeGreaterThan(
    (await teamCard.boundingBox())!.y + (await teamCard.boundingBox())!.height - 1);
  expect((await card.locator('[data-part="portrait"]').boundingBox())!.x)
    .toBeLessThan((await card.locator('[data-part="info"]').boundingBox())!.x);

  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const next = card.getByRole('button', { name: site.people.next });
  for (let i = 1; i <= menneskene.team.length; i++) {
    await next.click();
    const at = i % menneskene.team.length;
    await expect(card).toHaveAttribute('data-index', String(at));
    await expect(card).toContainText(`${at + 1} / ${menneskene.team.length}`);
  }
  // After the last press the parts have arrived again, not been left half-hidden.
  await page.waitForTimeout(1200);
  const shown = await card.locator('[data-part="info"]').evaluate((el) => getComputedStyle(el).opacity);
  expect(Number(shown)).toBe(1);
});

/**
 * The one section with no box: no ground, no canvas, no card. What it must not do is
 * promise a page that does not exist — «Alle arrangementer →» is rendered from an href in
 * the content file, and there is none yet, so there is no link. A dead link here would be
 * the only thing on the site that answers a click by doing nothing, and no build step would
 * ever catch it.
 */
test('desktop: the axis sits on the page’s own white and links to nothing that is not there', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the phone has its own test for the rail');
  await pastHero(page);
  const top = await docTop(page, '#arrangementer');
  await page.evaluate((y) => window.scrollTo(0, y - 80), top);
  await page.waitForTimeout(900);

  const section = page.locator('#arrangementer');
  await expect(section.getByRole('heading', { level: 2 })).toHaveText(site.happenings.line);
  await expect(section.locator('li')).toHaveCount(
    site.events.items.length + site.news.items.length + 1, // the stops, and today
  );

  expect(await section.evaluate((el) => getComputedStyle(el).backgroundColor))
    .toBe('rgba(0, 0, 0, 0)');
  expect(await section.locator('canvas').count(), 'the breath grew a simulation').toBe(0);
  const hrefs = await section.locator('a').evaluateAll((els) => els.map((a) => a.getAttribute('href')));
  expect(hrefs.filter((h) => !h || h === '#'), 'a link that goes nowhere').toEqual([]);
});

/**
 * The axis's own claim: news behind today, events ahead of it, and you arrive at today
 * rather than at the start of history. Read off the rendered geometry rather than the
 * markup, because the ordering is the point and a stylesheet could undo it.
 */
test('the timeline opens on today, with what was behind it and what is coming ahead', async ({ page }) => {
  await pastHero(page);
  const top = await docTop(page, '#arrangementer');
  await page.evaluate((y) => window.scrollTo(0, y - 80), top);
  await page.waitForTimeout(900);

  const axis = await page.evaluate((kinds) => {
    const rail = document.querySelector('#arrangementer [role="region"]') as HTMLElement;
    const today = rail.querySelector('[data-today]') as HTMLElement;
    const lefts = Array.from(rail.querySelectorAll('li')).map((li) => ({
      x: li.offsetLeft,
      kind: li.textContent?.includes(kinds.news) ? 'news' : li.textContent?.includes(kinds.event) ? 'event' : 'today',
    }));
    return {
      /* Where today sits in the rail's own viewport, which is the claim being made: you
         arrive at today. Asserted this way rather than as a scroll offset because with only
         the placeholder stops on it the axis is shorter than a desktop window and there is
         nothing to scroll — and «already on screen» is the same promise kept. */
      todayOnScreen: today.offsetLeft - rail.scrollLeft,
      width: rail.clientWidth,
      todayAt: today.offsetLeft,
      lefts,
    };
  }, site.happenings.kinds);

  expect(axis.todayOnScreen, 'today is off the left of the rail').toBeGreaterThanOrEqual(0);
  expect(axis.todayOnScreen, 'today is off the right of the rail').toBeLessThan(axis.width);
  expect(await lineAgainstPegs(page), 'the hairline drifted off the pegs').toBeLessThanOrEqual(2);
  for (const stop of axis.lefts) {
    if (stop.kind === 'news') expect(stop.x, 'a news stop sat ahead of today').toBeLessThan(axis.todayAt);
    if (stop.kind === 'event') expect(stop.x, 'an event sat behind today').toBeGreaterThan(axis.todayAt);
  }
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
  for (const card of VALUE_CARDS) {
    await expect(page.locator(card)).toHaveCSS('opacity', '1', { timeout: 8_000 });
  }
  await expect(page.locator('#visjon [data-root]')).toHaveCSS('opacity', '1', { timeout: 8_000 });
  // In flow the arch keeps the top of the section and the cards stack under it, on the
  // same ink: every card starts below the arch area, and the box reaches the last one.
  const stacked = await page.evaluate(() => {
    const arch = document.querySelector('#visjon [data-arch]')!.getBoundingClientRect();
    const box = document.querySelector('#visjon canvas[data-ink]')!.parentElement!.getBoundingClientRect();
    const cards = Array.from(document.querySelectorAll('#visjon [data-value]')).map((c) => c.getBoundingClientRect());
    return cards.every((r) => r.top >= arch.bottom - 1 && r.bottom <= box.bottom + 1);
  });
  expect(stacked, 'a card overlaps the arch or hangs out of the box').toBe(true);

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

/**
 * The people's two cards are side by side on a desktop and there is no room for that on a
 * phone. Asserted as geometry rather than as a media query: what matters is that the second
 * card ends up UNDER the first rather than beside it, whatever the breakpoint says.
 *
 * The timeline is the one layout on the site that does NOT stack, because sideways is what
 * it already is — so it is checked the other way round: it must still scroll, and it must
 * not take the page with it.
 */
test('phone: the cards stack, the axis stays an axis, and nothing pushes the page sideways', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'stacked layout is the phone layout');
  await pastHero(page);

  const peopleTop = await docTop(page, '#om-oss-teamet');
  await page.evaluate((y) => window.scrollTo(0, y - 40), peopleTop);
  await page.waitForTimeout(500);
  // The two chapter cards carry `data-rise`; the member rows below them are `data-row`.
  const cards = await page.locator('#om-oss-teamet [data-rise]').evaluateAll((els) =>
    els.map((el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y) }; }));
  expect(cards.length, 'the people cards').toBe(2);
  expect(cards[0].x, 'the people cards did not stack').toBe(cards[1].x);
  expect(cards[1].y, 'the people cards did not stack').toBeGreaterThan(cards[0].y);
  // The member card on a phone is portrait over name, not beside it.
  const row = page.locator('#om-oss-teamet [data-row]');
  await row.scrollIntoViewIfNeeded();
  // Scrolling to it starts its entrance; measured mid-tween the portrait is still 5%
  // small and 30px low, and the boxes overlap by a couple of pixels that are not layout.
  await page.waitForTimeout(1200);
  const [portrait, info] = await Promise.all([
    row.locator('[data-part="portrait"]').boundingBox(),
    row.locator('[data-part="info"]').boundingBox(),
  ]);
  expect(info!.y, 'the member card did not stack').toBeGreaterThanOrEqual(portrait!.y + portrait!.height);
  expect(Math.round(info!.x), 'the name is not under the portrait').toBe(Math.round(portrait!.x));

  const axisTop = await docTop(page, '#arrangementer');
  await page.evaluate((y) => window.scrollTo(0, y - 40), axisTop);
  await page.waitForTimeout(500);
  const rail = await page.evaluate(() => {
    const el = document.querySelector('#arrangementer [role="region"]') as HTMLElement;
    return { scrollable: el.scrollWidth > el.clientWidth, wider: el.scrollWidth > window.innerWidth };
  });
  expect(rail.scrollable, 'the axis stopped scrolling on a phone').toBe(true);
  expect(rail.wider, 'the axis is not actually longer than the screen').toBe(true);

  /*
   * On a phone every stop sits ABOVE the line, whichever direction in time it belongs to.
   *
   * The desktop puts what is coming above the line and what has been below it, and that is
   * the section's whole visual claim — but the two are contiguous along the axis rather than
   * interleaved, so on a screen showing one stop at a time it costs half the viewport with
   * nothing in it. Down here the direction is carried by the label, by which side of «i dag»
   * you are on, and by the peg: hollow for the past, filled for what is coming.
   */
  const sides = await page.evaluate(() => {
    const el = document.querySelector('#arrangementer [role="region"]') as HTMLElement;
    const line = (el.querySelector('[data-today] span') as HTMLElement).getBoundingClientRect();
    return Array.from(el.querySelectorAll('li article')).map((body) => ({
      bottom: Math.round(body.getBoundingClientRect().bottom),
      line: Math.round(line.top),
    }));
  });
  expect(sides.length, 'no stops to measure').toBeGreaterThan(0);
  for (const stop of sides) {
    expect(stop.bottom, 'a stop hangs below the line on a phone').toBeLessThanOrEqual(stop.line + 2);
  }

  /*
   * And the drawn line is where the pegs are.
   *
   * The hairline is a pseudo-element on the list; the pegs are in the stops. Nothing in CSS
   * keeps them in step, and when the phone's rows stopped being symmetric the line was drawn
   * 138px above the dots — through a screenshot that looked fine, because a 1px hairline over
   * white is invisible until you look for it. Measuring the pegs alone could not see it.
   */
  expect(await lineAgainstPegs(page), 'the hairline drifted off the pegs').toBeLessThanOrEqual(2);

  // The rail is wider than the screen by design; the PAGE still must not be. A 246px stop
  // and a fixed-width frame are exactly the kind of thing that escapes its container.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'the page scrolls sideways on a phone').toBeLessThanOrEqual(1);
});

/** Misjon's hand-set lines shrink faster than the desktop clamp on a phone, or they run
 *  out of the card — this is the width that actually breaks it. Visjon has no hand-set
 *  lines since the arch. */
test('phone: no hand-set line runs out of its card', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the phone type scale');
  await pastHero(page);
  const overflow = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('#misjon [class*="line"]'))
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => el.textContent));
  expect(overflow, 'a hand-set line ran out of its card').toEqual([]);
});
