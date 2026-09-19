'use client';

import { useEffect, useRef } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import { Band } from './Band';
import { coverOf, frameOf, makeCast, token } from './cast';
import { MARK_ASPECT, markPaths } from './markCanvas';
import styles from './linsen.module.css';

const POSTER = '/media/iqra-poster.jpg';
const [VX, VY, VW, VH] = MARK_VIEWBOX.split(' ').map(Number);
/** The glass is described this wide: a sharp mask of the letters and a blurred one, the thickness. */
const GLASS_W = 768;
/** The highlight's pass on arrival: from off the left to off the right, over this long. */
const PASS_MS = 1900;

const clamp = (x: number) => Math.min(1, Math.max(0, x));

const VERT = `
attribute vec2 p; varying vec2 vUv;
void main() { vUv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform sampler2D film; uniform sampler2D mask; uniform sampler2D thick;
uniform vec2 texel; uniform vec2 crop; uniform vec2 light; uniform vec3 rim;
varying vec2 vUv;
void main() {
  float m = texture2D(mask, vUv).a;
  if (m < 0.004) discard;
  float h = texture2D(thick, vUv).a;
  float hx = texture2D(thick, vUv + vec2(texel.x, 0.0)).a - texture2D(thick, vUv - vec2(texel.x, 0.0)).a;
  float hy = texture2D(thick, vUv + vec2(0.0, texel.y)).a - texture2D(thick, vUv - vec2(0.0, texel.y)).a;
  vec2 n = vec2(hx, hy) * 5.0;
  vec2 fuv = (vUv - 0.5) * crop + 0.5;
  vec2 r = fuv - n * 0.06;
  vec3 col = vec3(texture2D(film, r - n * 0.014).r, texture2D(film, r).g, texture2D(film, r + n * 0.014).b);
  vec3 N = normalize(vec3(-n * 2.6, 1.0));
  vec3 L = normalize(vec3(light, 0.9));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(N, H), 0.0), 34.0);
  float edge = pow(1.0 - h, 2.2);
  col = mix(col, rim, edge * 0.3) * (1.0 - edge * 0.12) + vec3(spec * 0.55);
  gl_FragColor = vec4(col * m, m);
}`;

/**
 * 11 Linsen, from 9 on white: the letters are thick glass. A WebGL quad the size of the mark
 * paints the film seen through them: the letters' mask (sharp) says where the glass is, a
 * blurred copy of it is the glass's thickness, and the thickness's slope is the surface —
 * the film is refracted along it, split a little into its colours at the rim, darkened and
 * cooled where the glass is thick, with a highlight from the light. On arrival the light
 * passes over the glass from left to right; from then on the pointer is the light. The
 * film's light falls on the floor below as in 9, multiplied onto the white. Without WebGL,
 * or under reduced motion, the film is simply clipped to the letters.
 */
export function Linsen() {
  const room = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const glass = useRef<HTMLCanvasElement>(null);
  const cast = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const r = room.current;
    const st = stage.current;
    const v = video.current;
    const g = glass.current;
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
    r.dataset.glass = '';

    // The glass: the letters sharp, and blurred for the thickness.
    const GH = Math.round(GLASS_W / MARK_ASPECT);
    const sharp = document.createElement('canvas');
    sharp.width = GLASS_W;
    sharp.height = GH;
    const sc = sharp.getContext('2d')!;
    const paths = markPaths(0, 0, GLASS_W);
    sc.fillStyle = '#000';
    sc.fill(paths.letters);
    const soft = document.createElement('canvas');
    soft.width = GLASS_W;
    soft.height = GH;
    const oc = soft.getContext('2d')!;
    oc.filter = 'blur(9px)';
    oc.drawImage(sharp, 0, 0);
    oc.filter = 'none';
    // A second pass rounds the thickness further into the letters' middles.
    oc.globalAlpha = 0.6;
    oc.filter = 'blur(18px)';
    oc.drawImage(sharp, 0, 0);

    const compile = (type: number, source: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
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
    gl.uniform1i(u('thick'), 2);
    gl.uniform2f(u('texel'), 1 / GLASS_W, 1 / GH);
    const navy = token('--color-navy', '#2c394b');
    const rgb = [1, 3, 5].map((i) => parseInt(navy.slice(i, i + 2), 16) / 255);
    gl.uniform3f(u('rim'), rgb[0], rgb[1], rgb[2]);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = () => {
      const b = st.getBoundingClientRect();
      g.width = Math.round(b.width * dpr);
      g.height = Math.round(b.height * dpr);
      gl.viewport(0, 0, g.width, g.height);
    };
    size();
    addEventListener('resize', size);

    const t0 = performance.now();
    let lx = -1.6;
    let ly = -0.2;
    let wx = 0.35;
    let wy = -0.35;
    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const frame = frameOf(v, poster);
      drawCast(frame);
      if (!frame) return;
      const pass = clamp((now - t0 - 500) / PASS_MS);
      if (pass < 1) {
        lx = -1.6 + 3.2 * pass;
        ly = -0.2;
      } else {
        lx += (wx - lx) * 0.08;
        ly += (wy - ly) * 0.08;
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, filmTex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, frame.src as TexImageSource);
      const [, , sw, sh] = coverOf(frame.w, frame.h);
      gl.uniform2f(u('crop'), sw / frame.w, sh / frame.h);
      gl.uniform2f(u('light'), lx, ly);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    raf = requestAnimationFrame(tick);
    const onMove = (e: PointerEvent) => {
      wx = (e.clientX / innerWidth - 0.5) * 2.2;
      wy = -(e.clientY / innerHeight - 0.5) * 2.2;
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
      <div className={styles.scene}>
        <div ref={stage} className={styles.stage}>
          <video ref={video} className={styles.film} poster={POSTER} preload="metadata" muted loop playsInline aria-hidden="true" />
          <canvas ref={glass} className={styles.glass} aria-hidden="true" />
          <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
            <defs>
              <clipPath id="linse-letters" clipPathUnits="objectBoundingBox">
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
      <Band tone="dark" className={styles.band} />
    </section>
  );
}
