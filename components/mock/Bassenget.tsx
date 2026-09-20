'use client';

import { useCallback, useEffect, useRef } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import { createWater, type WaterFloor, type WaterHandle } from '@/lib/water';
import { Band } from './Band';
import { frameOf, token } from './cast';
import { makeWindow, WRITE } from './window';
import styles from './bassenget.module.css';

const POSTER = '/media/iqra-poster.jpg';
const [VX, VY, VW, VH] = MARK_VIEWBOX.split(' ').map(Number);
/** The reflection is drawn from a window this wide. */
const WIN_W = 640;
/** When the panes light, and when the drop falls. */
const LAMP_BASE = 400;
const DROP_AT = 1500;
/** The reflection is this much taller than the name: the surface is seen at a slant. */
const STRETCH = 1.12;

/**
 * The pool's floor: pale marble, a breath of the brand's water in the middle, the caustic
 * net and the glint strong enough to be read on a floor this light.
 */
const MARBLE: WaterFloor = {
  ground: '#eaedf0',
  pools: [['#d5e4e8', 0.5, 0.55, 0.85, 0.3]],
  caus: 2.8,
  spec: 0.95,
  night: false,
};

/**
 * 21 Bassenget, on white: a courtyard. The name is a window in the white wall with the
 * film in it, and at the wall's foot lies a still pool of water across the width, in
 * which the name is reflected — the film moving in the reflection, the reflection bent
 * by the surface. On arrival the panes light one by one and the reflection lights with
 * them; a single drop falls into it, and the rings cross the name; from then on the
 * pointer's wake runs through it, and a button's hover drops a stone. The copy stands on
 * the near water. The water is `lib/water.ts` on a marble floor, the reflection given to
 * it as the thing lying under the surface (`under`): the window drawn mirrored into an
 * image the pool's size, fading with distance. Without WebGL2, or under reduced motion,
 * the pool is a still plate and there is no reflection.
 */
export function Bassenget() {
  const hero = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const pool = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const water = useRef<WaterHandle | null>(null);

  useEffect(() => {
    const h = hero.current;
    const st = stage.current;
    const v = video.current;
    const p = pool.current;
    const c = canvas.current;
    if (!h || !st || !v || !p || !c) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    v.src = pickSource({
      narrow: window.matchMedia('(max-width: 767px)').matches,
      webm: v.canPlayType('video/webm; codecs="vp9"') !== '',
    });
    v.muted = true;
    v.load();
    Promise.resolve(v.play()).catch(() => {});

    const w = createWater(c, { reduced: false, floor: MARBLE, host: h, sharp: true, calm: true });
    if (!w) return;
    water.current = w;
    h.dataset.live = '';
    const crimson = token('--color-crimson', '#ab5261');
    const poster = new Image();
    poster.src = POSTER;
    const win = document.createElement('canvas');
    const drawWin = makeWindow(win, WIN_W, crimson, LAMP_BASE, true);
    const k = Math.min(2, window.devicePixelRatio || 1);
    const img = document.createElement('canvas');
    const ctx = img.getContext('2d');
    if (!ctx) return;
    const t0 = performance.now();
    let raf = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const frame = frameOf(v, poster);
      if (!frame) return;
      drawWin(frame, now - t0);
      const box = c.getBoundingClientRect();
      const sr = st.getBoundingClientRect();
      if (!box.width || !sr.width) return;
      const W = Math.round(box.width * k);
      const H = Math.round(box.height * k);
      if (img.width !== W || img.height !== H) {
        img.width = W;
        img.height = H;
      }
      const x = (sr.left - box.left) * k;
      const mw = sr.width * k;
      const mh = sr.height * k * STRETCH;
      ctx.clearRect(0, 0, W, H);
      // The name mirrored from the pool's far edge down, fading with the distance.
      ctx.save();
      ctx.translate(x, mh);
      ctx.scale(1, -1);
      ctx.drawImage(win, 0, 0, mw, mh);
      ctx.restore();
      const fade = ctx.createLinearGradient(0, 0, 0, mh);
      fade.addColorStop(0, 'rgba(0,0,0,0.72)');
      fade.addColorStop(0.5, 'rgba(0,0,0,0.42)');
      fade.addColorStop(1, 'rgba(0,0,0,0.08)');
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      w.under([img]);
    };
    raf = requestAnimationFrame(draw);
    const drop = setTimeout(() => {
      const box = c.getBoundingClientRect();
      const sr = st.getBoundingClientRect();
      w.stir((sr.left + sr.width * 0.5 - box.left) / box.width, 1 - (sr.height * 0.45) / box.height);
    }, DROP_AT);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(drop);
      w.destroy();
      water.current = null;
      v.pause();
    };
  }, []);

  // A button's hover drops a stone where the button is (0–1, y up).
  const stone = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const w = water.current;
    const c = canvas.current;
    if (!w || !c) return;
    const box = c.getBoundingClientRect();
    const r = e.currentTarget.getBoundingClientRect();
    w.stir((r.left + r.width / 2 - box.left) / box.width, 1 - (r.top + r.height / 2 - box.top) / box.height);
  }, []);

  return (
    <section ref={hero} className={styles.room} aria-labelledby="hovedtekst">
      <div className={styles.scene}>
        <div ref={stage} className={styles.stage}>
          <div className={styles.window} aria-hidden="true">
            <video ref={video} className={styles.film} poster={POSTER} preload="metadata" muted loop playsInline />
          </div>
          <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
            <defs>
              <clipPath id="basseng-letters" clipPathUnits="objectBoundingBox">
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
        </div>
      </div>
      <div ref={pool} className={styles.pool} aria-hidden="true">
        <canvas ref={canvas} className={styles.water} />
      </div>
      <Band tone="dark" className={styles.band} title={(t) => <span className={styles.sweep}>{t}</span>} onButton={stone} />
    </section>
  );
}
