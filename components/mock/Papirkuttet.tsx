'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { MARK_ACCENTS, MARK_LETTERS } from '@/components/home/mark';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import { frameOf, makeCast, token } from './cast';
import { LOCKUP_VIEWBOX, LOCKUP_WORD } from './lockup';
import { LOCKUP_ASPECT, lockupPaths } from './markCanvas';
import styles from './papirkuttet.module.css';

const POSTER = '/media/iqra-poster.jpg';
const [VX, VY, VW, VH] = LOCKUP_VIEWBOX.split(' ').map(Number);
/** The blade's order, i Q R a, for the art's order, a i Q R. */
const WRITE = [3, 0, 1, 2];
const box = (t: string) => `scale(${1 / VW} ${1 / VH}) translate(${-VX} ${-VY}) ${t}`;

/**
 * 12 Papirkuttet, chosen 2026-09-20 and reworked to the owner's three notes: the lockup,
 * not the mark alone — FOUNDATION under the name, cut out of the paper too, ten small
 * blades after the four big ones and ten small pieces falling; no headline; the paragraph
 * and the two buttons centred under the lockup in the light, and larger. The cut is as
 * before: the blade a navy hairline drawn round each letter in turn, and behind each cut
 * a piece of the white, a div clipped to that one letter, that tips over on its top edge
 * and falls once its outline is closed, leaving the window with the film in it. The film's
 * light falls on the paper below, multiplied, and the copy stands in it; the copy is
 * printed by a head that passes across it. Reduced motion, or no script: the windows open,
 * the copy printed.
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
    const draw = makeCast(c, token('--color-crimson', '#ab5261'), true, { aspect: LOCKUP_ASPECT, paths: lockupPaths });
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
      <h1 id="hovedtekst" className="visually-hidden">{site.logoAlt}</h1>
      <div className={styles.scene}>
        <div className={styles.stage}>
          <video ref={video} className={styles.film} poster={POSTER} preload="metadata" muted loop playsInline aria-hidden="true" />
          <svg className={styles.mark} viewBox={LOCKUP_VIEWBOX} role="img" aria-label={site.logoAlt}>
            <defs>
              <clipPath id="kutt-letters" clipPathUnits="objectBoundingBox">
                {MARK_LETTERS.map((p, i) => (
                  <path key={i} transform={box(p.transform)} d={p.d} />
                ))}
                {LOCKUP_WORD.map((p, i) => (
                  <path key={`w${i}`} transform={box(p.transform)} d={p.d} />
                ))}
              </clipPath>
              {MARK_LETTERS.map((p, i) => (
                <clipPath key={i} id={`kutt-${i}`} clipPathUnits="objectBoundingBox">
                  <path transform={box(p.transform)} d={p.d} />
                </clipPath>
              ))}
              {LOCKUP_WORD.map((p, i) => (
                <clipPath key={`w${i}`} id={`kutt-w${i}`} clipPathUnits="objectBoundingBox">
                  <path transform={box(p.transform)} d={p.d} />
                </clipPath>
              ))}
            </defs>
            {MARK_LETTERS.map((p, i) => (
              <path key={i} className={styles.blade} style={{ '--i': WRITE[i] } as React.CSSProperties} transform={p.transform} d={p.d} pathLength={1} />
            ))}
            {/* The word's glyphs are em squares placed by a 90-unit matrix: their hairline is the name's divided by 90. */}
            {LOCKUP_WORD.map((p, i) => (
              <path key={`w${i}`} className={`${styles.blade} ${styles.small}`} style={{ '--i': i } as React.CSSProperties} transform={p.transform} d={p.d} pathLength={1} />
            ))}
            {MARK_ACCENTS.map((p, i) => (
              <path key={i} className={styles.accent} transform={p.transform} d={p.d} />
            ))}
          </svg>
          <div className={styles.pieces} aria-hidden="true">
            {MARK_LETTERS.map((_, i) => (
              <div key={i} className={styles.piece} style={{ clipPath: `url(#kutt-${i})`, '--i': WRITE[i] } as React.CSSProperties} />
            ))}
            {LOCKUP_WORD.map((_, i) => (
              <div key={`w${i}`} className={`${styles.piece} ${styles.smallPiece}`} style={{ clipPath: `url(#kutt-w${i})`, '--i': i } as React.CSSProperties} />
            ))}
          </div>
          <canvas ref={cast} className={styles.cast} aria-hidden="true" />
        </div>
      </div>
      <div className={styles.print}>
        <div className={styles.copy}>
          <p className={styles.lede}>{brief.home.paragraph}</p>
          <p className={styles.buttons}>
            <Link href={site.cta.work.href} prefetch={false} className={styles.work}>{site.cta.work.label}</Link>
            <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
          </p>
        </div>
        <span className={styles.head} aria-hidden="true" />
      </div>
    </section>
  );
}
