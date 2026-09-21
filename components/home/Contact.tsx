'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Flat } from '@/components/materials/Flat';
import { site } from '@/content/site.no';
import { Arrive } from './Arrive';
import styles from './contact.module.css';
import { useRise } from './rise';
import { Scene } from './Scene';
import { Words } from './Words';

/** The table's centre, in screen heights from the top: where the two sides begin to come in — as the table's top clears the foot of the screen … */
export const MEET_FROM = 1.0;
/** … and where the sheet has been pushed across and rests: the table in the middle of the screen, where every plate on the page is done. */
export const REST_AT = 0.5;
/** The plates meet over this much of the rise, from its start … */
export const MEET_BY = 0.6;
/** … and the sheet comes across from here to its end. */
export const PUSH_FROM = 0.5;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** How far the plates have come in, 0 (beyond the edges) to 1 (met), from the rise `o`. */
export const meet = (o: number) => clamp01(o / MEET_BY);
/** How far the sheet has come across, 0 (beyond the right edge) to 1 (at rest), from the rise `o`. */
export const push = (o: number) => clamp01((o - PUSH_FROM) / (1 - PUSH_FROM));

const t = site.pages.home.contact;

/**
 * Kontakt at the foot of the home page, the owner's choice of 2026-09-21 (5 Arket på
 * bordet, their own combination of two mocks): the invitation as two parties at a table.
 * Two navy plates slide in from the two edges of the screen as the section climbs to the
 * middle of it and meet at a hairline of white, the table; ours carries the question,
 * word by word. Then, across your plate, a white sheet is pushed in from the right edge
 * and settles a degree off square with a shadow — the line and the one button on it, for
 * whoever wants to work with the foundation, meet it, challenge it or take up a debate.
 * Scrolled back below, the sheet is drawn back and the plates part again. On a phone the
 * plates meet top and bottom and the sheet comes onto the lower one.
 *
 * One driver (`useRise`): `--o` runs 0 to 1 on the table from the section's centre at
 * `MEET_FROM` to `REST_AT`; the plates meet over its first three fifths (`--meet`) and the
 * sheet comes across over its second half (`--push`), so the table is laid before the
 * paper is handed over. The scene's clip and corner are the table's as a whole, so the
 * outer corners round and the seam runs straight; the plates carry no corner of their
 * own; the last plate on the page, it holds open once it has passed the middle (`Scene`'s
 * `hold`), the page ending before it could leave. Nothing pins; without script or under
 * reduced motion the stylesheet's 1s hold and everything stands met and at rest. The
 * words on our plate come once the plates are nearly met — a sentence sliced by a moving
 * edge read as broken.
 */
export function Contact() {
  const table = useRef<HTMLDivElement>(null);
  useRise(table, MEET_FROM, REST_AT, (o, el) => {
    el.style.setProperty('--meet', meet(o).toFixed(3));
    el.style.setProperty('--push', push(o).toFixed(3));
  });
  return (
    <Scene hold>
      <div ref={table} className={styles.table}>
        <Arrive as="section" id="kontakt" aria-labelledby="kontakt-tittel" className={styles.section}>
          <Flat tint="navy" className={`${styles.plate} ${styles.ours}`}>
            <h2 id="kontakt-tittel" className={styles.title}><Words text={t.question} /></h2>
          </Flat>
          <Flat tint="navy" className={`${styles.plate} ${styles.yours}`}>
            <div className={styles.sheet} data-sheet>
              <p className={styles.line}>{t.line}</p>
              <p className={styles.more}>
                <Link href={site.cta.contact.href} prefetch={false} className={styles.button}>{site.cta.contact.label}</Link>
              </p>
            </div>
          </Flat>
        </Arrive>
      </div>
    </Scene>
  );
}
