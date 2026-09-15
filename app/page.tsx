import Link from 'next/link';
import styles from '@/components/site/page.module.css';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';

/**
 * Hjem: the brief's main text (2) with its two buttons, Visjon and Misjon (3, 4), and the
 * four areas as the through-line. Short, by the brief's own instruction; the menu does
 * the rest.
 */
export default function Home() {
  return (
    <>
      <section className={styles.page} aria-labelledby="hovedtekst">
        <h1 id="hovedtekst" className={styles.title}>{brief.home.headline}</h1>
        <p className={styles.lede}>{brief.home.paragraph}</p>
        <p className={styles.buttons}>
          <Link href={site.cta.work.href} prefetch={false} className={styles.button}>{site.cta.work.label}</Link>
          <Link href={site.cta.support.href} prefetch={false} className={styles.buttonSecondary}>{site.cta.support.label}</Link>
        </p>
      </section>
      <section className={`${styles.page} ${styles.section}`} aria-labelledby="visjon" id="visjon">
        <p className={styles.eyebrow}>{site.pages.home.visionLabel}</p>
        <h2 id="visjon-tittel">{brief.vision.headline}</h2>
        <p>{brief.vision.paragraph}</p>
      </section>
      <section className={`${styles.page} ${styles.section}`} aria-labelledby="misjon-tittel" id="misjon">
        <p className={styles.eyebrow}>{site.pages.home.missionLabel}</p>
        <h2 id="misjon-tittel">{brief.mission.headline}</h2>
        <p>{brief.mission.paragraph}</p>
      </section>
      <section className={`${styles.page} ${styles.section}`} aria-labelledby="omrader-tittel" id="omrader">
        <h2 id="omrader-tittel">{site.pages.home.areasLabel}</h2>
        <ul className={styles.areas}>
          {brief.areas.map((a) => (
            <li key={a.key} className={styles.area}>
              <h3><Link href={`/vart-arbeid#${a.key}`} prefetch={false}>{a.name}</Link></h3>
              <p>{a.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
