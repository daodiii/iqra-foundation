/**
 * MOCK 14 Lyset: where the sun and the moon stand over Oslo at a given moment, and the colour of
 * the sky that goes with it. The positions are Vladimir Agafonkin's SunCalc formulas (BSD-2), cut
 * down to what the hero needs: altitude and azimuth of each body, and the moon's lit fraction.
 * Accurate to a fraction of a degree, far finer than a cast on a screen can show.
 */

const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;
const OBLIQUITY = RAD * 23.4397;

/** Oslo sentrum, the same point the Kontakt map is stitched round. */
export const OSLO = { lat: 59.9138, lng: 10.75 };

const toDays = (ms: number) => ms / DAY_MS - 0.5 + J1970 - J2000;
const rightAscension = (l: number, b: number) => Math.atan2(Math.sin(l) * Math.cos(OBLIQUITY) - Math.tan(b) * Math.sin(OBLIQUITY), Math.cos(l));
const declination = (l: number, b: number) => Math.asin(Math.sin(b) * Math.cos(OBLIQUITY) + Math.cos(b) * Math.sin(OBLIQUITY) * Math.sin(l));
const sidereal = (d: number, lw: number) => RAD * (280.16 + 360.9856235 * d) - lw;

function sunCoords(d: number) {
  const m = RAD * (357.5291 + 0.98560028 * d);
  const c = RAD * (1.9148 * Math.sin(m) + 0.02 * Math.sin(2 * m) + 0.0003 * Math.sin(3 * m));
  const l = m + c + RAD * 102.9372 + Math.PI;
  return { dec: declination(l, 0), ra: rightAscension(l, 0) };
}

function moonCoords(d: number) {
  const L = RAD * (218.316 + 13.176396 * d);
  const M = RAD * (134.963 + 13.064993 * d);
  const F = RAD * (93.272 + 13.22935 * d);
  const l = L + RAD * 6.289 * Math.sin(M);
  const b = RAD * 5.128 * Math.sin(F);
  return { ra: rightAscension(l, b), dec: declination(l, b), dist: 385001 - 20905 * Math.cos(M) };
}

/** Altitude above the horizon and azimuth (from south, positive to the west), both in radians. */
export type Place = { alt: number; az: number };

function place(ra: number, dec: number, d: number): Place {
  const lw = RAD * -OSLO.lng;
  const phi = RAD * OSLO.lat;
  const H = sidereal(d, lw) - ra;
  return {
    az: Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)),
    alt: Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)),
  };
}

export function sunAt(ms: number): Place {
  const d = toDays(ms);
  const c = sunCoords(d);
  return place(c.ra, c.dec, d);
}

export function moonAt(ms: number): Place & { lit: number } {
  const d = toDays(ms);
  const m = moonCoords(d);
  const s = sunCoords(d);
  const at = place(m.ra, m.dec, d);
  const phi = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra));
  const inc = Math.atan2(149598000 * Math.sin(phi), m.dist - 149598000 * Math.cos(phi));
  return { ...at, lit: (1 + Math.cos(inc)) / 2 };
}

/**
 * The last time before `ms` the sun's altitude crossed `deg` in the given direction (up: rising),
 * found by stepping back five minutes at a time and halving the last step. Null if not in a day.
 */
export function lastCrossing(ms: number, deg: number, up: boolean): number | null {
  const above = (t: number) => sunAt(t).alt > deg * RAD;
  let t = ms;
  for (let i = 0; i < 24 * 12; i++) {
    const prev = t - 300000;
    if (above(prev) !== above(t) && above(t) === up) {
      let lo = prev;
      let hi = t;
      for (let k = 0; k < 12; k++) {
        const mid = (lo + hi) / 2;
        if (above(mid) === up) hi = mid;
        else lo = mid;
      }
      return hi;
    }
    t = prev;
  }
  return null;
}

/**
 * The sky's colour for the sun's altitude in degrees, flat, in the guide's palette: the guide's
 * navy all night, the crimson where the sun meets the horizon, the light by day with a breath of the
 * turquoise when it is high. Between the stops the colours are mixed in linear light.
 */
const STOPS: [number, string][] = [
  [-10, '#2c394b'],
  [-5, '#463f55'],
  [-1.5, '#7e4a5c'],
  [1, '#ab5261'],
  [4, '#d4a4ab'],
  [9, '#ecebec'],
  [18, '#e8f3f2'],
  [35, '#d9eeed'],
];

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const toSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
const LIN = STOPS.map(([deg, h]) => [deg, hex(h).map(toLin)] as const);

export type Rgb = readonly [number, number, number];

/** The sky at this altitude (degrees), in linear light. */
export function skyAt(deg: number): Rgb {
  if (deg <= LIN[0][0]) return LIN[0][1] as unknown as Rgb;
  for (let i = 1; i < LIN.length; i++) {
    const [d1, c1] = LIN[i];
    if (deg <= d1) {
      const [d0, c0] = LIN[i - 1];
      const t = (deg - d0) / (d1 - d0);
      return [0, 1, 2].map((k) => c0[k] + (c1[k] - c0[k]) * t) as unknown as Rgb;
    }
  }
  return LIN[LIN.length - 1][1] as unknown as Rgb;
}

/** Mix two linear colours, `t` of the second. */
export const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const NAVY_DEEPEST: Rgb = hex('#141f2d').map(toLin) as unknown as Rgb;
export const css = (c: Rgb) => `rgb(${c.map((v) => Math.round(toSrgb(Math.max(0, Math.min(1, v))) * 255)).join(' ')})`;
/** Relative luminance (WCAG), from linear light. */
export const luminance = (c: Rgb) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
