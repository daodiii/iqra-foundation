import { describe, expect, test } from 'vitest';
import { areas } from './areas';
import { groundAt, SEA_ORDER, seaAreas, seaAt, STEPS } from './tide';

describe('the stage', () => {
  test('three steps between the four fields, and the stage is built for exactly that', () => {
    expect(STEPS).toBe(3);
    expect(STEPS).toBe(seaAreas.length - 1);
  });
});

describe('the order on the sea', () => {
  test('the owner’s: navy, burgundy, turquoise, and white last — every area once, each in its own colour', () => {
    expect(SEA_ORDER).toEqual(['kunnskap', 'samfunnsdeltakelse', 'dialog', 'moteplasser']);
    expect(seaAreas.map((a) => a.ground)).toEqual(['navy', 'crimson', 'turquoise', 'light']);
    expect([...seaAreas].sort((a, b) => a.key.localeCompare(b.key))).toEqual([...areas].sort((a, b) => a.key.localeCompare(b.key)));
  });

});

describe('seaAt', () => {
  test('at the first field: the first floor alone, its words up and live, the others down', () => {
    const f = seaAt(0);
    expect(f.i).toBe(0);
    expect(f.t).toBe(0);
    expect(f.words.map((w) => w.on)).toEqual([1, 0, 0, 0]);
    expect(f.words.map((w) => w.live)).toEqual([true, false, false, false]);
  });

  test('halfway between two fields the tide is halfway across and no words are on the water', () => {
    const f = seaAt(0.5);
    expect(f.i).toBe(0);
    expect(f.t).toBe(0.5);
    expect(f.words.every((w) => w.on === 0 && !w.live)).toBe(true);
  });

  test('a field’s words go before its tide is a third out, and the next’s rise over the last quarter, once the tide has crossed their page', () => {
    // going: two tenths out, two thirds up; gone by 0.36
    expect(seaAt(2.2).words[2].on).toBeCloseTo(2 / 3, 10);
    expect(seaAt(2.2).words[2].live).toBe(true);
    expect(seaAt(2.4).words[2]).toEqual({ on: 0, live: false });
    // coming: nothing at 0.7 of the tide, a quarter up at 0.8, up at 0.98 and at the stop
    expect(seaAt(2.7).words[3]).toEqual({ on: 0, live: false });
    expect(seaAt(2.8).words[3].on).toBeCloseTo(0.25, 10);
    expect(seaAt(2.8).words[3].live).toBe(true);
    expect(seaAt(2.98).words[3].on).toBe(1);
    expect(seaAt(1).words[1].on).toBe(1);
  });

  test('at the last field the tide has come all the way in from the third', () => {
    const f = seaAt(3);
    expect(f.i).toBe(2);
    expect(f.t).toBe(1);
    expect(f.words[3]).toEqual({ on: 1, live: true });
  });

  test('two fields’ words never share the water', () => {
    for (let u = 0; u <= 3; u += 0.01) {
      expect(seaAt(u).words.filter((w) => w.on > 0).length).toBeLessThanOrEqual(1);
    }
  });
});

describe('groundAt', () => {
  test('the CSS ground is the next area’s token over the current one’s, the tide as a percentage', () => {
    expect(groundAt(0)).toBe('color-mix(in srgb, var(--color-area-samfunnsdeltakelse) 0.0%, var(--color-area-kunnskap))');
    expect(groundAt(1.25)).toBe('color-mix(in srgb, var(--color-area-dialog) 25.0%, var(--color-area-samfunnsdeltakelse))');
    expect(groundAt(3)).toBe('color-mix(in srgb, var(--color-area-moteplasser) 100.0%, var(--color-area-dialog))');
  });
});
