'use client';

import { useEffect, useRef, useState } from 'react';
import { klient } from '@/content/klient.no';
import { clamp, eio, eo, onScrollFrame, reducedMotion } from './frame';
import { Lines } from './Lines';
import { SWOOSH } from './logo-paths';
import f from './forside.module.css';
import styles from './pour.module.css';

type On = { tx: boolean; h: boolean; lead: boolean; more: boolean };

/** What is shown at scene progress `k` (0–1 over the scene's 520vh). */
export function stateAt(k: number): On {
  return { tx: k > 0.25, h: k > 0.62, lead: k > 0.7, more: k > 0.77 };
}

/**
 * The pour scene: the white sheet over the hero, the opening paragraph, and the crimson dot that
 * opens into «Hvorfor vi finnes». Every step follows the scroll exactly (no smoothing).
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
    const reduce = reducedMotion();
    let fit = false;
    let shown = '';
    let size = '';
    let held = false;
    // once the paragraph has glided in it stays in its lines; scrolling back above it fades it out
    // with the white, instead of sliding it back down its masks while it is still being read
    let seen = false;
    return onScrollFrame(el, () => {
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
      if (!H || r.height <= H) return;
      const k = clamp(-r.top / (r.height - H));
      // 1: the white sheet rises over the hero, which holds back at half speed and darkens
      const gone = k * (r.height - H);
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
      // 2: once the screen is white the paragraph glides in; it rests, then drifts up and away as the dot comes
      const away = eio((k - 0.4) / 0.1);
      tx.current!.style.transform = `translateY(${(-H * 0.12 * away).toFixed(1)}px)`;
      const fade = seen ? clamp((gone / H - 0.7) / 0.25) : 1;
      tx.current!.style.opacity = ((1 - away) * fade).toFixed(3);
      // 3: the crimson dot rises out of the white to the middle, then opens to the whole screen
      const rise = eo((k - 0.45) / 0.11);
      const open = eio((k - 0.56) / 0.16);
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
      const R = k < 0.44 ? 0 : 14 + (full - 14) * open;
      const dy = ((118 - 68 * rise) / 100) * H - H / 2;
      if (R <= 0) {
        dot.style.opacity = '';
        dot.style.pointerEvents = '';
      } else {
        const s = Math.min(1, R / full);
        dot.style.opacity = '1';
        dot.style.pointerEvents = 'auto';
        dot.style.transform = `translate3d(0,${dy.toFixed(1)}px,0) scale(${s.toFixed(5)})`;
        inner.style.transform = `scale(${(1 / s).toFixed(5)}) translate3d(0,${(-dy).toFixed(1)}px,0)`;
      }
      const q = eio((k - 0.58) / 0.3);
      tone.current!.style.transform = `translate(${((1 - q) * 14).toFixed(2)}vw,${((1 - q) * 34).toFixed(2)}vh) rotate(${((1 - q) * -14).toFixed(2)}deg)`;
      tone.current!.style.opacity = (q * 0.9).toFixed(3);
      const s = stateAt(k);
      // the paragraph waits until the white has covered the screen: on a phone's shorter scene that is later than k 0.25
      if (s.tx && gone >= H * 0.96) seen = true;
      s.tx = seen;
      const key = `${+s.tx}${+s.h}${+s.lead}${+s.more}`;
      if (key !== shown) {
        shown = key;
        setOn(s);
      }
    });
  }, []);

  const h = klient.home;
  return (
    <div ref={sc} className={`${styles.sc} ${f.layer}`} style={{ zIndex: 1 }} data-lag="sc">
      <div className={styles.stage}>
        <div ref={sheet} className={styles.sheet} />
        <div ref={tx} className={styles.tx}>
          <Lines text={h.paragraphs[0]} on={on.tx} />
        </div>
        <div ref={red} className={styles.red}>
          <div ref={redIn} className={styles.redIn}>
            <svg ref={tone} className={styles.tone} aria-hidden="true" focusable="false">
              <g>
                <path transform={SWOOSH.t} d={SWOOSH.d} />
              </g>
            </svg>
            <section id="hvorfor" className={styles.ct} aria-labelledby="hvorfor-tittel">
              <Lines as="h2" id="hvorfor-tittel" className={styles.h2} text={h.why.title} on={on.h} />
              <Lines className={styles.lead} text={h.why.paragraphs[0]} on={on.lead} />
              <p className={styles.more} data-on={on.more ? '' : undefined}>
                {h.why.paragraphs[1]}
              </p>
            </section>
          </div>
        </div>
      </div>
      <i className={f.shade} aria-hidden="true" data-shade />
    </div>
  );
}
