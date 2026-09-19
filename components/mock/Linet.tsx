'use client';

import { useEffect, useRef } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import { Band } from './Band';
import { frameOf, makeCast, token } from './cast';
import { makeWindow, WRITE } from './window';
import styles from './linet.module.css';

const POSTER = '/media/iqra-poster.jpg';
const [VX, VY, VW, VH] = MARK_VIEWBOX.split(' ').map(Number);
/** The light through the cloth is described this wide: coarse, since the cloth diffuses it. */
const GLOW_W = 256;
/** When the lamps start, behind the cloth. */
const LAMP_BASE = 250;
/** The curtain begins to part here, and takes this long. */
const OPEN_AT = 1400;
const OPEN_MS = 2100;

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

const VERT = `
attribute vec2 p; varying vec2 vUv;
void main() { vUv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }`;

/**
 * The curtain, per pixel: two halves hanging from the top, each a run of folds that
 * compress as the half gathers towards its edge; a normal from the folds' slope for the
 * shading, a sheen on the crests; the window's light coming through the cloth where it
 * hangs over the window, more where the cloth is stretched thin; a wave along the leading
 * hem; and a soft shadow on the room just past the hem.
 */
const FRAG = `
precision highp float;
uniform sampler2D glow; uniform vec4 box; uniform float open; uniform float t; uniform float aspect; uniform vec3 velvet; uniform float folds;
varying vec2 vUv;
vec3 glowAt(vec2 p) {
  vec2 q = (p - box.xy) / box.zw;
  if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return vec3(0.0);
  return texture2D(glow, q).rgb;
}
vec3 glowSoft(vec2 p) {
  vec2 r = vec2(0.03 / aspect, 0.03);
  vec3 c = glowAt(p) * 2.0;
  c += glowAt(p + vec2(r.x, 0.0)) + glowAt(p - vec2(r.x, 0.0)) + glowAt(p + vec2(0.0, r.y)) + glowAt(p - vec2(0.0, r.y));
  c += glowAt(p + r) + glowAt(p - r) + glowAt(p + vec2(r.x, -r.y)) + glowAt(p - vec2(r.x, -r.y));
  return c / 10.0;
}
void main() {
  float w = 0.5 * (1.0 - open);
  float side = step(0.5, vUv.x);
  float x = mix(vUv.x, 1.0 - vUv.x, side);
  float sway = 0.010 * sin(vUv.y * 9.0 + t * 2.4 + side * 2.1) * (0.35 + open) + 0.004 * sin(vUv.y * 23.0 - t * 3.1);
  float hem = w + sway;
  if (x > hem) {
    float sh = smoothstep(0.09, 0.0, x - hem) * 0.16 * (1.0 - open * 0.5) * step(0.001, w);
    gl_FragColor = vec4(0.0, 0.0, 0.0, sh);
    return;
  }
  float u = x / max(w, 1e-4);
  float gather = 1.0 - w / 0.5;
  float phi = u * folds * 6.2832 + 0.9 * sin(u * 5.0 + side * 3.0) * vUv.y + side * 1.7;
  float A = 0.012 * (1.0 + 1.6 * gather);
  float dhdx = A * cos(phi) * folds * 6.2832 / max(w, 1e-4);
  float dhdy = A * 0.9 * cos(phi) * cos(u * 5.0 + side * 3.0) * 0.4;
  vec3 n = normalize(vec3(-dhdx * mix(1.0, -1.0, side), -dhdy, 1.0));
  vec3 L = normalize(vec3(-0.35, -0.55, 0.75));
  float dif = max(dot(n, L), 0.0);
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float sheen = pow(max(dot(n, H), 0.0), 16.0) * 0.16;
  vec3 col = velvet * (0.78 + 0.22 * dif) + sheen * 0.5;
  /* The window's light through the linen: where the film is bright its colour comes through, more where a fold is stretched thin. */
  float thin = 0.5 + 0.5 * (0.5 + 0.5 * sin(phi));
  vec3 g = glowSoft(vUv);
  float lum = dot(g, vec3(0.33));
  col = mix(col, g * 1.05 + 0.12, clamp(lum * 1.7, 0.0, 1.0) * thin * 0.9);
  /* The cloth's thickness at the hem, and the hang: a shade darker at the foot. */
  col *= 1.0 - 0.28 * smoothstep(0.014, 0.0, hem - x);
  col *= 0.94 + 0.06 * (1.0 - vUv.y);
  gl_FragColor = vec4(col, 1.0);
}`;

/**
 * 17 Linet, from 15 on white: a white linen curtain over the hero when you arrive. Behind
 * it the panes light — the letters seen as sun through linen, the film's colours coming
 * through where it is bright, flickering in turn — and then the curtain parts to the two
 * sides, its folds gathering, and the room is 10's white wall: the window with the film,
 * the film's colours on the white floor, the band in navy coming up as the cloth leaves.
 * The cloth is 15's shader with linen for velvet: front-lit and pale, the light through it
 * a mix towards the film's colour rather than an addition. Without WebGL, or under reduced
 * motion, there is no curtain and the wall is lit.
 */
export function Linet() {
  const room = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const curtain = useRef<HTMLCanvasElement>(null);
  const beam = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const r = room.current;
    const st = stage.current;
    const v = video.current;
    const g = curtain.current;
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
    let raf = 0;

    const gl = g.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) {
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
    r.dataset.curtain = '';

    const glow = document.createElement('canvas');
    const drawGlow = makeWindow(glow, GLOW_W, crimson, LAMP_BASE);
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
    const glowTex = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, glowTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(u('glow'), 0);
    gl.uniform1f(u('folds'), narrow ? 6 : 9);
    // The linen: a warm white, a shade under the page's.
    gl.uniform3f(u('velvet'), 0.93, 0.92, 0.9);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const k = Math.min(2, window.devicePixelRatio || 1);
    const size = () => {
      const b = r.getBoundingClientRect();
      g.width = Math.round(b.width * k);
      g.height = Math.round(b.height * k);
      gl.viewport(0, 0, g.width, g.height);
    };
    size();
    addEventListener('resize', size);

    let done = false;
    let lose: ReturnType<typeof setTimeout> | undefined;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const t = now - t0;
      const frame = frameOf(v, poster);
      drawCast(frame);
      if (done) return;
      const open = easeInOut(clamp((t - OPEN_AT) / OPEN_MS));
      if (open >= 1) {
        done = true;
        r.dataset.open = '';
        // The context goes a beat after the canvas is hidden: lost in the same frame, Chrome painted the canvas opaque white until the style landed.
        lose = setTimeout(() => gl.getExtension('WEBGL_lose_context')?.loseContext(), 300);
        return;
      }
      drawGlow(frame, t);
      const rb = r.getBoundingClientRect();
      const sb = st.getBoundingClientRect();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, glowTex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, glow);
      gl.uniform4f(u('box'), (sb.left - rb.left) / rb.width, (sb.top - rb.top) / rb.height, sb.width / rb.width, sb.height / rb.height);
      gl.uniform1f(u('open'), open);
      gl.uniform1f(u('t'), t / 1000);
      gl.uniform1f(u('aspect'), rb.width / rb.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      r.style.setProperty('--px', ((e.clientX / innerWidth) - 0.5).toFixed(3));
      r.style.setProperty('--py', ((e.clientY / innerHeight) - 0.5).toFixed(3));
    };
    addEventListener('pointermove', onMove, { passive: true });
    return () => {
      removeEventListener('pointermove', onMove);
      removeEventListener('resize', size);
      cancelAnimationFrame(raf);
      clearTimeout(lose);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      v.pause();
    };
  }, []);

  return (
    <section ref={room} className={styles.room} aria-labelledby="hovedtekst">
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.scene}>
        <div ref={stage} className={styles.stage}>
          <div className={styles.window} aria-hidden="true">
            <video ref={video} className={styles.film} poster={POSTER} preload="metadata" muted loop playsInline />
          </div>
          <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
            <defs>
              <clipPath id="lin-letters" clipPathUnits="objectBoundingBox">
                {MARK_LETTERS.map((p, i) => (
                  <path key={i} transform={`scale(${1 / VW} ${1 / VH}) translate(${-VX} ${-VY}) ${p.transform}`} d={p.d} />
                ))}
              </clipPath>
            </defs>
            {MARK_LETTERS.map((p, i) => (
              <path key={i} className={styles.pane} style={{ '--i': WRITE[i] } as React.CSSProperties} transform={p.transform} d={p.d} />
            ))}
            {MARK_LETTERS.map((p, i) => (
              <path key={i} className={styles.lead} transform={p.transform} d={p.d} vectorEffect="non-scaling-stroke" />
            ))}
            {MARK_ACCENTS.map((p, i) => (
              <path key={i} className={styles.accent} transform={p.transform} d={p.d} />
            ))}
          </svg>
          <canvas ref={beam} className={styles.cast} aria-hidden="true" />
        </div>
      </div>
      <Band tone="dark" className={styles.band} title={(t) => <span className={styles.sweep}>{t}</span>} />
      <canvas ref={curtain} className={styles.curtain} aria-hidden="true" />
    </section>
  );
}
