'use client';

import { useEffect, useRef } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import { Band } from './Band';
import { coverOf, frameOf, makeCast, token } from './cast';
import { MARK_ASPECT, markPaths } from './markCanvas';
import styles from './avdukingen.module.css';

const POSTER = '/media/iqra-poster.jpg';
const [VX, VY, VW, VH] = MARK_VIEWBOX.split(' ').map(Number);
/** The lettering stands off the wall by this much, in stage widths, seen from a little right and below; the eye adds to it. */
const RAISE: [number, number] = [0.028, 0.038];
const PARALLAX = 0.05;
const STEPS = 18;
const SIDE_SCALE = 1 / 3;
/** The pull: still until here, then off over this long. */
const PULL_AT = 1000;
const PULL_MS = 2600;

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const hex = (s: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)) as [number, number, number];
const mix = (a: [number, number, number], b: [number, number, number], t: number) => `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * t)).join(' ')})`;

const VERT = `
attribute vec2 p; varying vec2 vUv;
void main() { vUv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }`;

/**
 * The cloth per pixel: a white sheet lying over the lettering, its height the lettering's
 * shape softened (the bump texture) plus folds running with the pull, and a roll where it
 * is being lifted; a normal from that height's slope, lit from the upper left; a hem that
 * waves; and a soft shadow on what it has just uncovered.
 */
const FRAG = `
precision highp float;
uniform sampler2D bump; uniform float edge; uniform vec2 pull; uniform float t; uniform float aspect; uniform float still;
varying vec2 vUv;
float bumpAt(vec2 q) { return texture2D(bump, q).a; }
float height(vec2 uv) {
  vec2 p = vec2(uv.x * aspect, uv.y);
  float along = dot(p, pull);
  float across = dot(p, vec2(-pull.y, pull.x));
  float lift = smoothstep(edge - 0.22, edge, along);
  float folds = sin(across * 38.0 + t * 0.9) * 0.55 + sin(across * 15.0 - 1.3 + t * 0.4) * 0.45;
  float breathe = sin(uv.x * 9.0 + t * 1.1) * sin(uv.y * 7.0 - t * 0.8) * 0.006 * still;
  return bumpAt(uv) * 0.2 + folds * (0.004 + lift * 0.05) + lift * lift * 0.5 + breathe;
}
void main() {
  vec2 p = vec2(vUv.x * aspect, vUv.y);
  float along = dot(p, pull);
  float across = dot(p, vec2(-pull.y, pull.x));
  float hem = edge + 0.018 * sin(across * 9.0 + t * 2.6) + 0.008 * sin(across * 25.0 - t * 1.9);
  if (along > hem) {
    float sh = smoothstep(0.14, 0.0, along - hem) * 0.22;
    gl_FragColor = vec4(0.0, 0.0, 0.0, sh);
    return;
  }
  vec2 e = vec2(0.0025 / aspect, 0.0025);
  float hx = height(vUv + vec2(e.x, 0.0)) - height(vUv - vec2(e.x, 0.0));
  float hy = height(vUv + vec2(0.0, e.y)) - height(vUv - vec2(0.0, e.y));
  vec3 N = normalize(vec3(-hx * 9.0, -hy * 9.0, 1.0));
  vec3 L = normalize(vec3(-0.45, -0.6, 0.66));
  float dif = max(dot(N, L), 0.0);
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float sheen = pow(max(dot(N, H), 0.0), 20.0) * 0.06;
  /* The cloth sits closer to the wall between the letters: a little darker there. */
  float b = bumpAt(vUv);
  float ao = 1.0 - 0.07 * smoothstep(0.02, 0.45, b) * (1.0 - smoothstep(0.45, 0.9, b));
  vec3 col = vec3(0.985, 0.98, 0.972) * (0.8 + 0.22 * dif) * ao + sheen;
  /* The hem: the cloth's thickness, a shade darker; and the hang, a shade darker at the foot. */
  col *= 1.0 - 0.32 * smoothstep(0.012, 0.0, hem - along);
  col *= 0.96 + 0.04 * (1.0 - vUv.y);
  gl_FragColor = vec4(col, 1.0);
}`;

/**
 * 20 Avdukingen, on white: the name stands off a white wall as lettering, the film in its
 * faces, and on arrival the whole first screen is under a white cloth — the letters read
 * as their shape through the sheet, the cloth breathing a little. Then the cloth is drawn
 * away, up and to the right, lifting at its edge and gathering folds as it goes, its
 * shadow crossing what it uncovers; the lettering stands white in white, with its sides
 * and its shadow on the wall, the film alight in the faces, and the film's light on the
 * floor. The copy is uncovered with the rest. The lettering is drawn in a canvas as 18's
 * cut inverted (the sides as the letters filled along the displacement, the face the film
 * under the mask), the cloth a WebGL quad over the hero. The pointer moves the eye a little
 * afterwards. Without WebGL, or under reduced motion: the lettering, no cloth.
 */
export function Avdukingen() {
  const room = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const sign = useRef<HTMLCanvasElement>(null);
  const cloth = useRef<HTMLCanvasElement>(null);
  const cast = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const r = room.current;
    const st = stage.current;
    const v = video.current;
    const c = sign.current;
    const g = cloth.current;
    const cc = cast.current;
    if (!r || !st || !v || !c || !g || !cc) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const narrow = window.matchMedia('(max-width: 767px)').matches;
    v.src = pickSource({ narrow, webm: v.canPlayType('video/webm; codecs="vp9"') !== '' });
    v.muted = true;
    v.load();
    Promise.resolve(v.play()).catch(() => {});
    r.dataset.live = '';

    const crimson = token('--color-crimson', '#ab5261');
    const drawCast = makeCast(cc, crimson);
    const poster = new Image();
    poster.src = POSTER;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const SIDE_NEAR = hex('#e6e9ed');
    const SIDE_FAR = hex('#c6ccd4');
    const mask = document.createElement('canvas');
    const mctx = mask.getContext('2d');
    const shadow = document.createElement('canvas');
    const shctx = shadow.getContext('2d');
    const side = document.createElement('canvas');
    const sctx = side.getContext('2d');
    const face = document.createElement('canvas');
    const fctx = face.getContext('2d');
    if (!mctx || !shctx || !sctx || !fctx) return;
    let small: Path2D | null = null;
    let W = 0;
    let H = 0;
    let ex = 0;
    let ey = 0;
    let px = 0;
    let py = 0;
    const t0 = performance.now();

    // The cloth, if WebGL is here.
    const gl = g.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    let drawCloth: ((t: number) => void) | null = null;
    let lose: ReturnType<typeof setTimeout> | undefined;
    if (gl) {
      r.dataset.cloth = '';
      const compile = (type: number, source: string) => {
        const sh = gl.createShader(type)!;
        gl.shaderSource(sh, source);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
        return sh;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      gl.useProgram(prog);
      const quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const ap = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(ap);
      gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
      const u = (n: string) => gl.getUniformLocation(prog, n);
      // The bump: the letters where they stand in the hero, blurred wide, for the cloth's height.
      const BW = 800;
      const bump = document.createElement('canvas');
      const bctx = bump.getContext('2d')!;
      const tex = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(u('bump'), 0);
      // The pull: up and to the right. `along` runs from the lower left corner to the upper right.
      const pl = Math.hypot(0.62, -1);
      const pull: [number, number] = [0.62 / pl, -1 / pl];
      gl.uniform2f(u('pull'), pull[0], pull[1]);
      let lo = 0;
      let hi = 1;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      const k = Math.min(2, window.devicePixelRatio || 1);
      const size = () => {
        const b = r.getBoundingClientRect();
        const sb = st.getBoundingClientRect();
        g.width = Math.round(b.width * k);
        g.height = Math.round(b.height * k);
        gl.viewport(0, 0, g.width, g.height);
        const aspect = b.width / b.height;
        gl.uniform1f(u('aspect'), aspect);
        const corners = [[0, 0], [aspect, 0], [0, 1], [aspect, 1]].map(([x, y]) => x * pull[0] + y * pull[1]);
        lo = Math.min(...corners) - 0.3;
        hi = Math.max(...corners) + 0.08;
        bump.width = BW;
        bump.height = Math.round(BW / aspect);
        const mw = (sb.width / b.width) * BW;
        bctx.clearRect(0, 0, bump.width, bump.height);
        bctx.filter = `blur(${Math.round(mw * 0.03)}px)`;
        bctx.fillStyle = '#000';
        bctx.fill(markPaths(((sb.left - b.left) / b.width) * BW, ((sb.top - b.top) / b.height) * bump.height, mw).letters);
        bctx.filter = 'none';
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bump);
      };
      size();
      addEventListener('resize', size);
      let done = false;
      drawCloth = (t: number) => {
        if (done) return;
        const pull = easeInOut(clamp((t - PULL_AT) / PULL_MS));
        if (pull >= 1) {
          done = true;
          r.dataset.open = '';
          removeEventListener('resize', size);
          lose = setTimeout(() => gl.getExtension('WEBGL_lose_context')?.loseContext(), 300);
          return;
        }
        gl.uniform1f(u('edge'), hi + (lo - hi) * pull);
        gl.uniform1f(u('t'), t / 1000);
        gl.uniform1f(u('still'), 1 - pull);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };
    }

    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const t = now - t0;
      const frame = frameOf(v, poster);
      drawCast(frame);
      drawCloth?.(t);
      if (!frame) return;
      const w = Math.round(st.clientWidth * dpr);
      if (w !== W && w > 0) {
        W = w;
        H = Math.round(W / MARK_ASPECT);
        // The canvas has room for the sides and the shadow, off to the right and below.
        c.width = Math.round(W * 1.3);
        c.height = Math.round(H + W * 0.3);
        for (const [cv, s] of [[mask, 1], [shadow, 1], [face, 1], [side, SIDE_SCALE]] as const) {
          cv.width = Math.round(c.width * s);
          cv.height = Math.round(c.height * s);
        }
        mctx.fillStyle = '#000';
        mctx.fill(markPaths(0, 0, W).letters);
        shctx.filter = `blur(${Math.round(W * 0.02)}px)`;
        shctx.fillStyle = '#000';
        shctx.fill(markPaths(0, 0, W).letters);
        shctx.filter = 'none';
        small = markPaths(0, 0, W * SIDE_SCALE).letters;
      }
      if (!small) return;
      // The eye: the pointer, eased; the lettering's sides show towards it.
      ex += (px - ex) * 0.06;
      ey += (py - ey) * 0.06;
      const dx = (RAISE[0] + ex * PARALLAX) * W;
      const dy = (RAISE[1] + ey * PARALLAX * 0.7) * W;
      // The sides, small: the letters filled from the wall forward, dark at the wall.
      sctx.clearRect(0, 0, side.width, side.height);
      for (let k = STEPS; k >= 1; k--) {
        const s = k / STEPS;
        sctx.fillStyle = mix(SIDE_NEAR, SIDE_FAR, Math.pow(s, 0.9));
        sctx.save();
        sctx.translate(dx * s * SIDE_SCALE, dy * s * SIDE_SCALE);
        sctx.fill(small);
        sctx.restore();
      }
      // The face: the film under the mask.
      const [sx, sy, sw, sh] = coverOf(frame.w, frame.h);
      fctx.globalCompositeOperation = 'source-over';
      fctx.clearRect(0, 0, face.width, face.height);
      fctx.drawImage(mask, 0, 0);
      fctx.globalCompositeOperation = 'source-in';
      fctx.drawImage(frame.src, sx, sy, sw, sh, W * -0.05 + ex * -14 * dpr, H * -0.05 + ey * -10 * dpr, W * 1.1, H * 1.1);
      // The wall: the shadow, the sides, the face.
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.globalAlpha = 0.16;
      ctx.drawImage(shadow, dx * 1.9 + W * 0.02, dy * 1.9 + W * 0.03);
      ctx.globalAlpha = 1;
      ctx.drawImage(side, 0, 0, c.width, c.height);
      ctx.drawImage(face, 0, 0);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      px = e.clientX / innerWidth - 0.5;
      py = e.clientY / innerHeight - 0.5;
      r.style.setProperty('--px', px.toFixed(3));
    };
    addEventListener('pointermove', onMove, { passive: true });
    return () => {
      removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
      clearTimeout(lose);
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      v.pause();
    };
  }, []);

  return (
    <section ref={room} className={styles.room} aria-labelledby="hovedtekst">
      <video ref={video} className={styles.source} poster={POSTER} preload="metadata" muted loop playsInline aria-hidden="true" />
      <div className={styles.scene}>
        <div ref={stage} className={styles.stage}>
          <img className={styles.still} src={POSTER} alt="" aria-hidden="true" />
          <canvas ref={sign} className={styles.sign} aria-hidden="true" />
          <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
            <defs>
              <clipPath id="avduk-letters" clipPathUnits="objectBoundingBox">
                {MARK_LETTERS.map((p, i) => (
                  <path key={i} transform={`scale(${1 / VW} ${1 / VH}) translate(${-VX} ${-VY}) ${p.transform}`} d={p.d} />
                ))}
              </clipPath>
            </defs>
            {MARK_ACCENTS.map((p, i) => (
              <path key={i} className={styles.accent} transform={p.transform} d={p.d} />
            ))}
          </svg>
          <canvas ref={cast} className={styles.cast} aria-hidden="true" />
        </div>
      </div>
      <Band tone="dark" className={styles.band} title={(t) => <span className={styles.sweep}>{t}</span>} />
      <canvas ref={cloth} className={styles.cloth} aria-hidden="true" />
    </section>
  );
}
