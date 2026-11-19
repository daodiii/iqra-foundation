/**
 * One animation frame loop for the whole front page. Every scene that answers to the scroll reads
 * the page here, in the same frame, so nothing trails behind anything else (the owner's pick: the
 * scenes follow the scroll exactly, no lerp). The loop runs while anyone listens.
 */
type Tick = (now: number) => void;

const ticks = new Set<Tick>();
let raf = 0;

function run(now: number) {
  raf = requestAnimationFrame(run);
  ticks.forEach((t) => t(now));
}

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

export const clamp = (t: number) => Math.min(1, Math.max(0, t));
/** Ease in and out, cubic. */
export const eio = (t: number) => {
  const u = clamp(t);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
};
/** Ease out, cubic. */
export const eo = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

/** How far through a tall section the screen is: 0 as its top meets the top of the screen, 1 as its foot meets the foot. */
export function progress(el: Element): number {
  const r = el.getBoundingClientRect();
  const H = window.innerHeight;
  return r.height > H ? clamp(-r.top / (r.height - H)) : 0;
}

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
