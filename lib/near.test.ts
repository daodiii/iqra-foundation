import gsap from 'gsap';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { buildWhenQuietNear, PATIENCE, SCROLL_STILL } from './near';

/*
 * A controllable IntersectionObserver: the test decides when a canvas is «near». The
 * setup's stub never fires, which is right for the components and useless here.
 */
let observers: { cb: IntersectionObserverCallback; el: Element | null }[] = [];
class IO {
  cb: IntersectionObserverCallback; el: Element | null = null;
  constructor(cb: IntersectionObserverCallback) { this.cb = cb; observers.push(this); }
  observe(el: Element) { this.el = el; }
  unobserve() {} disconnect() { observers = observers.filter((o) => o !== this); } takeRecords() { return []; }
}
const near = () => { for (const o of [...observers]) o.cb([{ isIntersecting: true } as IntersectionObserverEntry], o as unknown as IntersectionObserver); };

let realIO: unknown;
beforeEach(() => {
  // `performance` too: the helper reads the clock, and a faked timer with a real clock
  // would see no time pass between checks.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance', 'requestAnimationFrame', 'cancelAnimationFrame'] });
  realIO = window.IntersectionObserver;
  Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: IO });
  observers = [];
});
afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: realIO });
  gsap.globalTimeline.clear();
});

test('near and quiet: the build runs on the next check, not in the observer callback', () => {
  const build = vi.fn();
  buildWhenQuietNear(document.createElement('canvas'), build);
  vi.advanceTimersByTime(SCROLL_STILL + 10);
  near();
  expect(build).not.toHaveBeenCalled();
  vi.advanceTimersByTime(120);
  expect(build).toHaveBeenCalledTimes(1);
});

test('a page still scrolling holds the build until the scroll has stopped', () => {
  const build = vi.fn();
  buildWhenQuietNear(document.createElement('canvas'), build);
  near();
  window.dispatchEvent(new Event('scroll'));
  vi.advanceTimersByTime(SCROLL_STILL - 50);
  expect(build).not.toHaveBeenCalled();
  vi.advanceTimersByTime(200);
  expect(build).toHaveBeenCalledTimes(1);
});

test('a running tween holds the build — an entrance is not the moment to compile shaders', () => {
  // GSAP's own ticker captured the real clock at import, so a real tween cannot be driven
  // by fake timers; what the helper asks the global timeline is stubbed instead.
  const running = { isActive: () => true } as unknown as gsap.core.Tween;
  const children = vi.spyOn(gsap.globalTimeline, 'getChildren').mockReturnValue([running]);
  const build = vi.fn();
  vi.advanceTimersByTime(SCROLL_STILL + 10);
  buildWhenQuietNear(document.createElement('canvas'), build);
  near();
  vi.advanceTimersByTime(400);
  expect(build).not.toHaveBeenCalled();
  children.mockReturnValue([]);
  vi.advanceTimersByTime(400);
  expect(build).toHaveBeenCalledTimes(1);
  children.mockRestore();
});

test('patience runs out: a page that is never quiet still gets its picture', () => {
  const build = vi.fn();
  buildWhenQuietNear(document.createElement('canvas'), build);
  near();
  const scroll = setInterval(() => window.dispatchEvent(new Event('scroll')), 100);
  vi.advanceTimersByTime(PATIENCE - 100);
  expect(build).not.toHaveBeenCalled();
  vi.advanceTimersByTime(300);
  expect(build).toHaveBeenCalledTimes(1);
  clearInterval(scroll);
});

test('cancelled before it built: nothing runs, even once the page is quiet', () => {
  const build = vi.fn();
  const cancel = buildWhenQuietNear(document.createElement('canvas'), build);
  near();
  cancel();
  vi.advanceTimersByTime(PATIENCE + 500);
  expect(build).not.toHaveBeenCalled();
});

test('reduced motion builds as soon as it is near: there are no entrances to protect', () => {
  const children = vi.spyOn(gsap.globalTimeline, 'getChildren').mockReturnValue([{ isActive: () => true } as unknown as gsap.core.Tween]);
  const build = vi.fn();
  buildWhenQuietNear(document.createElement('canvas'), build, { reduced: true });
  window.dispatchEvent(new Event('scroll'));
  near();
  expect(build).toHaveBeenCalledTimes(1);
  children.mockRestore();
});

test('no IntersectionObserver at all: build now rather than never', () => {
  Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: undefined });
  const build = vi.fn();
  buildWhenQuietNear(document.createElement('canvas'), build);
  expect(build).toHaveBeenCalledTimes(1);
});
