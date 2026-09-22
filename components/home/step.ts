'use client';

import gsap from 'gsap';
import { settle, STEPS } from './tide';

/**
 * One gesture, one field. The owner, 2026-09-22, on the live page: «if you scroll a little
 * or a lot you should just go to the next one, stop, go to the next one, stop … and it
 * should go pretty fast … in like half a second it goes to the next one» — and then, having
 * tried that half second: «way too fast. maybe half the speed».
 *
 * So the four fields are not scrolled through any more, they are stepped: while the sea
 * holds the screen, a wheel notch, a flick of the trackpad or a swipe of a thumb — a
 * little or a lot, it makes no difference — moves the page exactly one field and stops
 * there, and the tide crosses in that second, because the tide is written from the scroll
 * (Sea.tsx) and the scroll is this drive. The gesture is taken off the page for as
 * long as the act holds it and handed straight back at the two ends: below the first field
 * and past the last one the page scrolls as it always did.
 *
 * Everything else that moves a page — a key, the scrollbar, a restored position, a link —
 * is left alone and then settled: once it has been still for a moment, a position between
 * two fields finishes the step it started (`settle`, the rule since 2026-09-17). That
 * replaces ScrollTrigger's own snap, which is where this used to live, and with it the
 * half second at boot when that snap is deaf and a stranded act had to be rescued by hand.
 */

/** Where the act reaches down the page: the scroll of its first field and of its last. */
export type Span = { start: number; end: number };

/**
 * The travel from one field to the next. Half the speed the owner first saw (480 ms, their
 * «half a second», which they read as way too fast): the tide has a second to cross, and a
 * field a second to arrive in.
 */
export const STEP = 960;
/** The rest after it lands, before a new gesture is taken. */
export const REST = 90;
/**
 * A gesture is over once nothing has come for this long. A trackpad's flick and a wheel
 * spun hard keep sending for a while after the hand has finished, and all of it is the one
 * gesture — so it is swallowed, and «a lot» is one field, like «a little».
 */
export const QUIET = 90;
/**
 * Except that a hand which simply keeps scrolling is not one gesture for ever: once the
 * step has been standing this long with the wheel still turning, the next field is taken.
 * A flick's tail has died well inside it; holding the wheel down walks the fields at about
 * a second each, which is «go to the next one, stop, go to the next one, stop».
 */
export const HOLD = 420;
/** A thumb has gone this far before it is a swipe and not a tap. */
export const SWIPE = 16;
/** A scroll that is nobody's gesture is settled once it has been this still. */
export const IDLE = 140;
/** Within this of a field (a step is a screen, so a fiftieth is a dozen pixels), the page is standing on it. */
export const ON = 0.02;

/**
 * The field a gesture goes to from `u`, or null where the act is over and the page should
 * have its scroll back: standing on a field it is the next one along, and stranded between
 * two it is the one ahead in that direction — so a gesture always finishes a whole step,
 * never a part of one.
 */
export function nextStop(u: number, dir: number): number | null {
  const near = Math.round(u);
  const on = Math.abs(u - near) < ON;
  const to = dir > 0 ? (on ? near + 1 : Math.ceil(u)) : (on ? near - 1 : Math.floor(u));
  return to < 0 || to > STEPS ? null : to;
}

/**
 * Drives the window to `y` over `ms`, and lets go of it the moment anything else takes it
 * — a key, a hand on the scrollbar, another drive. (The page is written every frame, so
 * every argument would be won otherwise; two pixels of slack because the browser rounds.)
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
 * Takes the gesture over for as long as the act holds the screen. `span` says where the act
 * reaches (the ScrollTrigger's own start and end, so the two agree on every resize),
 * `scrollTo` writes the window's scroll. Returns the teardown.
 *
 * The wheel is listened for on the window, not on the stage: it is the page that scrolls,
 * and a cursor resting on the header — outside the stage, fixed above it — would otherwise
 * scroll straight past the act (measured, 2026-09-22: the wheel at the screen's corner went
 * four fields at a stroke). It is not listened for all the time either, since a listener
 * that can cancel a wheel makes the browser wait for it on every notch of the page: it is
 * taken when the act reaches the screen and given back when it leaves. A thumb is taken on
 * the stage itself, which is the whole screen for exactly as long.
 */
export function takeTheSteps(el: HTMLElement, span: () => Span | null, scrollTo: (y: number) => void): () => void {
  let drive: gsap.core.Tween | null = null;
  let restUntil = 0;
  /** The last event of the gesture in hand. */
  let last = 0;
  let idle = 0;
  let was = window.scrollY;
  /** Whose the touch in hand is: nobody's yet, ours (a step), or the page's (it is leaving the act). */
  let hold: 'open' | 'ours' | 'theirs' = 'open';
  let from = 0;
  let gripped = false;

  const busy = () => !!drive?.isActive() || performance.now() < restUntil;
  const posOf = (s: Span, k: number) => s.start + ((s.end - s.start) * k) / STEPS;
  const uAt = (s: Span) => ((window.scrollY - s.start) / (s.end - s.start)) * STEPS;
  /** The act has the screen while the page is inside its reach; a pixel of slack at each end, since the browser rounds. */
  const inside = (s: Span) => window.scrollY > s.start - 1 && window.scrollY < s.end + 1;

  const go = (s: Span, dir: number) => {
    const to = nextStop(uAt(s), dir);
    if (to === null) return;
    drive?.kill();
    drive = driveTo(posOf(s, to), STEP, scrollTo);
    drive.eventCallback('onComplete', () => { restUntil = performance.now() + REST; });
  };

  const onWheel = (e: WheelEvent) => {
    const s = span();
    if (!s || !inside(s)) return;
    const dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
    if (!dir) return;
    const now = performance.now();
    // A gesture of its own: nothing of ours is running, and either the last one has been over
    // a moment (a flick's tail is still the flick) or the wheel has simply kept turning.
    const fresh = !busy() && (now - last >= QUIET || now - restUntil >= HOLD);
    const to = nextStop(uAt(s), dir);
    // The act is over the way you are going and this is a gesture: the page takes it from here.
    if (to === null && fresh) return;
    last = now;
    if (e.cancelable) e.preventDefault();
    // Past the last field or under the first, the tail of the gesture that brought you there is
    // swallowed, so a hard flick stops on the field and it is the next gesture that leaves.
    if (to === null || !fresh) return;
    go(s, dir);
  };

  const onTouchStart = (e: TouchEvent) => {
    from = e.touches[0]?.clientY ?? 0;
    hold = 'open';
  };

  /**
   * The first move of a thumb decides the gesture, and it has to: once the browser has
   * begun a scroll of its own, the moves after it are no longer cancelable. So a move with
   * any direction at all is taken off the page straight away (a few pixels, nothing is
   * seen), and only once the thumb has really travelled does the field step — so a tap on a
   * field's link never steps, and the tap still reaches the link.
   */
  const onTouchMove = (e: TouchEvent) => {
    if (hold === 'theirs') return;
    const s = span();
    if (!s || !inside(s)) return;
    if (hold === 'ours') {
      if (e.cancelable) e.preventDefault();
      return;
    }
    const dy = from - (e.touches[0]?.clientY ?? from);
    if (!dy) return;
    const dir = dy > 0 ? 1 : -1;
    if (nextStop(uAt(s), dir) === null) {
      hold = 'theirs';
      return;
    }
    if (e.cancelable) e.preventDefault();
    if (Math.abs(dy) < SWIPE) return;
    hold = 'ours';
    last = performance.now();
    if (!busy()) go(s, dir);
  };

  const onTouchEnd = () => {
    hold = 'open';
    last = performance.now();
  };

  const grip = () => {
    if (gripped) return;
    gripped = true;
    window.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
  };

  const release = () => {
    if (!gripped) return;
    gripped = false;
    window.removeEventListener('wheel', onWheel);
    el.removeEventListener('touchstart', onTouchStart);
    el.removeEventListener('touchmove', onTouchMove);
    el.removeEventListener('touchend', onTouchEnd);
    el.removeEventListener('touchcancel', onTouchEnd);
  };

  /** Whether the act has the screen, and — for anything that moved the page without asking us — the settle. */
  const watch = () => {
    const s = span();
    const dir = window.scrollY >= was ? 1 : -1;
    was = window.scrollY;
    if (s && inside(s)) grip();
    else release();
    if (drive?.isActive()) return;
    window.clearTimeout(idle);
    idle = window.setTimeout(() => {
      const now = span();
      if (!now || !inside(now) || busy()) return;
      const u = uAt(now);
      if (Math.abs(u - Math.round(u)) < ON) return;
      const to = settle(u / STEPS, { progress: u / STEPS, direction: dir }) * STEPS;
      drive = driveTo(posOf(now, to), STEP, scrollTo);
    }, IDLE);
  };

  watch();
  window.addEventListener('scroll', watch, { passive: true });
  window.addEventListener('resize', watch);
  return () => {
    release();
    window.removeEventListener('scroll', watch);
    window.removeEventListener('resize', watch);
    window.clearTimeout(idle);
    drive?.kill();
  };
}
