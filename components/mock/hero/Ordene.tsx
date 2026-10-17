'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { brief } from '@/content/brief.no';
import styles from './ordene.module.css';
import { Hybrid } from './Hybrid';

/** Four rows of the red thread's line, each drifting at its own pace, every other one the other way. */
const ROWS = [
  { secs: 150, from: -0.08 },
  { secs: 190, from: -0.41 },
  { secs: 170, from: -0.23 },
  { secs: 210, from: -0.66 },
];

/** The words, tone on tone in the sky; they rest while the hero is off the screen. */
function Words() {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const b = box.current;
    if (!b || typeof IntersectionObserver !== 'function') return;
    const io = new IntersectionObserver(([e]) => b.toggleAttribute('data-off', !e.isIntersecting));
    io.observe(b);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={box} className={styles.words} aria-hidden="true">
      {ROWS.map((r, k) => (
        <div key={k} className={styles.row} style={{ '--k': k } as CSSProperties}>
          <div className={styles.track} style={{ '--secs': `${r.secs}s`, '--from': r.from } as CSSProperties} data-back={k % 2 ? '' : undefined}>
            <span>{brief.thread.line}</span>
            <span>{brief.thread.line}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * MOCK 17 Ordene. 15 on 14's sky, with the foundation's own words as the ground: the red thread's
 * line — «Kunnskap. Dialog. Møteplasser. Samfunnsdeltakelse.» — set as large as four rows fill the
 * hero, tone on tone in the sky's colour (a breath lighter at night, a breath darker by day), each
 * row drifting sideways at its own slow pace, every other one the other way. A texture you read
 * only when you look for it; the name and the paragraph stand on it in full contrast.
 */
export function Ordene() {
  return <Hybrid className={styles.ordene} ground={<Words />} />;
}
