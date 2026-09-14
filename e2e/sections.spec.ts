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

/** The mission's last hand-set line, without its full stop: the stop is set in its own span. */
const lastStanzaLine = site.mission.stanzas[site.mission.stanzas.length - 1].at(-1)!.replace(/\.$/, '');

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
 * arch drawn, the three cards surfaced in its wake, the name under the roots. Nothing is
 * painted inside the arch any more — the ink shows through it — so the only canvases in
 * the area are the stroke's and the tree's.
 */
test('desktop: visjon does not pin; the cards surface, the tree opens, the arch is drawn, the box holds ink', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the arch with the cards on its flanks is the desktop layout');
  await pastHero(page);
  const top = await docTop(page, '#visjon');
  await page.evaluate((y) => window.scrollTo(0, y + 10), top);
  // Generous, because this is a 3s tween finishing on its own and not a scroll we drive.
  // The pen closes each card's frame in the arch's wake; the name and the words fade in with it.
  for (const card of VALUE_CARDS) {
    await expect(page.locator(card)).toHaveAttribute('data-frame-drawn', 'true', { timeout: 12_000 });
    await expect(page.locator(`${card} [data-legend]`)).toHaveCSS('opacity', '1', { timeout: 12_000 });
    await expect(page.locator(`${card} [data-words]`)).toHaveCSS('opacity', '1', { timeout: 12_000 });
  }
  await expect(page.locator('#visjon [data-root]')).toHaveCSS('opacity', '1', { timeout: 12_000 });
  // Each name sits ON its frame's top line, and Inkludering's at the right end of it, so the
  // arch's right flank crosses the unbroken part of the line — as it does for Dialog.
  const legends = await page.evaluate(() =>
    Array.from(document.querySelectorAll('#visjon [data-value]')).map((c) => {
      const r = c.getBoundingClientRect();
      const l = c.querySelector('[data-legend]')!.getBoundingClientRect();
      return { left: l.left - r.left, right: r.right - l.right, mid: l.top + l.height / 2 - r.top };
    }));
  expect(legends[0].left).toBeLessThan(legends[0].right);
  expect(legends[2].right).toBeLessThan(legends[2].left);
  for (const l of legends) expect(Math.abs(l.mid), 'a name is not on its line').toBeLessThan(2);
  expect(await treeHasInk(page)).toBe(true);
  await expect(page.locator('#visjon [data-arch] canvas')).toHaveCount(2); // the stroke and the tree, no scene
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
  await expect(mission).toContainText(lastStanzaLine);
  // The frame closes, the label sits on its top line, and the button sits over the bottom
  // edge — its middle on the card's bottom line, the line running on beneath; no rule.
  await expect(mission).toHaveAttribute('data-frame-drawn', 'true', { timeout: 5_000 });
  const seat = await page.evaluate(() => {
    const card = document.querySelector('[data-mission-text]')!.getBoundingClientRect();
    const legend = document.querySelector('[data-mission-text] [data-legend]')!.getBoundingClientRect();
    const btn = document.querySelector('[data-mission-text] [data-seat] a')!.getBoundingClientRect();
    return { mid: btn.top + btn.height / 2 - card.bottom, legendMid: legend.top + legend.height / 2 - card.top, rule: !!document.querySelector('[data-mission-text] [data-rule]') };
  });
  expect(Math.abs(seat.mid), 'the button is not on the bottom line').toBeLessThan(2);
  expect(Math.abs(seat.legendMid), 'the label is not on the top line').toBeLessThan(2);
  expect(seat.rule).toBe(false);
  await expect(mission.getByRole('link', { name: site.hero.cta }))
    .toHaveAttribute('href', `mailto:${site.contact.email}`);
  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false');
  await expect(page.locator('.pin-spacer')).toHaveCount(1); // only the hero
  await boxIsPainted(page, 'misjon', film.mission.ground);

  // The film is half the wall's height («half the size in height», 2026-09-14), at the
  // top of its column, the ink open under it; it used to run the full height.
  const wall = await page.evaluate(() => {
    const grid = document.querySelector('#misjon [data-tile]')!.parentElement!.getBoundingClientRect();
    const filmTile = document.querySelector('#misjon [data-tile="vid"]')!.getBoundingClientRect();
    return { ratio: filmTile.height / grid.height, top: filmTile.top - grid.top };
  });
  expect(wall.ratio, 'the film is not half the wall').toBeGreaterThan(0.45);
  expect(wall.ratio, 'the film is not half the wall').toBeLessThan(0.52);
  expect(Math.abs(wall.top), 'the film does not sit at the top of its column').toBeLessThan(2);
});

/**
 * Støtt oss: one screen, one number. It was a screen and a half of boxes; the brief was
 * «way too big», so the first assertion is the height. The rest is what the screen holds:
 * the green water painted, one frame drawn with the pen, «Støtt oss» on its line, the
 * number inside the frame — today it is the eight-character placeholder, which is wider
 * than the five digits it stands for, and the one thing on the page that could run out of
 * its box — and nothing to press, because nothing is wired to a payment.
 *
 * The wordmark assertion matters more than it looks: this section used to own the page's
 * one handoff to white, and a wordmark left white over a light box looks like no wordmark.
 */
test('desktop: støtt oss is one screen, one frame and one number', async ({ page, isMobile }) => {
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
  await expect(section.getByRole('heading', { name: s.title })).toBeVisible();
  await expect(section.getByText(s.vipps.value, { exact: true })).toBeVisible();
  await expect(section.getByText(s.also)).toBeVisible();
  await expect(section.getByRole('button')).toHaveCount(0);

  await expect(section.locator('[data-card]')).toHaveAttribute('data-frame-drawn', 'true', { timeout: 8_000 });
  await expect(section.locator('[data-card-square]')).toHaveAttribute('data-frame-drawn', 'true', { timeout: 8_000 });
  // The second square: as tall as it is wide, beside the first, its button sitting over its
  // bottom edge the way Misjon's does.
  const square = await page.evaluate(() => {
    const first = document.querySelector('#stott-oss [data-card]')!.getBoundingClientRect();
    const sq = document.querySelector('#stott-oss [data-card-square]') as HTMLElement;
    const r = sq.getBoundingClientRect();
    const btn = sq.querySelector('[data-pay]')!.getBoundingClientRect();
    return { ratio: r.width / r.height, beside: r.left >= first.right, seat: btn.top + btn.height / 2 - r.bottom };
  });
  expect(Math.abs(square.ratio - 1), 'the card frame is not square').toBeLessThan(0.02);
  expect(square.beside, 'the card frame is not beside the number').toBe(true);
  expect(Math.abs(square.seat), 'the button is not on the bottom edge').toBeLessThan(2);
  const geometry = await page.evaluate(() => {
    const section = document.getElementById('stott-oss')!;
    const card = section.querySelector('[data-card]') as HTMLElement;
    const legend = card.querySelector('[data-legend]')!.getBoundingClientRect();
    const number = card.querySelector('[data-number]') as HTMLElement;
    const c = card.getBoundingClientRect();
    // The glyphs, not the block: the number is `nowrap` in a block as wide as the frame, so
    // its element's rect fits by construction and only the text can run out.
    const range = document.createRange();
    range.selectNodeContents(number);
    const n = range.getBoundingClientRect();
    return {
      screens: section.getBoundingClientRect().height / window.innerHeight,
      legendMid: legend.top + legend.height / 2 - c.top,
      numberInside: n.left >= c.left && n.right <= c.right,
      overflow: number.scrollWidth - number.clientWidth,
    };
  });
  expect(geometry.screens, 'the section is taller than the screen').toBeLessThanOrEqual(1.01);
  expect(Math.abs(geometry.legendMid), 'the label is not on the top line').toBeLessThan(2);
  expect(geometry.numberInside, 'the number ran out of its frame').toBe(true);
  expect(geometry.overflow, 'the number is wider than its line').toBeLessThanOrEqual(1);
});

/**
 * The order IS the argument.
 *
 * The page walks the film's scenes and thins its material as it goes: ink on paper for the
 * sky and the cream, then ink dropped into clear water, then clear water over Arafat and
 * green water under the ask. Arrangementer · Nyheter has to stay between the ink boxes and
 * the water boxes — the shallowest of them, the bridge — and Teamet has to stay
 * directly above Støtt oss, so the ask comes after the people who do the work. A reordering
 * would leave every section working and the page saying something else.
 */
test('the page walks from ink through ink-in-water into water, in that order', async ({ page }) => {
  await page.goto('/');
  const order = await page.evaluate(() =>
    Array.from(document.querySelectorAll('main section')).map((s) => s.id));
  expect(order).toEqual(['hero', 'visjon', 'misjon', 'arrangementer', 'om-oss-teamet', 'stott-oss']);
});

/**
 * The book on the water. Whether it runs is the renderer's own report, `data-book`: on
 * SwiftShader the book draws (it is the water that declines there), so the usual headless
 * run sees the book; a browser with no WebGL at all sees the readable layout, which is
 * asserted on its own terms below rather than skipped — it is what such a visitor gets.
 */
const teamLabel = (k: number) => `${site.people.teamLabel} · ${k} / ${site.about.chapters[1].team!.length}`;

test('desktop: om oss · teamet is the book on the water, the rings turning its pages', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the phone layout has its own test');
  await pastHero(page);
  const top = await docTop(page, '#om-oss-teamet');
  await page.evaluate((y) => window.scrollTo(0, y + 10), top);
  await page.waitForTimeout(1200);

  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false');
  await boxIsPainted(page, 'om-oss-teamet', film.people.ground);

  const section = page.locator('#om-oss-teamet');
  const [story, menneskene] = site.about.chapters;
  // The words are the book's own chapters, so this is also the check that the landing page
  // and /om-oss cannot drift. Presence, not visibility: while the book runs the readable
  // copy is clipped out of sight and stays in the DOM, which is the whole point of it.
  // `exact`: the lede is the paragraph's first sentence, and a substring match would find it there too.
  await expect(section.getByText(story.lede, { exact: true })).toHaveCount(1);
  // Once: the chapters share one stand-in paragraph, and the count line that used to
  // follow it would have been the same paragraph again.
  await expect(section.getByText(story.paras[0], { exact: true })).toHaveCount(1);
  await expect(section.getByRole('link', { name: new RegExp(site.people.more) }))
    .toHaveAttribute('href', '/om-oss');

  const where = section.locator('[data-where]');
  const card = section.locator('[data-row]');
  const next = section.locator('[data-controls]').getByRole('button', { name: site.people.next });
  const prev = section.locator('[data-controls]').getByRole('button', { name: site.people.prev });
  const mode = await section.getAttribute('data-book');

  if (mode === 'on') {
    // The backing store, not the CSS box: `on` only says the renderer started. A canvas
    // measured while it was still display:none keeps the default 300x150 and draws nothing.
    const backing = await section.locator('canvas[data-book]').evaluate((c: HTMLCanvasElement) => [c.width, c.height]);
    expect(backing[0], 'the book canvas never got a real backing store').toBeGreaterThan(600);
    expect(backing[1]).toBeGreaterThan(300);
    // The book opens onto the words; the band says so, and the readable copy is out of
    // sight — clipped to a pixel, which Playwright still calls visible, so it is measured.
    await expect(where).toHaveText(site.about.label);
    const clip = (await section.locator('[data-readable]').boundingBox())!;
    expect(Math.max(clip.width, clip.height), 'the readable copy is not clipped while the book runs').toBeLessThanOrEqual(1);
  } else {
    // No WebGL: the words and the member card are the layout, and the band opens on
    // the first member — the words are not a stop when they are always shown.
    expect(mode).toBe('off');
    await expect(section.getByText(story.lede)).toBeVisible();
    await expect(card).toBeVisible();
    await expect(where).toHaveText(teamLabel(1));
    await expect(card).toHaveAttribute('data-index', '0');
  }

  // The large ring turns to the next member; a turn takes a second, so the label is
  // waited for. Clicked through the DOM rather than the pointer: Playwright's click
  // scrolls the button into view, which moves the page and everything measured on it.
  const press = (b: typeof next) => b.evaluate((el: HTMLButtonElement) => el.click());
  const n = menneskene.team.length;
  for (let k = 1; k <= n; k++) {
    // Without a book the first press already stands on member 1.
    if (!(mode === 'off' && k === 1)) await press(next);
    await expect(where).toHaveText(teamLabel(k), { timeout: 4_000 });
    await expect(card).toHaveAttribute('data-index', String(k - 1));
    await expect(card).toContainText(menneskene.team[k - 1].role);
  }
  // After the last, the long way round to the first — a ring that stopped on the sixth
  // press would look broken, not finished. Then back from the first is the last again.
  await press(next);
  await expect(where).toHaveText(mode === 'on' ? site.about.label : teamLabel(1), { timeout: 5_000 });
  await press(prev);
  await expect(where).toHaveText(teamLabel(n), { timeout: 5_000 });
  await expect(card).toHaveAttribute('data-index', String(n - 1));
});

/**
 * The buttons on to the next section («after each section make a button like Vår visjon»,
 * 2026-09-14): one under the hero's paragraph and one seated on each box's bottom line,
 * and each press lands the page on the section it names — through the page's own scroll
 * setter, so the normaliser and the tween agree about where the page is. Pressed through
 * the DOM rather than the pointer: Playwright's click scrolls the button into view first,
 * which is the very motion being tested. The last section has no button.
 */
test('every button on to the next section lands the page on it, in order', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the phone layout is stacked; the desktop run covers the buttons');
  await pastHero(page);
  const chain = ['visjon', 'misjon', 'arrangementer', 'om-oss-teamet', 'stott-oss'] as const;
  // Start at the hero's end, where its button is.
  const pin = await pinOf(page, 'hero');
  await page.evaluate((y) => window.scrollTo(0, y), pin);
  await page.waitForTimeout(600);
  for (const id of chain) {
    const button = page.locator(`[data-onward="${id}"]`);
    await expect(button).toHaveCount(1);
    await expect(button).toHaveText(site.next[id]);
    await expect(button).toHaveAttribute('href', `#${id}`);
    await button.evaluate((el: HTMLAnchorElement) => el.click());
    await page.waitForTimeout(1400);
    const [top, y] = await Promise.all([docTop(page, `#${id}`), page.evaluate(() => window.scrollY)]);
    expect(Math.abs(y - top), `the page did not land on #${id}`).toBeLessThan(4);
  }
  await expect(page.locator('#stott-oss [data-onward]')).toHaveCount(0);
  // And the four between the sections stand on the page's white — under the box above,
  // above the box below, centred, and inside neither section («take the buttons under
  // their sections», 2026-09-14).
  const before = { misjon: 'visjon', arrangementer: 'misjon', 'om-oss-teamet': 'arrangementer', 'stott-oss': 'om-oss-teamet' } as const;
  for (const [id, prev] of Object.entries(before)) {
    const place = await page.evaluate(([target, above]) => {
      const a = document.querySelector(`[data-onward="${target}"]`)!;
      const r = a.getBoundingClientRect();
      const boxOf = (s: string) => document.querySelector(`#${s} [class*="box"]`)!.getBoundingClientRect();
      const up = boxOf(above), down = boxOf(target);
      return {
        inSection: a.closest('section') !== null,
        underAbove: r.top - up.bottom,
        aboveBelow: down.top - r.bottom,
        centre: r.left + r.width / 2 - window.innerWidth / 2,
      };
    }, [id, prev]);
    expect(place.inSection, `the button on to #${id} is inside a section`).toBe(false);
    expect(place.underAbove, `the button on to #${id} is not under the box above it`).toBeGreaterThan(8);
    expect(place.aboveBelow, `the button on to #${id} is not above the box below it`).toBeGreaterThan(8);
    expect(Math.abs(place.centre), `the button on to #${id} is not centred`).toBeLessThan(2);
  }
});

/**
 * The row on still water: one canvas, the box carrying the water's ground so a device
 * without WebGL2 still sees the sage. The ink that used to fall into it is gone, and a second
 * layer here would be it coming back. What the section must not do is promise a page that
 * does not exist — «Alle arrangementer →» is rendered from an href in the content file, and
 * there is none yet, so there is no link. A dead link here would be the only thing on the
 * site that answers a click by doing nothing, and no build step would ever catch it.
 */
test('desktop: the row sits on still water and links to nothing that is not there', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the phone has its own test for the rail');
  await pastHero(page);
  const top = await docTop(page, '#arrangementer');
  await page.evaluate((y) => window.scrollTo(0, y - 80), top);
  await page.waitForTimeout(1200);

  const section = page.locator('#arrangementer');
  await expect(section.getByRole('heading', { level: 2 })).toHaveText(site.happenings.line);
  await expect(section.locator('li')).toHaveCount(site.events.items.length + site.news.items.length);

  // the heading is on the page's white; the box under it is the water
  expect(await section.evaluate((el) => getComputedStyle(el).backgroundColor))
    .toBe('rgba(0, 0, 0, 0)');
  await boxIsPainted(page, 'arrangementer', film.bridge.ground);
  const layers = await section.locator('[data-box] canvas').evaluateAll((els) =>
    els.map((c) => (c.hasAttribute('data-water') ? 'water' : c.hasAttribute('data-ink') ? 'ink' : '?')));
  expect(layers, 'the water alone, no ink over it').toEqual(['water']);
  const hrefs = await section.locator('a').evaluateAll((els) => els.map((a) => a.getAttribute('href')));
  expect(hrefs.filter((h) => !h || h === '#'), 'a link that goes nowhere').toEqual([]);
});

/**
 * The row's own claim, since the timeline went (2026-09-14): four boxes and nothing else on
 * the rail, the events first and then the news as the content file lists them, and on a
 * desktop all four inside the rail at once with nothing to scroll — read off the rendered
 * geometry rather than the markup, because a stylesheet could undo either.
 */
test('desktop: the four boxes stand in the rail at once, the events then the news', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the phone has its own test for the rail');
  await pastHero(page);
  const top = await docTop(page, '#arrangementer');
  await page.evaluate((y) => window.scrollTo(0, y - 80), top);
  await page.waitForTimeout(900);

  const row = await page.evaluate((kinds) => {
    const rail = document.querySelector('#arrangementer [role="region"]') as HTMLElement;
    const boxes = Array.from(rail.querySelectorAll('li')).map((li) => {
      const r = li.getBoundingClientRect();
      const legend = li.querySelector('[data-legend]')?.textContent;
      return { left: r.left, right: r.right, kind: legend === kinds.event ? 'event' : legend === kinds.news ? 'news' : '?' };
    });
    const r = rail.getBoundingClientRect();
    return { boxes, rail: { left: r.left, right: r.right }, scrollable: rail.scrollWidth > rail.clientWidth + 1 };
  }, site.happenings.kinds);

  expect(row.boxes.map((b) => b.kind)).toEqual(['event', 'event', 'news', 'news']);
  expect(row.scrollable, 'the rail still scrolls with four boxes in it').toBe(false);
  for (const [i, b] of row.boxes.entries()) {
    expect(b.left, `box ${i} starts left of the rail`).toBeGreaterThanOrEqual(row.rail.left);
    expect(b.right, `box ${i} ends past the rail`).toBeLessThanOrEqual(row.rail.right + 1);
    if (i > 0) expect(b.left, `box ${i} is not to the right of box ${i - 1}`).toBeGreaterThan(row.boxes[i - 1].right);
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
    await expect(page.locator(card)).toHaveAttribute('data-frame-drawn', 'true', { timeout: 8_000 });
    await expect(page.locator(`${card} [data-legend]`)).toHaveCSS('opacity', '1', { timeout: 8_000 });
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
  await expect(page.locator('[data-mission-text]')).toContainText(lastStanzaLine);

  const stop = await docTop(page, '#stott-oss');
  await page.evaluate((y) => window.scrollTo(0, y + 10), stop);
  await page.waitForTimeout(800);
  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false');
  // The two squares stack on the phone, the card under the number, so the section may run a
  // little past one screen here — but not two — and the number, the placeholder wider than
  // the digits, stays inside its frame at this width.
  await expect(page.locator('#stott-oss').getByText(site.support.vipps.value, { exact: true })).toBeVisible();
  const ask = await page.evaluate(() => {
    const section = document.getElementById('stott-oss')!;
    const number = section.querySelector('[data-number]') as HTMLElement;
    const first = section.querySelector('[data-card]')!.getBoundingClientRect();
    const second = section.querySelector('[data-card-square]')!.getBoundingClientRect();
    return { screens: section.getBoundingClientRect().height / window.innerHeight, overflow: number.scrollWidth - number.clientWidth, stacked: second.top >= first.bottom };
  });
  expect(ask.screens, 'støtt oss runs far past the phone screen').toBeLessThanOrEqual(1.4);
  expect(ask.stacked, 'the card square is not under the number').toBe(true);
  expect(ask.overflow, 'the number is wider than its line').toBeLessThanOrEqual(1);
});

/**
 * A phone has no room for a spread, so the book shows one page at a time and the words
 * come out from under it: the book, the band, then the words in their frame, stacked in
 * that order — and the photograph and the member card, which are on the pages, stay out of
 * sight. Without a book the same three things stack the other way round: the photograph,
 * the words, the card. Asserted as geometry rather than as a media query: what matters is
 * what ends up UNDER what, whatever the breakpoint says.
 *
 * The timeline is the one layout on the site that does NOT stack, because sideways is what
 * it already is — so it is checked the other way round: it must still scroll, and it must
 * not take the page with it.
 */
test('phone: the book is one page over the band over the words, the axis stays an axis, and nothing pushes the page sideways', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'stacked layout is the phone layout');
  await pastHero(page);

  const peopleTop = await docTop(page, '#om-oss-teamet');
  await page.evaluate((y) => window.scrollTo(0, y - 40), peopleTop);
  await page.waitForTimeout(1500);
  const section = page.locator('#om-oss-teamet');
  const box = async (sel: string) => (await section.locator(sel).boundingBox())!;
  const under = (a: { y: number; height: number }, b: { y: number }) => b.y >= a.y + a.height - 1;
  const mode = await section.getAttribute('data-book');
  if (mode === 'on') {
    const [book, band, words] = await Promise.all([box('canvas[data-book]'), box('[data-controls]'), box('[data-words]')]);
    expect(book.width, 'the book is not the width of the box').toBeGreaterThan(300);
    expect(under(book, band), 'the band is not under the book').toBe(true);
    expect(under(band, words), 'the words are not under the band').toBe(true);
    // On the pages, so out of sight: clipped to a pixel, which Playwright still calls
    // visible, so the clip is measured.
    const clip = await box('[data-row]');
    expect(Math.max(clip.width, clip.height), 'the member card is not clipped while the book runs').toBeLessThanOrEqual(1);
  } else {
    expect(mode).toBe('off');
    const [words, row] = await Promise.all([box('[data-words]'), box('[data-row]')]);
    expect(under(words, row), 'the member card is not under the words').toBe(true);
    // The member card on a phone is portrait over name, not beside it.
    const [portrait, info] = await Promise.all([box('[data-part="portrait"]'), box('[data-part="info"]')]);
    expect(under(portrait, info), 'the member card did not stack').toBe(true);
    expect(Math.round(info.x), 'the name is not under the portrait').toBe(Math.round(portrait.x));
  }
  // The band fits the screen: the right ring ends inside it, not past the edge.
  const ring = await box(`[data-controls] button[aria-label="${site.people.next}"]`);
  const width = await page.evaluate(() => window.innerWidth);
  expect(ring.x + ring.width, 'the right ring is off the screen').toBeLessThanOrEqual(width);

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
   * And a finger actually moves it. `ScrollTrigger.normalizeScroll` takes over touch for
   * the whole page and, unless told otherwise, swallows a swipe on a nested scroller: the
   * row did not move on any phone from the day the normaliser went in until
   * `allowNestedScroll` (2026-09-12), and nothing above this line could see it — a rail can
   * be wider than the screen and still never scroll. Playwright has no swipe, so the touch
   * is dispatched through CDP, which is what a real finger arrives as.
   */
  const railAt = () => page.evaluate(() => (document.querySelector('#arrangementer [role="region"]') as HTMLElement).scrollLeft);
  const railBox = (await page.locator('#arrangementer [role="region"]').boundingBox())!;
  const before = await railAt();
  const cdp = await page.context().newCDPSession(page);
  const x0 = railBox.x + railBox.width / 2 + 80, y0 = railBox.y + railBox.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
  for (let i = 1; i <= 10; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 - i * 16, y: y0 }] });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(600);
  expect(await railAt(), 'a swipe did not move the row').toBeGreaterThan(before);

  /*
   * Every card stays inside the box on a phone: the row is clipped to the box's edge, and a
   * card that hung out of it would be a card on the page's white with no water under it.
   */
  const inside = await page.evaluate(() => {
    const box = document.querySelector('#arrangementer [data-box]')!.getBoundingClientRect();
    return Array.from(document.querySelectorAll('#arrangementer li article')).every((c) => {
      const r = c.getBoundingClientRect();
      return r.top >= box.top - 1 && r.bottom <= box.bottom + 1;
    });
  });
  expect(inside, 'a card hangs out of the box on a phone').toBe(true);

  // The rail is wider than the screen by design; the PAGE still must not be. A 300px stop
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

/**
 * The trap: hand-pairing `backdrop-filter` with its prefixed form in the source made
 * Lightning CSS emit only the prefixed one, which Blink ignores, and every box was a flat
 * white rectangle that nothing failed on. The source is held to the unprefixed form by
 * `lib/wash.test.ts`; this reads what is actually served and expects both.
 */
test('the served CSS carries both forms of backdrop-filter for the frames', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page.$$eval('link[rel="stylesheet"]', (ls) => ls.map((l) => (l as HTMLLinkElement).href));
  let css = '';
  for (const href of hrefs) css += await (await page.request.get(href)).text();
  expect(css).toMatch(/[^-]backdrop-filter:\s*blur\(12px\)/);
  expect(css).toMatch(/-webkit-backdrop-filter:\s*blur\(12px\)/);
});
