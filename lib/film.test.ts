import { expect, test } from 'vitest';
import { film, type FilmInk, type FilmWater } from './film';
import { deepest, type InkPalette } from './ink';
import { POOL_LIMIT, type WaterFloor } from './water';

const INK: FilmInk[] = ['vision', 'mission'];
const WATER: FilmWater[] = ['bridge', 'people', 'supportWater'];
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

const paper: [FilmInk, InkPalette][] = [['vision', film.vision], ['mission', film.mission]];
const water: [FilmWater, WaterFloor][] = WATER.map((k) => [k, film[k]]);

test('every colour is a full six-digit hex, so the shader parse cannot half-succeed', () => {
  const ink = INK.flatMap((s) => [film[s].ground, ...film[s].ink.map(([h]) => h)]);
  const pools = WATER.flatMap((s) => [film[s].ground, ...film[s].pools.map(([h]) => h)]);
  for (const h of ink.concat(pools)) expect(h).toMatch(/^#[0-9a-f]{6}$/);
});

/**
 * Nothing on the page is night any more: the Haram card went with the Støtt oss rebuild
 * (2026-09-12), and navy type sits on every ground that is left. A night floor or an
 * additive ink coming back would put white type's contrast in play again.
 */
test('no ink is additive and no water is night', () => {
  for (const [, p] of paper) expect(p.additive).toBeFalsy();
  for (const [name, floor] of water) expect(floor.night, name).toBe(false);
});

/*
 * Arrangementer · Nyheter: still water, sage, between the ink boxes and the water boxes. Its
 * floor has to sit between them in weight — lighter than Arafat's, darker than the paper —
 * or the page stops thinning as it goes down, which is its whole idea.
 */
test('the bridge floor sits between the paper and Arafat in weight', () => {
  expect(lum(film.bridge.ground)).toBeLessThan(Math.min(lum(film.vision.ground), lum(film.mission.ground)));
  expect(lum(film.bridge.ground)).toBeGreaterThan(lum(film.people.ground));
});

/**
 * The user's pick, pinned: «C Salvie, 0.3» (2026-09-12) — the sage scene resolved at a depth
 * of 0.3 while every other water box keeps the page's 0.7, and the ground that comes out is
 * this one. A shallower box on purpose, so a refactor that quietly puts it back on the
 * shared depth would darken it to #a7b9aa and fail here.
 */
test('the bridge is sage, resolved shallower than the other water by the user’s call', () => {
  expect(film.bridge.ground).toBe('#c8d4ca');
  expect(hue(film.bridge.ground)).toBeGreaterThan(110);
  expect(hue(film.bridge.ground)).toBeLessThan(150);
});

/** The drops that used to fall into it are gone, palette and all; nothing on the page rains ink now. */
test('there is no drops ink any more', () => {
  expect('drops' in film).toBe(false);
});

/**
 * Contrast, not taste. Navy copy sits on the paper grounds and on both water floors, so a
 * ground that drifted the wrong way would take the text with it.
 */
test('the paper grounds are light', () => {
  for (const [name, p] of paper) expect(lum(p.ground), name).toBeGreaterThan(200);
});

/**
 * The water is darker than the paper by design — it is water with depth in it — but the
 * white cards have to keep sitting ON it rather than disappearing into it, and the cards
 * are the page's whole shape.
 */
test('the water floors are mid-tones, darker than the paper', () => {
  for (const name of ['people', 'supportWater'] as const) {
    expect(lum(film[name].ground), name).toBeGreaterThan(120);
    expect(lum(film[name].ground), name).toBeLessThan(200);
  }
});

/**
 * The shader holds `POOL_LIMIT` pools and its loop is unrolled at compile time, so a scene
 * with more would not fail — the extra ones would simply never be drawn, and the floor would
 * quietly be missing a colour.
 */
test('no floor asks for more pools than the shader can hold', () => {
  for (const [name, floor] of water) expect(floor.pools.length, name).toBeLessThanOrEqual(POOL_LIMIT);
});

/** A pool outside the box is a colour nobody sees and a slot the shader still pays for. */
test('every pool sits inside its box', () => {
  for (const [name, floor] of water) {
    for (const [hex, x, y] of floor.pools) {
      expect(x, `${name} ${hex}`).toBeGreaterThanOrEqual(0);
      expect(x, `${name} ${hex}`).toBeLessThanOrEqual(1);
      expect(y, `${name} ${hex}`).toBeGreaterThanOrEqual(0);
      expect(y, `${name} ${hex}`).toBeLessThanOrEqual(1);
    }
  }
});

/**
 * The floor the user chose, at the depth the user chose.
 *
 * This exact hex is also written into `wash.module.css`, because the box has to carry its
 * colour before any script runs — so the two can drift, and `sections.spec.ts` compares
 * them on the live page. This test is the cheaper half of that: it fails in a second if the
 * scene or the depth moves, and names the number the stylesheet then needs.
 */
test('the green floor at the settled depth is the hex the stylesheet holds', () => {
  expect(film.supportWater.ground).toBe('#559583');
});

test('the people floor at the settled depth is the hex the stylesheet holds', () => {
  expect(film.people.ground).toBe('#aea79f');
});

/**
 * Støtt oss departs from the film here, and it is the user's departure: «make the last one
 * a green color that looks like green water». Everything else on the page walks the film's
 * own scenes in order, so this one is worth a test that says out loud that it is meant.
 */
test('the ask is green water rather than the film’s gold', () => {
  const h = hue(film.supportWater.ground);
  expect(h).toBeGreaterThan(120);
  expect(h).toBeLessThan(190);
});

/** Arafat is a white plain in glare. Any hue that reads as a colour would make it a scene
 *  from some other film — it is the one floor that has to stay nearly neutral. */
test('the people’s floor is a near-neutral stone', () => {
  const [r, g, b] = rgb(film.people.ground);
  expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(30);
});

/**
 * The mud lesson, as a test. Pigment mixes subtractively, so the darkest ink in a palette
 * has by far the most power to swallow the others; the first version of this palette gave
 * every ink equal weight and both boxes came out the same grey-brown. The dark is allowed
 * in, but only as rarely as anything in the palette ever appears.
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

/** Visjon is the cool box and Misjon the warm one, in that order, so the page cools and
 *  then warms as the film does from the cave into the mosque. A swap would read as the
 *  wrong scene. */
test('the sections follow the film from the cold cave into the warm mosque', () => {
  const heaviest = (p: InkPalette) => [...p.ink].sort((a, b) => b[1] - a[1])[0][0];
  expect(hue(heaviest(film.vision))).toBeGreaterThan(180);
  expect(hue(heaviest(film.vision))).toBeLessThan(260);
  expect(hue(heaviest(film.mission))).toBeLessThan(60);
});

/*
 * The user's call, 2026-09-12: «make the first one light blue like the sky, the other one
 * make it like cream». Neither box is a scene lifted from the film any more — Visjon is the
 * sky the cave opens onto and Misjon is the mosque's light without its amber — and what
 * that takes is pigments that stay LIGHT. A single dark ink in either palette would drift
 * the box straight back to the slate or the tan it used to be, so the floor is on every
 * pigment, not on the average.
 */
test('Visjon is the sky: every pigment light, and the ones carrying the box plainly blue', () => {
  for (const [hex] of film.vision.ink) expect(lum(hex), hex).toBeGreaterThan(140);
  for (const [hex, w] of film.vision.ink) {
    if (w < 2) continue;
    expect(hue(hex), hex).toBeGreaterThan(185);
    expect(hue(hex), hex).toBeLessThan(225);
    // blue rather than a blue-grey haze: the sky has chroma in it
    const [r, g, b] = rgb(hex);
    expect(Math.max(r, g, b) - Math.min(r, g, b), hex).toBeGreaterThan(50);
  }
});

test('Misjon is cream: no pigment as dark as the mosque’s amber', () => {
  for (const [hex] of film.mission.ink) expect(lum(hex), hex).toBeGreaterThan(180);
});

/*
 * What a hand can do. The pointer lays pigment on pigment, and the display is Beer-Lambert,
 * so with no ceiling a slow finger ran the sky to navy and the cream to brown — «when you
 * touch the screen the color that comes out is waaay too dark. want it to be sky blue and
 * white cream color» (2026-09-12). Each paper palette now carries a `peak`, and `deepest`
 * is the darkest tone that box can ever show, whatever anyone does to it. Held in
 * luminance, where the words «light blue» and «white cream» actually live.
 */
test('nothing a hand does makes the sky darker than sky blue, or the cream darker than cream', () => {
  const toHex = (c: readonly number[]) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const sky = toHex(deepest(film.vision));
  const cream = toHex(deepest(film.mission));
  expect(lum(sky), sky).toBeGreaterThan(170);
  expect(hue(sky), sky).toBeGreaterThan(190);
  expect(hue(sky), sky).toBeLessThan(225);
  expect(lum(cream), cream).toBeGreaterThan(210);
  expect(hue(cream), cream).toBeLessThan(60);
});
