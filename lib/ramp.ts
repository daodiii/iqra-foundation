/**
 * The brand's run of colour, cool to warm.
 *
 * This is what is left of `lib/drape.ts`. The drape — a bundle of feathered filaments that
 * ran down the side of Misjon and filled Støtt oss — was the site's ornament until the
 * sections became ink (`lib/ink.ts`), and its renderer is gone. The ramp outlived it because
 * the tree in Visjon climbs it: a branch takes its colour from its height, turquoise at the
 * ground through the brand blue and out to burgundy at the tips.
 *
 * One consumer, and it is the only reason this file exists. If the tree ever stops reading
 * a colour off its own height, this goes with it.
 */

export type RGB = [number, number, number];
export type Stop = { at: number; c: RGB };

/** The logo plate colour, read off the lockup. Not sampled from a file: no logo asset on
 *  disk carries it, so treat it as provisional until one does. */
const TEAL: RGB = [0x62, 0xbf, 0xbd];

const lighten = (c: RGB, f: number): RGB => [
  Math.round(c[0] + (255 - c[0]) * f),
  Math.round(c[1] + (255 - c[1]) * f),
  Math.round(c[2] + (255 - c[2]) * f),
];

/**
 * Turquoise into the brand blue and navy, then out through rose into the brand burgundy.
 * `#3f5b7a` and `#ab5263` are hit exactly; the colours between them carry more chroma than
 * the brand does, because a ramp built only from the brand navy — which is very close to
 * grey — reads as smoke on a white page.
 *
 * There used to be a second, shorter ramp here for the night ground. Nothing sits on a night
 * ground any more except the card at the foot of Støtt oss, and that takes its colours from
 * the film (`lib/film.ts`), so the deep ramp went with the renderer.
 */
export function ramp(): Stop[] {
  const pale = lighten(TEAL, 0.82);
  return [
    { at: 0.0, c: pale },
    { at: 0.13, c: TEAL },
    { at: 0.27, c: [143, 176, 224] },
    { at: 0.4, c: [95, 131, 192] },
    { at: 0.5, c: [63, 91, 122] },
    { at: 0.62, c: [138, 127, 192] },
    { at: 0.74, c: [196, 122, 156] },
    { at: 0.86, c: [171, 82, 99] },
    { at: 1.0, c: [224, 188, 203] },
  ];
}

/** Colour at `s` along the ramp, 0 at the cool end and 1 at the warm one. */
export function sample(stops: Stop[], s: number): RGB {
  const t = Math.max(0, Math.min(1, s));
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i].at) {
      const a = stops[i - 1], b = stops[i];
      const f = (t - a.at) / (b.at - a.at);
      return [
        Math.round(a.c[0] + (b.c[0] - a.c[0]) * f),
        Math.round(a.c[1] + (b.c[1] - a.c[1]) * f),
        Math.round(a.c[2] + (b.c[2] - a.c[2]) * f),
      ];
    }
  }
  return stops[stops.length - 1].c;
}
