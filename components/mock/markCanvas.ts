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

/** The mark's paths in the canvas's own units, top-left at (x, y), the given width: one for clipping to the letters, one for the accents. */
export function markPaths(x: number, y: number, width: number): { letters: Path2D; accents: Path2D } {
  const k = width / VW;
  const base = new DOMMatrix().translate(x, y).scale(k).translate(-VX, -VY);
  const join = (glyphs: Glyph[]) => {
    const p = new Path2D();
    for (const g of glyphs) {
      g.path ??= new Path2D(g.d);
      p.addPath(g.path, base.multiply(new DOMMatrix(g.m)));
    }
    return p;
  };
  return { letters: join(LETTERS), accents: join(ACCENTS) };
}

/** The letters one by one (the art's order, a i Q R), in the canvas's own units — for a cover laid over each in turn. */
export function markLetterPaths(x: number, y: number, width: number): Path2D[] {
  const k = width / VW;
  const base = new DOMMatrix().translate(x, y).scale(k).translate(-VX, -VY);
  return LETTERS.map((g) => {
    g.path ??= new Path2D(g.d);
    const p = new Path2D();
    p.addPath(g.path, base.multiply(new DOMMatrix(g.m)));
    return p;
  });
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
