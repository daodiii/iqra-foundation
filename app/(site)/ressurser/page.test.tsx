import { render, screen, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { klient } from '@/content/klient.no';
import type { Resource } from '@/lib/content';
import Ressurser from './page';

/* The real collection ships empty; here it holds one of each kind of item. */
const items: Resource[] = [
  { slug: 'v', title: 'Et foredrag', category: 'videoer', date: '2026-10-01', summary: 'Opptak.', file: null, video: '/files/ressurser/foredrag.mp4', url: null },
  { slug: 'r', title: 'En rapport', category: 'publikasjoner', date: '2026-09-01', summary: 'Rapporten.', file: '/files/ressurser/rapport.pdf', video: null, url: null },
  { slug: 'a', title: 'En artikkel', category: 'artikler', date: '2026-08-01', summary: 'Artikkelen.', file: null, video: null, url: 'https://example.no/artikkel' },
];
vi.mock('@/lib/content', async (orig) => ({ ...(await orig<typeof import('@/lib/content')>()), getResources: () => items }));

describe('Ressurser', () => {
  test('the four categories in the client’s order, each its own section with the client’s text where they gave one', () => {
    render(<Ressurser />);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(klient.resources.categories.map((c) => c.title));
    for (const c of klient.resources.categories) {
      const section = screen.getByRole('heading', { level: 2, name: c.title }).closest('section')!;
      expect(section).toHaveAttribute('id', c.key);
      if (c.text) expect(section).toHaveTextContent(c.text);
    }
  });

  test('each item stands in its category: a video plays on the page, a file can be downloaded, a link opens', () => {
    const { container } = render(<Ressurser />);
    const section = (key: string) => container.querySelector(`section#${key}`) as HTMLElement;
    const video = section('videoer').querySelector('video')!;
    expect(video).toHaveAttribute('src', '/files/ressurser/foredrag.mp4');
    expect(video).toHaveAttribute('controls');
    expect(within(section('publikasjoner')).getByRole('link', { name: 'En rapport' })).toHaveAttribute('href', '/files/ressurser/rapport.pdf');
    expect(within(section('artikler')).getByRole('link', { name: 'En artikkel' })).toHaveAttribute('href', 'https://example.no/artikkel');
    expect(within(section('styringsdokumenter')).getByText('Ingenting er publisert her ennå.')).toBeInTheDocument();
  });
});
