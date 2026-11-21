import { describe, expect, test } from 'vitest';
import { toPoster, toStrip } from './Forside';
import { DOWN, flightGoal, UP, wavePath } from './Hero';
import { VIEWBOX } from './logo-paths';
import { CLOSE, PARA, RISE, RISEN, riseAt, stateAt, WHY } from './Pour';
import { luminance, toneOf } from './Topp';
import { nearest } from './Trinn';
import { touchTarget } from '@/lib/steps';
import { snapPoints } from './Takt';

describe('Kameleon: the header reads the ground under it', () => {
  test('white and the pale grounds are light; navy is dark; crimson is crimson', () => {
    expect(toneOf('rgb(255, 255, 255)')).toBe('light');
    expect(toneOf('rgb(16, 28, 50)')).toBe('dark'); // navy-deep
    expect(toneOf('rgb(27, 42, 74)')).toBe('dark'); // navy
    expect(toneOf('rgb(33, 113, 111)')).toBe('dark'); // teal: white text stays
    expect(toneOf('rgb(140, 35, 64)')).toBe('rod'); // burgundy
  });

  test('luminance is WCAG’s', () => {
    expect(luminance('rgb(255, 255, 255)')).toBeCloseTo(1);
    expect(luminance('rgb(0, 0, 0)')).toBe(0);
  });
});

describe('the pour scene, step by step', () => {
  test('as the crimson page rises: the poster’s title, then its lead, then its second paragraph', () => {
    expect(stateAt(0.3)).toEqual({ h: false, lead: false, more: false });
    expect(stateAt(0.65)).toEqual({ h: true, lead: false, more: false });
    expect(stateAt(0.85)).toEqual({ h: true, lead: true, more: false });
    expect(stateAt(1)).toEqual({ h: true, lead: true, more: true });
  });

  test('the crimson page rises with the scroll, with no clock: below RISE it is down, by RISEN it is up', () => {
    expect(riseAt(1)).toBe(0);
    expect(riseAt(RISE)).toBe(0);
    expect(riseAt((RISE + RISEN) / 2)).toBeCloseTo(0.5);
    expect(riseAt(RISEN)).toBe(1);
    expect(riseAt(WHY)).toBe(1);
  });

  test('the beats come in order: white, paragraph, rise, poster, inside the scene', () => {
    expect(1 < PARA && PARA < CLOSE && CLOSE <= RISE && RISE < RISEN && RISEN <= WHY && WHY < 2.1).toBe(true);
  });

  test('the pour’s surface spans the lockup and closes below it for the clip', () => {
    const open = wavePath(500, 10, 0, false);
    const closed = wavePath(500, 10, 0, true);
    // it starts 30 units left of the logo's frame
    expect(open.startsWith(`M${(VIEWBOX[0] - 30).toFixed(1)} `)).toBe(true);
    expect(closed.endsWith('Z')).toBe(true);
    expect(open).not.toContain('NaN');
  });
});

test('Trinnene: the part nearest the middle of the screen, among those on it', () => {
  const H = 1000;
  expect(nearest([{ top: -900, bottom: -100 }, { top: 300, bottom: 700 }, { top: 900, bottom: 1500 }], H)).toBe(1);
  expect(nearest([{ top: 1100, bottom: 1500 }], H)).toBe(-1);
});

describe('Aktuelt’s items', () => {
  const event = { slug: 'e', title: 'Foredrag', start: '2026-12-04', time: '18:00', end: null, place: 'Oslo', text: '', link: null, program: null, report: null, recording: null, image: null, area: null };

  test('an event as a poster: the day, the month and year, the time and place', () => {
    expect(toPoster(event)).toEqual({ slug: 'e', day: '04', month: 'Desember 2026', title: 'Foredrag', meta: 'kl. 18:00 · Oslo', dateTime: '2026-12-04T18:00' });
    expect(toPoster({ ...event, time: null }).meta).toBe('Oslo');
  });

  test('a news item leads to its article when it has one, else to the news', () => {
    const n = { slug: 'n', title: 'Nytt', date: '2026-11-12', summary: 'Kort.', image: null, body: null };
    expect(toStrip(n)).toEqual({ slug: 'n', date: '12. november 2026', dateTime: '2026-11-12', title: 'Nytt', summary: 'Kort.', href: '/aktuelt/nyheter' });
    expect(toStrip({ ...n, body: 'Tekst' }).href).toBe('/aktuelt/nyheter/n');
  });
});

describe('on a touch screen, a swipe that comes to rest settles on the next beat in its direction', () => {
  const zones = [[1000, 1700, 2400, 3000]];
  test('down past a beat: on to the next one ahead', () => {
    expect(touchTarget(1900, 1700, zones)).toBe(2400);
  });
  test('up: back to the one behind', () => {
    expect(touchTarget(2200, 2400, zones)).toBe(1700);
  });
  test('one swipe is one beat, counted from where it began: in from above, it stops at the first', () => {
    expect(touchTarget(1200, 500, zones)).toBe(1000);
    expect(touchTarget(2600, 1700, zones)).toBe(2400);
  });
  test('at either end of a zone, outside one, or not moving, it stays', () => {
    expect(touchTarget(1000, 900, zones)).toBeUndefined();
    expect(touchTarget(3000, 2800, zones)).toBeUndefined();
    expect(touchTarget(500, 300, zones)).toBeUndefined();
    expect(touchTarget(1900, 1900, zones)).toBeUndefined();
  });
});

test('a phone’s snap points: both carried parts’ beats and the section tops, merged, sorted, inside the page', () => {
  const beats = { zones: [[0, 971, 1519], [2616, 3117, 3634, 4135]], marks: [4980, 6203, 7923, 3120] };
  expect(snapPoints(beats, 9000)).toEqual([0, 971, 1519, 2616, 3117, 3634, 4135, 4980, 6203, 7923]);
  expect(snapPoints({ zones: [[0, 500]], marks: [12000] }, 9000)).toEqual([0, 500, 9000]);
});

test('the logo goes to the header once the page leaves the top, back to the hero at the top, and never stops between', () => {
  const H = 800;
  expect(flightGoal(H * UP + 1, H, 0)).toBe(1);
  expect(flightGoal(H * DOWN - 1, H, 1)).toBe(0);
  // between the two it keeps its way, so a page resting there gets the logo to one end, not half way
  expect(flightGoal(H * 0.04, H, 1)).toBe(1);
  expect(flightGoal(H * 0.04, H, 0)).toBe(0);
});

