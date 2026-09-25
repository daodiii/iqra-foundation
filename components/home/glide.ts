'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { onScroll, smooth } from '@/lib/smooth';

/**
 * The lag of a scroll-driven value behind the scroll, in ms: the time constant of its
 * approach. A wheel notch moves the page a hundred pixels in one go, and a value written
 * straight from the scroll jumps with it — the doors, the prints and the plates all
 * stepped a third of their way at a click; eased after the scroll with this lag, ninety
 * per cent of the jump is made up in three and a half of them, and a trackpad or a thumb
 * feels only a little weight.
 *
 * Only where the scroll is the browser's own — a phone, or a page without the glide. Where the
 * page glides (lib/smooth.ts) the scroll is already smoothed, and a lag on top of it is a
 * second clock: measured on the owner's laptop, the plates went on drifting for up to 0.4 s
 * after the page had stopped. There the value goes where the page is, in the same frame.
 */
export const LAG = 150;

/** How much of the way to the target a frame of `dt` ms goes. */
export const gain = (dt: number, lag = LAG) => 1 - Math.exp(-dt / lag);

/** Closer than this to the target, the value is written as the target and the frames stop. */
const SETTLED = 0.001;

/**
 * Where an element's centre stands on the screen, 0 the top and 1 the foot, in screen
 * heights: a tall element (a phone's plate) is judged by its first four fifths of a
 * screen, so it is judged open while its top is still in view.
 */
export const centreOf = (r: DOMRect, H: number) => (r.top + Math.min(r.height, H * 0.8) / 2) / H;

/**
 * A value driven by the scroll and eased after it. `target` reads the element's rect and
 * the screen's height on every scroll or resize and says where the value should be;
 * `write` puts each frame's value on the element, once per frame while it is on its way
 * and once more as it lands. At mount the value is written where the scroll has it,
 * nothing glides in from nowhere; under reduced motion nothing is listened to and the
 * stylesheet's defaults hold. `mark` is set on the element for as long as it is driven,
 * so the stylesheet knows the script is running.
 *
 * The frames are scheduled one at a time and the pending one is coalesced — a burst of
 * scroll events costs one frame — and they carry on after the scroll has stopped until the
 * value has settled, then stop: nothing runs while the page is at rest. A frame's `dt` is
 * read from the timestamps, capped so a tab that was hidden does not jump on its return
 * (and a test whose frames run at once counts a frame each). While the page glides there are
 * no frames of its own: each move of the glide writes the value where the page now is.
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
    let raf = 0;
    let to = 0;
    let at = 0;
    let last = 0;
    const aim = () => {
      to = fns.current.target(el.getBoundingClientRect(), window.innerHeight);
    };
    const frame = (now: number) => {
      raf = 0;
      const dt = last && now > last && now - last < 100 ? now - last : 16;
      last = now;
      at += (to - at) * gain(dt);
      if (Math.abs(to - at) < SETTLED) at = to;
      fns.current.write(at, el);
      if (at !== to) raf = requestAnimationFrame(frame);
    };
    const schedule = () => {
      aim();
      // The page glides: the scroll is smoothed already, so the value follows it exactly — one smoothing layer, not two.
      if (smooth()) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
        if (at !== to) {
          at = to;
          fns.current.write(at, el);
        }
        return;
      }
      if (!raf) raf = requestAnimationFrame(frame);
    };
    aim();
    at = to;
    fns.current.write(at, el);
    const off = onScroll(schedule);
    window.addEventListener('resize', schedule);
    return () => {
      off();
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
      if (mark) el.removeAttribute(mark);
    };
  }, [ref, mark]);
}
