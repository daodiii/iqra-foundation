import { LOGO_PATHS } from './logo-paths';
import styles from './forside.module.css';

/** The lockup's id, for `<use href>`: every logo on the front page is a use of this one drawing. */
export const MARK = 'iqra-m';
/** The letters as a clip, so the pour's lit surface shows only inside them. */
export const LETTERS = 'iqra-letters';

/**
 * The Iqra lockup, drawn once. A use of it takes its colours from two inherited custom properties
 * (a use's clone ignores descendant selectors): `--lf` for the letters, `--cf` for the accents.
 */
export function Merke() {
  return (
    <svg className={styles.defs} aria-hidden="true" focusable="false">
      <defs>
        <g id={MARK}>
          {LOGO_PATHS.map((p, i) => (
            <path key={i} transform={p.t} d={p.d} style={{ fill: p.k === 'c' ? 'var(--cf)' : 'var(--lf)' }} />
          ))}
        </g>
        <clipPath id={LETTERS} clipPathUnits="userSpaceOnUse">
          {LOGO_PATHS.map((p, i) => (
            <path key={i} transform={p.t} d={p.d} />
          ))}
        </clipPath>
        <filter id="iqra-blur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="iqra-halo" x="-15%" y="-25%" width="130%" height="150%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
    </svg>
  );
}
