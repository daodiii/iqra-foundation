import { Events } from '@/components/home/Events';
import { Hero } from '@/components/home/Hero';
import { Mosaic } from '@/components/home/Mosaic';
import styles from '@/components/home/scene.module.css';
import { Seal } from '@/components/home/Seal';
import { OmOss, People, Support } from '@/components/home/Sections';
import { getEvents, getPeople, splitEvents, todayISO } from '@/lib/content';

/**
 * Hjem: the whole site in one page. The film inside the mark with the brief's main text
 * (2) and its two buttons; the four areas (6) as four fields of water, one mosaic; Visjon
 * and Misjon (3, 4) as a seal on navy; Om oss (5) on white; Arrangementer as the next
 * event on navy; Menneskene bak (7) on white; Støtt oss on navy. Every plate is laid out
 * at the page's full width and opens to the screen as it is read (`Scene`); every section
 * arrives as the tip line reaches it (`Arrive`). The menu is the way on from each.
 */
export default function Home() {
  const { upcoming } = splitEvents(getEvents(), todayISO());
  return (
    <>
      <Hero />
      <div className={styles.stage}>
        <Mosaic />
        <Seal />
      </div>
      <OmOss />
      <div className={styles.stage}>
        <Events upcoming={upcoming} />
      </div>
      <People people={getPeople()} />
      <div className={styles.stage}>
        <Support />
      </div>
    </>
  );
}
