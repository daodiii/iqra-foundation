'use client';

import { useEffect, useRef, useState } from 'react';
import { klient } from '@/content/klient.no';
import { scrollToY } from '@/lib/smooth';
import { onScrollFrame } from './frame';
import f from './forside.module.css';
import styles from './trinn.module.css';

const a = klient.home.action;

/** The part whose middle is nearest the middle of the screen, among those on screen; -1 for none. */
export function nearest(rects: { top: number; bottom: number }[], H: number): number {
  let best = -1;
  let bd = Infinity;
  rects.forEach((r, i) => {
    const d = Math.abs((r.top + r.bottom) / 2 - H * 0.5);
    if (r.bottom > 0 && r.top < H && d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}

/** «Fra kunnskap til handling», Trinnene: the index follows the reading; a click in it brings that part to the middle. */
export function Trinn() {
  const items = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState(-1);

  useEffect(() => {
    const el = items.current;
    if (!el) return;
    const its = Array.from(el.children) as HTMLElement[];
    let shown = -2;
    // the parts arrive one after another: each rises in as it comes onto the screen, and parts that
    // arrive together (a tall screen, a fast scroll) follow each other 220 ms apart
    const root = el.closest('section');
    const io = new IntersectionObserver(
      (es) => {
        let n = 0;
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          const t = e.target as HTMLElement;
          t.style.setProperty('--d', `${n++ * 220}ms`);
          t.dataset.in = '';
          io.unobserve(t);
        });
      },
      { rootMargin: '0px 0px -18% 0px' },
    );
    root?.querySelectorAll('[data-rv]').forEach((n) => io.observe(n));
    const stop = onScrollFrame(el, () => {
      const best = nearest(
        its.map((it) => it.getBoundingClientRect()),
        window.innerHeight,
      );
      if (best !== shown) {
        shown = best;
        setCur(best);
      }
    });
    return () => {
      io.disconnect();
      stop();
    };
  }, []);

  const go = (i: number) => {
    const it = items.current?.children[i];
    if (!it) return;
    const r = it.getBoundingClientRect();
    scrollToY(window.scrollY + r.top + r.height / 2 - window.innerHeight / 2);
  };

  return (
    <section id="handling" className={`${styles.tr} ${f.layer} ${f.layerIn}`} style={{ zIndex: 3 }} aria-labelledby="handling-tittel" data-lag="trinn">
      <div className={styles.g}>
        <div className={styles.lh}>
          <h2 id="handling-tittel" className={styles.rv} data-rv>
            {a.title}
          </h2>
          <ul className={styles.idx}>
            {a.items.map((it, i) => (
              <li key={it.title}>
                <button type="button" aria-current={cur === i ? 'true' : 'false'} onClick={() => go(i)}>
                  {it.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div ref={items} className={styles.items}>
          {a.items.map((it, i) => (
            <article key={it.title} className={styles.it} data-on={cur === i ? '' : undefined}>
              <div className={styles.rv} data-rv>
                <h3>{it.title}</h3>
                <p className={styles.txt}>{it.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <i className={f.shade} aria-hidden="true" data-shade />
    </section>
  );
}
