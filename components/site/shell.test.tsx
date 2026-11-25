import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import { Footer } from './Footer';
import { Header } from './Header';

let pathname = '/';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

beforeEach(() => {
  pathname = '/';
  delete document.body.dataset.menuOpen;
  delete document.body.dataset.scrollLocked;
});

describe('the header', () => {
  test('the skip link, the named logo home with both logos, and the client’s menu: six items in the row, Om oss and Aktuelt with their pages under them, Støtt oss the button', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: site.header.skip })).toHaveAttribute('href', '#innhold');
    const home = screen.getByRole('link', { name: site.header.homeLabel });
    const logos = within(home).getAllByRole('presentation');
    expect(logos.map((l) => l.getAttribute('data-logo'))).toEqual(['white', 'navy']);
    const nav = screen.getByRole('navigation', { name: site.header.navLabel });
    const m = klient.menu;
    // The client's message, point 1 (2026-11-18).
    const items = [...nav.querySelector('ul')!.children];
    expect(items.map((li) => li.querySelector('a')!.textContent)).toEqual([m.home, m.about, m.news, m.resources, m.contact, m.support]);
    const under = (label: string) =>
      within(items.find((li) => li.querySelector('a')!.textContent === label)!.querySelector('ul')!)
        .getAllByRole('link')
        .map((l) => [l.textContent, l.getAttribute('href')]);
    expect(under(m.about)).toEqual([[m.aboutFoundation, '/om-oss'], [m.work, '/vart-arbeid'], [m.people, '/menneskene-bak']]);
    expect(under(m.news)).toEqual([[m.newsItems, '/aktuelt/nyheter'], [m.events, '/aktuelt/arrangementer']]);
    expect(nav.querySelectorAll('a[href="/ressurser"] + ul')).toHaveLength(0);
    expect(screen.getByRole('link', { name: m.support })).toHaveAttribute('href', '/stott-oss');
  });

  test('the current page is marked, and only it: on Om oss the item under it, «Om Iqra Foundation», with Om oss marked as the branch', () => {
    pathname = '/om-oss';
    render(<Header />);
    const current = screen.getAllByRole('link', { current: 'page' });
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent(klient.menu.aboutFoundation);
    expect(screen.getByRole('link', { name: klient.menu.about })).toHaveAttribute('data-branch', '');
  });

  test('Aktuelt is the current page on its own address, and a news item marks Nyheter under it', () => {
    pathname = '/aktuelt';
    const { unmount } = render(<Header />);
    expect(screen.getAllByRole('link', { current: 'page' }).map((l) => l.textContent)).toEqual([klient.menu.news]);
    unmount();
    pathname = '/aktuelt/nyheter/en-nyhet';
    render(<Header />);
    expect(screen.getAllByRole('link', { current: 'page' }).map((l) => l.textContent)).toEqual([klient.menu.newsItems]);
    expect(screen.getByRole('link', { name: klient.menu.news })).toHaveAttribute('data-branch', '');
  });

  test('Escape puts away the list under Aktuelt and hands focus back to Aktuelt; leaving the item lets it open again', () => {
    render(<Header />);
    const aktuelt = screen.getByRole('link', { name: klient.menu.news });
    const item = aktuelt.closest('li')!;
    const under = screen.getByRole('link', { name: klient.menu.newsItems });
    under.focus();
    fireEvent.keyDown(under, { key: 'Escape' });
    expect(item).toHaveAttribute('data-shut', '');
    expect(document.activeElement).toBe(aktuelt);
    fireEvent.mouseLeave(item);
    expect(item).not.toHaveAttribute('data-shut');
  });

  test('the drawer: opening marks the body for the navy header and locks scroll; Escape undoes both', () => {
    render(<Header />);
    const button = screen.getByRole('button', { name: site.header.open });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveTextContent(site.header.close);
    expect(document.body.dataset.menuOpen).toBe('');
    expect(document.body.dataset.scrollLocked).toBe('');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(document.body.dataset.menuOpen).toBeUndefined();
    expect(document.body.dataset.scrollLocked).toBeUndefined();
  });
});

describe('the footer', () => {
  test('the reversed logo, every page of the menu once in its reading order, the facts', () => {
    render(<Footer />);
    expect(within(screen.getByRole('link', { name: site.header.homeLabel })).getByRole('presentation')).toHaveAttribute('data-logo', 'navy');
    const nav = screen.getByRole('navigation', { name: site.footer.navLabel });
    expect(within(nav).getAllByRole('link').map((l) => l.textContent)).toEqual(site.links.map((n) => n.label));
    expect(site.links.map((n) => n.href)).toEqual(['/', '/om-oss', '/vart-arbeid', '/menneskene-bak', '/aktuelt', '/aktuelt/nyheter', '/aktuelt/arrangementer', '/ressurser', '/kontakt', '/stott-oss']);
    // The client's contact line (D8): the name with the org.nr, the post box, the number and the e-mail.
    expect(screen.getByText(klient.contact.name)).toBeInTheDocument();
    expect(screen.getByText(`${site.footer.orgnrLabel} ${klient.contact.orgnr}`)).toBeInTheDocument();
    expect(screen.getByText(`${klient.contact.postbox}, ${klient.contact.postcode}`)).toBeInTheDocument();
    expect(screen.getByText(klient.contact.phone).closest('a')).toHaveAttribute('href', 'tel:+4794143585');
    expect(screen.getByText(klient.contact.email).closest('a')).toHaveAttribute('href', `mailto:${klient.contact.email}`);
  });

  test('the four areas’ red thread is gone: the client replaced the four areas', () => {
    const { container } = render(<Footer />);
    expect(container.querySelector('[data-thread]')).toBeNull();
    expect(container.textContent).not.toContain('Samfunnsdeltakelse');
  });

  test('Personvern and Vilkår stand under the facts, in a nav of their own', () => {
    render(<Footer />);
    const legal = screen.getByRole('navigation', { name: site.footer.legalLabel });
    expect(within(legal).getAllByRole('link').map((l) => [l.textContent, l.getAttribute('href')])).toEqual(site.legal.map((l) => [l.label, l.href]));
  });

  test('the credit links to IDweb', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: site.footer.credit.label }).getAttribute('href')).toBe('https://www.idweb.no');
  });
});
