import { expect, test } from 'vitest';
import { createWater, createWaterWhenNear, DEPTH, floorAt, type WaterScene } from './water';

/** A scene with round numbers in it, so a wrong lerp shows up as a wrong hex rather than
 *  as a plausible one. Not one of the film's — those are asserted in `film.test.ts`. */
const SCENE: WaterScene = {
  pale: '#ffffff',
  deep: '#000000',
  pools: [['#804020', 0.5, 0.5, 0.4, 0.4], ['#204080', 0.2, 0.8, 0.3, 0.2]],
};

test('with no depth at all the floor is the scene at its palest', () => {
  expect(floorAt(SCENE, 0).ground).toBe('#ffffff');
});

test('at full depth the floor is the scene at its deepest', () => {
  expect(floorAt(SCENE, 1).ground).toBe('#000000');
});

test('halfway down, the floor is halfway between the two', () => {
  expect(floorAt(SCENE, 0.5).ground).toBe('#808080');
});

/**
 * The depth is a decision, not a default. I recommended 0.50 from frames shot at 20, 50 and
 * 80; the green read minty there, and the user answered «70». It is written here rather than
 * passed in because every floor on the page has to be at the SAME depth — two boxes of water
 * at different depths read as two different bodies of water.
 */
test('the settled depth is the one the user chose', () => {
  expect(DEPTH).toBe(0.7);
});

/**
 * Deeper water is not simply darker water. Light that goes further through it bends more
 * before it comes back, so the caustic net on the floor sharpens and the glint hardens as
 * the ground darkens — without that, depth reads as someone having turned the brightness
 * down rather than as water with more of itself between you and the bottom.
 */
test('deeper water carries a stronger caustic net', () => {
  expect(floorAt(SCENE, 1).caus).toBeGreaterThan(floorAt(SCENE, 0).caus);
});

test('deeper water carries a harder glint', () => {
  expect(floorAt(SCENE, 1).spec).toBeGreaterThan(floorAt(SCENE, 0).spec);
});

/** The pools are the scene ON the floor, so they have to gain with the depth too — held
 *  flat, they would wash out exactly as the ground around them got stronger. */
test('the pools on the floor strengthen with the depth', () => {
  const shallow = floorAt(SCENE, 0).pools[0][4];
  const deep = floorAt(SCENE, 1).pools[0][4];
  expect(deep).toBeGreaterThan(shallow);
});

test('a pool keeps its colour and its place when the depth changes', () => {
  const [hex, x, y, r] = floorAt(SCENE, 0.9).pools[1];
  expect([hex, x, y, r]).toEqual(['#204080', 0.2, 0.8, 0.3]);
});

/**
 * The night card is the Haram after dark: its light is the lamps, and lamps do not dim
 * because the water is deeper. It is also the one floor white type sits on, so a depth
 * slider reaching it would be a contrast bug rather than a look.
 */
test('the night card ignores the depth entirely', () => {
  const night: WaterScene = { ...SCENE, night: true, pale: '#0c131d', deep: '#0c131d', caus: 3, spec: 1.6 };
  const shallow = floorAt(night, 0);
  const deep = floorAt(night, 1);
  expect(deep.ground).toBe('#0c131d');
  expect(deep.caus).toBe(shallow.caus);
  expect(deep.spec).toBe(shallow.spec);
  expect(deep.pools[0][4]).toBe(shallow.pools[0][4]);
});

/**
 * jsdom has no WebGL, and `vitest.setup.ts` returns null for every context but 2d — which
 * is what a real browser without WebGL2 does too. The box must survive it: the CSS ground
 * and the still picture stay, and only the motion is lost.
 */
test('createWater declines rather than throwing where there is no WebGL2', () => {
  const canvas = document.createElement('canvas');
  expect(createWater(canvas, { reduced: false, floor: floorAt(SCENE, DEPTH) })).toBeNull();
});

/** The wrapper hands back a handle before there is anything behind it, so both of its
 *  methods have to be safe on a box that was scrolled past before it ever built. */
test('a deferred water can be destroyed before it has built anything', () => {
  const water = createWaterWhenNear(document.createElement('canvas'), {
    reduced: false, floor: floorAt(SCENE, DEPTH),
  });
  expect(() => water.destroy()).not.toThrow();
});

test('stirring a deferred water that has not built yet does nothing rather than throwing', () => {
  const water = createWaterWhenNear(document.createElement('canvas'), {
    reduced: false, floor: floorAt(SCENE, DEPTH),
  });
  expect(() => water.stir(0.5, 0.5)).not.toThrow();
  water.destroy();
});
