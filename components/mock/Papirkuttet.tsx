'use client';

import { useEffect, useRef } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import { Band } from './Band';
import { frameOf, makeCast, token } from './cast';
import styles from './papirkuttet.module.css';

const POSTER = '/media/iqra-poster.jpg';
const [VX, VY, VW, VH] = MARK_VIEWBOX.split(' ').map(Number);
/** The blade's order, i Q R a, for the art's order, a i Q R. */
const WRITE = [3, 0, 1, 2];
const box = (t: string) => `scale(${1 / VW} ${1 / VH}) translate(${-VX} ${-VY}) ${t}`;

/**
 * 12 Papirkuttet, from 9 on white: the name is cut out of the paper. The blade — a navy
 * hairline drawn round each letter in turn, i Q R a — and behind each cut a piece of the
 * white, a div clipped to that one letter, that tips over on its top edge and falls away
 * once its outline is closed, leaving the window with the film in it. The film's light
 * falls on the paper below as in 9, multiplied; the copy is printed by a head that passes
 * across the band. Reduced motion, or no script: the windows open, the copy printed.
 */
export function Papirkuttet() {
  const video = useRef<HTMLVideoElement>(null);
  const cast = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const v = video.current;
    const c = cast.current;
    if (!v || !c) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    v.src = pickSource({
      narrow: window.matchMedia('(max-width: 767px)').matches,
      webm: v.canPlayType('video/webm; codecs="vp9"') !== '',
    });
    v.muted = true;
    v.load();
    Promise.resolve(v.play()).catch(() => {});
    const draw = makeCast(c, token('--color-crimson', '#ab5261'));
    const poster = new Image();
    poster.src = POSTER;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      draw(frameOf(v, poster));
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      v.pause();
    };
  }, []);

  return (
    <section className={styles.room} aria-labelledby="hovedtekst">
      <div className={styles.scene}>
        <div className={styles.stage}>
          <video ref={video} className={styles.film} poster={POSTER} preload="metadata" muted loop playsInline aria-hidden="true" />
          <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
            <defs>
              <clipPath id="kutt-letters" clipPathUnits="objectBoundingBox">
                {MARK_LETTERS.map((p, i) => (
                  <path key={i} transform={box(p.transform)} d={p.d} />
                ))}
              </clipPath>
              {MARK_LETTERS.map((p, i) => (
                <clipPath key={i} id={`kutt-${i}`} clipPathUnits="objectBoundingBox">
                  <path transform={box(p.transform)} d={p.d} />
                </clipPath>
              ))}
            </defs>
            {MARK_LETTERS.map((p, i) => (
              <path key={i} className={styles.blade} style={{ '--i': WRITE[i] } as React.CSSProperties} transform={p.transform} d={p.d} pathLength={1} />
            ))}
            {MARK_ACCENTS.map((p, i) => (
              <path key={i} className={styles.accent} transform={p.transform} d={p.d} />
            ))}
          </svg>
          <div className={styles.pieces} aria-hidden="true">
            {MARK_LETTERS.map((_, i) => (
              <div key={i} className={styles.piece} style={{ clipPath: `url(#kutt-${i})`, '--i': WRITE[i] } as React.CSSProperties} />
            ))}
          </div>
          <canvas ref={cast} className={styles.cast} aria-hidden="true" />
        </div>
      </div>
      <div className={styles.print}>
        <Band tone="dark" className={styles.band} />
        <span className={styles.head} aria-hidden="true" />
      </div>
    </section>
  );
}
