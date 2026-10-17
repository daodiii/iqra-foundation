'use client';

import Link from 'next/link';
import { useEffect, useRef, type CSSProperties } from 'react';
import { MARK_ACCENTS, MARK_LETTERS } from '@/components/home/mark';
import { LOCKUP_VIEWBOX, LOCKUP_WORD } from '@/components/home/lockup';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { ChapterFilm, HOME_ORDER, useChapters } from './chapters';
import styles from './lerretet.module.css';

/** The guide's navy as a duotone: the film's dark at navy-deepest, its light at a pale navy. */
const DARK = [20, 31, 45].map((v) => v / 255);
const LIGHT = [214, 224, 236].map((v) => v / 255);
const LUMA = [0.2126, 0.7152, 0.0722];
const DUO = [0, 1, 2]
  .map((c) => [...LUMA.map((l) => (l * (LIGHT[c] - DARK[c])).toFixed(4)), 0, DARK[c].toFixed(4)].join(' '))
  .concat('0 0 0 1 0')
  .join('  ');

/** i, Q, R, a in the art's order a, i, Q, R: each letter's place in the setting. */
const ORDER = [3, 0, 1, 2];

/**
 * MOCK 3 Lerretet. The rule broken on purpose, to ask whether it still holds: the film is not in
 * the letters but the whole first screen, graded into the guide's navy, and the lockup stands on it
 * reversed (white, the crimson accents), set bottom left, letter by letter. The paragraph and the
 * two buttons to the right; along the foot the four areas as the film's chapters. The header turns
 * navy over it, so header and film read as one ground.
 */
export function Lerretet() {
  const ch = useChapters(HOME_ORDER, 300);
  const hero = useRef<HTMLElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => hero.current?.setAttribute('data-in', ''));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section ref={hero} className={styles.hero} aria-labelledby="hovedtekst" data-header="dark">
      <svg width="0" height="0" className={styles.defs} aria-hidden="true">
        <filter id="l-duo" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={DUO} />
        </filter>
      </svg>
      <div className={styles.screen}>
        <ChapterFilm chapters={HOME_ORDER} active={ch.active} video={ch.video} className={styles.film} />
      </div>
      <div className={styles.content}>
        <h1 id="hovedtekst" className={styles.mark}>
          <svg viewBox={LOCKUP_VIEWBOX} role="img" aria-label={site.logoAlt}>
            {/* The CSS rise is on a <g>: on the path itself it would replace the art's y-flip. */}
            {MARK_LETTERS.map((p, k) => (
              <g key={k} className={styles.letter} style={{ '--i': ORDER[k] } as CSSProperties}>
                <path transform={p.transform} d={p.d} />
              </g>
            ))}
            {MARK_ACCENTS.map((p, i) => (
              <g key={i} className={styles.accent} style={{ '--i': 4 + i } as CSSProperties}>
                <path transform={p.transform} d={p.d} />
              </g>
            ))}
            <g className={styles.word}>
              {LOCKUP_WORD.map((p, k) => (
                <path key={k} transform={p.transform} d={p.d} />
              ))}
            </g>
          </svg>
        </h1>
        <div className={styles.copy}>
          <p className={styles.lede}>{brief.home.paragraph}</p>
          <p className={styles.buttons}>
            <Link href={site.cta.work.href} prefetch={false} className={styles.work}>{site.cta.work.label}</Link>
            <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
          </p>
        </div>
        <ul className={styles.chapters} aria-label="Fire områder">
          {HOME_ORDER.map((c, i) => (
            <li key={c.key} style={{ '--i': i } as CSSProperties}>
              <button type="button" className={styles.chapter} aria-pressed={i === ch.active} onClick={() => ch.choose(i)}>
                <span className={styles.track}>
                  <span ref={ch.bar(i)} className={styles.fill} />
                </span>
                <span className={styles.name}>{c.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
