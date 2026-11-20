import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import type { Person } from '@/lib/content';

/* The real collection by default; a test can swap in its own people. */
let override: Person[] | null = null;
vi.mock('@/lib/content', async (orig) => {
  const real = await orig<typeof import('@/lib/content')>();
  return { ...real, getPeople: () => override ?? real.getPeople() };
});

const { default: MenneskeneBak } = await import('./page');
const t = klient.people;

afterEach(() => {
  override = null;
});

describe('Menneskene bak', () => {
  test('the client’s text, verbatim: title, intro, Styret and its text, Kontakt styret', () => {
    render(<MenneskeneBak />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t.title);
    expect(screen.getByText(t.intro)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([t.board.title, t.contact.title]);
    expect(screen.getByText(t.board.text)).toBeInTheDocument();
  });

  test('the five board members, each with name and role, in the client’s order, and nobody else', () => {
    render(<MenneskeneBak />);
    const board = screen.getByRole('heading', { level: 2, name: t.board.title }).closest('section')!;
    const items = within(board).getAllByRole('listitem');
    expect(items.map((li) => within(li).getByRole('heading', { level: 3 }).textContent)).toEqual(t.members.map((m) => m.name));
    items.forEach((li, i) => expect(li).toHaveTextContent(t.members[i].role));
    expect(screen.queryByText(site.pages.people.empty)).toBeNull();
  });

  test('a photo fills its person’s frame with its alt, and a bio is shown', () => {
    override = [
      { slug: 'a', name: 'Navn En', role: 'styreleder', photo: { src: '/bilder/en.jpg', alt: 'Portrett av Navn En' }, bio: 'En kort bio.', order: 1 },
      { slug: 'b', name: 'Navn To', role: 'styremedlem', photo: null, bio: null, order: 2 },
    ];
    render(<MenneskeneBak />);
    const img = screen.getByRole('img', { name: 'Portrett av Navn En' });
    expect(img).toHaveAttribute('src', '/bilder/en.jpg');
    expect(img.closest('li')).toHaveTextContent('En kort bio.');
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  test('with nobody in the collection, the site’s sentence stands in the frames’ place', () => {
    override = [];
    render(<MenneskeneBak />);
    expect(screen.getByText(site.pages.people.empty)).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  test('Kontakt styret keeps the client’s words, with the address as a mail link', () => {
    render(<MenneskeneBak />);
    const contact = screen.getByRole('heading', { level: 2, name: t.contact.title }).closest('section')!;
    expect(contact.querySelector('p')!.textContent).toBe(t.contact.text);
    expect(within(contact).getByRole('link', { name: site.contact.email })).toHaveAttribute('href', `mailto:${site.contact.email}`);
  });

  test('the foundation council is not shown', () => {
    const { container } = render(<MenneskeneBak />);
    expect(container.textContent).not.toMatch(/stiftelsesr[åa]d|fagr[åa]d/i);
  });
});
