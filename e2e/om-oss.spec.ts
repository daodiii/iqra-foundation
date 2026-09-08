import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';
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
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));
  await expect(label).toHaveText(`${first.num} · ${first.title}`, { timeout: 8_000 });

  // Back to the top: the label has to come with us, or it only ever counts upward.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(label).toHaveText('Omslag', { timeout: 8_000 });
});

/**
 * A phone is too narrow for a spread, so the book shows one page and the sheet turns off
 * it. The camera distance is fitted to the viewport rather than picked from the two
 * desktop values, so this checks the page actually fills the frame: a spread's camera on
 * a portrait screen leaves the page a stamp in the middle of a lot of ground.
 */
test('phone: the book runs as a single page and fills the frame', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the single-page book is the phone layout');
  await page.goto('/om-oss');
  const hasWebGL = await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl')));
  test.skip(!hasWebGL, 'no WebGL here, which is the fallback path');

  await expect(section(page)).toHaveAttribute('data-canvas', 'on', { timeout: 15_000 });
  await expect(page.locator('.pin-spacer')).toHaveCount(1);

  const backing = await page.evaluate(() => {
    const c = document.querySelector('#om-oss canvas') as HTMLCanvasElement;
    return c.width;
  });
  expect(backing).toBeGreaterThan(300);

  // Screenshot rather than readPixels: without `preserveDrawingBuffer` the drawing
  // buffer is undefined once the frame has been composited, so reading it back measures
  // a blank buffer and passes or fails for reasons unrelated to the page.
  const png = await section(page).locator('canvas').screenshot();
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const row = Math.round(info.height / 2) * info.width * info.channels;
  const edge = [data[row], data[row + 1], data[row + 2]];
  let wide = 0;
  for (let x = 0; x < info.width; x++) {
    const i = row + x * info.channels;
    const d = Math.abs(data[i] - edge[0]) + Math.abs(data[i + 1] - edge[1]) + Math.abs(data[i + 2] - edge[2]);
    if (d > 10) wide++;
  }
  expect(wide / info.width, 'the page does not fill the width of a phone').toBeGreaterThan(0.5);
});

test('reduced motion gets the article, not a book it cannot turn', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/om-oss');
  await expect(section(page)).toHaveAttribute('data-canvas', 'off');
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect(section(page).getByRole('heading', { level: 1 })).toBeVisible();
});
