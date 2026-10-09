'use client';

import { useCallback, useRef, type ReactNode, type RefObject } from 'react';
import { ease } from '@/lib/ease';
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

/** How open a plate is, 0-1, from where its centre stands against the middle of the screen, in screen heights — on the site's one curve. */
export function openness(off: number): number {
  return ease(1 - clamp01((Math.abs(off) - OPEN_WITHIN) / (CLOSED_BEYOND - OPEN_WITHIN)));
}

/** What a plate reveals (its doors, its pile, its sheet) holds once the plate has reached the middle: a reveal that closed again as the plate left would cover words still being read. */
export function held(off: number): number {
  return off <= 0 ? 1 : openness(off);
}

/**
 * Where a plate stands against the middle of the screen, in screen heights (+ below, − above, 0
 * while it spans the middle). A plate is judged by its first four fifths of a screen as it comes
 * and by its last four fifths as it goes, so a plate taller than the screen (a phone's, the sea) is
 * open for the whole time it fills it, and not only at the instant its centre passes.
 */
export function plateOff(r: { top: number; bottom: number; height: number }, H: number): number {
  const reach = Math.min(r.height, H * 0.8) / 2;
  const head = r.top + reach;
  const foot = r.bottom - reach;
  if (head > H / 2) return (head - H / 2) / H;
  if (foot < H / 2) return (foot - H / 2) / H;
  return 0;
}

/** A frame of a plate: its shape (`--open`, both ways) and what it reveals (`--rise`, held), and the marks the stylesheet keys on. */
export function writePlate(off: number, el: HTMLElement) {
  const open = openness(off);
  const rise = held(off);
  el.style.setProperty('--open', open.toFixed(3));
  el.style.setProperty('--rise', rise.toFixed(3));
  el.toggleAttribute('data-risen', rise >= 0.995);
  return open;
}

/** A reveal's frame: only `--rise`, held, and its mark. */
function writeRise(off: number, el: HTMLElement) {
  const rise = held(off);
  el.style.setProperty('--rise', rise.toFixed(3));
  el.toggleAttribute('data-risen', rise >= 0.995);
}

/**
 * The plate's reveal, measured on the part of the plate that has to be seen: the same driver, window
 * and curve as the plate's own `--rise`, written on `ref` so what is inside it reads its own number.
 * A board's pile and the closing sheet stand at the foot of a tall plate; driven by the plate, they
 * had finished before they came on screen. Give it a box the reveal does not move.
 */
export function useReveal(ref: RefObject<HTMLElement | null>) {
  useGlide(ref, plateOff, writeRise);
}

type Props = {
  className?: string;
  /** Told when the plate locks open (`--open` past 0.97) and when it lets go. */
  onOpen?: (open: boolean) => void;
  /** The plate's ground is dark: the header turns to it as it passes under (HeaderMotion). */
  dark?: boolean;
  /** For an anchor that lands on the plate. */
  id?: string;
  children: ReactNode;
};

/**
 * THE PLATE OPENING, the page's grammar (elite study). Every section after the sea is a plate laid
 * out at the page's full width and clipped to the inset; as it comes up to the middle of the screen
 * the clip goes to the edges and the corners square (`--open`), and back as it leaves. What a plate
 * holds is revealed by the same number, held once the plate is past the middle (`--rise`): the Om
 * oss doors part, the board's pile spreads, the closing sheet is handed across. One driver, one
 * window, one curve, so the doors, the pile and the sheet are the plate opening, not three tricks
 * beside it. Driven where the page is (`useGlide`). Under reduced motion nothing is listened to and
 * the stylesheet's defaults hold: the plate inset, everything it holds revealed.
 */
export function Scene({ className, onOpen, dark = false, id, children }: Props) {
  const wasOpen = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  useGlide(
    ref,
    useCallback((r: DOMRect, H: number) => plateOff(r, H), []),
    useCallback((off: number, el: HTMLElement) => {
      const isOpen = writePlate(off, el) > 0.97;
      if (isOpen !== wasOpen.current) {
        wasOpen.current = isOpen;
        onOpen?.(isOpen);
      }
    }, [onOpen]),
    'data-live',
  );
  return (
    <div ref={ref} id={id} className={`${styles.scene} ${className ?? ''}`} data-scene data-header={dark ? 'dark' : undefined}>
      {children}
    </div>
  );
}
