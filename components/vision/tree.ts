import { ramp, sample } from '@/lib/ramp';

/** Growth time when the tree is fully open; the figure is complete around 3.3. */
export const GROW = 3.8;

const MAXD = 4;
const NAVY = '42,57,75';
const ROOT = 'rgb(74,90,110)';
const CRIMSON = '171,82,99';
/*
 * The tips. A warm core inside a rose bloom, which is the top of the same ramp the
 * branches climb — so the lights read as the tree flowering rather than as lamps hung in
 * it. This replaced a gold that was the one colour on the site belonging to nothing else.
 */
const BLOOM = '196,122,156';
const BLOOM_CORE = '255,225,205';
/** The point at the very centre of a bloom — a shade warmer than the halo around it. */
const BLOOM_TIP = '255,236,196';
/** The glow the whole figure is drawn with, so the line itself looks lit rather than inked. */
const GLOW = `rgba(${BLOOM},0.52)`;

/*
 * Branch colour is the brand ramp, read off height: turquoise at the ground, through the
 * brand blue and navy, out to burgundy at the tips. The bottom 12% is skipped so the trunk
 * starts at the blue rather than the pale teal the ramp opens on, which would wash out
 * against the card.
 *
 * The ramp used to be shared with Misjon's drape, and was imported rather than copied so
 * the two figures could not drift apart. The drape is gone and the tree is the ramp's only
 * reader now, which is the whole reason `lib/ramp.ts` still exists.
 */
const RAMP = ramp();
const branchColour = (heightFraction: number) => {
  const [r, g, b] = sample(RAMP, 0.12 + clamp(heightFraction, 0, 1) * 0.88);
  return `rgb(${r},${g},${b})`;
};

export type Seg = {
  x0: number; y0: number; cx: number; cy: number; x1: number; y1: number;
  depth: number; parent: number; ph: number; id: number;
};
export type FittedSeg = Seg & { X0: number; Y0: number; CX: number; CY: number; X1: number; Y1: number; birth: number };
export type Light = { seg: FittedSeg; R: number; ph: number; birth: number; sx: number; sy: number };
export type TreeModel = { seed: number; segs: Seg[]; tips: Seg[]; rootSegs: Seg[]; lightR: number[] };
export type FittedTree = {
  W: number; H: number; GY: number; TOPY: number; K: number;
  segs: FittedSeg[]; rootSegs: FittedSeg[]; lights: Light[];
  limbs: { x: number; y: number; birth: number }[]; rootBirth: number;
};
export type TreeHandle = { setT(v: number): void; destroy(): void };
export type TreeOptions = { reduced: boolean; limbLabels: HTMLElement[]; rootLabel: HTMLElement | null };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const makeRnd = (seed: number) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };

/** Seeded growth: exactly three limbs off the trunk, then twigs to depth 4; roots below. */
export function generate(): TreeModel {
  let segs: Seg[] = [], tips: Seg[] = [], lightR: number[] = [], seedUsed = 0;
  for (let seed = 9; seed < 400; seed++) {
    const rnd = makeRnd(seed);
    segs = []; tips = [];
    (function branch(x: number, y: number, ang: number, len: number, depth: number, parent: number) {
      ang = lerp(ang, -Math.PI / 2, depth === 0 ? 0 : 0.12);
      const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len;
      const perp = ang + Math.PI / 2, bow = (rnd() - 0.5) * len * (depth === 0 ? 0.12 : 0.5);
      const cx = (x + x1) / 2 + Math.cos(perp) * bow, cy = (y + y1) / 2 + Math.sin(perp) * bow;
      const id = segs.length;
      segs.push({ x0: x, y0: y, cx, cy, x1, y1, depth, parent, ph: rnd() * 6.283, id });
      if (depth >= MAXD) { tips.push(segs[id]); return; }
      const n = depth === 0 ? 3 : rnd() < 0.55 ? 2 : 3;
      const spread = [1.15, 0.7, 0.62, 0.54][depth] || 0.5;
      for (let k = 0; k < n; k++) {
        const off = (k - (n - 1) / 2) * spread + (rnd() - 0.5) * 0.2;
        branch(x1, y1, ang + off, len * (depth === 0 ? 0.78 : 0.62 + rnd() * 0.14), depth + 1, id);
      }
    })(0, 0, -Math.PI / 2, 1, 0, -1);
    let minX = 0, maxX = 0;
    segs.forEach((s) => { minX = Math.min(minX, s.x1); maxX = Math.max(maxX, s.x1); });
    const balance = Math.abs(minX + maxX) / (maxX - minX);
    const limbs = segs.filter((s) => s.depth === 1);
    const limbsApart = limbs.length === 3 && Math.abs(limbs[0].x1 - limbs[2].x1) > 0.9;
    if (tips.length >= 30 && tips.length <= 64 && balance < 0.12 && limbsApart) {
      const rl = makeRnd(seed + 100);
      lightR = tips.map(() => 2.2 + rl() * 2.2);
      seedUsed = seed;
      break;
    }
  }
  const rr = makeRnd(31);
  const rootSegs: Seg[] = [];
  (function root(x: number, y: number, ang: number, len: number, depth: number) {
    const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len;
    const perp = ang + Math.PI / 2, bow = (rr() - 0.5) * len * 0.5;
    const cx = (x + x1) / 2 + Math.cos(perp) * bow, cy = (y + y1) / 2 + Math.sin(perp) * bow;
    rootSegs.push({ x0: x, y0: y, cx, cy, x1, y1, depth, parent: -1, ph: 0, id: rootSegs.length });
    if (depth >= 2) return;
    const n = depth === 0 ? 4 : 2;
    for (let k = 0; k < n; k++) {
      const off = (k - (n - 1) / 2) * 1.0 + (rr() - 0.5) * 0.3;
      root(x1, y1, ang + off * 0.7, len * 0.6, depth + 1);
    }
  })(0, 0, Math.PI / 2, 0.3, 0);
  return { seed: seedUsed, segs, tips, rootSegs, lightR };
}

/** Map the model into a box, assign births, and place the names. */
export function fit(model: TreeModel, box: { W: number; H: number }): FittedTree {
  const { W, H } = box;
  const K = clamp(H / 640, 0.5, 1.4);
  const GY = H * 0.74, TOPY = H * 0.06;
  let minY = 0, minX = 0, maxX = 0;
  model.segs.forEach((s) => { minY = Math.min(minY, s.y1); minX = Math.min(minX, s.x1); maxX = Math.max(maxX, s.x1); });
  const ky = (GY - TOPY) / (-minY || 1);
  const kx = Math.min(ky, (W * 0.9) / Math.max(0.0001, maxX - minX));
  const midX = (minX + maxX) / 2;
  const mapX = (v: number) => W * 0.5 + (v - midX * 0.7) * kx;
  const mapY = (v: number) => GY + v * ky;
  const segs: FittedSeg[] = model.segs.map((s) => ({
    ...s, X0: mapX(s.x0), Y0: mapY(s.y0), CX: mapX(s.cx), CY: mapY(s.cy), X1: mapX(s.x1), Y1: mapY(s.y1),
    birth: 0.3 + s.depth * 0.5 + (s.ph % 1) * 0.24,
  }));
  /* The same kx/ky as the branches, so the roots are the figure's own scale continuing
     below the line. Sized instead to the space under the ground line — which is what they
     used to be — they came out as wide as the crown and read as a second tree. */
  const rootSegs: FittedSeg[] = model.rootSegs.map((s) => ({
    ...s, X0: mapX(s.x0), Y0: mapY(s.y0), CX: mapX(s.cx), CY: mapY(s.cy), X1: mapX(s.x1), Y1: mapY(s.y1),
    birth: 0.25 + s.depth * 0.35,
  }));
  const byId = new Map(segs.map((s) => [s.id, s]));
  const lights: Light[] = model.tips.map((t, i) => {
    const seg = byId.get(t.id)!;
    return { seg, R: model.lightR[i] * K, ph: seg.ph, birth: seg.birth + 0.62 + i * 0.01, sx: 0, sy: 0 };
  });
  const trunk = segs[0];
  const limbOf = (s: FittedSeg): FittedSeg => { while (s.depth > 1) s = byId.get(s.parent)!; return s; };
  const limbs = segs.filter((s) => s.depth === 1).sort((a, b) => a.X1 - b.X1).map((limb) => {
    const dx = limb.X1 - trunk.X1, dy = limb.Y1 - trunk.Y1, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    let best: Light | null = null, bp = -Infinity;
    for (const L of lights) if (limbOf(L.seg) === limb) {
      const p = (L.seg.X1 - trunk.X1) * ux + (L.seg.Y1 - trunk.Y1) * uy;
      if (p > bp) { bp = p; best = L; }
    }
    const tip = best ? best.seg : limb;
    return {
      x: clamp(tip.X1 + ux * 34 * K, 40, W - 40),
      y: clamp(tip.Y1 + uy * 28 * K - 6 * K, 14, GY - 14),
      birth: limb.birth + 1.3,
    };
  });
  return { W, H, GY, TOPY, K, segs, rootSegs, lights, limbs, rootBirth: 1.0 };
}

/** Mount the renderer on a canvas inside `stage`; returns null when there is no 2D context. */
export function createVisionTree(stage: HTMLElement, canvas: HTMLCanvasElement, opts: TreeOptions): TreeHandle | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const model = generate();
  let tree = fit(model, { W: 1, H: 1 });
  let T = 0, raf = 0, visible = true;
  /* A segment's colour is fixed by where its tip sits, so it changes when the tree is
     refitted and never between frames. Sampled there, looked up here. */
  let segColour: string[] = [];
  // Under reduced motion nothing in `draw` depends on the clock — no wind, no twinkle,
  // no leaves — so every frame repaints the identical picture, blurs and gradients and
  // all. `painted` says the canvas already shows the current T at the current size; the
  // frame loop then skips the repaint until something invalidates it (a resize, a new T).
  let painted = false;
  const leaves = Array.from({ length: 10 }, () => ({ live: false, x: 0, y: 0, vy: 0, ph: 0, life: 0, span: 0, s: 0 }));
  /*
   * (6.2 - depth * 1.25) up the branches and (3.4 - depth) down the roots. One weight per
   * depth, flat along the segment rather than tapered: a segment is then a single path and
   * a single stroke, which is what makes the glow in `draw` affordable — with a shadow set,
   * every stroke call is a blur.
   */
  const widths = () => [6.2, 4.95, 3.7, 2.45, 1.2].map((w) => Math.max(1, w * tree.K));
  const rootWidths = () => [3.4, 2.4, 1.4].map((w) => Math.max(1, w * tree.K));

  function size() {
    const W = stage.clientWidth, H = stage.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR; ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
    tree = fit(model, { W, H });
    const span = tree.GY - tree.TOPY || 1;
    segColour = [];
    tree.segs.forEach((sg) => { segColour[sg.id] = branchColour((tree.GY - sg.Y1) / span); });
    tree.limbs.forEach((l, i) => { const el = opts.limbLabels[i]; if (el) { el.style.left = l.x + 'px'; el.style.top = l.y + 'px'; } });
    // Under the roots, not at the foot of the box: the roots are drawn at the branches'
    // scale now, so they stop well short of the bottom and a fixed offset strands the name.
    if (opts.rootLabel) {
      const deepest = tree.rootSegs.reduce((m, s) => Math.max(m, s.Y1), tree.GY);
      opts.rootLabel.style.top = Math.min(deepest + 26 * tree.K, H - 4) + 'px';
    }
    // Setting canvas.width wiped the bitmap, so repaint now rather than waiting for the
    // frame loop: `visible` can be momentarily stale (see the observer below), and under
    // reduced motion the loop is not repainting at all.
    painted = false;
    draw(performance.now() / 1000);
  }

  const windX = (y: number, ph: number, t: number) => {
    if (opts.reduced) return 0;
    const hn = clamp((tree.GY - y) / (tree.GY - tree.TOPY), 0, 1);
    return Math.sin(t * 0.75 + y * 0.004 + ph) * 5 * tree.K * Math.pow(hn, 1.8);
  };
  const quad = (s: FittedSeg, u: number): [number, number] => {
    const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
    return [a * s.X0 + b * s.CX + c * s.X1, a * s.Y0 + b * s.CY + c * s.Y1];
  };

  /** How much of a segment is out of the ground at the current growth time. */
  const grown = (s: FittedSeg) => clamp((T - s.birth) / 0.6, 0, 1);

  /* A pen is anything with moveTo/lineTo — the context itself for the colour pass, a
     Path2D for the glow — so one function draws the curve for both. */
  type Pen = { moveTo(x: number, y: number): void; lineTo(x: number, y: number): void };
  function trace(pen: Pen, s: FittedSeg, p: number, t: number, isRoot: boolean) {
    const [px, py] = quad(s, 0);
    pen.moveTo(isRoot ? px : px + windX(py, s.ph, t), py);
    // Walked in steps because growth shows a fraction of the curve, and the wind bends it.
    const steps = 8;
    for (let k = 1; k <= steps; k++) {
      const [qx, y] = quad(s, (k / steps) * p);
      pen.lineTo(isRoot ? qx : qx + windX(y, s.ph, t), y);
    }
  }

  function drawSeg(s: FittedSeg, t: number, isRoot: boolean) {
    const p = grown(s);
    if (p <= 0) return;
    ctx!.strokeStyle = isRoot ? ROOT : segColour[s.id] ?? `rgb(${NAVY})`;
    ctx!.lineWidth = (isRoot ? rootWidths() : widths())[s.depth] || 1;
    ctx!.beginPath();
    trace(ctx!, s, p, t, isRoot);
    ctx!.stroke();
  }

  /*
   * The glow, in one pass per depth rather than one per segment.
   *
   * Canvas casts its shadow per draw call, and a shadowed stroke is a blur — so glowing
   * each segment where it is drawn put ninety blurs in every frame, and cost 17ms of the
   * frame on its own (measured 2026-09-09, against the same page with shadowBlur
   * swallowed). Every segment at one depth shares one width, so a depth is one path and
   * one stroke: eight blurs a frame. The colour pass then paints the same geometry on top
   * at the same widths, so nothing of this survives except the halo outside the line.
   */
  function glowPass(list: FittedSeg[], ws: number[], isRoot: boolean, t: number) {
    for (let d = 0; d < ws.length; d++) {
      const path = new Path2D();
      let first: FittedSeg | null = null;
      for (const s of list) {
        const p = s.depth === d ? grown(s) : 0;
        if (p <= 0) continue;
        first ??= s;
        trace(path, s, p, t, isRoot);
      }
      if (!first) continue;
      ctx!.strokeStyle = isRoot ? ROOT : segColour[first.id] ?? `rgb(${NAVY})`;
      ctx!.lineWidth = ws[d];
      ctx!.stroke(path);
    }
  }

  function draw(t: number) {
    const { W, H, GY, K, lights } = tree;
    ctx!.clearRect(0, 0, W, H);
    const gl = ctx!.createLinearGradient(0, 0, W, 0);
    gl.addColorStop(0, `rgba(${NAVY},0)`); gl.addColorStop(0.5, `rgba(${NAVY},0.35)`); gl.addColorStop(1, `rgba(${NAVY},0)`);
    ctx!.strokeStyle = gl; ctx!.lineWidth = 1; ctx!.beginPath(); ctx!.moveTo(0, GY); ctx!.lineTo(W, GY); ctx!.stroke();
    /* Every stroke of the figure carries the bloom's own rose, softly. It is what keeps a
       one-pixel twig from reading as a scratch on the panel, and it is the difference
       between a diagram of a tree and a lit one. */
    ctx!.lineCap = 'round';
    ctx!.shadowColor = GLOW;
    ctx!.shadowBlur = 18 * K;
    glowPass(tree.rootSegs, rootWidths(), true, t);
    glowPass(tree.segs, widths(), false, t);
    ctx!.shadowBlur = 0;
    for (const s of tree.rootSegs) drawSeg(s, t, true);
    for (const s of tree.segs) drawSeg(s, t, false);

    // the seed wakes with a halo, then is absorbed as the trunk takes over
    const sp = clamp(T / 0.3, 0, 1);
    const seedAlpha = sp * (1 - clamp((T - 0.35) / 0.6, 0, 1));
    if (seedAlpha > 0) {
      const halo = clamp(1 - (T - 0.3) / 0.9, 0, 1) * 0.35;
      if (halo > 0) {
        const g = ctx!.createRadialGradient(W * 0.5, GY, 0, W * 0.5, GY, 60 * K);
        g.addColorStop(0, `rgba(${CRIMSON},${halo})`); g.addColorStop(1, `rgba(${CRIMSON},0)`);
        ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(W * 0.5, GY, 60 * K, 0, 6.2832); ctx!.fill();
      }
      ctx!.fillStyle = `rgba(${CRIMSON},${seedAlpha})`; ctx!.beginPath(); ctx!.arc(W * 0.5, GY, 7 * K * sp, 0, 6.2832); ctx!.fill();
    }

    for (const L of lights) {
      const la = clamp((T - L.birth) / 0.5, 0, 1);
      if (la <= 0) continue;
      L.sx = L.seg.X1 + windX(L.seg.Y1, L.seg.ph, t); L.sy = L.seg.Y1;
      const tw = opts.reduced ? 0.85 : 0.75 + 0.25 * Math.sin(L.ph + t * (0.7 + (L.ph % 0.9)));
      const g = ctx!.createRadialGradient(L.sx, L.sy, 0, L.sx, L.sy, L.R * 6);
      g.addColorStop(0, `rgba(${BLOOM_CORE},${0.95 * tw * la})`);
      g.addColorStop(0.35, `rgba(${BLOOM},${0.42 * tw * la})`);
      g.addColorStop(1, `rgba(${BLOOM},0)`);
      ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(L.sx, L.sy, L.R * 6, 0, 6.2832); ctx!.fill();
      // A small bright point inside a wide halo, rather than a dot with a tight glow.
      ctx!.fillStyle = `rgba(${BLOOM_TIP},${0.98 * la})`;
      ctx!.beginPath(); ctx!.arc(L.sx, L.sy, L.R * 0.62 * la, 0, 6.2832); ctx!.fill();
    }

    tree.limbs.forEach((l, i) => { const el = opts.limbLabels[i]; if (el) el.style.opacity = String(clamp((T - l.birth) / 0.5, 0, 1)); });
    if (opts.rootLabel) opts.rootLabel.style.opacity = String(clamp((T - tree.rootBirth) / 0.5, 0, 1));

    if (!opts.reduced && T > 3) for (const lf of leaves) {
      if (!lf.live) {
        if (Math.random() < 0.006 && lights.length) {
          const src = lights[(Math.random() * lights.length) | 0];
          lf.live = true; lf.x = src.sx; lf.y = src.sy; lf.vy = 14 + Math.random() * 12; lf.ph = Math.random() * 6.283;
          lf.life = 0; lf.span = 4 + Math.random() * 3; lf.s = (1.4 + Math.random() * 1.4) * K;
        }
        continue;
      }
      lf.life += 1 / 60; lf.y += lf.vy / 60; lf.x += Math.sin(lf.ph + t * 1.6) * 0.5;
      if (lf.y > GY || lf.life > lf.span) { lf.live = false; continue; }
      const a = Math.min(1, lf.life / 0.5) * Math.min(1, (lf.span - lf.life) / 0.8) * 0.6;
      ctx!.fillStyle = `rgba(${BLOOM},${a})`; ctx!.fillRect(lf.x, lf.y, lf.s, lf.s);
    }
    painted = true;
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    // Someone who asked for less motion gets no motion here, so once the frame is on the
    // canvas there is nothing to redraw until T or the box changes.
    if (opts.reduced && painted) return;
    draw(now / 1000);
  }
  size();
  raf = requestAnimationFrame(frame);
  // Take the LAST entry, not the first. Entries are delivered oldest-first and several
  // arrive together whenever the main thread was busy — a GSAP _refreshAll after a resize
  // is exactly that — so `es[0]` on a [false, true] batch leaves `visible` false with the
  // box on screen, and nothing repaints until the next intersection change.
  const io = new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; }, { threshold: 0.02 });
  io.observe(stage);
  let rt = 0;
  const onResize = () => { window.clearTimeout(rt); rt = window.setTimeout(size, 240); };
  window.addEventListener('resize', onResize);
  return {
    // A new growth time invalidates the canvas; under reduced motion this is the only
    // thing that ever asks the frame loop to paint again.
    setT: (v) => { if (v !== T) { T = v; painted = false; } },
    destroy() {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.clearTimeout(rt);
      window.removeEventListener('resize', onResize);
    },
  };
}
