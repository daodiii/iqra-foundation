'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import styles from './fortekst.module.css';

const POSTER = '/media/iqra-poster.jpg';
const [VX, VY, VW, VH] = MARK_VIEWBOX.split(' ').map(Number);
const BLEED = 2;
const COVER = { x: VX - BLEED, y: VY - BLEED, width: VW + 2 * BLEED, height: VH + 2 * BLEED };
/** The film's four hard cuts, measured (ffmpeg scene detection on the 1080 loop). */
const CUTS = [1.041667, 2.041667, 3.041667, 4.041667];
const shotAt = (t: number) => CUTS.filter((c) => t >= c).length;
const FADE_MS = 1000;

type Film = 'over' | 'inside' | 'done';

/**
 * 4 Fortekst: the film has the whole screen and its cuts are the beat. The first shot
 * carries the name in white; each of the four after it brings its area's word in on a
 * plate of the area's colour, from the left like the sea's tides — the plates stack, each
 * over the last, and go together at the wrap. Then the take-over fades as on the PR and
 * the film is in the letters with the copy under. `data-shot` is written per frame from
 * the take-over's clock; the stylesheet does the rest.
 */
export function Fortekst() {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const over = useRef<HTMLVideoElement>(null);
  const [film, setFilm] = useState<Film>('over');

  useEffect(() => {
    const v = video.current;
    const o = over.current;
    const sec = section.current;
    if (!v || !o || !sec) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const src = pickSource({
      narrow: window.matchMedia('(max-width: 767px)').matches,
      webm: v.canPlayType('video/webm; codecs="vp9"') !== '',
    });
    for (const el of [v, o]) {
      el.src = src;
      el.muted = true;
      el.load();
    }
    let last = 0;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      const t = o.currentTime;
      if (t < last - 1) {
        // The wrap: the titles are done, the letters take the film.
        delete sec.dataset.shot;
        Promise.resolve(v.play()).catch(() => {});
        setFilm('inside');
        timer = setTimeout(() => setFilm('done'), FADE_MS);
        return;
      }
      last = t;
      sec.dataset.shot = String(shotAt(t));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    Promise.resolve(o.play()).catch(() => {
      cancelAnimationFrame(raf);
      setFilm('done');
    });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      o.pause();
      v.pause();
    };
  }, []);

  return (
    <section ref={section} className={styles.hero} data-film={film} aria-labelledby="hovedtekst">
      <div className={styles.stage}>
        <video ref={video} className={styles.film} poster={POSTER} preload="metadata" muted loop playsInline aria-hidden="true" />
        <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
          <defs>
            <mask id="fortekst" maskUnits="userSpaceOnUse" {...COVER}>
              <rect {...COVER} fill="white" />
              {MARK_LETTERS.map((p, i) => (
                <path key={i} transform={p.transform} d={p.d} fill="black" />
              ))}
            </mask>
          </defs>
          <rect className={styles.page} {...COVER} mask="url(#fortekst)" />
          {MARK_LETTERS.map((p, i) => (
            <path key={i} className={styles.edge} transform={p.transform} d={p.d} vectorEffect="non-scaling-stroke" />
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
      {film !== 'done' && (
        <div className={styles.over} aria-hidden="true">
          <video ref={over} className={styles.take} poster={POSTER} preload="metadata" muted loop playsInline />
          <svg className={styles.name} viewBox={MARK_VIEWBOX}>
            {MARK_LETTERS.map((p, i) => (
              <path key={i} fill="white" transform={p.transform} d={p.d} />
            ))}
            {MARK_ACCENTS.map((p, i) => (
              <path key={i} className={styles.accent} transform={p.transform} d={p.d} />
            ))}
          </svg>
          {brief.areas.map((a, i) => (
            <div key={a.key} className={styles.plate} data-i={i} data-key={a.key}>
              <span className={styles.word}>{a.name}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
