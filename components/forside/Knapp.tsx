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
        <i>→</i>
        <i>→</i>
      </span>
    </Link>
  );
}
