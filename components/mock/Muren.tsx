'use client';

import { useEffect, useRef } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import { Band } from './Band';
import { coverOf, frameOf, makeCast, token } from './cast';
import { MARK_ASPECT, markPaths } from './markCanvas';
import styles from './muren.module.css';

const POSTER = '/media/iqra-poster.jpg';
const [VX, VY, VW, VH] = MARK_VIEWBOX.split(' ').map(Number);
/** How far the back of the opening is displaced per unit of the eye's offset, in stage widths. */
const DEPTH = 0.22;
/** The jamb is drawn in this many steps from the front edge to the back, at a third of the window's resolution: it is a smooth surface, and the crisp edges are the front clip and the film's. */
const STEPS = 20;
const JAMB_SCALE = 1 / 3;
/** The walk: from far to the left and a little below, to facing the wall, over this long. */
const WALK_MS = 2300;
const FROM: [number, number] = [-1.05, 0.4];

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const easeOutExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const hex = (s: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)) as [number, number, number];
const mix = (a: [number, number, number], b: [number, number, number], t: number) => `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * t)).join(' ')})`;

/**
 * 18 Muren, on white: the wall the name is cut through has thickness. The front of each
 * opening is the letter as drawn; the back — where the film is — sits a wall's depth
 * behind it, so from anywhere but straight in front you see the inside of the cut: the
 * jamb, in the wall's own shadow at the front edge and lit by the film's light towards the
 * back, in the film's own colour. On arrival the eye is far to the left and low and comes
 * round to face the wall over two seconds — the openings read as deep, then square — and
 * from then on the pointer is the eye (and the eye drifts a little on its own, so a phone
 * sees the depth too). Drawn in a canvas: the front opening as a clip, the jamb as the
 * letters filled twenty times along the displacement from the front colour to the lit
 * one (at a third of the resolution, upscaled under the crisp clips), the film clipped to
 * the back opening. No panes here: the wall is cut when you arrive, so the walk is seen.
 * The film's light on the white floor as in 10. Reduced motion, or no script: the wall
 * faced squarely, the film in the letters.
 */
export function Muren() {
  const room = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const wall = useRef<HTMLCanvasElement>(null);
  const cast = useRef<HTMLCanvasElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const r = room.current;
    const st = stage.current;
    const c = wall.current;
    const cc = cast.current;
    const v = video.current;
    if (!r || !st || !c || !cc || !v) return;
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
    // The film's average colour, for the light on the jamb: read from a 1px draw every so often.
    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const pctx = probe.getContext('2d', { willReadFrequently: true });
    const FRONT = hex('#d4d8de');
    let lit: [number, number, number] = hex('#f0dcc0');
    let small: ReturnType<typeof markPaths> | null = null;
    const jamb = document.createElement('canvas');
    const jctx = jamb.getContext('2d');
    // The front opening as an image, and the film clipped to the back opening: masks by
    // drawImage rather than path clips, which Chrome rasterises afresh every frame (52 fps with two clips, 60 with the masks).
    const mask = document.createElement('canvas');
    const mctx = mask.getContext('2d');
    const back = document.createElement('canvas');
    const bctx = back.getContext('2d');
    if (!jctx || !mctx || !bctx) return;
    let W = 0;
    let H = 0;
    const t0 = performance.now();
    let px = 0;
    let py = 0;
    let ex = FROM[0];
    let ey = FROM[1];
    let n = 0;
    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const t = now - t0;
      const frame = frameOf(v, poster);
      drawCast(frame);
      if (!frame) return;
      const w = Math.round(st.clientWidth * dpr);
      if (w !== W && w > 0) {
        W = w;
        H = Math.round(W / MARK_ASPECT);
        c.width = W;
        c.height = H;
        mask.width = W;
        mask.height = H;
        mctx.fillStyle = '#000';
        mctx.fill(markPaths(0, 0, W).letters);
        back.width = W;
        back.height = H;
        jamb.width = Math.round(W * JAMB_SCALE);
        jamb.height = Math.round(H * JAMB_SCALE);
        small = markPaths(0, 0, jamb.width);
      }
      if (!small) return;
      // The eye: the walk on arrival, then the pointer with a slow drift of its own.
      const walk = easeOutExpo(clamp((t - 150) / WALK_MS));
      const drift = 0.09 * Math.sin(t / 2600);
      const wx = px + drift;
      const wy = py + 0.05 * Math.cos(t / 3100);
      if (walk < 1) {
        ex = FROM[0] + (wx - FROM[0]) * walk;
        ey = FROM[1] + (wy - FROM[1]) * walk;
      } else {
        ex += (wx - ex) * 0.07;
        ey += (wy - ey) * 0.07;
      }
      r.style.setProperty('--px', ex.toFixed(3));
      // The back opening moves towards the eye: from the right you see the left jamb.
      const dx = ex * DEPTH * W;
      const dy = ey * DEPTH * W * 0.5;
      if (n++ % 12 === 0 && pctx) {
        pctx.drawImage(frame.src, 0, 0, 1, 1);
        const d = pctx.getImageData(0, 0, 1, 1).data;
        // Lifted towards a warm white: a lit surface, not the picture.
        lit = [d[0] + (250 - d[0]) * 0.55, d[1] + (238 - d[1]) * 0.55, d[2] + (220 - d[2]) * 0.55];
      }
      // The jamb, small: the letters filled step by step along the displacement, front colour to lit.
      jctx.clearRect(0, 0, jamb.width, jamb.height);
      jctx.fillStyle = mix(FRONT, lit, 0);
      jctx.fill(small.letters);
      for (let k = 1; k <= STEPS; k++) {
        const s = k / STEPS;
        jctx.fillStyle = mix(FRONT, lit, Math.pow(s, 0.8));
        jctx.save();
        jctx.translate(dx * s * JAMB_SCALE, dy * s * JAMB_SCALE);
        jctx.fill(small.letters);
        jctx.restore();
      }
      // The film, at the back of the opening, moving with it.
      const [sx, sy, sw, sh] = coverOf(frame.w, frame.h);
      bctx.globalCompositeOperation = 'source-over';
      bctx.clearRect(0, 0, W, H);
      bctx.drawImage(mask, dx, dy);
      bctx.globalCompositeOperation = 'source-in';
      bctx.drawImage(frame.src, sx, sy, sw, sh, dx, dy, W, H);
      // The jamb under it, and the whole cut to the front opening.
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(jamb, 0, 0, W, H);
      ctx.drawImage(back, 0, 0);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      px = e.clientX / innerWidth - 0.5;
      py = e.clientY / innerHeight - 0.5;
    };
    addEventListener('pointermove', onMove, { passive: true });
    return () => {
      removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
      v.pause();
    };
  }, []);

  return (
    <section ref={room} className={styles.room} aria-labelledby="hovedtekst">
      <video ref={video} className={styles.source} poster={POSTER} preload="metadata" muted loop playsInline aria-hidden="true" />
      <div className={styles.scene}>
        <div ref={stage} className={styles.stage}>
          <img className={styles.still} src={POSTER} alt="" aria-hidden="true" />
          <canvas ref={wall} className={styles.wall} aria-hidden="true" />
          <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
            <defs>
              <clipPath id="mur-letters" clipPathUnits="objectBoundingBox">
                {MARK_LETTERS.map((p, i) => (
                  <path key={i} transform={`scale(${1 / VW} ${1 / VH}) translate(${-VX} ${-VY}) ${p.transform}`} d={p.d} />
                ))}
              </clipPath>
            </defs>
            {MARK_LETTERS.map((p, i) => (
              <path key={i} className={styles.lead} transform={p.transform} d={p.d} vectorEffect="non-scaling-stroke" />
            ))}
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
