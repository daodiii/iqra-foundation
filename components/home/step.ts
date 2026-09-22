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
 * (Sea.tsx) and the scroll is this drive.
 *
 * ONCE, AND ONLY DOWNWARDS. The owner again, having lived with it: «make it that it's only
 * once, like when you scroll down — after that, if you try to scroll up and down, it's a
 * lot easier and much much more free-flowing … when you scroll back up, make it
 * different». So the steps are the way IN: they hold on the first way down and nowhere
 * else. A gesture upwards is never taken, and once the last field has been reached the act
 * lets go of the page for the rest of the visit — no steps and no settle, the sea scrolled
 * like any tall section, the tide simply following the scroll. Nothing is taken twice.
 *
 * AND THE FIRST FIELD IS A LOCK. The owner, on the built page: «lock the first one — when
 * you see the navy, lock it … when I try to scroll fast it ends up somewhere between the
 * blue and the burgundy, so it doesn't lock there, and it becomes almost a limbo where you
 * have to scroll and it looks a bit weird. After the first, lock it, and then you can
 * scroll easier.» So until the page has stood on the first field, anything that comes to
 * rest inside the act is driven back to it, whichever way it was going. Arriving at the sea
 * means arriving on the navy; everything else follows from there.
 *
 * A GESTURE THAT BEGAN OUTSIDE THE ACT CANNOT BE TAKEN, AND IS NOT FOUGHT. Measured on the
 * built page with a real streamed gesture (CDP's scroll synthesiser, not a burst of discrete
 * notches): every one of its 46 wheel events arrives `cancelable: false`. Chrome hands a
 * scroll to the compositor once the gesture is under way, and from then on the page may
 * watch but not refuse — so a flick that starts up in the hero owns the scroll for its whole
 * life, and the sea cannot step it. Calling `preventDefault` on those events does nothing,
 * and a drive started under one is killed in its first frame by the scroll still running;
 * that was the limbo — the page left between two fields with nothing to collect it, because
 * the retry was scheduled by scroll events and the gesture had finished making any.
 *
 * So: a wheel event that cannot be cancelled is left entirely alone, and the landing is what
 * answers it. The landing is a watchdog rather than a timer — while the act holds the screen
 * it looks every tenth of a second, and whenever the page has been still for a moment and is
 * not on a field it drives to the one the rules ask for, again and again until it lands.
 * Being still is the only thing it waits for, so an interrupted drive is simply retried.
 *
 * While the steps do hold, everything that is not a gesture — a key, the scrollbar, a
 * restored position — is left alone and then settled onto a field once it has been still
 * for a moment (`settle`, the rule since 2026-09-17), and that too only downwards: a page
 * pulled back to the field it had just left would be the opposite of free. It replaces
 * ScrollTrigger's own snap, which is where this used to live, and with it the half second
 * at boot when that snap is deaf and a stranded act had to be rescued by hand.
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
export function takeTheSteps(el: HTMLElement, span: () => Span | null, scrollTo: (y: number) => void, startedAbove: boolean): () => void {
  let drive: gsap.core.Tween | null = null;
  let restUntil = 0;
  /** The last event of the gesture in hand. */
  let last = 0;
  /** When the page last moved, and the watchdog that lands it once it has been still. */
  let moved = performance.now();
  let watchdog = 0;
  let was = window.scrollY;
  /** Whose the touch in hand is: nobody's yet, ours (a step), or the page's (it is leaving the act). */
  let hold: 'open' | 'ours' | 'theirs' = 'open';
  let from = 0;
  let gripped = false;
  /** Which way the page was last going, for the rule that finishes the step it started. */
  let dirOfTravel = 1;
  /** The four have been stepped through: the sea is free for the rest of the visit. */
  let done = false;
  /**
   * The page has been above the act, so it is arriving at the sea rather than starting inside it
   * — a restored scroll is not hauled to the top. Its first answer comes from the moment the
   * section was hydrated, not from this driver's own first look: ScrollTrigger arrives by a
   * dynamic import, and a visitor who scrolls the instant the page opens is already in the sea
   * by the time it does, which read as «started inside» and let the navy be skipped.
   */
  let above = startedAbove;
  /** … and has stood on the first field, which is what the arrival locks onto. */
  let arrived = false;

  /** Coming in fast, the page is carried back to the first field until it has stood on it. */
  const locking = (u: number) => above && !arrived && !done && u > ON;

  const busy = () => !!drive?.isActive() || performance.now() < restUntil;
  const posOf = (s: Span, k: number) => s.start + ((s.end - s.start) * k) / STEPS;
  const uAt = (s: Span) => ((window.scrollY - s.start) / (s.end - s.start)) * STEPS;
  /** The act has the screen while the page is inside its reach; a pixel of slack at each end, since the browser rounds. */
  const inside = (s: Span) => window.scrollY > s.start - 1 && window.scrollY < s.end + 1;

  const go = (s: Span, dir: number) => {
    const lock = locking(uAt(s));
    // A gesture made from a field, in the ordinary way, is a visitor in control: the navy has
    // been seen and the arrival is made. (Without this, a step taken within a moment of landing
    // on the navy — before the watchdog had noticed the page standing there — was hauled back to
    // it by the lock, which is the opposite of the point.)
    if (!lock) arrived = true;
    const to = lock ? 0 : nextStop(uAt(s), dir);
    if (to === null) return;
    drive?.kill();
    drive = driveTo(posOf(s, to), STEP, scrollTo);
    drive.eventCallback('onComplete', () => { restUntil = performance.now() + REST; });
  };

  const onWheel = (e: WheelEvent) => {
    const s = span();
    if (!s || !inside(s) || done) return;
    // A gesture that began before the act had the screen is the browser's: its events cannot be
    // refused (`cancelable: false`), and fighting one leaves the page stranded. The landing takes it.
    if (!e.cancelable) return;
    // Down is the way in and the only way that steps; up is the visitor's own, always —
    // except while the arrival is still owed, when either way is answered with the navy.
    const dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
    if (!dir || (dir < 0 && !locking(uAt(s)))) return;
    const now = performance.now();
    // A gesture of its own: nothing of ours is running, and either the last one has been over
    // a moment (a flick's tail is still the flick) or the wheel has simply kept turning.
    const fresh = !busy() && (now - last >= QUIET || now - restUntil >= HOLD);
    const to = nextStop(uAt(s), dir);
    // The act is over the way you are going and this is a gesture: the page takes it from here.
    if (to === null && fresh) return;
    last = now;
    e.preventDefault();
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
    if (!s || !inside(s) || done) return;
    if (hold === 'ours') {
      if (e.cancelable) e.preventDefault();
      return;
    }
    const dy = from - (e.touches[0]?.clientY ?? from);
    if (!dy) return;
    const dir = dy > 0 ? 1 : -1;
    // A thumb carrying the page back up is its own; only the way in steps.
    if (dir < 0 || nextStop(uAt(s), dir) === null) {
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

  /**
   * The landing. Every tenth of a second while the act holds the screen: if the page has been
   * still for a moment and is not standing on a field, drive it to the one the rules ask for —
   * the navy while the arrival is owed, otherwise the field that finishes the step it was
   * making. It asks again next tick, so a drive cut short by a scroll that was still running
   * is simply started again; and it asks nothing at all while the page is moving, so it never
   * fights a hand.
   */
  /**
   * Where a page at `u` should come to rest, or null to leave it alone: the navy while the
   * arrival is owed; nothing once the four have been seen, or when it is already standing on
   * a field, or when it was going back up, the way back being the visitor's own; otherwise
   * the field that finishes the step it was making.
   */
  const restingPlace = (u: number): number | null => {
    if (locking(u)) return 0;
    if (done || Math.abs(u - Math.round(u)) < ON || dirOfTravel < 0) return null;
    return settle(u / STEPS, { progress: u / STEPS, direction: 1 }) * STEPS;
  };

  const land = () => {
    const s = span();
    if (!s || !inside(s) || busy()) return;
    if (performance.now() - moved < IDLE) return;
    const u = uAt(s);
    /*
     * STOOD ON, not passed through. Both of these used to be read on every scroll event, and a
     * flick from the hero flies through the navy at speed — so the arrival counted itself made
     * and the lock never fired (measured on the built page: a gesture of 1400 px came to rest
     * on the second field, one of 2200 px on the third). A field has been stood on only if the
     * page is still standing on it, which is what this watchdog has already waited for; and the
     * way in is over only for a page that began it on the navy.
     */
    if (Math.abs(u) < ON) arrived = true;
    if (arrived && u >= STEPS - ON) done = true;
    const to = restingPlace(u);
    if (to === null || Math.abs(to - u) < ON) return;
    // A long haul — a flick that carried the page fields past the navy — is given more time, so
    // that it reads as a journey back and not as a blur.
    drive = driveTo(posOf(s, to), STEP * Math.min(1.8, Math.max(1, Math.abs(to - u))), scrollTo);
  };

  /** Whether the act has the screen and still steps, and which way the page is going. */
  const watch = () => {
    const s = span();
    // The direction is the last real movement's, kept until the page moves again: read on every
    // tick instead, a page standing still compares equal to itself and reads as going DOWN — so
    // the settle finished a step the visitor had just scrolled back from, and the way up was not
    // free after all.
    if (window.scrollY !== was) {
      moved = performance.now();
      dirOfTravel = window.scrollY > was ? 1 : -1;
    }
    was = window.scrollY;
    // Above the act: the page is arriving at the sea rather than starting inside it.
    if (s && window.scrollY <= s.start + 1) above = true;
    if (s && inside(s) && !done) grip();
    else release();
  };

  /*
   * The act's own clock. It was the scroll's before, and a page that never scrolled again was
   * never looked at: the trigger measures itself a moment after the driver is made, so a
   * visitor already standing on the first field was not seen to be standing there, and a
   * drive cut short had nothing to start it again. A tenth of a second, for as long as the
   * sea is on the page.
   */
  const tick = () => {
    watch();
    land();
  };
  tick();
  watchdog = window.setInterval(tick, 100);
  window.addEventListener('scroll', watch, { passive: true });
  window.addEventListener('resize', watch);
  return () => {
    release();
    window.clearInterval(watchdog);
    window.removeEventListener('scroll', watch);
    window.removeEventListener('resize', watch);
    drive?.kill();
  };
}
