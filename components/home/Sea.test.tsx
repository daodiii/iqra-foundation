import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { sentences } from '@/lib/text';
import { Sea } from './Sea';
import { seaAreas } from './tide';

const realMatchMedia = window.matchMedia;
afterEach(() => { window.matchMedia = realMatchMedia; });

describe('Havet', () => {
  test('one sea of water under the region’s label; the four fields’ words on it in the sea’s order (navy, burgundy, turquoise, white), each a spread and one link to its section; no numbers', () => {
    const { container } = render(<Sea />);
    const region = screen.getByRole('region', { name: site.pages.home.areasLabel });
    expect(region).toHaveAttribute('data-fields');
    const waters = region.querySelectorAll('[data-material="water"]');
    expect(waters).toHaveLength(1);
    expect(waters[0]).toHaveAttribute('data-ground', 'navy');
    expect(waters[0]).toHaveAttribute('data-tone', 'dark');

    const words = region.querySelectorAll<HTMLElement>('[data-field]');
    expect(words).toHaveLength(4);
    const tones = { kunnskap: 'dark', dialog: 'light', moteplasser: 'light', samfunnsdeltakelse: 'dark' };
    expect(seaAreas.map((a) => a.key)).toEqual(['kunnskap', 'samfunnsdeltakelse', 'dialog', 'moteplasser']);
    seaAreas.forEach((a, k) => {
      const word = words[k];
      expect(word).toHaveAttribute('data-field', String(k));
      expect(word).toHaveAttribute('data-tone', tones[a.key]);
      expect(waters[0]).toContainElement(word);
      expect(within(word).getByRole('link', { name: a.name })).toHaveAttribute('href', `/vart-arbeid#${a.key}`);
      // first under the hero, so a section of the page: an h2, never an h3 straight after the h1
      const heading = within(word).getByRole('heading', { level: 2, name: a.name });
      expect(heading).toBeInTheDocument();
      // the spread: the four names down the left page in the sea's order, this one lit and the heading, the others words hidden from the reader
      const items = [...word.querySelectorAll('ol > li')];
      expect(items.map((li) => li.textContent)).toEqual(seaAreas.map((x) => x.name));
      expect(items[k]).toHaveAttribute('data-here');
      expect(items[k]).toContainElement(heading);
      items.filter((_, i) => i !== k).forEach((li) => { expect(li).toHaveAttribute('aria-hidden'); expect(li).not.toHaveAttribute('data-here'); });
      expect(within(word).getAllByRole('heading')).toHaveLength(1);
      // the text: the first sentence the statement, the second the reading, nothing lost
      const [statement, reading] = sentences(a.text);
      expect(within(word).getByText(statement)).toBeInTheDocument();
      expect(within(word).getByText(reading)).toBeInTheDocument();
      // the guide's logo for the ground, decorative; the veil is the area's own colour
      expect(word.querySelectorAll('img[alt=""]')).toHaveLength(1);
      expect(word.style.getPropertyValue('--ground')).toBe(`var(--color-area-${a.key})`);
    });
    for (const a of brief.areas) expect(within(region).getByRole('link', { name: a.name })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\b0[1-4]\b/);
  });

  test('with script the stage is live and opens on the first field: its words up and on the water, the others down, the ground its colour — before the plugin has even arrived', () => {
    render(<Sea />);
    const region = screen.getByRole('region', { name: site.pages.home.areasLabel });
    expect(region).toHaveAttribute('data-live');
    const words = [...region.querySelectorAll<HTMLElement>('[data-field]')];
    expect(words.map((w) => w.style.getPropertyValue('--on'))).toEqual(['1.000', '0.000', '0.000', '0.000']);
    expect(words.map((w) => w.hasAttribute('data-on'))).toEqual([true, false, false, false]);
    expect((region.querySelector('[data-sea]') as HTMLElement).style.getPropertyValue('--ground')).toBe('color-mix(in srgb, var(--color-area-samfunnsdeltakelse) 0.0%, var(--color-area-kunnskap))');
  });

  test('under reduced motion nothing is live: no --on, no data-on, the four stand as the stylesheet’s column', () => {
    window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('prefers-reduced-motion') })) as typeof window.matchMedia;
    render(<Sea />);
    const region = screen.getByRole('region', { name: site.pages.home.areasLabel });
    expect(region).not.toHaveAttribute('data-live');
    region.querySelectorAll<HTMLElement>('[data-field]').forEach((w) => {
      expect(w.style.getPropertyValue('--on')).toBe('');
      expect(w).not.toHaveAttribute('data-on');
    });
  });
});
