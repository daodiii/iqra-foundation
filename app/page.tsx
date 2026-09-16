import { Hero } from '@/components/home/Hero';
import styles from '@/components/home/home.module.css';
import { Box } from '@/components/materials/Box';
import { Frame } from '@/components/materials/Frame';
import mat from '@/components/materials/materials.module.css';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';

/**
 * Hjem, in three plates and nothing else: the film inside the mark with the brief's main
 * text (2) and its two buttons; Visjon and Misjon (3, 4) as two pen-framed cards on one
 * box of ink; the four areas (6) as four framed cards on one box of water, each a link to
 * its section of Vårt arbeid. Short, by the brief's own instruction; the menu does the rest.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <div className={styles.plates} data-plates>
        <Box material="ink" className={styles.inkBox}>
          <div className={styles.pair}>
            <section aria-labelledby="visjon-tittel" id="visjon">
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
        <section aria-labelledby="omrader-tittel" id="omrader">
          <Box material="water" className={styles.waterBox}>
            <h2 id="omrader-tittel" className="visually-hidden">{site.pages.home.areasLabel}</h2>
            <ul className={styles.areas}>
              {brief.areas.map((a) => (
                <li key={a.key}>
                  <Frame legend={a.name} level="h3" href={`/vart-arbeid#${a.key}`} dot>
                    <p className={mat.text}>{a.text}</p>
                  </Frame>
                </li>
              ))}
            </ul>
          </Box>
        </section>
      </div>
    </>
  );
}
