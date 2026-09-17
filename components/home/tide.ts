import { areas } from './areas';

/**
 * The playhead of Havet (Sea.tsx): `u` runs 0 to STEPS down the stage, one whole number per
 * field, and these are the numbers that turn it into a frame — pure, so they are tested
 * here and applied there.
 */

/** The act's stops: the four fields at u = 0, 1, 2, 3. `sea.module.css` sizes the stage as `100vh + STEPS × 100vh`. */
export const STEPS = 3;
/** A field's words are gone once the playhead is this far from its stop … */
export const WORD_REACH = 0.5;
/** … fading over this much of a step on the way. */
export const WORD_FADE = 0.3;
/** A field has landed within this of its stop (the stone drops once) … */
export const LANDED = 0.12;
/** … and has left it beyond this (the stone is re-armed). */
export const LEFT = 0.5;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Where the act settles once the scroll rests: it finishes the step you started. Judged on
 * the trigger's real position, not on the landing GSAP projects from the velocity — a
 * programmatic jump of a third of a step was snapped TWO steps ahead by `snapTo: 1/3` —
 * and by the way you were going: forward, anything past an eighth of a step completes it;
 * back, anything short of seven eighths returns. There is no readable state between two
 * fields, so it always settles. The signature is ScrollTrigger's `snapTo` function.
 */
export function settle(projected: number, self?: { progress: number; direction: number }): number {
  if (!self) return projected;
  const p = self.progress * STEPS;
  const base = Math.floor(p);
  const frac = p - base;
  const to = self.direction < 0 ? (frac < 0.875 ? base : base + 1) : (frac > 0.125 ? base + 1 : base);
  return Math.max(0, Math.min(STEPS, to)) / STEPS;
}

export type SeaFrame = {
  /** The field the tide comes from … */
  i: number;
  /** … and how far the next one's has come across, 0–1. */
  t: number;
  /** Each field's words: how far up they are (`--on`, 0–1) and whether they are the ones on the water (`data-on`). */
  words: { on: number; live: boolean }[];
};

/** The act at playhead `u` (0 to STEPS). */
export function seaAt(u: number): SeaFrame {
  const i = Math.max(0, Math.min(STEPS - 1, Math.floor(u)));
  const t = clamp01(u - i);
  return {
    i,
    t,
    words: areas.map((_, k) => {
      const d = Math.abs(u - k);
      // Gone before the tide is halfway, up once it has passed: two fields' words never share the water.
      return { on: clamp01((WORD_REACH - d) / WORD_FADE), live: d < WORD_REACH };
    }),
  };
}

/** The CSS ground under the canvas at `u`: the two areas' tokens mixed straight, for a device without WebGL2. */
export function groundAt(u: number): string {
  const { i, t } = seaAt(u);
  return `color-mix(in srgb, var(${areas[i + 1].token}) ${(t * 100).toFixed(1)}%, var(${areas[i].token}))`;
}
