'use client';

import { useRef, type CSSProperties } from 'react';
import { Flat } from '@/components/materials/Flat';
import { pageHref, TitleLink } from '@/components/site/TitleLink';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import type { Person, Picture } from '@/lib/content';
import { soft } from '@/lib/soft';
import { Arrive } from './Arrive';
import styles from './people.module.css';
import plate from './plate.module.css';
import { Scene, useReveal } from './Scene';

/** The table seats this many: the first by order; the subpage lists everyone. */
export const SEATS = 3;

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
 * Elite study: the board is a white plate like Om oss, and the pile is the plate opening, not a
 * trick beside it — it spreads by the plate's `--rise` (Scene.tsx), the driver, window and curve
 * that take the plate's clip to the edges, so the prints are laid out as the plate opens and the
 * title and the row are on the screen together (the review: they had finished spreading only after
 * the title had left a laptop's screen). On a phone the pile spreads downward into a column instead
 * of across into a row (people.module.css).
 */
export function People({ people }: { people: Person[] }) {
  const seated = people.slice(0, SEATS);
  // The pile spreads by the table's own place on the screen (it stands at the foot of the plate), on the plate's driver and curve.
  const table = useRef<HTMLDivElement>(null);
  useReveal(table);
  return (
    <Arrive as="section" id="menneskene-bak" aria-labelledby="menneskene-bak-tittel" className={styles.section}>
      <Scene>
        <Flat tint="white" className={plate.plate}>
          <div className={plate.grid}>
            <div className={plate.head}>
              <h2 id="menneskene-bak-tittel" className={plate.title} data-title>
                <TitleLink href={pageHref(t.label)}>{brief.people.title}</TitleLink>
              </h2>
              <p className={plate.lede} data-prose>{soft(brief.people.paragraph)}</p>
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
          </div>
        </Flat>
      </Scene>
    </Arrive>
  );
}

/**
 * A person's photograph, filling the print's picture — or, until there is one, the site's
 * «Bilde kommer» under a lit bust in the navy on the light ground. Elite study: the bust is the same
 * figure baked once to a 5 KB image (scripts/dev/elite-bust.mjs), where it was drawn as SVG under a
 * Gaussian blur that the browser rasterised for every print the first time the board came on screen.
 */
export function Portrait({ photo }: { photo: Picture | null }) {
  if (photo) {
    return <img src={photo.src} alt={photo.alt} className={styles.picture} loading="lazy" decoding="async" />;
  }
  return (
    <div className={styles.bust} aria-hidden="true">
      <picture>
        <source type="image/avif" srcSet="/media/bust.avif" />
        <img src="/media/bust.webp" alt="" className={styles.art} loading="lazy" decoding="async" />
      </picture>
      <span className={styles.note}>{t.photoMissing}</span>
    </div>
  );
}
