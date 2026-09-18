import { act, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { Contact, groundAt, LINE, TIDE_AT, TIDE_FROM } from './Contact';

const realMatchMedia = window.matchMedia;
afterEach(() => { window.matchMedia = realMatchMedia; });

describe('Contact', () => {
  test('the foot: the brief’s sentence on cooperation and arrangements as the heading, word by word, on the sea’s navy water; Kontakt the one way on', () => {
    const { container } = render(<Contact />);
    const section = container.querySelector('section#kontakt') as HTMLElement;
    const title = within(section).getByRole('heading', { level: 2 });
    expect(section).toHaveAttribute('aria-labelledby', title.id);
    expect(LINE).toBe(brief.about.paragraphs[3]);
    expect(title).toHaveTextContent(LINE);
    expect(title.querySelectorAll('[data-word]').length).toBeGreaterThan(10);
    const links = within(section).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent(site.cta.contact.label);
    expect(links[0]).toHaveAttribute('href', '/kontakt');
    const box = section.closest('[data-material]') as HTMLElement;
    expect(box).toHaveAttribute('data-material', 'water');
    expect(box).toHaveAttribute('data-tone', 'dark');
    expect(box).toHaveAttribute('data-ground', 'navy');
    // live: the tide's driver is on the section
    expect(section).toHaveAttribute('data-rise');
  });

  test('under reduced motion nothing is driven: no mark, no --o, and the stylesheet’s 1 (the tide in) stands', () => {
    window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('prefers-reduced-motion') })) as typeof window.matchMedia;
    const { container } = render(<Contact />);
    const section = container.querySelector('section#kontakt') as HTMLElement;
    expect(section).not.toHaveAttribute('data-rise');
    expect(section.style.getPropertyValue('--o')).toBe('');
  });

  test('the CSS ground under the canvas mixes the two areas’ tokens by the tide', () => {
    expect(groundAt(0)).toBe('color-mix(in srgb, var(--color-area-samfunnsdeltakelse) 0.0%, var(--color-area-kunnskap))');
    expect(groundAt(1)).toBe('color-mix(in srgb, var(--color-area-samfunnsdeltakelse) 100.0%, var(--color-area-kunnskap))');
    expect(groundAt(0.5)).toContain('50.0%');
  });
});

describe('Contact, scrolled', () => {
  /** A 640px plate whose top sits 2000px down the page, read against a 900px window. */
  let innerHeight: PropertyDescriptor | undefined;
  let scrollY: PropertyDescriptor | undefined;
  beforeEach(() => {
    innerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    scrollY = Object.getOwnPropertyDescriptor(window, 'scrollY');
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      const top = 2000 - window.scrollY;
      return { top, bottom: top + 640, left: 0, right: 0, width: 0, height: 640, x: 0, y: top, toJSON() {} } as DOMRect;
    });
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

  test('the tide comes in as the plate reaches the middle of the screen, the CSS ground with it, and goes out again on the way back', () => {
    const { container } = render(<Contact />);
    const section = container.querySelector('section#kontakt') as HTMLElement;
    const box = section.closest('[data-material]') as HTMLElement;
    const o = () => Number(section.style.getPropertyValue('--o'));
    // below the screen: out
    expect(o()).toBe(0);
    expect(box.style.getPropertyValue('--ground')).toBe(groundAt(0));
    // the plate's centre (its whole 640px, under the 720 cap) part way between TIDE_FROM and TIDE_AT
    const mid = (TIDE_FROM + TIDE_AT) / 2;
    scrollTo(2000 + 320 - mid * 900);
    expect(o()).toBeGreaterThan(0.4);
    expect(o()).toBeLessThan(0.6);
    expect(box.style.getPropertyValue('--ground')).toContain('%');
    // at the middle: in
    scrollTo(2000 + 320 - 300);
    expect(o()).toBe(1);
    expect(box.style.getPropertyValue('--ground')).toBe(groundAt(1));
    // scrolled back below: out
    scrollTo(0);
    expect(o()).toBe(0);
  });

  test('unmounted, it stops listening and takes its mark with it', () => {
    const { container, unmount } = render(<Contact />);
    const section = container.querySelector('section#kontakt') as HTMLElement;
    unmount();
    expect(section).not.toHaveAttribute('data-rise');
    const before = section.style.getPropertyValue('--o');
    scrollTo(2000 + 320 - 300);
    expect(section.style.getPropertyValue('--o')).toBe(before);
  });
});
