import Link from 'next/link';
import { Flat } from '@/components/materials/Flat';
import { Frame } from '@/components/materials/Frame';
import page from '@/components/site/page.module.css';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import type { Event, Person, Resource } from '@/lib/content';
import { Arrive } from './Arrive';
import { Scene } from './Scene';
import styles from './sections.module.css';

/**
 * The rest of the site on the home page, in the guide's rhythm of material and white by
 * turns: Menneskene bak on white, Støtt oss as the pen-framed card on a navy plate that
 * opens (Om oss, the white plate with the doors, is About.tsx). Each is the page's own
 * words (the brief's) and its honest line while a collection is empty; the title is the
 * section's name and the menu is the way on — no labels over the titles, no links under
 * the sections. Each section arrives (`Arrive`): the title rises out of its line, then
 * the copy.
 */

export type Collections = { upcoming: Event[]; resources: Resource[]; people: Person[] };

const t = site.pages;

export function People({ people }: Pick<Collections, 'people'>) {
  return (
    <Arrive as="section" id="menneskene-bak" className={styles.white} aria-labelledby="menneskene-bak-tittel">
      <h2 id="menneskene-bak-tittel" className={styles.title} data-title>{brief.people.title}</h2>
      <div data-prose>
        <p className={page.lede}>{brief.people.paragraph}</p>
        {people.length ? (
          <ul className={styles.list}>
            {people.slice(0, 4).map((p) => (
              <li key={p.slug} className={styles.item}>
                <h3>{p.name}</h3>
                <p className={styles.meta}>{p.role}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>{t.people.empty}</p>
        )}
      </div>
    </Arrive>
  );
}

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
