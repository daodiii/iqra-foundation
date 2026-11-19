'use client';

import { useEffect, useRef, useState } from 'react';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import { eio, onFrame, progress, reducedMotion } from './frame';
import { Knapp } from './Knapp';
import f from './forside.module.css';
import styles from './samlet.module.css';

const s = klient.home.together;
/** Where each word starts: across (vw), down (vh), turned (deg). Six words, six places. */
const SCATTER = [
  [-38, -34, -14],
  [42, -40, 12],
  [-46, 20, 10],
  [30, 34, -16],
  [-12, 46, 18],
  [48, 10, -8],
];

/** The finale, Samlet: the title's words gather as the page scrolls, exactly; then the text and the buttons. */
export function Samlet() {
  const sa = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = sa.current;
    if (!el) return;
    const words = Array.from(el.querySelectorAll<HTMLElement>('[data-w]'));
    const reduce = reducedMotion();
    let shown = false;
    return onFrame(() => {
      const k = reduce ? 1 : progress(el);
      words.forEach((w, i) => {
        const g = eio(k / 0.55 - i * 0.06);
        const p = SCATTER[i % SCATTER.length];
        w.style.transform = `translate(${((1 - g) * p[0]).toFixed(2)}vw,${((1 - g) * p[1]).toFixed(2)}vh) rotate(${((1 - g) * p[2]).toFixed(2)}deg) scale(${(1 + (1 - g) * 0.25).toFixed(3)})`;
        w.style.opacity = (0.18 + 0.82 * g).toFixed(3);
      });
      const now = k > 0.62;
      if (now !== shown) {
        shown = now;
        setOn(now);
      }
    });
  }, []);

  return (
    <section id="sammen" className={`${f.layer} ${f.layerIn} ${f.layerOut}`} style={{ zIndex: 5 }} aria-labelledby="sammen-tittel" data-lag="samlet">
      <div ref={sa} className={styles.sa}>
        <div className={styles.stg}>
          <h2 id="sammen-tittel" className={styles.h2}>
            {s.title.split(' ').map((w, i) => (
              <span key={i}>
                {i > 0 && ' '}
                <span className={styles.w} data-w>
                  {w}
                </span>
              </span>
            ))}
          </h2>
          <div className={styles.bot} data-on={on ? '' : undefined}>
            <p className={`${styles.say} ${styles.up}`}>{s.text}</p>
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
    </section>
  );
}
