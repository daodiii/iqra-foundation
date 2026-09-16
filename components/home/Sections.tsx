import Link from 'next/link';
import { Box } from '@/components/materials/Box';
import { Frame } from '@/components/materials/Frame';
import mat from '@/components/materials/materials.module.css';
import { MarkedLine } from '@/components/site/AreaMark';
import page from '@/components/site/page.module.css';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import type { Event, Person, Resource } from '@/lib/content';
import { writeDate, writeDateTime } from '@/lib/dates';
import styles from './sections.module.css';

/**
 * The rest of the site on the home page, after the four fields, in the guide's rhythm of
 * material and white by turns: Om oss on white, Arrangementer and Ressurser as two
 * pen-framed cards on one box of the brand's water, Menneskene bak on white, Støtt oss on
 * the ink. Each is the page's own words (the brief's) and the way on to the page; the lists
 * are the collections, with their honest lines while they are empty. Every section is a
 * knot on the thread (`data-knot`, level with its label).
 */

export type Collections = { upcoming: Event[]; resources: Resource[]; people: Person[] };

const t = site.pages;
const more = t.home.more;

export function OmOss() {
  return (
    <section id="om-oss" className={styles.white} aria-labelledby="om-oss-tittel" data-knot>
      <p className={page.eyebrow} data-knot-at>{t.about.label}</p>
      <h2 id="om-oss-tittel" className={styles.title}>{brief.about.title}</h2>
      <div className={styles.prose}>
        <p>{brief.about.paragraphs[0]}</p>
        <p><MarkedLine text={brief.about.paragraphs[1]} /></p>
      </div>
      <p className={styles.more}>
        <Link href="/om-oss" prefetch={false} className={styles.link}>{more.about}</Link>
      </p>
    </section>
  );
}

function Events({ items }: { items: Event[] }) {
  if (!items.length) return <p className={styles.empty}>{t.events.emptyUpcoming}</p>;
  return (
    <ul className={styles.list}>
      {items.slice(0, 3).map((e) => (
        <li key={e.slug} className={styles.item}>
          <h3>{e.title}</h3>
          <p className={styles.meta}>
            <time dateTime={e.time ? `${e.start}T${e.time}` : e.start}>{writeDateTime(e.start, e.time)}</time>
            {' · '}
            {e.place}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Resources({ items }: { items: Resource[] }) {
  if (!items.length) return <p className={styles.empty}>{t.resources.empty}</p>;
  return (
    <ul className={styles.list}>
      {items.slice(0, 3).map((r) => (
        <li key={r.slug} className={styles.item}>
          <h3>{r.title}</h3>
          <p className={styles.meta}>
            {t.resources.kinds[r.kind]}
            {' · '}
            <time dateTime={r.date}>{writeDate(r.date)}</time>
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Arrangementer and Ressurser, side by side on one box of the brand's water. */
export function EventsAndResources({ upcoming, resources }: Pick<Collections, 'upcoming' | 'resources'>) {
  return (
    <div className={styles.plates}>
      <Box material="water" className={styles.plate}>
        <div className={styles.pair}>
          <section id="arrangementer" aria-labelledby="arrangementer-tittel" className={styles.cardSection} data-knot>
            <Frame legend={t.events.title} legendId="arrangementer-tittel" level="h2" className={styles.card}>
              <p className={mat.text}>{t.events.description}</p>
              <Events items={upcoming} />
              <p className={styles.more}>
                <Link href="/arrangementer" prefetch={false} className={styles.linkOnCard}>{more.events}</Link>
              </p>
            </Frame>
          </section>
          <section id="ressurser" aria-labelledby="ressurser-tittel" className={styles.cardSection}>
            <Frame legend={t.resources.title} legendId="ressurser-tittel" level="h2" className={styles.card}>
              <p className={mat.text}>{t.resources.description}</p>
              <Resources items={resources} />
              <p className={styles.more}>
                <Link href="/ressurser" prefetch={false} className={styles.linkOnCard}>{more.resources}</Link>
              </p>
            </Frame>
          </section>
        </div>
      </Box>
    </div>
  );
}

export function People({ people }: Pick<Collections, 'people'>) {
  return (
    <section id="menneskene-bak" className={styles.white} aria-labelledby="menneskene-bak-tittel" data-knot>
      <p className={page.eyebrow} data-knot-at>{t.people.label}</p>
      <h2 id="menneskene-bak-tittel" className={styles.title}>{brief.people.title}</h2>
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
      <p className={styles.more}>
        <Link href="/menneskene-bak" prefetch={false} className={styles.link}>{more.people}</Link>
      </p>
    </section>
  );
}

/** Støtt oss on the ink: the two numbers, bracketed until the foundation has them, and the brief's button. */
export function Support() {
  return (
    <div className={styles.plates}>
      <Box material="ink" className={`${styles.plate} ${styles.centre}`}>
        <section id="stott-oss" aria-labelledby="stott-oss-tittel" className={styles.cardSection} data-knot>
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
      </Box>
    </div>
  );
}
