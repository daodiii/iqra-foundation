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
/** The page nearest the reading line must be nearer than the one showing by this share of the screen before the sea changes. */
export const HYST = 0.06;
/**
 * The words take the next field's inks once its tide is this far across. By then it has crossed
 * their page (the right page starts two fifths of the way over), so no word stands in the ink of
 * a colour it is not yet on.
 */
export const INK_AT = 0.72;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/*
 * A settle used to live here — the rule, from 2026-09-17, that a scroll coming to rest between
 * two fields finished the step it had started. It went with the stepping on 2026-09-23, when the
 * owner chose to have the sea scroll freely with one hold on its first field (step.ts): there is
 * no longer any position in the act that the page is moved away from, except that one.
 */

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

/** The field whose inks the words and the names wear at playhead `u`. */
export function inkAt(u: number): number {
  const i = Math.max(0, Math.min(STEPS, Math.floor(u)));
  return u - i > INK_AT ? Math.min(STEPS, i + 1) : i;
}

/**
 * Which page the sea shows: the one whose centre is nearest `y`, the reading line. The one
 * showing keeps it until another is nearer by `slack`, so a page standing half way between two
 * does not flicker between them. `centres` and `y` are in the page's coordinates.
 */
export function nearestPage(centres: readonly number[], y: number, current: number, slack: number): number {
  let best = current;
  centres.forEach((c, k) => {
    if (Math.abs(c - y) < Math.abs(centres[best] - y) - slack) best = k;
  });
  return best;
}
