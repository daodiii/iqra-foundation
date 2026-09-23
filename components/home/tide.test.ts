import { describe, expect, test } from 'vitest';
import { areas } from './areas';
import { groundAt, INK_AT, inkAt, nearestPage, SEA_ORDER, seaAreas, seaAt, STEPS } from './tide';

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
  test('at the first field: the first floor alone', () => {
    expect(seaAt(0)).toEqual({ i: 0, t: 0 });
  });

  test('half way between two fields the tide is half way across', () => {
    expect(seaAt(0.5)).toEqual({ i: 0, t: 0.5 });
  });

  test('a field between two tides is the start of the next: 1 is the second tide at 0', () => {
    expect(seaAt(1)).toEqual({ i: 1, t: 0 });
  });

  test('at the last field the tide has come all the way in from the third', () => {
    expect(seaAt(3)).toEqual({ i: 2, t: 1 });
  });
});

describe('groundAt', () => {
  test('the CSS ground is the next area’s token over the current one’s, the tide as a percentage', () => {
    expect(groundAt(0)).toBe('color-mix(in srgb, var(--color-area-samfunnsdeltakelse) 0.0%, var(--color-area-kunnskap))');
    expect(groundAt(1.25)).toBe('color-mix(in srgb, var(--color-area-dialog) 25.0%, var(--color-area-samfunnsdeltakelse))');
    expect(groundAt(3)).toBe('color-mix(in srgb, var(--color-area-moteplasser) 100.0%, var(--color-area-dialog))');
  });
});

describe('inkAt', () => {
  test('the words keep the field they are on until the next one’s tide is INK_AT across, then take it', () => {
    expect(inkAt(0)).toBe(0);
    expect(inkAt(0.5)).toBe(0);
    expect(inkAt(INK_AT)).toBe(0);
    expect(inkAt(INK_AT + 0.01)).toBe(1);
    expect(inkAt(1)).toBe(1);
    expect(inkAt(2.9)).toBe(3);
    expect(inkAt(3)).toBe(3);
  });

  test('coming back, the same line: from 2 towards 1 the words are 2’s until the tide is back past 1.72', () => {
    expect(inkAt(1.8)).toBe(2);
    expect(inkAt(1.7)).toBe(1);
  });
});

describe('nearestPage', () => {
  // four pages, their centres 500 px apart; the slack 30 px
  const centres = [1000, 1500, 2000, 2500];

  test('the page whose centre is on the line', () => {
    expect(nearestPage(centres, 2000, 0, 30)).toBe(2);
  });

  test('the page showing keeps the sea until another is nearer by the slack, so a page half way between two does not flicker', () => {
    expect(nearestPage(centres, 1760, 1, 30)).toBe(1);
    expect(nearestPage(centres, 1790, 1, 30)).toBe(2);
    expect(nearestPage(centres, 1740, 2, 30)).toBe(2);
    expect(nearestPage(centres, 1710, 2, 30)).toBe(1);
  });

  test('a long way at once: from the first page straight to the last, and back', () => {
    expect(nearestPage(centres, 2600, 0, 30)).toBe(3);
    expect(nearestPage(centres, 0, 3, 30)).toBe(0);
  });
});
