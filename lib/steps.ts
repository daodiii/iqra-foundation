import type Lenis from 'lenis';
import type { VirtualScrollData } from 'lenis';
import { gestures, glide, next } from './carry';
import { setGestureHandler, smooth } from './smooth';

/*
 * Beats: scrolling that stops at the parts that matter and is free between them (the owner,
 * 2026-11-20: «a way for the scrolling to stop at certain important stuff … you get the full page
 * and then you can scroll fast again»). Adapted from the fixing-scroll-flow skill's steps.ts, without
 * GSAP.
 *
 * Each zone is an ordered run of scroll positions. Outside a zone nothing intervenes. Inside one, a
 * gesture moves the page one beat, as one continuous motion: the page follows the fingers, and as
 * their momentum fades it glides on to the next beat on a curve that leaves at the speed the page
 * already has and slows once, into the beat (carry.ts). The rest of that momentum is spent on the
 * glide; a new gesture moves on from wherever the page is. A mouse notch starts the glide at once.
 * Keys step through every beat and mark; a scrollbar drag settles on the nearest beat of its zone.
 * Everything is read from the provider on each move, so it follows resizes. It runs only where the
 * glide runs (lib/smooth.ts WHERE: a precise pointer, motion wanted); phones settle by their own
 * touch rule (touchSettle below).
 */

export interface Beats {
  zones: number[][];
  marks: number[];
}

const TOL = 40; /* beats closer than this merge; within this of a beat counts as standing on it */
const SNAP = 24; /* a zone reaches this far past its first and last beats */
const QUIET = 90; /* ms without input before a drag that simply stopped settles */
const TRICKLE = 180; /* px of a spent gesture's momentum swallowed after the glide has landed */
const HALF = 0.45; /* a new push the same way past this much of a glide asks for the next beat */
const SPIN = 300; /* px of notches more in a spent spin of the wheel that move on another beat */

/** Tidy a run of beats: in the page, sorted, near ones merged. */
export function clean(list: number[], max: number): number[] {
  const sorted = list
    .filter((y) => Number.isFinite(y))
    .map((y) => Math.min(Math.max(0, Math.round(y)), max))
    .sort((a, b) => a - b);
  const out: number[] = [];
  for (const y of sorted) if (!out.length || y - out[out.length - 1] > TOL) out.push(y);
  return out;
}

/** Start the beats on the page's glide; returns the stop. Does nothing where the glide does not run. */
export function steps(read: () => Beats): () => void {
  const lenis = smooth();
  if (!lenis) return () => {};
  let quiet = 0;
  let wasNative = false;

  const limit = () => document.documentElement.scrollHeight - window.innerHeight;
  const zones = () => read().zones.map((z) => clean(z, limit())).filter((z) => z.length > 1);
  const zoneAt = (y: number) => zones().find((z) => y >= z[0] - SNAP && y <= z[z.length - 1] + SNAP);
  const every = () => {
    const b = read();
    return clean([0, limit(), ...b.marks, ...b.zones.flat()], limit());
  };
  const nearest = (list: number[], y: number) => list.reduce((best, b) => (Math.abs(b - y) < Math.abs(best - y) ? b : best));

  /* The page's own speed in px/s, read each frame after the glide has moved it. */
  let speed = 0;
  let lastY = lenis.animatedScroll;
  let lastT = 0;
  let raf = 0;
  const sample = (now: number) => {
    raf = requestAnimationFrame(sample);
    const t = now / 1000;
    const y = lenis.animatedScroll;
    const dt = t - lastT;
    speed = lastT && dt > 0 && dt < 0.25 ? speed * 0.35 + ((y - lastY) / dt) * 0.65 : 0;
    lastY = y;
    lastT = t;
  };
  raf = requestAnimationFrame(sample);

  let flight: { to: number; dir: number; start: number; duration: number; spun: number } | null = null;
  let spent = -1;
  let trickle = 0;
  const go = (to: number | undefined, gesture = -1) => {
    if (to === undefined) return;
    spent = gesture;
    trickle = 0;
    const from = lenis.animatedScroll;
    const g = glide(to - from, speed);
    if (!g) {
      flight = null;
      if (to !== from) lenis.scrollTo(to, { immediate: true, force: true });
      return;
    }
    const f = { to, dir: Math.sign(to - from), start: performance.now(), duration: g.duration, spun: 0 };
    flight = f;
    lenis.scrollTo(to, {
      duration: g.duration,
      easing: g.ease,
      force: true,
      onComplete: () => {
        if (flight === f) flight = null;
      },
    });
  };
  /* The glide, if it is still the one moving the page: a link or a jump may have taken over. */
  const flying = () => {
    if (flight && (lenis.isScrolling !== 'smooth' || performance.now() - flight.start > flight.duration * 1000 + 100)) flight = null;
    return flight;
  };
  const through = () => (flight ? (performance.now() - flight.start) / (flight.duration * 1000) : 1);
  const swallow = (event: Event) => {
    if (event.cancelable) event.preventDefault();
    return false;
  };

  const gesture = gestures();
  setGestureHandler(({ deltaX, deltaY, event }: VirtualScrollData) => {
    if (event.type.startsWith('touch') || (event as WheelEvent).ctrlKey || !deltaY || lenis.isStopped) return true;
    if (Math.abs(deltaX) > Math.abs(deltaY)) return true;
    const g = gesture(event.timeStamp || performance.now(), deltaY);
    window.clearTimeout(quiet);
    flying();

    /* The gesture the glide took its speed from: its momentum is spent. A long spin of the wheel
       asks for another beat; after landing a little more trickles in, then it is free. */
    if (g.id === spent) {
      if (flight) {
        if (g.notch && g.dir === flight.dir && (flight.spun += Math.abs(deltaY)) >= SPIN && through() > 0.3) {
          const z = zoneAt(flight.to);
          go(z && next(z, flight.to, g.dir), g.id);
        }
        return swallow(event);
      }
      if ((trickle += Math.abs(deltaY)) <= TRICKLE) return swallow(event);
      spent = -1;
    }

    /* A new gesture while gliding: the same way, past half way, one beat further; the other way,
       back to the beat behind. */
    if (flight) {
      const z = zoneAt(flight.to) ?? zoneAt(lenis.animatedScroll);
      if (g.dir === flight.dir) {
        const to = z && through() >= HALF ? next(z, flight.to, g.dir) : undefined;
        if (to !== undefined) go(to, g.id);
        else spent = g.id;
        return swallow(event);
      }
      const back = z && next(z, lenis.animatedScroll, g.dir);
      if (back !== undefined) {
        go(back, g.id);
        return swallow(event);
      }
      flight = null;
      return true;
    }

    const z = zoneAt(lenis.targetScroll + deltaY) ?? zoneAt(lenis.animatedScroll);
    if (!z) return true;
    /* A notch is the whole wish at once; fingers are followed until their momentum fades. */
    if (g.notch || (g.fading >= 3 && g.n >= 4)) {
      // every beat is a stop here, however hard the flick (the skill's landing() would carry a fast
      // page past the next one): each stop is a page the owner wants seen
      const to = next(z, lenis.animatedScroll, g.dir);
      if (to !== undefined) {
        go(to, g.id);
        return swallow(event);
      }
      if (g.notch) return true;
    }
    /* A drag that simply stops: once quiet, settle from wherever it is. */
    const id = g.id;
    quiet = window.setTimeout(() => {
      if (flying() || spent === id) return;
      const zone = zoneAt(lenis.targetScroll);
      if (!zone) return;
      const y = lenis.targetScroll;
      const near = nearest(zone, y);
      go(Math.abs(near - y) <= SNAP ? near : (next(zone, lenis.animatedScroll, g.dir) ?? near), id);
    }, QUIET);
    return true;
  });

  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || lenis.isStopped) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
    if (e.key === ' ' && t && /^(a|button)$/i.test(t.tagName)) return;
    const f = flying();
    const held = e.repeat && f && through() < HALF;
    const y = f ? f.to : lenis.scroll;
    let to: number | undefined;
    switch (e.key) {
      case 'ArrowDown':
      case 'PageDown':
        to = next(every(), y, 1, TOL);
        break;
      case 'ArrowUp':
      case 'PageUp':
        to = next(every(), y, -1, TOL);
        break;
      case ' ':
        to = next(every(), y, e.shiftKey ? -1 : 1, TOL);
        break;
      case 'Home':
        to = 0;
        break;
      case 'End':
        to = limit();
        break;
      default:
        return;
    }
    e.preventDefault();
    if (held) return;
    window.clearTimeout(quiet);
    go(to);
  };
  window.addEventListener('keydown', onKey);

  /* A scrollbar drag is native to the glide; it reports it clear 400 ms after it stops: settle then. */
  const onScroll = (l: Lenis) => {
    if (l.isScrolling === 'native') wasNative = true;
    else if (l.isScrolling === false && wasNative) {
      wasNative = false;
      const zone = zoneAt(l.scroll);
      if (!zone) return;
      const b = nearest(zone, l.scroll);
      if (Math.abs(b - l.scroll) > TOL) go(b);
    }
  };
  lenis.on('scroll', onScroll);

  return () => {
    window.clearTimeout(quiet);
    cancelAnimationFrame(raf);
    setGestureHandler(null);
    window.removeEventListener('keydown', onKey);
    lenis.off('scroll', onScroll);
    flight = null;
    spent = -1;
  };
}

/** Where a touch scroll that came to rest at `y`, having started at `from`, goes on to: the next beat in its direction, inside a zone, not at its ends. */
export function touchTarget(y: number, from: number, zones: number[][]): number | undefined {
  const zone = zones.find((z) => z.length > 1 && y > z[0] + 2 && y < z[z.length - 1] - 2);
  const dir = Math.sign(y - from);
  return zone && dir ? next(zone, y, dir, 1) : undefined;
}

/**
 * On a touch screen (native scrolling), once a swipe and its fling have come to rest inside a zone,
 * glide on to the next beat in the direction the page was moving, so nothing rests half way. At a
 * zone's ends, or with no beat ahead, it stays, so the reader can always swipe on out. Returns the stop.
 */
export function touchSettle(read: () => number[][]): () => void {
  if (!window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  let from = window.scrollY;
  let finger = false;
  let timer = 0;
  const rest = () => {
    if (finger) return;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const to = touchTarget(
      y,
      from,
      read().map((z) => clean(z, max)),
    );
    from = to ?? y;
    if (to !== undefined && Math.abs(to - y) > 2) window.scrollTo({ top: to, behavior: 'smooth' });
  };
  const onScroll = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(rest, 150);
  };
  const down = () => {
    finger = true;
    from = window.scrollY;
  };
  const up = () => {
    finger = false;
    onScroll();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('touchstart', down, { passive: true });
  window.addEventListener('touchend', up, { passive: true });
  window.addEventListener('touchcancel', up, { passive: true });
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('touchstart', down);
    window.removeEventListener('touchend', up);
    window.removeEventListener('touchcancel', up);
  };
}
