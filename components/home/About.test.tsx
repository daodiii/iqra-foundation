import { act, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { About, doorsOpen, OPEN_AT, OPEN_FROM } from './About';

const realMatchMedia = window.matchMedia;
afterEach(() => { window.matchMedia = realMatchMedia; });

describe('doorsOpen', () => {
  test('closed with the plate’s centre low on the screen, open from the middle up, and between in between', () => {
    expect(doorsOpen(0.95)).toBe(0);
    expect(doorsOpen(OPEN_FROM)).toBe(0);
    expect(doorsOpen(OPEN_AT)).toBe(1);
    expect(doorsOpen(0.1)).toBe(1);
    expect(doorsOpen((OPEN_FROM + OPEN_AT) / 2)).toBeCloseTo(0.5, 5);
    expect(doorsOpen(0.7)).toBeLessThan(doorsOpen(0.6));
    expect(doorsOpen(0.6)).toBeLessThan(doorsOpen(0.5));
  });
});

describe('About', () => {
  test('the whole of Om oss in the room: the title, the four paragraphs with the areas marked, the story of the name; no links', () => {
    const { container } = render(<About />);
    const section = container.querySelector('section#om-oss') as HTMLElement;
    const title = within(section).getByRole('heading', { level: 2, name: brief.about.title });
    expect(section).toHaveAttribute('aria-labelledby', title.id);
    expect(title).toHaveAttribute('data-title');
    // the marked line is pieces (MarkedLine), so the paragraphs are matched on the room's text
    for (const p of brief.about.paragraphs) expect(section).toHaveTextContent(p);
    expect(section.querySelectorAll('[data-area]')).toHaveLength(brief.areas.length);
    expect(within(section).getByRole('heading', { level: 3, name: site.pages.about.story.label })).toBeInTheDocument();
    expect(within(section).getByText(site.pages.about.story.text)).toBeInTheDocument();
    expect(within(section).queryAllByRole('link')).toHaveLength(0);
  });

  test('the doors carry the name as decoration only, and are marked once the script runs', () => {
    const { container } = render(<About />);
    const plate = container.querySelector('section#om-oss > div') as HTMLElement;
    expect(plate).toHaveAttribute('data-doors');
    const doors = plate.querySelectorAll(':scope > [aria-hidden="true"]');
    expect(doors).toHaveLength(2);
    for (const door of doors) expect(door).toHaveTextContent(brief.about.title);
    // the name is on the doors twice and in the room once: the heading is the only one read
    expect(within(plate).getAllByText(brief.about.title)).toHaveLength(3);
    expect(within(plate).getAllByRole('heading', { level: 2 })).toHaveLength(1);
  });

  test('under reduced motion there are no doors: the plate is never marked and --open is left to the sheet', () => {
    window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('prefers-reduced-motion') })) as typeof window.matchMedia;
    const { container } = render(<About />);
    const plate = container.querySelector('section#om-oss > div') as HTMLElement;
    expect(plate).not.toHaveAttribute('data-doors');
    expect(plate.style.getPropertyValue('--open')).toBe('');
  });
});

describe('About, scrolled', () => {
  /** An 800px plate whose top sits 2000px down the page, read against a 900px window. */
  let innerHeight: PropertyDescriptor | undefined;
  let scrollY: PropertyDescriptor | undefined;
  beforeEach(() => {
    innerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    scrollY = Object.getOwnPropertyDescriptor(window, 'scrollY');
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      const top = 2000 - window.scrollY;
      return { top, bottom: top + 800, left: 0, right: 0, width: 0, height: 800, x: 0, y: top, toJSON() {} } as DOMRect;
    });
    // The scheduled frame runs at once and leaves nothing pending (see Scene.test.tsx on why it must return 0).
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0; });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    const restore = (name: 'innerHeight' | 'scrollY', was: PropertyDescriptor | undefined) => {
      if (was) Object.defineProperty(window, name, was);
      else delete (window as unknown as Record<string, unknown>)[name];
    };
    restore('innerHeight', innerHeight);
    restore('scrollY', scrollY);
  });

  const scrollTo = (y: number) => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
    act(() => { window.dispatchEvent(new Event('scroll')); });
  };

  test('the doors open as the plate reaches the middle of the screen, are hidden once open, and close again on the way back', () => {
    const { container } = render(<About />);
    const plate = container.querySelector('section#om-oss > div') as HTMLElement;
    const open = () => Number(plate.style.getPropertyValue('--open'));
    // below the screen: shut
    expect(open()).toBe(0);
    expect(plate).not.toHaveAttribute('data-open');
    // the plate's centre — its first 720px of the 800 count — at 0.6 of the screen: part way
    scrollTo(2000 + 360 - 540);
    expect(open()).toBeGreaterThan(0);
    expect(open()).toBeLessThan(1);
    // at the middle: open, and the doors taken out of the way
    scrollTo(2000 + 360 - 300);
    expect(open()).toBe(1);
    expect(plate).toHaveAttribute('data-open');
    // scrolled back below: shut again
    scrollTo(0);
    expect(open()).toBe(0);
    expect(plate).not.toHaveAttribute('data-open');
  });

  test('unmounted, it stops listening and takes its marks with it', () => {
    const { container, unmount } = render(<About />);
    const plate = container.querySelector('section#om-oss > div') as HTMLElement;
    unmount();
    expect(plate).not.toHaveAttribute('data-doors');
    const before = plate.style.getPropertyValue('--open');
    scrollTo(2000 + 360 - 300);
    expect(plate.style.getPropertyValue('--open')).toBe(before);
  });
});
