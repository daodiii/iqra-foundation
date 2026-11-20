/**
 * Grunnmuren's five stones (mock 30), drawn in isometric: three side by side on the ground, two
 * laid on top across the joints. Pure geometry, computed once at render, so the SVG and its
 * viewBox come from the server whole: without JavaScript (and under reduced motion) the
 * foundation stands built.
 *
 * The viewBox is taken from the points themselves, at rest. The mock measured the group with
 * getBBox, which counts the children's CSS transforms (the drop offset) and had to switch them
 * off first; here there is nothing to measure.
 */

/** Each stone's faces, top / left / right: the brand's navy, teal, burgundy, turquoise, pale teal. */
export const STONES = [
  ['#2a3f6b', '#1b2a4a', '#13213a'],
  ['#2f8f8c', '#21716f', '#185553'],
  ['#a63556', '#8c2340', '#6e1a32'],
  ['#8fd3d1', '#67c1bf', '#4aa3a1'],
  ['#eef7f7', '#cee9e8', '#a9d4d2'],
] as const;

const W = 150;
const D = 150;
const H = 74;
const PLACE: [number, number, number][] = [
  [0, 0, 0],
  [W, 0, 0],
  [2 * W, 0, 0],
  [W * 0.5, 0, H],
  [W * 1.5, 0, H],
];

type P3 = [number, number, number];
const P = ([x, y, z]: P3): [number, number] => [(x - y) * 0.866, (x + y) * 0.5 - z];

export type Stone = { faces: { fill: string; pts: [number, number][] }[]; edge: [number, number][]; shadow: [number, number][] };

export type Scene = { ground: [number, number][]; stones: Stone[]; viewBox: string };

export const pts = (a: [number, number][]) => a.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');

export function scene(): Scene {
  const ground = ([[-40, -40, 0], [3 * W + 40, -40, 0], [3 * W + 40, D + 40, 0], [-40, D + 40, 0]] as P3[]).map(P);
  const stones = PLACE.map(([x, y, z], i): Stone => {
    const [top, left, right] = STONES[i];
    const face = (fill: string, f: P3[]) => ({ fill, pts: f.map(P) });
    return {
      faces: [
        face(left, [[x, y + D, z], [x + W, y + D, z], [x + W, y + D, z + H], [x, y + D, z + H]]),
        face(right, [[x + W, y, z], [x + W, y + D, z], [x + W, y + D, z + H], [x + W, y, z + H]]),
        face(top, [[x, y, z + H], [x + W, y, z + H], [x + W, y + D, z + H], [x, y + D, z + H]]),
      ],
      edge: ([[x, y + D, z + H], [x + W, y + D, z + H], [x + W, y, z + H]] as P3[]).map(P),
      shadow: ([[x, y, z], [x + W, y, z], [x + W, y + D, z], [x, y + D, z]] as P3[]).map(P),
    };
  });
  const all = [...ground, ...stones.flatMap((s) => [...s.faces.flatMap((f) => f.pts), ...s.shadow])];
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const bx = Math.min(...xs);
  const by = Math.min(...ys);
  const bw = Math.max(...xs) - bx;
  const bh = Math.max(...ys) - by;
  const pad = 30;
  // as the mock: 30 on the sides and the foot, 60 above
  const viewBox = [bx - pad, by - 60, bw + 2 * pad, bh + 60 + pad].map((v) => v.toFixed(0)).join(' ');
  return { ground, stones, viewBox };
}

const cl = (v: number) => Math.min(1, Math.max(0, v));
/** Ease out, cubic. */
export const ez = (t: number) => 1 - Math.pow(1 - t, 3);
/** The stone's landing: it overshoots a little and settles back. */
export const backOut = (t: number) => {
  const c = 1.25;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

/** How far stone `i` has dropped at the pin's progress `k` (0..1): one stone per step of the scroll, as in the mock. */
export const drop = (k: number, i: number) => cl((k * 5.8 - i - 0.15) / 0.8);

/** A stone's state at drop `t`: its offset above its place, whether it shows, and its shadow's size and strength. */
export function pose(t: number) {
  const e = t === 0 ? 0 : backOut(t);
  return { dy: (1 - e) * -620, o: t > 0 ? 1 : 0, ss: 0.25 + 0.75 * ez(t), so: ez(t) * 0.5, lit: t > 0.75 };
}
