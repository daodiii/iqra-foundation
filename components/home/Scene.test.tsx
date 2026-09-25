import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { held, openness, Scene } from './Scene';

const realMatchMedia = window.matchMedia;
afterEach(() => { window.matchMedia = realMatchMedia; });

describe('openness', () => {
  test('a plate is open within a fifth of the screen of the middle, closed beyond 0.58, and between in between', () => {
    expect(openness(0)).toBe(1);
    expect(openness(0.2)).toBe(1);
    expect(openness(-0.2)).toBe(1);
    expect(openness(0.58)).toBe(0);
    expect(openness(-0.9)).toBe(0);
    expect(openness(0.39)).toBeCloseTo(0.5, 5);
    expect(openness(0.3)).toBeGreaterThan(openness(0.4));
    expect(openness(0.4)).toBeGreaterThan(openness(0.5));
  });

  test('held: the same on the way up, and open for good once past the middle', () => {
    expect(held(0.39)).toBe(openness(0.39));
    expect(held(0.58)).toBe(0);
    expect(held(0)).toBe(1);
    expect(held(-0.4)).toBe(1);
    expect(held(-0.9)).toBe(1);
  });
});

describe('Scene', () => {
  test('sets --open on its element from where it stands, once mounted', () => {
    render(<Scene><div>plate</div></Scene>);
    const scene = screen.getByText('plate').parentElement as HTMLElement;
    const open = Number(scene.style.getPropertyValue('--open'));
    expect(Number.isNaN(open)).toBe(false);
    expect(open).toBeGreaterThanOrEqual(0);
    expect(open).toBeLessThanOrEqual(1);
  });

  test('under reduced motion it never opens: no --open at all', () => {
    window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('prefers-reduced-motion') })) as typeof window.matchMedia;
    render(<Scene><div>plate</div></Scene>);
    const scene = screen.getByText('plate').parentElement as HTMLElement;
    expect(scene.style.getPropertyValue('--open')).toBe('');
  });
});

describe('Scene, scrolled', () => {
  /** A 400px plate whose top sits 2000px down the page, read against a 900px window. */
  let innerHeight: PropertyDescriptor | undefined;
  let scrollY: PropertyDescriptor | undefined;
  beforeEach(() => {
    innerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    scrollY = Object.getOwnPropertyDescriptor(window, 'scrollY');
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      const top = 2000 - window.scrollY;
      return { top, bottom: top + 400, left: 0, right: 0, width: 0, height: 400, x: 0, y: top, toJSON() {} } as DOMRect;
    });
  });
  // The window's own values back, so whatever runs after this block reads jsdom's, not a stub's.
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

  test('opens as it reaches the middle and tells onOpen on the edge, both ways', () => {
    const onOpen = vi.fn();
    render(<Scene onOpen={onOpen}><div>plate</div></Scene>);
    const scene = screen.getByText('plate').parentElement as HTMLElement;

    expect(scene.style.getPropertyValue('--open')).toBe('0.000');
    expect(onOpen).not.toHaveBeenCalled();

    scrollTo(1750); // the plate's centre on the middle of the screen
    expect(scene.style.getPropertyValue('--open')).toBe('1.000');
    expect(onOpen).toHaveBeenLastCalledWith(true);
    expect(onOpen).toHaveBeenCalledTimes(1);

    scrollTo(1700); // off ≈ 0.056, still within OPEN_WITHIN (0.2) of the middle
    expect(scene.style.getPropertyValue('--open')).toBe('1.000');
    expect(onOpen).toHaveBeenCalledTimes(1);

    scrollTo(0);
    expect(scene.style.getPropertyValue('--open')).toBe('0.000');
    expect(onOpen).toHaveBeenLastCalledWith(false);
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  test('the plate is where the page is on every scroll: no frame of its own, nothing easing after it', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    render(<Scene><div>plate</div></Scene>);
    const scene = screen.getByText('plate').parentElement as HTMLElement;
    scrollTo(1750 - 0.4 * 900); // off 0.4: between OPEN_WITHIN and CLOSED_BEYOND
    const midway = scene.style.getPropertyValue('--open');
    expect(Number(midway)).toBeGreaterThan(0);
    expect(Number(midway)).toBeLessThan(1);
    scrollTo(1750);
    expect(scene.style.getPropertyValue('--open')).toBe('1.000');
    expect(raf).not.toHaveBeenCalled();
  });

  test('unmounting stops listening: a scroll after it leaves the plate as it was', () => {
    const off = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<Scene><div>plate</div></Scene>);
    const scene = screen.getByText('plate').parentElement as HTMLElement;
    unmount();
    expect(off).toHaveBeenCalledWith('resize', expect.anything());
    scrollTo(1750);
    expect(scene.style.getPropertyValue('--open')).toBe('0.000');
  });
});
