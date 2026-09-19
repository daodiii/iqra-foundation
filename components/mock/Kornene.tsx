'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import { drawMark, MARK_ASPECT } from './markCanvas';
import styles from './kornene.module.css';

const POSTER = '/media/iqra-poster.jpg';
const [VX, VY, VW, VH] = MARK_VIEWBOX.split(' ').map(Number);
const BLEED = 2;
const COVER = { x: VX - BLEED, y: VY - BLEED, width: VW + 2 * BLEED, height: VH + 2 * BLEED };

/** The grains: how many, how big (CSS px), and the three beats after the wrap, in ms. */
const GRAINS = { wide: 20000, narrow: 9000 };
const GRAIN = { wide: 5.6, narrow: 4.6 };
const SHATTER_MS = 350;
const GATHER_MS = 1900;
const FUSE_MS = 650;
/** The letters rasterised this wide to pick the grains' targets from. */
const RASTER_W = 600;

type Phase = 'film' | 'dust' | 'fuse' | 'page';

const VERT = `
attribute vec2 p0; attribute vec2 p1; attribute vec2 seed;
uniform float t; uniform vec2 band; uniform vec2 crop; uniform float size;
varying vec2 vUv;
void main() {
  float e = clamp((t - seed.x * 0.5) / 0.5, 0.0, 1.0);
  e = e * e * (3.0 - 2.0 * e);
  vec2 d = p1 - p0;
  vec2 n = normalize(vec2(-d.y, d.x) + vec2(0.001, 0.0));
  vec2 pos = mix(p0, p1, e) + n * sin(e * 3.14159) * length(d) * 0.16 * (seed.y - 0.5);
  vec2 u = pos / band;
  vUv = (u - 0.5) * crop + 0.5;
  gl_Position = vec4(u.x * 2.0 - 1.0, 1.0 - u.y * 2.0, 0.0, 1.0);
  gl_PointSize = size * (0.75 + 0.5 * seed.y);
}`;

const FRAG = `
precision mediump float;
uniform sampler2D film; uniform float alpha;
varying vec2 vUv;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;
  float a = smoothstep(0.5, 0.36, r) * alpha;
  gl_FragColor = vec4(texture2D(film, vUv).rgb * a, a);
}`;

const clamp = (x: number) => Math.min(1, Math.max(0, x));

/**
 * 6 Kornene: the film has the band; when it has run once it goes to grains of itself —
 * twenty thousand points on a WebGL canvas, each coloured from the live frame where it
 * stands — that stream across the band and gather into the four letters while the page
 * turns white behind them; then the grains fuse and the film is in the name, the copy
 * under it. The grains' targets are picked from the mark rasterised once (`drawMark`);
 * every position is computed in the vertex shader from the two ends, a delay that runs
 * left to right, and the one clock `t`, so the frame's only work is uploading the video.
 * Two videos as on the PR: the take-over plays and feeds the grains; the letters' waits
 * and starts at the wrap.
 */
export function Kornene() {
  const hero = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const over = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('film');

  useEffect(() => {
    const h = hero.current;
    const st = stage.current;
    const v = video.current;
    const o = over.current;
    const c = canvas.current;
    if (!h || !st || !v || !o || !c) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const narrow = window.matchMedia('(max-width: 767px)').matches;
    const src = pickSource({ narrow, webm: v.canPlayType('video/webm; codecs="vp9"') !== '' });
    for (const el of [v, o]) {
      el.src = src;
      el.muted = true;
      el.load();
    }

    // The grains, ready before they are needed.
    const gl = c.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance' });
    if (!gl) {
      // No WebGL: the take-over fades as on the PR and the letters take the film.
      let last = 0;
      const onTime = () => {
        if (o.currentTime < last - 1) {
          o.removeEventListener('timeupdate', onTime);
          Promise.resolve(v.play()).catch(() => {});
          setPhase('page');
        }
        last = o.currentTime;
      };
      o.addEventListener('timeupdate', onTime);
      Promise.resolve(o.play()).catch(() => setPhase('page'));
      return () => {
        o.removeEventListener('timeupdate', onTime);
        o.pause();
        v.pause();
      };
    }
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
    const loc = {
      p0: gl.getAttribLocation(prog, 'p0'),
      p1: gl.getAttribLocation(prog, 'p1'),
      seed: gl.getAttribLocation(prog, 'seed'),
      t: gl.getUniformLocation(prog, 't'),
      band: gl.getUniformLocation(prog, 'band'),
      crop: gl.getUniformLocation(prog, 'crop'),
      size: gl.getUniformLocation(prog, 'size'),
      alpha: gl.getUniformLocation(prog, 'alpha'),
      film: gl.getUniformLocation(prog, 'film'),
    };
    const buf = { p0: gl.createBuffer()!, p1: gl.createBuffer()!, seed: gl.createBuffer()! };
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const N = narrow ? GRAINS.narrow : GRAINS.wide;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 1;
    let H = 1;

    // The letters' inside, once: every dark pixel of the mark drawn small.
    const raster = document.createElement('canvas');
    raster.width = RASTER_W;
    raster.height = Math.round(RASTER_W / MARK_ASPECT);
    const rc = raster.getContext('2d')!;
    rc.fillStyle = '#fff';
    rc.fillRect(0, 0, raster.width, raster.height);
    drawMark(rc, 0, 0, RASTER_W, '#000', '#000');
    const px = rc.getImageData(0, 0, raster.width, raster.height).data;
    const inside: number[] = [];
    for (let i = 0; i < px.length; i += 4) if (px[i] < 128) inside.push(i / 4);

    const build = () => {
      W = h.clientWidth;
      H = h.clientHeight;
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      gl.viewport(0, 0, c.width, c.height);
      const hr = h.getBoundingClientRect();
      const sr = st.getBoundingClientRect();
      const k = sr.width / RASTER_W;
      const sx = sr.left - hr.left;
      const sy = sr.top - hr.top;
      const p0 = new Float32Array(N * 2);
      const p1 = new Float32Array(N * 2);
      const seed = new Float32Array(N * 2);
      for (let i = 0; i < N; i++) {
        const x0 = Math.random() * W;
        const y0 = Math.random() * H;
        const pick = inside[Math.floor(Math.random() * inside.length)];
        const tx = (pick % raster.width) + Math.random() - 0.5;
        const ty = Math.floor(pick / raster.width) + Math.random() - 0.5;
        p0[i * 2] = x0;
        p0[i * 2 + 1] = y0;
        p1[i * 2] = sx + tx * k;
        p1[i * 2 + 1] = sy + ty * k;
        seed[i * 2] = 0.75 * (x0 / W) + 0.25 * Math.random();
        seed[i * 2 + 1] = Math.random();
      }
      for (const [name, data] of [['p0', p0], ['p1', p1], ['seed', seed]] as const) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buf[name]);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(loc[name]);
        gl.vertexAttribPointer(loc[name], 2, gl.FLOAT, false, 0, 0);
      }
      gl.uniform2f(loc.band, W, H);
      gl.uniform1f(loc.size, (narrow ? GRAIN.narrow : GRAIN.wide) * dpr);
    };
    build();

    let raf = 0;
    let last = 0;
    let started = 0;
    let fused = 0;
    let stage2: Phase = 'film';
    const draw = (t: number, alpha: number) => {
      if (o.videoWidth) {
        const va = o.videoWidth / o.videoHeight;
        const ba = W / H;
        gl.uniform2f(loc.crop, Math.min(1, ba / va), Math.min(1, va / ba));
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, o);
      }
      gl.uniform1i(loc.film, 0);
      gl.uniform1f(loc.t, t);
      gl.uniform1f(loc.alpha, alpha);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, N);
    };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (stage2 === 'film') {
        const t = o.currentTime;
        if (t < last - 1) {
          // The wrap: the letters' film starts with the same frame; the grains take the band.
          Promise.resolve(v.play()).catch(() => {});
          stage2 = 'dust';
          started = now;
          setPhase('dust');
        }
        last = t;
        return;
      }
      if (stage2 === 'dust') {
        const t = clamp((now - started - SHATTER_MS * 0.6) / GATHER_MS);
        draw(t, 1);
        if (t >= 1) {
          stage2 = 'fuse';
          fused = now;
          setPhase('fuse');
        }
        return;
      }
      if (stage2 === 'fuse') {
        const a = 1 - clamp((now - fused) / FUSE_MS);
        draw(1, a);
        if (a <= 0) {
          stage2 = 'page';
          cancelAnimationFrame(raf);
          setPhase('page');
        }
      }
    };
    raf = requestAnimationFrame(tick);
    Promise.resolve(o.play()).catch(() => {
      cancelAnimationFrame(raf);
      setPhase('page');
    });
    const onResize = () => {
      if (stage2 === 'film') build();
    };
    addEventListener('resize', onResize);
    return () => {
      removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      o.pause();
      v.pause();
    };
  }, []);

  return (
    <section ref={hero} className={styles.hero} data-phase={phase} aria-labelledby="hovedtekst">
      <div ref={stage} className={styles.stage}>
        <video ref={video} className={styles.film} poster={POSTER} preload="metadata" muted loop playsInline aria-hidden="true" />
        <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
          <defs>
            <mask id="kornene" maskUnits="userSpaceOnUse" {...COVER}>
              <rect {...COVER} fill="white" />
              {MARK_LETTERS.map((p, i) => (
                <path key={i} transform={p.transform} d={p.d} fill="black" />
              ))}
            </mask>
          </defs>
          <rect className={styles.page} {...COVER} mask="url(#kornene)" />
          {MARK_LETTERS.map((p, i) => (
            <path key={i} className={styles.edge} transform={p.transform} d={p.d} vectorEffect="non-scaling-stroke" />
          ))}
          {MARK_ACCENTS.map((p, i) => (
            <path key={i} className={styles.accent} transform={p.transform} d={p.d} />
          ))}
        </svg>
      </div>
      <div className={styles.copy}>
        <h1 id="hovedtekst" className={styles.title}>{brief.home.headline}</h1>
        <p className={styles.lede}>{brief.home.paragraph}</p>
        <p className={styles.buttons}>
          <Link href={site.cta.work.href} prefetch={false} className={styles.work}>{site.cta.work.label}</Link>
          <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
        </p>
      </div>
      {phase !== 'page' && (
        <>
          <video ref={over} className={styles.over} poster={POSTER} preload="metadata" muted loop playsInline aria-hidden="true" />
          <canvas ref={canvas} className={styles.grains} aria-hidden="true" />
        </>
      )}
    </section>
  );
}
