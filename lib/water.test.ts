import { describe, expect, test } from 'vitest';
import { createWater, createWaterWhenNear, DEPTH, floorAt, TIDE_BAND, tideMix, tidePools, type WaterFloor, type WaterScene } from './water';

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

test('calm water is an option, and declines where there is no WebGL2 like any other', () => {
  const canvas = document.createElement('canvas');
  expect(createWater(canvas, { reduced: false, floor: floorAt(SCENE, DEPTH), calm: true })).toBeNull();
});

/*
 * The tide (Havet, 2026-09-17): the JS twins of the shader's `mixAt` and of its pool list,
 * tested here because jsdom has no WebGL2. The GLSL is the same expression and says so. The
 * invariant every other box of water on the site rests on — tide 0, every pool on side A,
 * is the old shader — is `tideMix(0, x) = 0` everywhere.
 */
describe('the tide', () => {
  test('at 0 the first floor is the whole floor, at 1 the second is, edge to edge', () => {
    for (const x of [0, 0.25, 0.5, 0.75, 1]) {
      expect(tideMix(0, x)).toBe(0);
      expect(tideMix(1, x)).toBe(1);
    }
  });

  test('halfway in, the edge stands at the middle of the width and is one band wide', () => {
    expect(tideMix(0.5, 0.5)).toBeCloseTo(0.5, 10);
    expect(tideMix(0.5, 0.5 - TIDE_BAND / 2)).toBe(1);
    expect(tideMix(0.5, 0.5 + TIDE_BAND / 2)).toBe(0);
    expect(tideMix(0.5, 0.49)).toBeGreaterThan(tideMix(0.5, 0.51));
  });

  test('the band is 0.08 of the width: soft enough to be water, sharp enough to read as a line', () => {
    expect(TIDE_BAND).toBe(0.08);
  });

  const ALPHA = [0.4, 0.5, 0.6, 0.7];
  const floorWith = (n: number, hex: string): WaterFloor => ({
    ...floorAt(SCENE, DEPTH),
    pools: Array.from({ length: n }, (_, i) => [hex, 0.1 * i, 0.2, 0.3, ALPHA[i]] as const),
  });

  test('three pools of each floor, the first three, each on its side; a fourth is dropped', () => {
    const pools = tidePools(floorWith(4, '#ff0000'), floorWith(4, '#0000ff'));
    expect(pools).toHaveLength(6);
    expect(pools.map((p) => p.side)).toEqual([0, 0, 0, 1, 1, 1]);
    expect(pools.map((p) => p.a)).toEqual([0.4, 0.5, 0.6, 0.4, 0.5, 0.6]);
    expect(pools[0].colour).toEqual([1, 0, 0]);
    expect(pools[3].colour).toEqual([0, 0, 1]);
  });

  test('a floor with fewer pools keeps them all', () => {
    expect(tidePools(floorWith(2, '#ff0000'), floorWith(4, '#0000ff'))).toHaveLength(5);
  });

  test('the second floor’s pools wander on phases of their own, not in step with the first’s', () => {
    const pools = tidePools(floorWith(3, '#ff0000'), floorWith(3, '#0000ff'));
    expect(new Set(pools.map((p) => p.phase)).size).toBe(6);
  });

  test('retuning a deferred water that has not built yet does nothing rather than throwing', () => {
    const water = createWaterWhenNear(document.createElement('canvas'), { reduced: false, floor: floorAt(SCENE, DEPTH) });
    expect(() => water.retune(floorAt(SCENE, 0), floorAt(SCENE, 1), 0.5)).not.toThrow();
    water.destroy();
  });
});
