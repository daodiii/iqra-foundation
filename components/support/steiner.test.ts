import { describe, expect, test } from 'vitest';
import { drop, pose, scene } from './steiner';

describe('Grunnmuren’s stones', () => {
  test('five stones, three faces each; the viewBox holds every point of them at rest, with room above for the landing', () => {
    const s = scene();
    expect(s.stones).toHaveLength(5);
    for (const st of s.stones) expect(st.faces).toHaveLength(3);
    const [x, y, w, h] = s.viewBox.split(' ').map(Number);
    const all = [...s.ground, ...s.stones.flatMap((st) => [...st.faces.flatMap((f) => f.pts), ...st.shadow, ...st.edge])];
    for (const [px, py] of all) {
      expect(px).toBeGreaterThanOrEqual(x);
      expect(px).toBeLessThanOrEqual(x + w);
      expect(py).toBeGreaterThanOrEqual(y + 59);
      expect(py).toBeLessThanOrEqual(y + h);
    }
  });

  test('one stone per step: none at the start, all settled and lit at the end, in order', () => {
    for (let i = 0; i < 5; i++) {
      expect(pose(drop(0, i))).toMatchObject({ o: 0, lit: false });
      const end = pose(drop(1, i));
      expect(end).toMatchObject({ o: 1, lit: true });
      expect(Math.abs(end.dy)).toBeLessThan(1e-9);
      expect(end.ss).toBeCloseTo(1);
    }
    expect(drop(0.3, 0)).toBeGreaterThan(drop(0.3, 1));
  });

  test('the landing overshoots a little below its place before it settles (back-out)', () => {
    const dys = Array.from({ length: 101 }, (_, j) => pose(j / 100).dy);
    expect(Math.max(...dys)).toBeGreaterThan(0);
    expect(Math.max(...dys)).toBeLessThan(620 * 0.2);
  });
});
