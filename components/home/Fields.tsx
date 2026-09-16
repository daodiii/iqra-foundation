import Link from 'next/link';
import { Box } from '@/components/materials/Box';
import { Logo } from '@/components/site/Logo';
import { site } from '@/content/site.no';
import { areaFloor, areas, type Area } from './areas';
import styles from './fields.module.css';

/**
 * What every field carries, on the home page and opened out as a band on Vårt arbeid:
 * the name, the brief's text, and the guide's logo for the ground, in the corner,
 * decorative because the name is the text beside it. No number: the colour and the name
 * say which area this is.
 */
export function FieldBody({ area, headingId, level: Heading = 'h3' }: { area: Area; headingId: string; level?: 'h2' | 'h3' }) {
  return (
    <>
      <Heading id={headingId} className={styles.name}>{area.name}</Heading>
      <p className={styles.text}>{area.text}</p>
      <span className={styles.logo}>
        <Logo ground={area.ground} height={28} decorative />
      </span>
    </>
  );
}

/**
 * The four areas as four fields of water, each over its own colour, 2×2 from 900px and a
 * column below, edge to edge inside one rounded plate — the guide's colour panel, in
 * water. Each field is one link to its section of Vårt arbeid, named by its heading. The
 * water is built when the field is near and the page is quiet (`Box`), and a field on a
 * dark ground takes light type and the light pen.
 */
export function Fields() {
  return (
    <section aria-label={site.pages.home.areasLabel} className={styles.plate}>
      <ul className={styles.grid} data-fields>
        {areas.map((a) => (
          <li key={a.key} className={styles.item}>
            <Box material="water" floor={areaFloor(a)} tone={a.tone} ground={a.ground} className={`${styles.field} ${styles[a.ground]}`}>
              <Link href={a.href} prefetch={false} className={styles.cell} aria-labelledby={`felt-${a.key}`}>
                <FieldBody area={a} headingId={`felt-${a.key}`} />
              </Link>
            </Box>
          </li>
        ))}
      </ul>
    </section>
  );
}
