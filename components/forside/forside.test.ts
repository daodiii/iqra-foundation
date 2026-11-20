import { describe, expect, test } from 'vitest';
import { toPoster, toStrip } from './Forside';
import { wavePath } from './Hero';
import { DARK, HOLD, layerAt } from './Lagene';
import { stateAt } from './Pour';
import { luminance, toneOf } from './Topp';
import { nearest } from './Trinn';
import { snapTarget } from './Spor';

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
  test('white first, then the paragraph, then the poster’s title, lead and second paragraph', () => {
    expect(stateAt(0.1)).toEqual({ tx: false, h: false, lead: false, more: false });
    expect(stateAt(0.3)).toEqual({ tx: true, h: false, lead: false, more: false });
    expect(stateAt(0.65)).toEqual({ tx: true, h: true, lead: false, more: false });
    expect(stateAt(0.9)).toEqual({ tx: true, h: true, lead: true, more: true });
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

describe('Sporet on a touch screen: a swipe settles on the next panel in its direction', () => {
  const top = 1000;
  const travel = 2000;
  const stops = [1000, 1700, 2400, 3000];
  test('down past a stop: on to the next one ahead', () => {
    expect(snapTarget(1900, 1700, stops, top, travel)).toBe(2400);
  });
  test('up: back to the one behind', () => {
    expect(snapTarget(2200, 2400, stops, top, travel)).toBe(1700);
  });
  test('at either end of the section, or not moving, it stays', () => {
    expect(snapTarget(1000, 900, stops, top, travel)).toBeNull();
    expect(snapTarget(3000, 2800, stops, top, travel)).toBeNull();
    expect(snapTarget(1900, 1900, stops, top, travel)).toBeNull();
  });
});
