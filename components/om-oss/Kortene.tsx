'use client';

import { useEffect, useRef, useState } from 'react';
import { klient } from '@/content/klient.no';
import { clamp, eo, onScrollFrame, progress } from '@/components/forside/frame';
import { Lines } from '@/components/forside/Lines';
import f from '@/components/forside/forside.module.css';
import styles from './kortene.module.css';

const t = klient.about;

/** The smallest a card's sizes may go (the mock's floor). */
const ZMIN = 0.5;

/**
 * Every size in a card is a multiple of `--z`: lower it until the card's content fits its box, in
 * height and in width, and until no heading's longest word runs past its own box. Read in the
 * card's own layout (the scale on the card does not change scroll sizes).
 */
export function fit(box: HTMLElement) {
  const over = () =>
    box.scrollHeight > box.clientHeight + 1 ||
    box.scrollWidth > box.clientWidth + 1 ||
    Array.from(box.querySelectorAll<HTMLElement>('h2, b')).some((h) => h.scrollWidth > h.clientWidth + 1);
  let z = 1;
  box.style.setProperty('--z', '1');
  while (over() && z > ZMIN) {
    z = Math.max(ZMIN, z - 0.02);
    box.style.setProperty('--z', z.toFixed(2));
  }
  box.dataset.z = z.toFixed(2);
}

/**
 * Where the track stands at progress `k`: between whole cards it rests, then eases on to the next
 * (the mock's step: the move takes the middle 60% of each card's share of the scroll).
 */
export function stepAt(k: number, n: number): number {
  const raw = clamp(k) * (n - 1);
  const i = Math.floor(raw);
  return Math.min(n - 1, i + eo(clamp((raw - i - 0.2) / 0.6)));
}

/**
 * Om Iqra Foundation, «Kortene» (mock 8, the owner's pick of 2026-11-20): the title and the intro
 * on navy-deep, then the screen holds while the parts pass sideways as cards, the neighbours
 * peeking in dimmed with their text put away, a thin line for how far along. «Navnet Iqra» is
 * left out by the owner. Without JavaScript or with reduced motion the cards stand stacked.
 */
export function Kortene() {
  const pin = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  // the title rises and the intro fades in once the page is painted
  useEffect(() => {
    let b = 0;
    const a = requestAnimationFrame(() => (b = requestAnimationFrame(() => setOn(true))));
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, []);

  useEffect(() => {
    const el = pin.current;
    const track = el?.querySelector<HTMLElement>('[data-track]');
    const line = el?.querySelector<HTMLElement>('[data-line]');
    if (!el || !track || !line) return;
    const stage = track.parentElement as HTMLElement;
    const cards = Array.from(track.children) as HTMLElement[];
    const boxes = cards.map((c) => c.firstElementChild as HTMLElement);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let size = '';

    const clear = () => {
      track.style.transform = '';
      track.style.removeProperty('--cw');
      cards.forEach((c, j) => {
        c.style.removeProperty('--o');
        c.style.removeProperty('--s');
        boxes[j].style.opacity = '';
      });
    };

    const tick = () => {
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      if (!W || !H) return;
      // stacked (reduced motion): nothing moves, but every heading's longest word must still fit
      if (reduce.matches) {
        if (`${W}x${H}` !== size) {
          size = `${W}x${H}`;
          boxes.forEach(fit);
        }
        return;
      }
      const cw = W <= 900 ? W - 40 : Math.min(1240, Math.round(W * 0.84));
      const now = `${W}x${H}`;
      if (now !== size) {
        size = now;
        track.style.setProperty('--cw', `${cw}px`);
        boxes.forEach(fit);
      }
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const n = cards.length;
      const s = stepAt(progress(el, H), n);
      line.style.setProperty('--f', (s / (n - 1)).toFixed(4));
      track.style.transform = `translate3d(${((W - cw) / 2 - s * (cw + gap)).toFixed(1)}px,0,0)`;
      cards.forEach((c, j) => {
        const d = Math.min(1, Math.abs(j - s));
        c.style.setProperty('--o', (1 - d * 0.55).toFixed(3));
        c.style.setProperty('--s', (1 - d * 0.04).toFixed(4));
        boxes[j].style.opacity = (1 - Math.min(1, d * 1.6)).toFixed(3);
      });
    };

    // fit again once the web font has landed, and when motion is turned on or off
    const again = () => {
      size = '';
      if (reduce.matches) clear();
      tick();
    };
    document.fonts?.ready.then(again);
    reduce.addEventListener?.('change', again);
    const stop = onScrollFrame(el, tick);
    return () => {
      stop();
      reduce.removeEventListener?.('change', again);
    };
  }, []);

  return (
    <>
      <section className={`${styles.hero} ${f.pad}`} aria-labelledby="om-tittel">
        <Lines as="h1" id="om-tittel" className={styles.h1} text={t.title} on={on} />
        <p className={styles.intro} data-in={on ? '' : undefined}>
          {t.intro}
        </p>
      </section>

      <div ref={pin} className={styles.pin} data-kortene>
        <div className={styles.stage}>
          <div className={styles.track} data-track>
            <section className={card(styles.light)} aria-labelledby="om-formal" data-part="purpose">
              <div className={styles.fit}>
                <div className={styles.l}>
                  <h2 id="om-formal">{t.purpose.title}</h2>
                  <p className={styles.lead}>{t.purpose.lead}</p>
                </div>
                <ul className={`${styles.r} ${styles.list}`}>
                  {t.purpose.points.map((p) => (
                    <li key={p}>
                      <p className={styles.aim}>{p}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className={card(styles.rod)} aria-labelledby="om-verdier" data-part="values">
              <div className={styles.fit}>
                <div className={styles.l}>
                  <h2 id="om-verdier">{t.values.title}</h2>
                  <p className={styles.lead}>{t.values.lead}</p>
                </div>
                <div className={styles.r}>
                  <ul className={`${styles.list} ${styles.v}`}>
                    {t.values.points.map((v) => (
                      <li key={v.name}>
                        <b>{v.name}</b>
                        <span>{v.text}</span>
                      </li>
                    ))}
                  </ul>
                  <p className={styles.close}>{t.values.close}</p>
                </div>
              </div>
            </section>

            <section className={card(styles.teal)} aria-labelledby="om-hvem" data-part="audience">
              <div className={styles.fit}>
                <div className={styles.l}>
                  <h2 id="om-hvem">{t.audience.title}</h2>
                </div>
                <p className={`${styles.r} ${styles.state}`}>{t.audience.text}</p>
              </div>
            </section>

            <section className={card(`${styles.navy} ${styles.ind}`)} aria-labelledby="om-stiftelse" data-part="independent">
              <div className={styles.fit}>
                <div className={styles.l}>
                  <h2 id="om-stiftelse">{t.independent.title}</h2>
                </div>
                <div className={`${styles.r} ${styles.two}`}>
                  {t.independent.paragraphs.map((p) => (
                    <p key={p.slice(0, 24)}>{p}</p>
                  ))}
                </div>
              </div>
            </section>
          </div>
          <div className={styles.line} aria-hidden="true" data-line>
            <i />
          </div>
        </div>
      </div>
    </>
  );
}

const card = (more: string) => `${styles.card} ${more}`;
