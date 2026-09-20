'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import { frameOf, makeCast, token } from './cast';
import styles from './hero.module.css';
import { LOCKUP_VIEWBOX, LOCKUP_WORD } from './lockup';
import { MARK_ACCENTS, MARK_LETTERS } from './mark';

const POSTER = '/media/iqra-poster.jpg';
const [VX, VY, VW, VH] = LOCKUP_VIEWBOX.split(' ').map(Number);
/** A path's transform into the box's own units (0..1 both ways), for a clip in `objectBoundingBox`. */
const box = (t: string) => `scale(${1 / VW} ${1 / VH}) translate(${-VX} ${-VY}) ${t}`;

/**
 * The fourteen letters the blade cuts, in the art's order: the name's four, then the
 * word's ten. `i` is each one's place in the blade's order — the name is written i, Q, R,
 * a though the art lists a, i, Q, R — and the word's ten are `small`: the glyphs are em
 * squares under a 90-unit matrix, so their blade is the name's over 90 and their piece
 * falls a shorter way from a lower hinge.
 */
const WRITE = [3, 0, 1, 2];
const CUTS = [
  ...MARK_LETTERS.map((p, k) => ({ ...p, i: WRITE[k], small: false })),
  ...LOCKUP_WORD.map((p, k) => ({ ...p, i: k, small: true })),
];

/**
 * The hero: the lockup cut out of the paper, the film in the letters.
 *
 * The first screen is white paper. The guide's lockup — «iQRa» with FOUNDATION under it —
 * is not printed on it but cut out of it: a blade (a navy hairline drawn round each
 * letter in turn, pathLength 1) runs the name in reading order and then the word, and
 * behind each cut a piece of the white — a div clipped to that one letter — tips over on
 * its top edge and falls once its outline is closed, leaving a window with the film in
 * it. The film is one `<video>` under everything, clipped to all fourteen letters from
 * the first frame, so nothing of it shows until its piece of paper has gone. Under the
 * open windows the film's light falls on the paper (`cast.ts`, multiplied and blurred),
 * and the copy stands in it: the brief's paragraph as a wide statement in the headings'
 * face and the two buttons, printed left to right by a head that passes across them. The
 * lockup is the heading — the h1 holds the art, named for the logo; the brief's headline
 * is not on the page. The beats are the stylesheet's, two seconds from the first paint.
 *
 * The film's source is picked after hydration (`pickSource`: 720p on a phone, WebM where
 * it plays) and never before, so with JavaScript off the `<video>` has no source and its
 * poster stands in the letters; under reduced motion the same, and no cast is made. In
 * both the stylesheet opens the windows at once (no blades, no pieces) and prints the
 * copy at once. Autoplay refused: the poster stands in the letters and the cast is drawn
 * from it. Nothing pins and nothing scrubs.
 */
export function Hero() {
  // The poster fills the letters until the film has decoded, so it is asked for early —
  // here, on the one element that wants it, rather than in the head of every route.
  ReactDOM.preload(POSTER, { as: 'image' });
  const video = useRef<HTMLVideoElement>(null);
  const cast = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const v = video.current;
    const c = cast.current;
    if (!v || !c) return;
    // Reduced motion: no source, no cast; the stylesheet has already opened the windows.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    v.src = pickSource({
      narrow: window.matchMedia('(max-width: 767px)').matches,
      webm: v.canPlayType('video/webm; codecs="vp9"') !== '',
    });
    v.muted = true;
    v.load();
    // Autoplay refused: the poster stands in the letters, and `frameOf` gives the cast the poster too.
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
    <section className={styles.hero} aria-labelledby="hovedtekst">
      <div className={styles.stage}>
        <video ref={video} className={styles.film} style={{ clipPath: 'url(#hero-letters)' }} poster={POSTER} preload="metadata" muted loop playsInline aria-hidden="true" />
        <h1 id="hovedtekst" className={styles.mark}>
          <svg viewBox={LOCKUP_VIEWBOX} role="img" aria-label={site.logoAlt}>
            <defs>
              {/* All fourteen for the film; each on its own for its piece of paper. In the box's units: the video and the pieces are the stage's size, as the art is. */}
              <clipPath id="hero-letters" clipPathUnits="objectBoundingBox">
                {CUTS.map((p, k) => (
                  <path key={k} transform={box(p.transform)} d={p.d} />
                ))}
              </clipPath>
              {CUTS.map((p, k) => (
                <clipPath key={k} id={`hero-cut-${k}`} clipPathUnits="objectBoundingBox">
                  <path transform={box(p.transform)} d={p.d} />
                </clipPath>
              ))}
            </defs>
            {CUTS.map((p, k) => (
              <path
                key={k}
                className={styles.blade}
                style={{ '--i': p.i } as React.CSSProperties}
                transform={p.transform}
                d={p.d}
                pathLength={1}
                data-blade
                data-small={p.small ? '' : undefined}
              />
            ))}
            {MARK_ACCENTS.map((p, i) => (
              <path key={i} className={styles.accent} transform={p.transform} d={p.d} data-accent />
            ))}
          </svg>
        </h1>
        <div className={styles.pieces} aria-hidden="true">
          {CUTS.map((p, k) => (
            <div
              key={k}
              className={styles.piece}
              style={{ clipPath: `url(#hero-cut-${k})`, '--i': p.i } as React.CSSProperties}
              data-piece
              data-small={p.small ? '' : undefined}
            />
          ))}
        </div>
        <canvas ref={cast} className={styles.cast} data-cast aria-hidden="true" />
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
