'use client';

import { useEffect, useRef } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import { Band } from './Band';
import { frameOf, makeCast, token } from './cast';
import styles from './glassmaleriet.module.css';

const POSTER = '/media/iqra-poster.jpg';
const [VX, VY, VW, VH] = MARK_VIEWBOX.split(' ').map(Number);
/** The lamps' order, i Q R a, for the art's order, a i Q R. */
const WRITE = [3, 0, 1, 2];
/** The sun's rise: from far to the left and low, to overhead, over this long. */
const RISE_MS = 3400;
const SUN_FROM = -0.8;

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

/**
 * 10 Glassmaleriet, from 9 on white: the letters are stained glass in a white wall. Each is a
 * pane still unlit — a white fill over the film that flickers out in turn — and the film's
 * colours fall through the lit panes onto the white floor as coloured light: the frame
 * clipped to the letters, mirrored, blurred, and multiplied onto the paper. The light has a
 * sun: `--sun` is where it stands, −1 (far left, low) to 1; the cast skews away from it and
 * lengthens as it drops. On arrival the sun rises from the left over three seconds; from
 * then on the pointer is the sun, eased. Reduced motion, or no script: the wall lit, noon.
 */
export function Glassmaleriet() {
  const room = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const cast = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const r = room.current;
    const v = video.current;
    const c = cast.current;
    if (!r || !v || !c) return;
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
    const t0 = performance.now();
    let sun = SUN_FROM;
    let want = 0;
    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      draw(frameOf(v, poster));
      const rise = clamp((now - t0 - 300) / RISE_MS);
      if (rise < 1) sun = SUN_FROM + (0 - SUN_FROM) * easeOut(rise);
      else sun += (want - sun) * 0.06;
      r.style.setProperty('--sun', sun.toFixed(3));
      r.style.setProperty('--low', Math.abs(sun).toFixed(3));
    };
    raf = requestAnimationFrame(tick);
    const onMove = (e: PointerEvent) => {
      want = (e.clientX / innerWidth - 0.5) * 1.4;
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
      <div className={styles.scene}>
        <div className={styles.stage}>
          <video ref={video} className={styles.film} poster={POSTER} preload="metadata" muted loop playsInline aria-hidden="true" />
          <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
            <defs>
              <clipPath id="glass-letters" clipPathUnits="objectBoundingBox">
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
          <canvas ref={cast} className={styles.cast} aria-hidden="true" />
        </div>
      </div>
      <Band tone="dark" className={styles.band} title={(t) => <span className={styles.sweep}>{t}</span>} />
    </section>
  );
}
