'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Box } from '@/components/materials/Box';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import type { InkHandle } from '@/lib/ink';
import type { WaterHandle } from '@/lib/water';
import { areaFloor, areas } from './areas';
import { Arrive } from './Arrive';
import styles from './contact.module.css';
import fields from './fields.module.css';
import { useRise } from './rise';
import { Scene } from './Scene';
import { Words } from './Words';

/** The section's centre, in screen heights from the top: where the tide begins to come in … */
export const TIDE_FROM = 0.9;
/** … and where it is in. */
export const TIDE_AT = 0.42;
/** The tide is in past this: a stone drops under the button, once … */
export const HIGH = 0.9;
/** … and again only after the tide has gone back out below this. */
export const LOW = 0.3;

const navy = areas.find((a) => a.key === 'kunnskap')!;
const crimson = areas.find((a) => a.key === 'samfunnsdeltakelse')!;

/** What the foot says: the brief's sentence on cooperation and arrangements (Om oss, P4), the owner's choice of 2026-09-18. */
export const LINE = brief.about.paragraphs[3];

/** The CSS ground under the canvas with the tide `t` of the way in: the two areas' tokens mixed straight, for a device without WebGL2. */
export const groundAt = (t: number) => `color-mix(in srgb, var(${crimson.token}) ${(t * 100).toFixed(1)}%, var(${navy.token}))`;

/**
 * Kontakt at the foot of the home page, the owner's choice of 2026-09-18 (Flo): the sea
 * comes back. One plate of water in Kunnskap's navy, the brief's sentence on cooperation
 * and arrangements standing in it word by word; as the plate climbs to the middle of the
 * screen the tide comes in from the left in Samfunnsdeltakelse's crimson — the same retune
 * as between the fields at the top (`WaterHandle.retune`), the CSS ground under the canvas
 * mixing the same two colours for a device without WebGL2 — and the Kontakt pill turns
 * white as the water round it turns red. When the flood is in, a stone drops under the
 * button. Scrolled back below, the tide goes out again. For whoever wants to work with
 * the foundation, propose a debate, or bring something to it: the way on is Kontakt.
 *
 * `--o` is set per frame by `useRise` once the script runs and motion is wanted;
 * otherwise it is the stylesheet's 1, and the plate stands with the tide in.
 */
export function Contact() {
  const sec = useRef<HTMLElement>(null);
  const water = useRef<WaterHandle | InkHandle | null>(null);
  const button = useRef<HTMLAnchorElement>(null);
  const dropped = useRef(false);
  useRise(sec, TIDE_FROM, TIDE_AT, (t, el) => {
    const box = el.closest<HTMLElement>('[data-material]');
    if (!box) return;
    box.style.setProperty('--ground', groundAt(t));
    const w = water.current;
    if (w && 'retune' in w) w.retune(areaFloor(navy), areaFloor(crimson), t);
    if (!dropped.current && t > HIGH) {
      dropped.current = true;
      const canvas = box.querySelector('canvas');
      const b = button.current;
      if (w && canvas && b) {
        // The stone drops under the BUTTON: the canvas's 0–1 coordinates, y up.
        const r = b.getBoundingClientRect();
        const c = canvas.getBoundingClientRect();
        if (c.width && c.height) w.stir((r.left + r.width / 2 - c.left) / c.width, 1 - (r.top + r.height / 2 - c.top) / c.height);
      }
    } else if (dropped.current && t < LOW) {
      dropped.current = false;
    }
  });
  return (
    <Scene>
      <Box
        material="water"
        floor={areaFloor(navy)}
        tone="dark"
        ground="navy"
        className={`${fields.field} ${fields.navy} ${styles.box}`}
        calm
        onMaterial={(w) => { water.current = w; }}
      >
        <Arrive as="div">
          <section ref={sec} id="kontakt" aria-labelledby="kontakt-tittel" className={styles.section}>
            <h2 id="kontakt-tittel" className={styles.title}><Words text={LINE} /></h2>
            <p className={styles.more} data-prose>
              <Link ref={button} href={site.cta.contact.href} prefetch={false} className={styles.button}>{site.cta.contact.label}</Link>
            </p>
          </section>
        </Arrive>
      </Box>
    </Scene>
  );
}
