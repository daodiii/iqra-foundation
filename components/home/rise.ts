'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { smoothstep } from './Scene';

/**
 * A section's rise: `--o` runs 0 to 1 on the element as its centre climbs from `from` to
 * `at` (screen heights from the top) — the doors' driver (About.tsx) with the two numbers
 * as parameters, for the foot's tide (Contact.tsx). A tall element is judged by its first four fifths of a screen, so a
 * phone's plate is open while its top is still in view. `data-rise` marks the element
 * once the script runs and motion is wanted; without either the stylesheet's default
 * (`--o: 1`) holds and everything simply stands. `onFrame` is told every frame, for a
 * material to retune or a stone to drop.
 */
export function useRise(ref: RefObject<HTMLElement | null>, from: number, at: number, onFrame?: (o: number, el: HTMLElement) => void) {
  const fn = useRef(onFrame);
  useEffect(() => {
    fn.current = onFrame;
  }, [onFrame]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.setAttribute('data-rise', '');
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const H = window.innerHeight;
      const centre = (r.top + Math.min(r.height, H * 0.8) / 2) / H;
      const o = smoothstep((from - centre) / (from - at));
      el.style.setProperty('--o', o.toFixed(3));
      fn.current?.(o, el);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
      el.removeAttribute('data-rise');
    };
  }, [ref, from, at]);
}
