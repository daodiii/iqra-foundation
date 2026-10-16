'use client';

import { useEffect, useRef, type HTMLAttributes, type ReactNode, type RefObject } from 'react';
import styles from './arrive.module.css';
import { useArrive } from './tip';

/**
 * A section that arrives: as the tip line passes its top, its title (`data-title`), its
 * copy (`data-prose`) and its cards (`data-card`, staggered by `--i`) come up in sequence;
 * scrolled back above, they go down again. The element is marked `data-live` on mount,
 * so without script nothing is ever hidden. `onArrive` is told either way, for whatever a
 * plate does when its content lands.
 */
type Props = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section';
  onArrive?: (arrived: boolean) => void;
  children: ReactNode;
};

export function Arrive({ as = 'div', className, onArrive, children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);
  useArrive(ref, onArrive);
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
