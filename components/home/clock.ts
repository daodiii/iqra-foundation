/**
 * The tide's own clock (Bladene, 2026-09-23). The scroll says WHICH field the sea shows (the
 * page nearest the middle of the screen, Sea.tsx), and this says how it gets there: in its own
 * time, whole, so nothing stops half way because a hand did. The playhead `u` goes to whole
 * fields, a crossing taking about TIDE_MS, and a new aim while it is moving is taken up from
 * where it is and as fast as it is going: a cubic from position AND speed to the new field,
 * still at the end. So a tide asked to go on to the next field never stalls, and one asked to
 * come back turns round.
 *
 * The mock's clock (mock/havet-flyt) also carried a small scroll-linked `lead` on top. Bladene
 * never used it (it passed 0), so it is not carried.
 */

/** One field's crossing, in ms. The stepping the owner called «great» travelled for 960. */
export const TIDE_MS = 950;

/** A crossing of `d` fields: a longer journey is quicker per field. */
export const crossing = (d: number) => TIDE_MS * (0.7 + 0.3 * d);

/**
 * An aim taken up while already going that way arrives no sooner than this many times the
 * distance over the speed. That keeps the cubic's start tangent under 3 (in units of the
 * distance), past which a cubic with a still end overshoots.
 */
const REACH = 2.7;

export type TideClock = {
  /** Go to `field`, a whole number. */
  aim(field: number): void;
  /** No more frames. */
  stop(): void;
};

/**
 * A clock standing on `start`. `write` is told every new playhead (the first at once) and never
 * one outside 0 … `max`.
 */
export function tideClock(write: (u: number) => void, max: number, start: number): TideClock {
  // The motion: from p0 at speed v0 (fields per ms) to p1, standing, over T ms from t0.
  let p0 = start;
  let v0 = 0;
  let p1 = start;
  let T = 1;
  let t0 = 0;
  let moving = false;
  let raf = 0;
  let shown = Number.NaN;

  const base = (now: number) => {
    if (!moving) return { p: p1, v: 0 };
    // Clamped below: a frame stamped a hair before the aim was taken must not run the cubic backwards.
    const s = Math.max(0, (now - t0) / T);
    if (s >= 1) {
      moving = false;
      return { p: p1, v: 0 };
    }
    const s2 = s * s;
    const s3 = s2 * s;
    const p = p0 * (2 * s3 - 3 * s2 + 1) + v0 * T * (s3 - 2 * s2 + s) + p1 * (3 * s2 - 2 * s3);
    const v = (p0 * (6 * s2 - 6 * s) + v0 * T * (3 * s2 - 4 * s + 1) + p1 * (6 * s - 6 * s2)) / T;
    return { p, v };
  };

  const show = (now: number) => {
    const u = Math.max(0, Math.min(max, base(now).p));
    // `!(… <= …)`, not `… > …`: the first frame compares with NaN, and must write.
    // A frame close enough to T can already sit within 1e-5 of the field before it lands — by the
    // time this reads `moving`, `base` has just cleared it — so a stop is always written, even
    // into ground the frame before it already all but reached.
    if (!(Math.abs(u - shown) <= 1e-5) || (!moving && u !== shown)) {
      shown = u;
      write(u);
    }
  };

  const frame = (now: number) => {
    raf = 0;
    show(now);
    if (moving) raf = requestAnimationFrame(frame);
  };

  show(performance.now());

  return {
    aim(next) {
      if (next === p1) return;
      const now = performance.now();
      const { p, v } = base(now);
      const d = Math.abs(next - p);
      let dur = crossing(d);
      // Already going that way: arrive without passing it.
      if (v !== 0 && Math.sign(v) === Math.sign(next - p)) dur = Math.min(dur, (REACH * d) / Math.abs(v));
      p0 = p;
      v0 = v;
      p1 = next;
      T = Math.max(1, dur);
      t0 = now;
      moving = true;
      if (!raf) raf = requestAnimationFrame(frame);
    },
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}
