import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import { brand, WATER_DEPTH } from './film';
import { deepest } from './ink';
import { floorAt, POOL_LIMIT } from './water';

/** The guide's five, as `app/globals.css` prints them. */
const FIVE = { navy: '#2c394b', turquoise: '#67c1bf', light: '#f0f0f1', dark: '#393e46', crimson: '#ab5261' };
const GLOBALS = readFileSync(path.resolve(process.cwd(), 'app/globals.css'), 'utf8');

const rgb = (hex: string) => [
  parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16),
] as const;
const lum = (hex: string) => { const [r, g, b] = rgb(hex); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const toHex = (c: readonly number[]) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/** Degrees round the wheel. Only meaningful for a colour with some saturation in it. */
function hue(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return h * 60;
}

/** Is `hex` one of the five, or one of them mixed some way towards white? (Within 2 per channel.) */
function traceable(hex: string): boolean {
  const c = rgb(hex);
  return Object.values(FIVE).some((base) => {
    if (base === hex) return true;
    const b = rgb(base);
    const t = c.map((v, i) => (255 - v) / Math.max(1, 255 - b[i])).reduce((a, v) => a + v, 0) / 3;
    return t >= 0 && t <= 1 && c.every((v, i) => Math.abs(v - (b[i] * t + 255 * (1 - t))) <= 2);
  });
}

/** WCAG contrast between two hexes. */
function contrast(a: string, b: string): number {
  const L = (hex: string) => {
    const [r, g, b] = rgb(hex).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** White at `alpha` over a colour: the frosted inside of a card. */
const frost = (hex: string, alpha: number) => toHex(rgb(hex).map((v) => 255 * alpha + v * (1 - alpha)));

const every = () => [brand.ink.ground, ...brand.ink.ink.map(([h]) => h), brand.water.pale, brand.water.deep, ...brand.water.pools.map(([h]) => h)];

test('one ink, one water, its floor, and the four areas’ water', () => {
  expect(Object.keys(brand)).toEqual(['ink', 'water', 'floor', 'areaWater', 'areaFloor']);
  expect(Object.keys(brand.areaWater)).toEqual(['navy', 'turquoise', 'light', 'crimson']);
});

test('every colour is a full six-digit hex, so the shader parse cannot half-succeed', () => {
  for (const h of every()) expect(h).toMatch(/^#[0-9a-f]{6}$/);
});

test('every colour is one of the guide’s five or a tint of one towards white', () => {
  for (const h of every()) expect(traceable(h), h).toBe(true);
});

test('no ink is additive or over a floor, and the water is not night: navy type sits on every ground', () => {
  expect(brand.ink.additive).toBeFalsy();
  expect(brand.ink.over).toBeFalsy();
  expect(brand.floor.night).toBe(false);
});

/* ----- the ink ----- */

test('the ink’s paper is the guide’s light, and light', () => {
  expect(brand.ink.ground).toBe(FIVE.light);
  expect(lum(brand.ink.ground)).toBeGreaterThan(230);
});

test('the pigments carrying the ink are the turquoise family, and the turquoise itself is one of them', () => {
  const heavy = brand.ink.ink.filter(([, w]) => w >= 2);
  expect(heavy.length).toBeGreaterThan(1);
  expect(heavy.map(([h]) => h)).toContain(FIVE.turquoise);
  for (const [h] of heavy) {
    expect(hue(h), h).toBeGreaterThan(170);
    expect(hue(h), h).toBeLessThan(190);
  }
});

/**
 * The mud lesson, kept as a test. Pigment mixes subtractively, so the darkest ink in a
 * palette has by far the most power to swallow the others; the dark is allowed in — it is
 * the brand's navy — but only as rarely as anything in the palette ever appears.
 */
test('the darkest pigment is the navy, and it is the rarest', () => {
  const darkest = [...brand.ink.ink].sort((a, b) => lum(a[0]) - lum(b[0]))[0];
  expect(darkest[0]).toBe(FIVE.navy);
  expect(darkest[1]).toBe(Math.min(...brand.ink.ink.map(([, w]) => w)));
});

test('the load and the ceiling keep the user’s slider: 0.55 of the 0.7 tuning', () => {
  expect(brand.ink.strength).toBeCloseTo(0.9 * (0.55 / 0.7), 4);
  expect(brand.ink.peak).toBeCloseTo(0.3 * (0.55 / 0.7), 4);
});

/**
 * What a hand can do. The pointer lays pigment on pigment and the display is Beer-Lambert,
 * so without a ceiling a slow finger would run the box to navy. With `peak`, `deepest` is
 * the darkest tone the box can ever show; it has to stay a light mid-tone, and navy type
 * on the frosted card has to clear 4.5:1 on it — the same number the report quotes.
 */
test('nothing a hand does makes the ink darker than a mid blue-grey, and navy still reads on it under the frost', () => {
  const dark = toHex(deepest(brand.ink));
  expect(lum(dark), dark).toBeGreaterThan(150);
  expect(contrast(FIVE.navy, frost(dark, 0.3)), dark).toBeGreaterThanOrEqual(4.5);
});

/* ----- the water ----- */

test('the water is the turquoise: the deep end is the turquoise itself, the pale end a tint of it', () => {
  expect(brand.water.deep).toBe(FIVE.turquoise);
  expect(traceable(brand.water.pale)).toBe(true);
  expect(lum(brand.water.pale)).toBeGreaterThan(225);
  expect(hue(brand.water.pale)).toBeGreaterThan(170);
  expect(hue(brand.water.pale)).toBeLessThan(190);
});

test('the floor at the page’s depth is #addddc, and the CSS tokens carry the same values', () => {
  expect(WATER_DEPTH).toBe(0.45);
  expect(brand.floor.ground).toBe('#addddc');
  expect(floorAt(brand.water, WATER_DEPTH).ground).toBe(brand.floor.ground);
  expect(GLOBALS).toContain(`--color-water-floor: ${brand.floor.ground};`);
  expect(GLOBALS).toContain(`--color-water-pale: ${brand.water.pale};`);
  expect(GLOBALS).toContain(`--color-turquoise-mid: ${brand.ink.ink[1][0]};`);
  expect(GLOBALS).toContain(`--color-light: ${brand.ink.ground};`);
});

test('the floor is a mid-tone: darker than the paper, light enough for navy type', () => {
  expect(lum(brand.floor.ground)).toBeLessThan(lum(brand.ink.ground));
  expect(lum(brand.floor.ground)).toBeGreaterThan(190);
});

test('the pools are light and navy at low alpha, no more than the shader can hold, and inside the box', () => {
  expect(brand.water.pools.length).toBeLessThanOrEqual(POOL_LIMIT);
  for (const [hex, x, y, , a] of brand.water.pools) {
    expect(x, hex).toBeGreaterThanOrEqual(0);
    expect(x, hex).toBeLessThanOrEqual(1);
    expect(y, hex).toBeGreaterThanOrEqual(0);
    expect(y, hex).toBeLessThanOrEqual(1);
    if (hex === FIVE.navy) expect(a, 'navy is shade, not a colour').toBeLessThanOrEqual(0.2);
  }
});

/**
 * The darkest point of the water's still is the deepest navy pool at full strength on the
 * floor; navy type on a half-frosted card there is the number the report quotes.
 */
test('navy type clears 4.5:1 on the frosted card over the darkest pool', () => {
  const ground = rgb(brand.floor.ground);
  const shade = brand.floor.pools.filter(([h]) => h === FIVE.navy).sort((a, b) => b[4] - a[4])[0];
  const darkest = toHex(ground.map((v, i) => v * (1 - shade[4]) + rgb(FIVE.navy)[i] * shade[4]));
  expect(contrast(FIVE.navy, frost(darkest, 0.5)), darkest).toBeGreaterThanOrEqual(4.5);
});

/* ----- the areas’ water ----- */

/** The veil under a field's words: the ground at this alpha over the water (fields.module.css). */
const VEIL = 0.82;
const over = (top: string, alpha: number, under: string) => toHex(rgb(top).map((v, i) => v * alpha + rgb(under)[i] * (1 - alpha)));

test('Dialog’s water is the brand’s water itself', () => {
  expect(brand.areaWater.turquoise).toBe(brand.water);
  expect(brand.areaFloor.turquoise.ground).toBe(brand.floor.ground);
});

test('navy and crimson are night water: the ground is the colour itself, the pools add light', () => {
  for (const g of ['navy', 'crimson'] as const) {
    expect(brand.areaWater[g].night).toBe(true);
    expect(brand.areaWater[g].pale).toBe(FIVE[g]);
    expect(brand.areaWater[g].deep).toBe(FIVE[g]);
    expect(brand.areaFloor[g].ground).toBe(FIVE[g]);
    for (const [hex] of brand.areaWater[g].pools) expect(lum(hex), hex).toBeGreaterThan(190);
  }
});

test('light is pale water: the floor at the page’s depth is #f7f7f8, and the token carries it', () => {
  expect(brand.areaWater.light.night).toBeFalsy();
  expect(brand.areaWater.light.deep).toBe(FIVE.light);
  expect(brand.areaFloor.light.ground).toBe('#f7f7f8');
  expect(floorAt(brand.areaWater.light, WATER_DEPTH).ground).toBe('#f7f7f8');
  expect(GLOBALS).toContain(`--color-water-floor-light: ${brand.areaFloor.light.ground};`);
});

test('every colour in the areas’ water is one of the five or a tint of one, and no scene holds more pools than the shader', () => {
  for (const scene of Object.values(brand.areaWater)) {
    for (const h of [scene.pale, scene.deep, ...scene.pools.map(([h]) => h)]) expect(traceable(h), h).toBe(true);
    expect(scene.pools.length).toBeLessThanOrEqual(POOL_LIMIT);
  }
});

/**
 * The words sit on the veil (the ground at 0.82 over the water); the darkest point under
 * them is the floor with the strongest pool over it. Light type on navy and crimson, navy
 * type on turquoise and light: each clears 4.5:1 there. Without the veil, the raw floor
 * still clears 3:1, so a device that paints the still and no veil is readable.
 */
test('the fields’ type clears 4.5:1 on the veil and 3:1 on the raw floor', () => {
  // White on crimson, not the light: the light is 4.4:1 on crimson and white 5.1:1 (materials.module.css sets it).
  const type = { navy: '#f0f0f1', crimson: '#ffffff', turquoise: FIVE.navy, light: FIVE.navy } as const;
  for (const g of ['navy', 'turquoise', 'light', 'crimson'] as const) {
    const floor = brand.areaFloor[g];
    const strongest = [...floor.pools].sort((a, b) => b[4] - a[4])[0];
    const darkest = over(strongest[0], strongest[4], floor.ground);
    expect(contrast(type[g], over(floor.ground, VEIL, darkest)), `${g} on the veil`).toBeGreaterThanOrEqual(4.5);
    expect(contrast(type[g], darkest), `${g} raw`).toBeGreaterThanOrEqual(3);
  }
});
