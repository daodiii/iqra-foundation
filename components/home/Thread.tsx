'use client';

import { useEffect, useRef } from 'react';
import { drawStroke, makePath, PEN, TAU, type Seg } from '@/lib/pen';
import styles from './thread.module.css';

/**
 * The red thread, drawn. One line by the site's pen leaves the mark's dot in the hero,
 * curves into the left margin and runs down the page past every section to the foot,
 * where the footer's four words take it over. Its crimson tip leads a little below the
 * middle of the screen, so the line draws itself as the page is read; each section is a
 * knot on it, the i's dot again. A fixed canvas the size of the viewport, redrawn on
 * scroll, so the page's height costs nothing. Reduced motion: the whole line at once, no
 * tip. Without script there is no thread: it is decoration, and the words in the footer
 * are the thread's text.
 */

const KNOT = PEN.tip;
/** Where the tip stands on the screen, as a fraction of the viewport's height. */
const LEAD = 0.66;

type Geometry = { segs: Seg[]; knots: number[]; x: number; bottom: number };

/** An element's box in page coordinates. */
function pageRect(el: Element) {
  const r = el.getBoundingClientRect();
  return { left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height };
}

/**
 * The geometry, measured from the page: the mark's dot (the smaller of the two accents),
 * the margin's middle (half the first plate's inset), the knots (each `[data-knot]`, level
 * with its `[data-knot-at]` label or its frame's legend), and the end at the footer's top.
 */
function measure(): Geometry | null {
  const accents = [...document.querySelectorAll<SVGPathElement>('[data-accent]')];
  const dot = accents.map((a) => ({ a, r: a.getBoundingClientRect() })).sort((p, q) => p.r.width * p.r.height - q.r.width * q.r.height)[0];
  const plate = document.querySelector('main [data-plates] > *');
  const footer = document.querySelector('footer');
  if (!dot || !plate || !footer) return null;
  const d = pageRect(dot.a);
  const x0 = d.left + d.width / 2;
  const y0 = d.top + d.height + 8;
  const x = Math.max(6, pageRect(plate).left / 2);
  const bottom = pageRect(footer).top;
  // The S from the dot into the margin: two quarter arcs of one radius, the second run anticlockwise.
  const R = Math.max(12, (x0 - x) / 2);
  const segs: Seg[] = [
    { type: 'line', x0, y0: y0 - 8, x1: x0, y1: y0 },
    { type: 'arc', cx: x0 - R, cy: y0, r: R, a0: 0, a1: Math.PI / 2 },
    { type: 'arc', cx: x0 - R, cy: y0 + 2 * R, r: R, a0: -Math.PI / 2, a1: -Math.PI },
    { type: 'line', x0: x, y0: y0 + 2 * R, x1: x, y1: bottom },
  ];
  const knots = [...document.querySelectorAll('main [data-knot]')]
    .map((k) => {
      const at = k.querySelector('[data-knot-at], [data-legend]');
      const r = pageRect(at ?? k);
      return at ? r.top + r.height / 2 : r.top + 56;
    })
    .filter((y) => y > y0 + 2 * R && y < bottom);
  return { segs, knots, x, bottom };
}

export function Thread() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let geo: Geometry | null = null;
    let path = makePath([]);
    let dpr = 1;
    let raf = 0;

    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(window.innerWidth * dpr);
      c.height = Math.round(window.innerHeight * dpr);
      c.style.width = `${window.innerWidth}px`;
      c.style.height = `${window.innerHeight}px`;
    };

    /** The p at which the path is at page y: the path only ever goes down, so a bisection finds it. */
    const progressAt = (y: number) => {
      let lo = 0, hi = 1;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (path.pointAt(mid)[1] < y) lo = mid; else hi = mid;
      }
      return hi;
    };

    const draw = () => {
      raf = 0;
      if (!geo) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.translate(0, -window.scrollY);
      const tipY = reduced ? geo.bottom : window.scrollY + window.innerHeight * LEAD;
      const p = tipY >= geo.bottom ? 1 : progressAt(tipY);
      drawStroke(ctx, path, p);
      ctx.fillStyle = KNOT;
      for (const y of geo.knots) {
        if (y > tipY) break;
        ctx.beginPath();
        ctx.arc(geo.x, y, 5, 0, TAU);
        ctx.fill();
      }
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(draw); };
    const layout = () => {
      size();
      geo = measure();
      path = makePath(geo?.segs ?? []);
      schedule();
    };

    layout();
    // The fonts and the film settle the page's height after the first paint.
    const settle = window.setTimeout(layout, 600);
    const ro = new ResizeObserver(layout);
    ro.observe(document.body);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', layout);
    return () => {
      window.clearTimeout(settle);
      ro.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', layout);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvas} className={styles.thread} aria-hidden="true" data-thread-canvas />;
}
