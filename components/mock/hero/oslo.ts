/**
 * MOCKS 16–18: the moment the hybrids show, and the sky over Oslo at it (14 Lyset's light): the
 * sky, the floor, where a replay of the day starts, and what the name casts. `?t=14:30` (today in
 * Oslo) or a full date shows another moment.
 */
import { css, lastCrossing, luminance, mix, moonAt, NAVY_DEEPEST, skyAt, sunAt, type Rgb } from './himmel';

const DEG = 180 / Math.PI;
export const clock = new Intl.DateTimeFormat('nb-NO', { timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit' });

export function momentFromQuery(): number {
  const q = new URLSearchParams(window.location.search).get('t');
  const now = Date.now();
  if (!q) return now;
  const hm = /^(\d{1,2}):(\d{2})$/.exec(q);
  if (hm) {
    const [h, m] = clock.format(now).split(':').map(Number);
    return now + (Number(hm[1]) * 60 + Number(hm[2]) - (h * 60 + m)) * 60000;
  }
  const t = Date.parse(q);
  return Number.isNaN(t) ? now : t;
}

/** The sky over Oslo at `ms`, and the ink that reads on it. */
export function skyOver(ms: number): { sky: Rgb; color: string; floor: string; deg: number; ink: 'light' | 'dark'; afterglow: boolean } {
  const deg = sunAt(ms).alt * DEG;
  const sky = skyAt(deg);
  // The floor is the sky a step darker: a small step by day, a deeper one where the sun meets the horizon and at night (14 Lyset's).
  const floor = mix(sky, NAVY_DEEPEST, 0.1 + 0.32 * Math.max(0, 1 - Math.abs(deg) / 7) + 0.45 * Math.min(1, Math.max(0, -deg / 10)));
  return { sky, color: css(sky), floor: css(floor), deg, ink: luminance(sky) > 0.3 ? 'dark' : 'light', afterglow: deg > -4.5 && deg < 3.5 };
}

/** Where a replay of the day up to `ms` starts: first light by day, last sunset at night, 75 minutes back at dusk or dawn. */
export function replayFrom(ms: number): number {
  const deg = sunAt(ms).alt * DEG;
  if (deg > 2) return lastCrossing(ms, -10, true) ?? lastCrossing(ms, -0.8, true) ?? ms - 3 * 3600000;
  if (deg < -1) return lastCrossing(ms, -0.8, false) ?? ms - 3 * 3600000;
  return ms - 75 * 60000;
}

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/**
 * What the name casts on the floor at `ms`: by the sun, or at night by the moon (as strong as it is
 * full, only while it is up). `skew` and `squash` are the matrix's c and d, in the name's heights;
 * `strength` 0..1. Where it would fall behind the name (the sun in the north, a summer evening) it
 * is not drawn, rather than drawn wrong: the floor behind the name is not on the screen.
 */
export function castAt(ms: number, flat = 0.3): { skew: number; squash: number; strength: number } {
  const sun = sunAt(ms);
  const deg = sun.alt * DEG;
  let source = sun;
  let strength = clamp((deg + 0.5) / 4);
  if (deg < -1) {
    const moon = moonAt(ms);
    const m = moon.lit * clamp((moon.alt * DEG) / 4) * clamp((-deg - 4) / 6) * 0.7;
    if (m > strength) {
      source = moon;
      strength = m;
    }
  }
  const run = Math.min(7, 1 / Math.tan(Math.max(source.alt, 0.5 / DEG)));
  const right = -Math.sin(source.az);
  const toward = Math.cos(source.az);
  return { skew: -run * right, squash: -run * Math.max(toward, 0) * flat, strength: strength * clamp(toward / 0.3) };
}
