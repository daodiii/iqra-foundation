import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { LOCKUP_VIEWBOX, LOCKUP_WORD } from './lockup';
import { MARK_LETTERS, MARK_VIEWBOX } from './mark';

// Under jsdom `import.meta.url` is not a file: URL; the repo's files resolve from the cwd.
const logo = readFileSync('public/brand/iqra-logo.svg', 'utf8');
const nums = (t: string) => t.match(/matrix\(([^)]+)\)/)![1].split(',').map(Number);

/** The lowest y in a glyph's path: absolute M/C/V/H/Z only, as the font's outlines are. */
function lowestY(d: string): number {
  let min = Infinity;
  for (const seg of d.match(/[MCVHZ][^MCVHZ]*/g)!) {
    const cmd = seg[0];
    const n = seg.slice(1).match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
    if (cmd === 'V') n.forEach((y) => { min = Math.min(min, y); });
    if (cmd === 'M' || cmd === 'C') n.forEach((v, i) => { if (i % 2) min = Math.min(min, v); });
  }
  return min;
}

/**
 * The guide's lockup file, `iqra-logo.svg`, draws FOUNDATION as ten `<use>`s of eight
 * glyph defs, each placed by a 90-unit matrix; the mark file the hero draws from sits
 * 49.848 units lower in y. The word in `lockup.ts` is those ten, moved by that much.
 */
describe('the lockup', () => {
  const defs = new Map([...logo.matchAll(/<path id="(font_16_\d)" d="([^"]+)"/g)].map((m) => [m[1], m[2]]));
  const uses = [...logo.matchAll(/<use xlink:href="#(font_16_\d)" transform="(matrix\([^)]+\))"/g)].map((m) => ({ d: defs.get(m[1])!, transform: m[2] }));
  // The shift between the two files, read off the a: the same path, placed in each.
  const aInLogo = logo.match(/<path transform="(matrix\(1,0,0,-1,833\.085,[^)]+\))"/)![1];
  const shift = nums(MARK_LETTERS[0].transform)[5] - nums(aInLogo)[5];

  test('FOUNDATION is the logo’s ten glyphs, glyph for glyph, in reading order, moved into the mark’s coordinates', () => {
    expect(shift).toBeCloseTo(49.848, 3);
    expect(uses).toHaveLength(10);
    expect(LOCKUP_WORD).toHaveLength(10);
    LOCKUP_WORD.forEach((g, i) => {
      expect(g.d).toBe(uses[i].d);
      const [a, b, c, d, e, f] = nums(g.transform);
      const [la, lb, lc, ld, le, lf] = nums(uses[i].transform);
      expect([a, b, c, d]).toEqual([la, lb, lc, ld]);
      expect(e).toBeCloseTo(le, 3);
      expect(f).toBeCloseTo(lf + shift, 3);
    });
  });

  test('the lockup’s box is the mark’s, grown downward far enough to hold the word', () => {
    const [mx, my, mw, mh] = MARK_VIEWBOX.split(' ').map(Number);
    const [x, y, w, h] = LOCKUP_VIEWBOX.split(' ').map(Number);
    expect([x, y, w]).toEqual([mx, my, mw]);
    expect(h).toBeGreaterThan(mh);
    // The word's baseline, plus the deepest descent of any glyph (em units, y up, under a 90-unit matrix).
    const baseline = Math.max(...LOCKUP_WORD.map((g) => nums(g.transform)[5]));
    const descent = Math.max(...LOCKUP_WORD.map((g) => -lowestY(g.d)));
    expect(descent).toBeGreaterThan(0);
    expect(baseline + descent * 90).toBeLessThanOrEqual(y + h);
  });
});
