/** Growth time at the end of the Visjon pin; the tree is complete around 3.3. */
export const GROW = 3.8;

const MAXD = 4;
const NAVY = '42,57,75';
const TWIG = 'rgb(84,98,116)';
const ROOT = 'rgb(74,90,110)';
const GOLD = '201,154,63';
const CRIMSON = '171,82,99';

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
  const rk = (H - GY - 40 * K) / 0.42;
  const rootSegs: FittedSeg[] = model.rootSegs.map((s) => ({
    ...s, X0: W * 0.5 + s.x0 * rk * 1.6, Y0: GY + s.y0 * rk, CX: W * 0.5 + s.cx * rk * 1.6, CY: GY + s.cy * rk,
    X1: W * 0.5 + s.x1 * rk * 1.6, Y1: GY + s.y1 * rk, birth: 0.25 + s.depth * 0.35,
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
  const leaves = Array.from({ length: 10 }, () => ({ live: false, x: 0, y: 0, vy: 0, ph: 0, life: 0, span: 0, s: 0 }));
  const widths = () => [30, 14, 7, 3.4, 1.8].map((w) => w * tree.K);
  const rootWidths = () => [18, 9, 4.5].map((w) => w * tree.K);

  function size() {
    const W = stage.clientWidth, H = stage.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR; ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
    tree = fit(model, { W, H });
    tree.limbs.forEach((l, i) => { const el = opts.limbLabels[i]; if (el) { el.style.left = l.x + 'px'; el.style.top = l.y + 'px'; } });
    if (opts.rootLabel) opts.rootLabel.style.top = H - 6 + 'px';
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

  function drawSeg(s: FittedSeg, t: number, isRoot: boolean) {
    const p = clamp((T - s.birth) / 0.6, 0, 1);
    if (p <= 0) return;
    const ws = isRoot ? rootWidths() : widths();
    const w0 = ws[s.depth] || 1, w1 = ws[s.depth + 1] || w0 * 0.55;
    ctx!.strokeStyle = isRoot ? ROOT : s.depth >= 3 ? TWIG : `rgb(${NAVY})`;
    ctx!.lineCap = 'round';
    let [px, py] = quad(s, 0);
    if (!isRoot) px += windX(py, s.ph, t);
    const steps = 8;
    for (let k = 1; k <= steps; k++) {
      const u = (k / steps) * p;
      const [qx, y] = quad(s, u);
      const x = isRoot ? qx : qx + windX(y, s.ph, t);
      ctx!.lineWidth = lerp(w0, w1, u);
      ctx!.beginPath(); ctx!.moveTo(px, py); ctx!.lineTo(x, y); ctx!.stroke();
      px = x; py = y;
    }
  }

  function draw(t: number) {
    const { W, H, GY, K, lights } = tree;
    ctx!.clearRect(0, 0, W, H);
    const gl = ctx!.createLinearGradient(0, 0, W, 0);
    gl.addColorStop(0, `rgba(${NAVY},0)`); gl.addColorStop(0.5, `rgba(${NAVY},0.35)`); gl.addColorStop(1, `rgba(${NAVY},0)`);
    ctx!.strokeStyle = gl; ctx!.lineWidth = 1; ctx!.beginPath(); ctx!.moveTo(0, GY); ctx!.lineTo(W, GY); ctx!.stroke();
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
      const g = ctx!.createRadialGradient(L.sx, L.sy, 0, L.sx, L.sy, L.R * 4);
      g.addColorStop(0, `rgba(${GOLD},${0.28 * tw * la})`); g.addColorStop(1, `rgba(${GOLD},0)`);
      ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(L.sx, L.sy, L.R * 4, 0, 6.2832); ctx!.fill();
      ctx!.fillStyle = `rgba(${GOLD},${(0.75 + 0.25 * tw) * la})`;
      ctx!.beginPath(); ctx!.arc(L.sx, L.sy, L.R * la, 0, 6.2832); ctx!.fill();
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
      ctx!.fillStyle = `rgba(${GOLD},${a})`; ctx!.fillRect(lf.x, lf.y, lf.s, lf.s);
    }
  }

  function frame(now: number) { raf = requestAnimationFrame(frame); if (!visible) return; draw(now / 1000); }
  size();
  raf = requestAnimationFrame(frame);
  const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.02 });
  io.observe(stage);
  let rt = 0;
  const onResize = () => { window.clearTimeout(rt); rt = window.setTimeout(size, 240); };
  window.addEventListener('resize', onResize);
  return {
    setT: (v) => { T = v; },
    destroy() { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener('resize', onResize); },
  };
}
