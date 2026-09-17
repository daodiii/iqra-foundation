'use client';

import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import { createFrame, keepFramesFitted } from '@/lib/pen';
import styles from './materials.module.css';

/** How long the pen takes to draw a frame, in milliseconds: `--dur-pen` in globals.css. */
export const PEN_MS = 800;

type Props = {
  /** The name on the line. */
  legend: string;
  legendId?: string;
  /** What the legend is: a heading where the card is a section of its own, a label otherwise. */
  level?: 'h2' | 'h3' | 'p';
  /** With an href the name is a link, and the whole card is its target. */
  href?: string;
  /** The i's dot before the name: the four areas carry it. */
  dot?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * A box of copy with a frame drawn round it by the pen.
 *
 * The line is a canvas (`[data-frame-canvas]`) that `lib/pen.ts` strokes as far as `p`
 * says, the pen leaving its top line open where the legend (`[data-legend]`) sits. The
 * pen draws once, over `PEN_MS`, when the card first comes on screen, on a
 * requestAnimationFrame loop of its own — nothing on this site pins or scrubs, so there
 * is no timeline for it to be in step with; the frosted inside fades in with the line
 * (`--frame-in`). Under reduced motion, or without an IntersectionObserver, it is drawn
 * at once. Without JavaScript there is no line, and the card is still a frosted plate
 * with its legend and its copy: nothing is ever hidden waiting for the pen.
 */
export function Frame({ legend, legendId, level = 'p', href, dot = false, className, children }: Props) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = root.current;
    if (!card) return;
    const frame = createFrame(card);
    if (!frame) return;
    const release = keepFramesFitted([frame]);
    let raf = 0;
    let io: IntersectionObserver | null = null;
    const finish = () => {
      frame.p = 1;
      card.style.setProperty('--frame-in', '1');
      frame.layout();
    };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver !== 'function') {
      finish();
    } else {
      card.style.setProperty('--frame-in', '0');
      frame.layout();
      io = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io?.disconnect();
        io = null;
        const started = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - started) / PEN_MS);
          frame.p = p;
          frame.draw();
          card.style.setProperty('--frame-in', p.toFixed(3));
          raf = p < 1 ? requestAnimationFrame(tick) : 0;
        };
        raf = requestAnimationFrame(tick);
      }, { threshold: 0.2 });
      io.observe(card);
    }
    return () => {
      release();
      io?.disconnect();
      if (raf) cancelAnimationFrame(raf);
      frame.destroy();
      card.style.removeProperty('--frame-in');
    };
  }, []);

  const Legend = level;
  return (
    <div ref={root} className={`${styles.frame} ${className ?? ''}`} data-frame>
      <canvas className={styles.frameCanvas} data-frame-canvas aria-hidden="true" />
      <Legend id={legendId} className={styles.legend} data-legend>
        {dot && <span className={styles.dot} aria-hidden="true" />}
        {href ? <Link href={href} prefetch={false} className={styles.legendLink}>{legend}</Link> : legend}
      </Legend>
      <div className={styles.copy}>{children}</div>
    </div>
  );
}
