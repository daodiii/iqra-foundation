'use client';

import { useEffect, useRef, type RefObject } from 'react';

/** Where the tip stands: this far down the screen, the reading line the arrivals answer to. */
export const LEAD = 0.66;
export const tipY = () => window.scrollY + window.innerHeight * LEAD;

/**
 * Marks the element `data-arrived` once the tip has passed its top (plus `after` px), and
 * clears it again when the tip goes back 120px above it — so scrolling up and down plays
 * the arrival again, and a section on the edge does not flicker. Under reduced motion it
 * is arrived at once and left alone. `onChange` is told both ways.
 */
export function useArrive(ref: RefObject<HTMLElement | null>, onChange?: (arrived: boolean) => void, after = 48) {
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  }, [onChange]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.setAttribute('data-arrived', '');
      cb.current?.(true);
      return;
    }
    let arrived = false;
    const check = () => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      const t = tipY();
      if (!arrived && t >= top + after) {
        arrived = true;
        el.setAttribute('data-arrived', '');
        cb.current?.(true);
      } else if (arrived && t < top - 120) {
        arrived = false;
        el.removeAttribute('data-arrived');
        cb.current?.(false);
      }
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [ref, after]);
}
