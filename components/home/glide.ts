'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { onScroll } from '@/lib/smooth';

/**
 * Where an element's centre stands on the screen, 0 the top and 1 the foot, in screen
 * heights: a tall element (a phone's plate) is judged by its first four fifths of a
 * screen, so it is judged open while its top is still in view.
 */
export const centreOf = (r: DOMRect, H: number) => (r.top + Math.min(r.height, H * 0.8) / 2) / H;

/**
 * A value driven by the scroll, written where the page is: in the frame the page moves (told by
 * lib/smooth.ts — by the glide on a touchpad, a TrackPoint or a mouse, by the browser's own
 * scroll on a phone) and on a resize, and only when it has changed. `target` reads the
 * element's rect and the screen's height and says where the value should be; `write` puts it on
 * the element. At mount it is written where the scroll has it; under reduced motion nothing is
 * listened to and the stylesheet's defaults hold. `mark` is set on the element for as long as it
 * is driven, so the stylesheet knows the script is running.
 *
 * Nothing eases it after the scroll any more. It was eased 150 ms behind (2026-09-21, when a
 * headless wheel notch, which jumps where a real browser's glides, had stepped the plates a third
 * of their way at a click), and that was a second clock after the scroll's own: measured on the
 * owner's laptop the plates went on drifting for up to 0.4 s after the page had stopped, and on
 * a phone they trailed the thumb (2026-09-25). The page's own motion — the glide, or a phone's
 * momentum — is the one smoothing there is.
 *
 * The screen's height is the one it had when its width last changed. A phone's toolbar, hiding
 * and showing as the page scrolls, changes the height alone, and judged live that stepped every
 * plate at once; a window resized or a phone turned changes the width too. A precise pointer's
 * screen (a laptop, a desktop) has no such toolbar, and takes every new height as it comes.
 */
export function useGlide(
  ref: RefObject<HTMLElement | null>,
  target: (rect: DOMRect, H: number) => number,
  write: (value: number, el: HTMLElement) => void,
  mark?: string,
) {
  const fns = useRef({ target, write });
  useEffect(() => {
    fns.current = { target, write };
  }, [target, write]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (mark) el.setAttribute(mark, '');
    let W = window.innerWidth;
    let H = window.innerHeight;
    let at = Number.NaN;
    const update = () => {
      const to = fns.current.target(el.getBoundingClientRect(), H);
      if (to === at) return;
      at = to;
      fns.current.write(at, el);
    };
    const resize = () => {
      if (window.innerWidth !== W || window.matchMedia('(pointer: fine)').matches) {
        W = window.innerWidth;
        H = window.innerHeight;
      }
      update();
    };
    update();
    const off = onScroll(update);
    window.addEventListener('resize', resize);
    return () => {
      off();
      window.removeEventListener('resize', resize);
      if (mark) el.removeAttribute(mark);
    };
  }, [ref, mark]);
}
