import gsap from 'gsap';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { holdTheFirstField, IDLE, TICK } from './step';

/**
 * The hold, at the level the browser cannot be made to show: whether the page was ARRIVING at the
 * sea or opened inside it. A restored scroll cannot be driven from Playwright — neither a reload
 * nor a scroll before hydration reproduces it — so the contract is read here instead: the drive is
 * asked for, or it is not.
 */

const SPAN = { start: 1000, end: 4000 };
const span = () => SPAN;
const scrollTo = vi.fn();

/** Put the window where a scroll would have left it. */
function at(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true });
}

/** Long enough for the act's clock to tick and to count the page as still. */
const settleDown = () => new Promise((r) => setTimeout(r, IDLE + TICK * 3));

/** Every drive the act asked for, by the scroll it aimed at. It asks again each tick while the page has not got there — the mock never moves it, so more than one is right. */
let drives: number[];
let stop: (() => void) | null = null;

beforeEach(() => {
  drives = [];
  scrollTo.mockClear();
  vi.spyOn(gsap, 'to').mockImplementation(((_t: unknown, vars: { y: number }) => {
    drives.push(vars.y);
    return { isActive: () => false, kill: () => {} };
  }) as unknown as typeof gsap.to);
});

afterEach(() => {
  stop?.();
  stop = null;
  vi.restoreAllMocks();
});

describe('the hold on the first field', () => {
  test('a page arriving from above and coming to rest inside the sea is driven to the first field', async () => {
    at(SPAN.start + 400);
    stop = holdTheFirstField(span, scrollTo, true);
    await settleDown();
    expect(drives.length).toBeGreaterThan(0);
    expect(drives.every((y) => y === SPAN.start)).toBe(true);
  });

  test('a page that opened inside the sea is left where it is — a restored scroll is not hauled to the top', async () => {
    at(SPAN.start + 1500);
    stop = holdTheFirstField(span, scrollTo, false);
    await settleDown();
    expect(drives).toEqual([]);
  });

  test('the hold is spent once the page has stood on the first field: after that the sea is the visitor’s', async () => {
    at(SPAN.start);
    stop = holdTheFirstField(span, scrollTo, true);
    await settleDown();
    expect(drives).toEqual([]);
    // and now, off the field and still: nothing
    at(SPAN.start + 600);
    await settleDown();
    expect(drives).toEqual([]);
  });

  test('a page above the sea, or below it, is not the act’s business', async () => {
    at(SPAN.start - 300);
    stop = holdTheFirstField(span, scrollTo, true);
    await settleDown();
    expect(drives).toEqual([]);
    stop();
    at(SPAN.end + 300);
    stop = holdTheFirstField(span, scrollTo, true);
    await settleDown();
    expect(drives).toEqual([]);
  });

  test('nothing is driven while the page is still moving', async () => {
    at(SPAN.start + 400);
    stop = holdTheFirstField(span, scrollTo, true);
    for (let i = 0; i < 4; i++) {
      at(SPAN.start + 400 + i * 50);
      await new Promise((r) => setTimeout(r, TICK));
    }
    expect(drives).toEqual([]);
    await settleDown();
    expect(drives.length).toBeGreaterThan(0);
    expect(drives.every((y) => y === SPAN.start)).toBe(true);
  });
});
