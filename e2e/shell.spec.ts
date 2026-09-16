import { expect, test, type Page } from '@playwright/test';
import { brief } from '../content/brief.no';
import { site } from '../content/site.no';

/**
 * The shell on every page: the header with the brief's nine items, the drawer on a phone,
 * the skip link, the footer with the logo, the links, the red thread and the facts.
 * Asserted as contracts — the items come from the content file — so a renamed label does
 * not fail here, and a dropped one does.
 */

const NINE = site.nav.map((n) => n.label);

async function headerLinks(page: Page) {
  return page.getByRole('navigation', { name: site.header.navLabel }).getByRole('link');
}

test('the header carries the logo home and the brief’s nine items in order', async ({ page }) => {
  await page.goto('/om-oss');
  const home = page.getByRole('banner').getByRole('link', { name: site.header.homeLabel });
  await expect(home).toHaveAttribute('href', '/');
  // Two logos are in the link (the reversed one waits for the navy drawer); one is shown, the guide's for the ground.
  const logo = home.locator('img:visible');
  await expect(logo).toHaveCount(1);
  await expect(logo).toHaveAttribute('src', /\/brand\/iqra-logo(-on-[a-z]+)?\.svg/);
  // On a phone the items are behind the button; open it so they are in the accessibility tree.
  const button = page.getByRole('button', { name: site.header.open });
  if (await button.isVisible()) await button.click();
  const links = await headerLinks(page);
  await expect(links).toHaveText(NINE);
  await expect(links.last()).toHaveText(brief.menu[8]); // Støtt oss is the last item and the button
});

test('desktop: every item is on screen at 1440, 1280 and 1024, and one click reaches its page', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the phone has the drawer');
  for (const width of [1440, 1280, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const links = await headerLinks(page);
    for (let i = 0; i < NINE.length; i++) {
      const box = await links.nth(i).boundingBox();
      expect(box, `${NINE[i]} at ${width}`).not.toBeNull();
      expect(box!.x + box!.width, `${NINE[i]} inside the viewport at ${width}`).toBeLessThanOrEqual(width);
      expect(box!.width, `${NINE[i]} has a size at ${width}`).toBeGreaterThan(20);
    }
    // No item behind a menu button: the button is not shown on a desktop.
    await expect(page.getByRole('button', { name: site.header.open })).toBeHidden();
  }
  // One click: Vårt arbeid.
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/');
  await page.getByRole('navigation', { name: site.header.navLabel }).getByRole('link', { name: brief.menu[2], exact: true }).click();
  await expect(page).toHaveURL(/\/vart-arbeid$/);
  await expect(page.locator('h1')).toBeVisible();
});

test('the current page is marked, once', async ({ page }) => {
  await page.goto('/kontakt');
  const current = page.getByRole('navigation', { name: site.header.navLabel }).locator('[aria-current="page"]');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveText(brief.menu[7]);
});

test('phone: the drawer holds the nine items, traps focus, closes on Escape and locks the page', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the drawer is the phone layout');
  await page.goto('/');
  const button = page.getByRole('button', { name: site.header.open });
  await expect(button).toBeVisible();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  // The items are not reachable before the drawer opens.
  const links = await headerLinks(page);
  await expect(links.first()).toBeHidden();

  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(links).toHaveCount(9);
  for (let i = 0; i < 9; i++) await expect(links.nth(i)).toBeVisible();
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
  await links.nth(2).click();
  await expect(page).toHaveURL(/\/vart-arbeid$/);
  await expect(page.getByRole('button', { name: site.header.open })).toHaveAttribute('aria-expanded', 'false');
});

test('phone: the header and drawer items are targets a thumb can hit', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch targets');
  await page.goto('/');
  const button = page.getByRole('button', { name: site.header.open });
  const b = await button.boundingBox();
  expect(b!.height).toBeGreaterThanOrEqual(44);
  await button.click();
  const links = await headerLinks(page);
  for (let i = 0; i < 9; i++) {
    const box = await links.nth(i).boundingBox();
    expect(box!.height, NINE[i]).toBeGreaterThanOrEqual(44);
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

test('the footer carries the logo reversed, the nine links, the red thread and the three facts', async ({ page }) => {
  await page.goto('/styringsdokumenter');
  const footer = page.getByRole('contentinfo');
  await expect(footer.locator('img').first()).toHaveAttribute('src', /\/brand\/iqra-logo-(on-navy|on-dark|white)\.svg/);
  await expect(footer.getByRole('navigation', { name: site.footer.navLabel }).getByRole('link')).toHaveText(NINE);
  await expect(footer.locator('[data-thread]')).toContainText(brief.thread.name);
  await expect(footer.locator('[data-thread]')).toContainText('Kunnskap');
  await expect(footer.locator('[data-thread]')).toContainText('Samfunnsdeltakelse');
  await expect(footer).toContainText(site.contact.orgnr);
  await expect(footer.getByRole('link', { name: site.contact.email })).toHaveAttribute('href', `mailto:${site.contact.email}`);
  await expect(footer).toContainText(site.place);
});

test('no page logs a console error', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  for (const item of site.nav) {
    await page.goto(item.href);
    await page.waitForLoadState('networkidle');
  }
  // The 404 route is not here: its own document request is logged as a failed resource, by design.
  expect(errors).toEqual([]);
});

test('the thread’s four words each carry their area', async ({ page }) => {
  await page.goto('/kontakt');
  const words = page.getByRole('contentinfo').locator('[data-thread] [data-area]');
  await expect(words).toHaveCount(4);
  await expect(words).toHaveText(brief.areas.map((a) => new RegExp(`^${a.name}`)));
});
