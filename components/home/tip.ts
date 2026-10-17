'use client';

import { useEffect, useRef, type RefObject } from 'react';

/** Where the tip stands: this far down the screen, the reading line the arrivals answer to — a section wakes as its top comes up through the lower third, in step with the plates, which begin to open there too. */
export const LEAD = 0.7;
export const tipY = () => window.scrollY + window.innerHeight * LEAD;

/** When an element arrives: by default as the tip passes its top plus `after` px; with `seen`, once that share of the plate it stands on (its `[data-scene]`) is on the screen. */
export type ArriveAt = { after?: number; seen?: number };

/**
 * Marks the element `data-arrived` once the tip has passed its top (plus `after` px), and
 * clears it again when the tip goes back 120px above it — so scrolling up and down plays
 * the arrival again, and a section on the edge does not flicker. Given `seen` instead, the line
 * is the screen's foot and the mark is that share of the way down the element's plate: it arrives
 * as that much of the plate has come up into view, and clears when the foot goes back 120px above
 * the mark (the Visjon/Misjon seal). What stands on the first screen is already there: an
 * element whose top is inside the viewport when the hook
 * mounts is arrived at once, with no stagger, and one standing on the page's first screen
 * is never cleared — the tip line sits two thirds down the screen, above such an
 * element's top, so the clearing rule would take it away on the first scroll and hold it
 * blank until the tip caught up. The first screen is judged once, at mount: a phone's
 * address bar collapsing shrinks the viewport under the same element, and judged live the
 * clearing rule would fire on that resize. Everything below the first screen answers to
 * the tip. Under reduced motion it is arrived at once and left alone. `onChange` is told
 * both ways.
 */
export function useArrive(ref: RefObject<HTMLElement | null>, onChange?: (arrived: boolean) => void, { after = 32, seen }: ArriveAt = {}) {
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
    const firstScreen = el.getBoundingClientRect().top + window.scrollY < window.innerHeight;
    const plate = seen === undefined ? null : (el.closest<HTMLElement>('[data-scene]') ?? el);
    /** The line on the page that has to reach the mark, and the mark it arrives at and leaves 120px above. */
    const line = () => (plate ? window.scrollY + window.innerHeight : tipY());
    const mark = () => {
      if (!plate) {
        const top = el.getBoundingClientRect().top + window.scrollY;
        return { on: top + after, off: top - 120 };
      }
      const r = plate.getBoundingClientRect();
      const at = r.top + window.scrollY + r.height * seen!;
      return { on: at, off: at - 120 };
    };
    const check = () => {
      const { on, off } = mark();
      const t = line();
      if (!arrived && t >= on) set(true);
      else if (arrived && t < off && !firstScreen) set(false);
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
  }, [ref, after, seen]);
}
