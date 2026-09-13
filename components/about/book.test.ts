import { expect, test } from 'vitest';
import { cameraX, createBook, pagePixels, PW } from './book';

/**
 * How wide a page renders, in the canvas's own pixels, at a camera distance: what a
 * caller needs to paint its pages at the size they are seen, neither soft nor aliased.
 * The page is bound by the canvas's height — the camera's field is vertical — so the
 * width of the canvas does not come into it.
 */
test('a page’s rendered width follows the canvas height and the camera distance', () => {
  // /om-oss at 1440×900: dist 3.05 on a 900px canvas shows a page about 461px wide —
  // which is where BookFigure's «19px of body copy at 1440» comes from (32 × 461 / 768).
  expect(pagePixels(900, 3.05)).toBeCloseTo(461, 0);
  // The landing page's spread: nearer, so the page is larger for the same height.
  expect(pagePixels(672, 2.55)).toBeCloseTo(411, 0);
  // Nearer still, or a taller canvas: more pixels, in proportion.
  expect(pagePixels(672, 2.35)).toBeGreaterThan(pagePixels(672, 2.55));
  expect(pagePixels(1344, 2.55)).toBeCloseTo(2 * pagePixels(672, 2.55), 5);
});

/**
 * A closed book is one page, not a spread, so the camera sits on the page while the book
 * is shut and drifts to the spine as the first sheet turns; from then on it stays there.
 */
test('the camera drifts from the page to the spine over the first turn', () => {
  expect(cameraX(0, false)).toBeCloseTo(PW / 2);
  expect(cameraX(0.5, false)).toBeCloseTo(PW / 4);
  expect(cameraX(1, false)).toBe(0);
  expect(cameraX(3, false)).toBe(0);
});

/**
 * One page at a time — the phone — is always centred on the page, which is the right
 * one: the turned-back sheet is not drawn there, so there is nothing to the left to look at.
 */
test('on a single page the camera never leaves the page', () => {
  expect(cameraX(0, true)).toBeCloseTo(PW / 2);
  expect(cameraX(1, true)).toBeCloseTo(PW / 2);
  expect(cameraX(4.5, true)).toBeCloseTo(PW / 2);
});

/** jsdom has no WebGL, so the renderer declines — with the section's options as without. */
test('without WebGL the renderer declines, whatever it is asked for', () => {
  const canvas = document.createElement('canvas');
  expect(createBook(canvas)).toBeNull();
  expect(createBook(canvas, { faces: [], single: true, alpha: true, dist: 2.35 })).toBeNull();
});
