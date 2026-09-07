import { expect, test } from 'vitest';
import { maskOrigin } from './maskOrigin';

test('origin is the centre of the first glyph box at the word middle', () => {
  expect(maskOrigin({ start: 170, end: 250, bbY: 180, bbHeight: 220 })).toBe('210 290');
});

test('fractional measurements are kept, not rounded', () => {
  expect(maskOrigin({ start: 170.5, end: 250.5, bbY: 100, bbHeight: 50 })).toBe('210.5 125');
});

test('a zero-width glyph box still yields its own x', () => {
  expect(maskOrigin({ start: 40, end: 40, bbY: 0, bbHeight: 10 })).toBe('40 5');
});
