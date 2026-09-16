import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { site } from '@/content/site.no';
import { Nav } from './Nav';

const route = vi.hoisted(() => ({ path: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => route.path }));

beforeEach(() => { route.path = '/'; });

describe('Nav', () => {
  test('the nine items of the brief, in its order, Støtt oss last and a button', () => {
    render(<Nav />);
    const nav = screen.getByRole('navigation', { name: site.header.navLabel });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual([...site.nav.map((i) => i.label)]);
    expect(links[8]).toHaveAttribute('href', '/stott-oss');
    expect(links[8].className).toMatch(/support/);
  });

  test('the current page is marked, and only it — the home page on its own route, a subpage on its own and below it', () => {
    route.path = '/vart-arbeid';
    const { unmount } = render(<Nav />);
    const current = screen.getAllByRole('link').filter((l) => l.getAttribute('aria-current') === 'page');
    expect(current.map((l) => l.textContent)).toEqual(['Vårt arbeid']);
    unmount();
    route.path = '/';
    render(<Nav />);
    expect(screen.getAllByRole('link').filter((l) => l.getAttribute('aria-current') === 'page').map((l) => l.textContent)).toEqual(['Hjem']);
  });

  test('the drawer: opens on the button, locks the page behind it, closes on Escape and gives focus back', () => {
    render(<Nav />);
    const button = screen.getByRole('button', { name: site.header.open });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(document.body.hasAttribute('data-scroll-locked')).toBe(true);
    expect(screen.getByRole('navigation', { name: site.header.navLabel })).toHaveAttribute('data-open');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(document.body.hasAttribute('data-scroll-locked')).toBe(false);
    expect(document.activeElement).toBe(button);
  });
});
