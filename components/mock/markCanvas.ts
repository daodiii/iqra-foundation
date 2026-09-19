import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';

/** The mark on a canvas: the same art as the hero's SVG, for a reflection drawn per frame. */
const [VX, VY, VW, VH] = MARK_VIEWBOX.split(' ').map(Number);
export const MARK_ASPECT = VW / VH;

type Matrix = [number, number, number, number, number, number];
const matrix = (t: string): Matrix => t.match(/matrix\(([^)]+)\)/)![1].split(',').map(Number) as Matrix;

type Glyph = { m: Matrix; d: string; path?: Path2D };
const LETTERS: Glyph[] = MARK_LETTERS.map((p) => ({ m: matrix(p.transform), d: p.d }));
const ACCENTS: Glyph[] = MARK_ACCENTS.map((p) => ({ m: matrix(p.transform), d: p.d }));

function fill(ctx: CanvasRenderingContext2D, glyphs: Glyph[], colour: string): void {
  ctx.fillStyle = colour;
  for (const g of glyphs) {
    g.path ??= new Path2D(g.d);
    ctx.save();
    ctx.transform(...g.m);
    ctx.fill(g.path);
    ctx.restore();
  }
}

/** Draw the mark with its top-left at (x, y) and the given width, in the canvas's own units. */
export function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, letters: string, accents: string): void {
  const k = width / VW;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.translate(-VX, -VY);
  fill(ctx, LETTERS, letters);
  fill(ctx, ACCENTS, accents);
  ctx.restore();
}
