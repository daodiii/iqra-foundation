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
