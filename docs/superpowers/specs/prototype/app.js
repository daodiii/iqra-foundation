gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) document.body.classList.add('reduced');

const captions = {
  a: 'A · Partikler. Lyset samler seg til ordet اقرأ, og går i oppløsning til en stjernehimmel over Mekka. Ordene under blir skarpe ett og ett når du blar.',
  b: 'B · Gjennom bokstavene. Filmen spilles inne i bokstavene IQRA. Bla nedover, og bokstavene åpner seg til filmen fyller skjermen. Så vokser et tre fra et frø: roten er Iqra, greinene er Dialog, Brobygging og Kunnskap.',
  c: 'C · Linjen. Én linje tegner hele siden: skriver ordet, understreker «Les.», rammer inn bildet, og ender som det røde punktumet. Pennespissen er prikken fra logoen.',
};

/* ---------- A · Partikler ---------- */
const A = (() => {
  let raf = 0, particles = [], phase = 'idle', t0 = 0, last = 0, cv, ctx, W, H, hero;
  const N = 3200;

  function targets(text) {
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const c = off.getContext('2d');
    c.fillStyle = '#fff';
    c.font = `${Math.min(W * 0.3, 460)}px Amiri, serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.direction = 'rtl';
    c.fillText(text, W / 2, H * 0.42);
    const img = c.getImageData(0, 0, W, H).data;
    const pts = [];
    for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) if (img[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
    for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
    return pts.slice(0, N);
  }

  function build() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = targets('اقرأ').map(([tx, ty]) => ({
      x: Math.random() * W, y: Math.random() * H, tx, ty, vx: 0, vy: 0,
      r: Math.random() * 1.3 + 0.5,
      c: Math.random() < 0.07 ? '#ab5263' : Math.random() < 0.5 ? '#f0d9a0' : '#ffffff',
      a: 0.45 + Math.random() * 0.55,
    }));
  }

  function frame(now) {
    const dt = last ? Math.min((now - last) / 16.7, 2) : 1;
    last = now;
    const el = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      if (phase === 'gather') {
        p.x += (p.tx - p.x) * 0.07 * dt;
        p.y += (p.ty - p.y) * 0.07 * dt;
      } else {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 0.985; p.vy *= 0.985; p.vy -= 0.012 * dt;
        if (p.y < -10) p.y = H + 10;
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
      }
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fill();
    }
    if (phase === 'gather' && el > 3.4) {
      phase = 'burst';
      hero.classList.add('burst');
      for (const p of particles) {
        const ang = Math.random() * 6.2832, sp = Math.random() * 2.4 + 0.3;
        p.vx = Math.cos(ang) * sp; p.vy = Math.sin(ang) * sp - 0.6;
      }
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    cancelAnimationFrame(raf);
    hero.classList.remove('burst');
    build();
    if (reduced) { phase = 'burst'; hero.classList.add('burst'); return; }
    phase = 'gather'; t0 = performance.now(); last = 0;
    raf = requestAnimationFrame(frame);
  }
  function onResize() { if (phase !== 'idle') start(); }

  return {
    init() {
      hero = document.getElementById('a-hero');
      cv = document.getElementById('a-canvas');
      ctx = cv.getContext('2d');
      document.getElementById('a-replay').onclick = start;
      document.fonts.load('400 100px Amiri').then(start, start);
      document.querySelectorAll('.a-words').forEach((p) => {
        if (p.dataset.split) return;
        p.dataset.split = '1';
        p.innerHTML = p.textContent.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ');
      });
      if (!reduced) document.querySelectorAll('.a-block').forEach((block) => {
        gsap.fromTo(block.querySelectorAll('.w'),
          { opacity: 0, filter: 'blur(14px)', y: 18 },
          { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.035, scrollTrigger: { trigger: block, start: 'top 72%' } });
      });
      window.addEventListener('resize', onResize);
    },
    destroy() { cancelAnimationFrame(raf); phase = 'idle'; window.removeEventListener('resize', onResize); },
  };
})();

/* ---------- The vision tree: a seed, a fat root called Iqra, three limbs with names ---------- */
function buildVisionTree(stage) {
  const cv = stage.querySelector('canvas');
  const ctx = cv.getContext('2d');
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const limbLabels = [...stage.querySelectorAll('.tree-label')];      // left to right: Dialog, Brobygging, Kunnskap
  const rootLabel = stage.querySelector('.tree-root-label');
  const MAXD = 4;
  const NAVY = '42,57,75', GOLD = '201,154,63', CRIMSON = '171,82,99';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const makeRnd = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  let W = 0, H = 0, GY = 0, TOPY = 0, K = 1, segs = [], rootSegs = [], lights = [], leaves = [], limbs = [];
  let T = 0, raf = 0, visible = true;
  const widths = () => [30, 14, 7, 3.4, 1.8].map((w) => w * K);
  const rootWidths = () => [18, 9, 4.5].map((w) => w * K);

  function genTree() {
    for (let seed = 9; seed < 400; seed++) {
      const rnd = makeRnd(seed);
      segs = []; const tips = [];
      (function branch(x, y, ang, len, depth, parent) {
        ang = lerp(ang, -Math.PI / 2, depth === 0 ? 0 : 0.12);
        const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len;
        const perp = ang + Math.PI / 2, bow = (rnd() - 0.5) * len * (depth === 0 ? 0.12 : 0.5);
        const cx = (x + x1) / 2 + Math.cos(perp) * bow, cy = (y + y1) / 2 + Math.sin(perp) * bow;
        const id = segs.length;
        segs.push({ x0: x, y0: y, cx, cy, x1, y1, depth, parent, ph: rnd() * 6.283, id });
        if (depth >= MAXD) { tips.push(segs[id]); return; }
        const n = depth === 0 ? 3 : (rnd() < 0.55 ? 2 : 3);   // exactly three limbs, then twigs
        const spread = [1.15, 0.7, 0.62, 0.54][depth] || 0.5;
        for (let k = 0; k < n; k++) {
          const off = (k - (n - 1) / 2) * spread + (rnd() - 0.5) * 0.2;
          branch(x1, y1, ang + off, len * (depth === 0 ? 0.78 : 0.62 + rnd() * 0.14), depth + 1, id);
        }
      })(0, 0, -Math.PI / 2, 1, 0, -1);
      let minX = 0, maxX = 0;
      segs.forEach((s) => { minX = Math.min(minX, s.x1); maxX = Math.max(maxX, s.x1); });
      const balance = Math.abs(minX + maxX) / (maxX - minX);
      const limbSegs = segs.filter((s) => s.depth === 1);
      const limbsApart = limbSegs.length === 3 && Math.abs(limbSegs[0].x1 - limbSegs[2].x1) > 0.9;
      if (tips.length >= 30 && tips.length <= 64 && balance < 0.12 && limbsApart) {
        const rl = makeRnd(seed + 100);
        lights = tips.map((seg) => ({ seg, R: (2.2 + rl() * 2.2) * K, ph: seg.ph, sx: 0, sy: 0 }));
        break;
      }
    }
    const rr = makeRnd(31);
    rootSegs = [];
    (function root(x, y, ang, len, depth) {
      const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len;
      const perp = ang + Math.PI / 2, bow = (rr() - 0.5) * len * 0.5;
      const cx = (x + x1) / 2 + Math.cos(perp) * bow, cy = (y + y1) / 2 + Math.sin(perp) * bow;
      rootSegs.push({ x0: x, y0: y, cx, cy, x1, y1, depth });
      if (depth >= 2) return;
      const n = depth === 0 ? 4 : 2;
      for (let k = 0; k < n; k++) {
        const off = (k - (n - 1) / 2) * 1.0 + (rr() - 0.5) * 0.3;
        root(x1, y1, ang + off * 0.7, len * 0.6, depth + 1);
      }
    })(0, 0, Math.PI / 2, 0.3, 0);
  }

  function fitTree() {
    let minY = 0, minX = 0, maxX = 0;
    segs.forEach((s) => { minY = Math.min(minY, s.y1); minX = Math.min(minX, s.x1); maxX = Math.max(maxX, s.x1); });
    const ky = (GY - TOPY) / (-minY || 1);
    const kx = Math.min(ky, (W * 0.9) / Math.max(0.0001, maxX - minX));
    const midX = (minX + maxX) / 2;
    const mapX = (v) => W * 0.5 + (v - midX * 0.7) * kx;
    const mapY = (v) => GY + v * ky;
    segs.forEach((s) => { s.X0 = mapX(s.x0); s.Y0 = mapY(s.y0); s.CX = mapX(s.cx); s.CY = mapY(s.cy); s.X1 = mapX(s.x1); s.Y1 = mapY(s.y1); });
    const rk = (H - GY - 40 * K) / 0.42;   // the roots fill the room below the ground line, leaving space for the name
    rootSegs.forEach((s) => {
      s.X0 = W * 0.5 + s.x0 * rk * 1.6; s.Y0 = GY + s.y0 * rk;
      s.CX = W * 0.5 + s.cx * rk * 1.6; s.CY = GY + s.cy * rk;
      s.X1 = W * 0.5 + s.x1 * rk * 1.6; s.Y1 = GY + s.y1 * rk;
    });
    segs.forEach((s) => { s.birth = 0.3 + s.depth * 0.5 + (s.ph % 1) * 0.24; });
    rootSegs.forEach((s) => { s.birth = 0.25 + s.depth * 0.35; });
    lights.forEach((L, i) => { L.birth = L.seg.birth + 0.62 + i * 0.01; });

    // One label per limb: at the tip that reaches farthest along the limb's own direction.
    const trunk = segs[0];
    const limbSegs = segs.filter((s) => s.depth === 1).sort((a, b) => a.X1 - b.X1);
    const limbOf = (s) => { while (s.depth > 1) s = segs[s.parent]; return s; };
    limbs = limbSegs.map((limb, i) => {
      const dx = limb.X1 - trunk.X1, dy = limb.Y1 - trunk.Y1, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
      let best = null, bp = -Infinity;
      for (const L of lights) if (limbOf(L.seg) === limb) {
        const p = (L.seg.X1 - trunk.X1) * ux + (L.seg.Y1 - trunk.Y1) * uy;
        if (p > bp) { bp = p; best = L; }
      }
      const tip = best ? best.seg : limb;
      const label = limbLabels[i];
      const x = clamp(tip.X1 + ux * 34 * K, 40, W - 40), y = clamp(tip.Y1 + uy * 28 * K - 6 * K, 14, GY - 14);
      if (label) { label.style.left = x + 'px'; label.style.top = y + 'px'; }
      return { label, birth: limb.birth + 1.3 };   // the name arrives while the limb's twigs are still growing
    });
    if (rootLabel) { rootLabel.style.top = (H - 6) + 'px'; }
  }

  function size() {
    W = stage.clientWidth; H = stage.clientHeight;
    K = clamp(H / 640, 0.5, 1.4);
    GY = H * 0.74; TOPY = H * 0.06;
    cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    genTree(); fitTree();
    leaves = Array.from({ length: 10 }, () => ({ live: false }));
  }

  const windX = (y, ph, t) => { if (reduced) return 0; const hn = clamp((GY - y) / (GY - TOPY), 0, 1); return Math.sin(t * 0.75 + y * 0.004 + ph) * 5 * K * Math.pow(hn, 1.8); };
  const quad = (s, u) => { const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u; return [a * s.X0 + b * s.CX + c * s.X1, a * s.Y0 + b * s.CY + c * s.Y1]; };

  // Tapered strokes: each segment is drawn in short pieces whose width runs from its own depth's width to the next.
  function drawSeg(s, t, isRoot) {
    const p = clamp((T - s.birth) / 0.6, 0, 1);
    if (p <= 0) return;
    const ws = isRoot ? rootWidths() : widths();
    const w0 = ws[s.depth] || 1, w1 = ws[s.depth + 1] || w0 * 0.55;
    ctx.strokeStyle = isRoot ? 'rgb(74,90,110)' : (s.depth >= 3 ? 'rgb(84,98,116)' : 'rgb(' + NAVY + ')');
    ctx.lineCap = 'round';
    let [px, py] = quad(s, 0);
    if (!isRoot) px += windX(py, s.ph, t);
    const steps = 8;
    for (let k = 1; k <= steps; k++) {
      const u = (k / steps) * p;
      let [x, y] = quad(s, u);
      if (!isRoot) x += windX(y, s.ph, t);
      ctx.lineWidth = lerp(w0, w1, u);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
      px = x; py = y;
    }
  }

  function drawTree(t) {
    ctx.clearRect(0, 0, W, H);
    // ground line
    const gl = ctx.createLinearGradient(0, 0, W, 0);
    gl.addColorStop(0, 'rgba(' + NAVY + ',0)'); gl.addColorStop(0.5, 'rgba(' + NAVY + ',0.35)'); gl.addColorStop(1, 'rgba(' + NAVY + ',0)');
    ctx.strokeStyle = gl; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();

    for (const s of rootSegs) drawSeg(s, t, true);
    for (const s of segs) drawSeg(s, t, false);

    // the seed: the crimson dot wakes with a soft halo, then is absorbed as the trunk takes over
    const sp = clamp(T / 0.3, 0, 1);
    const seedAlpha = sp * (1 - clamp((T - 0.35) / 0.6, 0, 1));
    if (seedAlpha > 0) {
      const halo = clamp(1 - (T - 0.3) / 0.9, 0, 1) * 0.35;
      if (halo > 0) {
        const g = ctx.createRadialGradient(W * 0.5, GY, 0, W * 0.5, GY, 60 * K);
        g.addColorStop(0, 'rgba(' + CRIMSON + ',' + halo + ')'); g.addColorStop(1, 'rgba(' + CRIMSON + ',0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W * 0.5, GY, 60 * K, 0, 6.2832); ctx.fill();
      }
      ctx.fillStyle = 'rgba(' + CRIMSON + ',' + seedAlpha + ')'; ctx.beginPath(); ctx.arc(W * 0.5, GY, 7 * K * sp, 0, 6.2832); ctx.fill();
    }

    // leaf-lights at the tips
    for (const L of lights) {
      const la = clamp((T - L.birth) / 0.5, 0, 1);
      if (la <= 0) continue;
      L.sx = L.seg.X1 + windX(L.seg.Y1, L.seg.ph, t); L.sy = L.seg.Y1;
      const tw = reduced ? 0.85 : 0.75 + 0.25 * Math.sin(L.ph + t * (0.7 + (L.ph % 0.9)));
      const g = ctx.createRadialGradient(L.sx, L.sy, 0, L.sx, L.sy, L.R * 4);
      g.addColorStop(0, 'rgba(' + GOLD + ',' + 0.28 * tw * la + ')'); g.addColorStop(1, 'rgba(' + GOLD + ',0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(L.sx, L.sy, L.R * 4, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(' + GOLD + ',' + (0.75 + 0.25 * tw) * la + ')';
      ctx.beginPath(); ctx.arc(L.sx, L.sy, L.R * la, 0, 6.2832); ctx.fill();
    }

    // names: each limb's when its farthest light is lit; Iqra when the roots have taken hold
    for (const l of limbs) if (l.label) l.label.style.opacity = clamp((T - l.birth) / 0.5, 0, 1);
    if (rootLabel) rootLabel.style.opacity = clamp((T - 1.0) / 0.5, 0, 1);

    if (!reduced && T > 3) for (const lf of leaves) {
      if (!lf.live) {
        if (Math.random() < 0.006 && lights.length) {
          const src = lights[(Math.random() * lights.length) | 0];
          lf.live = true; lf.x = src.sx; lf.y = src.sy; lf.vy = 14 + Math.random() * 12; lf.ph = Math.random() * 6.283; lf.life = 0; lf.span = 4 + Math.random() * 3; lf.s = (1.4 + Math.random() * 1.4) * K;
        }
        continue;
      }
      lf.life += 1 / 60; lf.y += lf.vy / 60; lf.x += Math.sin(lf.ph + t * 1.6) * 0.5;
      if (lf.y > GY || lf.life > lf.span) { lf.live = false; continue; }
      const a = Math.min(1, lf.life / 0.5) * Math.min(1, (lf.span - lf.life) / 0.8) * 0.6;
      ctx.fillStyle = 'rgba(' + GOLD + ',' + a + ')'; ctx.fillRect(lf.x, lf.y, lf.s, lf.s);
    }
  }

  function frame(now) { raf = requestAnimationFrame(frame); if (!visible) return; drawTree(now / 1000); }
  size();
  raf = requestAnimationFrame(frame);
  const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.02 });
  io.observe(stage);
  let rt = 0;
  const onResize = () => { clearTimeout(rt); rt = setTimeout(size, 240); };
  addEventListener('resize', onResize);
  return { setT: (v) => { T = v; }, destroy() { cancelAnimationFrame(raf); io.disconnect(); removeEventListener('resize', onResize); } };
}

/* ---------- B · Gjennom bokstavene ---------- */
const B = (() => ({
  init() {
    const media = document.getElementById('b-media');
    const video = document.getElementById('b-video');
    let ok = false;
    video.addEventListener('loadeddata', () => { ok = true; }, { once: true });
    video.addEventListener('error', () => media.classList.add('fallback'), { once: true });
    video.play().catch(() => {});
    setTimeout(() => { if (!ok && video.readyState < 2) media.classList.add('fallback'); }, 4000);
    // Loop the montage only; the film's white end card must never show inside the letters.
    video.addEventListener('timeupdate', () => { if (video.currentTime > 4.3) video.currentTime = 0.05; });
    // Scale from inside the I's stem (solid ink): the centre of the first glyph's advance box.
    const word = document.getElementById('b-word');
    const bb = word.getBBox();
    const s0 = word.getStartPositionOfChar(0), e0 = word.getEndPositionOfChar(0);
    const origin = `${(s0.x + e0.x) / 2} ${bb.y + bb.height * 0.5}`;

    // The vision tree lives beside the vision text.
    if (this.tree) this.tree.destroy();
    this.tree = buildVisionTree(document.getElementById('b-tree'));
    const tree = this.tree;
    const GROW = 3.8;
    const vision = document.getElementById('b-vision');
    const mission = document.getElementById('b-mission');
    const kinLines = document.querySelectorAll('.b-kin-line');

    if (reduced) {
      gsap.set('.b-mask', { opacity: 0 });
      gsap.set(['.b-copy', '.b-scrim'], { opacity: 1 });
      gsap.set('.b-hint', { opacity: 0 });
      tree.setT(99);
      gsap.set('.b-mission-text', { opacity: 1 });
      return;
    }

    // Hero: film fades up inside the letters, then the letters open with the scroll.
    gsap.fromTo(video, { opacity: 0, scale: 1.18 }, { opacity: 1, scale: 1.12, duration: 1.6, ease: 'power2.out' });
    const tl = gsap.timeline({ scrollTrigger: { trigger: '#b-pin', start: 'top top', end: '+=300%', pin: true, scrub: 0.5 } });
    tl.to('#b-word', { scale: 7, svgOrigin: origin, ease: 'none', duration: 0.55 }, 0)
      .to('#b-word', { scale: 14, svgOrigin: origin, ease: 'power2.in', duration: 0.25 }, 0.55)
      .to('.b-mask', { opacity: 0, ease: 'power2.inOut', duration: 0.16 }, 0.64)
      .to(video, { scale: 1, ease: 'power1.inOut', duration: 0.5 }, 0.4)
      .to('.b-hint', { opacity: 0, duration: 0.08 }, 0)
      .to('.b-scrim', { opacity: 1, duration: 0.2 }, 0.72)
      .fromTo('.b-copy', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.2, ease: 'expo.out' }, 0.82)
      .to({}, { duration: 0.16 });

    // Visjon: the lines come in once; the tree grows with the scroll (desktop) or by itself (phones).
    const linesIn = () => gsap.fromTo(kinLines,
      { x: (i, el) => 120 * Number(el.dataset.dir), skewX: (i, el) => -8 * Number(el.dataset.dir), opacity: 0 },
      { x: 0, skewX: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.09 });
    const mm = gsap.matchMedia();
    mm.add('(min-width: 768px)', () => {
      ScrollTrigger.create({ trigger: vision, start: 'top top', end: '+=160%', pin: true, scrub: 0.6, onEnter: linesIn, onUpdate: (self) => tree.setT(self.progress * GROW) });
      gsap.timeline({ scrollTrigger: { trigger: mission, start: 'top top', end: '+=100%', pin: true, scrub: 0.6 } })
        .fromTo('.b-mission-still', { scale: 1 }, { scale: 1.06, duration: 1, ease: 'none' }, 0)
        .fromTo('.b-mission-text', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'expo.out' }, 0.08);
    });
    mm.add('(max-width: 767px)', () => {
      const p = { T: 0 };
      ScrollTrigger.create({ trigger: vision, start: 'top 60%', once: true, onEnter: () => { linesIn(); gsap.to(p, { T: GROW, duration: 5, ease: 'none', onUpdate: () => tree.setT(p.T) }); } });
      gsap.fromTo('.b-mission-text', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: mission, start: 'top 70%' } });
    });
  },
  destroy() { document.getElementById('b-video').pause(); if (this.tree) { this.tree.destroy(); this.tree = null; } },
}))();

/* ---------- C · Linjen ---------- */
const C = (() => {
  const INTRO = 0.22;
  const intro = { v: 0 };
  let scrollP = 0, path, pen, ar, h1, L;

  function render() {
    const p = INTRO * intro.v + (1 - INTRO) * scrollP;
    path.style.strokeDashoffset = L * (1 - p);
    const pt = path.getPointAtLength(L * p);
    pen.setAttribute('cx', pt.x);
    pen.setAttribute('cy', pt.y);
    const k = Math.max(0, Math.min(1, (p - 0.05) / 0.14));
    ar.style.clipPath = `inset(0 0 0 ${(1 - k) * 100}%)`;
    h1.style.opacity = Math.max(0, Math.min(1, (p - 0.18) / 0.05));
  }

  return {
    init() {
      path = document.getElementById('c-path');
      pen = document.getElementById('c-pen');
      ar = document.getElementById('c-ar');
      h1 = document.querySelector('.c-h1');
      L = path.getTotalLength();
      path.style.strokeDasharray = L;
      if (reduced) {
        path.style.strokeDashoffset = 0;
        const e = path.getPointAtLength(L);
        pen.setAttribute('cx', e.x); pen.setAttribute('cy', e.y);
        return;
      }
      intro.v = 0; scrollP = 0; render();
      gsap.to(intro, { v: 1, duration: 2.6, ease: 'power2.inOut', onUpdate: render });
      ScrollTrigger.create({ trigger: '#c-page', start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: (self) => { scrollP = self.progress; render(); } });
      document.querySelectorAll('.c-reveal').forEach((el) => {
        gsap.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 82%' } });
      });
    },
    destroy() {},
  };
})();

/* ---------- switcher ---------- */
const concepts = { a: A, b: B, c: C };
let active = null;

function activate(id) {
  if (active === id) return;
  if (active) {
    concepts[active].destroy();
    ScrollTrigger.getAll().forEach((t) => t.kill(true));
    gsap.globalTimeline.clear();
  }
  document.querySelectorAll('.concept').forEach((s) => s.classList.toggle('active', s.id === id));
  document.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.c === id)));
  document.getElementById('caption').textContent = captions[id];
  window.scrollTo(0, 0);
  active = id;
  history.replaceState(null, '', '#' + id);
  requestAnimationFrame(() => { concepts[id].init(); ScrollTrigger.refresh(); });
}

document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => activate(t.dataset.c)));
const wanted = location.hash.slice(1);
activate(wanted in concepts ? wanted : 'b');
