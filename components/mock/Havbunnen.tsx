'use client';

import { useCallback, useEffect, useRef } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { site } from '@/content/site.no';
import { brand } from '@/lib/film';
import { pickSource } from '@/lib/media';
import { createWater, type WaterHandle } from '@/lib/water';
import { Band } from './Band';
import { MARK_ASPECT, markPaths } from './markCanvas';
import styles from './havbunnen.module.css';

const POSTER = '/media/iqra-poster.jpg';
const [VX, VY, VW, VH] = MARK_VIEWBOX.split(' ').map(Number);
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

/**
 * 8 Havbunnen: the hero is the sea, and the name with the film in it lies on the bottom.
 * Each frame the film is drawn into an image the size of the water's canvas, clipped to
 * the letters in the place the mark has in the DOM, with the two accents in crimson, and
 * given to the water (`WaterHandle.under`), which paints it on the floor at the refracted
 * point: the surface bends the letters, the rain and the pointer's wake run through them,
 * the caustics play on them. The entrance is the site's own: the floor is the light area's
 * and the tide brings the navy in from the left over the name in the first three seconds,
 * and a stone drops. The copy stands on the water; a button's hover drops one where it is.
 * The DOM stage under the canvas is the whole answer without WebGL2, and under reduced
 * motion, where nothing is built.
 */
export function Havbunnen() {
  const hero = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const water = useRef<WaterHandle | null>(null);

  useEffect(() => {
    const h = hero.current;
    const st = stage.current;
    const v = video.current;
    const c = canvas.current;
    if (!h || !st || !v || !c) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    v.src = pickSource({
      narrow: window.matchMedia('(max-width: 767px)').matches,
      webm: v.canPlayType('video/webm; codecs="vp9"') !== '',
    });
    v.muted = true;
    v.load();
    Promise.resolve(v.play()).catch(() => {});

    const w = createWater(c, { reduced: false, floor: brand.areaFloor.light, host: h, sharp: true });
    if (!w) return;
    water.current = w;
    h.dataset.live = '';
    const poster = new Image();
    poster.src = POSTER;
    const crimson = getComputedStyle(document.documentElement).getPropertyValue('--color-crimson').trim() || '#ab5261';
    const k = Math.min(2, window.devicePixelRatio || 1);
    const img = document.createElement('canvas');
    const ctx = img.getContext('2d');
    if (!ctx) return;
    let paths: ReturnType<typeof markPaths> | null = null;
    let key = '';
    let raf = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
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
      const y = (sr.top - box.top) * k;
      const mw = sr.width * k;
      const id = `${W}:${H}:${x}:${y}:${mw}`;
      if (id !== key) {
        paths = markPaths(x, y, mw);
        key = id;
      }
      if (!paths) return;
      ctx.clearRect(0, 0, W, H);
      const live = v.readyState >= 2 && !v.paused;
      const src: CanvasImageSource = live ? v : poster;
      const sw0 = live ? v.videoWidth : poster.naturalWidth;
      const sh0 = live ? v.videoHeight : poster.naturalHeight;
      if (!sw0) return;
      // The frame's cover crop of the mark's box.
      const va = sw0 / sh0;
      let sw = sw0;
      let sh = sh0;
      if (va > MARK_ASPECT) sw = sh0 * MARK_ASPECT;
      else sh = sw0 / MARK_ASPECT;
      ctx.save();
      ctx.clip(paths.letters);
      ctx.drawImage(src, (sw0 - sw) / 2, (sh0 - sh) / 2, sw, sh, x, y, mw, mw / MARK_ASPECT);
      ctx.restore();
      ctx.fillStyle = crimson;
      ctx.fill(paths.accents);
      w.under([img]);
    };
    raf = requestAnimationFrame(draw);

    // The entrance: the tide brings the navy in over the name, and a stone drops.
    const t0 = performance.now();
    let tideRaf = 0;
    const tide = (now: number) => {
      const t = clamp((now - t0 - 400) / 2600);
      w.retune(brand.areaFloor.light, brand.areaFloor.navy, ease(t));
      // The copy comes up as the navy reaches its side: white on the light floor would not read.
      if (ease(t) > 0.55) h.dataset.tide = '';
      if (t < 1) tideRaf = requestAnimationFrame(tide);
    };
    tideRaf = requestAnimationFrame(tide);
    const stone = setTimeout(() => w.stir(0.5, 0.6), 1100);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(tideRaf);
      clearTimeout(stone);
      w.destroy();
      water.current = null;
      v.pause();
    };
  }, []);

  // A button's hover drops a stone where the button is (0–1, y up).
  const drop = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const w = water.current;
    const c = canvas.current;
    if (!w || !c) return;
    const box = c.getBoundingClientRect();
    const r = e.currentTarget.getBoundingClientRect();
    w.stir((r.left + r.width / 2 - box.left) / box.width, 1 - (r.top + r.height / 2 - box.top) / box.height);
  }, []);

  return (
    <section ref={hero} className={styles.hero} aria-labelledby="hovedtekst">
      <canvas ref={canvas} className={styles.water} aria-hidden="true" />
      <div className={styles.room}>
        <div ref={stage} className={styles.stage}>
          <video ref={video} className={styles.film} poster={POSTER} preload="metadata" muted loop playsInline aria-hidden="true" />
          <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
            <defs>
              {/* No <g> in a clipPath (SVG allows only shapes, paths, text and use): the box mapping goes on each path. */}
              <clipPath id="havbunn-letters" clipPathUnits="objectBoundingBox">
                {MARK_LETTERS.map((p, i) => (
                  <path key={i} transform={`scale(${1 / VW} ${1 / VH}) translate(${-VX} ${-VY}) ${p.transform}`} d={p.d} />
                ))}
              </clipPath>
            </defs>
            {MARK_ACCENTS.map((p, i) => (
              <path key={i} className={styles.accent} transform={p.transform} d={p.d} />
            ))}
          </svg>
        </div>
      </div>
      <Band className={styles.band} onButton={drop} />
    </section>
  );
}
