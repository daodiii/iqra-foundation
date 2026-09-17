import { About } from '@/components/home/About';
import { Events } from '@/components/home/Events';
import { Hero } from '@/components/home/Hero';
import styles from '@/components/home/scene.module.css';
import { Sea } from '@/components/home/Sea';
import { Seal } from '@/components/home/Seal';
import { People, Support } from '@/components/home/Sections';
import { getEvents, getPeople, splitEvents, todayISO } from '@/lib/content';

/**
 * Neste is the next event by today's date, and the page is prerendered — so once an
 * event's instant had passed it stayed «next» at a count of zeros until the next deploy.
 * Regenerated at most once an hour, on the first visit after the hour; the records are read
 * from disk then, so `next.config.ts` traces `content/` into this route's function.
 */
export const revalidate = 3600;

/**
 * Hjem: the whole site in one page. The film inside the mark with the brief's main text
 * (2) and its two buttons; the four areas (6) as one sea straight under it, each a tide of
 * its colour the scroll pulls across (Havet); Visjon and Misjon (3, 4) as a seal on navy;
 * Om oss (5) as a white plate whose doors open on the whole text; Arrangementer as the
 * next event on navy; Menneskene bak (7) on white; Støtt oss on navy. Every plate after the sea is laid out at the page's full width
 * and opens to the screen as it is read (`Scene`); every section arrives as the tip line
 * reaches it (`Arrive`). The menu is the way on from each.
 */
export default function Home() {
  const { upcoming } = splitEvents(getEvents(), todayISO());
  return (
    <>
      <Hero />
      <Sea />
      <div className={styles.stage}>
        <Seal />
      </div>
      <About />
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
