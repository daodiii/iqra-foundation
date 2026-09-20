import { LOCKUP_VIEWBOX, LOCKUP_WORD } from './lockup';
import { MARK_ACCENTS, MARK_LETTERS } from './mark';

/**
 * The film's light on the paper: the frame clipped to the lockup's letters, the accents
 * in crimson, drawn mirrored into a small canvas and faded down its height. Laid under
 * the lockup stretched, skewed and blurred (the stylesheet), it is the light through the
 * open windows falling on the floor the copy stands on. The fade is drawn here with
 * `destination-in`, not as a CSS mask: with the blur and the transform a CSS mask had
 * Chrome painting the transparent box grey.
 */
export const CAST_W = 640;

const [VX, VY, VW, VH] = LOCKUP_VIEWBOX.split(' ').map(Number);
export const LOCKUP_ASPECT = VW / VH;

export type Frame = { src: CanvasImageSource; w: number; h: number } | null;

/** The live frame, or the poster while the film is not yet playing (or was refused); null before either has a size. */
export function frameOf(v: HTMLVideoElement, poster: HTMLImageElement): Frame {
  const live = v.readyState >= 2 && !v.paused;
  const w = live ? v.videoWidth : poster.naturalWidth;
  const h = live ? v.videoHeight : poster.naturalHeight;
  return w && h ? { src: live ? v : poster, w, h } : null;
}

/** The frame's cover crop of the lockup's box — the source rect to draw — as `object-fit: cover` crops the video itself. */
export function coverOf(w: number, h: number, aspect = LOCKUP_ASPECT): [number, number, number, number] {
  let sw = w;
  let sh = h;
  if (w / h > aspect) sw = h * aspect;
  else sh = w / aspect;
  return [(w - sw) / 2, (h - sh) / 2, sw, sh];
}

type Matrix = [number, number, number, number, number, number];
const matrix = (t: string): Matrix => t.match(/matrix\(([^)]+)\)/)![1].split(',').map(Number) as Matrix;

/** The glyphs joined into one path in the canvas's units, the box `width` wide with its top-left at (x, y). */
function joined(glyphs: readonly { transform: string; d: string }[], x: number, y: number, width: number): Path2D {
  const k = width / VW;
  const base = new DOMMatrix().translate(x, y).scale(k).translate(-VX, -VY);
  const p = new Path2D();
  for (const g of glyphs) p.addPath(new Path2D(g.d), base.multiply(new DOMMatrix(matrix(g.transform))));
  return p;
}

export function makeCast(c: HTMLCanvasElement, crimson: string) {
  c.width = CAST_W;
  c.height = Math.round(CAST_W / LOCKUP_ASPECT);
  const ctx = c.getContext('2d');
  const letters = joined([...MARK_LETTERS, ...LOCKUP_WORD], 0, 0, CAST_W);
  const accents = joined(MARK_ACCENTS, 0, 0, CAST_W);
  const W = c.width;
  const H = c.height;
  return (frame: Frame) => {
    if (!ctx || !frame) return;
    const [sx, sy, sw, sh] = coverOf(frame.w, frame.h);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    // Mirrored: the light falls away from the lockup, so its bottom edge lies nearest it.
    ctx.translate(0, H);
    ctx.scale(1, -1);
    ctx.save();
    ctx.clip(letters);
    ctx.filter = 'saturate(1.2) brightness(1.15)';
    ctx.drawImage(frame.src, sx, sy, sw, sh, 0, 0, W, H);
    ctx.restore();
    ctx.fillStyle = crimson;
    ctx.fill(accents);
    ctx.restore();
    const fade = ctx.createLinearGradient(0, 0, 0, H);
    fade.addColorStop(0, 'rgba(0,0,0,1)');
    fade.addColorStop(0.4, 'rgba(0,0,0,0.5)');
    fade.addColorStop(0.82, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  };
}

/** A token's value, for a canvas that cannot read CSS variables. */
export function token(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
