import type { InkPalette } from './ink';
import { floorAt, type WaterScene } from './water';

/**
 * The materials, in the brand's colours.
 *
 * The draft's five scenes — a sky and a cream in ink, Arafat's stone, sage and a green in
 * water — were sampled off the hero film and then chosen by eye, before the guide existed.
 * They are gone. What is left is one palette per material, both written from the guide's
 * five values, so the ink and the water are the brand's ground and not a second palette
 * standing beside it. `lib/ink.ts` and `lib/water.ts` are unchanged; they are given these.
 *
 * The same hexes are tokens in `app/globals.css` (`--color-light`, `--color-turquoise`,
 * `--color-turquoise-mid`, `--color-navy`, `--color-water-pale`, `--color-water-floor`):
 * a box carries its colour in CSS before any script runs, and on a device that declines
 * WebGL2 the CSS still is the whole answer. `film.test.ts` holds the two sides together.
 */

/**
 * The user's slider, kept from the draft: the ink boxes were set to 0.55 of a 0.7 tuning
 * (2026-09-13), and on pigment that is this much of the load and of the ceiling.
 */
const INK_LOAD = 0.55 / 0.7;

/**
 * Ink on the guide's light paper: the turquoise, the turquoise three fifths into white,
 * and one navy — the dark that has the most power to swallow the others, so it appears
 * once against the two mid-tones' three (pigment mixes subtractively; equal weights
 * made every box of the first draft the same grey-brown). The ceiling keeps a hand from
 * drawing in navy: with `peak` the darkest tone the box can ever show is a mid blue-grey
 * (`deepest` in `lib/ink.ts`), on which navy type still clears 4.5:1 under the frost.
 */
const INK: InkPalette = {
  ink: [['#67c1bf', 3], ['#a3dad8', 3], ['#2c394b', 1]],
  ground: '#f0f0f1',
  strength: 0.9 * INK_LOAD,
  peak: 0.3 * INK_LOAD,
};

/**
 * Clear water over a turquoise floor: the pale end is the turquoise about a sixth into
 * white, the deep end the turquoise itself, and `WATER_DEPTH` picks the point between.
 * The pools are the guide's light and its navy at low alpha — light high on the left,
 * shade low on the right, the mid tint between, one small shadow — so the floor is a
 * place and not a flat colour. Coordinates are 0-1 with y up.
 */
const WATER: WaterScene = {
  pale: '#e6f4f3',
  deep: '#67c1bf',
  pools: [
    ['#f0f0f1', 0.2, 0.82, 0.5, 0.55],
    ['#2c394b', 0.8, 0.22, 0.42, 0.16],
    ['#a3dad8', 0.58, 0.62, 0.5, 0.45],
    ['#2c394b', 0.1, 0.16, 0.34, 0.1],
  ],
};

/**
 * How deep the water is, 0 to 1. One number for every box of water on the site, so two
 * boxes read as one body of water; 0.45 keeps the floor light enough for navy type on a
 * half-frosted card and deep enough that the caustic net reads as water, not as a wash.
 */
export const WATER_DEPTH = 0.45;

export const brand = {
  ink: INK,
  water: WATER,
  /** The water resolved at the page's depth: what `createWater` is handed. */
  floor: floorAt(WATER, WATER_DEPTH),
} as const;
