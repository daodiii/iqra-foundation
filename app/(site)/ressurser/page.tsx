import type { Metadata } from 'next';
import { AreaMark } from '@/components/site/AreaMark';
import { COLUMN_SIZES } from '@/components/site/column';
import { Frame } from '@/components/site/Frame';
import { Linked } from '@/components/site/Linked';
import styles from '@/components/site/page.module.css';
import { site } from '@/content/site.no';
import { getResources } from '@/lib/content';
import { writeDate } from '@/lib/dates';

export const metadata: Metadata = {
  title: site.pages.resources.title,
  description: site.pages.resources.description,
};

/**
 * Ressurser: publications, articles, reports, presentations, videos — the `ressurser`
 * collection, published only. An article written here (a full text) goes to its own page;
 * the rest go to their file or their address elsewhere.
 */
export default function Ressurser() {
  const items = getResources();
  const t = site.pages.resources;
  return (
    <article className={styles.page}>
      <p className={styles.eyebrow}>{t.label}</p>
      <h1 className={styles.title}>{t.title}</h1>
      <p className={styles.lede}>{t.description}</p>
      <section className={styles.section} aria-label={t.title}>
        {items.length ? (
          <ul className={styles.list}>
            {items.map((r) => (
              <li key={r.slug} className={styles.item}>
                <h3>
                  <Linked href={r.body ? `/ressurser/${r.slug}` : (r.file ?? r.url)}>{r.title}</Linked>
                </h3>
                {r.area && (
                  <p className={styles.meta}>
                    <AreaMark area={r.area} />
                  </p>
                )}
                <p className={styles.meta}>
                  {t.kinds[r.kind]} · <time dateTime={r.date}>{writeDate(r.date)}</time>
                </p>
                <p>{r.summary}</p>
                {r.image && <Frame picture={r.image} sizes={COLUMN_SIZES} className={styles.picture} />}
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
