import Link from 'next/link';
import { Flat } from '@/components/materials/Flat';
import { Frame } from '@/components/materials/Frame';
import { site } from '@/content/site.no';
import { Arrive } from './Arrive';
import { Scene } from './Scene';
import styles from './sections.module.css';

/**
 * The rest of the site on the home page, in the guide's rhythm of material and white by
 * turns: Støtt oss as the pen-framed card on a navy plate that opens (Om oss, the white
 * plate with the doors, is About.tsx; Menneskene bak, the prints on the table, is
 * People.tsx). Each is the page's own words (the brief's) and its honest line while a
 * collection is empty; the title is the section's name and the menu is the way on — no
 * labels over the titles, no links under the sections. Each section arrives (`Arrive`):
 * the title rises out of its line, then the copy.
 */

const t = site.pages;

/** Støtt oss on a navy plate: the two numbers, bracketed until the foundation has them, and the brief's button. */
export function Support() {
  return (
    <Scene>
      <Flat tint="navy" className={`${styles.plate} ${styles.centre}`}>
        <Arrive as="div">
          <section id="stott-oss" aria-labelledby="stott-oss-tittel" className={styles.cardSection} data-card>
            <Frame legend={t.support.title} legendId="stott-oss-tittel" level="h2" className={styles.card}>
              <dl className={styles.facts}>
                <div>
                  <dt>{site.support.vipps.label}</dt>
                  <dd>{site.support.vipps.value}</dd>
                </div>
                <div>
                  <dt>{site.support.account.label}</dt>
                  <dd>{site.support.account.value}</dd>
                </div>
              </dl>
              <p className={styles.more}>
                <Link href={site.cta.support.href} prefetch={false} className={styles.buttonCrimson}>{site.cta.support.label}</Link>
              </p>
            </Frame>
          </section>
        </Arrive>
      </Flat>
    </Scene>
  );
}
