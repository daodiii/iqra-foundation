import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { brand } from '@/lib/film';
import { Box } from './Box';

/*
 * The simulations are mocked: jsdom has no WebGL, and what is tested here is the wiring —
 * which material gets which palette, on which element the pointer is tracked, and that
 * the build waits for `buildWhenQuietNear`, which is made to build at once.
 */
const ink = vi.hoisted(() => vi.fn(() => null));
const water = vi.hoisted(() => vi.fn(() => null));
const near = vi.hoisted(() => vi.fn((_el: Element, build: () => void) => { build(); return () => {}; }));
vi.mock('@/lib/ink', () => ({ createInk: ink }));
vi.mock('@/lib/water', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/water')>()), createWater: water }));
vi.mock('@/lib/near', () => ({ buildWhenQuietNear: near }));

const realMatchMedia = window.matchMedia;
beforeEach(() => { ink.mockClear(); water.mockClear(); near.mockClear(); });
afterEach(() => { window.matchMedia = realMatchMedia; });

describe('Box', () => {
  test('carries its material in CSS from the first paint and holds what is put in it', () => {
    render(<Box material="ink"><p>inside</p></Box>);
    const box = screen.getByText('inside').closest('[data-material]')!;
    expect(box).toHaveAttribute('data-material', 'ink');
    expect(box.querySelector('canvas[data-paint]')).not.toBeNull();
  });

  test('ink is built with the brand’s ink palette, the pointer tracked on the box', () => {
    render(<Box material="ink"><p>x</p></Box>);
    const box = screen.getByText('x').closest('[data-material]');
    expect(near).toHaveBeenCalledTimes(1);
    expect(ink).toHaveBeenCalledTimes(1);
    const [canvas, opts] = ink.mock.calls[0] as unknown as [HTMLCanvasElement, { palette: unknown; host: Element; reduced: boolean }];
    expect(canvas).toHaveAttribute('data-paint');
    expect(opts.palette).toBe(brand.ink);
    expect(opts.host).toBe(box);
    expect(opts.reduced).toBe(false);
    expect(water).not.toHaveBeenCalled();
  });

  test('water is built with the floor at the page’s depth', () => {
    render(<Box material="water"><p>x</p></Box>);
    expect(water).toHaveBeenCalledTimes(1);
    const [, opts] = water.mock.calls[0] as unknown as [HTMLCanvasElement, { floor: unknown }];
    expect(opts.floor).toBe(brand.floor);
    expect(ink).not.toHaveBeenCalled();
  });

  test('under reduced motion nothing is built: the still is the answer', () => {
    window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('prefers-reduced-motion') })) as typeof window.matchMedia;
    render(<Box material="ink"><p>x</p></Box>);
    expect(near).not.toHaveBeenCalled();
    expect(ink).not.toHaveBeenCalled();
    expect(screen.getByText('x')).toBeVisible();
  });
});
