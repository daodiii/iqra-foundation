'use client';

import { useEffect, useRef, useState } from 'react';
import { klient } from '@/content/klient.no';
import { clamp, onScrollFrame, progress, reducedMotion } from './frame';
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

/**
 * Where a swipe through the panels settles, on a touch screen (the owner, 2026-11-20): the next panel
 * stop in the direction the page was moving, so no panel rests half on screen. At the section's two
 * ends, or with no stop ahead, it stays where it is, so the reader can always swipe on out.
 * `stops` are page offsets, ascending; returns the offset to go to, or null to stay.
 */
export function snapTarget(y: number, from: number, stops: number[], top: number, travel: number): number | null {
  if (y <= top + 2 || y >= top + travel - 2) return null;
  const dir = Math.sign(y - from);
  if (!dir) return null;
  const ahead = dir > 0 ? stops.find((s) => s > y + 1) : [...stops].reverse().find((s) => s < y - 1);
  return ahead === undefined ? null : ahead;
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
    const stopSettling = settle(el, track, panels, stage);
    const stopFrames = onScrollFrame(el, () => {
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
    return () => {
      stopFrames();
      stopSettling();
    };
  }, []);

  return (
    <section id="skape" className={`${f.layer} ${f.layerIn}`} style={{ zIndex: 2 }} aria-labelledby="skape-tittel" data-lag="spor">
      <div ref={spor} className={styles.spor}>
        <div className={styles.stg}>
          <div ref={trk} className={styles.trk}>
            <div className={styles.p0}>
              <Lines as="h2" id="skape-tittel" text={c.title} on={on[0]} />
              <Lines className={styles.ingress} text={c.intro} on={on[0]} />
            </div>
            {c.areas.map((a, i) => (
              <article key={a.title} className={`${styles.cd} ${CARDS[i]}`} data-on={on[i + 1] ? '' : undefined}>
                <Icon n={i} />
                <Lines as="h3" text={a.title} on={on[i + 1]} />
                <p className={styles.txt}>{a.text}</p>
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
 * On a touch screen, once a swipe (and its fling) has come to rest inside the panels, glide on to the
 * next panel in that direction (`snapTarget`). A panel's stop is where its middle meets the screen's.
 */
function settle(el: HTMLElement, track: HTMLElement, panels: HTMLElement[], stage: HTMLElement): () => void {
  if (!window.matchMedia('(pointer: coarse)').matches || reducedMotion()) return () => {};
  let from = window.scrollY;
  let finger = false;
  let timer = 0;
  const stops = () => {
    const W = window.innerWidth;
    const H = stage.clientHeight;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - H;
    const max = track.scrollWidth - W;
    const at = panels.map((p) => top + clamp((p.offsetLeft + p.offsetWidth / 2 - W / 2) / max) * travel);
    return { top, travel, at: [...new Set(at.map(Math.round))].sort((a, b) => a - b) };
  };
  const rest = () => {
    if (finger) return;
    const y = window.scrollY;
    const s = stops();
    const to = snapTarget(y, from, s.at, s.top, s.travel);
    from = to ?? y;
    if (to !== null && Math.abs(to - y) > 2) window.scrollTo({ top: to, behavior: 'smooth' });
  };
  const onScroll = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(rest, 150);
  };
  const down = () => {
    finger = true;
    from = window.scrollY;
  };
  const up = () => {
    finger = false;
    onScroll();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('touchstart', down, { passive: true });
  window.addEventListener('touchend', up, { passive: true });
  window.addEventListener('touchcancel', up, { passive: true });
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('touchstart', down);
    window.removeEventListener('touchend', up);
    window.removeEventListener('touchcancel', up);
  };
}
