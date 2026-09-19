import { describe, expect, test } from 'vitest';
import { fitSize } from './fit';

describe('fitSize', () => {
  test('scales the probe to the width, a hair under it', () => {
    // 900px wide at 100px, in a 1350px box: 150px, times the slack
    expect(fitSize(900, 1350, 0, {})).toBeCloseTo(150 * 0.985, 3);
  });

  test('is capped by the height’s share, by max, and floored by min', () => {
    expect(fitSize(300, 1350, 768, { maxOfHeight: 0.5 })).toBe(384);
    expect(fitSize(900, 1350, 768, { max: 66 })).toBe(66);
    expect(fitSize(3000, 350, 0, { min: 30 })).toBe(30);
  });

  test('share fits to a fraction of the width', () => {
    expect(fitSize(900, 1350, 0, { share: 0.5 })).toBeCloseTo(75 * 0.985, 3);
  });
});
