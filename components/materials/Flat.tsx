import type { CSSProperties, ReactNode } from 'react';
import styles from './flat.module.css';
import mat from './materials.module.css';

/**
 * The grounds a flat plate can have: white (told from the white page by a hairline and a shadow,
 * as the owner asked of the white plates), two of the guide's pale tints, and the navy ramp's steps
 * (globals.css): the navy itself, a step lifted, deep and deepest.
 */
export type Tint = 'white' | 'navy' | 'navy-lift' | 'navy-deep' | 'navy-deepest' | 'light' | 'turquoise-pale';

const GROUND: Record<Tint, string> = {
  white: 'var(--color-white)',
  navy: 'var(--color-navy)',
  'navy-lift': 'var(--color-navy-lift)',
  'navy-deep': 'var(--color-navy-deep)',
  'navy-deepest': 'var(--color-navy-deepest)',
  light: 'var(--color-light)',
  'turquoise-pale': 'var(--color-turquoise-pale)',
};

const DARK: ReadonlySet<Tint> = new Set(['navy', 'navy-lift', 'navy-deep', 'navy-deepest']);

type Props = {
  tint: Tint;
  className?: string;
  /** A node laid under the copy — a canvas or an svg — where a box's paint would be. Not a div: the scene's column rule is for the inner div alone. */
  art?: ReactNode;
  /** The cards' frost on this plate, 0-1; the stylesheet's 0.35 unless said otherwise. */
  frost?: number;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * A plate with no material in it: a flat ground in one of the guide's colours, the same
 * shell as a Box (its tokens, its inner column, the pen's tone) so the frames draw on it
 * as they do on water. A navy step is a dark plate: light type, the light pen.
 */
export function Flat({ tint, className, art, frost, style, children }: Props) {
  return (
    <div
      className={`${mat.box} ${styles.flat} ${className ?? ''}`}
      style={{ '--ground': GROUND[tint], '--still': 'none', ...(frost !== undefined ? { '--frost': frost } : {}), ...style } as CSSProperties}
      data-material="flat"
      data-tone={DARK.has(tint) ? 'dark' : 'light'}
      data-ground={tint}
    >
      {art}
      <div className={mat.inner}>{children}</div>
    </div>
  );
}
