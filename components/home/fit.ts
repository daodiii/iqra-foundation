import { useEffect, type RefObject } from 'react';

/** The measuring size; the text is set at this, measured, and scaled to the box's width. */
const PROBE = 100;
/** A hair under the width, since the browser rounds glyph widths. */
const SLACK = 0.985;

export type FitOptions = {
  /** The size is capped at this share of the box's height. */
  maxOfHeight?: number;
  /** … and at this size. */
  max?: number;
  /** … and never under this. */
  min?: number;
  /** Fit to this fraction of the box's width instead of the whole. */
  share?: number;
  /** Write the size to this element as well as to the measured one (a list sized by its longest name). */
  onto?: RefObject<HTMLElement | null>;
};

/**
 * The size that fits: `measured` is the text's width at PROBE px, `w` and `h` the box's.
 * Pure, so it is tested; `useFit` measures and applies it.
 */
export function fitSize(measured: number, w: number, h: number, { maxOfHeight = 0.5, max = Infinity, min = 30, share = 1 }: FitOptions = {}): number {
  const byWidth = (PROBE * w * share * SLACK) / measured;
  const byHeight = h ? h * maxOfHeight : Infinity;
  return Math.max(min, Math.min(byWidth, byHeight, max));
}

/**
 * Fit a one-line text to its box: measured once at PROBE px and scaled, again whenever the
 * box resizes and once the fonts are in. Written to `--fit` on the text (and `onto`), so
 * the stylesheet keeps the rest and has its own size to fall back on. The glyphs are
 * measured with a Range, not the block — a block is as wide as its column whatever it
 * holds. Where a Range cannot be measured (a test's DOM), nothing is written.
 */
export function useFit(box: RefObject<HTMLElement | null>, text: RefObject<HTMLElement | null>, opts: FitOptions = {}) {
  const { maxOfHeight, max, min, share, onto } = opts;
  useEffect(() => {
    const el = box.current;
    const t = text.current;
    if (!el || !t || typeof ResizeObserver !== 'function') return;
    const fit = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w) return;
      // The probe goes where the size is read from, too: a list's item takes its size from the list.
      t.style.setProperty('--fit', `${PROBE}px`);
      onto?.current?.style.setProperty('--fit', `${PROBE}px`);
      const range = document.createRange();
      range.selectNodeContents(t);
      const measured = typeof range.getBoundingClientRect === 'function' ? range.getBoundingClientRect().width : 0;
      if (!measured) {
        t.style.removeProperty('--fit');
        onto?.current?.style.removeProperty('--fit');
        return;
      }
      const size = `${fitSize(measured, w, h, { maxOfHeight, max, min, share }).toFixed(1)}px`;
      t.style.setProperty('--fit', size);
      onto?.current?.style.setProperty('--fit', size);
    };
    fit();
    void document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [box, text, maxOfHeight, max, min, share, onto]);
}
