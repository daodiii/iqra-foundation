'use client';

import { useEffect, useRef, useState } from 'react';
import { useCopy } from '@/components/site/Lang';
import { reducedMotion } from './frame';
import { Knapp } from './Knapp';
import { Lines } from './Lines';
import f from './forside.module.css';
import styles from './samlet.module.css';

/** Where each word starts: across (vw), down (vh), turned (deg). Six words, six places. */
const SCATTER = [
  [-38, -34, -14],
  [42, -40, 12],
  [-46, 20, 10],
  [30, 34, -16],
  [-12, 46, 18],
  [48, 10, -8],
];

/**
 * The finale, Samlet: a signature moment played whole. When the crimson screen is well onto the
 * screen, the title's words fly in from scattered places and gather into the sentence (on a clock,
 * one after another), then the text and the buttons rise. It plays once and then stands; nothing
 * here is half way while the reader scrolls.
 */
export function Samlet() {
  const { klient, site } = useCopy();
  const s = klient.home.together;
  const sa = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = sa.current;
    if (!el) return;
    // under reduced motion the CSS stands everything as it is, so there is nothing to play
    if (reducedMotion() || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setOn(true);
        io.disconnect();
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="sammen" className={`${f.layer} ${f.layerIn}`} style={{ zIndex: 5 }} aria-labelledby="sammen-tittel" data-lag="samlet">
      <div ref={sa} className={styles.sa} data-on={on ? '' : undefined}>
        <div className={styles.stg}>
          <h2 id="sammen-tittel" className={styles.h2}>
            {s.title.split(' ').map((w, i) => {
              const p = SCATTER[i % SCATTER.length];
              return (
                <span key={i}>
                  {i > 0 && ' '}
                  <span className={styles.w} style={{ '--x': `${p[0]}vw`, '--y': `${p[1]}vh`, '--r': `${p[2]}deg`, '--i': i } as React.CSSProperties} data-w>
                    {w}
                  </span>
                </span>
              );
            })}
          </h2>
          <div className={styles.bot}>
            <Lines className={styles.say} text={s.text} on={on} delay={950} />
            <div className={`${styles.cta} ${styles.up} ${styles.d1}`}>
              <Knapp href={site.cta.partner.href} kind="fill" className={styles.b1}>
                {site.cta.partner.label}
              </Knapp>
              <Knapp href={site.cta.support.href} kind="edge" className={styles.b2}>
                {site.cta.support.label}
              </Knapp>
            </div>
          </div>
        </div>
      </div>
      <i className={f.shade} aria-hidden="true" data-shade />
    </section>
  );
}
