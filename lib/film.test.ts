import { expect, test } from 'vitest';
import { film, type FilmSection } from './film';
import type { InkPalette } from './ink';

const SECTIONS: FilmSection[] = ['vision', 'mission', 'support', 'supportCard'];
const rgb = (hex: string) => [
  parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16),
] as const;
const lum = (hex: string) => { const [r, g, b] = rgb(hex); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

/** Degrees round the wheel. Only meaningful for a colour with some saturation in it. */
function hue(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return h * 60;
}

const paper: [FilmSection, InkPalette][] = [
  ['vision', film.vision], ['mission', film.mission], ['support', film.support],
];

test('every colour is a full six-digit hex, so the shader parse cannot half-succeed', () => {
  const all = SECTIONS.flatMap((s) => [film[s].ground, ...film[s].ink.map(([h]) => h)]).concat(film.routes);
  for (const h of all) expect(h).toMatch(/^#[0-9a-f]{6}$/);
});

test('the night card is the only additive palette', () => {
  expect(film.supportCard.additive).toBe(true);
  for (const [, p] of paper) expect(p.additive).toBeFalsy();
});

/**
 * Contrast, not taste. Navy copy sits on the three paper grounds and white type sits on the
 * night card, so a ground that drifted the wrong way would take the text with it.
 */
test('the three paper grounds are light and the night card is dark', () => {
  for (const [name, p] of paper) expect(lum(p.ground), name).toBeGreaterThan(200);
  expect(lum(film.supportCard.ground)).toBeLessThan(40);
});

/**
 * The mud lesson, as a test. Pigment mixes subtractively, so the darkest ink in a palette
 * has by far the most power to swallow the others; the first version of this palette gave
 * every ink equal weight and all three boxes came out the same grey-brown. The dark is
 * allowed in, but only as rarely as anything in the palette ever appears.
 */
test('the darkest pigment in each paper palette is also the rarest', () => {
  for (const [name, p] of paper) {
    const darkest = [...p.ink].sort((a, b) => lum(a[0]) - lum(b[0]))[0];
    const lightest = Math.min(...p.ink.map(([, w]) => w));
    expect(darkest[1], `${name}: ${darkest[0]}`).toBe(lightest);
  }
});

/**
 * The other half of the same lesson: two inks from opposite sides of the wheel make mud
 * rather than a gradient. Each section holds to one scene's hue family, which is measured
 * here on the pigments that actually carry the box — the rare ones are the accents.
 */
test('the pigments carrying each paper palette sit in one hue family', () => {
  for (const [name, p] of paper) {
    const heavy = p.ink.filter(([, w]) => w >= 2).map(([h]) => hue(h));
    expect(heavy.length, name).toBeGreaterThan(1);
    expect(Math.max(...heavy) - Math.min(...heavy), name).toBeLessThan(30);
  }
});

/** Visjon takes the cave before sunrise and Misjon the lamplit mosque, so the page cools
 *  and then warms exactly as the film does. A swap would read as the wrong scene. */
test('the sections follow the film from the cold cave into the warm mosque', () => {
  const heaviest = (p: InkPalette) => [...p.ink].sort((a, b) => b[1] - a[1])[0][0];
  expect(hue(heaviest(film.vision))).toBeGreaterThan(180);
  expect(hue(heaviest(film.vision))).toBeLessThan(260);
  expect(hue(heaviest(film.mission))).toBeLessThan(60);
  expect(hue(heaviest(film.support))).toBeLessThan(60);
});

test('there is one route colour for each of the three ways to pay', () => {
  expect(film.routes).toHaveLength(3);
});
