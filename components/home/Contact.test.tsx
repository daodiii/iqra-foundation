import { act, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { site } from '@/content/site.no';
import { Contact, MEET_BY, meet, push, PUSH_FROM } from './Contact';

const realMatchMedia = window.matchMedia;
afterEach(() => { window.matchMedia = realMatchMedia; });

const t = site.pages.home.contact;

describe('Contact', () => {
  test('the foot: the question word by word on our plate, the line and the one button on the sheet on yours; two flat navy plates, no numbers', () => {
    const { container } = render(<Contact />);
    const section = container.querySelector('section#kontakt') as HTMLElement;
    const title = within(section).getByRole('heading', { level: 2 });
    expect(section).toHaveAttribute('aria-labelledby', title.id);
    expect(title).toHaveTextContent(t.question);
    expect(title.querySelectorAll('[data-word]')).toHaveLength(t.question.split(' ').length);
    const sheet = section.querySelector('[data-sheet]') as HTMLElement;
    expect(within(sheet).getByText(t.line)).toBeInTheDocument();
    const links = within(section).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent(site.cta.contact.label);
    expect(links[0]).toHaveAttribute('href', '/kontakt');
    expect(sheet).toContainElement(links[0]);
    const plates = section.querySelectorAll('[data-material="flat"]');
    expect(plates).toHaveLength(2);
    plates.forEach((p) => expect(p).toHaveAttribute('data-ground', 'navy'));
    expect(plates[0]).toContainElement(title);
    expect(plates[1]).toContainElement(sheet);
    expect(section).not.toHaveTextContent(site.support.vipps.value);
    // live: the driver is on the table, the section's parent, and at mount (a zero rect) everything stands met and at rest
    const table = section.parentElement as HTMLElement;
    expect(table).toHaveAttribute('data-rise');
    expect(table.style.getPropertyValue('--meet')).toBe('1.000');
    expect(table.style.getPropertyValue('--push')).toBe('1.000');
  });

  test('under reduced motion nothing is driven: no mark, no numbers, and the stylesheet’s 1s (met, at rest) stand', () => {
    window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('prefers-reduced-motion') })) as typeof window.matchMedia;
    const { container } = render(<Contact />);
    const table = (container.querySelector('section#kontakt') as HTMLElement).parentElement as HTMLElement;
    expect(table).not.toHaveAttribute('data-rise');
    expect(table.style.getPropertyValue('--o')).toBe('');
    expect(table.style.getPropertyValue('--meet')).toBe('');
    expect(table.style.getPropertyValue('--push')).toBe('');
  });

  test('the plates meet over the first three fifths of the rise and the sheet comes across over its second half: the table is laid before the paper is handed over', () => {
    expect(meet(0)).toBe(0);
    expect(meet(MEET_BY / 2)).toBe(0.5);
    expect(meet(MEET_BY)).toBe(1);
    expect(meet(1)).toBe(1);
    expect(push(0)).toBe(0);
    expect(push(PUSH_FROM)).toBe(0);
    expect(push((1 + PUSH_FROM) / 2)).toBe(0.5);
    expect(push(1)).toBe(1);
    // The overlap: while the sheet starts across, the plates are still closing.
    expect(PUSH_FROM).toBeLessThan(MEET_BY);
    expect(meet(PUSH_FROM)).toBeLessThan(1);
  });
});

describe('Contact, scrolled', () => {
  /** A 660px table whose top sits 2000px down the page, read against a 900px window. */
  let innerHeight: PropertyDescriptor | undefined;
  let scrollY: PropertyDescriptor | undefined;
  beforeEach(() => {
    innerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    scrollY = Object.getOwnPropertyDescriptor(window, 'scrollY');
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      const top = 2000 - window.scrollY;
      return { top, bottom: top + 660, left: 0, right: 0, width: 0, height: 660, x: 0, y: top, toJSON() {} } as DOMRect;
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

  /** Scrolls so the table's centre (its first four fifths of a screen) stands at `c` screen heights from the top. */
  const centreAt = (c: number) => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 2000 + 330 - 900 * c });
    act(() => { window.dispatchEvent(new Event('scroll')); });
  };

  test('below the screen the plates are apart and the sheet beyond the edge; the plates meet first, then the sheet comes across; scrolled back, both go', () => {
    const { container } = render(<Contact />);
    const table = (container.querySelector('section#kontakt') as HTMLElement).parentElement as HTMLElement;
    const read = () => ({ o: Number(table.style.getPropertyValue('--o')), meet: Number(table.style.getPropertyValue('--meet')), push: Number(table.style.getPropertyValue('--push')) });

    centreAt(1.3);
    expect(read()).toEqual({ o: 0, meet: 0, push: 0 });

    centreAt(0.8);
    const laying = read();
    expect(laying.meet).toBeGreaterThan(0.5);
    expect(laying.meet).toBeLessThan(1);
    expect(laying.push).toBe(0);
    expect(laying.meet).toBeCloseTo(meet(laying.o), 2);

    centreAt(0.6);
    const handing = read();
    expect(handing.meet).toBe(1);
    expect(handing.push).toBeGreaterThan(0.4);
    expect(handing.push).toBeLessThan(1);
    expect(handing.push).toBeCloseTo(push(handing.o), 2);

    centreAt(0.42);
    expect(read()).toEqual({ o: 1, meet: 1, push: 1 });

    centreAt(1.3);
    expect(read()).toEqual({ o: 0, meet: 0, push: 0 });
  });
});
