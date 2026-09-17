'use client';

import type { CSSProperties } from 'react';
import { Flat } from '@/components/materials/Flat';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { areas } from './areas';
import { Arrive } from './Arrive';
import { Scene } from './Scene';
import styles from './seal.module.css';
import { Words } from './Words';

/**
 * Visjon and Misjon as a seal, on one navy plate: the vision — its name, its statement
 * word by word, the full stop the logo's dot — inside the mark's ring, a turquoise
 * hairline that draws itself from twelve as the section arrives, the four areas' names
 * twice round it in slow orbit, the crimson dot at twelve; the vision's paragraph and the
 * mission in the column beside; stacked on a phone. R, the owner's choice of 2026-09-17.
 */

const t = site.pages.home;
/** The four names twice round: once round fell short of the circle and was stretched letter by letter. */
export const INSCRIPTION = (areas.map((a) => a.name).join('  ·  ') + '  ·  ').repeat(2);
/** The ring's radius and the inscription's, in the seal's 100-unit box. */
const R = 47;
const R_TEXT = 40.5;

export function Seal() {
  return (
    <Scene>
      <Flat tint="navy" className={styles.plate}>
        <Arrive as="div">
          <div className={styles.row}>
            <section id="visjon" aria-labelledby="visjon-tittel" className={styles.vision}>
              <div className={styles.seal}>
                <svg className={styles.ring} viewBox="0 0 100 100" aria-hidden="true">
                  <defs>
                    <path id="segl-bane" d={`M50,50 m-${R_TEXT},0 a${R_TEXT},${R_TEXT} 0 1,1 ${R_TEXT * 2},0 a${R_TEXT},${R_TEXT} 0 1,1 -${R_TEXT * 2},0`} />
                  </defs>
                  <circle className={styles.line} cx="50" cy="50" r={R} pathLength="100" />
                  <g className={styles.orbit}>
                    {/* The spaces kept: collapsed, the trailing «  ·  » loses them and the last dot sits on the first name where the text meets itself. */}
                    <text className={styles.inscription} xmlSpace="preserve">
                      <textPath href="#segl-bane" textLength={(2 * Math.PI * R_TEXT).toFixed(2)} lengthAdjust="spacing">{INSCRIPTION}</textPath>
                    </text>
                  </g>
                  <circle className={styles.dot} cx="50" cy={50 - R} r="2.1" />
                </svg>
                <div className={styles.inside}>
                  <h2 id="visjon-tittel" className={styles.name}>{t.visionLabel}</h2>
                  <p className={styles.statement}><Words text={brief.vision.headline} /></p>
                </div>
              </div>
              <p className={styles.lead} data-prose>{brief.vision.paragraph}</p>
            </section>
            <section id="misjon" aria-labelledby="misjon-tittel" className={styles.mission} data-card style={{ '--i': 1 } as CSSProperties}>
              <hr className={styles.rule} />
              <h2 id="misjon-tittel" className={styles.name}>{t.missionLabel}</h2>
              <p className={styles.headline}>{brief.mission.headline}</p>
              <p className={styles.text}>{brief.mission.paragraph}</p>
            </section>
          </div>
        </Arrive>
      </Flat>
    </Scene>
  );
}
