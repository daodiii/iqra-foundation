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

/**
 * The three pins are the page's whole scroll geometry, and nothing below the e2e level
 * can see them: vitest.setup.ts stubs matchMedia to `matches: false`, so no `mm.add`
 * branch ever runs in jsdom. This checks the contract the sections depend on — one
 * spacer each, in document order, laid end to end, and each section really pinned at the
 * top of its own spacer, which is what goes wrong when a trigger's start is measured
 * against a document that has not been pinned yet.
 */
test('desktop: the three pins lie end to end, and each section pins where its spacer sits', async ({ page, isMobile }) => {
  test.skip(isMobile, 'only the hero pins on phones');
  await page.goto('/');
  await expect(page.locator('.pin-spacer')).toHaveCount(3, { timeout: 15_000 });

  const spacers = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('.pin-spacer')).map((sp) => ({
      id: sp.querySelector('section')?.id ?? '(no section)',
      top: sp.offsetTop,
      height: sp.offsetHeight,
    })),
  );
  expect(spacers.map((s) => s.id)).toEqual(['hero', 'visjon', 'misjon']);
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
  for (const name of ['Dialog', 'Brobygging', 'Kunnskap', 'Iqra']) {
    await expect(page.locator('#visjon [data-limb], #visjon [data-root]').filter({ hasText: name })).toHaveCSS('opacity', '1', { timeout: 5_000 });
  }
  expect(await canvasHasInk(page)).toBe(true);
  await expect(page.locator('#site-wordmark')).toHaveAttribute('data-on-dark', 'false');
});

test('desktop: misjon pins, the text arrives and the wordmark turns white', async ({ page, isMobile }) => {
  test.skip(isMobile, 'pinned layout is desktop only');
  await pastHero(page);
  const top = await docTop(page, '#misjon');
  await page.evaluate((y) => window.scrollTo(0, y + window.innerHeight * 0.9), top);
  await page.waitForTimeout(1500);
  const mission = page.locator('[data-mission-text]');
  await expect(mission).toHaveCSS('opacity', '1', { timeout: 5_000 });
  // The hook is what the timeline animates; it is only worth animating if it is the
  // element actually carrying the copy and the call to action.
  await expect(mission).toContainText(site.mission.text);
  await expect(mission.getByRole('link', { name: site.hero.cta })).toHaveAttribute('href', `mailto:${site.contact.email}`);
  await expect(page.locator('#site-wordmark')).toHaveAttribute('data-on-dark', 'true');
  await expect(page.locator('.pin-spacer')).toHaveCount(3); // hero, visjon, misjon
});

test('phone: no pins after the hero; the tree grows by itself and the text arrives', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'stacked layout is the phone layout');
  await pastHero(page);
  await expect(page.locator('.pin-spacer')).toHaveCount(1); // only the hero pins on phones
  const top = await docTop(page, '#visjon');
  await page.evaluate((y) => window.scrollTo(0, y), top);
  for (const name of ['Dialog', 'Brobygging', 'Kunnskap', 'Iqra']) {
    await expect(page.locator('#visjon [data-limb], #visjon [data-root]').filter({ hasText: name })).toHaveCSS('opacity', '1', { timeout: 8_000 });
  }
  const mtop = await docTop(page, '#misjon');
  await page.evaluate((y) => window.scrollTo(0, y), mtop);
  const mission = page.locator('[data-mission-text]');
  await expect(mission).toHaveCSS('opacity', '1', { timeout: 5_000 });
  await expect(mission).toContainText(site.mission.text);
});
