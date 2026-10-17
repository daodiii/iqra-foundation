'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { LOCKUP_VIEWBOX, LOCKUP_WORD } from '@/components/home/lockup';
import { MARK_ACCENTS, MARK_LETTERS } from '@/components/home/mark';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { amiri, IQRA } from './arabic';
import styles from './skriften.module.css';

/** The calligrapher's measure: the alif stands this many rhombic dots tall (Naskh: five to seven). */
const DOTS = 6;
const FS = 1000;

type Geo = { vb: string; family: string; dots: string[] };

/** A rhombus (the reed pen's square nib turned 45°) centred at (x, y), `s` from point to point. */
const rhombus = (x: number, y: number, s: number) => `M${x} ${y - s / 2}L${x + s / 2} ${y}L${x} ${y + s / 2}L${x - s / 2} ${y}Z`;

/**
 * MOCK 7 Skriften. The name in its own script: «اقرأ», the first word revealed, set very large in
 * Naskh (Amiri) on the guide's navy, and written as a calligrapher writes it. First the measure:
 * the rhombic dots that fix the alif's height, stacked beside it in crimson. Then the outline,
 * drawn; then the ink, laid from right to left as the pen moves. A pointer on the word writes it
 * again. Beside it the guide's lockup reversed, the brief's paragraph and the two buttons, on screen
 * from the first moment (the show never holds the words back).
 */
export function Skriften() {
  const hero = useRef<HTMLElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);

  useEffect(() => {
    const el = probe.current;
    if (!el) return;
    let live = true;
    const family = getComputedStyle(el).fontFamily;
    document.fonts.load(`700 100px ${family}`, IQRA).then(() => {
      if (!live) return;
      // Ink extents from the canvas: SVG's getBBox gives the font's line box, not the letters.
      const ctx = document.createElement('canvas').getContext('2d')!;
      ctx.font = `700 ${FS}px ${family}`;
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      const w = ctx.measureText(IQRA);
      const alif = ctx.measureText('ا');
      const left = w.actualBoundingBoxLeft;
      const right = w.actualBoundingBoxRight;
      const asc = w.actualBoundingBoxAscent;
      const desc = w.actualBoundingBoxDescent;
      const h = alif.actualBoundingBoxAscent;
      const s = h / DOTS;
      const x = right + s * 1.1;
      // Stacked as the manuals draw them: each dot a half-step to the side of the one under it.
      const dots = Array.from({ length: DOTS }, (_, i) => rhombus(x + (i % 2 ? s * 0.5 : 0), -s / 2 - i * s * 0.92, s * 0.92));
      const pad = FS * 0.04;
      const vb = `${-left - pad} ${-asc - pad} ${left + x + s / 2 + pad * 2} ${asc + desc + pad * 2}`;
      setGeo({ vb, family, dots });
    });
    return () => {
      live = false;
    };
  }, []);

  // Start the writing once the drawn word is on the page, two frames on: set before it mounted, the
  // word came in already written (no transition from a state it never had).
  useEffect(() => {
    if (!geo) return;
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => hero.current?.setAttribute('data-in', ''));
    });
    return () => cancelAnimationFrame(id);
  }, [geo]);

  const again = () => {
    const h = hero.current;
    if (!h || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    h.removeAttribute('data-in');
    requestAnimationFrame(() => requestAnimationFrame(() => h.setAttribute('data-in', '')));
  };

  return (
    <section ref={hero} className={`${styles.hero} ${amiri.variable}`} aria-labelledby="hovedtekst" data-header="dark">
      <span ref={probe} className={styles.probe} aria-hidden="true" />
      <div className={styles.word} onPointerEnter={again}>
        <svg viewBox={geo?.vb ?? '0 0 10 6'} aria-hidden="true">
          {geo && (
            <>
              {geo.dots.map((d, i) => (
                <path key={i} className={styles.dot} d={d} style={{ '--d': i } as CSSProperties} />
              ))}
              <text className={styles.ink} x={0} y={0} textAnchor="middle" direction="rtl" fontSize={FS} style={{ fontFamily: geo.family }}>
                {IQRA}
              </text>
              <text className={styles.outline} x={0} y={0} textAnchor="middle" direction="rtl" fontSize={FS} style={{ fontFamily: geo.family }}>
                {IQRA}
              </text>
            </>
          )}
        </svg>
        <p className={styles.say} lang="ar" dir="rtl">{IQRA}</p>
      </div>
      <div className={styles.copy}>
        <h1 id="hovedtekst" className={styles.mark}>
          <svg viewBox={LOCKUP_VIEWBOX} role="img" aria-label={site.logoAlt}>
            {MARK_LETTERS.map((p, k) => (
              <path key={k} className={styles.letter} transform={p.transform} d={p.d} />
            ))}
            {LOCKUP_WORD.map((p, k) => (
              <path key={k} className={styles.letter} transform={p.transform} d={p.d} />
            ))}
            {MARK_ACCENTS.map((p, k) => (
              <path key={k} className={styles.accent} transform={p.transform} d={p.d} />
            ))}
          </svg>
        </h1>
        <p className={styles.lede}>{brief.home.paragraph}</p>
        <p className={styles.buttons}>
          <Link href={site.cta.work.href} prefetch={false} className={styles.work}>{site.cta.work.label}</Link>
          <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
        </p>
      </div>
    </section>
  );
}
