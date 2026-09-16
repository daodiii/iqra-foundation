import { Fields } from '@/components/home/Fields';
import { Hero } from '@/components/home/Hero';
import styles from '@/components/home/home.module.css';
import { EventsAndResources, OmOss, People, Support } from '@/components/home/Sections';
import { Thread } from '@/components/home/Thread';
import { Box } from '@/components/materials/Box';
import { Frame } from '@/components/materials/Frame';
import mat from '@/components/materials/materials.module.css';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { getEvents, getPeople, getResources, splitEvents, todayISO } from '@/lib/content';

/**
 * Hjem: the whole site in one page, in the guide's rhythm of material and white. The film
 * inside the mark with the brief's main text (2) and its two buttons; Visjon and Misjon
 * (3, 4) as two pen-framed cards on one box of the brand's ink; the four areas (6) as four
 * fields of water, each in its own colour, each a link to its section of Vårt arbeid; then
 * Om oss (5) on white, Arrangementer and Ressurser on one box of water, Menneskene bak (7)
 * on white, Støtt oss on the ink, each the way on to its page. The red thread (9) is drawn
 * down the page past all of them, from the mark's dot to the footer's four words.
 */
export default function Home() {
  const { upcoming } = splitEvents(getEvents(), todayISO());
  return (
    <>
      <Hero />
      <div className={styles.plates} data-plates>
        <Box material="ink" className={styles.inkBox}>
          <div className={styles.pair}>
            <section aria-labelledby="visjon-tittel" id="visjon" data-knot>
              <Frame legend={site.pages.home.visionLabel} legendId="visjon-tittel" level="h2">
                <h3 className={mat.title}>{brief.vision.headline}</h3>
                <p className={mat.text}>{brief.vision.paragraph}</p>
              </Frame>
            </section>
            <section aria-labelledby="misjon-tittel" id="misjon">
              <Frame legend={site.pages.home.missionLabel} legendId="misjon-tittel" level="h2">
                <h3 className={mat.title}>{brief.mission.headline}</h3>
                <p className={mat.text}>{brief.mission.paragraph}</p>
              </Frame>
            </section>
          </div>
        </Box>
        <div data-knot>
          <Fields />
        </div>
      </div>
      <OmOss />
      <EventsAndResources upcoming={upcoming} resources={getResources()} />
      <People people={getPeople()} />
      <Support />
      <Thread />
    </>
  );
}
