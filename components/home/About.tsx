'use client';

import { Flat } from '@/components/materials/Flat';
import { MarkedLine } from '@/components/site/AreaMark';
import { Logo } from '@/components/site/Logo';
import { pageHref, TitleLink } from '@/components/site/TitleLink';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { soft } from '@/lib/soft';
import styles from './about.module.css';
import { Arrive } from './Arrive';
import plate from './plate.module.css';
import { Scene } from './Scene';

/** A paragraph's sentences, each with its full stop: the brief's words untouched, only parted where a sentence ends. */
export function sentences(paragraph: string): string[] {
  return paragraph.split(/(?<=\.)\s+/);
}

/**
 * Om oss (5): «Stiftelsen skal være en åpen og inkluderende arena». One white plate with the logo
 * across it; as it comes up the screen its two doors swing open into the room, each on its outer
 * edge, the logo parting at the seam with them, and the room is there behind, saying Om Iqra
 * Foundation in words: the title, the first paragraph as the statement, and three lines in columns
 * under it — the second paragraph, and the third paragraph's two sentences as two (the owner's order,
 * 2026-09-21). The title is the way on to /om-oss (`TitleLink`). All of it on one screen, in the
 * page's flow — nothing pins.
 *
 * Elite study: the doors are the plate opening, not a trick beside it. The plate is a `Scene` like
 * every plate on the page; the doors turn by its `--rise` — the same driver, window and curve that
 * takes the plate's clip to the edges — so the plate opens and the doors part in one gesture, and
 * sooner than before (the review: the doors were a second hero halfway down the page). The doors
 * are inside the plate, which clips them: they can no longer widen a phone's page. Without script
 * or under reduced motion there are no doors, only the room.
 *
 * The doors turn away from the reader, so they only ever shrink toward their hinges. Seen from the
 * middle of the plate, a door at the plate's edge still shows its face past 90°, so the doors turn
 * to 118°, fade over the last third, and are hidden once the plate has risen (`data-risen`).
 */
export function About() {
  const [statement, crossing, arena] = brief.about.paragraphs;
  const [open, wish] = sentences(arena);
  const doors = (
    <>
      <div className={`${styles.door} ${styles.left}`} aria-hidden="true">
        <Logo height={200} decorative className={styles.emblem} />
      </div>
      <div className={`${styles.door} ${styles.right}`} aria-hidden="true">
        <Logo height={200} decorative className={styles.emblem} />
      </div>
    </>
  );
  return (
    <Arrive as="section" id="om-oss" className={styles.section} aria-labelledby="om-oss-tittel">
      <Scene>
        <Flat tint="white" className={`${plate.plate} ${styles.plate}`} art={doors}>
          <div className={`${plate.grid} ${styles.room}`}>
            <div className={plate.head}>
              <div className={styles.name}>
                <h2 id="om-oss-tittel" className={styles.title} data-title>
                  <TitleLink href={pageHref(site.pages.about.label)}>{brief.about.title}</TitleLink>
                </h2>
              </div>
              <p className={styles.statement}>{soft(statement)}</p>
            </div>
            <div className={styles.columns}>
              <p className={styles.col}><MarkedLine text={crossing} /></p>
              <p className={styles.col}>{soft(open)}</p>
              <p className={styles.col}>{soft(wish)}</p>
            </div>
          </div>
        </Flat>
      </Scene>
    </Arrive>
  );
}
