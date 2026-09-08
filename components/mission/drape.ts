/**
 * The drape to the right of the Misjon copy: a bundle of fine filaments, each one a
 * bezier stroked with its own gradient that is transparent at both tips. The feathering
 * is the point — the shape has no edge anywhere, only more or less density, which is
 * what makes it read as light rather than as a graphic pasted on the page.
 *
 * Settings below are the ones chosen from the mockups (bredde 51 %, tetthet 105 %,
 * turkis #62bfbd, vinkel −26°); they are constants rather than props because there is
 * one drape on the site and the layout in mission.module.css is sized against COVER.
 */

/** Fraction of the section width the drape covers, measured from the right edge. */
export const COVER = 0.51;
/** Degrees. Negative leans the top of the drape left and the bottom right. */
const ANGLE = -26;
const DENSITY = 1.05;
const STRANDS = Math.round(340 * Math.sqrt(DENSITY));
const ALPHA = 0.21 * DENSITY;
const WIDTH = 3.4;
const GLOW_BLUR = 18;
/** The offscreen is drawn small and scaled up. Below ~0.7 the glow blur eats the
 *  filaments and the whole thing turns into a smear. */
const SCALE = 0.72;
/** The logo plate colour, read off the lockup. Not sampled from a file: no logo asset
 *  on disk carries it, so treat it as provisional until one does. */
const TEAL: RGB = [0x62, 0xbf, 0xbd];

type RGB = [number, number, number];
type Stop = { at: number; c: RGB };

export type DrapeHandle = { destroy(): void };
export type DrapeOptions = { reduced: boolean };

const lighten = (c: RGB, f: number): RGB => [
  Math.round(c[0] + (255 - c[0]) * f),
  Math.round(c[1] + (255 - c[1]) * f),
  Math.round(c[2] + (255 - c[2]) * f),
];

/**
 * Turquoise into the brand blue and navy, then out through rose into the brand
 * burgundy. `#3f5b7a` and `#ab5263` are hit exactly; the colours between them carry
 * more chroma than the brand does, because a ramp built only from the brand navy —
 * which is very close to grey — reads as smoke on a white page.
 */
export function ramp(): Stop[] {
  const pale = lighten(TEAL, 0.82);
  return [
    { at: 0.0, c: pale },
    { at: 0.13, c: TEAL },
    { at: 0.27, c: [143, 176, 224] },
    { at: 0.4, c: [95, 131, 192] },
    { at: 0.5, c: [63, 91, 122] },
    { at: 0.62, c: [138, 127, 192] },
    { at: 0.74, c: [196, 122, 156] },
    { at: 0.86, c: [171, 82, 99] },
    { at: 1.0, c: [224, 188, 203] },
  ];
}

/** Colour at `s` along the bundle, 0 at the cool edge and 1 at the warm one. */
export function sample(stops: Stop[], s: number): RGB {
  const t = Math.max(0, Math.min(1, s));
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i].at) {
      const a = stops[i - 1], b = stops[i];
      const f = (t - a.at) / (b.at - a.at);
      return [
        Math.round(a.c[0] + (b.c[0] - a.c[0]) * f),
        Math.round(a.c[1] + (b.c[1] - a.c[1]) * f),
        Math.round(a.c[2] + (b.c[2] - a.c[2]) * f),
      ];
    }
  }
  return stops[stops.length - 1].c;
}

export function createDrape(canvas: HTMLCanvasElement, opts: DrapeOptions): DrapeHandle | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const off = document.createElement('canvas');
  const octx = off.getContext('2d');
  if (!octx) return null;

  const stops = ramp();
  const rad = (ANGLE * Math.PI) / 180;
  const ca = Math.cos(rad), sa = Math.sin(rad);
  let raf = 0, onScreen = true, resizeTimer = 0;
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;

  function draw(tSec: number) {
    const r = canvas.getBoundingClientRect();
    // Nothing laid out yet, or an environment with no layout at all. Three hundred odd
    // gradient-stroked beziers into a canvas with no area is pure heat.
    if (r.width < 4 || r.height < 4) return;
    const W = Math.round(r.width), H = Math.round(r.height);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    const ow = Math.max(2, Math.round(W * SCALE)), oh = Math.max(2, Math.round(H * SCALE));
    if (off.width !== ow || off.height !== oh) { off.width = ow; off.height = oh; }

    octx!.clearRect(0, 0, ow, oh);
    octx!.lineCap = 'round';

    // Every x is expressed inside the band, so the drape scales with COVER rather than
    // sliding across the page, and the rotation is about the band's own centre.
    const L = 1 - COVER;
    const pvx = ow * (L + COVER * 0.5), pvy = oh * 0.5;
    const rot = (x: number, y: number): [number, number] => {
      const dx = x - pvx, dy = y - pvy;
      return [pvx + dx * ca - dy * sa, pvy + dx * sa + dy * ca];
    };

    for (let i = 0; i < STRANDS; i++) {
      const s = i / (STRANDS - 1);
      // Each strand carries its own phase, so the bundle undulates instead of sliding
      // about as one rigid object.
      const w1 = Math.sin(tSec * 0.11 + s * 3.4) * 0.03;
      const w2 = Math.cos(tSec * 0.083 + s * 2.4) * 0.03;

      // The strands start and end far outside the frame so they still run off the edges
      // once the whole bundle is tilted.
      const [x0, y0] = rot(ow * (L + COVER * (-0.06 + 1.1 * s + w1)), oh * -0.62);
      const [x1, y1] = rot(ow * (L + COVER * (1.26 - 0.92 * s + w2 * 1.6)), oh * (0.24 + 0.1 * s));
      const [x2, y2] = rot(ow * (L + COVER * (0.02 + 1.02 * s - w1 * 1.3)), oh * (0.62 + 0.1 * s));
      const [x3, y3] = rot(ow * (L + COVER * (0.3 + 1.15 * s)), oh * (1.18 + w2 * 0.6));

      const c = sample(stops, s + Math.sin(tSec * 0.05) * 0.03);
      const edge = Math.min(1, Math.min(s, 1 - s) / 0.13);
      const a = ALPHA * (0.35 + 0.65 * edge);
      const col = `${c[0]},${c[1]},${c[2]}`;

      const g = octx!.createLinearGradient(x0, y0, x3, y3);
      g.addColorStop(0, `rgba(${col},0)`);
      g.addColorStop(0.13, `rgba(${col},${a.toFixed(4)})`);
      g.addColorStop(0.87, `rgba(${col},${a.toFixed(4)})`);
      g.addColorStop(1, `rgba(${col},0)`);

      octx!.strokeStyle = g;
      octx!.lineWidth = WIDTH * SCALE * (0.7 + 0.6 * Math.sin(s * Math.PI));
      octx!.beginPath();
      octx!.moveTo(x0, y0);
      octx!.bezierCurveTo(x1, y1, x2, y2, x3, y3);
      octx!.stroke();
    }

    ctx!.clearRect(0, 0, W, H);
    // The glow first, then the filaments on top of their own light.
    ctx!.save();
    ctx!.filter = `blur(${GLOW_BLUR}px)`;
    ctx!.globalAlpha = 0.62;
    ctx!.drawImage(off, 0, 0, W, H);
    ctx!.restore();
    ctx!.save();
    ctx!.filter = 'blur(0.6px)';
    ctx!.drawImage(off, 0, 0, W, H);
    ctx!.restore();
  }

  function frame(now: number) {
    if (onScreen) draw((now - t0) / 1000);
    raf = requestAnimationFrame(frame);
  }

  // A still frame is the whole of reduced motion: the drape is the section's only
  // ornament, so removing it would leave the page bare rather than calm.
  draw(0);
  if (!opts.reduced) raf = requestAnimationFrame(frame);

  const io = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver((entries) => { onScreen = entries.some((e) => e.isIntersecting); })
    : null;
  io?.observe(canvas);

  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => draw(opts.reduced ? 0 : (performance.now() - t0) / 1000), 240);
  };
  window.addEventListener('resize', onResize);

  return {
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      io?.disconnect();
    },
  };
}
