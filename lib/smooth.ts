import Lenis, { type VirtualScrollData } from 'lenis';
import { glide, hermite } from './carry';

/*
 * The page's glide (2026-09-25).
 *
 * The owner: «the flowiness of the website lacks a bit, it needs to be more smooth in the way it
 * scrolls». Measured at their own laptop's size and on its GPU (1536×960 at 125 %, Iris Xe, a
 * precision touchpad), the home page held 60 fps: it was not jank. It was the motion. The page
 * moved rigidly with the fingers and stopped dead with the last wheel event, and then the plates,
 * eased 150 ms behind the scroll (components/home/glide.ts), drifted on by themselves: visibly for
 * up to 0.4 s, and 0.8 s before they were still. Two clocks, one after the other.
 *
 * So the scroll itself glides now, and everything that answers to it answers in the same frame:
 * one smoothing layer, not two. Lenis moves the real scroll position (it calls `window.scrollTo`
 * each frame) and only smooths wheel and touchpad input, so `position: sticky` (the sea),
 * IntersectionObservers and every `scrollY` sum keep working as they were. The keys, the scrollbar
 * and a link stay the browser's own; the glide takes up from wherever they leave the page. A phone
 * keeps its own scroll, which is already what this is imitating, and so does reduced motion.
 *
 * On 2026-09-09 the owner had asked to keep «the trailing, liquid quality» of the old scrubbed
 * scroll; a smooth-scroll layer was the named follow-on if the glide fell short
 * (docs/superpowers/specs/2026-09-09-scroll-fluidity-design.md). This is it, without GSAP.
 */

/**
 * The glide's weight: each 60th of a second the page goes this share of the way to where the hand
 * has sent it (Lenis corrects for other frame rates). Its time constant is 1 / (60 × LERP), 0.4 s
 * here, so a flick has gone 95 % of the way about 1.2 s after the last of it arrives. Larger is
 * lighter and shorter, smaller heavier and longer. The owner, trying the first build (2026-09-25):
 * «make it twice as heavy» — twice the time constant of the 0.085 the scroll-flow skill's site
 * settled on, measured on this same laptop. On 2026-11-20, with the redesigned front page's long
 * pinned scenes, the owner: «the scrolling also needs to be better»; the glide is lighter again,
 * 0.07 (a time constant of 0.24 s), so a scene answers the hand sooner and stops sooner.
 */
export const LERP = 0.07;

/** Where the page glides: a precise pointer (a touchpad, a TrackPoint, a mouse) and motion wanted. */
export const WHERE = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

/*
 * A name's scroll (the sea's four names, Sea.tsx) is carried on the curve the scroll-flow skill
 * measured best: a cubic Hermite that leaves at the page's own speed and comes to rest, taking
 * 0.55 to 1.25 s by the square root of the distance. From rest that is an ease in and out; moving
 * already, it takes up that speed rather than braking it in a frame.
 */
/* The curve itself lives in carry.ts, shared with the front page's beats (steps.ts). */
export const glideFor = glide;
export { hermite };

let lenis: Lenis | null = null;
const listeners = new Set<() => void>();
/** The page's speed in px/s while the glide runs, sampled each time it moves the page. */
let speed = 0;
let lastY = 0;
let lastT = 0;

/** The glide, while it runs. */
export const smooth = () => lenis;

/** The page's speed in px/s while the glide moves it (0 at rest). */
export const glideSpeed = () => speed;

/*
 * A hook in front of the glide's wheel handling, for the front page's beats (steps.ts): it sees each
 * wheel event first and returns false to drop it (calling preventDefault itself when it swallows).
 */
let gesture: ((d: VirtualScrollData) => boolean) | null = null;
export const setGestureHandler = (fn: typeof gesture) => void (gesture = fn);

const tell = () => listeners.forEach((fn) => fn());

let listening = false;
function listen() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  // While the glide runs it has already told everyone, in the frame it moved the page; the
  // browser's own event for that move arrives a frame later.
  window.addEventListener('scroll', () => lenis || tell(), { passive: true });
}

/**
 * Told every time the page moves, in the frame it moves: by the glide's own callback while it runs
 * (it has just moved the page), by the window's scroll event otherwise. Returns the unsubscribe.
 */
export function onScroll(fn: () => void): () => void {
  listen();
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Bring the page to `y`: carried by the glide when it runs, else the browser's own smooth scroll, or at once under reduced motion. */
export function scrollToY(y: number) {
  if (lenis) {
    const g = glideFor(y - lenis.animatedScroll, speed);
    if (g) lenis.scrollTo(y, { duration: g.duration, easing: g.ease });
    return;
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
}

/**
 * Start the glide where it belongs (`WHERE`), and follow the device: a laptop that becomes a
 * tablet, or a visitor who turns motion off, is handed back the browser's scroll. An open menu
 * (`body[data-scroll-locked]`, Nav.tsx) holds it still. Returns the stop.
 */
export function startSmooth(): () => void {
  const where = window.matchMedia(WHERE);
  const hold = () => {
    if (!lenis) return;
    if (document.body.hasAttribute('data-scroll-locked')) lenis.stop();
    else lenis.start();
  };
  const start = () => {
    if (lenis || !where.matches) return;
    const l = new Lenis({
      lerp: LERP,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: true,
      allowNestedScroll: true,
      stopInertiaOnNavigate: true,
      virtualScroll: (data) => (gesture ? gesture(data) : true),
    });
    lenis = l;
    speed = 0;
    lastT = 0;
    l.on('scroll', () => {
      const now = performance.now();
      const dt = (now - lastT) / 1000;
      speed = lastT && dt > 0 && dt < 0.25 ? speed * 0.35 + ((l.animatedScroll - lastY) / dt) * 0.65 : 0;
      lastY = l.animatedScroll;
      lastT = now;
      tell();
    });
    // For the scroll-flow skill's measuring rig, which reads the glide from here.
    (window as unknown as { __lenis?: Lenis }).__lenis = l;
    hold();
  };
  const end = () => {
    if (!lenis) return;
    lenis.destroy();
    lenis = null;
    speed = 0;
    delete (window as unknown as { __lenis?: Lenis }).__lenis;
  };
  const follow = () => (where.matches ? start() : end());
  const menu = new MutationObserver(hold);
  listen();
  start();
  where.addEventListener('change', follow);
  menu.observe(document.body, { attributes: true, attributeFilter: ['data-scroll-locked'] });
  return () => {
    where.removeEventListener('change', follow);
    menu.disconnect();
    end();
  };
}
