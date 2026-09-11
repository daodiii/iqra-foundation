import { describe, expect, test } from 'vitest';
import { CROWN, desktopArch, desktopStage, makePath, phoneArch, phoneStage } from './arch';
import { TOP } from './tree';

const near = (a: [number, number], b: [number, number], tol = 0.5) => {
  expect(Math.hypot(a[0] - b[0], a[1] - b[1]), `${a} is not near ${b}`).toBeLessThan(tol);
};

describe('makePath', () => {
  // A leg, a half circle, a leg: the phone's arch in miniature.
  const path = makePath([
    { type: 'line', x0: 0, y0: 100, x1: 0, y1: 50 },
    { type: 'arc', cx: 50, cy: 50, r: 50, a0: Math.PI, a1: 2 * Math.PI },
    { type: 'line', x0: 100, y0: 50, x1: 100, y1: 100 },
  ]);

  test('its length is the segments added up', () => {
    expect(path.length).toBeCloseTo(50 + Math.PI * 50 + 50, 6);
  });

  test('walks by length from the first point to the last', () => {
    near(path.pointAt(0), [0, 100]);
    near(path.pointAt(50 / path.length), [0, 50]);
    near(path.pointAt(0.5), [50, 0]);
    near(path.pointAt(1), [100, 100]);
  });

  test('clamps outside 0..1', () => {
    near(path.pointAt(-1), [0, 100]);
    near(path.pointAt(2), [100, 100]);
  });
});

describe('desktopArch', () => {
  const W = 1272, H = 776;
  const arch = desktopArch(W, H);

  test('the circle passes through the apex and both feet', () => {
    expect(arch.apex).toBeCloseTo(H * 0.1, 6);
    expect(arch.cy - arch.r).toBeCloseTo(H * 0.1, 6);
    expect(Math.hypot(W * 0.055 - arch.cx, H - arch.cy)).toBeCloseTo(arch.r, 6);
    expect(Math.hypot(W * 0.945 - arch.cx, H - arch.cy)).toBeCloseTo(arch.r, 6);
  });

  test('the pen starts at the left foot, crosses the apex, ends at the right foot', () => {
    near(arch.path.pointAt(0), [W * 0.055, H]);
    near(arch.path.pointAt(0.5), [W / 2, H * 0.1]);
    near(arch.path.pointAt(1), [W * 0.945, H]);
  });

  test('the opening is inside the circle and above the floor', () => {
    expect(arch.contains(W / 2, H / 2)).toBe(true);
    expect(arch.contains(W * 0.055 + 30, H - 5)).toBe(true);
    expect(arch.contains(W / 2, H * 0.1 - 2)).toBe(false);
    expect(arch.contains(20, H - 2)).toBe(false);
    expect(arch.contains(W / 2, H + 2)).toBe(false);
  });

  test('the cards surface left, then top, then right, symmetrically', () => {
    const [l, t, r] = arch.surfaces(H * 0.45);
    expect(l).toBeGreaterThan(0);
    expect(l).toBeLessThan(t);
    expect(t).toBe(0.5);
    expect(r).toBeGreaterThan(t);
    expect(r).toBeLessThan(1);
    expect(l + r).toBeCloseTo(1, 6);
  });

  test('a wide, short box still draws the arc over the top and not under the floor', () => {
    // A 1440×700 window: the feet sit above the circle's centre, and the raw angle of the
    // left foot is negative. The mock added 2π to the right foot only, and its arc went
    // the long way round — under the floor.
    const a = desktopArch(1272, 604);
    expect(a.cy).toBeGreaterThan(604);
    near(a.path.pointAt(0.5), [636, 60.4]);
    expect(a.path.length).toBeLessThan(Math.PI * a.r);
    near(a.path.pointAt(0), [1272 * 0.055, 604]);
    near(a.path.pointAt(1), [1272 * 0.945, 604]);
  });
});

describe('phoneArch', () => {
  // A Pixel 7's arch area: the box is 10px in from each side, the area 70svh tall.
  const W = 371, H = 591;
  const arch = phoneArch(W, H);

  test('a half circle on two legs, as wide as the area allows', () => {
    expect(arch.r).toBeCloseTo((W - 36) / 2, 6);
    expect(arch.apex).toBe(96);
    expect(arch.cy).toBeCloseTo(96 + arch.r, 6);
    expect(arch.path.length).toBeCloseTo(2 * (H - arch.cy) + Math.PI * arch.r, 6);
    near(arch.path.pointAt(0), [18, H]);
    near(arch.path.pointAt(0.5), [W / 2, 96]);
    near(arch.path.pointAt(1), [W - 18, H]);
  });

  test('the opening is the legs and the half circle, not the corners above it', () => {
    expect(arch.contains(W / 2, H - 10)).toBe(true);
    expect(arch.contains(30, H - 10)).toBe(true);
    expect(arch.contains(W / 2, 100)).toBe(true);
    expect(arch.contains(22, 100)).toBe(false);
    expect(arch.contains(W / 2, 90)).toBe(false);
    expect(arch.contains(W / 2, H + 1)).toBe(false);
  });

  test('the cards surface at fixed points: they stand below the arch', () => {
    expect(arch.surfaces(0)).toEqual([0.3, 0.55, 0.8]);
  });

  test('held sideways, the arc is lowered so the legs still exist', () => {
    const a = phoneArch(802, 273);
    expect(a.r).toBe(273 - 96 - 40);
    expect(a.cy).toBeLessThanOrEqual(273 - 40);
    expect(a.contains(802 / 2, 273 - 5)).toBe(true);
  });
});

describe('the stages', () => {
  test('desktop: the bottom at 0.95H, the crown starting 14px under the top card', () => {
    const s = desktopStage(1272, 776, 216, 540);
    expect(s.top + s.height).toBeCloseTo(776 * 0.95, 6);
    expect(s.top + TOP * s.height).toBeCloseTo(216 + 14, 6);
    expect(s.width).toBe(800);
    expect(s.left).toBe(236);
  });

  test('desktop: a narrow column caps the height and keeps the bottom', () => {
    const s = desktopStage(971, 776, 216, 300);
    expect(s.height).toBeCloseTo((300 - 24) / CROWN, 6);
    expect(s.top + s.height).toBeCloseTo(776 * 0.95, 6);
  });

  test('desktop: a box narrower than 800 gets a stage as wide as the box, and no negative height', () => {
    expect(desktopStage(600, 500, 200, 100).width).toBe(600);
    expect(desktopStage(0, 0, 0, 0).height).toBe(0);
  });

  test('phone: sized to the arch, centred in the room under the apex', () => {
    const arch = phoneArch(371, 591);
    const s = phoneStage(arch, 371, 591);
    const room = 591 - 36 - (96 + 26);
    expect(s.height).toBeCloseTo(Math.min((2 * arch.r - 24) / CROWN, room), 6);
    expect(s.top).toBeCloseTo(96 + 26 + (room - s.height) / 2, 6);
    expect(s.width).toBe(371);
    expect(s.left).toBe(0);
  });
});
