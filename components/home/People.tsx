'use client';

import { useId, useRef, type CSSProperties } from 'react';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import type { Person, Picture } from '@/lib/content';
import { Arrive } from './Arrive';
import { centreOf, useGlide } from './glide';
import styles from './people.module.css';
import { risen } from './rise';

/** The table's centre, in screen heights from the top: where the pile begins to spread — the doors' numbers (About.tsx), so the two white plates move alike … */
export const SPREAD_FROM = 0.86;
/** … and where the prints lie in their row: the table in the middle of the screen. */
export const SPREAD_AT = 0.5;
/** The table seats this many: the first by order; the subpage lists everyone. */
export const SEATS = 3;

/** How far the pile has spread, 0 to 1, from where the table's centre stands on the screen, in screen heights. */
export function spread(centre: number): number {
  return risen(centre, SPREAD_FROM, SPREAD_AT);
}

/** The pile's target from the table's rect: how far spread it should be where it stands. */
const spreadAt = (r: DOMRect, H: number) => spread(centreOf(r, H));
const writeSpread = (open: number, el: HTMLElement) => el.style.setProperty('--open', open.toFixed(3));

const t = site.pages.people;

/**
 * Menneskene bak on white: the title and the board paragraph, and under them the people
 * as three prints in colour. The prints lie in one pile, the first on top, and as the
 * section is scrolled up to the middle of the screen they are laid out across the table
 * into a row — each with the name, the role and the lines under its photograph. Scrolled
 * back below, they gather into the pile again. Nothing pins; the row is the layout and
 * the pile is only where the prints are before they spread, so without script (or under
 * reduced motion) the row simply stands, and while the collection is empty the honest
 * line stands under the paragraph.
 *
 * `--open` is 0 (the pile) to 1 (the row) on the table, from where the table's centre
 * stands on the screen, driven by the scroll and eased after it (`useGlide`) — a tall
 * table on a phone is judged by its first four fifths of a screen, so it spreads while
 * its top is in view. On a phone the pile spreads downward into a column instead of
 * across into a row (people.module.css).
 */
export function People({ people }: { people: Person[] }) {
  const seated = people.slice(0, SEATS);
  const table = useRef<HTMLDivElement>(null);
  useGlide(table, spreadAt, writeSpread, 'data-live');

  return (
    <Arrive as="section" id="menneskene-bak" aria-labelledby="menneskene-bak-tittel" className={styles.section}>
      <div className={styles.head}>
        <h2 id="menneskene-bak-tittel" className={styles.title} data-title>{brief.people.title}</h2>
        <p className={styles.text} data-prose>{brief.people.paragraph}</p>
      </div>
      {seated.length ? (
        <div ref={table} className={styles.table} style={{ '--n': seated.length } as CSSProperties}>
          {seated.map((p, i) => (
            // k: this print's slot counted from the middle one, where the pile lies; j: its place in the pile; z: the first on top.
            <article
              key={p.slug}
              className={styles.print}
              style={{ '--k': i - (seated.length - 1) / 2, '--j': i, '--z': seated.length - i } as CSSProperties}
            >
              <div className={styles.photo}>
                <Portrait photo={p.photo} />
              </div>
              <div className={styles.words}>
                <h3 className={styles.name}>{p.name}</h3>
                <p className={styles.role}>{p.role}</p>
                <p className={styles.bio}>{p.bio}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.empty} data-prose>{t.empty}</p>
      )}
    </Arrive>
  );
}

/**
 * A person's photograph, filling the print's picture — or, until there is one, the site's
 * «Bilde kommer» under a lit bust drawn in the navy on the light ground.
 */
export function Portrait({ photo }: { photo: Picture | null }) {
  const id = `p${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  if (photo) {
    return <img src={photo.src} alt={photo.alt} className={styles.picture} loading="lazy" decoding="async" />;
  }
  return (
    <div className={styles.bust} aria-hidden="true">
      <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className={styles.art}>
        <defs>
          <radialGradient id={`${id}l`} cx="0.46" cy="0.34" r="0.6">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.5" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.22" />
          </linearGradient>
          <filter id={`${id}b`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>
        <rect width="400" height="500" fill={`url(#${id}l)`} />
        <g filter={`url(#${id}b)`} fill={`url(#${id}s)`}>
          <path d="M14 520 C 24 404, 108 342, 200 338 C 292 342, 376 404, 386 520 Z" />
          <rect x="166" y="262" width="68" height="84" rx="20" />
          <ellipse cx="200" cy="198" rx="66" ry="82" />
        </g>
      </svg>
      <span className={styles.note}>{t.photoMissing}</span>
    </div>
  );
}
