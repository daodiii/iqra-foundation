'use client';

import Link from 'next/link';
import { Fragment, useEffect, useRef, type CSSProperties } from 'react';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import styles from './lesningen.module.css';

/** The paragraph's four area words and their shots (public/mock/hero, see chapters.tsx). */
const SHOT: Record<string, string> = {
  kunnskap: 'kunnskap',
  møteplasser: 'moteplasser',
  dialog: 'dialog',
  samfunnsdeltakelse: 'samfunnsdeltakelse',
};

/** The brief's paragraph, word by word, untouched: an area word keeps its comma or full stop outside its window. */
const WORDS = brief.home.paragraph.split(' ').map((w, k) => {
  const m = w.match(/^(.*?)([.,]?)$/)!;
  return { k, w, core: m[1], punct: m[2], shot: SHOT[m[1].toLowerCase()] as string | undefined };
});

/** One word every 95 ms, from 300 ms. */
const at = (k: number) => 300 + k * 95;

/**
 * MOCK 5 Lesningen. «Iqra» is «les!» — so the first screen is read. The brief's paragraph is the
 * hero, set large across the screen, and it reads itself: the words come up from a faint print one
 * after another at a reading pace, and as each of the four area words is reached it becomes a
 * window with its own shot in the letters, which then play one after another once it is read (the scholar in «kunnskap», the courtyard in
 * «møteplasser», the ring in «dialog», the young circle in «samfunnsdeltakelse»). A pointer on one
 * plays it again. The logo is in the header; the two buttons at the foot.
 */
export function Lesningen() {
  const hero = useRef<HTMLElement>(null);
  const vids = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    const section = hero.current;
    if (!section) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.setAttribute('data-in', '');
    if (reduced) return;
    const webm = document.createElement('video').canPlayType('video/webm; codecs="vp9"') !== '';
    // Read, a word shows its shot's still; once the whole paragraph is read the four play one after
    // another, in reading order. One at a time: four decoding together held the page to 30 fps.
    const queue = WORDS.flatMap(({ shot }) => (shot && vids.current[shot] ? [vids.current[shot]!] : []));
    queue.forEach((v, i) => {
      v.muted = true;
      v.src = `/mock/hero/${WORDS.filter((w) => w.shot)[i].shot}-640.${webm ? 'webm' : 'mp4'}`;
      v.preload = 'auto';
      v.load();
    });
    const next = (i: number) => {
      const v = queue[i];
      if (!v) return;
      v.addEventListener('ended', () => next(i + 1), { once: true });
      Promise.resolve(v.play()).catch(() => {});
    };
    const start = window.setTimeout(() => next(0), at(WORDS.length - 1) + 500);
    return () => window.clearTimeout(start);
  }, []);

  const replay = (shot: string) => {
    const v = vids.current[shot];
    if (!v || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    v.currentTime = 0;
    Promise.resolve(v.play()).catch(() => {});
  };

  return (
    <section ref={hero} className={styles.hero} aria-labelledby="lesning-tittel">
      <h1 id="lesning-tittel" className={styles.hidden}>{site.logoAlt}</h1>
      <p className={styles.manifesto}>
        {WORDS.map(({ k, w, core, punct, shot }) =>
          shot ? (
            <Fragment key={k}>
              <span
                className={styles.win}
                data-shot={shot}
                style={{ '--k': k } as CSSProperties}
                onPointerEnter={() => replay(shot)}
                onClick={() => replay(shot)}
              >
                <span className={styles.plain}>{core}</span>
                <span className={styles.film} aria-hidden="true">
                  <video
                    ref={(el) => {
                      vids.current[shot] = el;
                    }}
                    poster={`/mock/hero/${shot}.webp`}
                    muted
                    playsInline
                    preload="none"
                  />
                  <span className={styles.ink}>{core}</span>
                </span>
              </span>
              {punct}{' '}
            </Fragment>
          ) : (
            <Fragment key={k}>
              <span className={styles.w} style={{ '--k': k } as CSSProperties}>{w}</span>{' '}
            </Fragment>
          ),
        )}
      </p>
      <div className={styles.foot}>
        <Link href={site.cta.work.href} prefetch={false} className={styles.work}>{site.cta.work.label}</Link>
        <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
      </div>
    </section>
  );
}
