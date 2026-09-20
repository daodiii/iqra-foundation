'use client';

import { useEffect, useRef } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import { Band } from './Band';
import { coverOf, frameOf, makeCast, token } from './cast';
import { MARK_ASPECT, markPaths } from './markCanvas';
import styles from './relieffet.module.css';

const POSTER = '/media/iqra-poster.jpg';
const [VX, VY, VW, VH] = MARK_VIEWBOX.split(' ').map(Number);
/** The relief is described this wide: the letters sharp, and blurred for the bevel. */
const RELIEF_W = 768;
/** The sun: from raking, far to the left, round to high and left, over this long from here. */
const SUN_AT = 300;
const SUN_MS = 2800;
/** The film comes alight in the recess from here, over this long. */
const GLOW_AT = 2100;
const GLOW_MS = 1100;

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const norm = (v: [number, number, number]): [number, number, number] => {
  const l = Math.hypot(...v) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const FROM: [number, number, number] = norm([-0.96, 0.1, 0.09]);
const NOON: [number, number, number] = norm([-0.42, -0.5, 0.76]);

const VERT = `
attribute vec2 p; varying vec2 vUv;
void main() { vUv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }`;

/**
 * The wall per pixel: white plaster with a grain, the name a recess with a bevelled edge
 * (the blurred mask is the depth), lit by one light — a normal from the depth's slope and
 * the grain, a diffuse term, and the recess's own shadow found by marching towards the
 * light: the wall on the light's side blocks the floor near it. Inside the letters the
 * film lies on the recess floor, shaded by that shadow until it comes alight itself.
 */
const FRAG = `
precision highp float;
uniform sampler2D film; uniform sampler2D mask; uniform sampler2D relief;
uniform vec2 texel; uniform vec2 crop; uniform vec3 L; uniform float glow; uniform float aspect; uniform vec4 box;
varying vec2 vUv;
/* The relief and the mask live in the mark's box; outside it the wall is plain. */
float reliefAt(vec2 q) { if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return 0.0; return texture2D(relief, q).a; }
float maskAt(vec2 q) { if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return 0.0; return texture2D(mask, q).a; }
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  vec2 q = (vUv - box.xy) / box.zw;
  float m = maskAt(q);
  float r = reliefAt(q);
  float rx = reliefAt(q + vec2(texel.x, 0.0)) - reliefAt(q - vec2(texel.x, 0.0));
  float ry = reliefAt(q + vec2(0.0, texel.y)) - reliefAt(q - vec2(0.0, texel.y));
  /* The recess: height falls with r. The bevel is the blur's ramp. */
  vec2 g = -vec2(rx, ry * 2.419) * 6.0;
  /* The plaster's grain, two scales, tilting the normal a little everywhere but on the film. */
  vec2 s1 = vUv * vec2(aspect, 1.0) * 520.0;
  vec2 s2 = vUv * vec2(aspect, 1.0) * 110.0;
  vec2 gp = (vec2(noise(s1), noise(s1 + 31.7)) - 0.5) * 0.14 + (vec2(noise(s2), noise(s2 + 9.3)) - 0.5) * 0.06;
  vec3 N = normalize(vec3(-(g + gp * (1.0 - m)), 1.0));
  float dif = max(dot(N, L), 0.0);
  /* The recess's shadow: towards the light, does the wall rise above the ray? */
  float sh = 0.0;
  vec2 dir = normalize(L.xy + vec2(1e-5, 0.0)) * vec2(1.0, 2.419);
  float tanE = L.z / max(length(L.xy), 1e-3);
  for (int i = 1; i <= 7; i++) {
    float s = float(i) * 0.0075;
    float rq = reliefAt(q + dir * s);
    float rise = (r - rq) * 0.085;
    sh = max(sh, step(s * tanE, rise) * (1.0 - float(i) / 9.0));
  }
  sh = clamp(sh * 1.15, 0.0, 1.0);
  /* The wall: white plaster, its own colour barely varied, lit. */
  float tint = 0.985 + (noise(s2 * 0.6 + 4.2) - 0.5) * 0.015;
  vec3 wall = vec3(tint, tint, tint * 0.995) * (0.86 + 0.16 * dif) * (1.0 - 0.4 * sh);
  /* The floor of the recess: the film, in the shadow until it comes alight. */
  vec2 fuv = (q - 0.5) * crop + 0.5;
  vec3 pic = texture2D(film, fuv).rgb;
  float lit = mix((0.55 + 0.45 * dif) * (1.0 - 0.55 * sh), 1.0, glow);
  vec3 col = mix(wall, pic * lit, m);
  gl_FragColor = vec4(col, 1.0);
}`;

/**
 * 19 Relieffet, on white: the name is cut into a white plaster wall, and it is the light
 * that shows it. On arrival the sun stands far to the left and low, raking across the
 * wall: the plaster's grain catches it, every left edge of the cut is bright and every
 * recess lies in its own shadow — the name read only as shadow, white on white. Over the
 * next three seconds the sun comes round and up; the shadows shorten, and the film comes
 * alight on the floor of the recess, letter by letter in the same order as the lamps. The
 * film's light falls on the floor below as in 10. From then on the pointer is the sun.
 * A WebGL quad over the whole hero — the wall is the whole first screen, so the light
 * sweeps all of it: the letters' mask and a blurred copy as the depth (its ramp the
 * bevel) in the mark's box, a diffuse term from the slope and the grain, and the recess's
 * shadow by a short march towards the light. Without WebGL, or under reduced motion: the
 * wall at noon, the film in the letters.
 */
export function Relieffet() {
  const room = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const wall = useRef<HTMLCanvasElement>(null);
  const cast = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const r = room.current;
    const st = stage.current;
    const v = video.current;
    const g = wall.current;
    const c = cast.current;
    if (!r || !st || !v || !g || !c) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    v.src = pickSource({
      narrow: window.matchMedia('(max-width: 767px)').matches,
      webm: v.canPlayType('video/webm; codecs="vp9"') !== '',
    });
    v.muted = true;
    v.load();
    Promise.resolve(v.play()).catch(() => {});

    const crimson = token('--color-crimson', '#ab5261');
    const drawCast = makeCast(c, crimson);
    const poster = new Image();
    poster.src = POSTER;
    const gl = g.getContext('webgl', { alpha: false, premultipliedAlpha: false, antialias: false });
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
    r.dataset.relief = '';

    // The relief: the letters sharp, and blurred for the depth and its bevel.
    const RH = Math.round(RELIEF_W / MARK_ASPECT);
    const sharp = document.createElement('canvas');
    sharp.width = RELIEF_W;
    sharp.height = RH;
    const sc = sharp.getContext('2d')!;
    const paths = markPaths(0, 0, RELIEF_W);
    sc.fillStyle = '#000';
    sc.fill(paths.letters);
    const soft = document.createElement('canvas');
    soft.width = RELIEF_W;
    soft.height = RH;
    const oc = soft.getContext('2d')!;
    oc.filter = 'blur(7px)';
    oc.drawImage(sharp, 0, 0);

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
    const tex = (unit: number, src: TexImageSource) => {
      const t = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    tex(1, sharp);
    tex(2, soft);
    const filmTex = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, filmTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(u('film'), 0);
    gl.uniform1i(u('mask'), 1);
    gl.uniform1i(u('relief'), 2);
    gl.uniform2f(u('texel'), 1 / RELIEF_W, 1 / RH);
    /* The whole hero, at up to 1.5×: the grain wants resolution, the march wants fragments to be few. */
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const size = () => {
      const b = r.getBoundingClientRect();
      g.width = Math.round(b.width * dpr);
      g.height = Math.round(b.height * dpr);
      gl.viewport(0, 0, g.width, g.height);
      gl.uniform1f(u('aspect'), b.width / b.height);
    };
    size();
    addEventListener('resize', size);

    const t0 = performance.now();
    let L: [number, number, number] = FROM;
    let want: [number, number, number] = NOON;
    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const t = now - t0;
      const frame = frameOf(v, poster);
      drawCast(frame);
      if (!frame) return;
      const sun = clamp((t - SUN_AT) / SUN_MS);
      if (sun < 1) {
        const e = easeInOut(sun);
        L = norm([FROM[0] + (NOON[0] - FROM[0]) * e, FROM[1] + (NOON[1] - FROM[1]) * e, FROM[2] + (NOON[2] - FROM[2]) * e]);
      } else {
        L = norm([L[0] + (want[0] - L[0]) * 0.06, L[1] + (want[1] - L[1]) * 0.06, L[2] + (want[2] - L[2]) * 0.06]);
      }
      const glow = easeInOut(clamp((t - GLOW_AT) / GLOW_MS));
      r.style.setProperty('--sun', L[0].toFixed(3));
      r.style.setProperty('--low', (1 - L[2]).toFixed(3));
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, filmTex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, frame.src as TexImageSource);
      const [, , sw, sh] = coverOf(frame.w, frame.h);
      gl.uniform2f(u('crop'), sw / frame.w, sh / frame.h);
      const rb = r.getBoundingClientRect();
      const sb = st.getBoundingClientRect();
      gl.uniform4f(u('box'), (sb.left - rb.left) / rb.width, (sb.top - rb.top) / rb.height, sb.width / rb.width, sb.height / rb.height);
      gl.uniform3f(u('L'), L[0], L[1], L[2]);
      gl.uniform1f(u('glow'), glow);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    raf = requestAnimationFrame(tick);
    const onMove = (e: PointerEvent) => {
      want = norm([(e.clientX / innerWidth - 0.5) * 1.7, (e.clientY / innerHeight - 0.5) * 1.3, 0.8]);
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
      <canvas ref={wall} className={styles.wall} aria-hidden="true" />
      <div className={styles.scene}>
        <div ref={stage} className={styles.stage}>
          <div className={styles.window} aria-hidden="true">
            <video ref={video} className={styles.film} poster={POSTER} preload="metadata" muted loop playsInline />
          </div>
          <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
            <defs>
              <clipPath id="relief-letters" clipPathUnits="objectBoundingBox">
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
    </section>
  );
}
