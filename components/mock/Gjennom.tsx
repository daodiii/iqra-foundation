'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import styles from './gjennom.module.css';

const POSTER = '/media/iqra-poster.jpg';
const FAR = 20000;
const REACH = { x: -FAR, y: -FAR, width: 2 * FAR, height: 2 * FAR };
/** The plate's scale when the window has the whole screen: the Q's ring is past every corner. */
const SCALE = 64;
/** The scroll's share that zooms; the rest brings the copy up on the film. */
const ZOOM = 0.8;

/** The Q in the art's order (a, i, Q, R). */
const Q = 2;

const clamp = (x: number) => Math.min(1, Math.max(0, x));

/**
 * 2 Gjennom: the name on white with the film in the letters, as it is; the scroll opens the
 * window. A room two screens tall with the view sticky inside it; the plate — the white
 * with the letters cut out, its hairlines and the two accents — is scaled about the Q's
 * left side, one to sixty-four, exponentially, so the zoom keeps one pace; the film under
 * it never moves. The page's copy is gone by an eighth of the way, the film's copy is up
 * by nine tenths, white on a navy scrim. Rolled back, the name closes round the film.
 */
export function Gjennom() {
  const room = useRef<HTMLElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const zoom = useRef<SVGGElement>(null);
  const q = useRef<SVGPathElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = video.current;
    const r = room.current;
    const w = view.current;
    const g = zoom.current;
    const qp = q.current;
    if (!v || !r || !w || !g || !qp) return;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      v.src = pickSource({
        narrow: window.matchMedia('(max-width: 767px)').matches,
        webm: v.canPlayType('video/webm; codecs="vp9"') !== '',
      });
      v.muted = true;
      v.load();
      Promise.resolve(v.play()).catch(() => {});
    }
    // The zoom's centre: in the Q's ring, on its left side, halfway up — the path's own box
    // taken through its `transform` attribute into the mark's units, which (with
    // `transform-box: view-box`) is what the origin is set in. Not `getCTM()`: that folds in
    // the viewBox's mapping to pixels, and the origin landed left of the i.
    const b = qp.getBBox();
    const m = qp.transform.baseVal.consolidate()?.matrix ?? new DOMMatrix();
    const o = new DOMPoint(b.x + b.width * 0.17, b.y + b.height * 0.5).matrixTransform(m);
    g.style.transformOrigin = `${o.x}px ${o.y}px`;
    const headerH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const rect = r.getBoundingClientRect();
      const pin = rect.height - w.clientHeight;
      const p = clamp((headerH() - rect.top) / pin);
      const s = Math.exp(Math.log(SCALE) * clamp(p / ZOOM));
      g.style.transform = `scale(${s})`;
      w.style.setProperty('--a', String(1 - clamp(p / 0.12)));
      w.style.setProperty('--b', String(clamp((p - 0.7) / 0.2)));
      w.toggleAttribute('data-in', p > 0.12);
      w.toggleAttribute('data-film', p > 0.7);
    };
    const ask = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    addEventListener('scroll', ask, { passive: true });
    addEventListener('resize', ask);
    tick();
    return () => {
      removeEventListener('scroll', ask);
      removeEventListener('resize', ask);
      cancelAnimationFrame(raf);
      v.pause();
    };
  }, []);

  return (
    <section ref={room} className={styles.room} aria-labelledby="hovedtekst">
      <div ref={view} className={styles.view}>
        <video ref={video} className={styles.film} poster={POSTER} preload="metadata" muted loop playsInline aria-hidden="true" />
        <div className={styles.stage}>
          <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
            <defs>
              <mask id="gjennom" maskUnits="userSpaceOnUse" {...REACH}>
                <rect {...REACH} fill="white" />
                {MARK_LETTERS.map((p, i) => (
                  <path key={i} ref={i === Q ? q : undefined} transform={p.transform} d={p.d} fill="black" />
                ))}
              </mask>
            </defs>
            <g ref={zoom} className={styles.zoom}>
              <rect className={styles.page} {...REACH} mask="url(#gjennom)" />
              {MARK_LETTERS.map((p, i) => (
                <path key={i} className={styles.edge} transform={p.transform} d={p.d} vectorEffect="non-scaling-stroke" />
              ))}
              {MARK_ACCENTS.map((p, i) => (
                <path key={i} className={styles.accent} transform={p.transform} d={p.d} />
              ))}
            </g>
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
        <div className={styles.scrim} aria-hidden="true" />
        <div className={styles.over} aria-hidden="true">
          <p className={styles.title2}>{brief.home.headline}</p>
          <p className={styles.lede2}>{brief.home.paragraph}</p>
          <p className={styles.buttons}>
            <Link href={site.cta.work.href} prefetch={false} tabIndex={-1} className={styles.work2}>{site.cta.work.label}</Link>
            <Link href={site.cta.support.href} prefetch={false} tabIndex={-1} className={styles.support}>{site.cta.support.label}</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
