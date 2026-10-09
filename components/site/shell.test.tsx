import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { areas } from '@/components/home/areas';
import { brief } from '@/content/brief.no';
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
  test('the skip link, the named logo home with both logos, the brief’s nine items: eight in the row, Styringsdokumenter under Ressurser', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: site.header.skip })).toHaveAttribute('href', '#innhold');
    const home = screen.getByRole('link', { name: site.header.homeLabel });
    const logos = within(home).getAllByRole('presentation');
    expect(logos.map((l) => l.getAttribute('data-logo'))).toEqual(['white', 'navy']);
    const nav = screen.getByRole('navigation', { name: site.header.navLabel });
    // the owner, 2026-10-09: «ressurser on top and have styringsdokumenter under it»
    const row = [...nav.querySelector('ul')!.children].map((li) => li.querySelector('a')!.textContent);
    expect(row).toEqual([brief.menu[0], brief.menu[1], brief.menu[2], brief.menu[3], brief.menu[4], brief.menu[5], brief.menu[7], brief.menu[8]]);
    const ressurser = [...nav.querySelector('ul')!.children].find((li) => li.querySelector('a')!.textContent === brief.menu[4])!;
    const under = within(ressurser.querySelector('ul')!).getAllByRole('link');
    expect(under.map((l) => [l.textContent, l.getAttribute('href')])).toEqual([[brief.menu[6], '/styringsdokumenter']]);
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual(site.links.map((n) => n.href));
  });

  test('the current page is marked, and only it', () => {
    pathname = '/om-oss';
    render(<Header />);
    const current = screen.getAllByRole('link', { current: 'page' });
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('Om oss');
  });

  test('on Styringsdokumenter its own link is the current page, and Ressurser above it is marked as the branch', () => {
    pathname = '/styringsdokumenter';
    render(<Header />);
    const current = screen.getAllByRole('link', { current: 'page' });
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent(brief.menu[6]);
    expect(screen.getByRole('link', { name: brief.menu[4] })).toHaveAttribute('data-branch', '');
  });

  test('Escape puts away the list under Ressurser and hands focus back to Ressurser; leaving the item lets it open again', () => {
    render(<Header />);
    const ressurser = screen.getByRole('link', { name: brief.menu[4] });
    const item = ressurser.closest('li')!;
    const under = screen.getByRole('link', { name: brief.menu[6] });
    under.focus();
    fireEvent.keyDown(under, { key: 'Escape' });
    expect(item).toHaveAttribute('data-shut', '');
    expect(document.activeElement).toBe(ressurser);
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
  test('the reversed logo, the nine links in the menu’s reading order, the facts', () => {
    render(<Footer />);
    expect(within(screen.getByRole('link', { name: site.header.homeLabel })).getByRole('presentation')).toHaveAttribute('data-logo', 'navy');
    const nav = screen.getByRole('navigation', { name: site.footer.navLabel });
    expect(within(nav).getAllByRole('link').map((l) => l.textContent)).toEqual(site.links.map((n) => n.label));
    expect(site.links.map((n) => n.label).sort()).toEqual([...brief.menu].sort());
    expect(screen.getByText(site.contact.orgnr)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: site.contact.email })).toHaveAttribute('href', `mailto:${site.contact.email}`);
    expect(screen.getByText(site.place)).toBeInTheDocument();
  });

  test('the red thread reads the brief’s name and its four words in the home page’s order, each word in its area’s colour', () => {
    const { container } = render(<Footer />);
    const thread = container.querySelector('[data-thread]')!;
    expect(thread.textContent).toBe(brief.thread.name + areas.map((a) => `${a.name}.`).join(' '));
    // the same four words as the brief's line, only reordered
    expect(areas.map((a) => `${a.name}.`).sort()).toEqual(brief.thread.line.split(' ').sort());
    const words = [...thread.querySelectorAll<HTMLElement>('[data-area]')];
    expect(words.map((w) => w.dataset.area)).toEqual(areas.map((a) => a.key));
    words.forEach((w, i) => {
      expect(w.style.color).toBe(`var(${areas[i].onNavy})`);
      expect(w.textContent).toBe(`${areas[i].name}.`);
    });
  });
});
