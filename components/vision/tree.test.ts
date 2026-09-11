import { describe, expect, test } from 'vitest';
import { fit, generate, GROUND, TOP } from './tree';

describe('generate', () => {
  const model = generate();

  test('the trunk splits into exactly three limbs', () => {
    expect(model.segs.filter((s) => s.depth === 1)).toHaveLength(3);
    expect(model.segs[0].depth).toBe(0);
    expect(model.segs[0].parent).toBe(-1);
  });

  test('the canopy is full and balanced', () => {
    expect(model.tips.length).toBeGreaterThanOrEqual(30);
    expect(model.tips.length).toBeLessThanOrEqual(64);
    let minX = 0, maxX = 0;
    model.segs.forEach((s) => { minX = Math.min(minX, s.x1); maxX = Math.max(maxX, s.x1); });
    expect(Math.abs(minX + maxX) / (maxX - minX)).toBeLessThan(0.12);
  });

  test('the same seed gives the same tree', () => {
    const again = generate();
    expect(again.seed).toBe(model.seed);
    expect(again.segs.map((s) => s.x1)).toEqual(model.segs.map((s) => s.x1));
  });

  test('roots spread below the ground', () => {
    expect(model.rootSegs.length).toBeGreaterThan(4);
    model.rootSegs.forEach((s) => expect(s.y1).toBeGreaterThan(0));
  });
});

describe('fit', () => {
  const box = { W: 560, H: 700 };
  const fitted = fit(generate(), box);

  test('limb names are ordered left to right and sit inside the box', () => {
    expect(fitted.limbs).toHaveLength(3);
    expect(fitted.limbs[0].x).toBeLessThan(fitted.limbs[1].x);
    expect(fitted.limbs[1].x).toBeLessThan(fitted.limbs[2].x);
    fitted.limbs.forEach((l) => {
      expect(l.x).toBeGreaterThanOrEqual(40);
      expect(l.x).toBeLessThanOrEqual(box.W - 40);
      expect(l.y).toBeGreaterThanOrEqual(14);
      expect(l.y).toBeLessThanOrEqual(fitted.GY - 14);
    });
  });

  test('the canopy stays inside the box and the trunk ends at the ground line', () => {
    fitted.segs.forEach((s) => {
      expect(s.Y1).toBeGreaterThanOrEqual(fitted.TOPY - 1);
      expect(s.X1).toBeGreaterThanOrEqual(0);
      expect(s.X1).toBeLessThanOrEqual(box.W);
    });
    expect(fitted.segs[0].Y0).toBeCloseTo(fitted.GY, 5);
  });

  test('names arrive before growth is complete', () => {
    fitted.limbs.forEach((l) => expect(l.birth).toBeLessThan(3.0));
    expect(fitted.rootBirth).toBe(1.0);
  });

  test('the ground line and the crown top are the exported fractions', () => {
    expect(fitted.GY).toBeCloseTo(box.H * GROUND, 5);
    expect(fitted.TOPY).toBeCloseTo(box.H * TOP, 5);
  });
});
