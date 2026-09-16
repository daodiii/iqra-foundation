import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { PEN } from '@/lib/pen';
import { Frame } from './Frame';

const realMatchMedia = window.matchMedia;
const realIO = window.IntersectionObserver;
afterEach(() => {
  window.matchMedia = realMatchMedia;
  Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: realIO });
});

/** Reduced motion on: every query that asks about it matches. */
const reduceMotion = () => {
  window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('prefers-reduced-motion') })) as typeof window.matchMedia;
};

const card = (text: string) => screen.getByText(text).closest('[data-frame]') as HTMLElement;

describe('Frame', () => {
  test('the legend is the element asked for, on the line, with the pen’s canvas and the copy in the card', () => {
    render(<Frame legend="Visjon" legendId="visjon-tittel" level="h2"><p>copy</p></Frame>);
    const h2 = screen.getByRole('heading', { level: 2, name: 'Visjon' });
    expect(h2).toHaveAttribute('id', 'visjon-tittel');
    expect(h2).toHaveAttribute('data-legend');
    const el = card('copy');
    expect(el).toContainElement(h2);
    expect(el.querySelector('canvas[data-frame-canvas]')).not.toBeNull();
    expect(screen.getByText('copy')).toBeVisible();
  });

  test('a label legend is a paragraph, and carries no dot unless asked', () => {
    render(<Frame legend="Misjon"><p>x</p></Frame>);
    const legend = card('x').querySelector('[data-legend]')!;
    expect(legend.tagName).toBe('P');
    expect(legend.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  test('with an href the name is the link and its target, and the dot before it is decoration', () => {
    render(<Frame legend="Kunnskap" level="h3" href="/vart-arbeid#kunnskap" dot><p>x</p></Frame>);
    const link = screen.getByRole('link', { name: 'Kunnskap' });
    expect(link).toHaveAttribute('href', '/vart-arbeid#kunnskap');
    const legend = screen.getByRole('heading', { level: 3, name: 'Kunnskap' });
    expect(legend).toContainElement(link);
    expect(legend.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  test('while the pen waits for the card to come on screen, the inside waits with it and the copy does not', () => {
    // The setup's IntersectionObserver never fires: the pen never starts.
    render(<Frame legend="Visjon"><p>words</p></Frame>);
    const el = card('words');
    expect(el.style.getPropertyValue('--frame-in')).toBe('0');
    expect(screen.getByText('words')).toBeVisible();
    expect(el.hasAttribute('data-frame-drawn')).toBe(false);
  });

  test('under reduced motion the pen does not animate: the inside is in at once', () => {
    reduceMotion();
    render(<Frame legend="Visjon"><p>x</p></Frame>);
    expect(card('x').style.getPropertyValue('--frame-in')).toBe('1');
  });

  test('without an IntersectionObserver there is nothing to wait for: drawn now rather than never', () => {
    Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: undefined });
    render(<Frame legend="Visjon"><p>x</p></Frame>);
    expect(card('x').style.getPropertyValue('--frame-in')).toBe('1');
  });

  test('unmounting takes the frost variable with it', () => {
    const { unmount } = render(<Frame legend="Visjon"><p>x</p></Frame>);
    const el = card('x');
    unmount();
    expect(el.style.getPropertyValue('--frame-in')).toBe('');
  });
});

describe('the pen', () => {
  test('draws in the brand’s three colours: a turquoise haze, a navy line, a crimson tip', () => {
    expect(PEN.haze).toMatch(/^rgba\(103,193,191,/);
    expect(PEN.line).toMatch(/^rgba\(44,57,75,/);
    expect(PEN.tip).toMatch(/^rgba\(171,82,97,/);
  });
});
