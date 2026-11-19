'use client';

import { useEffect } from 'react';
import { clamp, onScrollFrame, reducedMotion } from './frame';

/** How far the section behind is held back (as a share of the screen) and darkened, when the next has fully come over it. */
export const HOLD = 0.5;
export const DARK = 0.3;

/** The hold and the shade for a section whose successor's top edge is at `e` on a screen `H` tall; null when it is out of play. */
export function layerAt(e: number, H: number): { y: number; d: number } | null {
  if (!(e < H && e > -H)) return null;
  const k = clamp((H - e) / H);
  return { y: H * HOLD * k, d: DARK * k };
}

/**
 * «Lagene» (the owner's pick, 2026-11-19): each section slides over the one before, which holds back
 * at half speed and darkens by up to 30%. The sections are the page's `[data-lag]` elements, in order;
 * each one that is passed over carries its own shade (`[data-shade]`), so a frame changes a transform
 * and an opacity and nothing else. The hero's own hold is the pour scene's (Pour.tsx). Renders nothing.
 */
export function Lagene() {
  useEffect(() => {
    if (reducedMotion()) return;
    const layers = Array.from(document.querySelectorAll<HTMLElement>('[data-lag]'));
    const pairs = layers.slice(1).map((n, i) => ({ o: layers[i], n, shade: layers[i].querySelector<HTMLElement>(':scope > [data-shade]'), held: false }));
    return onScrollFrame(null, () => {
      const H = window.innerHeight;
      if (!H) return;
      for (const p of pairs) {
        const at = layerAt(p.n.getBoundingClientRect().top, H);
        if (at) {
          p.o.style.transform = `translate3d(0,${at.y.toFixed(1)}px,0)`;
          if (p.shade) p.shade.style.opacity = at.d.toFixed(3);
          p.held = true;
        } else if (p.held) {
          p.o.style.transform = '';
          if (p.shade) p.shade.style.opacity = '';
          p.held = false;
        }
      }
    });
  }, []);
  return null;
}
