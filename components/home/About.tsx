'use client';

import { useEffect, useRef } from 'react';
import { MarkedLine } from '@/components/site/AreaMark';
import { Logo } from '@/components/site/Logo';
import { brief } from '@/content/brief.no';
import styles from './about.module.css';
import { Arrive } from './Arrive';
import { smoothstep } from './Scene';

/** The plate's centre, in screen heights from the top: where the doors begin to open … */
export const OPEN_FROM = 0.8;
/** … and where they stand open. */
export const OPEN_AT = 0.42;

/** How open the doors are, 0-1, from where the plate's centre stands on the screen (0 the top, 1 the foot). */
export function doorsOpen(centre: number): number {
  return smoothstep((OPEN_FROM - centre) / (OPEN_FROM - OPEN_AT));
}

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
 * `--open` is 0 to 1 on the plate, set once per scroll or resize frame from the plate's
 * centre (a tall plate on a phone is judged by its first four fifths of a screen, so it
 * opens while its top is still in view). The doors are marked by `data-doors` only once
 * the script runs and motion is wanted: without either the doors are not drawn and the
 * room simply stands, so nothing is ever hidden — the words are in the DOM either way,
 * and the doors' two copies of the logo (each shows its half) are decoration.
 *
 * The doors turn away from the reader, so they only ever shrink toward their hinges and
 * never leave the plate. Seen from the middle of the plate (where the perspective is), a
 * door at the plate's edge still shows its face past 90° — the eye is off to its side —
 * so `backface-visibility` alone leaves a sliver at each edge; the doors turn to 118°,
 * fade over the last third, and are hidden outright (`data-open`) once the room is open.
 */
export function About() {
  const plate = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = plate.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.setAttribute('data-doors', '');
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const H = window.innerHeight;
      const centre = (r.top + Math.min(r.height, H * 0.8) / 2) / H;
      const open = doorsOpen(centre);
      el.style.setProperty('--open', open.toFixed(3));
      el.toggleAttribute('data-open', open >= 0.995);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
      el.removeAttribute('data-doors');
      el.removeAttribute('data-open');
    };
  }, []);

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
