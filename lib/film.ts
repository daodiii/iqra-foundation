import type { InkPalette } from './ink';
import { DEPTH, floorAt, type WaterScene } from './water';

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
 * pigment spreading through water, `lib/ink.ts`. Then the bridge: Arrangementer · Nyheter
 * is ink DROPPED INTO clear water, both renderers at once. Below it the ink is gone: Om oss ·
 * Teamet is Arafat seen through clear WATER (`lib/water.ts`), and Støtt oss is water too,
 * with the night on the card at its foot. That is the whole shape of the page — a material
 * that thins as you go down it.
 *
 * Arafat belongs to the people because it is the one scene the page had never used and it is
 * the gathering: a plain with everyone on it, under the section that says who «everyone» is.
 *
 * Three of the five are the user's departures from the film. Støtt oss: «make the last one a
 * green color that looks like green water» (2026-09-10) — it replaces the Quran's gold, which
 * survives on the page as the middle route colour below. And the two ink boxes (2026-09-12):
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
 * The sky: light blue, pale at the horizon and deeper towards the zenith, with the one thread
 * of warm light the cave used to carry kept as the sun in it. The deepest blue is the rarest
 * so the box never drifts to navy, and the load is turned down from the cave's 1.2 so it
 * stays LIGHT blue where drops overlap.
 */
const VISION: InkPalette = {
  ink: [['#a5d4f1', 3], ['#c3e2f6', 3], ['#7ec0ea', 2], ['#4f9fd9', 1], ['#f3e5c6', 1]],
  ground: '#eef5fb',
  strength: 0.9,
  /*
   * The ceiling, so that a hand on the box draws in sky blue and never in navy: at this
   * peak the deepest pigment shows as about #89bbec, and nothing can get darker. Set
   * against «when you touch the screen the color that comes out is waaay too dark. want
   * it to be sky blue» (2026-09-12); `film.test.ts` holds the darkest tone to a floor.
   */
  peak: 0.3,
};

/**
 * Cream: ivory to pale gold on warm paper, and nothing darker. The mosque's amber and its
 * brown are gone — with the load down from 0.9, two drops on top of each other still read as
 * cream rather than building back up to the tan they used to make.
 */
const MISSION: InkPalette = {
  ink: [['#eddfbd', 3], ['#f2e7cc', 3], ['#e4d2a3', 2], ['#d6bd83', 1]],
  ground: '#f8f2e4',
  strength: 0.7,
  /* Lower than the sky's: cream has less room before it is tan. The deepest tone a hand
     can leave here is about #eedcb7 — «white cream», the same call. */
  peak: 0.12,
};

/**
 * The drops: the ink of Arrangementer · Nyheter, which hangs in clear water over the
 * bridge's floor rather than staining paper (`over`). The sky's blues from Visjon, the
 * cream's golds from Misjon, and one green from the water below — the page's own inks,
 * dropped in from the top (`rain`) and slow to thin (`clear`), so a thread has time to
 * unfurl on the way down. The ground is the water's, because the box under it is the
 * water; nothing is painted with it.
 */
const DROPS: InkPalette = {
  ink: [['#4f9fd9', 3], ['#2f7fc4', 2], ['#7ec0ea', 2], ['#c9ad84', 2], ['#d6bd83', 2], ['#3b8f7c', 1]],
  ground: '#b5c6cf',
  strength: 3.4,
  over: true,
  rain: true,
  clear: 0.07,
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
 * The bridge: lit water between the ink boxes and the water boxes, with the drops above
 * hanging in it. Paler than Arafat's floor so the page keeps thinning as it goes down —
 * the ink boxes' paper, then this, then Arafat's stone, then the green. The pools are sky
 * glare, a stone shadow, the cream's warmth and a pale blue: the neighbours on either side.
 */
const BRIDGE: WaterScene = {
  pale: '#e9f0f3',
  deep: '#9fb4bf',
  pools: [
    ['#f4f8fa', 0.22, 0.78, 0.5, 0.6],
    ['#8ea6b3', 0.78, 0.26, 0.42, 0.42],
    ['#e8e2d2', 0.56, 0.6, 0.46, 0.4],
    ['#bfd0d8', 0.12, 0.2, 0.36, 0.3],
  ],
};

/**
 * Arafat: white plain, glare, and the crowd as shadow.
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
 * The Haram at night, on the card at the foot of Støtt oss.
 *
 * The one night floor: its pools are lamps, so they ADD light to the ground instead of
 * staining it, and white type sits on the result — which is why the depth does not reach it
 * (a slider that could lighten this ground would be a contrast bug), and why its caustics
 * and glint are set here rather than ramped. Lamps on black water are the one place a hard
 * caustic net and a bright glint are the picture rather than an effect.
 */
const NIGHT: WaterScene = {
  pale: '#0c131d',
  deep: '#0c131d',
  night: true,
  caus: 3,
  spec: 1.6,
  pools: [
    ['#d9b783', 0.28, 0.3, 0.55, 1.2],
    ['#c9a878', 0.76, 0.66, 0.46, 0.9],
    ['#6f8aa6', 0.58, 0.14, 0.5, 0.6],
    ['#3a8a66', 0.12, 0.88, 0.36, 0.34],
  ],
};

export const film = {
  vision: VISION,
  mission: MISSION,
  drops: DROPS,
  /*
   * Resolved here, once, at the page's one depth. Two boxes of water at different depths
   * read as two bodies of water rather than as one idea, so nothing downstream is given a
   * scene and a knob — it is given the floor.
   */
  bridge: floorAt(BRIDGE, DEPTH),
  people: floorAt(ARAFAT, DEPTH),
  supportWater: floorAt(GREEN, DEPTH),
  supportCard: floorAt(NIGHT, DEPTH),
  /**
   * The three payment routes, in the film's order: the cave's slate, the Quran's gold, the
   * night. They are CSS gradients rather than simulations — five sims on one page is
   * already the page's whole performance budget, and a box this small shows no flow. The
   * gold is also the last of the Quran left on the page, now that the ask is green.
   */
  routes: ['#5f7383', '#a07a44', '#22303f'],
} as const;

/** The sections painted in pigment, and the ones painted in water. */
export type FilmInk = 'vision' | 'mission' | 'drops';
export type FilmWater = 'bridge' | 'people' | 'supportWater' | 'supportCard';
