import type { InkPalette } from './ink';

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
 * The page then walks that arc: Visjon takes the cave, Misjon the mosque, Støtt oss the
 * Quran, and the card at the foot of Støtt oss the night. Each section holds to ONE scene's
 * hue family, which is the whole trick — see the warning on `ink` in `InkPalette`.
 *
 * The hexes below carry a little more chroma than the sampled centroids. Ink thins as it
 * spreads, and a pigment mixed straight from the sample arrives on the page a good deal
 * paler than the frame it came from; these are the sampled hues with that loss paid back.
 * The `ground` values are the paper, and they are also written into `wash.module.css` as
 * each box's background so the section has its colour before any script has run.
 */

/** The cave at dawn: slate and mist, with one thread of the sunrise in it. */
const VISION: InkPalette = {
  ink: [['#5f7d99', 3], ['#8aa3b3', 3], ['#3f5670', 2], ['#1f2c3c', 1], ['#e2cfa6', 1]],
  ground: '#e6eaea',
  strength: 1.2,
};

/** The mosque: amber and cream, the light coming through the arches. */
const MISSION: InkPalette = {
  ink: [['#d1a86a', 3], ['#e3c48f', 3], ['#b8894a', 2], ['#8c6a3a', 1]],
  ground: '#f1eadb',
  strength: 0.9,
};

/** The Quran under a candle: gold and bronze on parchment. */
const SUPPORT: InkPalette = {
  ink: [['#a87a45', 3], ['#7a5227', 2], ['#c9a46b', 2], ['#3a2410', 1], ['#6b6470', 1]],
  ground: '#ebe2cf',
  strength: 1.05,
};

/**
 * The Haram at night, and the one additive palette: this ink is light in dark water rather
 * than pigment on paper, so its colours are the lamps themselves and the ground stays the
 * night the film ends on. White type sits on this card, which is why it can never brighten
 * the way the three paper grounds do.
 */
const SUPPORT_CARD: InkPalette = {
  ink: [['#d9b783', 3], ['#c9a878', 2], ['#6f8aa6', 2], ['#3a8a66', 1]],
  ground: '#0c131d',
  additive: true,
  /*
   * Light adds where pigment subtracts, and it adds much faster: at the load the paper
   * palettes carry, six overlapping drops summed past white and the card became a bright
   * cloud with the type lost in it. This is the one palette where the ceiling is the
   * problem rather than the floor.
   */
  strength: 0.42,
};

export const film = {
  vision: VISION,
  mission: MISSION,
  support: SUPPORT,
  supportCard: SUPPORT_CARD,
  /**
   * The three payment routes, in the film's order: the cave's slate, the Quran's gold, the
   * night. They are CSS gradients rather than simulations — four sims on one page is
   * already the page's whole performance budget, and a box this small shows no flow.
   */
  routes: ['#5f7383', '#a07a44', '#22303f'],
} as const;

export type FilmSection = keyof Omit<typeof film, 'routes'>;
