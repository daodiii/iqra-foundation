'use client';

import { useEffect, useRef } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import { Band } from './Band';
import { frameOf, makeCast, token } from './cast';
import { makeWindow, WRITE } from './window';
import styles from './straalene.module.css';

const POSTER = '/media/iqra-poster.jpg';
const [VX, VY, VW, VH] = MARK_VIEWBOX.split(' ').map(Number);
/** The window is described this wide for the shader; the rays are its upscale. */
const WIN_W = 512;
/** When the lamps start (9's number). */
const LAMP_BASE = 650;

const clamp = (x: number) => Math.min(1, Math.max(0, x));

const QUAD_VERT = `
attribute vec2 p; varying vec2 vUv;
void main() { vUv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }`;

/** The light in the air: every pixel marches towards the window's centre and sums what it passes — the window's own frame, fading with distance. */
const RAYS_FRAG = (n: number) => `
precision highp float;
uniform sampler2D win; uniform vec4 box; uniform vec2 centre; uniform float exposure; uniform float aspect;
varying vec2 vUv;
vec3 winAt(vec2 p) {
  vec2 q = (p - box.xy) / box.zw;
  if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return vec3(0.0);
  return texture2D(win, q).rgb;
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 d = (centre - vUv) * 0.94 / ${n}.0;
  vec2 s = vUv + d * hash(gl_FragCoord.xy);
  vec3 c = vec3(0.0); float w = 1.0;
  for (int i = 0; i < ${n}; i++) { s += d; c += winAt(s) * w; w *= 0.955; }
  c *= exposure * 2.5 / ${n}.0;
  /* The air itself, faintly warm, thinning with the distance from the window. */
  vec2 e = (vUv - centre) * vec2(aspect, 1.0);
  c += vec3(1.0, 0.86, 0.66) * 0.035 * exposure * exp(-dot(e, e) * 2.2);
  gl_FragColor = vec4(c, 0.0);
}`;

/** Dust drifting in the room; lit where the rays are — a shorter march from where the grain is. */
const DUST_VERT = `
attribute vec3 seed; uniform sampler2D win; uniform vec4 box; uniform vec2 centre; uniform float exposure; uniform float t; uniform float px;
varying float vA;
vec3 winAt(vec2 p) {
  vec2 q = (p - box.xy) / box.zw;
  if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return vec3(0.0);
  return texture2D(win, q).rgb;
}
void main() {
  vec2 p = vec2(fract(seed.x + t * 0.0045 + 0.012 * sin(t * 0.6 + seed.y * 37.0)), fract(seed.y - t * 0.003 * (0.5 + seed.z * 0.3) + 0.010 * cos(t * 0.45 + seed.x * 29.0)));
  vec2 d = (centre - p) * 0.94 / 12.0;
  vec2 s = p; vec3 c = vec3(0.0); float w = 1.0;
  for (int i = 0; i < 12; i++) { s += d; c += winAt(s) * w; w *= 0.9; }
  vA = min(1.0, dot(c, vec3(0.33)) / 12.0 * 4.5) * exposure;
  gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
  gl_PointSize = seed.z * px;
}`;

const DUST_FRAG = `
precision mediump float; varying float vA;
void main() {
  float r = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.12, r) * vA * 0.85;
  gl_FragColor = vec4(vec3(1.0, 0.95, 0.86) * a, 0.0);
}`;

/**
 * 13 Strålene, from 9: the light does not only fall on the floor — it stands in the air.
 * The room is dusty, and the film's light comes out of each letter as it is lit and
 * reaches across the room towards you: a WebGL pass over the whole hero marches every
 * pixel towards the window's centre and sums the window's own frame along the way (the
 * lamps' covers included, so each letter's shaft grows as its lamp comes on), added to the
 * dark; a few hundred grains drift through the room and are seen only where the light is.
 * The pointer moves the eye and the shafts swing with it. The window, the lamps, the light
 * on the floor and the band are 9's. Without WebGL, or under reduced motion, it is 9.
 */
export function Straalene() {
  const room = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const rays = useRef<HTMLCanvasElement>(null);
  const beam = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const r = room.current;
    const st = stage.current;
    const v = video.current;
    const g = rays.current;
    const c = beam.current;
    if (!r || !st || !v || !g || !c) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const narrow = window.matchMedia('(max-width: 767px)').matches;
    v.src = pickSource({ narrow, webm: v.canPlayType('video/webm; codecs="vp9"') !== '' });
    v.muted = true;
    v.load();
    Promise.resolve(v.play()).catch(() => {});

    const crimson = token('--color-crimson', '#ab5261');
    const drawCast = makeCast(c, crimson);
    const poster = new Image();
    poster.src = POSTER;
    const t0 = performance.now();

    const gl = g.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) {
      let raf = 0;
      const loop = () => {
        raf = requestAnimationFrame(loop);
        drawCast(frameOf(v, poster));
      };
      raf = requestAnimationFrame(loop);
      return () => {
        cancelAnimationFrame(raf);
        v.pause();
      };
    }
    r.dataset.rays = '';

    const win = document.createElement('canvas');
    const drawWin = makeWindow(win, WIN_W, crimson, LAMP_BASE);

    const compile = (type: number, source: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
      return sh;
    };
    const program = (vs: string, fs: string) => {
      const p = gl.createProgram()!;
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      return p;
    };
    const raysProg = program(QUAD_VERT, RAYS_FRAG(narrow ? 32 : 48));
    const dustProg = program(DUST_VERT, DUST_FRAG);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const N_DUST = narrow ? 160 : 360;
    const seeds = new Float32Array(N_DUST * 3);
    for (let i = 0; i < N_DUST; i++) {
      seeds[i * 3] = Math.random();
      seeds[i * 3 + 1] = Math.random();
      seeds[i * 3 + 2] = 1.6 + Math.random() * 2.4;
    }
    const dust = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dust);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    const aQuad = gl.getAttribLocation(raysProg, 'p');
    const aSeed = gl.getAttribLocation(dustProg, 'seed');
    const winTex = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, winTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    const u = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    gl.useProgram(raysProg);
    gl.uniform1i(u(raysProg, 'win'), 0);
    gl.useProgram(dustProg);
    gl.uniform1i(u(dustProg, 'win'), 0);
    /* The rays are soft: half the CSS resolution is plenty, and a quarter on a phone. */
    const k = Math.min(2, window.devicePixelRatio || 1) * (narrow ? 0.4 : 0.5);
    let W = 0;
    let H = 0;
    const size = () => {
      const b = r.getBoundingClientRect();
      W = Math.round(b.width * k);
      H = Math.round(b.height * k);
      g.width = W;
      g.height = H;
      gl.viewport(0, 0, W, H);
    };
    size();
    addEventListener('resize', size);

    let px = 0;
    let py = 0;
    let ex = 0;
    let ey = 0;
    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const t = now - t0;
      const frame = frameOf(v, poster);
      drawCast(frame);
      drawWin(frame, t, [px * -18 * (WIN_W / st.clientWidth), py * -12 * (WIN_W / st.clientWidth)]);
      // The eye follows the pointer, eased; the shafts' centre moves against it.
      ex += (px - ex) * 0.08;
      ey += (py - ey) * 0.08;
      const rb = r.getBoundingClientRect();
      const sb = st.getBoundingClientRect();
      const box = [(sb.left - rb.left) / rb.width, (sb.top - rb.top) / rb.height, sb.width / rb.width, sb.height / rb.height];
      const cx = box[0] + box[2] * 0.5 - ex * 0.12;
      const cy = box[1] + box[3] * 0.5 - ey * 0.1;
      const exposure = clamp((t - LAMP_BASE - 200) / 1400);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, winTex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, win);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(raysProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(aQuad);
      gl.vertexAttribPointer(aQuad, 2, gl.FLOAT, false, 0, 0);
      gl.uniform4f(u(raysProg, 'box'), box[0], box[1], box[2], box[3]);
      gl.uniform2f(u(raysProg, 'centre'), cx, cy);
      gl.uniform1f(u(raysProg, 'exposure'), exposure);
      gl.uniform1f(u(raysProg, 'aspect'), W / H);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.disableVertexAttribArray(aQuad);
      gl.useProgram(dustProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, dust);
      gl.enableVertexAttribArray(aSeed);
      gl.vertexAttribPointer(aSeed, 3, gl.FLOAT, false, 0, 0);
      gl.uniform4f(u(dustProg, 'box'), box[0], box[1], box[2], box[3]);
      gl.uniform2f(u(dustProg, 'centre'), cx, cy);
      gl.uniform1f(u(dustProg, 'exposure'), exposure);
      gl.uniform1f(u(dustProg, 't'), t / 1000);
      gl.uniform1f(u(dustProg, 'px'), k);
      gl.drawArrays(gl.POINTS, 0, N_DUST);
      gl.disableVertexAttribArray(aSeed);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      px = e.clientX / innerWidth - 0.5;
      py = e.clientY / innerHeight - 0.5;
      r.style.setProperty('--px', px.toFixed(3));
      r.style.setProperty('--py', py.toFixed(3));
    };
    addEventListener('pointermove', onMove, { passive: true });
    return () => {
      removeEventListener('pointermove', onMove);
      removeEventListener('resize', size);
      cancelAnimationFrame(raf);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      v.pause();
    };
  }, []);

  return (
    <section ref={room} className={styles.room} aria-labelledby="hovedtekst">
      <div className={styles.glow} aria-hidden="true" />
      <canvas ref={rays} className={styles.rays} aria-hidden="true" />
      <div className={styles.scene}>
        <div ref={stage} className={styles.stage}>
          <div className={styles.window} aria-hidden="true">
            <video ref={video} className={styles.film} poster={POSTER} preload="metadata" muted loop playsInline />
          </div>
          <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
            <defs>
              <clipPath id="straale-letters" clipPathUnits="objectBoundingBox">
                {MARK_LETTERS.map((p, i) => (
                  <path key={i} transform={`scale(${1 / VW} ${1 / VH}) translate(${-VX} ${-VY}) ${p.transform}`} d={p.d} />
                ))}
              </clipPath>
            </defs>
            {MARK_LETTERS.map((p, i) => (
              <path key={i} className={styles.lamp} style={{ '--i': WRITE[i] } as React.CSSProperties} transform={p.transform} d={p.d} />
            ))}
            {MARK_LETTERS.map((p, i) => (
              <path key={i} className={styles.edge} transform={p.transform} d={p.d} vectorEffect="non-scaling-stroke" />
            ))}
            {MARK_ACCENTS.map((p, i) => (
              <path key={i} className={styles.accent} transform={p.transform} d={p.d} />
            ))}
          </svg>
          <canvas ref={beam} className={styles.beam} aria-hidden="true" />
        </div>
      </div>
      <Band className={styles.band} title={(t) => <span className={styles.sweep}>{t}</span>} />
    </section>
  );
}
