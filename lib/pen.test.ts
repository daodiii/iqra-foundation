import { describe, expect, test } from 'vitest';
import { framePath, legendGap, LEGEND_ROOM } from './pen';

const near = (a: [number, number], b: [number, number], tol = 0.5) => {
  expect(Math.hypot(a[0] - b[0], a[1] - b[1]), `${a} is not near ${b}`).toBeLessThan(tol);
};

describe('framePath', () => {
  const W = 300, H = 200, r = 10;
  const straight = 2 * (W - 2 * r) + 2 * (H - 2 * r);
  const corners = 2 * Math.PI * r;

  test('with a gap: the perimeter less the gap, starting after the legend and ending before it', () => {
    const path = framePath(W, H, r, { from: 40, to: 120 });
    expect(path.length).toBeCloseTo(straight + corners - (120 - 40), 4);
    near(path.pointAt(0), [120, 0]);
    near(path.pointAt(1), [40, 0]);
  });

  test('goes clockwise: the right side comes before the bottom, and the bottom edge is whole', () => {
    const path = framePath(W, H, r, { from: 40, to: 120 });
    // the top edge from 120 to 290, then the arc, then the right side: its middle is on the path
    const toRightMid = (W - r - 120) + (Math.PI * r) / 2 + (H / 2 - r);
    near(path.pointAt(toRightMid / path.length), [W, H / 2]);
    // no gap on the bottom edge — a button sits over it, the line running on beneath
    const toBottomMid = toRightMid + (H / 2 - r) + (Math.PI * r) / 2 + (W / 2 - r);
    near(path.pointAt(toBottomMid / path.length), [W / 2, H]);
  });

  test('without a gap: closed, starting where the top-left arc ends', () => {
    const path = framePath(W, H, r);
    expect(path.length).toBeCloseTo(straight + corners, 4);
    near(path.pointAt(0), [r, 0]);
    near(path.pointAt(1), [r, 0]);
  });
});

describe('legendGap', () => {
  test('is the legend’s box in the card’s coordinates with room either side', () => {
    const card = { left: 100, top: 50, right: 450, bottom: 250, width: 350, height: 200, x: 100, y: 50, toJSON() {} } as DOMRect;
    const legend = { left: 130, top: 37, right: 210, bottom: 63, width: 80, height: 26, x: 130, y: 37, toJSON() {} } as DOMRect;
    expect(legendGap(card, legend)).toEqual({ from: 30 - LEGEND_ROOM, to: 110 + LEGEND_ROOM });
  });
});
