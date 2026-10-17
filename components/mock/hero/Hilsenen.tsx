'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { LOGO_RATIO } from '@/components/site/Logo';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { onScroll } from '@/lib/smooth';
import styles from './hilsenen.module.css';

/** The name goes back to the header over this share of the screen's height of scrolling. */
const DOCK = 0.45;
const HEIGHT = 400;

/** The scroll's progress through the dock, eased in and out: the name sets off gently and lands softly. */
const ease = (t: number) => t * t * (3 - 2 * t);

/**
 * MOCK 15 Hilsenen. The name comes out to meet the visitor. The page opens with the logo where it
 * always is, small in the header — and then it steps out of the header, growing as it comes, until
 * it stands in the hero as large as the first screen allows: the guide's own logo file, the same
 * one the header shows, so nothing is redrawn and nothing changes but its size and place. The
 * paragraph and the two buttons are on the white beside it from the first frame. When the visitor
 * scrolls on, the name goes back the way it came, shrinking into the header with the scroll, and
 * lands exactly on the header's logo, which takes over: the name walks the visitor in and then
 * stays with them, in the corner, on every page after.
 */
export function Hilsenen() {
  const hero = useRef<HTMLElement>(null);
  const dock = useRef<HTMLSpanElement>(null);
  const greet = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const h = hero.current;
    const d = dock.current;
    const g = greet.current;
    const home = document.querySelector<HTMLElement>('#topp img[data-logo="white"]');
    if (!h || !d || !g || !home) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // From the name's place in the hero (in the page, unscrolled) to the header's logo (fixed on the screen).
    let o = { x: 0, y: 0, w: 1 };
    let to = { x: 0, y: 0, w: 1 };
    const measure = () => {
      const prev = d.style.transform;
      d.style.transform = 'none';
      const r = g.getBoundingClientRect();
      d.style.transform = prev;
      const gs = getComputedStyle(g).transform;
      // The greeting may still be playing: read the name's box without it.
      const m = gs && gs !== 'none' ? new DOMMatrixReadOnly(gs) : null;
      const w = m ? r.width / m.a : r.width;
      const x = m ? r.left - m.e : r.left;
      const y = m ? r.top - m.f : r.top;
      o = { x, y: y + window.scrollY, w };
      const hr = home.getBoundingClientRect();
      to = { x: hr.left, y: hr.top, w: hr.width };
    };
    measure();

    if (!reduced) {
      // The greeting: out of the header's logo, into the hero.
      const s = to.w / o.w;
      g.style.setProperty('--gx', `${(to.x - o.x).toFixed(2)}px`);
      g.style.setProperty('--gy', `${(to.y - (o.y - window.scrollY)).toFixed(2)}px`);
      g.style.setProperty('--gs', s.toFixed(5));
    }
    const id = requestAnimationFrame(() => h.setAttribute('data-in', ''));

    let raf = 0;
    let docked = false;
    const place = () => {
      raf = 0;
      const p = ease(Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * DOCK))));
      if (window.scrollY <= 0) {
        d.style.transform = '';
      } else {
        // On the screen, a straight way from where the name stood to the header's logo; the page scrolls under it.
        const s = 1 + (to.w / o.w - 1) * p;
        const x = (to.x - o.x) * p;
        const y = window.scrollY + (to.y - o.y) * p;
        d.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${s.toFixed(5)})`;
      }
      // Landed: the header's own logo is the name now.
      if ((p >= 1) !== docked) {
        docked = p >= 1;
        h.toggleAttribute('data-docked', docked);
      }
    };
    const onMove = () => {
      if (!raf) raf = requestAnimationFrame(place);
    };
    const off = reduced ? () => {} : onScroll(onMove);
    if (!reduced) window.addEventListener('scroll', onMove, { passive: true });
    const onResize = () => {
      measure();
      place();
    };
    window.addEventListener('resize', onResize);
    place();
    return () => {
      cancelAnimationFrame(id);
      cancelAnimationFrame(raf);
      off();
      window.removeEventListener('scroll', onMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section ref={hero} className={styles.hero} aria-labelledby="hovedtekst">
      <h1 className={styles.mark}>
        {/* The id is on the part that moves: the header watches it, and shows its own logo once this has landed on it. */}
        <span ref={dock} id="hovedtekst" className={styles.dock}>
          <span ref={greet} className={styles.greet}>
            <img src="/brand/iqra-logo.svg" alt={site.logoAlt} width={Math.round(HEIGHT * LOGO_RATIO)} height={HEIGHT} decoding="async" />
          </span>
        </span>
      </h1>
      <div className={styles.copy}>
        <p className={styles.lede}>{brief.home.paragraph}</p>
        <p className={styles.buttons}>
          <Link href={site.cta.work.href} prefetch={false} className={styles.work}>{site.cta.work.label}</Link>
          <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
        </p>
      </div>
    </section>
  );
}
