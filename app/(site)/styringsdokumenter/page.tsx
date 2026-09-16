import type { Metadata } from 'next';
import styles from '@/components/site/page.module.css';
import { site } from '@/content/site.no';
import { getDocuments } from '@/lib/content';

export const metadata: Metadata = {
  title: site.pages.documents.title,
  description: site.pages.documents.description,
};

/** Styringsdokumenter: vedtekter, årsrapporter, årsregnskap, strategier — the `styringsdokumenter` collection. */
export default function Styringsdokumenter() {
  const docs = getDocuments();
  const t = site.pages.documents;
  return (
    <article className={styles.page}>
      <p className={styles.eyebrow}>{t.label}</p>
      <h1 className={styles.title}>{t.title}</h1>
      <p className={styles.lede}>{t.description}</p>
      <section className={styles.section} aria-label={t.title}>
        {docs.length ? (
          <ul className={styles.list}>
            {docs.map((d) => (
              <li key={d.slug} className={styles.item}>
                <h3>
                  <a href={d.file}>{d.title}</a>
                </h3>
                <p className={styles.meta}>
                  {t.kinds[d.kind]} · {d.year}
                </p>
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
