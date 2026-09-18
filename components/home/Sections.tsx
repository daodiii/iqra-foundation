import page from '@/components/site/page.module.css';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import type { Event, Person, Resource } from '@/lib/content';
import { Arrive } from './Arrive';
import styles from './sections.module.css';

/**
 * The rest of the site on the home page, in the guide's rhythm of material and white by
 * turns: Menneskene bak on white (Om oss, the white plate with the doors, is About.tsx;
 * Kontakt, the plate of water at the foot, is Contact.tsx). The page's own words (the
 * brief's) and its honest line while a collection is empty; the title is the section's
 * name and the menu is the way on — no labels over the titles, no links under the
 * sections. Each section arrives (`Arrive`): the title rises out of its line, then the
 * copy.
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
