import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import type { Resource } from '@/lib/content';
import Ressurser from './page';

/* The real collection ships empty; here it holds one of each kind of item, and three in one book (newest first, as getResources gives them). */
const items: Resource[] = [
  { slug: 'v', title: 'Et foredrag', category: 'videoer', date: '2026-10-01', summary: 'Opptak.', file: null, video: '/files/ressurser/foredrag.mp4', url: null },
  { slug: 'r3', title: 'Årsrapport for kompetanseutvikling', category: 'publikasjoner', date: '2026-11-01', summary: 'Den nyeste.', file: '/files/ressurser/arsrapport.pdf', video: null, url: null },
  { slug: 'r', title: 'En rapport', category: 'publikasjoner', date: '2026-09-01', summary: 'Rapporten.', file: '/files/ressurser/rapport.pdf', video: null, url: null },
  { slug: 'r1', title: 'Et notat', category: 'publikasjoner', date: '2026-03-14', summary: 'Notatet.', file: null, video: null, url: 'https://example.no/notat' },
  { slug: 'a', title: 'En artikkel', category: 'artikler', date: '2026-08-01', summary: 'Artikkelen.', file: null, video: null, url: 'https://example.no/artikkel' },
];
vi.mock('@/lib/content', async (orig) => ({ ...(await orig<typeof import('@/lib/content')>()), getResources: () => items }));

const t = site.pages.resources;
const section = (c: HTMLElement, key: string) => c.querySelector(`section#${key}`) as HTMLElement;
const spine = (key: string) => within(document.querySelector(`section#${key}`) as HTMLElement).getByRole('button');

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('Ressurser', () => {
  test('the title and the client’s intro, then the four categories in the client’s order, each its own book with the client’s text where they gave one', () => {
    render(<Ressurser />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(klient.resources.title);
    expect(screen.getByText(klient.resources.intro)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(klient.resources.categories.map((c) => c.title));
    for (const c of klient.resources.categories) {
      const book = screen.getByRole('heading', { level: 2, name: c.title }).closest('section')!;
      expect(book).toHaveAttribute('id', c.key);
      if (c.text) expect(book).toHaveTextContent(c.text);
    }
  });

  test('each item stands in its category: a video plays on the page, a file can be downloaded, a link opens; an empty book says so', () => {
    const { container } = render(<Ressurser />);
    const video = section(container, 'videoer').querySelector('video')!;
    expect(video).toHaveAttribute('src', '/files/ressurser/foredrag.mp4');
    expect(video).toHaveAttribute('controls');
    expect(video).toHaveAttribute('preload', 'metadata');
    expect(video).toHaveAttribute('playsinline');
    const pub = within(section(container, 'publikasjoner'));
    expect(pub.getByRole('link', { name: 'En rapport' })).toHaveAttribute('href', '/files/ressurser/rapport.pdf');
    const art = within(section(container, 'artikler'));
    expect(art.getByRole('link', { name: 'En artikkel' })).toHaveAttribute('href', 'https://example.no/artikkel');
    expect(art.getByRole('link', { name: t.open })).toHaveAttribute('href', 'https://example.no/artikkel');
    expect(within(section(container, 'styringsdokumenter')).getByText(t.empty)).toBeInTheDocument();
    expect(within(section(container, 'videoer')).queryByText(t.empty)).toBeNull();
  });

  test('a book with several items lists them all, newest first, each with its title, date, summary and the way to it', () => {
    const { container } = render(<Ressurser />);
    const book = section(container, 'publikasjoner');
    const lis = book.querySelectorAll('li');
    expect(Array.from(book.querySelectorAll('h3')).map((h) => h.textContent)).toEqual(['Årsrapport for kompetanseutvikling', 'En rapport', 'Et notat']);
    expect(lis[0]).toHaveTextContent('1. november 2026');
    expect(lis[0].querySelector('time')).toHaveAttribute('dateTime', '2026-11-01');
    expect(lis[0]).toHaveTextContent('Den nyeste.');
    expect(within(lis[0]).getByRole('link', { name: t.download })).toHaveAttribute('href', '/files/ressurser/arsrapport.pdf');
    expect(within(lis[2]).getByRole('link', { name: t.open })).toHaveAttribute('href', 'https://example.no/notat');
    expect(within(book).queryByText(t.empty)).toBeNull();
  });

  test('the first book stands open; choosing a spine pulls that book out and puts the others back', () => {
    const { container } = render(<Ressurser />);
    expect(spine('publikasjoner')).toHaveAttribute('aria-expanded', 'true');
    expect(section(container, 'publikasjoner')).toHaveAttribute('data-open');
    expect(section(container, 'artikler').querySelector('[data-cover]')).toHaveAttribute('inert');
    fireEvent.click(spine('artikler'));
    expect(spine('artikler')).toHaveAttribute('aria-expanded', 'true');
    expect(spine('publikasjoner')).toHaveAttribute('aria-expanded', 'false');
    expect(section(container, 'artikler').querySelector('[data-cover]')).not.toHaveAttribute('inert');
    expect(container.querySelectorAll('section[data-open]')).toHaveLength(1);
  });

  test('arriving at a category’s anchor opens its book (the old Styringsdokumenter address lands there), and so does a later anchor', () => {
    window.history.replaceState(null, '', '/ressurser#styringsdokumenter');
    const { container } = render(<Ressurser />);
    expect(spine('styringsdokumenter')).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelectorAll('section[data-open]')).toHaveLength(1);
    act(() => {
      window.history.replaceState(null, '', '/ressurser#videoer');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(spine('videoer')).toHaveAttribute('aria-expanded', 'true');
  });

  test('no list of category links over the shelf: the spines are the way to a category, as in the mock', () => {
    render(<Ressurser />);
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});
