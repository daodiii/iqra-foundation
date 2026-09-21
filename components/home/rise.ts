'use client';

import { useCallback, type RefObject } from 'react';
import { centreOf, useGlide } from './glide';
import { smoothstep } from './Scene';

/** A section's rise, 0 to 1, as its centre climbs from `from` to `at` (screen heights from the top). */
export const risen = (centre: number, from: number, at: number) => smoothstep((from - centre) / (from - at));

/**
 * A section's rise: `--o` runs 0 to 1 on the element as its centre climbs from `from` to
 * `at` (screen heights from the top), driven by the scroll and eased after it
 * (`useGlide`) — the foot's table (Contact.tsx) is on it, and the doors (About.tsx) and
 * the prints (People.tsx) take the same rise under their own names. A tall element is
 * judged by its first four fifths of a screen, so a phone's plate is open while its top
 * is still in view. `data-rise` marks the element once the script runs and motion is
 * wanted; without either the stylesheet's default (`--o: 1`) holds and everything simply
 * stands. `onFrame` is told every frame, for whatever a plate does with the number.
 */
export function useRise(ref: RefObject<HTMLElement | null>, from: number, at: number, onFrame?: (o: number, el: HTMLElement) => void) {
  useGlide(
    ref,
    useCallback((r: DOMRect, H: number) => risen(centreOf(r, H), from, at), [from, at]),
    useCallback((o: number, el: HTMLElement) => {
      el.style.setProperty('--o', o.toFixed(3));
      onFrame?.(o, el);
    }, [onFrame]),
    'data-rise',
  );
}
