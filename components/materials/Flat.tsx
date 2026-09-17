import type { CSSProperties, ReactNode } from 'react';
import styles from './flat.module.css';
import mat from './materials.module.css';

/** The grounds a flat plate can have: two of the guide's pale tints, and its navy. */
export type Tint = 'navy' | 'light' | 'turquoise-pale';

const GROUND: Record<Tint, string> = {
  navy: 'var(--color-navy)',
  light: 'var(--color-light)',
  'turquoise-pale': 'var(--color-turquoise-pale)',
};

type Props = {
  tint: Tint;
  className?: string;
  /** A node laid under the copy — a canvas or an svg — where a box's paint would be. Not a div: the scene's column rule is for the inner div alone. */
  art?: ReactNode;
  /** The cards' frost on this plate, 0-1; the stylesheet's 0.35 unless said otherwise. */
  frost?: number;
  children: ReactNode;
};

/**
 * A plate with no material in it: a flat ground in one of the guide's colours, the same
 * shell as a Box (its tokens, its inner column, the pen's tone) so the frames draw on it
 * as they do on water. Navy is a dark plate: light type, the light pen. The home page
 * stands Visjon/Misjon, Arrangementer and Støtt oss on navy plates.
 */
export function Flat({ tint, className, art, frost, children }: Props) {
  return (
    <div
      className={`${mat.box} ${styles.flat} ${className ?? ''}`}
      style={{ '--ground': GROUND[tint], '--still': 'none', ...(frost !== undefined ? { '--frost': frost } : {}) } as CSSProperties}
      data-material="flat"
      data-tone={tint === 'navy' ? 'dark' : 'light'}
      data-ground={tint}
    >
      {art}
      <div className={mat.inner}>{children}</div>
    </div>
  );
}
