import type { Metadata } from 'next';
import styles from '@/components/site/page.module.css';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';

export const metadata: Metadata = {
  title: site.pages.about.title,
  description: site.pages.about.description,
};

/** Om oss: the brief's text (5), and the story of the name in the user's own words. */
export default function OmOss() {
  return (
    <article className={styles.page}>
      <p className={styles.eyebrow}>{site.pages.about.label}</p>
      <h1 className={styles.title}>{brief.about.title}</h1>
      <div className={styles.prose}>
        {brief.about.paragraphs.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>
      <section className={styles.section} aria-labelledby="navnet">
        <h2 id="navnet">{site.pages.about.story.label}</h2>
        <p>{site.pages.about.story.text}</p>
      </section>
    </article>
  );
}
