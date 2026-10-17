'use client';

import Link from 'next/link';
import { Fragment, useEffect, useRef } from 'react';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { ChapterFilm, HEADLINE_ORDER, useChapters } from './chapters';
import styles from './soylen.module.css';

/** The headline cut at its four area words (the brief's own, untouched), each word's chapter index or -1. */
const WORDS = HEADLINE_ORDER.map((c) => c.name.toLowerCase());
const PARTS = brief.home.headline
  .split(new RegExp(`(${WORDS.join('|')})`))
  .filter(Boolean)
  .map((text) => ({ text, i: WORDS.indexOf(text), tail: '' }));
// A comma after a word goes with it, so a line never starts with one.
for (let k = 0; k < PARTS.length - 1; k++) {
  const next = PARTS[k + 1];
  if (PARTS[k].i >= 0 && next.i < 0 && /^[,.]/.test(next.text)) {
    PARTS[k].tail = next.text[0];
    next.text = next.text.slice(1);
  }
}

/**
 * MOCK 2 Søylen. The logo's i, as tall as the screen: the crimson dot over a window as wide as
 * the dot (the guide's proportions: dot and stem the same width, a quarter of it between), the
 * film playing in the stem. Beside it the brief's headline, large, whose four area words are the
 * film's chapters: each is underlined in crimson as its shot plays, and a tap on one plays it. The
 * paragraph and the two buttons under the headline. The full logo is in the header.
 * Arrival: the window opens upward, the dot drops onto it, the words rise.
 */
export function Soylen() {
  const ch = useChapters(HEADLINE_ORDER, 700);
  const hero = useRef<HTMLElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => hero.current?.setAttribute('data-in', ''));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section ref={hero} className={styles.hero} aria-labelledby="soylen-tittel">
      <div className={styles.pillar} aria-hidden="true">
        <span className={styles.dot} />
        <div className={styles.stem}>
          <ChapterFilm chapters={HEADLINE_ORDER} active={ch.active} video={ch.video} className={styles.film} />
        </div>
      </div>
      <div className={styles.text}>
        <h1 id="soylen-tittel" className={styles.title}>
          {PARTS.map((p, k) =>
            p.i < 0 ? (
              <Fragment key={k}>{p.text}</Fragment>
            ) : (
              <span key={k} className={styles.keep}>
                <button
                  type="button"
                  className={styles.word}
                  aria-pressed={p.i === ch.active}
                  onClick={() => ch.choose(p.i)}
                >
                  {p.text}
                  <span ref={ch.bar(p.i)} className={styles.bar} aria-hidden="true" />
                </button>
                {p.tail}
              </span>
            ),
          )}
        </h1>
        <div className={styles.foot}>
          <p className={styles.lede}>{brief.home.paragraph}</p>
          <p className={styles.buttons}>
            <Link href={site.cta.work.href} prefetch={false} className={styles.work}>{site.cta.work.label}</Link>
            <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
