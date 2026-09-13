import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { afterEach, expect, test, vi } from 'vitest';

/*
 * The settle in gsap.ts is not a function to call: it is a `gsap.delayedCall(0.6, …)` made
 * when the module loads, and one frame after it fires it walks `ScrollTrigger.getAll()`. So
 * the module is imported here only after a spy on `delayedCall` is up, its callback is taken
 * off the spy — the real tween is killed so it cannot fire a second time on its own — and
 * each test hands it the frame itself.
 */
const delayed = vi.spyOn(gsap, 'delayedCall');
const { ACT_SNAP } = await import('./gsap');
const at = delayed.mock.calls.findIndex(([delay]) => delay === 0.6);
const settle = delayed.mock.calls[at][1] as () => void;
delayed.mock.results[at].value.kill();
delayed.mockRestore();

/**
 * Runs `fn` and returns the one animation frame it asked for, without waiting for it. The
 * stub lives only as long as `fn`: GSAP's ticker re-reads `requestAnimationFrame` whenever
 * it wakes, and a stub left in place could hand back the ticker's own tick instead.
 */
const frameAskedBy = (fn: () => void): FrameRequestCallback => {
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
  try { fn(); } finally { vi.unstubAllGlobals(); }
  expect(frames).toHaveLength(1);
  return frames[0];
};

/** A pinned act as the settle finds it, its trigger reduced to what the settle reads. */
const act = (progress: number, getTween: () => unknown) =>
  ({ vars: { snap: ACT_SNAP }, isActive: true, direction: 1, progress, start: 0, end: 1000, getTween }) as unknown as ScrollTrigger;

afterEach(() => vi.restoreAllMocks());

/*
 * `getTween(true)` is declared to return a Tween and does not always: ScrollTrigger writes the
 * number 0 into that slot when a snap tween completes, and again when the wheel interrupts one
 * (`getTween.tween = 0` in `_getTweenCreator`). `0?.isActive()` is not a skip, it is a
 * TypeError — `?.` only guards null and undefined. Reproduced 2026-09-13 at 1440×900: a scroll
 * to 1.5 screens right after load let the hero's own snap finish before the settle ran.
 */
test('an act whose snap has already finished — getTween(true) is 0, not a tween — does not throw', () => {
  vi.spyOn(ScrollTrigger, 'getAll').mockReturnValue([act(1, () => 0)]);
  const frame = frameAskedBy(settle);
  expect(() => frame(0)).not.toThrow();
});

test('and 0 means no snap is running, so a stranded act is still driven home', () => {
  vi.spyOn(ScrollTrigger, 'getAll').mockReturnValue([act(0.95, () => 0)]);
  const to = vi.spyOn(gsap, 'to');
  frameAskedBy(settle)(0);
  expect(to).toHaveBeenCalledOnce();
  expect(to.mock.calls[0][1]).toMatchObject({ y: 1000, duration: ACT_SNAP.duration.max });
  to.mock.results[0].value.kill();
});
