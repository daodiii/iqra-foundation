import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/*
 * Lenis itself is not under test here — the e2e drives the real one in a real browser. What is
 * under test is the wiring round it: where it runs, who is told when the page moves, how a
 * name's scroll is carried, and that an open menu holds the page. So it is stood in for by a
 * class that records what it was asked.
 */
const made: FakeLenis[] = [];
class FakeLenis {
  options: Record<string, unknown>;
  animatedScroll = 0;
  isStopped = false;
  destroyed = false;
  scrolls: { y: number; opts: { duration?: number; easing?: (u: number) => number } }[] = [];
  private handlers: (() => void)[] = [];
  constructor(options: Record<string, unknown>) {
    this.options = options;
    document.documentElement.classList.add('lenis');
    made.push(this);
  }
  on(_: 'scroll', fn: () => void) {
    this.handlers.push(fn);
    return () => {};
  }
  emit() {
    this.handlers.forEach((fn) => fn());
  }
  scrollTo(y: number, opts: FakeLenis['scrolls'][number]['opts'] = {}) {
    this.scrolls.push({ y, opts });
  }
  stop() {
    this.isStopped = true;
  }
  start() {
    this.isStopped = false;
  }
  destroy() {
    this.destroyed = true;
    document.documentElement.classList.remove('lenis');
  }
}
vi.mock('lenis', () => ({ default: FakeLenis }));

const { glideFor, hermite, LERP, onScroll, scrollToY, smooth, startSmooth, WHERE } = await import('./smooth');

/** matchMedia answering `true` for the queries in `yes`, as the setup's stub answers false for all. */
function media(yes: string[]) {
  const listeners: (() => void)[] = [];
  window.matchMedia = ((query: string) => ({
    matches: yes.includes(query),
    media: query,
    onchange: null,
    addEventListener: (_: string, fn: () => void) => listeners.push(fn),
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
const realMatchMedia = window.matchMedia;
let stop: (() => void) | null = null;
beforeEach(() => {
  made.length = 0;
});
afterEach(() => {
  stop?.();
  stop = null;
  window.matchMedia = realMatchMedia;
  delete document.body.dataset.scrollLocked;
  vi.restoreAllMocks();
});

const slope = (f: (u: number) => number, u: number) => (f(u + 1e-5) - f(u)) / 1e-5;

test('the curve runs from 0 to 1, leaving at slope m and arriving at rest', () => {
  for (const m of [-1.2, 0, 0.8, 1.5, 2.4, 3]) {
    const f = hermite(m);
    expect(f(0)).toBe(0);
    expect(Math.abs(f(1) - 1)).toBeLessThan(1e-12);
    expect(Math.abs(slope(f, 0) - m)).toBeLessThan(1e-3);
    expect(Math.abs(slope(f, 1 - 1e-5))).toBeLessThan(1e-3);
  }
});

test('the curve never turns back on its way for a start slope from 0 to 3', () => {
  for (const m of [0, 1, 2, 2.4, 3]) {
    const f = hermite(m);
    for (let u = 0; u < 1; u += 0.01) expect(f(u + 0.01)).toBeGreaterThanOrEqual(f(u) - 1e-12);
  }
});

test('from rest a glide takes longer the further it goes, within bounds, easing in and out', () => {
  const short = glideFor(200, 0)!;
  const page = glideFor(1000, 0)!;
  const long = glideFor(5000, 0)!;
  expect(short.duration).toBeGreaterThanOrEqual(0.55);
  expect(short.duration).toBeLessThan(page.duration);
  expect(page.duration).toBeGreaterThan(0.9);
  expect(page.duration).toBeLessThan(1.1);
  expect(long.duration).toBe(1.25);
  expect(page.m).toBe(0);
});

test('a glide leaves at the speed the page already has, whichever way it is going', () => {
  for (const [distance, speed] of [
    [900, 800],
    [-900, -800],
    [1200, 300],
  ]) {
    const g = glideFor(distance, speed)!;
    expect(Math.abs((slope(g.ease, 0) * distance) / g.duration - speed)).toBeLessThan(2);
  }
});

test('arriving fast with little room left, the glide is shorter but still leaves at that speed', () => {
  const g = glideFor(150, 1500)!;
  expect(g.m).toBeGreaterThanOrEqual(2.4);
  expect(g.m).toBeLessThanOrEqual(3);
  expect(g.duration).toBeLessThan(0.55);
  expect(Math.abs((slope(g.ease, 0) * 150) / g.duration - 1500)).toBeLessThan(2);
});

test('moving away from where it is sent, the glide turns back without a long detour', () => {
  const g = glideFor(1000, -1500)!;
  expect(g.m).toBe(-1.2);
  let low = 0;
  for (let u = 0; u <= 1; u += 0.01) low = Math.min(low, g.ease(u));
  expect(low).toBeGreaterThan(-0.08);
});

test('no distance, no glide', () => {
  expect(glideFor(0, 500)).toBeNull();
  expect(glideFor(0.4, 0)).toBeNull();
});

test('a phone, or a visitor who asked for less motion, keeps the browser’s own scroll', () => {
  media([]);
  stop = startSmooth();
  expect(made).toHaveLength(0);
  expect(smooth()).toBeNull();
  expect(document.documentElement.classList.contains('lenis')).toBe(false);
});

test('a touchpad, a TrackPoint or a mouse gets the glide, at the named weight, and it goes when the page does', () => {
  media([WHERE]);
  stop = startSmooth();
  expect(made).toHaveLength(1);
  expect(smooth()).toBe(made[0]);
  expect(made[0].options).toMatchObject({ lerp: LERP, smoothWheel: true, syncTouch: false });
  expect((window as unknown as { __lenis?: unknown }).__lenis).toBe(made[0]);
  stop();
  stop = null;
  expect(made[0].destroyed).toBe(true);
  expect(smooth()).toBeNull();
  expect((window as unknown as { __lenis?: unknown }).__lenis).toBeUndefined();
});

test('without the glide, whoever listens is told by the window’s scroll', () => {
  media([]);
  stop = startSmooth();
  const told = vi.fn();
  const off = onScroll(told);
  window.dispatchEvent(new Event('scroll'));
  expect(told).toHaveBeenCalledTimes(1);
  off();
  window.dispatchEvent(new Event('scroll'));
  expect(told).toHaveBeenCalledTimes(1);
});

test('with the glide, whoever listens is told by the glide, in the frame it moved the page — and once, not twice', () => {
  media([WHERE]);
  stop = startSmooth();
  const told = vi.fn();
  const off = onScroll(told);
  made[0].emit();
  expect(told).toHaveBeenCalledTimes(1);
  // The browser's own scroll event for the same move comes a frame later: already told.
  window.dispatchEvent(new Event('scroll'));
  expect(told).toHaveBeenCalledTimes(1);
  off();
});

test('a name’s scroll is carried by the glide when it runs, eased in and out from rest', () => {
  media([WHERE]);
  stop = startSmooth();
  made[0].animatedScroll = 400;
  scrollToY(1400);
  expect(made[0].scrolls).toHaveLength(1);
  const { y, opts } = made[0].scrolls[0];
  expect(y).toBe(1400);
  expect(opts.duration).toBeCloseTo(glideFor(1000, 0)!.duration, 5);
  expect(opts.easing!(0.5)).toBeCloseTo(0.5, 5);
});

test('without the glide a name’s scroll is the browser’s own smooth scroll, and at once under reduced motion', () => {
  const to = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  media([]);
  scrollToY(900);
  expect(to).toHaveBeenLastCalledWith({ top: 900, behavior: 'smooth' });
  media(['(prefers-reduced-motion: reduce)']);
  scrollToY(300);
  expect(to).toHaveBeenLastCalledWith({ top: 300, behavior: 'auto' });
});

test('an open menu holds the page still, and closing it lets the glide go on', async () => {
  media([WHERE]);
  stop = startSmooth();
  document.body.dataset.scrollLocked = '';
  await vi.waitFor(() => expect(made[0].isStopped).toBe(true));
  delete document.body.dataset.scrollLocked;
  await vi.waitFor(() => expect(made[0].isStopped).toBe(false));
});
