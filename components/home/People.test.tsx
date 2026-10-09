import { render, within } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import type { Person } from '@/lib/content';
import { People, Portrait, SEATS } from './People';

/** The text as read: the soft hyphens (lib/soft.ts) are invisible unless a line breaks at them. */
const plain = (s: string | null | undefined) => (s ?? '').replace(/­/g, '');

const realMatchMedia = window.matchMedia;
afterEach(() => { window.matchMedia = realMatchMedia; });

const person = (n: number, photo: Person['photo'] = null): Person => ({
  slug: `p${n}`, name: `Person ${n}`, role: `Rolle ${n}`, bio: `Linjer om person ${n}.`, photo, order: n,
});
const three = [person(1), person(2, { src: '/media/menneskene/to.jpg', alt: 'Person 2 smiler' }), person(3)];
const t = site.pages.people;

describe('People', () => {
  test('the title and the board paragraph, then the people as prints in order: the name, the role, the lines, and the photograph or «Bilde kommer»; the title the one link, to Menneskene bak', () => {
    const { container } = render(<People people={three} />);
    const section = container.querySelector('section#menneskene-bak') as HTMLElement;
    const title = within(section).getByRole('heading', { level: 2 });
    expect(plain(title.textContent)).toBe(brief.people.title);
    expect(section).toHaveAttribute('aria-labelledby', title.id);
    expect(title).toHaveAttribute('data-title');
    const lede = [...section.querySelectorAll('p')].find((p) => plain(p.textContent) === brief.people.paragraph);
    expect(lede).toHaveAttribute('data-prose');
    expect(section).toHaveAttribute('data-arrive');

    const prints = section.querySelectorAll('article');
    expect(prints).toHaveLength(3);
    prints.forEach((print, i) => {
      expect(within(print as HTMLElement).getByRole('heading', { level: 3, name: `Person ${i + 1}` })).toBeInTheDocument();
      expect(print).toHaveTextContent(`Rolle ${i + 1}`);
      expect(print).toHaveTextContent(`Linjer om person ${i + 1}.`);
      // where each print lies in the pile: its slot from the middle one, its place, the first on top
      expect((print as HTMLElement).style.getPropertyValue('--k')).toBe(String(i - 1));
      expect((print as HTMLElement).style.getPropertyValue('--j')).toBe(String(i));
      expect((print as HTMLElement).style.getPropertyValue('--z')).toBe(String(3 - i));
    });
    // the second has a photograph; the others the site's line in its place
    const img = within(prints[1] as HTMLElement).getByRole('img');
    expect(img).toHaveAttribute('src', '/media/menneskene/to.jpg');
    expect(img).toHaveAttribute('alt', 'Person 2 smiler');
    expect(within(prints[1] as HTMLElement).queryByText(t.photoMissing)).toBeNull();
    expect(within(prints[0] as HTMLElement).getByText(t.photoMissing)).toBeInTheDocument();
    expect(within(prints[2] as HTMLElement).getByText(t.photoMissing)).toBeInTheDocument();
    expect(prints[0].querySelector('img[src="/media/bust.webp"]')).not.toBeNull();
    const links = within(section).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(title).toContainElement(links[0]);
    expect(links[0]).toHaveAttribute('href', site.nav.find((n) => n.label === t.label)?.href);
    expect(within(section).queryByText(t.empty)).toBeNull();
  });

  test('the board is a white plate in a scene, driven once the script runs; reduced motion leaves it to the sheet', () => {
    const { container, unmount } = render(<People people={three} />);
    const scene = container.querySelector('[data-scene]') as HTMLElement;
    expect(scene).toHaveAttribute('data-live');
    expect((scene.firstElementChild as HTMLElement)).toHaveAttribute('data-ground', 'white');
    const table = container.querySelector('section#menneskene-bak article')?.parentElement as HTMLElement;
    expect(table.style.getPropertyValue('--n')).toBe('3');
    unmount();
    expect(scene).not.toHaveAttribute('data-live');

    window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('prefers-reduced-motion') })) as typeof window.matchMedia;
    const quiet = render(<People people={three} />).container.querySelector('[data-scene]') as HTMLElement;
    expect(quiet).not.toHaveAttribute('data-live');
    expect(quiet.style.getPropertyValue('--rise')).toBe('');
  });

  test('the table seats the first three by order; the rest are the subpage’s', () => {
    const { container } = render(<People people={[person(3), person(1), person(2), person(4)].sort((a, b) => a.order - b.order)} />);
    const names = [...container.querySelectorAll('article h3')].map((h) => h.textContent);
    expect(SEATS).toBe(3);
    expect(names).toEqual(['Person 1', 'Person 2', 'Person 3']);
    // two people: the pile lies between their two slots
    const two = render(<People people={[person(1), person(2)]} />).container.querySelectorAll('article');
    expect((two[0] as HTMLElement).style.getPropertyValue('--k')).toBe('-0.5');
    expect((two[1] as HTMLElement).style.getPropertyValue('--k')).toBe('0.5');
  });

  test('while the collection is empty: the title, the paragraph and the honest line, no table', () => {
    const { container } = render(<People people={[]} />);
    const section = container.querySelector('section#menneskene-bak') as HTMLElement;
    expect(plain(section.textContent)).toContain(brief.people.paragraph);
    expect(within(section).getByText(t.empty)).toHaveAttribute('data-prose');
    expect(section.querySelectorAll('article')).toHaveLength(0);
  });

  test('Portrait: the photograph when there is one, the bust and the line when not', () => {
    const { container } = render(<Portrait photo={{ src: '/media/menneskene/en.jpg', alt: 'En' }} />);
    expect(container.querySelector('img')).toHaveAttribute('alt', 'En');
    expect(container.querySelector('svg')).toBeNull();
    const bust = render(<Portrait photo={null} />).container;
    // the stand-in bust is a baked image now (elite study), decorative
    expect(bust.querySelector('img')).toHaveAttribute('src', '/media/bust.webp');
    expect(bust.querySelector('img')).toHaveAttribute('alt', '');
    expect(bust.textContent).toBe(t.photoMissing);
  });
});
