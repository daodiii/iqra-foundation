'use client';

import { useEffect } from 'react';

/**
 * The elite study's switches, read from the address so the owner can compare in place:
 *   ?grid=1    shows the twelve columns between the two edges (globals.css)
 *   ?bilde=0   takes away the stand-in study circle under the closing question (contact.module.css)
 * Written to <html> as data attributes; everything they switch is far below the first screen
 * except the grid, so there is nothing to flash. A mock's tool: not for the live site.
 */
export function Switches() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const root = document.documentElement;
    root.toggleAttribute('data-grid', q.get('grid') === '1');
    if (q.get('bilde') === '0') root.dataset.bilde = '0';
    return () => {
      root.removeAttribute('data-grid');
      delete root.dataset.bilde;
    };
  }, []);
  return null;
}
