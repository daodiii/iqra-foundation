import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { sentences } from '@/lib/text';
import { areaFloor } from './areas';
import { Sea } from './Sea';
import { groundAt, seaAreas } from './tide';

/*
 * The water is built when the box is near and the page quiet (lib/near.ts), and jsdom has no
 * WebGL2. Both are replaced: the build waits until a test calls it, and the water is a handle
 * whose `retune` is watched.
 */
const water = vi.hoisted(() => ({ build: null as null | (() => void), retune: vi.fn(), stir: vi.fn() }));
vi.mock('@/lib/near', () => ({
  buildWhenQuietNear: (_el: Element, build: () => void) => {
    water.build = build;
    return () => {};
  },
}));
vi.mock('@/lib/water', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/water')>()),
  createWater: () => ({ retune: water.retune, stir: water.stir, destroy: () => {} }),
}));

const realMatchMedia = window.matchMedia;
const reduce = () => {
  window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('prefers-reduced-motion') })) as typeof window.matchMedia;
};

/*
 * jsdom has no layout: every rect is zeros. The pages are given one here, a column of four,
 * 500 px apart from 1 000 px down, 400 tall, so the sea has a page to find at the reading line:
 * the middle of the screen under the header, 72 + (768 − 72) / 2.
 */
const LINE = 72 + (768 - 72) / 2;
const centre = (k: number) => 1000 + 500 * k + 200;
/** Puts the window where a scroll would have left it (`scrollY` is read-only to TypeScript). */
const setScroll = (y: number) => Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true });
let now = 0;

beforeEach(() => {
  now = 0;
  water.build = null;
  water.retune.mockClear();
  setScroll(0);
  const real = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    if (this.dataset.page === undefined) return real.call(this);
    const top = 1000 + 500 * Number(this.dataset.page) - window.scrollY;
    return { top, bottom: top + 400, height: 400, left: 0, right: 600, width: 600, x: 0, y: top, toJSON() {} } as DOMRect;
  });
  // Frames run at once, a sixtieth of a second apart, and the clock reads the same time.
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    now += 1000 / 60;
    cb(now);
    return 0;
  });
});

afterEach(() => {
  window.matchMedia = realMatchMedia;
  vi.restoreAllMocks();
});

const region = () => screen.getByRole('region', { name: site.pages.home.areasLabel });
const all = (selector: string) => [...region().querySelectorAll<HTMLElement>(selector)];
const lit = (selector: string) => all(selector).map((e) => e.hasAttribute('data-here'));
const on = (selector: string) => all(selector).map((e) => e.hasAttribute('data-on'));
const only = (k: number) => seaAreas.map((_, j) => j === k);
const box = () => region().querySelector('[data-material="water"]') as HTMLElement;
const sheet = () => region().querySelector('[data-pages]') as HTMLElement;
const scrollToPage = (k: number) =>
  act(() => {
    setScroll(centre(k) - LINE);
    window.dispatchEvent(new Event('scroll'));
  });

describe('Havet as Bladene', () => {
  test('one sea under the region’s label: one water, one list of the four names in the sea’s order, and four pages, each the link to its section, its name an h2, its statement and its reading; no numbers', () => {
    const { container } = render(<Sea />);
    expect(region()).toHaveAttribute('data-fields');
    const waters = region().querySelectorAll('[data-material="water"]');
    expect(waters).toHaveLength(1);
    expect(waters[0]).toHaveAttribute('data-ground', 'navy');
    expect(waters[0]).toHaveAttribute('data-tone', 'dark');
    expect(seaAreas.map((a) => a.key)).toEqual(['kunnskap', 'samfunnsdeltakelse', 'dialog', 'moteplasser']);

    // the left page: one list of the four names, each a button; no landmark of its own (it would need a label, and a label is copy)
    expect(all('[data-index]')).toHaveLength(1);
    expect(within(all('[data-index]')[0]).getAllByRole('button').map((b) => b.textContent)).toEqual(seaAreas.map((a) => a.name));
    expect(within(region()).queryByRole('navigation')).toBeNull();

    // the right pages, in the sea's order
    const pages = all('[data-page]');
    expect(pages).toHaveLength(4);
    seaAreas.forEach((a, k) => {
      const page = pages[k];
      expect(page).toHaveAttribute('data-page', String(k));
      expect(page).toHaveAttribute('href', `/vart-arbeid#${a.key}`);
      expect(page).toBe(within(region()).getByRole('link', { name: a.name }));
      // first under the hero, so a section of the page: an h2, never an h3 straight after the h1
      expect(within(page).getAllByRole('heading')).toHaveLength(1);
      expect(within(page).getByRole('heading', { level: 2, name: a.name })).toBeInTheDocument();
      const [statement, reading] = sentences(a.text);
      expect(within(page).getByText(statement)).toBeInTheDocument();
      expect(within(page).getByText(reading)).toBeInTheDocument();
      // a phone's: the four names head it, its own marked, hidden from a reader (the h2 is its name) …
      const list = page.querySelector('ol')!;
      expect(list).toHaveAttribute('aria-hidden', 'true');
      expect([...list.querySelectorAll('li')].map((li) => li.textContent)).toEqual(seaAreas.map((x) => x.name));
      expect([...list.querySelectorAll('li')].map((li) => li.hasAttribute('data-here'))).toEqual(only(k));
      // … and its logo ends it, for its own ground, decorative
      expect(page.querySelectorAll('img[alt=""]')).toHaveLength(1);
      expect(page.querySelector('img')).toHaveAttribute('data-logo', a.ground);
    });
    // a veil and a foot logo per field; the foot's found by their own attribute (Logo puts `data-logo` on its img)
    expect(all('[data-veil]')).toHaveLength(4);
    expect(all('[data-foot]').map((f) => f.querySelector('img')?.getAttribute('data-logo'))).toEqual(seaAreas.map((a) => a.ground));
    for (const a of brief.areas) expect(within(region()).getByRole('link', { name: a.name })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\b0[1-4]\b/);
  });

  test('with script the sea is live and stands on the first field: its name and page lit, its veil and foot logo on, the box’s own ground its colour, the pages in its inks', () => {
    render(<Sea />);
    expect(region()).toHaveAttribute('data-live');
    expect(region().dataset.u).toBe('0.000');
    expect(lit('[data-item]')).toEqual(only(0));
    expect(lit('[data-page]')).toEqual(only(0));
    expect(on('[data-veil]')).toEqual(only(0));
    expect(on('[data-foot]')).toEqual(only(0));
    // on the box itself: it declares its own `--ground`, and one set above it never showed
    expect(box().style.getPropertyValue('--ground')).toBe(groundAt(0));
    expect(sheet().style.getPropertyValue('--card-text')).toBe('var(--color-light)');
    expect(sheet()).toHaveAttribute('data-tone', 'dark');
  });

  test('scrolled so the third page is on the reading line, its name lights and the tide goes there on its own clock, whole: the veil, the foot logo, the inks, the ground', () => {
    render(<Sea />);
    scrollToPage(2);
    // a tide of two fields is dozens of frames of its own; a jump would be the scroll's one frame
    // (the mirror of the reduced-motion test's `toHaveBeenCalledTimes(1)`)
    expect(vi.mocked(window.requestAnimationFrame).mock.calls.length).toBeGreaterThan(10);
    expect(lit('[data-item]')).toEqual(only(2));
    expect(lit('[data-page]')).toEqual(only(2));
    // the frames ran at once: the tide has landed, on the field exactly
    expect(region().dataset.u).toBe('2.000');
    expect(on('[data-veil]')).toEqual(only(2));
    expect(on('[data-foot]')).toEqual(only(2));
    expect(box().style.getPropertyValue('--ground')).toBe(groundAt(2));
    expect(sheet().style.getPropertyValue('--card-text')).toBe('var(--color-navy)');
    expect(sheet()).toHaveAttribute('data-tone', 'light');
  });

  test('a name is the way to its page: the browser’s own smooth scroll brings the page’s centre to the reading line, and the focus goes to the page', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(<Sea />);
    fireEvent.click(screen.getByRole('button', { name: seaAreas[3].name }));
    expect(scrollTo).toHaveBeenCalledWith({ top: centre(3) - LINE, behavior: 'smooth' });
    expect(document.activeElement).toBe(screen.getByRole('link', { name: seaAreas[3].name }));
  });

  test('under reduced motion the sea goes to a field at once, with no clock and no frames of its own, and a name jumps rather than glides', () => {
    reduce();
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(<Sea />);
    expect(region()).toHaveAttribute('data-live');
    scrollToPage(3);
    expect(region().dataset.u).toBe('3.000');
    expect(lit('[data-page]')).toEqual(only(3));
    expect(box().style.getPropertyValue('--ground')).toBe(groundAt(3));
    // one frame, the scroll's own: nothing ran between the fields
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: seaAreas[0].name }));
    expect(scrollTo).toHaveBeenCalledWith({ top: centre(0) - LINE, behavior: 'auto' });
  });

  test('a water built late is put straight onto the field on screen, not left on the first field’s floor it was built with', () => {
    render(<Sea />);
    scrollToPage(3);
    expect(water.retune).not.toHaveBeenCalled();
    act(() => water.build!());
    const [from, to, t] = water.retune.mock.calls.at(-1)!;
    expect(from).toBe(areaFloor(seaAreas[2]));
    expect(to).toBe(areaFloor(seaAreas[3]));
    expect(t).toBe(1);
  });
});
