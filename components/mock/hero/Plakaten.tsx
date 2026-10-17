'use client';

import Link from 'next/link';
import { useEffect, useRef, type CSSProperties } from 'react';
import { LOCKUP_WORD } from '@/components/home/lockup';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import styles from './plakaten.module.css';

/** The art lists a, i, Q, R; they are set i, Q, R, a. Depth: how far each moves with the pointer. */
const ORDER = [3, 0, 1, 2];
const DEPTH = [1.25, 0.6, 1, 0.8];
/** FOUNDATION's ten glyphs on their own line: the word's box in the lockup's units. */
const WORD_VIEWBOX = '176 708 731 70';

/**
 * MOCK 10 Plakaten. A Swiss poster made of the guide's own lockup, taken apart: «iQRa» set as large
 * as the screen is wide, standing on the bottom edge and cut by it, and FOUNDATION as a spaced line
 * at the top like a masthead. Between them, on a strict grid, the brief's paragraph as the lead and
 * the two buttons. Arrival: the letters are set one at a time, each rising out of the bottom edge
 * into place, the tail drawn out of the Q, the dot dropped onto the i last. The letters shift a
 * little with the pointer, each by its own depth.
 */
export function Plakaten() {
  const hero = useRef<HTMLElement>(null);
  useEffect(() => {
    const h = hero.current;
    if (!h) return;
    const id = requestAnimationFrame(() => h.setAttribute('data-in', ''));
    // Once set, the letters follow the pointer without their long entrance transition.
    const done = window.setTimeout(() => h.setAttribute('data-done', ''), 2300);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return () => {
        cancelAnimationFrame(id);
        window.clearTimeout(done);
      };
    let raf = 0;
    let aim = 0;
    let now = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const r = h.getBoundingClientRect();
      aim = ((e.clientX - r.left) / r.width) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const tick = () => {
      now += (aim - now) * 0.08;
      h.style.setProperty('--px', now.toFixed(4));
      raf = Math.abs(aim - now) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    h.addEventListener('pointermove', onMove);
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(done);
      cancelAnimationFrame(raf);
      h.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <section ref={hero} className={styles.hero} aria-labelledby="hovedtekst">
      <svg className={styles.masthead} viewBox={WORD_VIEWBOX} aria-hidden="true">
        {LOCKUP_WORD.map((p, k) => (
          <path key={k} transform={p.transform} d={p.d} style={{ '--k': k } as CSSProperties} />
        ))}
      </svg>
      <p className={styles.lede}>{brief.home.paragraph}</p>
      <p className={styles.buttons}>
        <Link href={site.cta.work.href} prefetch={false} className={styles.work}>{site.cta.work.label}</Link>
        <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
      </p>
      <h1 id="hovedtekst" className={styles.mark}>
        <svg viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
          {/* Each letter on its own <g>: a CSS transform on the path would replace the art's y-flip. */}
          {MARK_LETTERS.map((p, k) => (
            <g key={k} className={styles.letter} style={{ '--o': ORDER[k], '--z': DEPTH[k] } as CSSProperties}>
              <path transform={p.transform} d={p.d} />
            </g>
          ))}
          <g className={styles.tail} style={{ '--z': DEPTH[2] } as CSSProperties}>
            <path transform={MARK_ACCENTS[0].transform} d={MARK_ACCENTS[0].d} />
          </g>
          <g className={styles.dot} style={{ '--z': DEPTH[1] } as CSSProperties}>
            <path transform={MARK_ACCENTS[1].transform} d={MARK_ACCENTS[1].d} />
          </g>
        </svg>
      </h1>
    </section>
  );
}
