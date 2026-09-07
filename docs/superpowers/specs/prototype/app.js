gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) document.body.classList.add('reduced');

const captions = {
  a: 'A · Partikler. Lyset samler seg til ordet اقرأ, og går i oppløsning til en stjernehimmel over Mekka. Ordene under blir skarpe ett og ett når du blar.',
  b: 'B · Gjennom bokstavene. Filmen spilles inne i bokstavene IQRA. Bla nedover, og bokstavene åpner seg til filmen fyller skjermen. Visjonen kommer inn fra sidene.',
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
  function onResize() { if (phase !== 'idle') start(); }
})();

/* ---------- The tree: three limbs from a seed, then twigs, lights, wind ---------- */
function buildIqraTree(stage) {
  const cv = stage.querySelector('canvas');
  const ctx = cv.getContext('2d');
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const MAXD = 4, WIDTHS = [6.5, 4.2, 2.8, 1.8, 1.1], ROOTW = [3.2, 1.9, 1.1];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const makeRnd = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  let W = 0, H = 0, GY = 0, TOPY = 0, segs = [], rootSegs = [], lights = [], mist = [], leaves = [];
  let T = 0, raf = 0, visible = true;

  function genTree() {
    for (let seed = 9; seed < 200; seed++) {
      const rnd = makeRnd(seed);
      segs = []; const tips = [];
      (function branch(x, y, ang, len, depth, parent) {
        ang = lerp(ang, -Math.PI / 2, depth === 0 ? 0 : 0.14);
        const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len;
        const perp = ang + Math.PI / 2, bow = (rnd() - 0.5) * len * (depth === 0 ? 0.2 : 0.55);
        const cx = (x + x1) / 2 + Math.cos(perp) * bow, cy = (y + y1) / 2 + Math.sin(perp) * bow;
        const id = segs.length;
        segs.push({ x0: x, y0: y, cx, cy, x1, y1, depth, parent, ph: rnd() * 6.283, id });
        if (depth >= MAXD) { tips.push(segs[id]); return; }
        const n = depth === 0 ? 3 : (rnd() < 0.5 ? 2 : 3);   // three limbs for the three actions
        const spread = [1.05, 0.66, 0.6, 0.52][depth] || 0.5;
        for (let k = 0; k < n; k++) {
          const off = (k - (n - 1) / 2) * spread + (rnd() - 0.5) * 0.22;
          branch(x1, y1, ang + off, len * (0.6 + rnd() * 0.16), depth + 1, id);
        }
      })(0, 0, -Math.PI / 2, 1, 0, -1);
      let minX = 0, maxX = 0;
      segs.forEach((s) => { minX = Math.min(minX, s.x1); maxX = Math.max(maxX, s.x1); });
      const balance = Math.abs(minX + maxX) / (maxX - minX);
      if (tips.length >= 28 && tips.length <= 60 && balance < 0.16) {
        const rl = makeRnd(seed + 100);
        lights = tips.map((seg) => ({ seg, R: 1.8 + rl() * 2.2, ph: seg.ph, sx: 0, sy: 0 }));
        break;
      }
    }
    const rr = makeRnd(31);
    rootSegs = [];
    (function root(x, y, ang, len, depth) {
      const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len;
      const perp = ang + Math.PI / 2, bow = (rr() - 0.5) * len * 0.6;
      const cx = (x + x1) / 2 + Math.cos(perp) * bow, cy = (y + y1) / 2 + Math.sin(perp) * bow;
      rootSegs.push({ x0: x, y0: y, cx, cy, x1, y1, depth });
      if (depth >= 2) return;
      const n = depth === 0 ? 4 : 2;
      for (let k = 0; k < n; k++) {
        const off = (k - (n - 1) / 2) * 0.9 + (rr() - 0.5) * 0.3;
        root(x1, y1, ang + off * 0.6, len * 0.62, depth + 1);
      }
    })(0, 0, Math.PI / 2, 0.34, 0);
  }

  function fitTree() {
    let minY = 0, minX = 0, maxX = 0;
    segs.forEach((s) => { minY = Math.min(minY, s.y1); minX = Math.min(minX, s.x1); maxX = Math.max(maxX, s.x1); });
    const ky = (GY - TOPY) / (-minY || 1);
    const kx = Math.min(ky, (W * 0.92) / Math.max(0.0001, maxX - minX));
    const midX = (minX + maxX) / 2;
    const mapX = (v) => W * 0.5 + (v - midX * 0.7) * kx;
    const mapY = (v) => GY + v * ky;
    segs.forEach((s) => { s.X0 = mapX(s.x0); s.Y0 = mapY(s.y0); s.CX = mapX(s.cx); s.CY = mapY(s.cy); s.X1 = mapX(s.x1); s.Y1 = mapY(s.y1); });
    rootSegs.forEach((s) => {
      s.X0 = W * 0.5 + s.x0 * ky * 0.9; s.Y0 = GY + s.y0 * ky * 0.5;
      s.CX = W * 0.5 + s.cx * ky * 0.9; s.CY = GY + s.cy * ky * 0.5;
      s.X1 = W * 0.5 + s.x1 * ky * 0.9; s.Y1 = GY + s.y1 * ky * 0.5;
    });
    segs.forEach((s) => { s.birth = 0.3 + s.depth * 0.5 + (s.ph % 1) * 0.24; });
    rootSegs.forEach((s) => { s.birth = 0.3 + s.depth * 0.4; });
    lights.forEach((L, i) => { L.birth = L.seg.birth + 0.62 + i * 0.012; });
  }

  function size() {
    W = stage.clientWidth; H = stage.clientHeight;
    GY = H * 0.86; TOPY = H * 0.06;
    cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    genTree(); fitTree();
    const rnd = makeRnd(3);
    mist = Array.from({ length: 4 }, (_, i) => ({ x: rnd() * W, y: GY - 6 + i * 8, rx: W * (0.16 + rnd() * 0.18), ry: 8 + rnd() * 11, v: (rnd() - 0.5) * 7, ph: rnd() * 6.283 }));
    leaves = Array.from({ length: 10 }, () => ({ live: false }));
  }

  const windX = (y, ph, t) => { if (reduced) return 0; const hn = clamp((GY - y) / (GY - TOPY), 0, 1); return Math.sin(t * 0.75 + y * 0.004 + ph) * 6 * Math.pow(hn, 1.8); };
  const quad = (s, u) => { const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u; return [a * s.X0 + b * s.CX + c * s.X1, a * s.Y0 + b * s.CY + c * s.Y1]; };

  function drawSeg(s, t, isRoot) {
    const p = clamp((T - s.birth) / 0.6, 0, 1);
    if (p <= 0) return;
    const w = (isRoot ? ROOTW : WIDTHS)[s.depth] || 1;
    const alpha = isRoot ? 0.26 : 0.5 + 0.28 * (1 - s.depth / MAXD);
    ctx.strokeStyle = 'rgba(227,179,92,' + alpha + ')'; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let k = 0; k <= 7; k++) {
      const u = (k / 7) * p;
      let [x, y] = quad(s, u);
      if (!isRoot) x += windX(y, s.ph, t);
      k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function drawTree(t) {
    ctx.clearRect(0, 0, W, H);
    const gl = ctx.createLinearGradient(0, 0, W, 0);
    gl.addColorStop(0, 'rgba(228,209,164,0)'); gl.addColorStop(0.5, 'rgba(228,209,164,.24)'); gl.addColorStop(1, 'rgba(228,209,164,0)');
    ctx.strokeStyle = gl; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();
    for (const s of rootSegs) drawSeg(s, t, true);
    for (const s of segs) drawSeg(s, t, false);

    // the seed: the logo's crimson dot, with a warm basin of light
    const sp = clamp(T / 0.3, 0, 1);
    if (sp > 0) {
      ctx.globalCompositeOperation = 'lighter';
      const fb = reduced ? 1 : 1 + 0.05 * Math.sin(t * 1.1);
      const FR = 10 * fb * (0.6 + 0.4 * sp);
      const bg = ctx.createRadialGradient(W * 0.5, GY, 0, W * 0.5, GY, FR * 7);
      bg.addColorStop(0, 'rgba(244,204,124,' + 0.26 * sp + ')'); bg.addColorStop(0.5, 'rgba(227,179,92,.10)'); bg.addColorStop(1, 'rgba(227,179,92,0)');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(W * 0.5, GY, FR * 7, FR * 3.2, 0, 0, 6.2832); ctx.fill();
      const cg = ctx.createRadialGradient(W * 0.5, GY, 0, W * 0.5, GY, FR * 2);
      cg.addColorStop(0, 'rgba(255,225,230,.95)'); cg.addColorStop(0.45, 'rgba(171,82,99,.55)'); cg.addColorStop(1, 'rgba(171,82,99,0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(W * 0.5, GY, FR * 2, 0, 6.2832); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#ab5263'; ctx.beginPath(); ctx.arc(W * 0.5, GY, 4.6 * sp, 0, 6.2832); ctx.fill();
    }

    if (!reduced) for (const m of mist) {
      m.x += m.v / 60;
      if (m.x < -m.rx) m.x = W + m.rx; if (m.x > W + m.rx) m.x = -m.rx;
      const a = 0.04 + 0.02 * Math.sin(m.ph + t * 0.4);
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.rx);
      g.addColorStop(0, 'rgba(200,200,215,' + a + ')'); g.addColorStop(1, 'rgba(200,200,215,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(m.x, m.y, m.rx, m.ry, 0, 0, 6.2832); ctx.fill();
    }

    ctx.globalCompositeOperation = 'lighter';
    for (const L of lights) {
      const la = clamp((T - L.birth) / 0.5, 0, 1);
      if (la <= 0) continue;
      L.sx = L.seg.X1 + windX(L.seg.Y1, L.seg.ph, t); L.sy = L.seg.Y1;
      const tw = reduced ? 0.85 : 0.72 + 0.28 * Math.sin(L.ph + t * (0.7 + (L.ph % 0.9)));
      const glowR = L.R * 4.6;
      const g = ctx.createRadialGradient(L.sx, L.sy, 0, L.sx, L.sy, glowR);
      g.addColorStop(0, 'rgba(244,214,143,' + 0.32 * tw * la + ')'); g.addColorStop(1, 'rgba(244,214,143,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(L.sx, L.sy, glowR, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(252,240,212,' + (0.8 + 0.2 * tw) * la + ')';
      ctx.beginPath(); ctx.arc(L.sx, L.sy, L.R, 0, 6.2832); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    if (!reduced && T > 3) for (const lf of leaves) {
      if (!lf.live) {
        if (Math.random() < 0.006 && lights.length) {
          const src = lights[(Math.random() * lights.length) | 0];
          lf.live = true; lf.x = src.sx; lf.y = src.sy; lf.vy = 14 + Math.random() * 12; lf.ph = Math.random() * 6.283; lf.life = 0; lf.span = 4 + Math.random() * 3; lf.s = 1.2 + Math.random() * 1.2;
        }
        continue;
      }
      lf.life += 1 / 60; lf.y += lf.vy / 60; lf.x += Math.sin(lf.ph + t * 1.6) * 0.5;
      if (lf.y > GY || lf.life > lf.span) { lf.live = false; continue; }
      const a = Math.min(1, lf.life / 0.5) * Math.min(1, (lf.span - lf.life) / 0.8) * 0.5;
      ctx.fillStyle = 'rgba(240,205,135,' + a + ')'; ctx.fillRect(lf.x, lf.y, lf.s, lf.s);
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
    if (reduced) {
      gsap.set('.b-mask', { opacity: 0 });
      gsap.set(['.b-copy', '.b-scrim'], { opacity: 1 });
      gsap.set('.b-hint', { opacity: 0 });
      return;
    }
    // On arrival the film fades up inside the letters, slightly zoomed.
    gsap.fromTo(video, { opacity: 0, scale: 1.18 }, { opacity: 1, scale: 1.12, duration: 1.6, ease: 'power2.out' });
    // Scroll: letters grow steadily as windows (0 → 0.55), then rush open (0.55 → 0.85),
    // the film settles to full size, the scrim and the headline arrive, then a hold.
    const tl = gsap.timeline({ scrollTrigger: { trigger: '#b-pin', start: 'top top', end: '+=300%', pin: true, scrub: 0.5 } });
    // The mask stops rendering past ~15x (texture limits), so the last white slivers dissolve instead.
    tl.to('#b-word', { scale: 7, svgOrigin: origin, ease: 'none', duration: 0.55 }, 0)
      .to('#b-word', { scale: 14, svgOrigin: origin, ease: 'power2.in', duration: 0.25 }, 0.55)
      .to('.b-mask', { opacity: 0, ease: 'power2.inOut', duration: 0.16 }, 0.64)
      .to(video, { scale: 1, ease: 'power1.inOut', duration: 0.5 }, 0.4)
      .to('.b-hint', { opacity: 0, duration: 0.08 }, 0)
      .to('.b-scrim', { opacity: 1, duration: 0.2 }, 0.72)
      .fromTo('.b-copy', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.2, ease: 'expo.out' }, 0.82)
      .to({}, { duration: 0.16 });
    document.querySelectorAll('.b-kin').forEach((k) => {
      const lines = k.querySelectorAll('.b-kin-line');
      gsap.fromTo(lines,
        { x: (i, el) => 140 * Number(el.dataset.dir), skewX: (i, el) => -10 * Number(el.dataset.dir), opacity: 0 },
        { x: 0, skewX: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: k, start: 'top 75%' } });
    });
    // Misjon: the night still, and the tree that grows from a seed as you scroll through the pin.
    const mission = document.getElementById('b-mission');
    if (this.tree) this.tree.destroy();
    this.tree = buildIqraTree(document.getElementById('b-tree'));
    const tree = this.tree;
    const GROW = 3.8; // growth time at the end of the pin; the tree is complete around 3.3
    const base = (tl) => tl
      .fromTo('.b-mission-text', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'expo.out' }, 0.08)
      .fromTo('.b-mission-still', { scale: 1 }, { scale: 1.06, duration: 1, ease: 'none' }, 0);
    if (reduced) { tree.setT(99); base(gsap.timeline()).progress(1); return; }
    const mm = gsap.matchMedia();
    mm.add('(min-width: 768px)', () => {
      base(gsap.timeline({ scrollTrigger: { trigger: mission, start: 'top top', end: '+=140%', pin: true, scrub: 0.6, onUpdate: (self) => tree.setT(self.progress * GROW) } }));
    });
    mm.add('(max-width: 767px)', () => {
      const p = { T: 0 };
      base(gsap.timeline({ scrollTrigger: { trigger: mission, start: 'top 60%', once: true } }))
        .to(p, { T: GROW, duration: 4.5, ease: 'none', onUpdate: () => tree.setT(p.T) }, 0);
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
