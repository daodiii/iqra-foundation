import type { CSSProperties } from 'react';
import type { InkPalette, Pigment } from '@/lib/ink';
import { floorAt, mixHex, type WaterFloor, type WaterScene } from '@/lib/water';
import { WATER_DEPTH } from '@/lib/film';
import type { Tone } from '@/components/materials/Box';

/**
 * The mock's question, as data: a section is a material on a ground with a pigment in it,
 * and every combination of the guide's colours is derived here from the five hexes so the
 * page can switch between them live. Nothing here is a design decision; it is the space
 * the decision is made in. What is chosen goes into `lib/film.ts` as one palette per
 * material, the way `brand.ink` and `brand.water` are written today.
 */

export type GroundName = 'white' | 'light' | 'navy' | 'turquoise' | 'crimson';
export type PigmentName = 'navy' | 'turquoise' | 'crimson' | 'light' | 'mixed';
export type MaterialName = 'ink' | 'water' | 'flat';

export type Look = { material: MaterialName; ground: GroundName; pigment: PigmentName };

export const GROUNDS: readonly GroundName[] = ['white', 'light', 'navy', 'turquoise', 'crimson'];
export const PIGMENTS: readonly PigmentName[] = ['navy', 'turquoise', 'crimson', 'light', 'mixed'];
export const MATERIALS: readonly MaterialName[] = ['ink', 'water', 'flat'];

/** The guide's five, as `app/globals.css` prints them. */
export const HEX: Record<GroundName, string> = {
  white: '#ffffff',
  light: '#f0f0f1',
  navy: '#2c394b',
  turquoise: '#67c1bf',
  crimson: '#ab5261',
};

const W = HEX.white;
const L = HEX.light;
const N = HEX.navy;
const T = HEX.turquoise;
const C = HEX.crimson;
/** The turquoise three fifths into white: `--color-turquoise-mid`. */
const T_MID = '#a3dad8';
/** Crimson 55% into white: `--color-crimson-lift`, the tone that reads on navy. */
const C_LIFT = mixHex(C, W, 0.45);

/** The user's slider, kept from the draft (see `lib/film.ts`). */
const INK_LOAD = 0.55 / 0.7;

/** A navy or a crimson box is dark: its cards take light type, navy frost and the light pen. */
export function toneOf(ground: GroundName): Tone {
  return ground === 'navy' || ground === 'crimson' ? 'dark' : 'light';
}

/**
 * Pigment on paper, subtractive: one hue family per palette, the dark rarest (see the
 * note on weights in `lib/ink.ts`). On a pale ground.
 */
const STAIN: Record<PigmentName, readonly Pigment[]> = {
  turquoise: [[T, 3], [T_MID, 3], [N, 1]],
  navy: [[N, 1], [mixHex(N, W, 0.5), 3], [T, 2]],
  crimson: [[C, 1], [mixHex(C, W, 0.5), 3], [mixHex(C, W, 0.75), 2]],
  light: [[T_MID, 3], [mixHex(T, W, 0.8), 3]],
  mixed: [[T, 3], [T_MID, 2], [N, 1], [C, 1]],
};

/** Light in dark water, additive: the pigments add to a navy or crimson ground. */
const GLOW: Record<PigmentName, readonly Pigment[]> = {
  light: [[L, 2], [T_MID, 2], [T, 1]],
  turquoise: [[T, 3], [T_MID, 2], [L, 1]],
  crimson: [[C_LIFT, 3], [mixHex(C, W, 0.75), 2]],
  navy: [[mixHex(N, W, 0.5), 3], [T, 1]],
  mixed: [[T, 2], [C_LIFT, 1], [L, 1]],
};

export function inkPaletteFor(ground: GroundName, pigment: PigmentName): InkPalette {
  if (toneOf(ground) === 'dark') {
    return { ink: GLOW[pigment], ground: HEX[ground], additive: true, strength: 0.7 };
  }
  return {
    ink: STAIN[pigment],
    ground: HEX[ground],
    strength: 0.9 * INK_LOAD,
    peak: 0.3 * INK_LOAD,
  };
}

/** The colour the pools of water carry for a pigment: its mid tint. */
function poolTint(pigment: PigmentName): string {
  switch (pigment) {
    case 'turquoise': return T_MID;
    case 'navy': return mixHex(N, W, 0.45);
    case 'crimson': return C_LIFT;
    case 'light': return L;
    case 'mixed': return T_MID;
  }
}

export function waterSceneFor(ground: GroundName, pigment: PigmentName): WaterScene {
  const tint = poolTint(pigment);
  if (toneOf(ground) === 'dark') {
    // Night: the pools are light in dark water and the depth ramp is not wanted.
    const second = pigment === 'mixed' ? C_LIFT : L;
    return {
      pale: HEX[ground],
      deep: HEX[ground],
      night: true,
      pools: [
        [tint, 0.2, 0.82, 0.5, 0.35],
        [second, 0.8, 0.22, 0.42, 0.14],
        [tint, 0.58, 0.62, 0.5, 0.28],
      ],
    };
  }
  const g = HEX[ground];
  const shade = pigment === 'mixed' ? C : N;
  return {
    pale: mixHex(W, g, 0.16),
    deep: g,
    pools: [
      [L, 0.2, 0.82, 0.5, 0.55],
      [shade, 0.8, 0.22, 0.42, 0.16],
      [tint, 0.58, 0.62, 0.5, 0.45],
      [N, 0.1, 0.16, 0.34, 0.1],
    ],
  };
}

export function waterFloorFor(ground: GroundName, pigment: PigmentName): WaterFloor {
  return floorAt(waterSceneFor(ground, pigment), WATER_DEPTH);
}

/** `color-mix` of a hex at an alpha, for the CSS stills. */
function at(hex: string, pct: number): string {
  return `color-mix(in srgb, ${hex} ${Math.round(pct * 100)}%, transparent)`;
}

/**
 * The still a box shows before its simulation runs, and on a device that declines it:
 * `--ground` and `--still` for the box's inline style, mixed from the same colours the
 * shaders are handed.
 */
export function stillFor(look: Look): CSSProperties {
  if (look.material === 'ink') {
    const p = inkPaletteFor(look.ground, look.pigment);
    const [a, b, c = b] = p.ink.map(([hex]) => hex);
    const k = p.additive ? 0.6 : 1;
    return {
      '--ground': p.ground,
      '--still': [
        `radial-gradient(58% 42% at 16% 20%, ${at(a, 0.42 * k)} 0%, transparent 68%)`,
        `radial-gradient(62% 46% at 80% 30%, ${at(b, 0.55 * k)} 0%, transparent 70%)`,
        `radial-gradient(50% 40% at 42% 78%, ${at(a, 0.3 * k)} 0%, transparent 68%)`,
        `radial-gradient(38% 32% at 86% 82%, ${at(c, 0.12 * k)} 0%, transparent 70%)`,
      ].join(', '),
    } as CSSProperties;
  }
  if (look.material === 'water') {
    const floor = waterFloorFor(look.ground, look.pigment);
    // The shader mixes each pool over the ones before it; a CSS list paints the first on top.
    const layers = [...floor.pools].reverse().map(([hex, x, y, r, a]) =>
      `radial-gradient(${Math.round(r * 90)}% ${Math.round(r * 100)}% at ${Math.round(x * 100)}% ${Math.round((1 - y) * 100)}%, ${at(hex, Math.min(0.9, a * 0.9))} 0%, transparent 70%)`);
    return { '--ground': floor.ground, '--still': layers.join(', ') } as CSSProperties;
  }
  return { '--ground': HEX[look.ground], '--still': 'none' } as CSSProperties;
}

/** The hash form of a look, `ink.light.navy`, and back. */
export function lookToString(l: Look): string {
  return `${l.material}.${l.ground}.${l.pigment}`;
}

export function lookFromString(s: string | undefined, fallback: Look): Look {
  if (!s) return fallback;
  const [m, g, p] = s.split('.');
  const ok = MATERIALS.includes(m as MaterialName) && GROUNDS.includes(g as GroundName) && PIGMENTS.includes(p as PigmentName);
  return ok ? { material: m as MaterialName, ground: g as GroundName, pigment: p as PigmentName } : fallback;
}
