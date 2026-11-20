'use client';

import { useEffect, useRef, useState } from 'react';
import { klient } from '@/content/klient.no';
import { clamp, eio, eo, onFrame, pageKey, PLAIN_POUR, plainPour, reducedMotion, repainted } from './frame';
import { Lines } from './Lines';
import { SWOOSH } from './logo-paths';
import f from './forside.module.css';
import styles from './pour.module.css';

type On = { tx: boolean; h: boolean; lead: boolean; more: boolean };

/*
 * Where things happen, in screens scrolled into the scene (the stage's height). The white covers the
 * hero by 1; the paragraph rests at PARA (a beat, Takt.tsx); past OPEN the crimson dot rises and
 * opens by itself, on a clock (the owner, 2026-11-20: «perhaps the dot should just open automatically
 * and open the entire thing»); back above CLOSE it closes again; the poster rests at WHY (a beat).
 */
export const PARA = 1.15;
export const OPEN = 1.25;
export const CLOSE = 1.18;
export const WHY = 1.8;
/** How long the dot takes to rise and open (closing goes faster). */
export const OPEN_MS = 1100;

/** What the poster shows at open progress `o` (0–1, on the clock). */
export function stateAt(o: number): Omit<On, 'tx'> {
  return { h: o > 0.6, lead: o > 0.78, more: o > 0.92 };
}

/** The dot's way toward `want` (0 or 1) after `dt` ms: opening takes OPEN_MS, closing 60% of that. */
export function stepOpen(o: number, want: number, dt: number): number {
  if (o < want) return Math.min(want, o + dt / OPEN_MS);
  if (o > want) return Math.max(want, o - dt / (OPEN_MS * 0.6));
  return o;
}

/**
 * The pour scene: the white sheet over the hero, the opening paragraph, and the crimson dot that
 * opens into «Hvorfor vi finnes». The sheet and the paragraph follow the scroll exactly; the dot,
 * once called, plays on its own clock.
 */
export function Pour() {
  const sc = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const tx = useRef<HTMLDivElement>(null);
  const red = useRef<HTMLDivElement>(null);
  const redIn = useRef<HTMLDivElement>(null);
  const tone = useRef<SVGSVGElement>(null);
  const [on, setOn] = useState<On>({
    tx: false,
    h: false,
    lead: false,
    more: false,
  });

  useEffect(() => {
    const el = sc.current;
    const stage = el?.firstElementChild as HTMLElement | null;
    const hero = document.querySelector<HTMLElement>('[data-hero]');
    const heroShade = hero?.querySelector<HTMLElement>('[data-shade]');
    const dot = red.current;
    const inner = redIn.current;
    if (!el || !stage || !sheet.current || !tx.current || !dot || !inner || !tone.current) return;
    // on a phone the paragraph and the poster stand plain and open (pour.module.css): nothing to play
    if (plainPour()) {
      const g = tone.current.querySelector('g');
      const bb = g && typeof g.getBBox === 'function' ? g.getBBox() : null;
      if (bb?.width) tone.current.setAttribute('viewBox', [bb.x, bb.y, bb.width, bb.height].join(' '));
      return;
    }
    const reduce = reducedMotion();
    let fit = false;
    let shown = '';
    let size = '';
    let held = false;
    // once the paragraph has glided in it stays in its lines; scrolling back above it fades it out
    // with the white, instead of sliding it back down its masks while it is still being read
    let seen = false;
    let o = 0;
    let want = 0;
    let last: number | null = null;
    let page = '';
    return onFrame((now) => {
      const dt = last === null ? 16 : Math.min(50, now - last);
      last = now;
      // a still page with the dot at rest costs nothing
      if (pageKey() === page && o === want) return;
      page = pageKey();
      if (!fit && tone.current) {
        const g = tone.current.querySelector('g');
        const bb = g && typeof g.getBBox === 'function' ? g.getBBox() : null;
        if (bb?.width) {
          tone.current.setAttribute('viewBox', [bb.x, bb.y, bb.width, bb.height].join(' '));
          fit = true;
        }
      }
      const r = el.getBoundingClientRect();
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      // no layout yet: a 0/0 here would poison everything after it
      if (!H || r.height <= H) {
        page = '';
        return;
      }
      // 1: the white sheet rises over the hero, which holds back at half speed and darkens
      const gone = clamp(-r.top / (r.height - H)) * (r.height - H);
      const level = Math.max(0, H - gone);
      sheet.current!.style.transform = `translate3d(0,${level.toFixed(1)}px,0)`;
      if (hero) {
        if (gone < 2 * H && !reduce) {
          hero.style.transform = `translate3d(0,${(0.5 * gone).toFixed(1)}px,0)`;
          if (heroShade) heroShade.style.opacity = (0.3 * clamp(gone / H)).toFixed(3);
          held = true;
        } else if (held) {
          hero.style.transform = '';
          if (heroShade) heroShade.style.opacity = '';
          held = false;
        }
      }
      // 2: once the screen is white the paragraph glides in; it rests, then drifts up and away
      const s = gone / H;
      if (s >= 0.96) seen = true;
      const away = eio((s - CLOSE) / 0.2);
      const fade = seen ? clamp((s - 0.7) / 0.25) : 1;
      tx.current!.style.transform = `translateY(${(-H * 0.12 * away).toFixed(1)}px)`;
      tx.current!.style.opacity = ((1 - away) * fade).toFixed(3);
      // 3: the crimson dot, called past OPEN, rises to the middle and opens to the whole screen by itself
      if (s >= OPEN) want = 1;
      else if (s < CLOSE) want = 0;
      const was = o;
      o = reduce ? want : stepOpen(o, want, dt);
      if (o !== was) repainted();
      const rise = eo(o / 0.28);
      const open = eio((o - 0.18) / 0.82);
      const full = Math.hypot(W, H) / 2 + 4;
      if (size !== `${W}x${H}`) {
        size = `${W}x${H}`;
        const d = `${(2 * full).toFixed(1)}px`;
        Object.assign(dot.style, {
          width: d,
          height: d,
          margin: `${(-full).toFixed(1)}px 0 0 ${(-full).toFixed(1)}px`,
        });
        Object.assign(inner.style, {
          width: `${W}px`,
          height: `${H}px`,
          left: `${(full - W / 2).toFixed(1)}px`,
          top: `${(full - H / 2).toFixed(1)}px`,
        });
      }
      const R = o <= 0 ? 0 : 14 + (full - 14) * open;
      const dy = ((118 - 68 * rise) / 100) * H - H / 2;
      if (R <= 0) {
        dot.style.opacity = '';
        dot.style.pointerEvents = '';
      } else {
        const k = Math.min(1, R / full);
        dot.style.opacity = '1';
        dot.style.pointerEvents = 'auto';
        dot.style.transform = `translate3d(0,${dy.toFixed(1)}px,0) scale(${k.toFixed(5)})`;
        inner.style.transform = `scale(${(1 / k).toFixed(5)}) translate3d(0,${(-dy).toFixed(1)}px,0)`;
      }
      const q = eio((o - 0.3) / 0.7);
      tone.current!.style.transform = `translate(${((1 - q) * 14).toFixed(2)}vw,${((1 - q) * 34).toFixed(2)}vh) rotate(${((1 - q) * -14).toFixed(2)}deg)`;
      tone.current!.style.opacity = (q * 0.9).toFixed(3);
      const st = { tx: seen, ...stateAt(o) };
      const key = `${+st.tx}${+st.h}${+st.lead}${+st.more}`;
      if (key !== shown) {
        shown = key;
        setOn(st);
      }
    });
  }, []);

  const h = klient.home;
  return (
    <div ref={sc} className={`${styles.sc} ${f.layer}`} style={{ zIndex: 1 }} data-lag="sc">
      <div className={styles.stage}>
        <div ref={sheet} className={styles.sheet} />
        <div ref={tx} className={styles.tx} data-pour-tx>
          <Lines text={h.paragraphs[0]} on={on.tx} auto={PLAIN_POUR} />
        </div>
        <div ref={red} className={styles.red}>
          <div ref={redIn} className={styles.redIn}>
            <svg ref={tone} className={styles.tone} aria-hidden="true" focusable="false">
              <g>
                <path transform={SWOOSH.t} d={SWOOSH.d} />
              </g>
            </svg>
            <section id="hvorfor" className={styles.ct} aria-labelledby="hvorfor-tittel">
              <Lines as="h2" id="hvorfor-tittel" className={styles.h2} text={h.why.title} on={on.h} auto={PLAIN_POUR} />
              <Lines className={styles.lead} text={h.why.paragraphs[0]} on={on.lead} auto={PLAIN_POUR} delay={150} />
              <Lines className={styles.more} text={h.why.paragraphs[1]} on={on.more} auto={PLAIN_POUR} delay={150} />
            </section>
          </div>
        </div>
      </div>
      <i className={f.shade} aria-hidden="true" data-shade />
    </div>
  );
}
