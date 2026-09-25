/*
 * When a box builds its picture.
 *
 * Every box below the hero runs a WebGL simulation, and building one — a context, the
 * shaders, the textures, the first settle — is one block of main-thread work of 100 to
 * 230 ms on a real GPU (profiled 2026-09-13: `getContext` 83 ms, the shader link 47 ms).
 * «Near» alone put that block in the worst place there is. A box became near the moment
 * the section ABOVE it reached the top of the screen, which is the moment that section's
 * entrance runs: Misjon's tiles rose and its pen drew through a 226 ms freeze that was
 * Arrangementer · Nyheter's water compiling its shaders. The user's word for it was
 * «not smooth».
 *
 * So near is where the wait starts, not where the build runs. The build waits for a quiet
 * moment — no scroll for a quarter second — and lands while the visitor is reading, when a
 * stall costs a stutter in the ink's drift and nothing else. (The page's glide, lib/smooth.ts,
 * moves the window itself, so a glide still coming to rest is not quiet either. It once also
 * waited for any GSAP tween to finish; nothing on the site tweens with GSAP any more, and
 * GSAP has gone.) It does not wait forever: a page that is never quiet gets its picture after
 * `PATIENCE` regardless, because a box that never paints is worse than a hitch.
 */
/** How far off the screen a box may be and still count as near: 60% of the viewport. */
export const NEAR = '60%';
/** No scroll event for this long. */
export const SCROLL_STILL = 250;
/** Checked this often once near. */
const POLL = 100;
/** Near for this long without a quiet moment: build anyway. */
export const PATIENCE = 3000;

let lastScroll = 0;
let listening = false;
function listen() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('scroll', () => { lastScroll = performance.now(); }, { passive: true });
}

export type NearOptions = { reduced?: boolean };

/**
 * Build once the element is near and the page is quiet. Returns the cancel; after it
 * nothing runs. Without an IntersectionObserver there is nothing to defer with, and it
 * builds now rather than never. Under reduced motion there are no entrances to protect,
 * so near is enough.
 */
export function buildWhenQuietNear(el: Element, build: () => void, opts: NearOptions = {}): () => void {
  if (typeof IntersectionObserver !== 'function') { build(); return () => {}; }
  listen();
  let done = false;
  let timer = 0;
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    if (opts.reduced) { done = true; build(); return; }
    const since = performance.now();
    const check = () => {
      if (done) return;
      const now = performance.now();
      const quiet = now - lastScroll >= SCROLL_STILL;
      if (quiet || now - since >= PATIENCE) { done = true; build(); return; }
      timer = window.setTimeout(check, POLL);
    };
    timer = window.setTimeout(check, POLL);
  }, { rootMargin: NEAR });
  io.observe(el);
  return () => { done = true; io.disconnect(); window.clearTimeout(timer); };
}
