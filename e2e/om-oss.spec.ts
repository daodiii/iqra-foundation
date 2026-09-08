import { expect, test, type Page } from '@playwright/test';
import { site } from '@/content/site.no';

const section = (page: Page) => page.locator('#om-oss');

/**
 * The book is a canvas, so this is the assertion that matters most: whatever the
 * renderer does, the page itself is real text. It is in the DOM in both states — clipped
 * out of sight while the canvas runs, an ordinary article when it does not.
 */
test('the whole book is real text, whatever the canvas does', async ({ page }) => {
  await page.goto('/om-oss');
  const article = section(page).locator('article');
  await expect(article.getByRole('heading', { level: 1 })).toHaveText(site.about.cover.title);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  // Presence, not visibility: while the canvas runs the article is clipped out of sight
  // but stays in the DOM and in the accessibility tree, which is the whole point of it.
  for (const ch of site.about.chapters) {
    await expect(article.getByRole('heading', { level: 2, name: new RegExp(ch.title) })).toHaveCount(1);
    await expect(article).toContainText(ch.lede);
  }
  // The roster, by its own hook: filtering rows on a role matches «Nestleder» for
  // «Leder» too, which passed for the wrong reason until the second row existed.
  const team = site.about.chapters.find((c) => 'team' in c)!.team!;
  const rows = article.locator('[data-team] li');
  await expect(rows).toHaveCount(team.length);
  await expect(rows.first()).toContainText(team[0].role);
  await expect(article.getByRole('link', { name: site.hero.cta }))
    .toHaveAttribute('href', `mailto:${site.contact.email}`);
});

test('the metadata comes from the content file', async ({ page }) => {
  await page.goto('/om-oss');
  await expect(page).toHaveTitle(site.about.meta.title);
  await expect(page.locator('meta[name="description"]'))
    .toHaveAttribute('content', site.about.meta.description);
});

/**
 * With WebGL the section takes over: it pins for the length of the turns and the label
 * beside the book follows the spread. `data-canvas` is the renderer's own report of
 * whether it started, so a shader that failed to compile shows up here rather than as a
 * silently empty screen.
 */
test('desktop: the book takes over, pins, and the chapter label follows the spread', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the pinned book is desktop only');
  await page.goto('/om-oss');
  const hasWebGL = await page.evaluate(() => {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl'));
  });
  test.skip(!hasWebGL, 'this browser has no WebGL, which is the fallback path');

  await expect(section(page)).toHaveAttribute('data-canvas', 'on', { timeout: 15_000 });
  await expect(page.locator('.pin-spacer')).toHaveCount(1);

  // The backing store, not the CSS box: `data-canvas=on` only says the renderer started.
  // A canvas measured while it was still display:none keeps the default 300x150 and
  // draws nothing, which looks identical to a working book from every other assertion.
  const backing = await page.evaluate(() => {
    const c = document.querySelector('#om-oss canvas') as HTMLCanvasElement;
    return { w: c.width, h: c.height };
  });
  expect(backing.w, 'the canvas never got a real backing store').toBeGreaterThan(600);
  expect(backing.h).toBeGreaterThan(300);

  const label = section(page).locator('[data-chapter]');
  await expect(label).toHaveText('Omslag');
  const first = site.about.chapters[0];
  // One turn in, whatever a turn currently costs: the book has four of them spread over
  // its pin, and `chapterAt` rounds, so a quarter of the pin lands exactly on chapter I.
  const pin = await page.evaluate(() => {
    const s = document.getElementById('om-oss')!;
    return s.parentElement!.getBoundingClientRect().height - s.getBoundingClientRect().height;
  });
  await page.evaluate((y) => window.scrollTo(0, y), pin / 4);
  await expect(label).toHaveText(`${first.num} · ${first.title}`, { timeout: 8_000 });

  // Back to the top: the label has to come with us, or it only ever counts upward.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(label).toHaveText('Omslag', { timeout: 8_000 });
});

/**
 * The book is a spread drawn on a 768px page texture, so the type it shows scales with
 * the rendered page: about 10px of body copy on a 768px screen against 19px at 1440.
 * Below the desktop breakpoint the section therefore never starts the renderer and the
 * article underneath is the page. This asserts the whole of that, not just the flag:
 * no canvas, no pin, and the article actually visible rather than clipped out of sight.
 */
/**
 * The breakpoint is a considered number, not an inherited one: at 1024 the book runs and
 * is still harder to read than the article it replaces. Crossing it by dragging a window
 * is also the path that used to break — the media query's cleanup killed the renderer but
 * left `data-canvas="on"`, so the canvas stayed on top of an article still clipped out of
 * sight, and the page went blank rather than falling back.
 */
test('desktop: dragging the window under the breakpoint hands over to the article', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the handover is between two desktop widths');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/om-oss');
  const hasWebGL = await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl')));
  test.skip(!hasWebGL, 'no WebGL here, which is the fallback path either way');
  await expect(section(page)).toHaveAttribute('data-canvas', 'on', { timeout: 15_000 });

  await page.setViewportSize({ width: 1199, height: 900 });
  await expect(section(page)).toHaveAttribute('data-canvas', 'off', { timeout: 8_000 });
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  // Not just the flag: the article has to be laid out and readable, not clipped to 1px
  // behind a canvas nothing is drawing on.
  const article = section(page).locator('article');
  await expect(article.getByRole('heading', { level: 1 })).toBeVisible();
  const box = await article.boundingBox();
  expect(box!.width, 'the article is still clipped').toBeGreaterThan(200);

  // And back, so the handover is not one-way.
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(section(page)).toHaveAttribute('data-canvas', 'on', { timeout: 8_000 });
});

test('phone: no book, and the article is the page', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the article is what a narrow screen gets');
  await page.goto('/om-oss');
  await expect(section(page)).toHaveAttribute('data-canvas', 'off');
  await expect(page.locator('.pin-spacer')).toHaveCount(0);

  const article = section(page).locator('article');
  await expect(article.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(article.getByRole('heading', { level: 2, name: /Historien/ })).toBeVisible();

  // Visible is not the same as legible: the clipped state is a 1px box, and the whole
  // point of this route is that the words are big enough to read.
  const size = await article.locator('p').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size, 'the article is set too small to read').toBeGreaterThanOrEqual(16);
  const box = await article.boundingBox();
  expect(box!.width, 'the article is clipped rather than laid out').toBeGreaterThan(200);
});

test('reduced motion gets the article, not a book it cannot turn', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/om-oss');
  await expect(section(page)).toHaveAttribute('data-canvas', 'off');
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect(section(page).getByRole('heading', { level: 1 })).toBeVisible();
});
