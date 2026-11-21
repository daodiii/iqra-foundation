'use client';

import { useEffect, useRef, useState } from 'react';
import { klient } from '@/content/klient.no';
import { clamp, eio, onFrame, pageKey, PLAIN_POUR, plainPour, reducedMotion } from './frame';
import { Lines } from './Lines';
import { SWOOSH } from './logo-paths';
import f from './forside.module.css';
import styles from './pour.module.css';

type On = { tx: boolean; h: boolean; lead: boolean; more: boolean };

/*
 * Where things happen, in screens scrolled into the scene (the stage's height). The white covers the
 * hero by 1; the paragraph rests at PARA (a beat, Takt.tsx) and drifts away past CLOSE; from RISE to
 * RISEN the crimson «Hvorfor vi finnes» page rises over the white with the scroll, as the white rose
 * over the hero; it rests at WHY (a beat). It replaced a crimson dot that opened by itself on a clock
 * (the owner, 2026-11-21: «take away the dot … it doesn't really look that professional and it messes
 * up the scrolling»: its frames stalled a touchpad's momentum).
 */
export const PARA = 1.15;
export const CLOSE = 1.18;
export const RISE = 1.2;
export const RISEN = 1.75;
export const WHY = 1.8;

/** How far the crimson page has risen at scene position `s` (0 to 1, with the scroll). */
export const riseAt = (s: number) => clamp((s - RISE) / (RISEN - RISE));

/** What the poster shows at rise `o` (0–1). */
export function stateAt(o: number): Omit<On, 'tx'> {
  return { h: o > 0.6, lead: o > 0.78, more: o > 0.92 };
}

/**
 * The pour scene: the white sheet over the hero, the opening paragraph, and the crimson page of
 * «Hvorfor vi finnes» rising over it. All of it follows the scroll exactly.
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
    const crimson = red.current;
    if (!el || !stage || !sheet.current || !tx.current || !crimson || !tone.current) return;
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
    let held = false;
    // once the paragraph has glided in it stays in its lines; scrolling back above it fades it out
    // with the white, instead of sliding it back down its masks while it is still being read
    let seen = false;
    let page = '';
    return onFrame(() => {
      // a still page costs nothing
      if (pageKey() === page) return;
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
      // 3: the crimson page rises over the white with the scroll
      const o = riseAt(s);
      if (o <= 0) {
        crimson.style.opacity = '';
        crimson.style.pointerEvents = '';
        crimson.style.transform = '';
      } else {
        crimson.style.opacity = '1';
        crimson.style.pointerEvents = 'auto';
        crimson.style.transform = `translate3d(0,${((1 - o) * H).toFixed(1)}px,0)`;
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
