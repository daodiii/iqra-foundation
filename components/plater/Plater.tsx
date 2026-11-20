'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { clamp, eo, onScrollFrame } from '@/components/forside/frame';
import f from '@/components/forside/forside.module.css';
import styles from './plater.module.css';

/** The plates' grounds: white, navy, teal, the deep navy of the foot, and the crimson of Støtt oss. */
export type Tone = 'white' | 'navy' | 'teal' | 'deep' | 'rod';

/**
 * How closed a plate still is (1 closed, 0 open) when its top stands `top` px from the top of a screen
 * `h` tall: closed while it waits under the screen, open once its top has come three quarters of the
 * way up, eased out so it opens quickly and lands softly (mock 42 «Platene», 2026-11-20).
 */
export function closedAt(top: number, h: number): number {
  if (h <= 0) return 0;
  return 1 - eo(clamp((h - top) / (h * 0.75)));
}

/** At closed `k`: inset from the top 10% of the screen's height, from each side 7% of its width, rounded 36 px. */
export function inset(k: number, w: number, h: number) {
  return { top: k * h * 0.1, side: k * w * 0.07, round: k * 36 };
}

/**
 * «Platene», the subpages' system (the owner's pick of mock 42, 2026-11-20): each part of a page is a
 * full-screen plate in one ground, its heading at poster size on a 12-column grid. As a plate comes up
 * it opens from a rounded panel set into the plate before it to the whole screen; the first plate is
 * open from the start. Texts marked `data-rise` fade up once they are on screen; headings arrive line
 * by line (`Lines`). Without JavaScript, or with reduced motion, every plate stands open and every text
 * is there.
 */
export function Plater({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const plates = Array.from(el.querySelectorAll<HTMLElement>('[data-plate]')).slice(1);

    const tick = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      for (const p of plates) {
        const k = reduce.matches ? 0 : closedAt(p.getBoundingClientRect().top, H);
        const c = inset(k, W, H);
        p.style.setProperty('--ci', `${c.top.toFixed(1)}px`);
        p.style.setProperty('--cx', `${c.side.toFixed(1)}px`);
        p.style.setProperty('--cr', `${c.round.toFixed(1)}px`);
      }
    };
    const stop = onScrollFrame(el, tick);

    const rises = Array.from(el.querySelectorAll<HTMLElement>('[data-rise]'));
    const show = (x: HTMLElement) => (x.dataset.in = '');
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver === 'undefined' || reduce.matches) rises.forEach(show);
    else {
      io = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (!e.isIntersecting) return;
            show(e.target as HTMLElement);
            io?.unobserve(e.target);
          }),
        { rootMargin: '0px 0px -8% 0px' },
      );
      rises.forEach((x) => io!.observe(x));
    }
    return () => {
      stop();
      io?.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={`${styles.plater} ${className ?? ''}`} data-plater="">
      {children}
    </div>
  );
}

/**
 * One plate: a section in its ground, named by its heading (`label`, the heading's id). `mid` stands its
 * content in the middle of the screen instead of at the foot.
 */
export function Plate({
  tone,
  label,
  id,
  mid,
  className,
  children,
  ...rest
}: {
  tone: Tone;
  label?: string;
  id?: string;
  mid?: boolean;
  className?: string;
  children: ReactNode;
} & Record<`data-${string}`, string | undefined>) {
  return (
    <section
      id={id}
      aria-labelledby={label}
      className={`${styles.plate} ${styles[tone]} ${mid ? styles.mid : ''} ${f.pad} ${className ?? ''}`}
      data-plate={tone}
      {...rest}
    >
      <div className={styles.in}>{children}</div>
    </section>
  );
}

/** A delay for a `data-rise` text, in seconds, so a row of them arrives one after the next. */
export const after = (s: number) => ({ '--d': `${s}s` }) as CSSProperties;
