'use client';

import { useEffect, useRef, type HTMLAttributes, type ReactNode, type RefObject } from 'react';
import styles from './arrive.module.css';
import { useArrive } from './tip';

/**
 * A section that arrives: as the tip line passes its top, its title (`data-title`), its
 * copy (`data-prose`) and its cards (`data-card`, staggered by `--i`) come up in sequence;
 * scrolled back above, they go down again. With `seen` it arrives instead once that share of its
 * plate is on the screen (tip.ts). The element is marked `data-live` on mount, so without
 * script nothing is ever hidden. `onArrive` is told either way, for whatever a plate does when
 * its content lands.
 */
type Props = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section';
  onArrive?: (arrived: boolean) => void;
  /** Arrive once this share of the plate (0-1) is on the screen, rather than at the tip line. */
  seen?: number;
  children: ReactNode;
};

export function Arrive({ as = 'div', className, onArrive, seen, children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);
  useArrive(ref, onArrive, { seen });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.setAttribute('data-live', '');
    return () => el.removeAttribute('data-live');
  }, []);
  const Tag = as;
  return (
    <Tag ref={ref as RefObject<HTMLDivElement>} className={`${styles.arrive} ${className ?? ''}`} data-arrive="" {...rest}>
      {children}
    </Tag>
  );
}
