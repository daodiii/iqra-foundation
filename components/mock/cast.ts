import { MARK_ASPECT, markPaths } from './markCanvas';

/**
 * The light through the name (rounds three and four, 2026-09-19/20): the frame clipped to
 * the letters, the accents in crimson, drawn mirrored into a small canvas and faded down
 * its height — laid under the mark stretched and blurred, it is the film's light on the
 * floor. The fade is drawn here with `destination-in`, not as a CSS mask: with the blur
 * and the transform a CSS mask had Chrome painting the transparent box grey.
 */
export const CAST_W = 640;

export type Frame = { src: CanvasImageSource; w: number; h: number } | null;

/** The live frame, or the poster while the film is not yet playing; null before either has a size. */
export function frameOf(v: HTMLVideoElement, poster: HTMLImageElement): Frame {
  const live = v.readyState >= 2 && !v.paused;
  const w = live ? v.videoWidth : poster.naturalWidth;
  const h = live ? v.videoHeight : poster.naturalHeight;
  return w && h ? { src: live ? v : poster, w, h } : null;
}

/** The frame's cover crop of the mark's box: the source rect to draw. */
export function coverOf(w: number, h: number, aspect = MARK_ASPECT): [number, number, number, number] {
  let sw = w;
  let sh = h;
  if (w / h > aspect) sw = h * aspect;
  else sh = w / aspect;
  return [(w - sw) / 2, (h - sh) / 2, sw, sh];
}

export function makeCast(c: HTMLCanvasElement, crimson: string, mirror = true) {
  c.width = CAST_W;
  c.height = Math.round(CAST_W / MARK_ASPECT);
  const ctx = c.getContext('2d');
  const paths = markPaths(0, 0, CAST_W);
  const W = c.width;
  const H = c.height;
  return (frame: Frame, warm = true) => {
    if (!ctx || !frame) return;
    const [sx, sy, sw, sh] = coverOf(frame.w, frame.h);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (mirror) {
      ctx.translate(0, H);
      ctx.scale(1, -1);
    }
    ctx.save();
    ctx.clip(paths.letters);
    if (warm) ctx.filter = 'saturate(1.2) brightness(1.15)';
    ctx.drawImage(frame.src, sx, sy, sw, sh, 0, 0, W, H);
    ctx.restore();
    ctx.fillStyle = crimson;
    ctx.fill(paths.accents);
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

/** The token's value, for a canvas that cannot read CSS variables. */
export function token(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
