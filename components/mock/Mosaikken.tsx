'use client';

import { useEffect, useRef, useState } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import { Band } from './Band';
import styles from './mosaikken.module.css';

const POSTER = '/media/iqra-poster.jpg';
const [VX, VY, VW, VH] = MARK_VIEWBOX.split(' ').map(Number);
/** The wave's speed across the wall, and the hold before it starts. */
const SPEED = 1300;
const HOLD = 0.4;

type Tiles = { size: number; cols: number; delays: number[]; last: number };

/**
 * 7 Mosaikken: the hero is a wall of Islamic geometry in navy, and the film stands in the
 * letters — the video clipped to the mark's paths, so the wall is the ground right up to
 * the letters' edges. On arrival the wall is shut: a shutter in the server's HTML, then a
 * grid of tiles carrying the same pattern, each flipping open on its left edge in a wave
 * that runs out from the name at 1300px/s; the copy band settles as its tiles go. When the
 * last tile is gone the grid is unmounted. Reduced motion, or no script: no shutter, no
 * tiles, the place as it ends.
 */
export function Mosaikken() {
  const hero = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [tiles, setTiles] = useState<Tiles | null>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const h = hero.current;
    const st = stage.current;
    const bd = band.current;
    const v = video.current;
    if (!h || !st || !bd || !v) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    v.src = pickSource({
      narrow: window.matchMedia('(max-width: 767px)').matches,
      webm: v.canPlayType('video/webm; codecs="vp9"') !== '',
    });
    v.muted = true;
    v.load();
    Promise.resolve(v.play()).catch(() => {});

    let timer: ReturnType<typeof setTimeout> | undefined;
    const raf = requestAnimationFrame(() => {
      const W = h.clientWidth;
      const H = h.clientHeight;
      const size = W < 768 ? 44 : 64;
      const cols = Math.ceil(W / size);
      const rows = Math.ceil(H / size);
      const hr = h.getBoundingClientRect();
      const sr = st.getBoundingClientRect();
      const cx = sr.left - hr.left + sr.width / 2;
      const cy = sr.top - hr.top + sr.height / 2;
      const delays: number[] = [];
      let last = 0;
      for (let i = 0; i < cols * rows; i++) {
        const x = (i % cols) * size + size / 2;
        const y = Math.floor(i / cols) * size + size / 2;
        const d = HOLD + Math.hypot(x - cx, y - cy) / SPEED + Math.random() * 0.1;
        delays.push(d);
        last = Math.max(last, d);
      }
      const br = bd.getBoundingClientRect();
      bd.style.setProperty('--d', `${(HOLD + Math.hypot(br.left - hr.left + br.width / 2 - cx, br.top - hr.top + br.height / 2 - cy) / SPEED).toFixed(2)}s`);
      setTiles({ size, cols, delays, last });
      timer = setTimeout(() => setGone(true), (last + 0.7) * 1000);
    });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      v.pause();
    };
  }, []);

  return (
    <section ref={hero} className={styles.hero} aria-labelledby="hovedtekst">
      <div className={styles.room}>
        <div ref={stage} className={styles.stage}>
          <video ref={video} className={styles.film} poster={POSTER} preload="metadata" muted loop playsInline aria-hidden="true" />
          <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
            <defs>
              {/* No <g> in a clipPath (SVG allows only shapes, paths, text and use): the box mapping goes on each path. */}
              <clipPath id="mosaikk-letters" clipPathUnits="objectBoundingBox">
                {MARK_LETTERS.map((p, i) => (
                  <path key={i} transform={`scale(${1 / VW} ${1 / VH}) translate(${-VX} ${-VY}) ${p.transform}`} d={p.d} />
                ))}
              </clipPath>
            </defs>
            {MARK_LETTERS.map((p, i) => (
              <path key={i} className={styles.edge} transform={p.transform} d={p.d} vectorEffect="non-scaling-stroke" />
            ))}
            {MARK_ACCENTS.map((p, i) => (
              <path key={i} className={styles.accent} transform={p.transform} d={p.d} />
            ))}
          </svg>
        </div>
      </div>
      <Band ref={band} className={styles.band} />
      {!gone && (
        tiles ? (
          <div className={styles.tiles} style={{ '--size': `${tiles.size}px` } as React.CSSProperties} aria-hidden="true">
            {tiles.delays.map((d, i) => {
              const x = (i % tiles.cols) * tiles.size;
              const y = Math.floor(i / tiles.cols) * tiles.size;
              return <span key={i} className={styles.tile} style={{ left: x, top: y, backgroundPosition: `${-x}px ${-y}px`, '--d': `${d.toFixed(2)}s` } as React.CSSProperties} />;
            })}
          </div>
        ) : (
          <div className={styles.shutter} aria-hidden="true" />
        )
      )}
    </section>
  );
}
