import { EASE, gsap, reducedMotion, ScrollTrigger } from '@/lib/gsap';

/** How long the page takes to get to the next section, in seconds. */
export const ONWARD_SECONDS = 0.9;

/**
 * Scroll the page to the section with this id, smoothly. `false` if there is no such
 * element on the page, so the caller can leave the click to the browser.
 *
 * Driven as a tween through `ScrollTrigger.getScrollFunc`, not `window.scrollTo` with
 * `behavior: 'smooth'`: the page's `normalizeScroll` owns the scroll position, and that
 * setter is the one it is already writing through, so the two never disagree about where
 * the page is (the hero's opening scrolls the same way). Under reduced motion it is one
 * jump. The target is measured now rather than kept, because the hero is pinned above
 * every other section and a pin spacer is part of the distance.
 */
export function scrollToSection(id: string): boolean {
  const el = typeof document === 'undefined' ? null : document.getElementById(id);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY;
  if (reducedMotion()) {
    window.scrollTo(0, top);
    return true;
  }
  // The setter is what has to go through GSAP; the position is the page's own.
  const set = ScrollTrigger.getScrollFunc(window);
  const at = { y: window.scrollY };
  gsap.to(at, { y: top, duration: ONWARD_SECONDS, ease: EASE.inOut, overwrite: 'auto', onUpdate: () => set(at.y) });
  return true;
}
