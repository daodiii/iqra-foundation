'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import styles from './flommen.module.css';

const POSTER = '/media/iqra-poster.jpg';
/** The plate's reach in the mark's units: past any screen's edge at any size. */
const FAR = 20000;
const REACH = { x: -FAR, y: -FAR, width: 2 * FAR, height: 2 * FAR };
/** The pen's order, i Q R a, for the art's order, a i Q R. */
const WRITE = [3, 0, 1, 2];

/**
 * 1 Flommen: the film has the band; the pen writes the name's outline on it in white while
 * it plays; when the film has run once the white floods out of the letters' edges across the
 * band, and the film is left in the letters with the copy under it. One video, never moved.
 *
 * The flood is a stroke: in the mask the letters are drawn with a white stroke whose width
 * grows from nothing to past the screen, and filled black on top, so the white spreads from
 * the edges outward and never into the letters. The base styles are the page as it ends;
 * `data-phase="film"` is the opening, and only where scripting is on and motion allowed.
 */
export function Flommen() {
  const video = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<'film' | 'page'>('film');

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    v.src = pickSource({
      narrow: window.matchMedia('(max-width: 767px)').matches,
      webm: v.canPlayType('video/webm; codecs="vp9"') !== '',
    });
    v.muted = true;
    v.load();
    let last = 0;
    const onTime = () => {
      if (v.currentTime < last - 1) {
        v.removeEventListener('timeupdate', onTime);
        setPhase('page');
      }
      last = v.currentTime;
    };
    v.addEventListener('timeupdate', onTime);
    Promise.resolve(v.play()).catch(() => setPhase('page'));
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.pause();
    };
  }, []);

  return (
    <section className={styles.hero} data-phase={phase} aria-labelledby="hovedtekst">
      <video ref={video} className={styles.film} poster={POSTER} preload="metadata" muted loop playsInline aria-hidden="true" />
      <div className={styles.stage}>
        <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
          <defs>
            <mask id="flommen" maskUnits="userSpaceOnUse" {...REACH}>
              <g className={styles.ring}>
                {MARK_LETTERS.map((p, i) => (
                  <path key={i} transform={p.transform} d={p.d} />
                ))}
              </g>
              {MARK_LETTERS.map((p, i) => (
                <path key={i} transform={p.transform} d={p.d} fill="black" />
              ))}
            </mask>
          </defs>
          <rect className={styles.page} {...REACH} mask="url(#flommen)" />
          {MARK_LETTERS.map((p, i) => (
            <path key={i} className={styles.edge} style={{ '--i': WRITE[i] } as React.CSSProperties} transform={p.transform} d={p.d} pathLength={1} />
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
    </section>
  );
}
