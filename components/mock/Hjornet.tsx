'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import styles from './hjornet.module.css';

const POSTER = '/media/iqra-poster.jpg';
const [VX, VY, VW, VH] = MARK_VIEWBOX.split(' ').map(Number);
const BLEED = 2;
const COVER = { x: VX - BLEED, y: VY - BLEED, width: VW + 2 * BLEED, height: VH + 2 * BLEED };
/** The flight takes this much of the hero's height of scrolling. */
const FLIGHT = 0.62;
/** The lockup's viewBox (`public/brand/iqra-logo.svg`): the mark's own coordinates, with room round it. */
const LOCKUP = { x: 169.591, y: 335.594, w: 742.433 };

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** The size goes first, the place after: the box is small by the time it crosses the nav. */
const shrink = (x: number) => 1 - Math.pow(1 - x, 3);

/**
 * 5 Hjørnet: the hero as it is — the mark with the film in it, the copy under — but the
 * mark does not stay. As the hero scrolls out, the box that holds the film and the plate
 * is fixed to the screen and carried from where it stood to the header's logo, where the
 * lockup's «iQRa» is: at the end it sits over those letters at their size, the film still
 * running inside, for the rest of the page; scrolled back, it grows into the hero again.
 * The slot in flow keeps the hero's layout while the box is away. Reduced motion, or no
 * script: the box stays in its slot and the hero is the hero.
 */
export function Hjornet() {
  const hero = useRef<HTMLElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = video.current;
    const h = hero.current;
    const s = slot.current;
    const b = box.current;
    if (!v || !h || !s || !b) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    v.src = pickSource({
      narrow: window.matchMedia('(max-width: 767px)').matches,
      webm: v.canPlayType('video/webm; codecs="vp9"') !== '',
    });
    v.muted = true;
    v.load();
    Promise.resolve(v.play()).catch(() => {});

    const logo = document.querySelector<HTMLImageElement>('header a img');
    const headerH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
    // Where the lockup's «iQRa» is on the screen: the lockup's art shares the mark's
    // coordinates, so the mark's box is its viewBox offset from the lockup's, scaled.
    const target = () => {
      const r = logo?.getBoundingClientRect();
      if (!r || !r.width) return { x: 24, y: 16, w: 72 };
      const k = r.width / LOCKUP.w;
      return { x: r.left + (VX - LOCKUP.x) * k, y: r.top + (VY - LOCKUP.y) * k, w: VW * k };
    };
    b.dataset.fly = '';
    let raf = 0;
    const tick = () => {
      raf = 0;
      const hr = h.getBoundingClientRect();
      const sr = s.getBoundingClientRect();
      const p = clamp((headerH() - hr.top) / (hr.height * FLIGHT));
      const e = ease(p);
      const to = target();
      const x = sr.left + (to.x - sr.left) * e;
      const y = sr.top + (to.y - sr.top) * e;
      const w = sr.width + (to.w - sr.width) * shrink(p);
      b.style.setProperty('--w', `${sr.width}px`);
      b.style.transform = `translate(${x}px, ${y}px) scale(${w / sr.width})`;
      b.toggleAttribute('data-home', p >= 0.999);
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
    <section ref={hero} className={styles.hero} aria-labelledby="hovedtekst">
      <div ref={slot} className={styles.slot}>
        <div ref={box} className={styles.box}>
          <video ref={video} className={styles.film} poster={POSTER} preload="metadata" muted loop playsInline aria-hidden="true" />
          <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
            <defs>
              <mask id="hjornet" maskUnits="userSpaceOnUse" {...COVER}>
                <rect {...COVER} fill="white" />
                {MARK_LETTERS.map((p, i) => (
                  <path key={i} transform={p.transform} d={p.d} fill="black" />
                ))}
              </mask>
            </defs>
            <rect className={styles.page} {...COVER} mask="url(#hjornet)" />
            {MARK_LETTERS.map((p, i) => (
              <path key={i} className={styles.edge} transform={p.transform} d={p.d} vectorEffect="non-scaling-stroke" />
            ))}
            {MARK_ACCENTS.map((p, i) => (
              <path key={i} className={styles.accent} transform={p.transform} d={p.d} />
            ))}
          </svg>
        </div>
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
