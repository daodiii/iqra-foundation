import { expect, test } from '@playwright/test';
import { brief } from '../content/brief.no';
import { site } from '../content/site.no';

/**
 * Every page of the brief's menu exists, has its own title in the one pattern and a
 * description in the brief's words, carries its passage of the brief verbatim, and says
 * honestly when a collection is empty. The 404 is a page in the same system.
 */

const T = (page: string) => `${page} – ${site.name}`;

test('the home page is the name alone, and carries the brief’s main text, the four areas as one sea, Visjon and Misjon as a seal, and the rest of the site', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(site.name);
  expect(await page.locator('html').getAttribute('lang')).toBe('nb');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', brief.home.paragraph);
  await expect(page.locator('h1')).toHaveText(brief.home.headline);
  await expect(page.getByText(brief.home.paragraph, { exact: true })).toBeVisible();
  const main = page.getByRole('main');
  await expect(main.getByRole('link', { name: site.cta.work.label })).toHaveAttribute('href', site.cta.work.href);
  // Støtt oss is a button twice on the page: under the hero's text and in its own section at the foot.
  await expect(main.getByRole('link', { name: site.cta.support.label }).first()).toHaveAttribute('href', site.cta.support.href);
  await expect(main.getByRole('link', { name: site.cta.support.label })).toHaveCount(2);
  // the four fields on one sea first: one water, four layers of words, the first's on the water at the top
  const sea = main.locator('[data-fields]');
  await expect(sea).toHaveAttribute('data-live', '');
  await expect(sea.locator('[data-material="water"]')).toHaveCount(1);
  const words = sea.locator('[data-word]');
  await expect(words).toHaveCount(4);
  await expect(words.nth(0)).toHaveAttribute('data-tone', 'dark');
  await expect(words.nth(1)).toHaveAttribute('data-tone', 'light');
  await expect(words.nth(0)).toHaveAttribute('data-on', '');
  await expect(words.nth(1)).not.toHaveAttribute('data-on');
  for (const a of brief.areas) {
    await expect(main.getByRole('link', { name: a.name, exact: true }).first()).toHaveAttribute('href', `/vart-arbeid#${a.key}`);
  }
  // Visjon and Misjon as a seal on a flat navy plate: the ring, the four names twice round it, the words verbatim
  await expect(main.getByText(brief.vision.headline, { exact: true })).toBeAttached();
  await expect(main.getByText(brief.vision.paragraph, { exact: true })).toBeAttached();
  await expect(main.getByText(brief.mission.headline, { exact: true })).toBeAttached();
  await expect(main.getByText(brief.mission.paragraph, { exact: true })).toBeAttached();
  const seal = main.locator('section#visjon svg');
  await expect(seal.locator('circle')).toHaveCount(2);
  for (const a of brief.areas) expect(await seal.locator('textPath').textContent()).toContain(a.name);
  await expect(main.locator('[data-material="flat"][data-ground="navy"]')).toHaveCount(3);
  await expect(main.locator('[data-material="ink"]')).toHaveCount(0);
  // then the rest of the site: four sections in order, no links under them, the lists honest while empty
  const ids = await main.locator('section[id]').evaluateAll((els) => els.map((e) => e.id));
  expect(ids.slice(-4)).toEqual(['om-oss', 'arrangementer', 'menneskene-bak', 'stott-oss']);
  expect(ids).not.toContain('ressurser');
  await expect(main.locator('section#om-oss a, section#menneskene-bak a')).toHaveCount(0);
  await expect(main.getByText(site.pages.events.emptyUpcoming, { exact: true })).toBeAttached();
  await expect(main.getByText(site.pages.people.empty, { exact: true })).toBeAttached();
  // nothing of the thread
  await expect(main.locator('canvas[data-thread-canvas]')).toHaveCount(0);
  // the act: a jump 0.4 of a step into the first tide settles forward to the second field —
  // its words up and on the water, the first's gone, the CSS ground wholly the second area's
  const jumpTo = (u: number) => sea.evaluate((el, u) => {
    const r = el.getBoundingClientRect();
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
    const start = window.scrollY + r.top - header;
    const end = window.scrollY + r.bottom - window.innerHeight;
    window.scrollTo(0, start + ((end - start) * u) / 3);
  }, u);
  const onOf = (k: number) => words.nth(k).evaluate((el) => (el as HTMLElement).style.getPropertyValue('--on'));
  await jumpTo(0.4);
  await expect.poll(() => onOf(1), { timeout: 3000 }).toBe('1.000');
  await expect(words.nth(1)).toHaveAttribute('data-on', '');
  await expect(words.nth(0)).not.toHaveAttribute('data-on');
  expect(await onOf(0)).toBe('0.000');
  // once the settle has finished, the CSS ground is wholly the second area's — as the end of
  // the first tide (dialog at ~100% over kunnskap) or the start of the second (moteplasser at
  // ~0% over dialog): the browser rounds the settled scroll to a pixel, so u lands a hair
  // either side of 1. The words are up a fifth of a step before that, so this is polled.
  const groundIs = (area: string) => async () => {
    const ground = await sea.locator('[data-sea]').evaluate((el) => (el as HTMLElement).style.getPropertyValue('--ground'));
    const m = ground.match(/^color-mix\(in srgb, var\((--color-area-\w+)\) ([\d.]+)%, var\((--color-area-\w+)\)\)$/);
    if (!m) return `unparsed: ${ground}`;
    const [, to, pct, from] = m;
    return (to === area && Number(pct) >= 99.5) || (from === area && Number(pct) <= 0.5) ? area : ground;
  };
  await expect.poll(groundIs('--color-area-dialog'), { timeout: 3000 }).toBe('--color-area-dialog');
  // and back: a jump to 0.9 of the way back to the first field returns to it
  await jumpTo(0.1);
  await expect.poll(() => onOf(0), { timeout: 3000 }).toBe('1.000');
  await expect(words.nth(0)).toHaveAttribute('data-on', '');
  // the seal's plate opens as it passes the middle of the screen, and Om oss arrives as the tip line reaches it
  const plate = main.locator('section#visjon').locator('xpath=ancestor::*[@data-material][1]');
  await plate.evaluate((el) => {
    const r = el.getBoundingClientRect();
    window.scrollTo(0, window.scrollY + r.top + r.height / 2 - window.innerHeight / 2);
  });
  await expect.poll(async () => Number(await plate.evaluate((el) => (el.parentElement as HTMLElement).style.getPropertyValue('--open')))).toBeGreaterThan(0.97);
  expect(await plate.evaluate((el) => getComputedStyle(el).clipPath)).toMatch(/inset\(0(px)? 0px round 0px\)|inset\(0px\)|none/);
  await main.locator('section#om-oss').evaluate((el) => window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - window.innerHeight * 0.5));
  await expect(main.locator('section#om-oss')).toHaveAttribute('data-arrived', '');
  // a field's link lands on its band: the second field's, with its words on the water
  await jumpTo(1);
  await expect.poll(() => onOf(1), { timeout: 3000 }).toBe('1.000');
  await main.getByRole('link', { name: brief.areas[1].name, exact: true }).click();
  await expect(page).toHaveURL(/\/vart-arbeid#dialog$/);
  await expect(page.locator('#dialog')).toBeInViewport();
});

test('vårt arbeid: the four areas, each its own section of water, each reachable by its anchor', async ({ page }) => {
  await page.goto('/vart-arbeid');
  await expect(page).toHaveTitle(T(site.pages.work.title));
  await expect(page.locator('h1')).toHaveText(site.pages.work.title);
  for (const a of brief.areas) {
    const section = page.locator(`#${a.key}`);
    await expect(section).toContainText(a.name);
    await expect(section).toContainText(a.text);
    await expect(section.locator('[data-material="water"]')).toHaveCount(1);
  }
  await page.goto('/vart-arbeid#samfunnsdeltakelse');
  await expect(page.locator('#samfunnsdeltakelse')).toBeInViewport();
});

test('om oss: the brief’s text and the story of the name', async ({ page }) => {
  await page.goto('/om-oss');
  await expect(page).toHaveTitle(T(site.pages.about.title));
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', site.pages.about.description);
  await expect(page.locator('h1')).toHaveText(brief.about.title);
  for (const p of brief.about.paragraphs) await expect(page.getByText(p, { exact: true })).toBeVisible();
  await expect(page.getByText(site.pages.about.story.text, { exact: true })).toBeVisible();
  // the four names in the «skjæringspunktet» line each carry their area's mark (the footer's thread has its own four)
  await expect(page.getByRole('main').locator('[data-area]')).toHaveCount(4);
});

test.describe('the collections are honest while empty', () => {
  test('arrangementer: kommende and tidligere, each with its own line', async ({ page }) => {
    await page.goto('/arrangementer');
    await expect(page).toHaveTitle(T(site.pages.events.title));
    await expect(page.getByRole('heading', { name: site.pages.events.upcoming })).toBeVisible();
    await expect(page.getByRole('heading', { name: site.pages.events.past })).toBeVisible();
    await expect(page.getByText(site.pages.events.emptyUpcoming, { exact: true })).toBeVisible();
    await expect(page.getByText(site.pages.events.emptyPast, { exact: true })).toBeVisible();
  });
  test('ressurser', async ({ page }) => {
    await page.goto('/ressurser');
    await expect(page).toHaveTitle(T(site.pages.resources.title));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', brief.resources);
    await expect(page.getByText(site.pages.resources.empty, { exact: true })).toBeVisible();
  });
  test('menneskene bak: the board paragraph now, the empty line under it', async ({ page }) => {
    await page.goto('/menneskene-bak');
    await expect(page).toHaveTitle(T(brief.people.title));
    await expect(page.locator('h1')).toHaveText(brief.people.title);
    await expect(page.getByText(brief.people.paragraph, { exact: true })).toBeVisible();
    await expect(page.getByText(site.pages.people.empty, { exact: true })).toBeVisible();
  });
  test('styringsdokumenter', async ({ page }) => {
    await page.goto('/styringsdokumenter');
    await expect(page).toHaveTitle(T(site.pages.documents.title));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', brief.documents);
    await expect(page.getByText(site.pages.documents.empty, { exact: true })).toBeVisible();
  });
});

test('kontakt: the address and the number, bracketed, and no form', async ({ page }) => {
  await page.goto('/kontakt');
  await expect(page).toHaveTitle(T(site.pages.contact.title));
  const main = page.getByRole('main');
  await expect(main.getByRole('link', { name: site.contact.email })).toHaveAttribute('href', `mailto:${site.contact.email}`);
  await expect(main).toContainText(site.contact.orgnr);
  await expect(main).toContainText(site.place);
  await expect(main.locator('form, input, textarea')).toHaveCount(0);
});

test('støtt oss: Vipps first, then the account, both bracketed, nothing that pretends to pay', async ({ page }) => {
  await page.goto('/stott-oss');
  await expect(page).toHaveTitle(T(site.pages.support.title));
  const main = page.getByRole('main');
  const text = await main.innerText();
  expect(text.indexOf(site.support.vipps.value)).toBeGreaterThan(-1);
  expect(text.indexOf(site.support.vipps.value)).toBeLessThan(text.indexOf(site.support.account.value));
  await expect(main.locator('form, input, button')).toHaveCount(0);
});

test('a page that does not exist is a page in the same system', async ({ page }) => {
  const res = await page.goto('/denne-siden-finnes-ikke');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText(site.pages.notFound.line);
  await expect(page.getByRole('navigation', { name: site.header.navLabel })).toBeAttached();
  await expect(page.getByRole('main').getByRole('link', { name: site.pages.notFound.home })).toHaveAttribute('href', '/');
});

test('the share card is the logo, on every route', async ({ page }) => {
  for (const path of ['/', '/kontakt']) {
    await page.goto(path);
    const og = page.locator('meta[property="og:image"]');
    await expect(og).toHaveAttribute('content', /\/opengraph-image/);
    const res = await page.request.get((await og.getAttribute('content'))!);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');
  }
  const icon = page.locator('link[rel="icon"]');
  await expect(icon).toHaveAttribute('href', /icon\.svg/);
});

test('with JavaScript off every page is complete: the text, the menu, the footer', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const item of site.nav) {
    await page.goto(item.href);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('contentinfo').getByRole('link', { name: brief.menu[8] })).toBeAttached();
  }
  await page.goto('/');
  await expect(page.getByText(brief.home.paragraph, { exact: true })).toBeVisible();
  // the sea is a column without script: nothing live, all four fields' words visible
  await expect(page.locator('[data-fields]')).not.toHaveAttribute('data-live');
  for (const a of brief.areas) await expect(page.getByText(a.text, { exact: true })).toBeVisible();
  await context.close();
});

test('reduced motion: the pages render and nothing is hidden waiting for an animation', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByText(brief.mission.paragraph, { exact: true })).toBeVisible();
  // the sea under reduced motion: no act, the four fields one under the other, all visible
  const sea = page.locator('[data-fields]');
  await expect(sea).not.toHaveAttribute('data-live');
  for (const a of brief.areas) await expect(page.getByText(a.text, { exact: true })).toBeVisible();
  const tops = await sea.locator('[data-word]').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top));
  for (let i = 1; i < tops.length; i++) expect(tops[i]).toBeGreaterThan(tops[i - 1]);
  await page.goto('/vart-arbeid');
  for (const a of brief.areas) await expect(page.locator(`#${a.key}`)).toContainText(a.text);
  await context.close();
});
