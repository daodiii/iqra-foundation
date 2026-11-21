'use client';

import { useEffect, useRef, useState } from 'react';
import { klient } from '@/content/klient.no';
import { clamp, onScrollFrame, pageTop, progress } from './frame';
import { Lines } from './Lines';
import f from './forside.module.css';
import styles from './spor.module.css';

const c = klient.home.create;
const CARDS = [styles.c1, styles.c2, styles.c3];

/** The three icons, on a 120 grid: Læring (arcs spreading from the dot), Engasjement (rising steps), Samarbeid (three circles). */
function Icon({ n }: { n: number }) {
  const s = (j: number) => ({ '--j': j }) as React.CSSProperties;
  return (
    <svg className={styles.ik} viewBox="0 0 120 120" aria-hidden="true" focusable="false" data-ikon>
      {n === 0 && (
        <>
          <path className={styles.s} pathLength={1} style={s(0)} d="M38 102A18 18 0 0 0 20 84" />
          <path className={styles.s} pathLength={1} style={s(1)} d="M54 102A34 34 0 0 0 20 68" />
          <path className={styles.s} pathLength={1} style={s(2)} d="M70 102A50 50 0 0 0 20 52" />
          <path className={styles.s} pathLength={1} style={s(3)} d="M86 102A66 66 0 0 0 20 36" />
          <path className={styles.s} pathLength={1} style={s(4)} d="M102 102A82 82 0 0 0 20 20" />
          <circle className={styles.d} cx="20" cy="102" r="5" />
        </>
      )}
      {n === 1 && (
        <>
          <path className={styles.s} pathLength={1} style={s(0)} d="M14 102H38V80H62V58H86V36H106" />
          <circle className={styles.d} cx="106" cy="22" r="5" />
        </>
      )}
      {n === 2 && (
        <>
          <circle className={styles.s} pathLength={1} style={s(0)} cx="46" cy="46" r="28" />
          <circle className={styles.s} pathLength={1} style={s(2)} cx="74" cy="46" r="28" />
          <circle className={styles.s} pathLength={1} style={s(4)} cx="60" cy="70" r="28" />
          <circle className={styles.d} cx="60" cy="54" r="5" />
        </>
      )}
    </svg>
  );
}

/** «Dette ønsker vi å skape», Sporet: the track moves sideways with the scroll, exactly; a panel opens as it comes in. */
export function Spor() {
  const spor = useRef<HTMLDivElement>(null);
  const trk = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState([false, false, false, false]);

  useEffect(() => {
    const el = spor.current;
    const track = trk.current;
    if (!el || !track) return;
    const panels = Array.from(track.children) as HTMLElement[];
    const stage = track.parentElement as HTMLElement;
    let shown = '';
    return onScrollFrame(el, () => {
      const H = stage.clientHeight;
      const W = window.innerWidth;
      const r = el.getBoundingClientRect();
      if (!H || r.height <= H) return;
      const k = progress(el, H);
      const max = track.scrollWidth - W;
      track.style.transform = `translateX(${(-k * max).toFixed(1)}px)`;
      const vis = r.top < H * 0.5 && r.bottom > H * 0.5;
      const now = panels.map((p) => {
        const pr = p.getBoundingClientRect();
        const ik = p.querySelector<SVGElement>('[data-ikon]');
        if (ik) ik.style.transform = `translateX(${((pr.left + pr.width / 2 - W / 2) * -0.08).toFixed(1)}px)`;
        return vis && pr.left < W * 0.8;
      });
      const key = now.map(Number).join('');
      if (key !== shown) {
        shown = key;
        setOn(now);
      }
    });
  }, []);

  return (
    <section id="skape" className={`${f.layer} ${f.layerIn}`} style={{ zIndex: 2 }} aria-labelledby="skape-tittel" data-lag="spor">
      <div ref={spor} className={styles.spor} data-spor>
        <div className={styles.stg}>
          <div ref={trk} className={styles.trk} data-trk>
            <div className={styles.p0}>
              <Lines as="h2" id="skape-tittel" text={c.title} on={on[0]} />
              <Lines className={styles.ingress} text={c.intro} on={on[0]} delay={150} />
            </div>
            {c.areas.map((a, i) => (
              <article key={a.title} className={`${styles.cd} ${CARDS[i]}`} data-on={on[i + 1] ? '' : undefined}>
                <Icon n={i} />
                <Lines as="h3" text={a.title} on={on[i + 1]} />
                <Lines className={styles.txt} text={a.text} on={on[i + 1]} delay={150} />
              </article>
            ))}
          </div>
        </div>
      </div>
      <i className={f.shade} aria-hidden="true" data-shade />
    </section>
  );
}

/**
 * The beats of Sporet (Takt.tsx), as page offsets. On a wide screen two parts stand whole side by
 * side at every rest (the intro and the first panel, then the first and second, then the last two):
 * a part's beat is where its left edge meets the page's margin. On a phone one panel stands whole in
 * the middle. The first beat is the section's top, the last its foot; beats that coincide merge.
 */
export function sporStops(el: HTMLElement): number[] {
  const track = el.querySelector<HTMLElement>('[data-trk]');
  const stage = track?.parentElement;
  if (!track || !stage) return [];
  const W = window.innerWidth;
  const H = stage.clientHeight;
  const top = pageTop(el);
  const travel = el.offsetHeight - H;
  const max = track.scrollWidth - W;
  if (travel <= 0 || max <= 0) return [];
  const parts = Array.from(track.children) as HTMLElement[];
  const pairs = !window.matchMedia('(max-width: 900px)').matches;
  const margin = parts[0]?.offsetLeft ?? 0;
  return parts.map((p) => top + clamp((pairs ? p.offsetLeft - margin : p.offsetLeft + p.offsetWidth / 2 - W / 2) / max) * travel);
}
