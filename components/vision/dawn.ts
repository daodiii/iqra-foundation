import type { Arch, Rect } from './arch';
import { GROUND } from './tree';

/*
 * Before sunrise: what the arch opens onto.
 *
 * Outside the stroke the ink goes on as before. Inside it, where the pen has passed, the
 * ink is sky — the cave film's own pre-dawn, deep and starred at the very top, mist by the
 * crown, the first light along the horizon — and under the tree the ground, with grass in
 * the tree's own pen and the earth the roots are in. Everything here is lines, points and
 * gradients; nothing is a texture.
 *
 * The still — sky, earth, strata, the glow — is painted once per layout into an offscreen
 * canvas. Each frame clips to the opening (and, while the stroke is still being drawn, to
 * a wiper that follows the pen), draws the still, then the stars twinkling and the grass
 * bending. Stars and blades are scattered by a pure function, tested without a canvas.
 */

export type DawnGeometry = { W: number; H: number; arch: Arch; stage: Rect };
export type Star = { x: number; y: number; s: number; a: number; ph: number; k: number; big: boolean };
export type Blade = { x: number; y: number; h: number; lean: number; ph: number; w: number; a: number; deep: boolean };
export type Field = { stars: Star[]; blades: Blade[]; GY: number; top: number; k: number };
export type DawnScene = {
  layout(geo: DawnGeometry): void;
  /** Paint at progress `p` with the pen at `pen`, at time `t` in seconds. */
  frame(p: number, pen: [number, number], t: number): void;
  /** The stroke has closed: keep the stars and the grass moving on the scene's own clock. */
  settle(): void;
  destroy(): void;
};

const TAU = Math.PI * 2;
/** The cave's colours, as lib/film.ts has them: slate to mist to the cream thread of light. */
const SKY: [number, string][] = [[0, '#1b2635'], [0.2, '#2f4258'], [0.46, '#6f8598'], [0.76, '#b3bfc2'], [1, '#e6dccb']];
/** The earth, down to the film's Quran bronze. */
const EARTH: [number, string][] = [[0, '#cfb48e'], [0.55, '#bf9d72'], [1, '#8a6234']];
const STRATA = '58,40,20';
const LIGHT = '236,214,170';
const STAR = '255,244,225';
const HALO = '255,236,196';
/** The ramp's teal, which is what the trunk starts in, and a deeper one behind it. */
const GRASS = '98,191,189';
const GRASS_DEEP = '52,150,148';
const STARS = 620;
const BLADES = 1600;
/** The stage height the grass was drawn for; a smaller tree stands in shorter grass. */
const GRASS_STAGE = 517;
/**
 * The grass is stroked in this many layers, one layer per frame, and every layer is drawn
 * every frame. Stroking a curve costs the CPU whatever the canvas is — Skia builds the
 * stroke's outline before anything is rasterised — and fifteen hundred of them a frame was
 * what tipped the section from one vsync to two (measured 2026-09-11 at 1440×900, 2×: 37ms
 * a frame with the grass, 18 without). A blade's sway is slow, a full sweep in eight
 * seconds, so a blade re-stroked every third frame moves under half a pixel between its
 * updates; the picture is the mock's, at a third of the work.
 */
const GRASS_LAYERS = 3;
/** The band the layers cover, in CSS px above and below the ground line: the tallest blade is 37px, the deepest root 19px. */
const BAND_ABOVE = 44;
const BAND_BELOW = 24;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const seeded = (seed: number) => {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
};

/**
 * Where the stars and the blades are. Seeded, so the same box gives the same sky, and the
 * draws are made in a fixed order — the mock's — so the picture is the mock's.
 */
export function scatter(geo: DawnGeometry): Field {
  const { arch, stage } = geo;
  const { cx, r: R, contains } = arch;
  const top = arch.apex;
  // The horizon is the tree's own ground line.
  const GY = stage.top + GROUND * stage.height;

  // Stars live in the deep band and thin out into the mist; a few carry a halo like the blooms.
  const rs = seeded(11);
  const band = (GY - top) * 0.68;
  const stars: Star[] = [];
  for (let i = 0; i < STARS; i++) {
    const x = cx + (rs() - 0.5) * 2 * R;
    const y = top + rs() * rs() * band;
    if (!contains(x, y)) continue;
    // brightest at the top of the sky, still there by the crown, gone at the horizon
    const depth = 1 - 0.7 * ((y - top) / band);
    stars.push({ x, y, s: 0.7 + rs() * 1.9, a: (0.5 + 0.5 * rs()) * depth, ph: rs() * TAU, k: 0.5 + rs() * 1.3, big: rs() < 0.12 });
  }

  // Grass on the surface, the whole width of it: a dense fringe rooted on the line and a
  // sparser row just in front of it for depth. The roots are underground, so nothing grows
  // below the line.
  const k = clamp(stage.height / GRASS_STAGE, 0.55, 1);
  const rb = seeded(23);
  const blades: Blade[] = [];
  for (let i = 0; i < BLADES; i++) {
    const x = cx + (rb() - 0.5) * 2 * (R + 20);
    const front = rb() < 0.3;
    // rooted a little into the earth, where the roots begin, so the fringe sits on the ground rather than above it
    const y = GY + (front ? 9 + rb() * 10 : 3 + rb() * 8);
    if (!contains(x, y - 6)) continue;
    const t = rb();
    const h = (7 + 24 * Math.pow(t, 1.2) + (front ? 6 : 0)) * k;
    blades.push({
      x, y, h,
      lean: (rb() - 0.5) * 0.7,
      ph: rb() * TAU,
      w: (front ? 1.5 : 1.1) + t * 0.9,
      a: (front ? 0.7 : 0.55) + rb() * 0.35,
      deep: rb() < 0.4,
    });
  }
  return { stars, blades, GY, top, k };
}

/** The still: sky above the horizon, earth below it, the first light where they meet. */
function paintStill(sc: CanvasRenderingContext2D, W: number, H: number, cx: number, GY: number, top: number) {
  const sky = sc.createLinearGradient(0, top, 0, GY);
  for (const [at, c] of SKY) sky.addColorStop(at, c);
  sc.fillStyle = sky;
  sc.fillRect(0, 0, W, GY);
  // below the surface it is earth: the roots are underground, and the name with them
  const earth = sc.createLinearGradient(0, GY, 0, H);
  for (const [at, c] of EARTH) earth.addColorStop(at, c);
  sc.fillStyle = earth;
  sc.fillRect(0, GY, W, H - GY);
  // strata, faint and a little wavy, drawn with the pen
  const st = seeded(5);
  sc.lineWidth = 1;
  sc.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const y0 = GY + 34 + i * ((H - GY - 30) / 4) + st() * 12;
    sc.strokeStyle = `rgba(${STRATA},${0.12 + st() * 0.08})`;
    sc.beginPath();
    sc.moveTo(0, y0);
    for (let x = 0; x <= W; x += 90) sc.quadraticCurveTo(x + 45, y0 + (st() - 0.5) * 9, x + 90, y0 + (st() - 0.5) * 5);
    sc.stroke();
  }
  // a low, wide glow behind the trunk: the one thread of sunrise the cave palette carries
  const gw = Math.min(440, W * 0.36);
  sc.save();
  sc.translate(cx, GY);
  sc.scale(gw, gw * 0.3);
  const gl = sc.createRadialGradient(0, 0, 0, 0, 0, 1);
  gl.addColorStop(0, `rgba(${LIGHT},0.72)`);
  gl.addColorStop(0.45, `rgba(${LIGHT},0.28)`);
  gl.addColorStop(1, `rgba(${LIGHT},0)`);
  sc.fillStyle = gl;
  sc.beginPath();
  sc.arc(0, 0, 1, 0, TAU);
  sc.fill();
  sc.restore();
}

/** Mount the scene on a canvas; returns null where there is no 2D context. */
export function createDawnScene(canvas: HTMLCanvasElement, opts: { reduced: boolean }): DawnScene | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let geo: DawnGeometry | null = null;
  let still: HTMLCanvasElement | null = null;
  let region: Path2D | null = null;
  let stars: Star[] = [];
  let blades: Blade[] = [];
  let GY = 0;
  let pivot: [number, number] = [0, 0];
  let foot: [number, number] = [0, 0];
  let last: { p: number; pen: [number, number] } = { p: 0, pen: [0, 0] };
  let raf = 0;
  let visible = true;
  /** The grass, in layers: each holds a third of the blades, stroked on its own turn. */
  let layers: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; blades: Blade[] }[] = [];
  let turn = 0;

  function layout(g: DawnGeometry) {
    geo = g;
    const { W, H, arch } = g;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
    // the opening: whatever the stroke encloses with the floor of the box
    region = arch.path.region();
    const field = scatter(g);
    stars = field.stars;
    blades = field.blades;
    GY = field.GY;
    layers = [];
    for (let i = 0; i < GRASS_LAYERS; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = W * DPR;
      canvas.height = (BAND_ABOVE + BAND_BELOW) * DPR;
      const lc = canvas.getContext('2d');
      if (!lc) continue;
      // the layer's origin is the top of the band, so a blade is drawn at its own y
      lc.setTransform(DPR, 0, 0, DPR, 0, -(GY - BAND_ABOVE) * DPR);
      layers.push({ canvas, ctx: lc, blades: blades.filter((_, j) => j % GRASS_LAYERS === i) });
    }
    // every layer gets its first stroke now; from here one layer is re-stroked per frame
    const now = performance.now() / 1000;
    for (const layer of layers) strokeLayer(layer, now);
    still = document.createElement('canvas');
    still.width = W * DPR;
    still.height = H * DPR;
    const sc = still.getContext('2d');
    if (sc) {
      sc.setTransform(DPR, 0, 0, DPR, 0, 0);
      paintStill(sc, W, H, arch.cx, field.GY, field.top);
    }
    // the wipe pivots from well below the box, so its edge stands nearly upright and passes through the pen
    pivot = [arch.cx, H + arch.r * 0.6];
    foot = arch.path.pointAt(0);
  }

  /** The blades bend to the same wind the tree's twigs do. */
  function strokeLayer(layer: { ctx: CanvasRenderingContext2D; blades: Blade[] }, t: number) {
    const { ctx: lc } = layer;
    lc.clearRect(0, GY - BAND_ABOVE, geo!.W, BAND_ABOVE + BAND_BELOW);
    lc.lineCap = 'round';
    for (const b of layer.blades) {
      const wind = opts.reduced ? 0 : Math.sin(t * 0.75 + b.x * 0.004 + b.ph) * 0.35;
      const lean = b.lean + wind;
      lc.strokeStyle = `rgba(${b.deep ? GRASS_DEEP : GRASS},${b.a})`;
      lc.lineWidth = b.w;
      lc.beginPath();
      lc.moveTo(b.x, b.y);
      lc.quadraticCurveTo(b.x + lean * b.h * 0.25, b.y - b.h * 0.55, b.x + lean * b.h, b.y - b.h);
      lc.stroke();
    }
  }

  function paint(p: number, pen: [number, number], t: number) {
    if (!geo || !still || !region) return;
    const { W, H, arch } = geo;
    ctx!.clearRect(0, 0, W, H);
    if (p <= 0) return;
    ctx!.save();
    // the opening is what the stroke encloses, and inside it only what the pen has passed
    ctx!.clip(region);
    if (p < 1) {
      const aF = Math.atan2(foot[1] - pivot[1], foot[0] - pivot[0]);
      const aP = Math.atan2(pen[1] - pivot[1], pen[0] - pivot[0]);
      ctx!.beginPath();
      ctx!.moveTo(pivot[0], pivot[1]);
      ctx!.arc(pivot[0], pivot[1], arch.r * 6, aF, aP, false);
      ctx!.closePath();
      ctx!.clip();
    }
    ctx!.drawImage(still, 0, 0, W, H);
    for (const s of stars) {
      const tw = opts.reduced ? 0.85 : 0.72 + 0.28 * Math.sin(t * s.k + s.ph);
      const al = s.a * tw;
      if (s.big) {
        const gr = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.s * 8);
        gr.addColorStop(0, `rgba(${HALO},${0.55 * al})`);
        gr.addColorStop(1, `rgba(${HALO},0)`);
        ctx!.fillStyle = gr;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.s * 8, 0, TAU);
        ctx!.fill();
      }
      ctx!.fillStyle = `rgba(${STAR},${al})`;
      ctx!.beginPath();
      ctx!.arc(s.x, s.y, s.s, 0, TAU);
      ctx!.fill();
    }
    // one layer of grass takes its turn in the wind; all of them are drawn
    if (!opts.reduced && layers.length) {
      strokeLayer(layers[turn % layers.length], t);
      turn++;
    }
    for (const layer of layers) {
      ctx!.drawImage(layer.canvas, 0, GY - BAND_ABOVE, W, BAND_ABOVE + BAND_BELOW);
    }
    ctx!.restore();
  }

  // Once the stroke has closed nothing drives the frame any more, so the scene keeps its own
  // clock — and stops painting while the arch is off screen, as the tree does. Two thousand
  // strokes a frame for a reader down at Støtt oss is the one thing the mock got wrong.
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    if (visible && !document.hidden) paint(last.p, last.pen, now / 1000);
  };
  // The last entry, not the first: several arrive together after a busy main thread.
  const io = new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; }, { threshold: 0.02 });
  io.observe(canvas);

  return {
    layout,
    frame(p, pen, t) {
      last = { p, pen };
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      paint(p, pen, t);
    },
    settle() {
      if (opts.reduced || raf) return;
      raf = requestAnimationFrame(tick);
    },
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      io.disconnect();
    },
  };
}
