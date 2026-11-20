import { describe, expect, test } from 'vitest';
import { toPoster, toStrip } from './Forside';
import { wavePath } from './Hero';
import { DARK, HOLD, layerAt } from './Lagene';
import { CLOSE, OPEN, OPEN_MS, PARA, stateAt, stepOpen, WHY } from './Pour';
import { luminance, toneOf } from './Topp';
import { nearest } from './Trinn';
import { touchTarget } from '@/lib/steps';

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

describe('Lagene: the section behind holds back at half speed and darkens 30%', () => {
  test('nothing until the next section’s edge is on screen', () => {
    expect(layerAt(800, 800)).toBeNull();
    expect(layerAt(-800, 800)).toBeNull();
  });

  test('half way in: held back a quarter screen, darkened 15%', () => {
    expect(layerAt(400, 800)).toEqual({ y: 800 * HOLD * 0.5, d: DARK * 0.5 });
  });

  test('fully over: held back half a screen, darkened 30%', () => {
    expect(layerAt(0, 800)).toEqual({ y: 400, d: 0.3 });
  });
});

describe('the pour scene, step by step', () => {
  test('as the dot opens: the poster’s title, then its lead, then its second paragraph', () => {
    expect(stateAt(0.3)).toEqual({ h: false, lead: false, more: false });
    expect(stateAt(0.65)).toEqual({ h: true, lead: false, more: false });
    expect(stateAt(0.85)).toEqual({ h: true, lead: true, more: false });
    expect(stateAt(1)).toEqual({ h: true, lead: true, more: true });
  });

  test('the dot opens on its clock in OPEN_MS, and closes faster', () => {
    let o = 0;
    for (let t = 0; t < OPEN_MS; t += 16) o = stepOpen(o, 1, 16);
    expect(o).toBe(1);
    expect(stepOpen(0.5, 1, OPEN_MS / 2)).toBe(1);
    expect(stepOpen(1, 0, OPEN_MS * 0.3)).toBeCloseTo(0.5);
    expect(stepOpen(0.4, 0.4, 100)).toBe(0.4);
  });

  test('the beats come in order: white, paragraph, called, poster, inside the scene', () => {
    expect(CLOSE).toBeLessThan(OPEN);
    expect(1 < PARA && PARA < CLOSE && OPEN < WHY && WHY < 2.1).toBe(true);
  });

  test('the pour’s surface spans the lockup and closes below it for the clip', () => {
    const open = wavePath(500, 10, 0, false);
    const closed = wavePath(500, 10, 0, true);
    expect(open.startsWith('M139.6 ')).toBe(true);
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
  test('at either end of a zone, outside one, or not moving, it stays', () => {
    expect(touchTarget(1000, 900, zones)).toBeUndefined();
    expect(touchTarget(3000, 2800, zones)).toBeUndefined();
    expect(touchTarget(500, 300, zones)).toBeUndefined();
    expect(touchTarget(1900, 1900, zones)).toBeUndefined();
  });
});
