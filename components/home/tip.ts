'use client';

import { useEffect, useRef, type RefObject } from 'react';

/** Where the tip stands: this far down the screen, the reading line the arrivals answer to. */
export const LEAD = 0.66;
export const tipY = () => window.scrollY + window.innerHeight * LEAD;

/**
 * Marks the element `data-arrived` once the tip has passed its top (plus `after` px), and
 * clears it again when the tip goes back 120px above it — so scrolling up and down plays
 * the arrival again, and a section on the edge does not flicker. What stands on the first
 * screen is already there: an element whose top is inside the viewport when the hook
 * mounts is arrived at once, with no stagger, and one standing on the page's first screen
 * is never cleared — the tip line sits two thirds down the screen, above such an
 * element's top, so the clearing rule would take it away on the first scroll and hold it
 * blank until the tip caught up. Everything below the first screen answers to the tip.
 * Under reduced motion it is arrived at once and left alone. `onChange` is told both ways.
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
    const set = (now: boolean) => {
      arrived = now;
      if (now) el.setAttribute('data-arrived', '');
      else el.removeAttribute('data-arrived');
      cb.current?.(now);
    };
    const check = () => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      const t = tipY();
      if (!arrived && t >= top + after) set(true);
      else if (arrived && t < top - 120 && top >= window.innerHeight) set(false);
    };
    // The first check alone: inside the viewport is already there; below it, the tip rule.
    if (el.getBoundingClientRect().top < window.innerHeight) set(true);
    else check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [ref, after]);
}
