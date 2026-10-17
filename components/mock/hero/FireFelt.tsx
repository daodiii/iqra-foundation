'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { LOCKUP_VIEWBOX, LOCKUP_WORD } from '@/components/home/lockup';
import { MARK_ACCENTS, MARK_LETTERS } from '@/components/home/mark';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { amiri, AREA_AR } from './arabic';
import styles from './firefelt.module.css';

/** The home page's order; each area's first sentence from the brief. */
const ORDER = ['kunnskap', 'samfunnsdeltakelse', 'dialog', 'moteplasser'];
const AREAS = ORDER.map((key) => {
  const a = brief.areas.find((x) => x.key === key)!;
  return { key, name: a.name, first: a.text.split('. ')[0] + '.', ar: AREA_AR[key] };
});
/** How long each field stays open in the run through them. */
const RUN = 3400;

/**
 * MOCK 9 Fire felt. Six without pictures: the four areas are the first screen, four fields in the
 * guide's four colours (Kunnskap navy, Samfunnsdeltakelse crimson, Dialog turquoise, Møteplasser
 * light, as the site already gives them), and each field's picture is its name in Arabic, written
 * large in Naskh, tone on tone, cropped by the field until the field opens. The run opens each once
 * (its Arabic written in from right to left, its first sentence from the brief, its bar filling),
 * then a pointer or a tap opens any. Under the fields, on white: the lockup, the paragraph, the buttons.
 */
export function FireFelt() {
  const hero = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    const id = requestAnimationFrame(() => hero.current?.setAttribute('data-in', ''));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!auto) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = window.setTimeout(
      () => {
        if (reduced || active >= AREAS.length - 1) setAuto(false);
        else setActive(active + 1);
      },
      reduced ? 0 : active === 0 ? RUN + 700 : RUN,
    );
    return () => window.clearTimeout(t);
  }, [active, auto]);

  const open = (i: number) => {
    setAuto(false);
    setActive(i);
  };

  return (
    <section ref={hero} className={`${styles.hero} ${amiri.variable}`} aria-labelledby="hovedtekst">
      <ul className={styles.fields} aria-label="Fire områder">
        {AREAS.map((a, i) => (
          <li
            key={a.key}
            className={styles.slot}
            data-area={a.key}
            data-open={i === active ? '' : undefined}
            style={{ '--i': i } as CSSProperties}
          >
            <button
              type="button"
              className={styles.field}
              aria-pressed={i === active}
              onPointerEnter={(e) => {
                if (e.pointerType !== 'touch' && i !== active) open(i);
              }}
              onClick={() => open(i)}
            >
              <span className={styles.ar} lang="ar" dir="rtl" aria-hidden="true">{a.ar}</span>
              <span className={styles.label}>
                <span className={styles.name}>{a.name}</span>
                <span className={styles.text}>{a.first}</span>
                <span className={styles.track} aria-hidden="true">
                  <span
                    key={`${active}-${auto}`}
                    className={styles.fill}
                    data-state={i < active && auto ? 'done' : i === active ? (auto ? 'run' : 'done') : 'none'}
                  />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className={styles.foot}>
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
