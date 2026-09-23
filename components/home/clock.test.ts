import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { crossing, TIDE_MS, tideClock } from './clock';

/**
 * The clock on a controlled time: `now` is performance.now(), and `frame()` runs the pending
 * animation frame a sixtieth of a second later, the way the browser would.
 */
const FRAME = 1000 / 60;
let now = 0;
let pending: FrameRequestCallback | null = null;

beforeEach(() => {
  now = 1000;
  pending = null;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    pending = cb;
    return 1;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
    pending = null;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Runs the pending frame a sixtieth of a second on. False when none was pending. */
function frame(): boolean {
  const cb = pending;
  if (!cb) return false;
  pending = null;
  now += FRAME;
  cb(now);
  return true;
}

/** Frames until the clock asks for no more. */
function run() {
  let n = 0;
  while (n < 1000 && frame()) n++;
  return n;
}

/** No frame moves the playhead further than a crossing's fastest (1.5 fields per crossing) and some. */
function expectNoJump(writes: number[]) {
  for (let i = 1; i < writes.length; i++) expect(Math.abs(writes[i] - writes[i - 1])).toBeLessThan(0.06);
}

describe('tideClock', () => {
  test('the first frame is written at once: a clock whose first compare is against NaN never writes', () => {
    const writes: number[] = [];
    tideClock((u) => writes.push(u), 3, 2);
    expect(writes).toEqual([2]);
    expect(pending).toBeNull();
  });

  test('aimed one field on, it crosses in TIDE_MS and lands exactly on the field, never past it', () => {
    const writes: number[] = [];
    const clock = tideClock((u) => writes.push(u), 3, 0);
    const from = now;
    clock.aim(1);
    run();
    expect(crossing(1)).toBe(TIDE_MS);
    expect(writes.at(-1)).toBe(1);
    expect(Math.max(...writes)).toBe(1);
    for (let i = 1; i < writes.length; i++) expect(writes[i]).toBeGreaterThanOrEqual(writes[i - 1]);
    expect(now - from).toBeGreaterThanOrEqual(TIDE_MS);
    expect(now - from).toBeLessThanOrEqual(TIDE_MS + FRAME + 1e-6);
    expectNoJump(writes);
  });

  test('a tide aimed between two frames still lands exactly on its field, not a hair short', () => {
    const writes: number[] = [];
    const clock = tideClock((u) => writes.push(u), 3, 0);
    clock.aim(1);
    // The next tick lands almost a whole frame after the aim, so the frame before landing sits a
    // hair inside the crossing's last 1e-5 of ground: the phase a frame-boundary aim never hits.
    now += FRAME - 1;
    run();
    expect(writes.at(-1)).toBe(1);
  });

  test('asked on to the next field mid-tide, it keeps its speed (no stall at the new aim) and never goes back', () => {
    const writes: number[] = [];
    const clock = tideClock((u) => writes.push(u), 3, 0);
    clock.aim(1);
    for (let i = 0; i < 30; i++) frame();
    const before = writes.at(-1)! - writes.at(-2)!;
    clock.aim(2);
    frame();
    const after = writes.at(-1)! - writes.at(-2)!;
    expect(after).toBeGreaterThan(before * 0.8);
    run();
    expect(writes.at(-1)).toBe(2);
    expect(Math.max(...writes)).toBe(2);
    for (let i = 1; i < writes.length; i++) expect(writes[i]).toBeGreaterThanOrEqual(writes[i - 1]);
    expectNoJump(writes);
  });

  test('asked back mid-tide, it turns round without a jump and lands on the field it was asked for', () => {
    const writes: number[] = [];
    const clock = tideClock((u) => writes.push(u), 3, 1);
    clock.aim(2);
    for (let i = 0; i < 25; i++) frame();
    clock.aim(1);
    run();
    expect(writes.at(-1)).toBe(1);
    expect(Math.min(...writes)).toBe(1);
    expect(Math.max(...writes)).toBeLessThan(2);
    expectNoJump(writes);
  });

  test('a long way is quicker per field: three fields in one crossing of three, less than three crossings of one', () => {
    const writes: number[] = [];
    const clock = tideClock((u) => writes.push(u), 3, 0);
    const from = now;
    clock.aim(3);
    run();
    expect(writes.at(-1)).toBe(3);
    expect(now - from).toBeGreaterThanOrEqual(crossing(3));
    expect(now - from).toBeLessThanOrEqual(crossing(3) + FRAME + 1e-6);
    expect(crossing(3)).toBeLessThan(3 * TIDE_MS);
  });

  test('an aim at the field it already stands on does nothing', () => {
    const writes: number[] = [];
    const clock = tideClock((u) => writes.push(u), 3, 2);
    clock.aim(2);
    expect(pending).toBeNull();
    expect(writes).toEqual([2]);
  });

  test('stopped, it asks for no more frames and writes nothing more', () => {
    const writes: number[] = [];
    const clock = tideClock((u) => writes.push(u), 3, 0);
    clock.aim(1);
    frame();
    clock.stop();
    const n = writes.length;
    expect(frame()).toBe(false);
    expect(writes).toHaveLength(n);
  });
});
