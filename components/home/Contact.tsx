'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Flat } from '@/components/materials/Flat';
import { site } from '@/content/site.no';
import { CIRCLE } from '@/lib/media';
import { Arrive } from './Arrive';
import styles from './contact.module.css';
import plate from './plate.module.css';
import { Scene, useReveal } from './Scene';
import { Words } from './Words';

const t = site.pages.home.contact;

/**
 * THE ENDING (elite study, item 7). The page ended on a mostly empty sheet — two lines and a button
 * with 370px of white between them — and then a footer of placeholders. Now it closes on one
 * moment: the deepest navy plate on the page, the question «Vil du samarbeide, utfordre oss eller ta
 * en debatt?» set at the page's ONE display size, and the sheet handed across the table with the
 * owner's line and the two things to do, Kontakt and Støtt oss. The sheet is sized to what it holds.
 *
 * 5 Arket på bordet (the owner's pick of 2026-09-21) is still the idea — our side asks, the sheet
 * is pushed across to yours — but as the plate opening, not a trick beside it: the plate opens like
 * every plate on the page and the sheet comes across by the same `--rise` (Scene.tsx), where two
 * plates used to slide in from the screen's edges and meet.
 *
 * STAND-IN: under the question, the film's own modern study circle (3.2 s into the loop), baked into
 * a navy duotone (scripts/dev/elite-media.mjs) — a circle of people in conversation under a question
 * about conversation. It is the film's generated frame, not a photograph of the foundation, and goes
 * when theirs exists (the review's item 1). ?bilde=0 takes it away (Switches.tsx).
 */
export function Contact() {
  // The sheet comes across by its own place on the screen: a still box round it (`.hand`), the sheet inside it moving.
  const hand = useRef<HTMLDivElement>(null);
  useReveal(hand);
  const circle = (
    <div className={styles.ground} aria-hidden="true" data-stand-in>
      <picture>
        <source type="image/avif" srcSet={CIRCLE.avif} />
        <img className={styles.circle} src={CIRCLE.webp} alt="" loading="lazy" decoding="async" />
      </picture>
    </div>
  );
  return (
    <Scene dark>
      <Flat tint="navy-deep" className={`${plate.plate} ${styles.plate}`} art={circle}>
        <Arrive as="section" id="kontakt" aria-labelledby="kontakt-tittel" className={`${plate.grid} ${styles.end}`}>
          <h2 id="kontakt-tittel" className={styles.question}><Words text={t.question} /></h2>
          <div ref={hand} className={styles.hand}>
            <div className={styles.sheet} data-sheet>
              <p className={styles.line}>{t.line}</p>
              <p className={styles.actions}>
                <Link href={site.cta.contact.href} prefetch={false} className={styles.contact}>{site.cta.contact.label}</Link>
                <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
              </p>
            </div>
          </div>
        </Arrive>
      </Flat>
    </Scene>
  );
}
