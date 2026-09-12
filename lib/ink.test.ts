import { expect, test } from 'vitest';
import { ceiling, createInk, deepest, pigmentCycle, purify, type InkPalette, type RGB } from './ink';

const hex = (c: [number, number, number]) =>
  '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');

const palette = (ink: InkPalette['ink']): InkPalette => ({ ink, ground: '#ffffff' });

test('a pigment appears as many times as its weight', () => {
  const cycle = pigmentCycle(palette([['#ff0000', 3], ['#00ff00', 1]]));
  expect(cycle).toHaveLength(4);
  expect(cycle.filter((c) => hex(c) === '#ff0000')).toHaveLength(3);
  expect(cycle.filter((c) => hex(c) === '#00ff00')).toHaveLength(1);
});

/**
 * The whole point of the cycle. Laid down in declaration order, three drops of one colour
 * would arrive together and read as a single blot; the palette then looks like two colours
 * rather than four. Equal weights must therefore alternate rather than clump.
 */
test('equally weighted pigments alternate instead of clumping', () => {
  const cycle = pigmentCycle(palette([['#ff0000', 2], ['#00ff00', 2]]));
  expect(cycle.map(hex)).toEqual(['#ff0000', '#00ff00', '#ff0000', '#00ff00']);
});

test('a rare pigment is spaced away from the ends rather than left until last', () => {
  const cycle = pigmentCycle(palette([['#ff0000', 3], ['#00ff00', 1]])).map(hex);
  expect(cycle.indexOf('#00ff00')).toBeGreaterThan(0);
  expect(cycle.indexOf('#00ff00')).toBeLessThan(cycle.length - 1);
});

/** A shuffle here would give every section a different opening frame and make this suite
 *  flaky; the order is arithmetic, so it is the same on every load. */
test('the cycle is deterministic', () => {
  const p = palette([['#112233', 3], ['#445566', 2], ['#778899', 1]]);
  expect(pigmentCycle(p).map(hex)).toEqual(pigmentCycle(p).map(hex));
});

test('a weight below one still yields the pigment once, rather than dropping it', () => {
  expect(pigmentCycle(palette([['#ff0000', 0], ['#00ff00', 1]]))).toHaveLength(2);
});

/**
 * The hue has to survive, because the palette's whole claim is that these are the film's
 * colours. The same amount comes off every channel, so the differences between them — which
 * are what the hue is — are untouched.
 */
test('purifying a pigment keeps the differences between its channels', () => {
  const before: RGB = [0.8, 0.5, 0.3];
  const after = purify(before);
  expect(after[0] - after[1]).toBeCloseTo(before[0] - before[1], 10);
  expect(after[1] - after[2]).toBeCloseTo(before[1] - before[2], 10);
});

/** The point of it: less absorbed overall, so the ink can be light and coloured at once. */
test('purifying a pigment absorbs strictly less', () => {
  const before: RGB = [0.8, 0.5, 0.3];
  purify(before).forEach((v, i) => expect(v).toBeLessThan(before[i]));
});

/** A pigment that absorbs equally in all three channels is a grey filter and nothing else,
 *  so almost all of it is common absorbance and there is very little colour to keep. */
test('a neutral pigment is mostly common absorbance', () => {
  const [r, g, b] = purify([0.6, 0.6, 0.6]);
  expect(r).toBeCloseTo(g, 10);
  expect(g).toBeCloseTo(b, 10);
  expect(r).toBeLessThan(0.3);
});

test('purifying never drives a channel below zero', () => {
  purify([0, 0.4, 0.9]).forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
});

/*
 * The ceiling. Pigment adds up without limit in the dye field, and the display pass is
 * Beer-Lambert, so a slow finger laying splat on splat used to run any palette to navy or
 * brown — «when you touch the screen the color that comes out is waaay too dark»
 * (2026-09-12). `ceiling` is the curve the shader applies before showing a pixel; it is
 * written once more here so it can be held to its promises without a GPU.
 */
test('below the knee the ceiling changes nothing', () => {
  const dye: RGB = [0.1, 0.05, 0.01];
  expect(ceiling(dye, 0.3)).toEqual(dye);
});

test('no amount of dye gets past the peak', () => {
  for (const m of [0.3, 1, 3, 30, 3000]) {
    const capped = ceiling([m, m * 0.5, m * 0.1], 0.3);
    expect(Math.max(...capped)).toBeLessThanOrEqual(0.3);
  }
});

/** Scaled, not clamped per channel: clamping the strongest channel alone would turn a
 *  blue towards grey as it thickened. The ratios are the hue, and they survive. */
test('the ceiling keeps the ratios between channels', () => {
  const [r, g, b] = ceiling([3, 1.5, 0.3], 0.3);
  expect(r / g).toBeCloseTo(2, 10);
  expect(g / b).toBeCloseTo(5, 10);
});

/** More ink must never show lighter, or a stroke would flicker where it crosses itself. */
test('the ceiling is monotonic', () => {
  let last = -1;
  for (let m = 0; m < 5; m += 0.05) {
    const v = Math.max(...ceiling([m, m * 0.4, m * 0.1], 0.3));
    expect(v).toBeGreaterThanOrEqual(last);
    last = v;
  }
});

test('without a peak the ceiling is off', () => {
  expect(ceiling([5, 2, 1], 0)).toEqual([5, 2, 1]);
  expect(ceiling([5, 2, 1], undefined)).toEqual([5, 2, 1]);
});

/** The darkest tone a box can show is its deepest pigment at the ceiling; with no ceiling,
 *  nothing stops the ink short of black. */
test('deepest is the deepest pigment at the ceiling, and black without one', () => {
  const p: InkPalette = { ink: [['#a5d4f1', 3], ['#4f9fd9', 1]], ground: '#ffffff', peak: 0.3 };
  const [r, , b] = deepest(p);
  expect(b).toBeGreaterThan(r); // still blue
  expect(r).toBeGreaterThan(60); // and nowhere near navy
  expect(deepest({ ...p, peak: undefined })).toEqual([0, 0, 0]);
});

/**
 * jsdom has no WebGL, and `vitest.setup.ts` returns null for every context but 2d — which
 * is what a real browser without WebGL2 does too. The section must survive that: it keeps
 * the CSS ground and loses only the motion, so this is the fallback path under test.
 */
test('createInk declines rather than throwing where there is no WebGL2', () => {
  const canvas = document.createElement('canvas');
  expect(createInk(canvas, { reduced: false, palette: palette([['#ff0000', 1]]) })).toBeNull();
});
