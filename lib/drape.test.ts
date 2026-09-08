import { expect, test } from 'vitest';
import { COVER, ramp, sample } from './drape';

const hex = (c: [number, number, number]) =>
  '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');

test('the ramp runs cool to warm and its stops are in order', () => {
  const stops = ramp();
  for (let i = 1; i < stops.length; i++) {
    expect(stops[i].at).toBeGreaterThan(stops[i - 1].at);
  }
  expect(stops[0].at).toBe(0);
  expect(stops[stops.length - 1].at).toBe(1);
});

/**
 * The chroma between them is lifted, which is a deliberate step outside the palette —
 * a ramp built only from the brand navy reads as smoke on a white page. These two are
 * the anchors that keep it recognisably the brand, so they are hit exactly.
 */
test('the brand blue and the brand burgundy are hit exactly', () => {
  expect(hex(sample(ramp(), 0.5))).toBe('#3f5b7a');
  expect(hex(sample(ramp(), 0.86))).toBe('#ab5263');
});

test('the turquoise sits at the cool edge, before the blue', () => {
  expect(hex(sample(ramp(), 0.13))).toBe('#62bfbd');
});

test('sampling is clamped, so a drifting phase cannot run off either end', () => {
  const stops = ramp();
  expect(sample(stops, -3)).toEqual(stops[0].c);
  expect(sample(stops, 9)).toEqual(stops[stops.length - 1].c);
});

/** mission.module.css reserves a column against this, so the two must agree. */
test('the drape covers just over half the section', () => {
  expect(COVER).toBeCloseTo(0.51, 5);
});

test('the default is the light ramp, which is the one Misjon is laid out against', () => {
  expect(ramp()).toEqual(ramp('light'));
});

test('the deep ramp is a shorter journey, and its stops are in order too', () => {
  const stops = ramp('deep');
  expect(stops.length).toBeLessThan(ramp('light').length);
  for (let i = 1; i < stops.length; i++) {
    expect(stops[i].at).toBeGreaterThan(stops[i - 1].at);
  }
  expect(stops[0].at).toBe(0);
  expect(stops[stops.length - 1].at).toBe(1);
});

/** The same two anchors as the light ramp: whatever the ground, it is the brand's blue
 *  and the brand's burgundy the drape travels between. */
test('the deep ramp hits the brand blue and the brand burgundy exactly', () => {
  expect(hex(sample(ramp('deep'), 0.28))).toBe('#3f5b7a');
  expect(hex(sample(ramp('deep'), 1))).toBe('#ab5263');
});

/**
 * Støtt oss sets white type over the middle of the field. If the ramp ever brightened
 * there the way the light one does at both ends, the amount would be sitting on its own
 * colour — so this is a legibility check wearing a colour check's clothes.
 */
test('the deep ramp is darkest through the middle, where the type sits', () => {
  const lum = (c: [number, number, number]) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const stops = ramp('deep');
  const middle = lum(sample(stops, 0.52));
  expect(middle).toBeLessThan(lum(sample(stops, 0)));
  expect(middle).toBeLessThan(lum(sample(stops, 1)));
});
