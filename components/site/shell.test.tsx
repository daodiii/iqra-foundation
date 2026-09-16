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
  test('the skip link, the named logo home with both logos, the nine items', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: site.header.skip })).toHaveAttribute('href', '#innhold');
    const home = screen.getByRole('link', { name: site.header.homeLabel });
    const logos = within(home).getAllByRole('presentation');
    expect(logos.map((l) => l.getAttribute('data-logo'))).toEqual(['white', 'navy']);
    const nav = screen.getByRole('navigation', { name: site.header.navLabel });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual([...brief.menu]);
    expect(links.map((l) => l.getAttribute('href'))).toEqual(site.nav.map((n) => n.href));
  });

  test('the current page is marked, and only it', () => {
    pathname = '/om-oss';
    render(<Header />);
    const current = screen.getAllByRole('link', { current: 'page' });
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('Om oss');
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
  test('the reversed logo, the nine links, the facts', () => {
    render(<Footer />);
    expect(within(screen.getByRole('link', { name: site.header.homeLabel })).getByRole('presentation')).toHaveAttribute('data-logo', 'navy');
    const nav = screen.getByRole('navigation', { name: site.footer.navLabel });
    expect(within(nav).getAllByRole('link').map((l) => l.textContent)).toEqual([...brief.menu]);
    expect(screen.getByText(site.contact.orgnr)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: site.contact.email })).toHaveAttribute('href', `mailto:${site.contact.email}`);
    expect(screen.getByText(site.place)).toBeInTheDocument();
  });

  test('the red thread reads the brief’s two lines character for character, each word in its area’s colour', () => {
    const { container } = render(<Footer />);
    const thread = container.querySelector('[data-thread]')!;
    expect(thread.textContent).toBe(brief.thread.name + brief.thread.line);
    const words = [...thread.querySelectorAll<HTMLElement>('[data-area]')];
    expect(words.map((w) => w.dataset.area)).toEqual(areas.map((a) => a.key));
    words.forEach((w, i) => {
      expect(w.style.color).toBe(`var(${areas[i].onNavy})`);
      expect(w.textContent).toBe(`${areas[i].name}.`);
    });
  });
});
