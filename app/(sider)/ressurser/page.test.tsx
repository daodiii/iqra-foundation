import { render, screen, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
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

describe('Ressurser', () => {
  test('the title and the client’s intro, then the four categories in the client’s order, each its own plate with the client’s text where they gave one', () => {
    render(<Ressurser />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(klient.resources.title);
    expect(screen.getByText(klient.resources.intro)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(klient.resources.categories.map((c) => c.title));
    for (const c of klient.resources.categories) {
      const plate = screen.getByRole('heading', { level: 2, name: c.title }).closest('section')!;
      expect(plate).toHaveAttribute('id', c.key);
      if (c.text) expect(plate).toHaveTextContent(c.text);
    }
  });

  test('each item stands in its category: a video plays on the page, a file can be downloaded, a link opens; an empty category says so', () => {
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

  test('a category with several items lists them all, newest first, each with its title, date, summary and the way to it', () => {
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

  test('each part is a plate named by its title: the title plate, then one per category, its anchor the category’s key', () => {
    const { container } = render(<Ressurser />);
    const plates = container.querySelectorAll('[data-plate]');
    expect(plates).toHaveLength(1 + klient.resources.categories.length);
    expect(screen.getByRole('region', { name: klient.resources.title })).toBe(plates[0]);
    klient.resources.categories.forEach((c, i) => {
      const plate = screen.getByRole('region', { name: c.title });
      expect(plate).toBe(plates[i + 1]);
      expect(plate).toHaveAttribute('id', c.key);
    });
    const tones = Array.from(plates).map((p) => p.getAttribute('data-plate'));
    expect(tones[0]).toBe('white');
    tones.slice(1).forEach((tone, i) => expect(tone).not.toBe(tones[i]));
  });

  test('no list of category links over the plates: each category is its own plate with its own anchor; the only list is the page’s parts beside them (mock 54)', () => {
    render(<Ressurser />);
    expect(screen.queryAllByRole('navigation').map((n) => n.getAttribute('aria-label'))).toEqual(['På denne siden']);
  });
});
