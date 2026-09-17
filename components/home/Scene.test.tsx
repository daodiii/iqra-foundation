import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { openness, Scene } from './Scene';

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
  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      const top = 2000 - window.scrollY;
      return { top, bottom: top + 400, left: 0, right: 0, width: 0, height: 400, x: 0, y: top, toJSON() {} } as DOMRect;
    });
  });
  afterEach(() => { vi.restoreAllMocks(); });

  const scrollTo = (y: number) => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
    act(() => { window.dispatchEvent(new Event('scroll')); });
  };

  test('opens as it reaches the middle and tells onOpen on the edge, both ways', () => {
    /*
     * Runs the scheduled update synchronously and reports no frame left pending (returns
     * 0, not a real handle): `schedule` does `raf = requestAnimationFrame(update)`, and
     * `update` clears `raf` to 0 as its first line — so a stub returning a truthy id would
     * have that assignment clobber the clear right back to truthy, latching `raf` non-zero
     * forever and silently dropping every scroll after the first. Confirmed by running it:
     * with a literal `return 1`, --open stuck at '1.000' and onOpen never saw its second
     * call after scrollTo(0). `return 0` lets every call below drive its own fresh recompute.
     */
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0; });
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

  test('one frame per burst of scroll events', () => {
    render(<Scene><div>plate</div></Scene>);
    // Never runs the callback, so `raf` latches non-zero after the first call and the
    // guard in `schedule` coalesces the rest of the burst into that one pending frame.
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 7);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('scroll'));
    });
    expect(raf).toHaveBeenCalledTimes(1);
  });

  test('unmounting removes the listeners and cancels the pending frame', () => {
    const off = vi.spyOn(window, 'removeEventListener');
    const caf = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 7); // never resolves: the frame stays pending
    const { unmount } = render(<Scene><div>plate</div></Scene>);
    act(() => { window.dispatchEvent(new Event('scroll')); });
    unmount();
    expect(off).toHaveBeenCalledWith('scroll', expect.anything());
    expect(off).toHaveBeenCalledWith('resize', expect.anything());
    expect(caf).toHaveBeenCalledWith(7);
  });
});
