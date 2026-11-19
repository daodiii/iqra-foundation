import { expect, test } from '@playwright/test';
import { site } from '../content/site.no';
import { klient } from '../content/klient.no';
import { getEvents, getNews, getResources, splitEvents, todayISO } from '../lib/content';
import { isPlaceholder } from '../lib/placeholder';

/**
 * Every page of the brief's menu exists, has its own title in the one pattern and a
 * description in the brief's words, carries its passage of the brief verbatim, and says
 * honestly when a collection is empty. The 404 is a page in the same system.
 */

const T = (page: string) => `${page} – ${site.name}`;

test('phone: the home page is never wider than the screen', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'a phone only');
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    expect(await page.evaluate(() => Math.max(document.documentElement.scrollWidth, window.innerWidth)), `/ at ${width}`).toBe(width);
  }
});

test('vårt arbeid: the client’s intro and every area of work, each a section reachable by its anchor', async ({ page }) => {
  await page.goto('/vart-arbeid');
  await expect(page).toHaveTitle(T(site.pages.work.title));
  await expect(page.locator('h1')).toHaveText(klient.work.title);
  await expect(page.getByText(klient.work.intro, { exact: true })).toBeVisible();
  await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveText(klient.work.areas.map((a) => a.title));
  for (const a of klient.work.areas) await expect(page.getByText(a.text, { exact: true })).toBeVisible();
  await page.goto('/vart-arbeid#samarbeid-og-partnerskap');
  await expect(page.locator('#samarbeid-og-partnerskap')).toBeInViewport();
});

test('om iqra foundation: the client’s text, section by section', async ({ page }) => {
  const t = klient.about;
  await page.goto('/om-oss');
  await expect(page).toHaveTitle(T(site.pages.about.title));
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', t.intro);
  await expect(page.locator('h1')).toHaveText(t.title);
  await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveText([t.name.title, t.purpose.title, t.values.title, t.audience.title, t.independent.title]);
  for (const p of [t.intro, t.name.text, t.purpose.lead, ...t.purpose.points, t.values.lead, t.values.close, t.audience.text, ...t.independent.paragraphs]) {
    await expect(page.getByText(p, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole('main').locator('[data-area]')).toHaveCount(0);
});

test.describe('the collections are honest while empty', () => {
  test('aktuelt: the client’s intro and the filter Alle · Nyheter · Arrangementer, each its own address, the current one marked', async ({ page }) => {
    const t = site.pages.news;
    for (const [href, label] of [['/aktuelt', 'Alle'], ['/aktuelt/nyheter', 'Nyheter'], ['/aktuelt/arrangementer', 'Arrangementer']] as const) {
      await page.goto(href);
      await expect(page.locator('h1')).toHaveText(klient.news.title);
      await expect(page.getByText(klient.news.intro, { exact: true })).toBeVisible();
      const filter = page.getByRole('navigation', { name: t.filterLabel });
      await expect(filter.getByRole('link')).toHaveText([klient.news.filter.all, klient.news.filter.news, klient.news.filter.events]);
      await expect(filter.locator('[aria-current="page"]')).toHaveText(label);
    }
  });
  test('aktuelt: news under Nyheter with the client’s text, events under Arrangementer with theirs, upcoming and past split by today, each listing what is published or its empty line', async ({ page }) => {
    const t = site.pages.news;
    const news = getNews();
    const { upcoming, past } = splitEvents(getEvents(), todayISO());
    await page.goto('/aktuelt/nyheter');
    await expect(page.getByText(klient.news.newsText, { exact: true })).toBeVisible();
    await expect(page.getByText(klient.news.eventsText, { exact: true })).toHaveCount(0);
    if (news.length) for (const n of news) await expect(page.getByRole('heading', { name: n.title })).toBeVisible();
    else await expect(page.getByText(t.emptyNews, { exact: true })).toBeVisible();
    await page.goto('/aktuelt/arrangementer');
    await expect(page.getByText(klient.news.eventsText, { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: t.upcoming })).toBeVisible();
    await expect(page.getByRole('heading', { name: t.past })).toBeVisible();
    if (upcoming.length) for (const e of upcoming) await expect(page.getByRole('heading', { name: e.title })).toBeVisible();
    else await expect(page.getByText(t.emptyUpcoming, { exact: true })).toBeVisible();
    if (past.length) for (const e of past) await expect(page.getByRole('heading', { name: e.title })).toBeVisible();
    else await expect(page.getByText(t.emptyPast, { exact: true }).first()).toBeVisible();
    await page.getByRole('link', { name: t.archiveLink }).click();
    await expect(page).toHaveURL(/\/aktuelt\/arkiv$/);
    await expect(page.locator('h1')).toHaveText(t.archiveTitle);
    await expect(page.getByText(klient.news.archiveText, { exact: true })).toBeVisible();
  });
  test('the old addresses land on Aktuelt', async ({ page }) => {
    await page.goto('/arrangementer');
    await expect(page).toHaveURL(/\/aktuelt\/arrangementer$/);
    await page.goto('/nyheter');
    await expect(page).toHaveURL(/\/aktuelt\/nyheter$/);
  });
  test('ressurser: the client’s intro, then the four categories in their order, each with its text and what is published in it, or the empty line', async ({ page }) => {
    const r = klient.resources;
    await page.goto('/ressurser');
    await expect(page).toHaveTitle(T(site.pages.resources.title));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', r.intro);
    await expect(page.locator('h1')).toHaveText(r.title);
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 2 })).toHaveText(r.categories.map((c) => c.title));
    await expect(main.getByRole('navigation', { name: site.pages.resources.categoriesLabel }).getByRole('link')).toHaveText(r.categories.map((c) => c.title));
    const items = getResources();
    for (const c of r.categories) {
      const section = main.locator(`section#${c.key}`);
      if (c.text) await expect(section).toContainText(c.text);
      const inIt = items.filter((i) => i.category === c.key);
      if (inIt.length) await expect(section.locator('h3')).toHaveText(inIt.map((i) => i.title));
      else await expect(section.getByText(site.pages.resources.empty, { exact: true })).toBeVisible();
    }
  });
  test('menneskene bak: the client’s text, the five board members by name and role, and how to reach the board', async ({ page }) => {
    const t = klient.people;
    await page.goto('/menneskene-bak');
    await expect(page).toHaveTitle(T(t.title));
    await expect(page.locator('h1')).toHaveText(t.title);
    for (const p of [t.intro, t.board.text]) await expect(page.getByText(p, { exact: true })).toBeVisible();
    await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveText([t.board.title, t.contact.title]);
    expect(await page.getByRole('main').locator('h3').allTextContents()).toEqual(t.members.map((m) => m.name));
    for (const m of t.members) await expect(page.getByRole('main').getByText(m.role, { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('main').locator(`a[href="mailto:${klient.contact.email}"]`)).toHaveCount(1);
    await expect(page.getByRole('main')).toContainText(t.contact.text);
    await expect(page.getByRole('main')).not.toContainText(/\[[^\]]+\]/);
  });
  test('the old Styringsdokumenter address lands on its category in the library', async ({ page }) => {
    await page.goto('/styringsdokumenter');
    await expect(page).toHaveURL(/\/ressurser#styringsdokumenter$/);
    await expect(page.locator('section#styringsdokumenter h2')).toHaveText('Styringsdokumenter');
  });
});

test('phone: no page is wider than the screen at 320, 360 or 390, however long its title', async ({ page, isMobile }) => {
  // 2026-10-09: «Styringsdokumenter» at the display size had nowhere to break; the page went 457 wide on a
  // 390 phone and pushed «Meny» half off the screen («Arrangementer» did the same at 320).
  test.skip(!isMobile, 'a phone only');
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    for (const item of site.links) {
      if (item.href === '/') continue; // the home page has its own walk from the hero to the foot
      await page.goto(item.href);
      const wide = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, window.innerWidth));
      expect(wide, `${item.href} at ${width}`).toBe(width);
    }
  }
});

test('kontakt: five cards in reading order — the map with the address on it, the address, the e-mail, the form under «Kontakt oss», the number — the client’s details, no placeholder, the form drawn, and no pin on a post box', async ({ page }) => {
  await page.goto('/kontakt');
  await expect(page).toHaveTitle(T(site.pages.contact.title));
  const t = site.pages.contact;
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(t.title);
  await expect(main.getByRole('heading', { level: 2 })).toHaveText([t.addressLabel, t.emailLabel, t.form.title, t.phoneLabel]);
  await expect(main.getByRole('heading', { level: 2, name: t.form.title })).toBeVisible();
  expect(await main.locator('[data-card]').evaluateAll((els) => els.map((e) => e.getAttribute('data-card')))).toEqual(['kart', 'adresse', 'epost', 'skjema', 'telefon']);
  // The client's details (D8, 2026-11-18): the e-mail and the number are links.
  await expect(main.locator(`a[href="mailto:${klient.contact.email}"]`)).toHaveCount(1);
  await expect(main.locator('a[href="tel:+4794143585"]')).toHaveCount(1);
  await expect(main).toContainText(klient.contact.postbox);
  await expect(main).toContainText(klient.contact.postcode);
  await expect(main).toContainText(klient.contact.orgnr);
  await expect(main).not.toContainText(/\[[^\]]+\]/);
  // the map at both widths and served, its credit a link to the licence; no pin, since a post box is not a place
  await expect(main.getByRole('img', { name: t.map.alt })).toHaveAttribute('srcset', '/kart-1024.webp 1024w, /kart-1536.webp 1536w');
  for (const file of ['/kart-1024.webp', '/kart-1536.webp']) {
    const res = await page.request.get(file);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/webp');
  }
  await expect(main.getByRole('link', { name: t.map.credit })).toHaveAttribute('href', t.map.creditHref);
  await expect(main.locator('[data-pin]')).toHaveCount(0);
  // where to follow appears only once a handle is real
  for (const l of site.contact.follow) {
    if (isPlaceholder(l.href)) await expect(main.getByText(l.name, { exact: true })).toHaveCount(0);
    else await expect(main.getByRole('link', { name: l.name })).toHaveAttribute('href', l.href);
  }
  // the form is a drawing: its five fields as text, nothing to fill in, hidden from a reader, the honest line under it
  await expect(main.locator('form, input, textarea, button, select')).toHaveCount(0);
  await expect(main.locator('[data-form]')).toHaveAttribute('aria-hidden', 'true');
  for (const word of [t.form.name, t.form.email, t.form.mobile, t.form.orgnr, t.form.message]) await expect(main.locator('[data-form]')).toContainText(word);
  await expect(main.getByText(t.form.notice, { exact: true })).toBeVisible();
});

test('støtt oss: the client’s text in their order, the ways to give under «Gave» — Vipps real, no bracketed account — and one way out to the agreement', async ({ page }) => {
  const t = klient.support;
  await page.goto('/stott-oss');
  await expect(page).toHaveTitle(T(site.pages.support.title));
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(t.title);
  await expect(main.getByRole('heading', { level: 2 })).toHaveText([t.uses.title, t.ways.title]);
  await expect(main.getByRole('heading', { level: 3 })).toHaveText(t.ways.items.map((w) => w.title));
  const text = await main.innerText();
  // the client's sentences, in their order
  const order = [t.intro, t.uses.lead, ...t.uses.points, t.uses.close, ...t.ways.items.map((w) => w.text), t.close].map((s) => text.indexOf(s));
  expect(order.every((i) => i > -1), `missing: ${order.join(',')}`).toBe(true);
  expect([...order].sort((x, y) => x - y)).toEqual(order);
  // Vipps and AvtaleGiro hang between «Gave» and «Samarbeid og partnerskap»
  const vipps = text.indexOf(site.support.vipps.value);
  expect(vipps).toBeGreaterThan(text.indexOf(t.ways.items[0].text));
  expect(vipps).toBeLessThan(text.indexOf(site.support.avtale.button));
  expect(text.indexOf(site.support.avtale.button)).toBeLessThan(text.indexOf(t.ways.items[1].text));
  expect(text).not.toMatch(/\[[^\]]*\]/);
  await expect(main.locator('form, input, button')).toHaveCount(0);
  const avtale = main.getByRole('link', { name: site.support.avtale.button });
  await expect(avtale).toHaveAttribute('href', site.support.avtale.href);
  await expect(main.getByRole('link')).toHaveCount(1);
});

test('støtt oss is exactly as wide as the screen, and so is the page after it once the visitor moves on', async ({ page }) => {
  // 2026-10-09: the banners registered `--edge`, the site's shared edge, as a percentage; the page went
  // twice the screen's width, blank, and its stylesheet stayed in the document for the pages after it.
  const fits = () => page.evaluate(() => document.documentElement.scrollWidth === window.innerWidth);
  await page.goto('/stott-oss');
  expect(await fits()).toBe(true);
  await page.getByRole('contentinfo').getByRole('link', { name: klient.menu.about, exact: true }).click();
  await expect(page).toHaveURL(/\/om-oss$/);
  await expect(page.locator('h1')).toBeVisible();
  expect(await fits()).toBe(true);
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
  // The mark as an SVG for tabs, and the .ico and the apple icon for what does not read an SVG.
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute('href', /icon\.svg/);
  await expect(page.locator('link[rel="icon"][href*="favicon.ico"]')).toHaveCount(1);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', /apple-icon/);
  for (const file of ['/favicon.ico', '/apple-icon.png']) expect((await page.request.get(file)).status()).toBe(200);
});

test('with JavaScript off every page is complete: the text, the menu, the footer', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const item of site.links) {
    await page.goto(item.href);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('contentinfo').getByRole('link', { name: klient.menu.support })).toBeAttached();
  }
  await page.goto('/');
  for (const p of klient.home.paragraphs) await expect(page.getByText(p, { exact: true })).toBeVisible();
  await expect(page.getByText(klient.home.together.text, { exact: true })).toBeVisible();
  await context.close();
});

test('reduced motion: the pages render and nothing is hidden waiting for an animation', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  for (const p of klient.home.paragraphs) await expect(page.getByText(p, { exact: true })).toBeVisible();
  for (const a of klient.home.create.areas) await expect(page.getByText(a.text, { exact: true })).toBeVisible();
  expect(await page.getByText(klient.home.headline, { exact: true }).evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  await page.goto('/vart-arbeid');
  for (const a of klient.work.areas) await expect(page.getByText(a.text, { exact: true })).toBeVisible();
  await context.close();
});

test('Personvern and Vilkår, robots.txt, the sitemap and the security headers', async ({ page }) => {
  for (const item of site.legal) {
    const res = await page.goto(item.href);
    expect(res!.status()).toBe(200);
    await expect(page).toHaveTitle(T(item.label));
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(item.label);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${item.href}$`));
    // from the foot of any page
    await expect(page.getByRole('contentinfo').getByRole('link', { name: item.label })).toHaveAttribute('href', item.href);
  }
  const robots = await (await page.request.get('/robots.txt')).text();
  expect(robots).toMatch(/Allow: \//);
  expect(robots).toMatch(/Disallow: \/keystatic/);
  expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);
  expect(robots).not.toMatch(/Disallow: \/\s*$/m);
  const sitemap = await (await page.request.get('/sitemap.xml')).text();
  for (const item of [...site.links, ...site.legal].filter((i) => !i.href.includes('#'))) expect(sitemap).toContain(item.href === '/' ? '<loc>' : `${item.href}</loc>`);
  expect(sitemap).not.toContain('/styringsdokumenter</loc>');
  const headers = (await page.request.get('/')).headers();
  expect(headers['strict-transport-security']).toMatch(/max-age=\d+/);
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['x-powered-by']).toBeUndefined();
});
