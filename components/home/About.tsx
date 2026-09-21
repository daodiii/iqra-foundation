'use client';

import { useRef } from 'react';
import { MarkedLine } from '@/components/site/AreaMark';
import { Logo } from '@/components/site/Logo';
import { brief } from '@/content/brief.no';
import styles from './about.module.css';
import { Arrive } from './Arrive';
import { centreOf, useGlide } from './glide';
import { risen } from './rise';

/** The plate's centre, in screen heights from the top: where the doors begin to open — the plate three quarters on the screen … */
export const OPEN_FROM = 0.86;
/** … and where they stand open: the plate in the middle of it. */
export const OPEN_AT = 0.5;

/** How open the doors are, 0-1, from where the plate's centre stands on the screen (0 the top, 1 the foot). */
export function doorsOpen(centre: number): number {
  return risen(centre, OPEN_FROM, OPEN_AT);
}

/** The doors' target from the plate's rect: how open they should be where it stands. */
const doorsAt = (r: DOMRect, H: number) => doorsOpen(centreOf(r, H));

/** A frame of the doors on the plate: `--open`, and `data-open` once they are out of the way. */
const writeDoors = (open: number, el: HTMLElement) => {
  el.style.setProperty('--open', open.toFixed(3));
  el.toggleAttribute('data-open', open >= 0.995);
};

/** A paragraph's sentences, each with its full stop: the brief's words untouched, only parted where a sentence ends. */
export function sentences(paragraph: string): string[] {
  return paragraph.split(/(?<=\.)\s+/);
}

/**
 * Om oss (5): «Stiftelsen skal være en åpen og inkluderende arena». The section is one
 * white plate in the plates' column with the logo across it — the guide's for white, the
 * one the header carries; as it is scrolled up to the middle of the screen its two doors
 * swing open into the room, each on its outer edge, the logo parting at the seam with
 * them, and the room is there behind, saying Om Iqra Foundation in words: the title,
 * the first paragraph as the statement, and three lines in columns under it — the second
 * paragraph, and the third paragraph's two sentences as two, so «Vi ønsker å bringe
 * mennesker sammen …» stands as the third line (the owner's order, 2026-09-21). The
 * fourth paragraph and the story of the name are /om-oss's alone. All of it on one
 * screen, in the page's flow — nothing pins, and a reader passes it or reads it as they
 * like. Open, it stays open; scrolled back below the middle, it closes again.
 *
 * `--open` is 0 to 1 on the plate, from the plate's centre, driven by the scroll and
 * eased after it (`useGlide`; a tall plate on a phone is judged by its first four fifths
 * of a screen, so it opens while its top is still in view). The doors are marked by
 * `data-doors` only once the script runs and motion is wanted: without either the doors
 * are not drawn and the room simply stands, so nothing is ever hidden — the words are in
 * the DOM either way, and the doors' two copies of the logo (each shows its half) are
 * decoration.
 *
 * The doors turn away from the reader, so they only ever shrink toward their hinges and
 * never leave the plate. Seen from the middle of the plate (where the perspective is), a
 * door at the plate's edge still shows its face past 90° — the eye is off to its side —
 * so `backface-visibility` alone leaves a sliver at each edge; the doors turn to 118°,
 * fade over the last third, and are hidden outright (`data-open`) once the room is open.
 */
export function About() {
  const plate = useRef<HTMLDivElement>(null);
  useGlide(plate, doorsAt, writeDoors, 'data-doors');

  const [statement, crossing, arena] = brief.about.paragraphs;
  const [open, wish] = sentences(arena);
  return (
    <Arrive as="section" id="om-oss" className={styles.section} aria-labelledby="om-oss-tittel">
      <div ref={plate} className={styles.plate}>
        <div className={styles.room}>
          <h2 id="om-oss-tittel" className={styles.title} data-title>{brief.about.title}</h2>
          <p className={styles.statement}>{statement}</p>
          <div className={styles.columns}>
            <p className={styles.col}><MarkedLine text={crossing} /></p>
            <p className={styles.col}>{open}</p>
            <p className={styles.col}>{wish}</p>
          </div>
        </div>
        <div className={`${styles.door} ${styles.left}`} aria-hidden="true">
          <Logo height={200} decorative className={styles.emblem} />
        </div>
        <div className={`${styles.door} ${styles.right}`} aria-hidden="true">
          <Logo height={200} decorative className={styles.emblem} />
        </div>
      </div>
    </Arrive>
  );
}
