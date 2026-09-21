import type { AreaKey } from '@/lib/content';
import { areas, type Area } from './areas';

/**
 * The playhead of Havet (Sea.tsx): `u` runs 0 to STEPS down the stage, one whole number per
 * field, and these are the numbers that turn it into a frame — pure, so they are tested
 * here and applied there.
 */

/**
 * The order the four come in on the sea — the owner's, given 2026-09-17 after seeing it
 * live: «navy, burgundy, turquoise and then end with white». The brief's order (Kunnskap,
 * Dialog, Møteplasser, Samfunnsdeltakelse) stands everywhere else — the bands, the seal's
 * ring, the footer's line; here the tides run from the hero's white through the dark pair
 * and out to white again, above the seal's navy. Each area keeps its own colour.
 */
export const SEA_ORDER = ['kunnskap', 'samfunnsdeltakelse', 'dialog', 'moteplasser'] as const satisfies readonly AreaKey[];

/** The areas in the sea's order, each with its look. */
export const seaAreas: readonly Area[] = SEA_ORDER.map((key) => areas.find((a) => a.key === key)!);

/** The act's stops: the four fields at u = 0, 1, 2, 3. `sea.module.css` sizes the stage as `100vh + STEPS × 100vh`. */
export const STEPS = 3;
/** A field's words are gone once its tide has gone out this far … */
export const WORD_OUT = 0.36;
/** … fading over this much of a step, out and in … */
export const WORD_FADE = 0.24;
/**
 * … and the next field's rise once its tide has come in this far: the tide's edge crosses
 * the words' page (the right half) in the last third of a step, so words that rose from
 * halfway stood on the colour they were leaving for a beat, grey on the turquoise.
 */
export const WORD_IN = 0.74;
/** A field has landed within this of its stop (the stone drops once) … */
export const LANDED = 0.12;
/** … and has left it beyond this (the stone is re-armed). */
export const LEFT = 0.5;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Where the act settles once the scroll rests: it finishes the step you started. Judged on
 * the trigger's real position, not on the landing GSAP projects from the velocity — a
 * programmatic jump of a third of a step was snapped TWO steps ahead by `snapTo: 1/3` —
 * and by the way you were going: forward, anything past a tenth of a step completes it;
 * back, anything short of nine tenths returns. A tenth is less than one notch of a mouse
 * wheel (a hundred pixels of a step of a screen): at an eighth a single notch fell short
 * and was pulled back to the field it had left, and only two notches at once moved on.
 * There is no readable state between two fields, so it always settles. The signature is
 * ScrollTrigger's `snapTo` function.
 */
export const COMMIT = 0.1;
export function settle(projected: number, self?: { progress: number; direction: number }): number {
  if (!self) return projected;
  const p = self.progress * STEPS;
  const base = Math.floor(p);
  const frac = p - base;
  const to = self.direction < 0 ? (frac < 1 - COMMIT ? base : base + 1) : (frac > COMMIT ? base + 1 : base);
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
    words: seaAreas.map((_, k) => {
      const d = u - k;
      // Going: gone before the tide is out a third. Coming: up over the last quarter, once the tide has crossed the page. Two fields' words never share the water.
      const on = d >= 0 ? clamp01((WORD_OUT - d) / WORD_FADE) : clamp01((1 + d - WORD_IN) / WORD_FADE);
      return { on, live: on > 0 };
    }),
  };
}

/** The CSS ground under the canvas at `u`: the two areas' tokens mixed straight, for a device without WebGL2. */
export function groundAt(u: number): string {
  const { i, t } = seaAt(u);
  return `color-mix(in srgb, var(${seaAreas[i + 1].token}) ${(t * 100).toFixed(1)}%, var(${seaAreas[i].token}))`;
}
