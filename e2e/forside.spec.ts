import { expect, test, type Page } from '@playwright/test';
import { klient } from '../content/klient.no';
import { site } from '../content/site.no';
import { getEvents, getNews, splitEvents, todayISO } from '../lib/content';

/**
 * The front page, the owner's redesign (2026-11-18/19): every word the client's, in their order;
 * the hero exactly one screen; the logo docking into the header; the header taking the colour of
 * the ground under it at a constant height; the menu layer; never wider than the screen.
 */
const h = klient.home;

/** To `y`, at once: through the glide when it runs, else the window. */
async function to(page: Page, y: number) {
  await page.evaluate((y) => {
    const l = (window as unknown as { __lenis?: { scrollTo: (y: number, o: object) => void } }).__lenis;
    if (l) l.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  }, Math.round(y));
  await page.waitForTimeout(400);
}

test('the client’s front page in their order, every word theirs', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(site.name);
  const main = page.getByRole('main');
  await expect(main.locator('h1')).toHaveText(h.headline);
  for (const p of h.paragraphs) await expect(main.getByText(p, { exact: true })).toBeAttached();
  await expect(main.getByRole('link', { name: site.cta.about.label })).toHaveAttribute('href', '/om-oss');
  await expect(main.getByRole('link', { name: site.cta.events.label })).toHaveAttribute('href', '/aktuelt/arrangementer');
  await expect(main.getByRole('heading', { level: 2 })).toHaveText([h.why.title, h.create.title, h.action.title, site.pages.news.upcoming, site.pages.news.newsTitle, h.together.title]);
  const text = (await main.textContent()) ?? '';
  for (const s of [
    ...h.why.paragraphs,
    h.create.intro,
    ...h.create.areas.flatMap((a) => [a.title, a.text]),
    ...h.action.items.flatMap((a) => [a.title, a.text]),
    h.together.text,
  ])
    expect(text).toContain(s);
  await expect(main.locator('section#skape svg[data-ikon]')).toHaveCount(3);
  // Aktuelt: the real items, or the site's empty line for each list
  const news = getNews().slice(0, 3);
  const { upcoming } = splitEvents(getEvents(), todayISO());
  const aktuelt = main.locator('section#aktuelt');
  if (news.length) for (const n of news) await expect(aktuelt.getByRole('heading', { name: n.title })).toBeAttached();
  // with none published, the three sample news posts stand in (Forside.tsx shownNews)
  else await expect(aktuelt.locator('[data-sv]').getByText('Eksempel', { exact: true })).toHaveCount(3);
  if (upcoming.length) for (const e of upcoming.slice(0, 3)) await expect(aktuelt.getByRole('heading', { name: e.title })).toBeAttached();
  // with none coming, the three sample posters stand in (Forside.tsx shownEvents)
  else await expect(aktuelt.locator('[data-po]').getByText('Eksempel', { exact: true })).toHaveCount(3);
  await expect(aktuelt.getByRole('link', { name: h.news.all })).toHaveAttribute('href', '/aktuelt/nyheter');
  const sammen = main.locator('section#sammen');
  await expect(sammen.getByRole('link', { name: site.cta.partner.label })).toHaveAttribute('href', site.cta.partner.href);
  await expect(sammen.getByRole('link', { name: site.cta.support.label })).toHaveAttribute('href', '/stott-oss');
  // the new address, and no old one
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'post@iqrasti.no' })).toHaveAttribute('href', 'mailto:post@iqrasti.no');
  expect(await page.content()).not.toContain('gmail');
});

for (const [w, hgt] of [
  [1536, 960],
  [1229, 650],
  [390, 844],
]) {
  test(`at ${w}×${hgt}: the hero is exactly one screen and the page is never wider than the screen`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: hgt });
    await page.goto('/');
    const hero = await page.locator('[data-hero]').boundingBox();
    expect(hero!.height).toBe(hgt);
    for (const y of [0, 3, 6, 10, 14]) {
      await to(page, y * hgt);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(w);
    }
  });
}

test('the logo pours white, then docks into the header’s slot; the header follows the ground at a height that never changes', async ({ page }) => {
  await page.goto('/');
  const bar = page.locator('[data-topp]');
  const height = (await bar.boundingBox())!.height;
  const H = page.viewportSize()!.height;
  await page.waitForTimeout(2200);
  await to(page, H * 0.7);
  const off = () =>
    page.evaluate(() => {
      const mk = document.querySelector('[data-mk]')!.getBoundingClientRect();
      const slot = document.querySelector('[data-dock]')!.getBoundingClientRect();
      return Math.max(Math.abs(mk.left - slot.left), Math.abs(mk.top - slot.top), Math.abs(mk.width - slot.width));
    });
  await expect.poll(off, { timeout: 5000 }).toBeLessThan(1.5);
  await expect(page.locator('[data-forside]')).toHaveAttribute('data-solid', '');
  // Kameleon: white under the header after the pour, crimson on the poster, navy on Trinnene
  const tone = () => page.locator('[data-forside]').getAttribute('data-tone');
  await to(page, 1.3 * H);
  await expect.poll(tone).toBe('light');
  // past the paragraph the dot opens by itself on a clock (Pour.tsx); the poster rests at 1.8 screens in
  const poster = await page.evaluate(() => {
    const sc = document.querySelector('[data-lag="sc"]') as HTMLElement;
    return sc.offsetTop + 0.85 * (sc.offsetHeight - window.innerHeight);
  });
  await to(page, poster);
  await expect.poll(tone).toBe('rod');
  const trinn = await page.evaluate(() => document.querySelector('#handling')!.getBoundingClientRect().top + window.scrollY);
  await to(page, trinn + H * 0.3);
  await expect.poll(tone).toBe('dark');
  expect((await bar.boundingBox())!.height).toBe(height);
  // back at the top the logo comes out again and the header is clear
  await to(page, 0);
  await expect(page.locator('[data-forside]')).not.toHaveAttribute('data-solid');
});

test('«Meny» opens the menu layer: numbered pages, Støtt oss, the contact lines; focus stays in it; Escape closes it; the page holds still meanwhile', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 900 });
  await page.goto('/');
  const button = page.getByRole('button', { name: site.header.open, exact: true });
  await button.click();
  const menu = page.getByRole('dialog', { name: site.header.open });
  await expect(menu).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-scroll-locked', '');
  await expect(menu.getByRole('list').getByRole('link')).toHaveText([/01\s*Hjem/, /02\s*Om oss/, /03\s*Aktuelt/, /04\s*Ressurser/, /05\s*Kontakt/]);
  await expect(menu.getByRole('link', { name: klient.menu.support })).toHaveAttribute('href', '/stott-oss');
  await expect(menu).toContainText(klient.contact.email);
  // tab from the last stop wraps to the first
  const stops = menu.locator('a, button');
  await stops.last().focus();
  await page.keyboard.press('Tab');
  await expect(stops.first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('body')).not.toHaveAttribute('data-scroll-locked', '');
  // a page from the menu
  await button.click();
  await menu.getByRole('link', { name: /Ressurser/ }).click();
  await expect(page).toHaveURL(/\/ressurser$/);
});

test('the front page logs no console error, down to the foot', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  const H = page.viewportSize()!.height;
  for (let y = 0; y < 17; y += 1.5) await to(page, y * H);
  expect(errors).toEqual([]);
});
