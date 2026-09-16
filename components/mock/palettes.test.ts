import { describe, expect, it } from 'vitest';
import { deepest } from '@/lib/ink';
import {
  GROUNDS, HEX, PIGMENTS, inkPaletteFor, lookFromString, lookToString, stillFor, toneOf, waterFloorFor,
} from './palettes';

const hexToRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lum = ([r, g, b]: number[]) => {
  const f = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

describe('the mock palettes', () => {
  it('derive a palette and a floor for every ground and pigment', () => {
    for (const g of GROUNDS) for (const p of PIGMENTS) {
      const ink = inkPaletteFor(g, p);
      expect(ink.ground).toBe(HEX[g]);
      expect(ink.ink.length).toBeGreaterThan(0);
      const floor = waterFloorFor(g, p);
      expect(floor.ground).toMatch(/^#[0-9a-f]{6}$/);
      expect(floor.pools.length).toBeGreaterThan(0);
    }
  });

  it('stain pale grounds and glow on dark ones', () => {
    expect(inkPaletteFor('light', 'navy').additive).toBeUndefined();
    expect(inkPaletteFor('light', 'navy').peak).toBeGreaterThan(0);
    expect(inkPaletteFor('navy', 'light').additive).toBe(true);
    expect(inkPaletteFor('crimson', 'turquoise').additive).toBe(true);
    expect(toneOf('navy')).toBe('dark');
    expect(toneOf('turquoise')).toBe('light');
  });

  it('keeps navy type readable on the darkest tone a pale ink can reach', () => {
    for (const g of ['white', 'light'] as const) for (const p of PIGMENTS) {
      const d = deepest(inkPaletteFor(g, p));
      // Under the frost (white at 0.3) the ground is lighter still; the raw floor is the harder test.
      expect(contrast(d, hexToRgb(HEX.navy)), `${g} ${p}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('writes a still for every material', () => {
    const s = stillFor({ material: 'water', ground: 'navy', pigment: 'turquoise' }) as Record<string, string>;
    expect(s['--ground']).toBe(HEX.navy);
    expect(s['--still']).toContain('radial-gradient');
    expect((stillFor({ material: 'flat', ground: 'crimson', pigment: 'light' }) as Record<string, string>)['--ground']).toBe(HEX.crimson);
  });

  it('round-trips a look through the hash and refuses a bad one', () => {
    const l = { material: 'ink', ground: 'light', pigment: 'crimson' } as const;
    expect(lookFromString(lookToString(l), { material: 'flat', ground: 'white', pigment: 'navy' })).toEqual(l);
    expect(lookFromString('ink.pink.navy', l)).toEqual(l);
    expect(lookFromString(undefined, l)).toEqual(l);
  });
});
