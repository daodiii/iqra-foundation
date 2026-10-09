'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { onScroll } from '@/lib/smooth';

/** How far the page must move one way before the header answers: a trackpad's tremor is not a direction. */
const DEADBAND = 6;

const clear = (c: string) => c === 'transparent' || c === 'rgba(0, 0, 0, 0)';

/** A dark ground's colour: the element's own (the footer), or its plate's (a scene wraps its plate). */
function groundOf(el: Element): string {
  const own = getComputedStyle(el).backgroundColor;
  if (!clear(own) || !el.firstElementChild) return own;
  return getComputedStyle(el.firstElementChild).backgroundColor;
}

/**
 * The header's behaviour (elite study), on the header (`#topp`) the server rendered:
 *
 * - Read downward, it goes up out of the way; the moment the reader goes back up, it returns. It
 *   stays while the first screen is on, while the drawer is open, while focus is inside it, and while
 *   the sea is under it — the sea's screen is pinned under the header, and taken away the header
 *   would leave a strip of the sea's pages showing above it.
 * - Over a navy plate (a scene marked `data-header="dark"`, and the footer) it turns to that plate's
 *   own navy, light type and the reversed logo, so the header and the plate read as one ground.
 *   Found by an IntersectionObserver on a one-pixel line through the header's middle: no layout is
 *   read in a scroll frame.
 * - On the home page its logo stands back while the hero's lockup is on screen (the review: the
 *   logo five times, twice on the first screen), and comes once the lockup has gone under it.
 */
export function HeaderMotion() {
  const path = usePathname();
  useEffect(() => {
    const header = document.getElementById('topp');
    if (!header) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hh = () => header.getBoundingClientRect().height || 72;
    const sea = document.querySelector<HTMLElement>('[data-fields]');

    // --- away on the way down, back on the way up ---
    let lastY = window.scrollY;
    let away = false;
    let seaOn = false;
    const set = (v: boolean) => {
      if (v === away) return;
      away = v;
      header.toggleAttribute('data-away', v);
    };
    const onMove = () => {
      const y = window.scrollY;
      const d = y - lastY;
      if (Math.abs(d) < DEADBAND) return;
      lastY = y;
      const hold = y < window.innerHeight * 0.6 || seaOn || document.body.hasAttribute('data-menu-open') || header.matches(':focus-within');
      set(!hold && d > 0);
    };
    const off = reduced ? () => {} : onScroll(onMove);
    const onFocus = () => set(false);
    header.addEventListener('focusin', onFocus);

    // --- what is under the header: the sea, a navy plate, or the paper ---
    let io: IntersectionObserver | null = null;
    const dark = new Map<Element, string>();
    const watch = () => {
      io?.disconnect();
      const mid = Math.round(hh() / 2);
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.target === sea) {
              seaOn = e.isIntersecting;
              if (seaOn) set(false);
              continue;
            }
            if (e.isIntersecting) dark.set(e.target, groundOf(e.target));
            else dark.delete(e.target);
          }
          const ground = [...dark.values()].pop();
          header.toggleAttribute('data-dark', !!ground);
          if (ground) header.style.setProperty('--header-ground', ground);
          else header.style.removeProperty('--header-ground');
        },
        { rootMargin: `-${mid}px 0px -${Math.max(0, window.innerHeight - mid - 1)}px 0px` },
      );
      document.querySelectorAll('[data-header="dark"]').forEach((el) => io!.observe(el));
      if (sea) io.observe(sea);
    };
    watch();
    window.addEventListener('resize', watch);

    // --- the logo stands back while the hero's lockup is on screen ---
    const lockup = document.getElementById('hovedtekst');
    let lio: IntersectionObserver | null = null;
    if (lockup) {
      lio = new IntersectionObserver(([e]) => header.toggleAttribute('data-lockup', e.isIntersecting), {
        rootMargin: `-${Math.round(hh())}px 0px 0px 0px`,
      });
      lio.observe(lockup);
    } else header.removeAttribute('data-lockup');

    return () => {
      off();
      header.removeEventListener('focusin', onFocus);
      window.removeEventListener('resize', watch);
      io?.disconnect();
      lio?.disconnect();
      header.removeAttribute('data-away');
      header.removeAttribute('data-dark');
      header.removeAttribute('data-lockup');
      header.style.removeProperty('--header-ground');
    };
  }, [path]);
  return null;
}
