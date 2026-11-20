import { expect, test, type Page } from '@playwright/test';
import { site } from '../content/site.no';
import { klient } from '../content/klient.no';

/**
 * The site's old shell, which the legal pages, the archive and the article keep (the redesigned
 * pages and the front page share the front page's shell, e2e/forside.spec.ts). The shell: the header with the client's menu (M1, 2026-11-18), the drawer on a
 * phone, the skip link, and the footer with the logo, the links and the contact line.
 * Asserted as contracts — the items come from the content file — so a renamed label does
 * not fail here, and a dropped one does.
 */
const m = klient.menu;

/** The six items in the row. */
const ROW = site.nav.map((n) => n.label);
/** Every link in the menu, in reading order: an item, then what stands under it. */
const ALL = site.nav.flatMap((n) => ('children' in n ? [n.label, ...n.children.map((c) => c.label)] : [n.label]));

async function headerLinks(page: Page) {
  return page.getByRole('navigation', { name: site.header.navLabel }).getByRole('link');
}

test('the header carries the logo home and the client’s menu in order', async ({ page }) => {
  await page.goto('/personvern');
  const home = page.getByRole('banner').getByRole('link', { name: site.header.homeLabel });
  await expect(home).toHaveAttribute('href', '/');
  // Two logos are in the link (the reversed one waits for the navy drawer); one is shown, the guide's for the ground.
  const logo = home.locator('img:visible');
  await expect(logo).toHaveCount(1);
  await expect(logo).toHaveAttribute('src', /\/brand\/iqra-logo(-on-[a-z]+)?\.svg/);
  // On a phone the items are behind the button; open it so they are in the accessibility tree.
  const button = page.getByRole('button', { name: site.header.open });
  const phone = await button.isVisible();
  if (phone) await button.click();
  const links = await headerLinks(page);
  if (phone) {
    await expect(links).toHaveText(ALL);
  } else {
    // the row; pointing at Om oss shows its three pages under it
    await expect(links).toHaveText(ROW);
    await links.filter({ hasText: m.about }).first().hover();
    await expect(links).toHaveText([m.home, m.about, m.aboutFoundation, m.work, m.people, m.news, m.resources, m.contact, m.support]);
  }
  await expect(links.last()).toHaveText(m.support); // Støtt oss is the last item and the button
});

test('desktop: every item is on screen at 1440, 1280 and 1024, what stands under Aktuelt too, and one click reaches its page', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the phone has the drawer');
  for (const width of [1440, 1280, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/personvern');
    const links = await headerLinks(page);
    await links.filter({ hasText: m.news }).first().hover();
    const shown = [m.home, m.about, m.news, m.newsItems, m.events, m.resources, m.contact, m.support];
    await expect(links).toHaveText(shown);
    for (let i = 0; i < shown.length; i++) {
      const box = await links.nth(i).boundingBox();
      expect(box, `${shown[i]} at ${width}`).not.toBeNull();
      expect(box!.x + box!.width, `${shown[i]} inside the viewport at ${width}`).toBeLessThanOrEqual(width);
      expect(box!.width, `${shown[i]} has a size at ${width}`).toBeGreaterThan(20);
    }
    // No item behind a menu button: the button is not shown on a desktop.
    await expect(page.getByRole('button', { name: site.header.open })).toBeHidden();
  }
  // One click on a top item: Ressurser.
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/personvern');
  await page.getByRole('navigation', { name: site.header.navLabel }).getByRole('link', { name: m.resources, exact: true }).click();
  await expect(page).toHaveURL(/\/ressurser$/);
  await expect(page.locator('h1')).toBeVisible();
});

test('desktop: Nyheter and Arrangementer stand under Aktuelt, shown when Aktuelt is pointed at or tabbed to, put away by Escape, one click from their page', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the phone has the drawer, where they stand under Aktuelt always');
  await page.goto('/personvern');
  const nav = page.getByRole('navigation', { name: site.header.navLabel });
  const aktuelt = nav.getByRole('link', { name: m.news, exact: true });
  const under = nav.locator('a[href="/aktuelt/nyheter"]');
  await expect(under).toBeHidden();
  await aktuelt.hover();
  await expect(under).toBeVisible();
  const r = (await aktuelt.boundingBox())!;
  const u = (await under.boundingBox())!;
  expect(u.y, 'under Aktuelt').toBeGreaterThanOrEqual(r.y + r.height - 1);
  await page.mouse.move(8, 600);
  await expect(under).toBeHidden();
  // the keyboard: Tab to Aktuelt shows it, the next Tab enters it, Escape puts it away and goes back to Aktuelt
  await aktuelt.focus();
  await expect(under).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(under).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(under).toBeHidden();
  await expect(aktuelt).toBeFocused();
  await page.keyboard.press('Tab');
  await aktuelt.hover();
  await under.click();
  await expect(page).toHaveURL(/\/aktuelt\/nyheter$/);
});

test('the current page is marked, once', async ({ page }) => {
  await page.goto('/kontakt');
  const current = page.getByRole('navigation', { name: site.header.navLabel }).locator('[aria-current="page"]');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveText(m.contact);
});

test('phone: the drawer holds every item, traps focus, closes on Escape and locks the page', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the drawer is the phone layout');
  await page.goto('/personvern');
  const button = page.getByRole('button', { name: site.header.open });
  await expect(button).toBeVisible();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  // The items are not reachable before the drawer opens.
  const links = await headerLinks(page);
  await expect(links.first()).toBeHidden();

  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(links).toHaveCount(ALL.length);
  for (let i = 0; i < ALL.length; i++) await expect(links.nth(i)).toBeVisible();
  // Focus moved into the drawer; the page behind does not scroll.
  await expect(links.first()).toBeFocused();
  await expect(page.locator('body')).toHaveAttribute('data-scroll-locked', '');
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');
  // Tab from the last item wraps to the button; Shift+Tab from the button wraps to the last item.
  await links.last().focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: site.header.close })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(links.last()).toBeFocused();
  // Escape closes and returns focus to the button.
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: site.header.open })).toBeFocused();
  await expect(page.getByRole('button', { name: site.header.open })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('body')).not.toHaveAttribute('data-scroll-locked', '');
  await expect(links.first()).toBeHidden();
  // A chosen item navigates and the drawer is closed on the new page.
  await page.getByRole('button', { name: site.header.open }).click();
  await links.filter({ hasText: m.work }).click();
  await expect(page).toHaveURL(/\/vart-arbeid$/);
  await expect(page.getByRole('button', { name: site.header.open })).toHaveAttribute('aria-expanded', 'false');
});

test('phone: the header and drawer items are targets a thumb can hit', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch targets');
  await page.goto('/personvern');
  const button = page.getByRole('button', { name: site.header.open });
  const b = await button.boundingBox();
  expect(b!.height).toBeGreaterThanOrEqual(44);
  await button.click();
  const links = await headerLinks(page);
  for (let i = 0; i < ALL.length; i++) {
    const box = await links.nth(i).boundingBox();
    expect(box!.height, ALL[i]).toBeGreaterThanOrEqual(44);
  }
});

test('the skip link is the first tab stop and lands on the content', async ({ page }) => {
  await page.goto('/ressurser');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: site.header.skip });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#innhold$/);
  expect(await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)).toMatch(/innhold|BODY|MAIN/);
});

test('the footer carries the logo reversed, every page of the menu and the client’s contact line, and no thread of the four areas', async ({ page }) => {
  await page.goto('/personvern');
  const footer = page.getByRole('contentinfo');
  await expect(footer.locator('img').first()).toHaveAttribute('src', /\/brand\/iqra-logo-(on-navy|on-navy-crimson|on-dark|white)\.svg/);
  await expect(footer.getByRole('navigation', { name: site.footer.navLabel }).getByRole('link')).toHaveText(site.links.map((n) => n.label));
  await expect(footer.locator('[data-thread]')).toHaveCount(0);
  await expect(footer).toContainText(klient.contact.name);
  await expect(footer).toContainText(klient.contact.orgnr);
  await expect(footer).toContainText(`${klient.contact.postbox}, ${klient.contact.postcode}`);
  await expect(footer.locator('a[href="tel:+4794143585"]')).toHaveText(klient.contact.phone);
  await expect(footer.locator(`a[href="mailto:${klient.contact.email}"]`)).toHaveText(klient.contact.email);
});

test('no page logs a console error', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  for (const item of site.links) {
    await page.goto(item.href);
    await page.waitForLoadState('networkidle');
  }
  // The 404 route is not here: its own document request is logged as a failed resource, by design.
  expect(errors).toEqual([]);
});

