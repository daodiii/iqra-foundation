'use client';

import { useEffect, useRef, type ReactNode } from 'react';
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

type Props = {
  className?: string;
  /** Told when the plate locks open (`--open` past 0.97) and when it lets go. */
  onOpen?: (open: boolean) => void;
  children: ReactNode;
};

/**
 * A plate that opens as it passes the middle of the screen. `--open` is 0 to 1 on the
 * element, set once per scroll or resize frame; the sheet turns it into the clip. Under
 * reduced motion nothing is listened to and the plate stays inset.
 */
export function Scene({ className, onOpen, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const told = useRef(onOpen);
  useEffect(() => {
    told.current = onOpen;
  }, [onOpen]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let wasOpen = false;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const H = window.innerHeight;
      const open = openness((r.top + r.height / 2 - H / 2) / H);
      el.style.setProperty('--open', open.toFixed(3));
      const isOpen = open > 0.97;
      if (isOpen !== wasOpen) {
        wasOpen = isOpen;
        told.current?.(isOpen);
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div ref={ref} className={`${styles.scene} ${className ?? ''}`}>
      {children}
    </div>
  );
}
