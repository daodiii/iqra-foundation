import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { render } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, test } from 'vitest';
import { Logo } from '@/components/site/Logo';
import { brief } from '@/content/brief.no';
import { brand } from '@/lib/film';
import { AREA_LOOK, areaFloor, areas, fieldVars } from './areas';

/**
 * The mapping is the direction: every area of the brief has a colour and a logo variant,
 * the colour is declared once in the tokens, and the variant is a file the site serves.
 */
const tokens = readFileSync(path.resolve(process.cwd(), 'app/globals.css'), 'utf8');

describe('every area of the brief has a colour and a logo variant', () => {
  test('the brief’s four areas are all mapped, in the brief’s order', () => {
    expect(areas.map((a) => a.key)).toEqual(brief.areas.map((a) => a.key));
    expect(Object.keys(AREA_LOOK).sort()).toEqual([...brief.areas.map((a) => a.key)].sort());
  });

  test.each(areas.map((a) => [a.key, a] as const))('%s', (key, area) => {
    expect(['navy', 'turquoise', 'light', 'crimson']).toContain(area.ground);
    expect(area.token).toBe(`--color-area-${key}`);
    expect(area.href).toBe(`/vart-arbeid#${key}`);
    // The brief's words survive the look being spread over them.
    const fromBrief = brief.areas.find((b) => b.key === key)!;
    expect(area.name).toBe(fromBrief.name);
    expect(area.text).toBe(fromBrief.text);
    // Declared once, in @theme.
    expect(tokens).toMatch(new RegExp(`^\\s*${area.token}:`, 'm'));
    for (const t of [area.ink, area.headingInk, area.ring, area.onNavy]) {
      expect(tokens).toMatch(new RegExp(`^\\s*${t}:`, 'm'));
    }
    // The guide's variant for that ground is a file the site serves.
    const { container } = render(createElement(Logo, { ground: area.ground, height: 28, decorative: true }));
    const src = container.querySelector('img')?.getAttribute('src');
    expect(src).toMatch(/^\/brand\/.+\.svg$/);
    expect(existsSync(path.resolve(process.cwd(), 'public', src!.slice(1)))).toBe(true);
  });

  test('the four grounds are four different colours, and the numbers are 01 to 04', () => {
    expect(new Set(areas.map((a) => a.ground)).size).toBe(4);
    expect(areas.map((a) => a.number)).toEqual(['01', '02', '03', '04']);
  });

  test('fieldVars hands the stylesheet the four custom properties', () => {
    const vars = fieldVars(AREA_LOOK.dialog) as Record<string, string>;
    expect(vars['--field']).toBe('var(--color-area-dialog)');
    expect(vars['--field-text']).toBe('var(--color-navy)');
    expect(vars['--field-heading']).toBe('var(--color-navy)');
    expect(vars['--field-ring']).toBe('var(--color-navy)');
  });

  test('every area has a water scene and a tone that matches its ground', () => {
    for (const a of areas) {
      expect(brand.areaWater[a.ground]).toBeDefined();
      expect(areaFloor(a).ground).toMatch(/^#[0-9a-f]{6}$/);
      expect(a.tone).toBe(a.ground === 'navy' || a.ground === 'crimson' ? 'dark' : 'light');
    }
  });
});
