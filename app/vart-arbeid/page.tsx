import type { Metadata } from 'next';
import styles from '@/components/site/page.module.css';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';

export const metadata: Metadata = {
  title: site.pages.work.title,
  description: site.pages.work.description,
};

/** Vårt arbeid: the four areas (6), each its own section, each linkable by its key. */
export default function VartArbeid() {
  return (
    <article className={styles.page}>
      <p className={styles.eyebrow}>{site.pages.work.label}</p>
      <h1 className={styles.title}>{site.pages.work.title}</h1>
      <p className={styles.lede}>{brief.mission.headline}</p>
      {brief.areas.map((a) => (
        <section key={a.key} id={a.key} className={styles.section} aria-labelledby={`${a.key}-tittel`}>
          <h2 id={`${a.key}-tittel`}>{a.name}</h2>
          <p>{a.text}</p>
        </section>
      ))}
    </article>
  );
}
