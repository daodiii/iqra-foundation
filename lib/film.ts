import type { InkPalette } from './ink';
import { floorAt, type WaterScene } from './water';

/**
 * The hero film's own colours.
 *
 * These were measured rather than chosen. Frames were cut from `public/media/iqra-loop-1080.mp4`
 * at five points and each frame's pixels clustered into five centroids (k-means over a 64×36
 * downsample), on 2026-09-09:
 *
 * | at     | scene                      | what came back                          |
 * | ------ | -------------------------- | --------------------------------------- |
 * | 0.15 s | the cave, before sunrise   | `#748692` `#9ca7a9` `#cecbc1` on `#1d1d20` |
 * | 0.80 s | sujood in the mosque       | `#cdae7f` `#746a5e` on `#322c24`        |
 * | 1.80 s | Arafat                     | `#ebe8e1` `#9e948f` `#65636e`           |
 * | 2.80 s | the Quran                  | `#b79165` `#8a6234` on `#372009`        |
 * | 3.80 s | Masjid al-Haram at night   | `#0c131d` `#958679` `#bab5af`           |
 *
 * The page walks that arc, and it walks it in two materials. Visjon and Misjon are INK —
 * pigment spreading through water, `lib/ink.ts`. Below them the ink is gone and the boxes
 * are WATER (`lib/water.ts`): the stone of Arafat under Arrangementer · Nyheter, sage under
 * Om oss · Teamet, the green under Støtt oss. That order is the user's — «To løp»,
 * 2026-09-13: after the sky, a warm run (cream, then the stone) and a green run (sage, then
 * the green) — and so is the depth of each box, set one at a time on a slider.
 * That is the whole shape of the page — a material that thins as you go down it. The Haram
 * at night, the film's last scene, is not on the page any more: it was the card at the foot
 * of Støtt oss until 2026-09-12, when the section became one number and the card went.
 *
 * Arafat belongs to the people because it is the one scene the page had never used and it is
 * the gathering: a plain with everyone on it, under the section that says who «everyone» is.
 *
 * Three of the five are the user's departures from the film. Støtt oss: «make the last one a
 * green color that looks like green water» (2026-09-10) — it replaces the Quran's gold, which
 * has no place left on the page. And the two ink boxes (2026-09-12):
 * «make the first one light blue like the sky, the other one make it like cream». They had
 * been the cave and the mosque, slate on grey and amber on cream, sampled from the frames
 * above; they are now the sky the cave opens onto and the mosque's light without its amber,
 * and the hexes are chosen, not measured. The page still cools and then warms in the film's
 * order, and `film.test.ts` holds it to that.
 *
 * A pigment is mixed a little stronger than the colour wanted on the page. Ink thins as it
 * spreads, and a hex laid down as-is arrives a good deal paler than it reads in the list.
 * The `ground` values are the paper, and they are also written into `wash.module.css` as
 * each box's background so the section has its colour before any script has run.
 */

/**
 * The user's slider, on the ink boxes. Every box on the page was given a depth on the same
 * slider (2026-09-13), 0.7 being what each had been tuned as; the ink boxes were set to 0.55,
 * which on pigment means this much of the load and the ceiling.
 */
const INK_LOAD = 0.55 / 0.7;

/**
 * The sky: light blue, pale at the horizon and deeper towards the zenith, with the one thread
 * of warm light the cave used to carry kept as the sun in it. The deepest blue is the rarest
 * so the box never drifts to navy, and the load is turned down from the cave's 1.2 so it
 * stays LIGHT blue where drops overlap.
 */
const VISION: InkPalette = {
  ink: [['#a5d4f1', 3], ['#c3e2f6', 3], ['#7ec0ea', 2], ['#4f9fd9', 1], ['#f3e5c6', 1]],
  ground: '#eef5fb',
  /*
   * The load, and below it the ceiling, both at 0.55/0.7 of what they were tuned as: the
   * user set this box to 0.55 on the same slider as the water boxes («To løp», 2026-09-13),
   * and on ink the slider is how much pigment lands and how dark it may get. The stills in
   * `wash.module.css` carry the same factor.
   */
  strength: 0.9 * INK_LOAD,
  /*
   * The ceiling, so that a hand on the box draws in sky blue and never in navy: at 0.3 the
   * deepest pigment showed as about #89bbec, and nothing could get darker. Set against
   * «when you touch the screen the color that comes out is waaay too dark. want it to be
   * sky blue» (2026-09-12); `film.test.ts` holds the darkest tone to a floor.
   */
  peak: 0.3 * INK_LOAD,
};

/**
 * Cream: ivory to pale gold on warm paper, and nothing darker. The mosque's amber and its
 * brown are gone — with the load down from 0.9, two drops on top of each other still read as
 * cream rather than building back up to the tan they used to make.
 */
const MISSION: InkPalette = {
  ink: [['#eddfbd', 3], ['#f2e7cc', 3], ['#e4d2a3', 2], ['#d6bd83', 1]],
  ground: '#f8f2e4',
  strength: 0.7 * INK_LOAD,
  /* Lower than the sky's: cream has less room before it is tan. The deepest tone a hand
     could leave here was about #eedcb7 — «white cream», the same call. */
  peak: 0.12 * INK_LOAD,
};

/*
 * The water scenes.
 *
 * A floor rather than a palette: a ground colour with a few pools of light and shade lying
 * on it, seen through a surface that moves. `pale` and `deep` are the same floor in the
 * shallowest and deepest water the page allows, and `DEPTH` picks the point between them —
 * see `lib/water.ts`, where the number and whose it is are written down.
 */

/**
 * Sage: grey-green, still water. Chosen for Arrangementer · Nyheter first («C Salvie»,
 * 2026-09-12, to replace the drops that used to rain into that box) and moved down one
 * box the next day, when the user reordered the page: it is the first of the green run,
 * under Om oss · Teamet, with the green itself below it. The pools follow Arafat's pattern:
 * light low left, shade high right, a mid-tone and a small dark one.
 */
const SAGE: WaterScene = {
  pale: '#e1e9e2',
  deep: '#8da493',
  pools: [
    ['#ecf1ec', 0.2, 0.82, 0.5, 0.6],
    ['#7f9786', 0.8, 0.22, 0.42, 0.4],
    ['#cddacf', 0.58, 0.62, 0.5, 0.45],
    ['#a8bcad', 0.1, 0.16, 0.34, 0.3],
  ],
};

/**
 * Arafat: white plain, glare, and the crowd as shadow. Under Arrangementer · Nyheter since
 * the reorder of 2026-09-13, and barely under water there (0.15): the stone in a film of
 * light, the second step of the warm run down from the cream.
 *
 * The pale end is the plain's own stone; the deep end is that stone with the light taken
 * out of it rather than a different colour, which is what keeps it reading as one place at
 * any depth. The pools are the sampled centroids almost unchanged — the bright plain, the
 * crowd's slate, sand, and one more shadow.
 */
const ARAFAT: WaterScene = {
  pale: '#d8d2c8',
  deep: '#9c958d',
  pools: [
    ['#ede9e0', 0.2, 0.82, 0.5, 0.66],
    ['#65636e', 0.8, 0.22, 0.42, 0.4],
    ['#d8ccb8', 0.58, 0.62, 0.5, 0.48],
    ['#8a8790', 0.1, 0.16, 0.34, 0.3],
  ],
};

/**
 * The ask, in green water.
 *
 * Not a film scene, so it is built the way the film's scenes are: one hue family, a light
 * end and a dark end of the same green, and pools that are the same water at other depths
 * rather than other colours. The single grain of sand (`#e2e6cc`) is what stops it reading
 * as a swimming pool — it is the only pool here that is not green.
 */
const GREEN: WaterScene = {
  pale: '#b4dccd',
  deep: '#2c7663',
  pools: [
    ['#cfe8dc', 0.84, 0.6, 0.55, 0.55],
    ['#1f5c4d', 0.18, 0.84, 0.5, 0.42],
    ['#7fc4b1', 0.6, 0.5, 0.36, 0.35],
    ['#e2e6cc', 0.44, 0.1, 0.34, 0.28],
    ['#3b8f7c', 0.04, 0.3, 0.3, 0.25],
  ],
};

/**
 * Each water box's depth, the user's (2026-09-13, on a slider per box). The page's water
 * used to be resolved at one depth so the boxes would read as one body of water; they are
 * three now, and the page reads as water getting deeper: the bridge barely covers its stone,
 * the ask is the deepest. Nothing downstream is given a scene and a knob — it is given the
 * floor, resolved here. `film.test.ts` pins the ground each one comes out as.
 */
const DEPTHS = { bridge: 0.15, people: 0.55, support: 0.35 } as const;

export const film = {
  vision: VISION,
  mission: MISSION,
  bridge: floorAt(ARAFAT, DEPTHS.bridge),
  people: floorAt(SAGE, DEPTHS.people),
  supportWater: floorAt(GREEN, DEPTHS.support),
} as const;

/** The sections painted in pigment, and the ones painted in water. */
export type FilmInk = 'vision' | 'mission';
export type FilmWater = 'bridge' | 'people' | 'supportWater';
