'use client';

import { useEffect, useRef } from 'react';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import { eio, onFrame, pageKey, plainPour, reducedMotion } from './frame';
import { Knapp } from './Knapp';
import { LETTERS, MARK } from './Merke';
import { VIEWBOX } from './logo-paths';
import f from './forside.module.css';
import styles from './hero.module.css';

const VB = VIEWBOX;
const R = VB[3] / VB[2];
const VIEW = VB.join(' ');
/** The pour's length once it starts, and when it starts by itself. */
const POUR_MS = 900;
const AUTO_MS = 1000;
/** The logo's glide between the hero and the header, either way. */
export const FLY_MS = 700;
/** It leaves for the header once the page is this far down (share of a screen), and comes back below DOWN. */
export const UP = 0.06;
export const DOWN = 0.02;

/**
 * Where the flight is going after the page stands at `sy` on a screen `H` tall, from `want` (0 the
 * hero's slot, 1 the header): it goes up past UP and back below DOWN, and between them keeps its way.
 */
export function flightGoal(sy: number, H: number, want: number): number {
  if (sy > H * UP) return 1;
  if (sy < H * DOWN) return 0;
  return want;
}

/** The lit surface of the pour across the lockup: a wave at `level`, closed below for the clip, open for the stroke. */
export function wavePath(level: number, amp: number, ph: number, closed: boolean) {
  const x0 = VB[0] - 30;
  const x1 = VB[0] + VB[2] + 30;
  const n = 48;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const y = level + Math.sin((i / n) * Math.PI * 4 + ph) * amp + Math.sin((i / n) * Math.PI * 9 - ph * 1.7) * amp * 0.35;
    d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  if (closed) d += `L${x1} ${VB[1] + VB[3] + 60}L${x0} ${VB[1] + VB[3] + 60}Z`;
  return d;
}

/** The headline in its two sentences, each word in its own mask. */
function headline(): string[][] {
  return klient.home.headline.split(/(?<=\.)\s+/).map((s) => s.split(' '));
}

/**
 * Hero «Midt», the owner's pick: the full Iqra lockup, carved into the navy, pours white
 * («Smeltet», a second after the page opens or at once on the first scroll) while the headline and
 * the buttons rise; then, as the page scrolls, it flies into the header's slot and stays there as
 * the header's logo.
 */
export function Hero() {
  const hero = useRef<HTMLElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const mk = useRef<HTMLDivElement>(null);
  const wave = useRef<SVGPathElement>(null);
  const surf = useRef<SVGGElement>(null);
  const carved = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const sec = hero.current;
    const el = mk.current;
    const box = slot.current;
    const page = sec?.closest<HTMLElement>('[data-forside]');
    const dock = document.querySelector<HTMLElement>('[data-dock]');
    if (!sec || !el || !box || !page || !dock) return;

    const reduce = reducedMotion();
    const fine = window.matchMedia('(pointer: fine)').matches;
    const layers = {
      soft: carved.current?.querySelector('[data-l="soft"]'),
      shade: carved.current?.querySelector('[data-l="shade"]'),
      hi: carved.current?.querySelector('[data-l="hi"]'),
    };
    const surfs = Array.from(surf.current?.querySelectorAll('path') ?? []);

    let t = reduce ? 1 : 0;
    let tGoal = reduce ? 1 : 0;
    let pShown = 0;
    let angle = (215 * Math.PI) / 180;
    let want = angle;
    let clock0: number | null = null;
    let last: number | null = null;
    let rest = { x: 0, y: 0, w: 1 };
    let target = { x: 0, y: 0, w: 1 };

    let tDrawn = -1;
    let placed = '';
    let measured = 0;
    const measure = () => {
      measured++;
      const sy = window.scrollY;
      const r = box.getBoundingClientRect();
      const w = Math.min(r.width, r.height / R) || 1;
      rest = {
        x: r.left + (r.width - w) / 2,
        y: r.top + sy + (r.height - w * R) / 2,
        w,
      };
      el.style.width = `${w}px`;
      el.style.height = `${w * R}px`;
      const h = dock.getBoundingClientRect();
      target = { x: h.left, y: h.top, w: Math.min(h.width, h.height / R) };
    };

    const place = () => {
      const e = eio(pShown);
      const sy = window.scrollY;
      // the slot sits in the hero, which the pour scene holds back at half speed (Pour.tsx): the
      // logo starts from where the slot really is, so it never runs ahead of the headline under it
      const held = reduce || plainPour() || sy >= 2 * sec.clientHeight ? 0 : sy * 0.5;
      const from = rest.y - sy + held;
      const x = rest.x + (target.x - rest.x) * e;
      const y = from + (target.y - from) * e;
      const s = (rest.w + (target.w - rest.w) * e) / rest.w;
      el.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scale(${s.toFixed(5)})`;
      if (pShown >= 0.98) page.dataset.solid = '';
      else delete page.dataset.solid;
    };

    const light = () => {
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      layers.shade?.setAttribute('transform', `translate(${(-dx * 4).toFixed(2)} ${(-dy * 4).toFixed(2)})`);
      layers.soft?.setAttribute('transform', `translate(${(-dx * 12).toFixed(2)} ${(-dy * 12).toFixed(2)})`);
      layers.hi?.setAttribute('transform', `translate(${(dx * 1.6).toFixed(2)} ${(dy * 1.6).toFixed(2)})`);
    };

    const pour = (now: number) => {
      const f = eio(t);
      const top = VB[1] - 25;
      const bot = VB[1] + VB[3] + 15;
      const level = bot + (top - bot) * f;
      const amp = (1 - f * 0.55) * 13 * (t < 1 ? 1 : 0);
      const ph = now / 260;
      wave.current?.setAttribute('d', wavePath(level, amp, ph, true));
      const open = wavePath(level, amp, ph, false);
      surfs.forEach((s) => s.setAttribute('d', open));
      el.style.setProperty('--sv', (t > 0 && t < 1 ? Math.min(1, Math.sin(t * Math.PI) * 2.2) : 0).toFixed(3));
      el.style.setProperty('--sh', (1 - eio((t - 0.6) / 0.4)).toFixed(3));
      if (t > 0 && !('go' in sec.dataset)) sec.dataset.go = '';
    };

    // where the flight is going: the header once the page has left the top, the slot when it is back
    let fly = 0;

    const auto = window.setTimeout(() => (tGoal = 1), reduce ? 0 : AUTO_MS);
    const onScroll = () => {
      if (window.scrollY > 2) tGoal = 1;
      if (!fine) want = ((325 - Math.min(1, window.scrollY / 600) * 40) * Math.PI) / 180;
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let a = Math.atan2(cy - e.clientY, cx - e.clientX);
      while (a - angle > Math.PI) a -= 2 * Math.PI;
      while (angle - a > Math.PI) a += 2 * Math.PI;
      want = a;
    };

    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointer);

    const stop = onFrame((now) => {
      if (clock0 === null) clock0 = now;
      const ts = now - clock0;
      const dt = last === null ? 16 : Math.min(50, now - last);
      last = now;
      // the light swings round over the opening, then turns toward the pointer
      if (ts < 2300) {
        angle = ((215 + eio((ts - 500) / 1800) * 110) * Math.PI) / 180;
        want = angle;
        light();
      } else if (Math.abs(want - angle) > 1e-4) {
        angle += (want - angle) * 0.08;
        light();
      }
      if (t < tGoal) t = Math.min(tGoal, t + dt / POUR_MS);
      // the surface moves by the clock while the white pours; before and after, it is drawn once
      if ((t > 0 && t < 1) || t !== tDrawn) {
        pour(now);
        tDrawn = t;
      }
      // the flight waits until the logo is white; then it glides on its own clock, all the way, so it
      // never rests half way over the text however the page stops (the owner, 2026-11-20: «it just
      // stops in the middle of the page»). Measured against the hero (100svh), which holds still
      // while a phone's address bar slides.
      fly = t >= 0.88 ? flightGoal(window.scrollY, sec.clientHeight || window.innerHeight, fly) : 0;
      const step = reduce ? 1 : dt / FLY_MS;
      pShown = fly > pShown ? Math.min(fly, pShown + step) : Math.max(fly, pShown - step);
      // the logo moves only when the page or the flight has; a still page costs nothing
      const k = `${pageKey()}|${pShown}|${measured}`;
      if (k !== placed) {
        place();
        placed = k;
      }
    });

    return () => {
      stop();
      window.clearTimeout(auto);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointer);
      delete page.dataset.solid;
      delete page.dataset.tone;
    };
  }, []);

  const h = klient.home;
  let i = 0;
  return (
    <>
      <div ref={mk} className={styles.mk} aria-hidden="true" data-mk>
        <div className={styles.arr}>
          <svg ref={carved} className={`${styles.svg} ${styles.carved}`} viewBox={VIEW} focusable="false">
            <use href={`#${MARK}`} className={styles.soft} filter="url(#iqra-blur)" data-l="soft" />
            <use href={`#${MARK}`} className={styles.shade} data-l="shade" />
            <use href={`#${MARK}`} className={styles.hi} data-l="hi" />
            <use href={`#${MARK}`} className={styles.face} />
          </svg>
          <svg className={styles.svg} viewBox={VIEW} focusable="false">
            <defs>
              <clipPath id="iqra-pour" clipPathUnits="userSpaceOnUse">
                <path ref={wave} d="" />
              </clipPath>
            </defs>
            <g clipPath="url(#iqra-pour)">
              <use href={`#${MARK}`} className={styles.lit} />
            </g>
            <g ref={surf} clipPath={`url(#${LETTERS})`}>
              <path className={`${styles.surf} ${styles.glow}`} filter="url(#iqra-halo)" d="" />
              <path className={styles.surf} d="" />
            </g>
          </svg>
        </div>
      </div>
      <section ref={hero} className={styles.hero} aria-labelledby="hero-tittel" data-hero>
        <div className={`${styles.main} ${f.pad}`}>
          <div ref={slot} className={styles.slot}>
            <svg className={styles.still} viewBox={VIEW} role="img" aria-label={site.logoAlt}>
              <use href={`#${MARK}`} className={styles.lit} />
            </svg>
          </div>
          <h1 id="hero-tittel" className={styles.h1}>
            {headline().map((words, l) => (
              <span key={l}>
                {l > 0 && ' '}
                <span className={styles.ln}>
                  {words.map((w, k) => (
                    <span key={k}>
                      {k > 0 && ' '}
                      <span className={styles.wm}>
                        <span className={styles.w} style={{ '--i': i++ } as React.CSSProperties}>
                          {w}
                        </span>
                      </span>
                    </span>
                  ))}
                </span>
              </span>
            ))}
          </h1>
          <div className={styles.side}>
            <p className={styles.lede}>{h.paragraphs[1]}</p>
            <div className={styles.acts}>
              <Knapp href={site.cta.about.href} kind="fill" className={styles.about}>
                {site.cta.about.label}
              </Knapp>
              <Knapp href={site.cta.events.href} kind="ring" className={styles.events}>
                {site.cta.events.label}
              </Knapp>
            </div>
          </div>
        </div>
        <i className={f.shade} aria-hidden="true" data-shade />
      </section>
    </>
  );
}
