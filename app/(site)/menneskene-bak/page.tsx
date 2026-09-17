import type { Metadata } from 'next';
import styles from '@/components/site/page.module.css';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { getPeople } from '@/lib/content';

export const metadata: Metadata = {
  title: site.pages.people.title,
  description: site.pages.people.description,
};

/**
 * Menneskene bak Iqra: the board paragraph (7) now, and the structure for names, photos,
 * roles and short bios later — the `menneskene` collection, empty until the foundation
 * fills it.
 */
export default function MenneskeneBak() {
  const people = getPeople();
  const t = site.pages.people;
  return (
    <article className={styles.page}>
      <p className={styles.eyebrow}>{t.label}</p>
      <h1 className={styles.title}>{brief.people.title}</h1>
      <p className={styles.lede}>{brief.people.paragraph}</p>
      <section className={styles.section} aria-label={t.title}>
        {people.length ? (
          <ul className={styles.list}>
            {people.map((p) => (
              <li key={p.slug} className={styles.item}>
                {p.photo && <img src={p.photo.src} alt={p.photo.alt} loading="lazy" />}
                <h3>{p.name}</h3>
                <p className={styles.meta}>{p.role}</p>
                <p>{p.bio}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>{t.empty}</p>
        )}
      </section>
    </article>
  );
}
