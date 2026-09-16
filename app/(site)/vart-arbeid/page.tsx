import type { Metadata } from 'next';
import { Bands } from '@/components/home/Bands';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import styles from './work.module.css';

export const metadata: Metadata = {
  title: site.pages.work.title,
  description: site.pages.work.description,
};

/**
 * Vårt arbeid: the four areas (6), each its own section and its own plate of water in its
 * colour, each linkable by its key. The title and the mission headline as the lede stand
 * on the page's white above the first plate.
 */
export default function VartArbeid() {
  return (
    <article className={styles.work} data-plates>
      <header className={styles.head}>
        <h1 className={styles.title}>{site.pages.work.title}</h1>
        <p className={styles.lede}>{brief.mission.headline}</p>
      </header>
      <Bands />
    </article>
  );
}
