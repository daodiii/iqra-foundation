import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
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
