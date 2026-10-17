'use client';

import Link from 'next/link';
import { useEffect, useRef, type CSSProperties } from 'react';
import { LOCKUP_VIEWBOX, LOCKUP_WORD } from '@/components/home/lockup';
import { MARK_ACCENTS, MARK_LETTERS } from '@/components/home/mark';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { HOME_ORDER, useChapters } from './chapters';
import styles from './firevinduer.module.css';

/** Each area's first sentence, from the brief. */
const FIRST = Object.fromEntries(brief.areas.map((a) => [a.key, a.text.split('. ')[0] + '.']));

/**
 * MOCK 6 Fire vinduer. The four areas are the first screen: four film panels side by side under the
 * navy header, each with its own shot, held in navy until it is the one in view. The run goes once
 * through them (each panel opens wide, plays its shot in colour, its first sentence from the brief
 * comes up, its bar fills); then a pointer opens any of them, a tap on a phone. Under the panels a
 * navy band: the guide's lockup reversed, the paragraph, the two buttons.
 */
export function FireVinduer() {
  const ch = useChapters(HOME_ORDER, 900);
  const hero = useRef<HTMLElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => hero.current?.setAttribute('data-in', ''));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section ref={hero} className={styles.hero} aria-labelledby="hovedtekst" data-header="dark">
      <ul className={styles.panels} aria-label="Fire områder">
        {HOME_ORDER.map((c, i) => (
          <li key={c.key} className={styles.slot} data-open={i === ch.active ? '' : undefined} style={{ '--i': i } as CSSProperties}>
            <button
              type="button"
              className={styles.panel}
              aria-pressed={i === ch.active}
              onPointerEnter={(e) => {
                if (e.pointerType !== 'touch' && i !== ch.active) ch.choose(i);
              }}
              onClick={() => ch.choose(i)}
            >
              <video ref={ch.video(i)} className={styles.video} poster={`${c.src}.webp`} muted playsInline preload="none" aria-hidden="true" />
              <span className={styles.tint} aria-hidden="true" />
              <span className={styles.scrim} aria-hidden="true" />
              <span className={styles.label}>
                <span className={styles.name}>{c.name}</span>
                <span className={styles.text}>{FIRST[c.key]}</span>
                <span className={styles.track} aria-hidden="true">
                  <span ref={ch.bar(i)} className={styles.fill} />
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
