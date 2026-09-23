import { expect, test, type Page } from '@playwright/test';
import { brief } from '../content/brief.no';
import { site } from '../content/site.no';
import { getEvents, getPeople, splitEvents, todayISO } from '../lib/content';
import { isPlaceholder } from '../lib/placeholder';
import { sentences } from '../lib/text';
import { groundAt, seaAreas } from '../components/home/tide';

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
  // The lockup is the heading: the one h1 holds the art, named for the logo; the brief's headline is not on the page.
  await expect(page.locator('h1')).toHaveAccessibleName(site.logoAlt);
  await expect(page.locator('h1').getByRole('img', { name: site.logoAlt })).toBeVisible();
  await expect(page.getByText(brief.home.headline)).toHaveCount(0);
  await expect(page.getByText(brief.home.paragraph, { exact: true })).toBeVisible();
  const main = page.getByRole('main');
  await expect(main.getByRole('link', { name: site.cta.work.label })).toHaveAttribute('href', site.cta.work.href);
  // Støtt oss is a button once in the page's main: under the hero's text (the header has its own). The foot is Kontakt.
  await expect(main.getByRole('link', { name: site.cta.support.label })).toHaveAttribute('href', site.cta.support.href);
  await expect(main.getByRole('link', { name: site.cta.support.label })).toHaveCount(1);
  await expect(main.locator('section#kontakt').getByRole('link', { name: site.cta.contact.label })).toHaveAttribute('href', site.cta.contact.href);
  // the four fields on one sea first, in the sea's order (navy · burgundy · turquoise · white): one water, one list of the four names, four pages of text over it, the first lit
  const sea = main.locator('[data-fields]');
  await expect(sea).toHaveAttribute('data-live', '');
  await expect(sea.locator('[data-material="water"]')).toHaveCount(1);
  await expect(sea.locator('[data-index] button')).toHaveText(seaAreas.map((a) => a.name));
  const pages = sea.locator('[data-page]');
  await expect(pages).toHaveCount(4);
  await expect(pages.nth(0)).toHaveAttribute('data-here', '');
  await expect(pages.nth(1)).not.toHaveAttribute('data-here');
  for (const a of brief.areas) {
    await expect(main.getByRole('link', { name: a.name, exact: true })).toHaveAttribute('href', `/vart-arbeid#${a.key}`);
  }
  // Visjon and Misjon as a seal on a flat navy plate: the ring, the four names twice round it, the words verbatim
  await expect(main.getByText(brief.vision.headline, { exact: true })).toBeAttached();
  await expect(main.getByText(brief.vision.paragraph, { exact: true })).toBeAttached();
  await expect(main.getByText(brief.mission.headline, { exact: true })).toBeAttached();
  await expect(main.getByText(brief.mission.paragraph, { exact: true })).toBeAttached();
  const seal = main.locator('section#visjon svg');
  await expect(seal.locator('circle')).toHaveCount(2);
  for (const a of brief.areas) expect(await seal.locator('textPath').textContent()).toContain(a.name);
  // four flat navy plates: the seal, Neste, the two sides of Kontakt's table
  await expect(main.locator('[data-material="flat"][data-ground="navy"]')).toHaveCount(4);
  await expect(main.locator('[data-material="ink"]')).toHaveCount(0);
  // then the rest of the site: four sections in order, no links under them, the lists honest while empty
  const ids = await main.locator('section[id]').evaluateAll((els) => els.map((e) => e.id));
  expect(ids.slice(-4)).toEqual(['om-oss', 'arrangementer', 'menneskene-bak', 'kontakt']);
  expect(ids).not.toContain('ressurser');
  await expect(main.locator('section#om-oss a, section#menneskene-bak a')).toHaveCount(0);
  // the next event as Neste's statement while one is coming, the honest line while not (the build reads the same collection)
  const { upcoming } = splitEvents(getEvents(), todayISO());
  if (upcoming.length) await expect(main.locator('section#arrangementer h3').first()).toHaveText(upcoming[0].title);
  else await expect(main.getByText(site.pages.events.emptyUpcoming, { exact: true })).toBeAttached();
  // the people as prints on the table while the collection has any (the first three, People.tsx's SEATS), the honest line while not
  const seated = getPeople().slice(0, 3);
  expect(await main.locator('section#menneskene-bak article h3').allTextContents()).toEqual(seated.map((p) => p.name));
  if (!seated.length) await expect(main.getByText(site.pages.people.empty, { exact: true })).toBeAttached();
  // nothing of the thread
  await expect(main.locator('canvas[data-thread-canvas]')).toHaveCount(0);
  // the act: the scroll is the browser's and the tide is ours. Put the second page on the middle of
  // the screen and its name lights at once; its tide lands on its own clock, whole, and the box's own
  // CSS ground is wholly the second area's (Samfunnsdeltakelse)
  const toPage = (k: number) =>
    sea.evaluate((el, k) => {
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
      const line = header + (window.innerHeight - header) / 2;
      const p = el.querySelectorAll('[data-page]')[k].getBoundingClientRect();
      window.scrollTo(0, window.scrollY + p.top + p.height / 2 - line);
    }, k);
  const playhead = () => sea.evaluate((el) => (el as HTMLElement).dataset.u);
  const ground = () => sea.locator('[data-material="water"]').evaluate((el) => (el as HTMLElement).style.getPropertyValue('--ground'));
  await toPage(1);
  await expect(pages.nth(1)).toHaveAttribute('data-here', '');
  await expect(pages.nth(0)).not.toHaveAttribute('data-here');
  // a software-renderer frame can starve headless Chromium, the same as sea.spec.ts's polls
  await expect.poll(playhead, { timeout: 10_000 }).toBe('1.000');
  // polled, not read once: a single read can race the exact landing right after the playhead poll
  await expect.poll(ground, { timeout: 10_000 }).toBe(groundAt(1));
  // and back on the first field as the page returns to it
  await toPage(0);
  await expect(pages.nth(0)).toHaveAttribute('data-here', '');
  await expect.poll(playhead, { timeout: 10_000 }).toBe('0.000');
  // the seal's plate opens as it passes the middle of the screen, and Om oss arrives as the tip line reaches it
  const plate = main.locator('section#visjon').locator('xpath=ancestor::*[@data-material][1]');
  await plate.evaluate((el) => {
    const r = el.getBoundingClientRect();
    window.scrollTo(0, window.scrollY + r.top + r.height / 2 - window.innerHeight / 2);
  });
  await expect.poll(async () => Number(await plate.evaluate((el) => (el.parentElement as HTMLElement).style.getPropertyValue('--open')))).toBeGreaterThan(0.97);
  // polled: since the flow went on one clock (glide.ts) the clip trails `--open` by a frame or two, and read the same instant it is still a hundredth of a pixel in
  await expect.poll(() => plate.evaluate((el) => getComputedStyle(el).clipPath)).toMatch(/inset\(0(px)? 0px round 0px\)|inset\(0px\)|none/);
  await main.locator('section#om-oss').evaluate((el) => window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - window.innerHeight * 0.5));
  await expect(main.locator('section#om-oss')).toHaveAttribute('data-arrived', '');
  // a field's page is the link to its band: the second field's (Samfunnsdeltakelse), lit on the middle of the screen
  await toPage(1);
  await expect(pages.nth(1)).toHaveAttribute('data-here', '');
  await main.getByRole('link', { name: brief.areas[3].name, exact: true }).click();
  await expect(page).toHaveURL(/\/vart-arbeid#samfunnsdeltakelse$/);
  await expect(page.locator('#samfunnsdeltakelse')).toBeInViewport();
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
  test('arrangementer: kommende and tidligere, each with its own line while empty, each listing what is published', async ({ page }) => {
    await page.goto('/arrangementer');
    await expect(page).toHaveTitle(T(site.pages.events.title));
    await expect(page.getByRole('heading', { name: site.pages.events.upcoming })).toBeVisible();
    await expect(page.getByRole('heading', { name: site.pages.events.past })).toBeVisible();
    const { upcoming, past } = splitEvents(getEvents(), todayISO());
    if (upcoming.length) for (const e of upcoming) await expect(page.getByRole('heading', { name: e.title })).toBeVisible();
    else await expect(page.getByText(site.pages.events.emptyUpcoming, { exact: true })).toBeVisible();
    if (past.length) for (const e of past) await expect(page.getByRole('heading', { name: e.title })).toBeVisible();
    else await expect(page.getByText(site.pages.events.emptyPast, { exact: true })).toBeVisible();
  });
  test('ressurser', async ({ page }) => {
    await page.goto('/ressurser');
    await expect(page).toHaveTitle(T(site.pages.resources.title));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', brief.resources);
    await expect(page.getByText(site.pages.resources.empty, { exact: true })).toBeVisible();
  });
  test('menneskene bak: the board paragraph, then everyone in the collection, or the empty line', async ({ page }) => {
    await page.goto('/menneskene-bak');
    await expect(page).toHaveTitle(T(brief.people.title));
    await expect(page.locator('h1')).toHaveText(brief.people.title);
    await expect(page.getByText(brief.people.paragraph, { exact: true })).toBeVisible();
    const people = getPeople();
    expect(await page.getByRole('main').locator('h3').allTextContents()).toEqual(people.map((p) => p.name));
    if (!people.length) await expect(page.getByText(site.pages.people.empty, { exact: true })).toBeVisible();
  });
  test('styringsdokumenter', async ({ page }) => {
    await page.goto('/styringsdokumenter');
    await expect(page).toHaveTitle(T(site.pages.documents.title));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', brief.documents);
    await expect(page.getByText(site.pages.documents.empty, { exact: true })).toBeVisible();
  });
});

test('kontakt: seven cards in reading order — the map with the address on it, the address, the e-mail, the form under «Kontakt oss», the number, the hours, the way there — every value bracketed but the place, the form drawn, and no pin on a stand-in street', async ({ page }) => {
  await page.goto('/kontakt');
  await expect(page).toHaveTitle(T(site.pages.contact.title));
  const t = site.pages.contact;
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(t.title);
  await expect(main.getByRole('heading', { level: 2 })).toHaveText([t.addressLabel, t.emailLabel, t.form.title, t.phoneLabel, t.hoursLabel, t.transitLabel]);
  await expect(main.getByRole('heading', { level: 2, name: t.form.title })).toBeVisible();
  expect(await main.locator('[data-card]').evaluateAll((els) => els.map((e) => e.getAttribute('data-card')))).toEqual(['kart', 'adresse', 'epost', 'skjema', 'telefon', 'tider', 'vei']);
  await expect(main.getByRole('link', { name: site.contact.email })).toHaveAttribute('href', `mailto:${site.contact.email}`);
  await expect(main.getByRole('link', { name: site.contact.phone })).toHaveAttribute('href', `tel:${site.contact.phone.replace(/\s/g, '')}`);
  await expect(main).toContainText(site.contact.address.street);
  await expect(main).toContainText(`${site.contact.address.postcode} ${site.place}`);
  await expect(main).toContainText(site.contact.orgnr);
  // the map at both widths and served, its credit a link to the licence; the dot only once the street is real
  await expect(main.getByRole('img', { name: t.map.alt })).toHaveAttribute('srcset', '/kart-1024.webp 1024w, /kart-1536.webp 1536w');
  for (const file of ['/kart-1024.webp', '/kart-1536.webp']) {
    const res = await page.request.get(file);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/webp');
  }
  await expect(main.getByRole('link', { name: t.map.credit })).toHaveAttribute('href', t.map.creditHref);
  await expect(main.locator('[data-pin]')).toHaveCount(isPlaceholder(site.contact.address.street) ? 0 : 1);
  // where to follow is named, and links nowhere while bracketed
  for (const l of site.contact.follow) {
    await expect(main.getByText(l.name, { exact: true })).toBeVisible();
    if (isPlaceholder(l.href)) await expect(main.getByRole('link', { name: l.name })).toHaveCount(0);
  }
  // the form is a drawing: its five fields as text, nothing to fill in, hidden from a reader, the honest line under it
  await expect(main.locator('form, input, textarea, button, select')).toHaveCount(0);
  await expect(main.locator('[data-form]')).toHaveAttribute('aria-hidden', 'true');
  for (const word of [t.form.name, t.form.email, t.form.mobile, t.form.orgnr, t.form.message]) await expect(main.locator('[data-form]')).toContainText(word);
  await expect(main.getByText(t.form.notice, { exact: true })).toBeVisible();
});

test('støtt oss: the question, then the three ways in the owner’s order — the account, Vipps, AvtaleGiro — the Vipps number real, the account bracketed, and one way out to the agreement', async ({ page }) => {
  await page.goto('/stott-oss');
  await expect(page).toHaveTitle(T(site.pages.support.title));
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(site.pages.support.question);
  await expect(main.getByRole('heading', { level: 2 })).toHaveText([site.support.ways.account, site.support.ways.vipps, site.support.ways.avtale]);
  const text = await main.innerText();
  expect(text.indexOf(site.support.account.value)).toBeGreaterThan(-1);
  expect(text.indexOf(site.support.account.value)).toBeLessThan(text.indexOf(site.support.vipps.value));
  expect(text.indexOf(site.support.vipps.value)).toBeLessThan(text.indexOf(site.support.avtale.button));
  await expect(main.locator('form, input, button')).toHaveCount(0);
  // AvtaleGiro's one way out: the foundation's own agreement, at its provider
  const avtale = main.getByRole('link', { name: site.support.avtale.button });
  await expect(avtale).toHaveAttribute('href', site.support.avtale.href);
  await expect(main.getByRole('link')).toHaveCount(1);
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

/**
 * What the home page hides until its arrival, read by computed style: Playwright's
 * `toBeVisible` counts an element at opacity 0 as visible, so a hidden state has to be
 * asserted by value. The statement's first word, Om oss's title, the foot's question.
 */
async function nothingHidden(page: Page) {
  const computed = (selector: string, property: string) =>
    page.locator(selector).first().evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), property);
  expect(await computed('section#visjon [data-word]', 'opacity')).toBe('1');
  expect(await computed('#om-oss [data-title]', 'clip-path')).toBe('none');
  expect(await computed('section#kontakt h2', 'opacity')).toBe('1');
  // the sheet lies on its plate, not pushed beyond its edge
  expect(await page.locator('section#kontakt [data-sheet]').evaluate((el) => {
    const r = el.getBoundingClientRect();
    const p = (el.closest('[data-material]') as HTMLElement).getBoundingClientRect();
    return r.left >= p.left - 1 && r.right <= p.right + 1;
  })).toBe(true);
}

/** The seal's scene — the element `Scene` sets `--open` on, the plate's parent — and what it reads there. */
const sealOpen = (page: Page) =>
  page.locator('section#visjon').evaluate((el) => ((el.closest('[data-material]') as HTMLElement).parentElement as HTMLElement).style.getPropertyValue('--open'));

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
  // without script the pages still go by over the sticky screen (CSS alone): nothing live, nothing dimmed, every text its two sentences, the statement and the reading
  await expect(page.locator('[data-fields]')).not.toHaveAttribute('data-live');
  for (const a of brief.areas) for (const part of sentences(a.text)) await expect(page.getByText(part, { exact: true })).toBeVisible();
  await nothingHidden(page);
  expect(['', '0']).toContain(await sealOpen(page));
  await context.close();
});

test('reduced motion: the pages render and nothing is hidden waiting for an animation', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByText(brief.mission.paragraph, { exact: true })).toBeVisible();
  // the sea under reduced motion: the four pages one under the other, every text there; a page put on
  // the middle of the screen takes the sea at once, its name lit and the playhead on its field with no tide between
  const sea = page.locator('[data-fields]');
  for (const a of brief.areas) for (const part of sentences(a.text)) await expect(page.getByText(part, { exact: true })).toBeVisible();
  const tops = await sea.locator('[data-page]').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top));
  for (let i = 1; i < tops.length; i++) expect(tops[i]).toBeGreaterThan(tops[i - 1]);
  await expect(sea).toHaveAttribute('data-live', '');
  await sea.evaluate((el) => {
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
    const p = el.querySelectorAll('[data-page]')[3].getBoundingClientRect();
    window.scrollTo(0, window.scrollY + p.top + p.height / 2 - (header + (window.innerHeight - header) / 2));
  });
  await expect(sea.locator('[data-page]').nth(3)).toHaveAttribute('data-here', '');
  expect(await sea.evaluate((el) => (el as HTMLElement).dataset.u)).toBe('3.000');
  // once the script has run (the sections are live), everything stands: nothing hidden, the ring drawn, no listener on the scene
  await expect(page.locator('section#om-oss')).toHaveAttribute('data-live', '');
  await nothingHidden(page);
  expect(['0', '0px']).toContain(await page.locator('section#visjon circle').first().evaluate((el) => getComputedStyle(el).getPropertyValue('stroke-dashoffset')));
  expect(await sealOpen(page)).toBe('');
  await page.goto('/vart-arbeid');
  for (const a of brief.areas) await expect(page.locator(`#${a.key}`)).toContainText(a.text);
  await context.close();
});
