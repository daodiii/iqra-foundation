import { describe, expect, test } from 'vitest';
import { areas } from './areas';
import { groundAt, seaAt, settle, STEPS } from './tide';

const at = (progress: number, direction: 1 | -1) => settle(progress, { progress, direction });

describe('settle', () => {
  test('three steps between the four fields, and the stage is built for exactly that', () => {
    expect(STEPS).toBe(3);
    expect(STEPS).toBe(areas.length - 1);
  });

  test('forward, anything past an eighth of a step completes it; short of that, it returns', () => {
    expect(at(0.3, 1)).toBeCloseTo(1 / 3, 10); // 0.9 of a step in
    expect(at(0.05, 1)).toBeCloseTo(1 / 3, 10); // 0.15 of a step: past the eighth
    expect(at(0.03, 1)).toBe(0); // 0.09 of a step: not yet
    expect(at(0.7, 1)).toBeCloseTo(2 / 3, 10); // 2.1 steps: a tenth into the third, back to two
    expect(at(0.75, 1)).toBe(1); // 2.25 steps: on to the last
  });

  test('back, anything short of seven eighths returns; past it, the step is kept', () => {
    expect(at(0.2, -1)).toBe(0); // 0.6 of a step, going back
    expect(at(0.6, -1)).toBeCloseTo(1 / 3, 10); // 1.8 steps, going back
    expect(at(0.96, -1)).toBe(1); // 2.88: within the last eighth of the third step, kept
  });

  test('always a whole step, never past either end', () => {
    for (let p = 0; p <= 1; p += 0.01) {
      for (const dir of [1, -1] as const) {
        const s = at(p, dir);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(1);
        expect(Math.abs(s * STEPS - Math.round(s * STEPS))).toBeLessThan(1e-9);
      }
    }
  });

  test('without a trigger it hands back what it was given', () => {
    expect(settle(0.42)).toBe(0.42);
  });
});

describe('seaAt', () => {
  test('at the first field: the first floor alone, its words up and live, the others down', () => {
    const f = seaAt(0);
    expect(f.i).toBe(0);
    expect(f.t).toBe(0);
    expect(f.words.map((w) => w.on)).toEqual([1, 0, 0, 0]);
    expect(f.words.map((w) => w.live)).toEqual([true, false, false, false]);
  });

  test('halfway between two fields the tide is halfway across and no words are on the water', () => {
    const f = seaAt(0.5);
    expect(f.i).toBe(0);
    expect(f.t).toBe(0.5);
    expect(f.words.every((w) => w.on === 0 && !w.live)).toBe(true);
  });

  test('a field’s words rise over the last three tenths of its tide and are up at its stop', () => {
    const f = seaAt(2.4);
    expect(f.i).toBe(2);
    expect(f.t).toBeCloseTo(0.4, 10);
    expect(f.words[2].on).toBeCloseTo(1 / 3, 10);
    expect(f.words[2].live).toBe(true);
    expect(seaAt(1).words[1].on).toBe(1);
  });

  test('at the last field the tide has come all the way in from the third', () => {
    const f = seaAt(3);
    expect(f.i).toBe(2);
    expect(f.t).toBe(1);
    expect(f.words[3]).toEqual({ on: 1, live: true });
  });

  test('two fields’ words never share the water', () => {
    for (let u = 0; u <= 3; u += 0.01) {
      expect(seaAt(u).words.filter((w) => w.on > 0).length).toBeLessThanOrEqual(1);
    }
  });
});

describe('groundAt', () => {
  test('the CSS ground is the next area’s token over the current one’s, the tide as a percentage', () => {
    expect(groundAt(0)).toBe('color-mix(in srgb, var(--color-area-dialog) 0.0%, var(--color-area-kunnskap))');
    expect(groundAt(1.25)).toBe('color-mix(in srgb, var(--color-area-moteplasser) 25.0%, var(--color-area-dialog))');
    expect(groundAt(3)).toBe('color-mix(in srgb, var(--color-area-samfunnsdeltakelse) 100.0%, var(--color-area-moteplasser))');
  });
});
