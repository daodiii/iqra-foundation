'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import styles from './hero.module.css';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from './mark';

const POSTER = '/media/iqra-poster.jpg';

/**
 * The mask's reach, in the mark's own units: the viewBox plus a hair, so the white rect
 * covers the film to the stage's edge and no further — a rect that overhung the stage
 * painted over the headline below it, because a positioned element paints above the copy
 * that follows in flow. The stage clips what little overhangs.
 */
const [VX, VY, VW, VH] = MARK_VIEWBOX.split(' ').map(Number);
const BLEED = 2;
const COVER = { x: VX - BLEED, y: VY - BLEED, width: VW + 2 * BLEED, height: VH + 2 * BLEED };

/**
 * The hero: the film inside the mark.
 *
 * The guide's «iQRa» stands centred on the page's white, and the four navy letters are a
 * window the hero film plays through — an SVG mask over the video: a white rect with the
 * letters cut out of it, so the film shows only inside them. The dot of the i and the tail
 * out of the Q stay solid crimson on top: they are the accent, not windows. A hairline in
 * navy follows the letters' edge, so the name still reads when the film runs light (the
 * plain at Arafat is nearly white). Under the mark the headline takes over from
 * «Foundation»: the brief's own sentence, its paragraph, and the two buttons.
 *
 * The film's source is picked after hydration (`pickSource`: 720p on a phone, WebM where
 * it plays) and never before, so with JavaScript off the `<video>` has no source and shows
 * its poster in the letters; under reduced motion the same — the poster stands, and
 * nothing plays. Nothing pins and nothing scrubs: this is the name carrying the film, not
 * the film carrying the name.
 */
export function Hero() {
  // The poster fills the letters until the film has decoded, so it is asked for early —
  // here, on the one element that wants it, rather than in the head of every route.
  ReactDOM.preload(POSTER, { as: 'image' });
  const video = useRef<HTMLVideoElement>(null);

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
    // Autoplay refused: the poster stays in the letters, and nothing else changes.
    Promise.resolve(v.play()).catch(() => {});
    return () => v.pause();
  }, []);

  return (
    <section className={styles.hero} aria-labelledby="hovedtekst">
      <div className={styles.stage}>
        <video ref={video} className={styles.film} poster={POSTER} preload="metadata" muted loop playsInline aria-hidden="true" />
        <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
          <defs>
            {/* Luminance: white shows the rect, black cuts the letters out of it. Not colours on the page. */}
            <mask id="mark-letters" maskUnits="userSpaceOnUse" {...COVER}>
              <rect {...COVER} fill="white" />
              {MARK_LETTERS.map((p, i) => (
                <path key={i} transform={p.transform} d={p.d} fill="black" />
              ))}
            </mask>
          </defs>
          <rect className={styles.page} {...COVER} mask="url(#mark-letters)" />
          {MARK_LETTERS.map((p, i) => (
            <path key={i} className={styles.edge} transform={p.transform} d={p.d} vectorEffect="non-scaling-stroke" />
          ))}
          {MARK_ACCENTS.map((p, i) => (
            <path key={i} className={styles.accent} transform={p.transform} d={p.d} data-accent />
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
