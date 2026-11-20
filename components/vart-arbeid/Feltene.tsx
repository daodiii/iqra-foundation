'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Lines } from '@/components/forside/Lines';
import forside from '@/components/forside/forside.module.css';
import styles from './feltene.module.css';

export type Area = { id: string; title: string; text: string; note?: string };

/** Each field's place in the wall (the first 4×2), its colour and its delay, in the mock's order. */
const FIELDS: { cls: string; bg: string; d: number }[] = [
  { cls: styles.a, bg: 'var(--navy)', d: 0 },
  { cls: styles.b, bg: 'var(--rod)', d: 0.1 },
  { cls: styles.c, bg: 'var(--teal)', d: 0.2 },
  { cls: `${styles.d} ${styles.pale}`, bg: 'var(--teal-pale)', d: 0 },
  { cls: styles.e, bg: 'var(--navy-deep)', d: 0.1 },
  { cls: `${styles.ff} ${styles.pale} ${styles.line}`, bg: '#fff', d: 0.2 },
  { cls: styles.g, bg: 'var(--rod)', d: 0 },
];

/**
 * Every heading must sit inside its field, long compounds («kompetanseutvikling»,
 * «Kunnskapsformidling») included: lower the field's --z until the heading no longer overflows
 * its width. The mock's guarantee; the height takes care of itself, as a field grows with its text.
 */
function fit(grid: HTMLElement) {
  grid.querySelectorAll<HTMLElement>('[data-field]').forEach((f) => {
    const h = f.querySelector('h2');
    if (!h) return;
    let z = 1;
    f.style.setProperty('--z', '1');
    while ((h.scrollWidth > h.clientWidth + 1 || f.scrollWidth > f.clientWidth + 1) && z > 0.5) {
      z -= 0.02;
      f.style.setProperty('--z', z.toFixed(2));
    }
  });
}

/**
 * Vårt arbeid (11 «Feltene»): the title and intro on a navy screen, then the seven areas as colour
 * fields of mixed size on white, each rising in as it is reached. With JavaScript off, or with
 * reduced motion, everything simply stands.
 */
export function Feltene({ title, intro, areas }: { title: string; intro: string; areas: Area[] }) {
  const [heroOn, setHeroOn] = useState(false);
  const [inn, setInn] = useState<boolean[]>(() => areas.map(() => false));
  const grid = useRef<HTMLDivElement>(null);

  // The title rises line by line and the intro follows, once the lines are measured.
  useEffect(() => {
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setHeroOn(true));
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, []);

  // Each field rises into place the first time it is reached.
  useEffect(() => {
    const g = grid.current;
    if (!g) return;
    const fields = Array.from(g.querySelectorAll<HTMLElement>('[data-field]'));
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          const i = fields.indexOf(e.target as HTMLElement);
          io.unobserve(e.target);
          setInn((prev) => (prev[i] ? prev : prev.map((v, j) => v || j === i)));
        }),
      { threshold: 0.18 },
    );
    fields.forEach((f) => io.observe(f));
    return () => io.disconnect();
  }, []);

  // Fit the headings now, when the font lands and whenever the wall changes width.
  useLayoutEffect(() => {
    const g = grid.current;
    if (!g) return;
    const again = () => fit(g);
    again();
    let w0 = g.getBoundingClientRect().width;
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(([e]) => {
            if (Math.abs(e.contentRect.width - w0) > 1) {
              w0 = e.contentRect.width;
              again();
            }
          })
        : null;
    ro?.observe(g);
    document.fonts?.ready.then(again);
    document.fonts?.addEventListener?.('loadingdone', again);
    return () => {
      ro?.disconnect();
      document.fonts?.removeEventListener?.('loadingdone', again);
    };
  }, []);

  return (
    <>
      <section className={`${styles.hero} ${forside.pad}`} aria-labelledby="arbeid-tittel">
        <Lines as="h1" id="arbeid-tittel" className={styles.h1} text={title} on={heroOn} />
        <p className={styles.intro} data-on={heroOn ? '' : undefined}>
          {intro}
        </p>
      </section>
      <div className={`${styles.wrap} ${forside.pad}`}>
        <div ref={grid} className={styles.grid}>
          {areas.map((a, i) => {
            const f = FIELDS[i % FIELDS.length];
            return (
              <section
                key={a.id}
                id={a.id}
                aria-labelledby={`${a.id}-tittel`}
                className={`${styles.f} ${f.cls}`}
                style={{ '--tb': f.bg, '--d': `${f.d}s` } as CSSProperties}
                data-field=""
                data-in={inn[i] ? '' : undefined}
              >
                <h2 id={`${a.id}-tittel`}>{a.title}</h2>
                <div>
                  <p>{a.text}</p>
                  {a.note && <p className={styles.note}>{a.note}</p>}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
