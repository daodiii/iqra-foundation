'use client';

import localFont from 'next/font/local';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import styles from './vekten.module.css';

/** General Sans as a variable font (200-700), from Fontshare (ITF Free Font License, like the static cuts in brand/fonts). */
const generalSansVar = localFont({ src: './fonts/GeneralSans-Variable.woff2', weight: '200 700', variable: '--font-gs-var', display: 'block' });

/** The brief's headline in its four lines, kept whole: the weights move, the lines never re-wrap. */
const LINES = ['En stiftelse for', 'kunnskap, dialog,', 'møteplasser og', 'samfunnsdeltakelse'];
if (LINES.join(' ') !== brief.home.headline) throw new Error('Vekten: the lines no longer make the brief’s headline');

const REST = 430;
const PEAK = 690;
const WAVE = 1700;

/**
 * MOCK 12 Vekten. The brief's headline as the hero, very large on the guide's navy, set in General
 * Sans's variable cut, and alive in one dimension only: weight. As it arrives a wave of weight runs
 * through it from the first letter to the last, as if the sentence were being said; after that the
 * letters nearest the pointer (a finger on a phone) grow heavier and ease back as it moves on. Never
 * a re-wrap, never a moved line: the lines are fixed. Under it, the paragraph and the two buttons.
 */
export function Vekten() {
  const hero = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const h = hero.current;
    const t = title.current;
    if (!h || !t) return;
    h.setAttribute('data-in', '');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const letters = Array.from(t.querySelectorAll<HTMLElement>('[data-l]'));
    const w = letters.map(() => REST);
    let centres: { x: number; y: number }[] = [];
    let box = h.getBoundingClientRect();
    const measure = () => {
      box = h.getBoundingClientRect();
      centres = letters.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
      });
    };
    const ptr = { x: -9999, y: -9999, on: false };
    const onMove = (e: PointerEvent) => {
      ptr.x = e.clientX - box.left;
      ptr.y = e.clientY - box.top;
      ptr.on = true;
    };
    const onLeave = () => (ptr.on = false);
    let raf = 0;
    let t0 = -1;
    const R = () => Math.max(120, box.width * 0.11);
    const frame = (time: number) => {
      raf = requestAnimationFrame(frame);
      if (t0 < 0) {
        t0 = time;
        measure();
      }
      const r = R();
      // The entrance: a crest of weight running left to right across each line in turn, as the sentence is said.
      const p = (time - t0) / WAVE;
      for (let i = 0; i < letters.length; i++) {
        const c = centres[i];
        let target = REST;
        if (p < 1.4) {
          const crest = p * letters.length * 1.0;
          const d = (i - crest) / 5;
          target += (PEAK - REST) * Math.exp(-d * d);
        }
        if (ptr.on && c) {
          const dx = (c.x - ptr.x) / r;
          const dy = (c.y - ptr.y) / (r * 0.8);
          target += (PEAK - REST) * Math.exp(-(dx * dx + dy * dy));
        }
        target = Math.min(PEAK, target);
        const next = w[i] + (target - w[i]) * 0.16;
        if (Math.abs(next - w[i]) > 0.5) {
          w[i] = next;
          letters[i].style.fontWeight = String(Math.round(next));
        }
      }
    };
    raf = requestAnimationFrame(frame);
    // Measured again once the lines have risen into place (they were measured mid-rise).
    const settle = window.setTimeout(measure, 1400);
    h.addEventListener('pointermove', onMove);
    h.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      h.removeEventListener('pointermove', onMove);
      h.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
    };
  }, []);

  let n = 0;
  return (
    <section ref={hero} className={`${styles.hero} ${generalSansVar.variable}`} aria-labelledby="vekt-tittel" data-header="dark">
      <h1 id="vekt-tittel" ref={title} className={styles.title} aria-label={brief.home.headline}>
        {LINES.map((line) => (
          <span key={line} className={styles.line} aria-hidden="true">
            {[...line].map((ch, k) => (
              <span key={k} data-l={n++} className={styles.l}>
                {ch === ' ' ? ' ' : ch}
              </span>
            ))}
          </span>
        ))}
      </h1>
      <div className={styles.foot}>
        <p className={styles.lede}>{brief.home.paragraph}</p>
        <p className={styles.buttons}>
          <Link href={site.cta.work.href} prefetch={false} className={styles.work}>{site.cta.work.label}</Link>
          <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
        </p>
      </div>
    </section>
  );
}
