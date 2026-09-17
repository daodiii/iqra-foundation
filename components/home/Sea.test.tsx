import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { Sea } from './Sea';

const realMatchMedia = window.matchMedia;
afterEach(() => { window.matchMedia = realMatchMedia; });

describe('Havet', () => {
  test('one sea of water under the region’s label; the four fields’ words on it in the brief’s order, each one link to its section; no numbers', () => {
    const { container } = render(<Sea />);
    const region = screen.getByRole('region', { name: site.pages.home.areasLabel });
    expect(region).toHaveAttribute('data-fields');
    const waters = region.querySelectorAll('[data-material="water"]');
    expect(waters).toHaveLength(1);
    expect(waters[0]).toHaveAttribute('data-ground', 'navy');
    expect(waters[0]).toHaveAttribute('data-tone', 'dark');

    const words = region.querySelectorAll<HTMLElement>('[data-word]');
    expect(words).toHaveLength(4);
    const tones = { kunnskap: 'dark', dialog: 'light', moteplasser: 'light', samfunnsdeltakelse: 'dark' };
    brief.areas.forEach((a, k) => {
      const word = words[k];
      expect(word).toHaveAttribute('data-word', String(k));
      expect(word).toHaveAttribute('data-tone', tones[a.key]);
      expect(waters[0]).toContainElement(word);
      expect(within(word).getByRole('link', { name: a.name })).toHaveAttribute('href', `/vart-arbeid#${a.key}`);
      expect(within(word).getByRole('heading', { level: 3, name: a.name })).toBeInTheDocument();
      expect(within(word).getByText(a.text)).toBeInTheDocument();
      // the guide's logo for the ground, decorative; the veil is the area's own colour
      expect(word.querySelectorAll('img[alt=""]')).toHaveLength(1);
      expect(word.style.getPropertyValue('--ground')).toBe(`var(--color-area-${a.key})`);
    });
    expect(container.textContent).not.toMatch(/\b0[1-4]\b/);
  });

  test('with script the stage is live and the playhead has been written: every layer has an --on, at most one is on the water', () => {
    render(<Sea />);
    const region = screen.getByRole('region', { name: site.pages.home.areasLabel });
    expect(region).toHaveAttribute('data-live');
    const words = [...region.querySelectorAll<HTMLElement>('[data-word]')];
    for (const w of words) {
      const on = Number(w.style.getPropertyValue('--on'));
      expect(Number.isNaN(on)).toBe(false);
      expect(on).toBeGreaterThanOrEqual(0);
      expect(on).toBeLessThanOrEqual(1);
    }
    expect(words.filter((w) => w.hasAttribute('data-on')).length).toBeLessThanOrEqual(1);
    expect((region.querySelector('[data-sea]') as HTMLElement).style.getPropertyValue('--ground')).toMatch(/^color-mix\(in srgb, var\(--color-area-/);
  });

  test('under reduced motion nothing is live: no --on, no data-on, the four stand as the stylesheet’s column', () => {
    window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('prefers-reduced-motion') })) as typeof window.matchMedia;
    render(<Sea />);
    const region = screen.getByRole('region', { name: site.pages.home.areasLabel });
    expect(region).not.toHaveAttribute('data-live');
    region.querySelectorAll<HTMLElement>('[data-word]').forEach((w) => {
      expect(w.style.getPropertyValue('--on')).toBe('');
      expect(w).not.toHaveAttribute('data-on');
    });
  });
});
