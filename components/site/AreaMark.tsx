import { Fragment } from 'react';
import { areas } from '@/components/home/areas';
import type { AreaKey } from '@/lib/content';
import styles from './mark.module.css';

/**
 * The mark: a 10px square of the area's colour before the area's name — the only way a
 * colour appears on the site away from the fields and the bands, and never without the
 * name. Møteplasser's square is the light with a navy hairline, or it would vanish on
 * white. The square is decorative; the name is the text.
 */
export function AreaMark({ area }: { area: AreaKey }) {
  const a = areas.find((x) => x.key === area);
  if (!a) return null;
  return (
    <span className={styles.mark}>
      <span className={styles.square} data-area={a.key} aria-hidden="true" />
      {a.name}
    </span>
  );
}

const NAMES = new RegExp(`(${areas.map((a) => a.name).join('|')})`, 'gi');

/**
 * A sentence with each area's name marked where it stands — «i skjæringspunktet mellom
 * kunnskap, dialog, møteplasser og samfunnsdeltakelse» — the text itself untouched, so the
 * brief's verbatim test and a screen reader both read the sentence as written. The square
 * and its word are one unbreakable piece, or a line could end on the square alone.
 */
export function MarkedLine({ text }: { text: string }) {
  const parts = text.split(NAMES);
  return (
    <>
      {parts.map((part, i) => {
        const a = areas.find((x) => x.name.toLowerCase() === part.toLowerCase());
        return a ? (
          <span key={i} className={styles.marked}>
            <span className={styles.square} data-area={a.key} aria-hidden="true" />
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        );
      })}
    </>
  );
}
