import { expect, test } from 'vitest';
import { cameraX, createBook, PW } from './book';

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
