'use client';

import { useCallback, useRef, type ReactNode } from 'react';
import { useGlide } from './glide';
import styles from './scene.module.css';

/** A plate is fully open within this far of the middle of the screen, in screen heights … */
export const OPEN_WITHIN = 0.2;
/** … and fully closed beyond this. */
export const CLOSED_BEYOND = 0.58;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smoothstep = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

/** How open a plate is, 0-1, from where its centre stands against the middle of the screen, in screen heights. */
export function openness(off: number): number {
  return 1 - smoothstep((Math.abs(off) - OPEN_WITHIN) / (CLOSED_BEYOND - OPEN_WITHIN));
}

/** The last plate on the page holds open once it has passed the middle: the page ends before it could leave, and a plate that draws its edges back in as the footer comes reads as a mistake. */
export function held(off: number): number {
  return off < 0 ? 1 : openness(off);
}

type Props = {
  className?: string;
  /** Told when the plate locks open (`--open` past 0.97) and when it lets go. */
  onOpen?: (open: boolean) => void;
  /** The last plate: open once past the middle, and never closing on the way out (`held`). */
  hold?: boolean;
  children: ReactNode;
};

/**
 * A plate that opens as it passes the middle of the screen. `--open` is 0 to 1 on the
 * element, driven by the scroll and written where the page is (`useGlide`); the sheet turns it into
 * the clip. Under reduced motion nothing is listened to and the plate stays inset.
 */
export function Scene({ className, onOpen, hold = false, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  useGlide(
    ref,
    useCallback((r: DOMRect, H: number) => (hold ? held : openness)((r.top + r.height / 2 - H / 2) / H), [hold]),
    useCallback((open: number, el: HTMLElement) => {
      el.style.setProperty('--open', open.toFixed(3));
      const isOpen = open > 0.97;
      if (isOpen !== wasOpen.current) {
        wasOpen.current = isOpen;
        onOpen?.(isOpen);
      }
    }, [onOpen]),
  );
  return (
    <div ref={ref} className={`${styles.scene} ${className ?? ''}`}>
      {children}
    </div>
  );
}
