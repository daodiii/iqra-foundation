import { describe, expect, test } from 'vitest';
import { nextStop, ON, STEP } from './step';
import { STEPS } from './tide';

describe('nextStop', () => {
  test('standing on a field, a gesture goes to the next one along — a whole step, either way', () => {
    expect(nextStop(0, 1)).toBe(1);
    expect(nextStop(1, 1)).toBe(2);
    expect(nextStop(2, 1)).toBe(3);
    expect(nextStop(3, -1)).toBe(2);
    expect(nextStop(1, -1)).toBe(0);
  });

  test('a page the browser rounded a hair off a field is standing on it', () => {
    expect(nextStop(0.999, 1)).toBe(2);
    expect(nextStop(1.001, -1)).toBe(0);
    expect(nextStop(2 - ON / 2, 1)).toBe(3);
  });

  test('stranded between two fields, it finishes the step the way it is going', () => {
    expect(nextStop(0.4, 1)).toBe(1);
    expect(nextStop(0.4, -1)).toBe(0);
    expect(nextStop(2.6, 1)).toBe(3);
    expect(nextStop(2.6, -1)).toBe(2);
  });

  test('at the two ends the act is over and the page has its scroll back', () => {
    expect(nextStop(0, -1)).toBeNull();
    expect(nextStop(STEPS, 1)).toBeNull();
    expect(nextStop(STEPS + 0.5, 1)).toBeNull();
    expect(nextStop(-0.5, -1)).toBeNull();
  });

  test('never past either end, and never more than one step from where it is', () => {
    for (let u = 0; u <= STEPS; u += 0.05) {
      for (const dir of [1, -1] as const) {
        const to = nextStop(u, dir);
        if (to === null) continue;
        expect(to).toBeGreaterThanOrEqual(0);
        expect(to).toBeLessThanOrEqual(STEPS);
        expect(Number.isInteger(to)).toBe(true);
        expect(Math.abs(to - u)).toBeLessThanOrEqual(1 + ON);
        expect(Math.sign(to - u)).toBe(dir);
      }
    }
  });

  test('the step takes the second the owner settled on — half the speed of the first build', () => {
    expect(STEP).toBeGreaterThanOrEqual(800);
    expect(STEP).toBeLessThanOrEqual(1200);
  });
});
