/*
 * The pen. One hand draws the arch in Visjon and the frame round every box on the page:
 * a rose glow under a navy line and, while a stroke is still being drawn, the seed's
 * crimson at its tip. Paths are arcs and straight lines walked by length, so the pen and
 * the stroke come from one description. Geometry only, until `drawStroke`; the shapes are
 * tested where there is no canvas at all.
 */

export const TAU = Math.PI * 2;

export type Seg =
  | { type: 'arc'; cx: number; cy: number; r: number; a0: number; a1: number }
  | { type: 'line'; x0: number; y0: number; x1: number; y1: number };

export type ArchPath = {
  length: number;
  /** Where the pen is, `p` of the way along: 0 is the start of the path, 1 its end. */
  pointAt(p: number): [number, number];
  /** Stroke the path up to `p` in the context's current style. */
  trace(ctx: CanvasRenderingContext2D, p: number): void;
};

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
