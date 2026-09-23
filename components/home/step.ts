'use client';

import gsap from 'gsap';
import { STEPS } from './tide';

/**
 * The sea holds once, on the navy, and then it is the visitor's.
 *
 * The owner asked first for the four fields to be stepped, one gesture each (2026-09-22), then
 * for that to happen «only once, like when you scroll down — after that … much much more
 * free-flowing», then for the arrival itself: «lock the first one — when you see the navy, lock
 * it … it ends up somewhere between the blue and the burgundy, so it doesn't lock there, and it
 * becomes almost a limbo». And then, standing on the navy and giving it a nudge: «I just scroll a
 * bit and it moves a lot more than to navy.» Asked which of three behaviours they meant, they
 * chose: the navy is the only thing that locks, and from there the four scroll like any other
 * section.
 *
 * So this is all that is left of the stepping, and it is the whole of it: coming down the page,
 * the first time the sea is reached, the page is brought to rest ON the navy — however hard the
 * scroll that brought it there. After that nothing is taken and nothing is nudged, for the rest
 * of the visit; the tide simply follows the scroll, as it did before any of this.
 *
 * Nothing here takes a gesture, and nothing here can: a wheel event is cancelable only if a
 * non-passive listener was registered when the GESTURE began, and a scroll that starts up in the
 * hero is already the compositor's by the time the sea reaches the screen — measured on the built
 * page, every one of a real streamed gesture's 46 events arrives `cancelable: false`, and a drive
 * started under one is killed in its first frame by the scroll still running. That was the
 * «limbo». So the page is never fought: it is let go where it likes, and once it has been still
 * for a moment it is brought home.
 */

/** Where the act reaches down the page: the scroll of its first field and of its last. */
export type Span = { start: number; end: number };

/** The pull onto the navy. The owner's second: at half of it, «way too fast». */
export const HOME = 960;
/** A scroll is over once the page has been this still. */
export const IDLE = 140;
/** Within this of a field (a step is a screen, so a fiftieth is a dozen pixels), the page is standing on it. */
export const ON = 0.02;
/** How often the act looks at where the page has got to. */
export const TICK = 100;

/**
 * Drives the window to `y` over `ms`, and lets go of it the moment anything else takes it — a
 * key, a hand on the scrollbar, another drive. (The page is written every frame, so every
 * argument would be won otherwise; two pixels of slack because the browser rounds.) An
 * interrupted drive is no loss: the act looks again on its next tick and starts another.
 */
function driveTo(y: number, ms: number, scrollTo: (y: number) => void): gsap.core.Tween {
  const at = { y: window.scrollY };
  let wrote = at.y;
  const drive = gsap.to(at, {
    y,
    duration: ms / 1000,
    ease: 'power2.inOut',
    onUpdate: () => {
      if (Math.abs(window.scrollY - wrote) > 2) return void drive.kill();
      scrollTo(at.y);
      wrote = window.scrollY;
    },
  });
  return drive;
}

/**
 * Brings the page to rest on the first field, once, on the way in. `span` says where the act
 * reaches (the ScrollTrigger's own start and end, so the two agree on every resize), `scrollTo`
 * writes the window's scroll, and `startedAbove` says whether the sea was still below the screen
 * when the section was hydrated — which is what tells an arrival from a position restored inside
 * the act, and is read there rather than here because ScrollTrigger arrives by a dynamic import
 * and a quick hand is already in the sea by the time it does. Returns the teardown.
 */
export function holdTheFirstField(span: () => Span | null, scrollTo: (y: number) => void, startedAbove: boolean): () => void {
  let drive: gsap.core.Tween | null = null;
  let moved = performance.now();
  let was = window.scrollY;
  let ticker = 0;
  /** The page has been above the act, so it is arriving at the sea rather than starting inside it. */
  let above = startedAbove;
  /** … and has stood on the first field, which is the one thing this waits for. */
  let arrived = false;

  const uAt = (s: Span) => ((window.scrollY - s.start) / (s.end - s.start)) * STEPS;
  /** The act has the screen while the page is inside its reach; a pixel of slack at each end, since the browser rounds. */
  const inside = (s: Span) => window.scrollY > s.start - 1 && window.scrollY < s.end + 1;

  /**
   * Every tenth of a second, for as long as the sea is on the page — its own clock, not the
   * scroll's, because a gesture that has ended makes no more scroll events and a drive cut short
   * would then never be started again. It waits for two things at once: the page inside the act,
   * and the page still. A field counts as stood on only while it is being stood on — read on
   * every scroll event instead, a flick FLIES THROUGH the navy and the arrival counts itself
   * made, which is how the navy came to be skipped.
   */
  const tick = () => {
    if (window.scrollY !== was) moved = performance.now();
    was = window.scrollY;
    const s = span();
    if (!s) return;
    if (window.scrollY <= s.start + 1) above = true;
    if (!inside(s) || drive?.isActive()) return;
    if (performance.now() - moved < IDLE) return;
    const u = uAt(s);
    if (Math.abs(u) < ON) {
      arrived = true;
      return;
    }
    if (!above || arrived) return;
    // A long haul — a flick that carried the page a field or two past the navy — is given more
    // time, so that it reads as a journey back and not as a blur.
    drive = driveTo(s.start, HOME * Math.min(1.8, Math.max(1, u)), scrollTo);
  };

  tick();
  ticker = window.setInterval(tick, TICK);
  return () => {
    window.clearInterval(ticker);
    drive?.kill();
  };
}
