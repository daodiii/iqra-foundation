import { TOP } from './tree';

/*
 * The arch: one stroke across the box, drawn with the tree's pen as the tree grows, and
 * the opening it makes. Geometry only. Nothing here touches a canvas except `trace` and
 * `drawStroke`, so the shapes are tested where there is no canvas at all.
 *
 * Two shapes. On a desktop it is a circle's arc through the apex and both feet, the feet on
 * the box's floor near its corners. In flow (under 1100px) it has legs — a half circle on
 * two uprights — because a circle wide enough for a phone's arch area would be taller than
 * the area. Both are a path of arcs and lines walked by length, so the pen and the stroke
 * come from one description.
 */

const TAU = Math.PI * 2;
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

export type Seg =
  | { type: 'arc'; cx: number; cy: number; r: number; a0: number; a1: number }
  | { type: 'line'; x0: number; y0: number; x1: number; y1: number };

export type ArchPath = {
  length: number;
  /** Where the pen is, `p` of the way along: 0 is the left foot, 1 the right. */
  pointAt(p: number): [number, number];
  /** Stroke the path up to `p` in the context's current style. */
  trace(ctx: CanvasRenderingContext2D, p: number): void;
};

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

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const segLength = (s: Seg) =>
  s.type === 'arc' ? Math.abs(s.a1 - s.a0) * s.r : Math.hypot(s.x1 - s.x0, s.y1 - s.y0);
const segPoint = (s: Seg, f: number): [number, number] => {
  if (s.type === 'arc') {
    const a = s.a0 + (s.a1 - s.a0) * f;
    return [s.cx + Math.cos(a) * s.r, s.cy + Math.sin(a) * s.r];
  }
  return [s.x0 + (s.x1 - s.x0) * f, s.y0 + (s.y1 - s.y0) * f];
};

/** A path of arcs and straight lines, walked by length. */
export function makePath(segs: Seg[]): ArchPath {
  const len = segs.map(segLength);
  const total = len.reduce((a, b) => a + b, 0);
  return {
    length: total,
    pointAt(p) {
      let d = clamp(p, 0, 1) * total;
      for (let i = 0; i < segs.length; i++) {
        if (d <= len[i] || i === segs.length - 1) return segPoint(segs[i], len[i] ? Math.min(1, d / len[i]) : 1);
        d -= len[i];
      }
      return segPoint(segs[0], 0);
    },
    trace(ctx, p) {
      let d = clamp(p, 0, 1) * total;
      for (let i = 0; i < segs.length && d > 0; i++) {
        const s = segs[i];
        const f = Math.min(1, d / len[i]);
        ctx.beginPath();
        if (s.type === 'arc') ctx.arc(s.cx, s.cy, s.r, s.a0, s.a0 + (s.a1 - s.a0) * f);
        else {
          const [x, y] = segPoint(s, f);
          ctx.moveTo(s.x0, s.y0);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        d -= len[i];
      }
    },
  };
}

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

/**
 * The stroke, in the tree's pen: a rose glow under a navy line, and while it is still being
 * drawn, the pen itself — the seed's crimson. The caller clears the canvas.
 */
export function drawStroke(ctx: CanvasRenderingContext2D, path: ArchPath, p: number): void {
  if (p <= 0) return;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(196,122,156,0.5)';
  ctx.shadowBlur = 14;
  ctx.strokeStyle = 'rgba(196,122,156,0.55)';
  ctx.lineWidth = 1.6;
  path.trace(ctx, p);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(42,57,75,0.62)';
  ctx.lineWidth = 1.3;
  path.trace(ctx, p);
  if (p >= 1) return;
  const [x, y] = path.pointAt(p);
  const g = ctx.createRadialGradient(x, y, 0, x, y, 26);
  g.addColorStop(0, 'rgba(171,82,99,0.55)');
  g.addColorStop(1, 'rgba(171,82,99,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, 26, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(171,82,99,0.95)';
  ctx.beginPath();
  ctx.arc(x, y, 2.6, 0, TAU);
  ctx.fill();
}
