import { coverOf, type Frame } from './cast';
import { MARK_ASPECT, markLetterPaths, markPaths } from './markCanvas';

/**
 * The window as a picture (round five, 2026-09-20): the frame clipped to the letters, each
 * letter under its lamp's dark cover until the lamp is on, the accents in crimson — drawn
 * into a small canvas for a texture, so a shader can take the light from the same window
 * the SVG shows, with the same lamps at the same moments.
 */

/** The lamps' order, i Q R a, for the art's order, a i Q R. */
export const WRITE = [3, 0, 1, 2] as const;
/** 9's lamp: 900 ms of stepped flicker, one lamp 190 ms after the last. */
export const LAMP_MS = 900;
export const LAMP_GAP = 190;

/**
 * How much of the dark cover is still over letter `i` (art order) at `t` ms, for lamps that
 * start at `base` ms — 9's `lampOn` keyframes, stepped, so the texture and the SVG agree.
 */
export function lampCover(t: number, i: number, base: number): number {
  const x = (t - base - WRITE[i] * LAMP_GAP) / LAMP_MS;
  if (x < 0.18) return 1;
  if (x < 0.26) return 0.15;
  if (x < 0.4) return 1;
  if (x < 0.48) return 0.05;
  if (x < 0.6) return 0.7;
  return 0;
}

/** Draws the window into `c` at `width` px; `base` is when the lamps start (−Infinity: all lit). */
export function makeWindow(c: HTMLCanvasElement, width: number, crimson: string, base: number) {
  c.width = width;
  c.height = Math.round(width / MARK_ASPECT);
  const ctx = c.getContext('2d');
  const paths = markPaths(0, 0, width);
  const letters = markLetterPaths(0, 0, width);
  const W = c.width;
  const H = c.height;
  return (frame: Frame, t: number, shift: [number, number] = [0, 0]) => {
    if (!ctx || !frame) return;
    const [sx, sy, sw, sh] = coverOf(frame.w, frame.h);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.clip(paths.letters);
    // A little larger than the window, so the pointer can move the film behind it.
    const z = 1.1;
    ctx.drawImage(frame.src, sx, sy, sw, sh, (W - W * z) / 2 + shift[0], (H - H * z) / 2 + shift[1], W * z, H * z);
    ctx.restore();
    ctx.fillStyle = '#000';
    letters.forEach((p, i) => {
      const a = lampCover(t, i, base);
      if (a <= 0) return;
      ctx.globalAlpha = a;
      ctx.fill(p);
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = crimson;
    ctx.fill(paths.accents);
  };
}
