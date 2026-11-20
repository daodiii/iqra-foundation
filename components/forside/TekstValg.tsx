'use client';

import { useEffect } from 'react';
import f from './forside.module.css';

/** The ways for text to arrive that the owner is choosing between (Lines.tsx), by their mock numbers. */
export const TEKST = ['31', '32'] as const;
const NAMES: Record<(typeof TEKST)[number], string> = { '31': 'Linjene', '32': 'Ordene' };
const KEY = 'iqra-tekst';

/**
 * A small switch, on previews and on this machine only, for trying 31 «Linjene» against 32 «Ordene»
 * on a phone (the owner, 2026-11-20). It sets `html[data-tekst]` and plays every text already shown
 * again in the new way. Built by hand outside React, so it is never part of the page's markup. The
 * live site shows no switch and uses 31 (the CSS default) until the owner picks.
 */
export function TekstValg() {
  useEffect(() => {
    // this machine, or a Vercel preview (its branch addresses carry «-git-», whatever the env vars say)
    const here = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || /-git-.*\.vercel\.app$/.test(location.hostname);
    if (process.env.NEXT_PUBLIC_VERCEL_ENV !== 'preview' && !here) return;
    const root = document.documentElement;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {}
    const set = (v: string, replay: boolean) => {
      root.dataset.tekst = v;
      try {
        localStorage.setItem(KEY, v);
      } catch {}
      bar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
      if (!replay) return;
      const shown = Array.from(document.querySelectorAll<HTMLElement>('[data-lines="on"]'));
      shown.forEach((el) => (el.dataset.lines = 'off'));
      requestAnimationFrame(() => requestAnimationFrame(() => shown.forEach((el) => (el.dataset.lines = 'on'))));
    };
    const bar = document.createElement('div');
    bar.className = f.valg;
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Tekst');
    for (const v of TEKST) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.v = v;
      b.textContent = `${v} ${NAMES[v]}`;
      b.addEventListener('click', () => set(v, true));
      bar.appendChild(b);
    }
    document.body.appendChild(bar);
    set(saved && (TEKST as readonly string[]).includes(saved) ? saved : '31', false);
    return () => {
      bar.remove();
      delete root.dataset.tekst;
    };
  }, []);
  return null;
}
