'use client';

import { useLayoutEffect } from 'react';

/**
 * Keeps `data-js` on <html>. The shell's first inline script sets it before the first paint; but if
 * React ever has to rebuild the page on the client (a hydration mismatch anywhere), it rewrites
 * <html>'s attributes and the mark is lost, and the front page falls back to its no-JavaScript
 * layout: Sporet stops moving sideways and the scenes after the hero stand still (2026-11-26).
 */
export function JsMark() {
  useLayoutEffect(() => {
    document.documentElement.dataset.js = '';
  });
  return null;
}
