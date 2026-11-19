/**
 * One animation frame loop for the whole front page. Every scene that answers to the scroll reads
 * the page here, in the same frame, so nothing trails behind anything else (the owner's pick: the
 * scenes follow the scroll exactly, no lerp). The loop runs while anyone listens.
 *
 * Most scenes only need a frame when the page has moved: `onScrollFrame` runs them then, and only
 * while they are near the screen, so a page that stands still costs nothing (measured on a phone
 * profile, 2026-11-19: the always-running loop kept the main thread 28–38% busy at rest).
 */
type Tick = (now: number) => void;

const ticks = new Set<Tick>();
let raf = 0;
/** The page's position and size this frame; a scene that saw the same key last time has nothing to do. */
let key = '';

function run(now: number) {
  raf = requestAnimationFrame(run);
  key = `${window.scrollX},${window.scrollY},${window.innerWidth},${window.innerHeight}`;
  ticks.forEach((t) => t(now));
}

/** Every frame, while subscribed. For what moves by the clock, not only by the scroll. */
export function onFrame(t: Tick): () => void {
  ticks.add(t);
  if (!raf) raf = requestAnimationFrame(run);
  return () => {
    ticks.delete(t);
    if (!ticks.size && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

/** The page's position and size as of this frame (see `run`). */
export const pageKey = () => key;

/**
 * A frame only when the page has moved or resized, and only while `el` is within a screen of the
 * viewport (or always, without `el`). Coming near, it runs at once, so it never shows a stale state.
 */
export function onScrollFrame(el: Element | null, t: Tick): () => void {
  let near = !el;
  let seen = '';
  const io =
    el && typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(
          ([e]) => {
            near = e.isIntersecting;
            if (near) seen = '';
          },
          { rootMargin: '100% 0px' },
        )
      : null;
  if (el && io) io.observe(el);
  else near = true;
  const stop = onFrame((now) => {
    if (!near || key === seen) return;
    seen = key;
    t(now);
  });
  return () => {
    io?.disconnect();
    stop();
  };
}

export const clamp = (t: number) => Math.min(1, Math.max(0, t));
/** Ease in and out, cubic. */
export const eio = (t: number) => {
  const u = clamp(t);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
};
/** Ease out, cubic. */
export const eo = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

/**
 * How far through a tall section its pinned stage has travelled: 0 as the section's top meets the
 * top of the screen, 1 as its foot meets the stage's foot. `H` is the stage's own height: on a
 * phone the visible height changes as the address bar slides, the stage (100svh) does not.
 */
export function progress(el: Element, H: number): number {
  const r = el.getBoundingClientRect();
  return r.height > H ? clamp(-r.top / (r.height - H)) : 0;
}

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
