export type GlyphMeasure = { start: number; end: number; bbY: number; bbHeight: number };

/**
 * Where the letters open from: the middle of the first glyph's advance box,
 * halfway up the word. That point is inside the I's stem, so the growing
 * mask never exposes a counter (spec 6.3). Returns a GSAP svgOrigin string.
 */
export function maskOrigin({ start, end, bbY, bbHeight }: GlyphMeasure): string {
  return `${(start + end) / 2} ${bbY + bbHeight / 2}`;
}
