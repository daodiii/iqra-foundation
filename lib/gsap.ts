import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** The site's whole motion vocabulary (spec section 3). */
export const EASE = { out: 'expo.out', inOut: 'power2.inOut', none: 'none', in2: 'power2.in', in1: 'power1.inOut' } as const;
export const DUR = { s: 0.3, m: 0.6, l: 0.7 } as const;

export function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * How a pinned act settles: it finishes what you started, and otherwise leaves you alone.
 *
 * Two things here are not obvious, and both were measured on 2026-09-09.
 *
 * The value GSAP hands `snapTo` is where your velocity is PROJECTED to land, not where you
 * are. Testing the dead zone against it meant a hard flick anywhere in the middle
 * projected past 0.88 and got snapped to the end — the hero jumped from 44% to 100%. So
 * the zone is judged on `self.progress`, the trigger's real position, and returning that
 * unchanged is the no-op that leaves the middle of an act alone.
 *
 * Each end zone pulls only the way you are already going: forward to 1 near the end, back
 * to 0 near the start. A zone that pulled both ways would fight you — wheeling gently
 * forward into the first 12% asked to be snapped back to 0, which is not a rescue. GSAP's
 * `directional` flag will not do this for us: it vetoes a backward snap rather than
 * declining to snap, and that veto flung the hero from 8% to 73%. So direction is read off
 * the trigger and `directional` is off.
 */
export const ACT_SNAP = {
  snapTo: (projected: number, self?: { direction: number; progress: number }) => {
    const at = self?.progress ?? projected;
    return (self?.direction ?? 1) > 0
      ? (at > 0.88 ? 1 : at)
      : (at < 0.12 ? 0 : at);
  },
  duration: { min: 0.15, max: 0.5 },
  delay: 0.08,
  ease: EASE.in1,
  directional: false,
} as const;

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  ScrollTrigger.config({ ignoreMobileResize: true });
  /*
   * Wheel and touch scrolling is handled off the main thread, so the scroll position and a
   * scrubbed animation drift apart in small increments — which is what makes a pinned
   * section feel stepped rather than fluid. This puts scrolling on rAF so the two stay in
   * step. It costs no bytes: `normalizeScroll` is part of ScrollTrigger.
   *
   * It takes over scrolling, so it also reaches things that have nothing to do with a pin:
   * `Support.tsx` scrolls a route into view with `behavior: 'smooth'`, and the header's
   * `/#stott-oss` link is a native anchor jump. Both are covered by e2e.
   */
  if (!reducedMotion()) ScrollTrigger.normalizeScroll(true);

  /*
   * The snap is deaf for the first half second of its life. Settle the one act that can be
   * caught by it, once, by hand.
   *
   * `snapDelayedCall` — the thing that eventually settles a stranded act — is scheduled from
   * one place in the normal run of events, `self.update()` at ScrollTrigger.js:1744, and
   * that line is guarded on `!_startup`. `_startup` is cleared by a `delayedCall(0.5)` set
   * up inside `ScrollTrigger.enable()`, which `registerPlugin` above ran synchronously
   * (`register()` calls `enable()` on the spot when there is a document). So the clock
   * started a few lines up, on this same ticker, and 0.6 is reliably after it.
   *
   * Which matters because that half second is the moment a landing page gets scrolled.
   * Measured on 2026-09-09 with this block removed: a scroll coming to rest at 95% of the
   * hero's pin was left there — 1710 of 1800 on desktop, 1594 of 1678 on a Pixel 7 —
   * whenever it landed roughly 350ms to 600ms after navigation. From 730ms on it settled by
   * itself. `ACT_SNAP` was written for exactly that rescue and never got the chance to run.
   *
   * The obvious repairs are both worse than the bug, and were measured being so. Asking
   * ScrollTrigger to have another look — `refresh()`, or a run of `update()`s — re-arms the
   * snap but also wakes its scroll memory, and the position it remembers is the one from
   * before the visitor scrolled: parked at 87% of the hero, a Pixel 7 was thrown back to
   * 144 of 1678 by a refresh, and a desktop was walked from 1566 all the way to 0 by the
   * updates. So nothing here touches ScrollTrigger's own machinery. It reads the same
   * policy object the triggers were given, and where that policy says an act is stranded it
   * drives the scroll home itself — which is also what the hero does for its opening.
   */
  gsap.delayedCall(0.6, () => {
    const before = window.scrollY;
    requestAnimationFrame(() => {
      // Still moving? Then ScrollTrigger is awake and its own snap will collect them.
      if (window.scrollY !== before) return;
      const toScroll = ScrollTrigger.getScrollFunc(window);
      for (const st of ScrollTrigger.getAll()) {
        const snap = st.vars.snap as typeof ACT_SNAP | undefined;
        if (!snap || !st.isActive || st.getTween(true)?.isActive()) continue;
        const to = snap.snapTo(st.progress, st);
        if (Math.abs(to - st.progress) < 0.001) continue; // the middle of an act: leave it alone
        const at = { y: window.scrollY };
        gsap.to(at, {
          y: st.start + to * (st.end - st.start),
          duration: ACT_SNAP.duration.max,
          ease: ACT_SNAP.ease,
          onUpdate: () => toScroll(at.y),
        });
      }
    });
  });
}

export { gsap, ScrollTrigger, useGSAP };
