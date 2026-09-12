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

/** Where the pen leaves the top line open for a legend: this much either side of its box. */
export const LEGEND_ROOM = 6;

export type Gap = { from: number; to: number };

/**
 * The legend's box in the card's own coordinates, with the room either side. Read off the
 * legend's offsets, not its client rect: offsets ignore transforms, and the member card's
 * arrival slides its role 20px along the line by transform — a rect measured mid-slide put
 * the gap 20px to the left of the word and the line through its last letter.
 */
export function legendGap(legend: { offsetLeft: number; offsetWidth: number }): Gap {
  return { from: legend.offsetLeft - LEGEND_ROOM, to: legend.offsetLeft + legend.offsetWidth + LEGEND_ROOM };
}

/**
 * The frame round a box, as one path the pen walks: a rounded rectangle of `W` × `H` with
 * corners of radius `r`, drawn clockwise. With a `gap` the top line is left open for the
 * legend — the pen starts at the gap's right end and ends at its left end, so the line
 * opens and closes at the word. The bottom edge is always whole: a button sits over it,
 * the line running on beneath. Without a gap the path is closed and starts where the
 * top-left arc ends.
 */
export function framePath(W: number, H: number, r: number, gap?: Gap): ArchPath {
  const line = (x0: number, y0: number, x1: number, y1: number): Seg => ({ type: 'line', x0, y0, x1, y1 });
  const arc = (cx: number, cy: number, a0: number, a1: number): Seg => ({ type: 'arc', cx, cy, r, a0, a1 });
  const start = gap ? gap.to : r;
  const end = gap ? gap.from : r;
  return makePath([
    line(start, 0, W - r, 0),
    arc(W - r, r, -Math.PI / 2, 0),
    line(W, r, W, H - r),
    arc(W - r, H - r, 0, Math.PI / 2),
    line(W - r, H, r, H),
    arc(r, H - r, Math.PI / 2, Math.PI),
    line(0, H - r, 0, r),
    arc(r, r, Math.PI, 1.5 * Math.PI),
    line(r, 0, end, 0),
  ]);
}

/** Room round a box for the pen's glow and its tip, on every side. */
export const FRAME_PAD = 32;

export type FrameHandle = {
  /** How far the pen has come, 0..1. A plain property, so a tween can drive it. */
  p: number;
  /** Measure the box and its legend, size the canvas, rebuild the path, redraw. */
  layout(): void;
  /** Clear and stroke up to `p`. Marks the card `data-frame-drawn` when the line closes. */
  draw(): void;
  destroy(): void;
};

/**
 * The frame round one box. Finds the box's canvas (`[data-frame-canvas]`) and its legend
 * (`[data-legend]`, optional) and draws the frame with the tree's pen: `p` is how far the
 * pen has come, and the section's own timeline moves it —
 *
 *   gsap.to(frame, { p: 1, duration: 1.1, ease: EASE.none, onUpdate: frame.draw })
 *
 * — so the pen is in step with everything else the section moves, and no frame ever reads
 * the clock or schedules a frame of its own. Null where there is no canvas or no 2D
 * context: the box is then a frosted rectangle with no line, which is a complete answer.
 */
export function createFrame(card: HTMLElement): FrameHandle | null {
  const canvas = card.querySelector<HTMLCanvasElement>('[data-frame-canvas]');
  const ctx = canvas?.getContext('2d') ?? null;
  if (!canvas || !ctx) return null;
  const legend = card.querySelector<HTMLElement>('[data-legend]');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let path: ArchPath | null = null;
  let W = 0;
  let H = 0;
  let closed = false;
  const frame: FrameHandle = {
    p: 0,
    layout() {
      const rect = card.getBoundingClientRect();
      W = Math.round(rect.width);
      H = Math.round(rect.height);
      if (W < 1 || H < 1) { path = null; return; } // not laid out: display none
      const r = parseFloat(getComputedStyle(card).borderTopLeftRadius) || 0;
      canvas.width = (W + 2 * FRAME_PAD) * DPR;
      canvas.height = (H + 2 * FRAME_PAD) * DPR;
      // The box's top-left corner is the origin; the pad is what lies outside it.
      ctx.setTransform(DPR, 0, 0, DPR, FRAME_PAD * DPR, FRAME_PAD * DPR);
      // The legend's offsets are against the card: `.frame` is positioned, so it is the offset parent.
      const gap = legend ? legendGap(legend) : undefined;
      path = framePath(W, H, r, gap);
      frame.draw();
    },
    draw() {
      if (!path) return;
      ctx.clearRect(-FRAME_PAD, -FRAME_PAD, W + 2 * FRAME_PAD, H + 2 * FRAME_PAD);
      drawStroke(ctx, path, frame.p);
      const now = frame.p >= 1;
      if (now !== closed) {
        closed = now;
        if (now) card.setAttribute('data-frame-drawn', 'true');
        else card.removeAttribute('data-frame-drawn');
      }
    },
    destroy() {
      path = null;
      canvas.width = 0;
      canvas.height = 0;
    },
  };
  return frame;
}

/**
 * Frames are measured, and a measurement goes stale: on a resize, and when the web font
 * lands and every legend changes width. Lays each frame out again 300ms after the last
 * resize (the tree's own debounce) and once when the fonts are ready. Returns the release.
 */
export function keepFramesFitted(frames: FrameHandle[]): () => void {
  let timer = 0;
  let live = true;
  const fit = () => frames.forEach((f) => f.layout());
  const onResize = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(fit, 300);
  };
  window.addEventListener('resize', onResize);
  document.fonts?.ready.then(() => { if (live) fit(); });
  return () => {
    live = false;
    window.removeEventListener('resize', onResize);
    window.clearTimeout(timer);
  };
}
