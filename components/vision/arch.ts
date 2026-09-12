import { type ArchPath, makePath, TAU } from '@/lib/pen';
import { TOP } from './tree';

/*
 * The arch: one stroke across the box, drawn with the tree's pen as the tree grows, and
 * the opening it makes. Geometry only — the pen itself is `lib/pen.ts` — so the shapes are
 * tested where there is no canvas at all.
 *
 * Two shapes. On a desktop it is a circle's arc through the apex and both feet, the feet on
 * the box's floor near its corners. In flow (under 1100px) it has legs — a half circle on
 * two uprights — because a circle wide enough for a phone's arch area would be taller than
 * the area. Both are a path of arcs and lines walked by length, so the pen and the stroke
 * come from one description.
 */

/** The apex, as a fraction of the box's height; the feet, as a fraction of its width in from each edge. */
const APEX = 0.1;
const FOOT = 0.055;
/** In flow: the legs' distance from the area's edge and the apex's height, in px. */
const LEG_MARGIN = 18;
const PHONE_APEX = 96;
/** The widest the tree's stage gets. */
const STAGE_MAX = 800;
/**
 * How wide the renderer's crown is against its stage's height. Measured 0.814 at every
 * stage size — `fit` scales the figure uniformly — plus the blooms' halos outside the last
 * twigs. The stage is capped by this so the crown clears whatever stands beside it.
 */
export const CROWN = 0.85;

export type Arch = {
  path: ArchPath;
  /** The circle the arc lies on. */
  cx: number;
  cy: number;
  r: number;
  /** The top of the opening. */
  apex: number;
  /**
   * Whether a point is inside the opening. Arithmetic rather than `isPointInPath`, which
   * takes its point in device pixels and cost the mock the left half of its sky on every
   * 2× screen — and arithmetic runs in jsdom.
   */
  contains(x: number, y: number): boolean;
  /** How far along the path the pen is when each card surfaces: left, top, right. `sideY` is the side cards' centre. */
  surfaces(sideY: number): [number, number, number];
};

export type Rect = { left: number; top: number; width: number; height: number };

/** One arch across the whole box: the circle through the apex and both feet. */
export function desktopArch(W: number, H: number): Arch {
  const cx = W / 2;
  const apex = H * APEX;
  const half = cx - W * FOOT;
  const s = H - apex;
  const r = (half * half + s * s) / (2 * s);
  const cy = apex + r;
  /*
   * The feet's angles, on one turn: the left in (π/2, 3π/2) and the right a turn on, so the
   * arc from one to the other always goes over the top. On a wide, short box the feet sit
   * above the circle's centre and the left foot's raw angle is negative; adding 2π only to
   * the right foot, as the mock did, then sent the arc the long way round, under the floor.
   */
  let aL = Math.atan2(H - cy, -half);
  if (aL < 0) aL += TAU;
  const aR = Math.atan2(H - cy, half) + TAU;
  const angleOf = (x: number, y: number) => {
    let a = Math.atan2(y - cy, x - cx);
    while (a < aL) a += TAU;
    return a;
  };
  const progressOf = (a: number) => (a - aL) / (aR - aL);
  return {
    path: makePath([{ type: 'arc', cx, cy, r, a0: aL, a1: aR }]),
    cx, cy, r, apex,
    contains: (x, y) => y <= H && Math.hypot(x - cx, y - cy) <= r,
    // Each side card surfaces as the pen passes its flank at the card's own height; the top one at the apex.
    surfaces(sideY) {
      const dx = Math.sqrt(Math.max(0, r * r - (sideY - cy) * (sideY - cy)));
      return [progressOf(angleOf(cx - dx, sideY)), 0.5, progressOf(angleOf(cx + dx, sideY))];
    },
  };
}

/** In flow: a half circle on two legs, as wide as the arch area allows. */
export function phoneArch(W: number, H: number): Arch {
  const cx = W / 2;
  const apex = PHONE_APEX;
  // As wide as the area, unless the area is too short for that — a phone held sideways —
  // in which case the arc's centre stays 40px above the floor so the legs still exist.
  const r = Math.max(1, Math.min((W - 2 * LEG_MARGIN) / 2, H - apex - 40));
  const cy = apex + r;
  const xl = cx - r;
  const xr = cx + r;
  const path = makePath([
    { type: 'line', x0: xl, y0: H, x1: xl, y1: cy },
    { type: 'arc', cx, cy, r, a0: Math.PI, a1: TAU },
    { type: 'line', x0: xr, y0: cy, x1: xr, y1: H },
  ]);
  return {
    path, cx, cy, r, apex,
    contains: (x, y) => y <= H && (Math.hypot(x - cx, y - cy) <= r || (Math.abs(x - cx) <= r && y >= cy)),
    // The cards stand below the arch here; these only pace their arrival.
    surfaces: () => [0.3, 0.55, 0.8],
  };
}

/**
 * The tree's stage on a desktop: centred, its bottom at 0.95H, its crown — the renderer's
 * top margin — starting 14px under the top card, and no wider than the column between the
 * side cards. On a laptop the column is what bites, and the tree gets smaller in the same
 * place rather than putting its crown under the glass.
 */
export function desktopStage(W: number, H: number, cardBottom: number, column: number): Rect {
  const bottom = H * 0.95;
  const top = (cardBottom + 14 - TOP * bottom) / (1 - TOP);
  const height = Math.max(0, Math.min(bottom - top, (column - 24) / CROWN));
  const width = Math.min(STAGE_MAX, W);
  return { left: W / 2 - width / 2, top: bottom - height, width, height };
}

/**
 * The tree's stage in flow: sized to the arch's width so the crown clears the legs, and
 * standing in the middle of the room under the apex.
 */
export function phoneStage(arch: Arch, W: number, H: number): Rect {
  const room = Math.max(0, H - 36 - (arch.apex + 26));
  const height = Math.min((2 * arch.r - 24) / CROWN, room);
  const width = Math.min(STAGE_MAX, W);
  return { left: W / 2 - width / 2, top: arch.apex + 26 + (room - height) / 2, width, height };
}

/*
 * The pen itself lives in lib/pen.ts, where every box on the page is drawn with it too;
 * the section imports it from here so the arch and its pen stay one import.
 */
export { drawStroke, makePath } from '@/lib/pen';
export type { ArchPath, Seg } from '@/lib/pen';
