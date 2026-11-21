'use client';

import Link from 'next/link';
import type { PointerEvent } from 'react';
import styles from './knapp.module.css';

/** `fill`: a filled button. `edge`: an outlined one. `ring`: an arrow link, the arrow in a ring. */
export type KnappKind = 'fill' | 'edge' | 'ring';

const LEAN = '(pointer: fine) and (prefers-reduced-motion: no-preference)';

/** A button leans toward a fine pointer: up to 6 px across and 4 px down, from its middle. */
function lean(e: PointerEvent<HTMLAnchorElement>) {
  if (e.pointerType !== 'mouse' || !window.matchMedia(LEAN).matches) return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  el.style.transform = `translate(${(x * 12).toFixed(1)}px,${(y * 8).toFixed(1)}px)`;
}

function rest(e: PointerEvent<HTMLAnchorElement>) {
  e.currentTarget.style.transform = '';
}

/**
 * The arrow in an arrow link's ring, drawn rather than typed: the font's «→» sits on the text's line,
 * a little below the ring's middle (the owner, 2026-11-22: «the arrows are not in the middle»). Drawn
 * on a 16 box with its shaft on the box's centre line, it stands at the ring's exact middle.
 */
export function RingPil() {
  const svg = (
    <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" />
    </svg>
  );
  return (
    <>
      <i>{svg}</i>
      <i>{svg}</i>
    </>
  );
}

/** «Pilen»: a link drawn as a button or an arrow link (knapp.module.css). The arrows are decoration; the label names it. */
export function Knapp({ href, kind, className, children }: { href: string; kind: KnappKind; className?: string; children: string }) {
  const button = kind !== 'ring';
  return (
    <Link
      href={href}
      prefetch={false}
      className={`${styles.k} ${styles[kind]} ${className ?? ''}`}
      onPointerMove={button ? lean : undefined}
      onPointerLeave={button ? rest : undefined}
      data-knapp={kind}
    >
      {button && <span className={styles.sweep} aria-hidden="true" />}
      <span className={styles.label}>{children}</span>
      <span className={styles.arrow} aria-hidden="true">
        {button ? (
          <>
            <i>→</i>
            <i>→</i>
          </>
        ) : (
          <RingPil />
        )}
      </span>
    </Link>
  );
}
