import { render, within } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { About, sentences } from './About';

const realMatchMedia = window.matchMedia;
afterEach(() => { window.matchMedia = realMatchMedia; });

/** The text as read: the soft hyphens (lib/soft.ts) are invisible unless a line breaks at them. */
const plain = (s: string | null | undefined) => (s ?? '').replace(/­/g, '');

describe('sentences', () => {
  test('parts a paragraph where its sentences end, each keeping its full stop, and the brief’s third paragraph is two', () => {
    expect(sentences('En. To.  Tre.')).toEqual(['En.', 'To.', 'Tre.']);
    expect(sentences('Bare én.')).toEqual(['Bare én.']);
    const [open, wish] = sentences(brief.about.paragraphs[2]);
    expect(open).toMatch(/^Stiftelsen skal være .*\.$/);
    expect(wish).toMatch(/^Vi ønsker å bringe mennesker sammen.*\.$/);
    expect(`${open} ${wish}`).toBe(brief.about.paragraphs[2]);
  });
});

describe('About', () => {
  test('the room: the title (the one link, to Om oss), the statement, three lines; not the fourth paragraph, not the story', () => {
    const { container } = render(<About />);
    const section = container.querySelector('section#om-oss') as HTMLElement;
    const title = within(section).getByRole('heading', { level: 2 });
    expect(plain(title.textContent)).toBe(brief.about.title);
    expect(section).toHaveAttribute('aria-labelledby', title.id);
    const [statement, crossing, arena, through] = brief.about.paragraphs;
    const [open, wish] = sentences(arena);
    const lines = [...section.querySelectorAll('p')].map((p) => plain(p.textContent));
    expect(lines).toEqual([statement, crossing, open, wish]);
    expect(plain(section.textContent)).not.toContain(through);
    expect(plain(section.textContent)).not.toContain(site.pages.about.story.text);
    const links = within(section).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(title).toContainElement(links[0]);
    expect(links[0]).toHaveAttribute('href', '/om-oss');
  });

  test('a white plate in a scene; the doors carry the logo as decoration only, and the scene is driven once the script runs', () => {
    const { container } = render(<About />);
    const scene = container.querySelector('[data-scene]') as HTMLElement;
    expect(scene).toHaveAttribute('data-live');
    const plate = scene.firstElementChild as HTMLElement;
    expect(plate).toHaveAttribute('data-ground', 'white');
    const doors = plate.querySelectorAll(':scope > [aria-hidden="true"]');
    expect(doors).toHaveLength(2);
    for (const door of doors) {
      expect(door.querySelector('img')).toHaveAttribute('alt', '');
      expect(door).toHaveTextContent('');
    }
  });

  test('under reduced motion the scene is not driven: no doors are drawn and nothing is written', () => {
    window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('prefers-reduced-motion') })) as typeof window.matchMedia;
    const { container } = render(<About />);
    const scene = container.querySelector('[data-scene]') as HTMLElement;
    expect(scene).not.toHaveAttribute('data-live');
    expect(scene.style.getPropertyValue('--rise')).toBe('');
  });
});
