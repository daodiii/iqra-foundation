import { Box } from '@/components/materials/Box';
import { areaFloor, areas } from './areas';
import { FieldBody } from './Fields';
import styles from './fields.module.css';
import work from '@/app/(site)/vart-arbeid/work.module.css';

/**
 * The four areas down Vårt arbeid: the home page's fields opened out, one plate of water
 * each in its colour, taller, the name an h2 and the whole area's text beside it. Each
 * section carries its key as id, so `/vart-arbeid#dialog` lands on it under the header.
 */
export function Bands() {
  return (
    <div className={work.plates}>
      {areas.map((a) => (
        <section key={a.key} id={a.key} className={work.area} aria-labelledby={`${a.key}-tittel`}>
          <Box material="water" floor={areaFloor(a)} tone={a.tone} ground={a.ground} className={`${styles.field} ${styles.band} ${styles[a.ground]}`}>
            <div className={styles.bandBody}>
              <FieldBody area={a} headingId={`${a.key}-tittel`} level="h2" />
            </div>
          </Box>
        </section>
      ))}
    </div>
  );
}
