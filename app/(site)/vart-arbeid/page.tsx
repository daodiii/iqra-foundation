import type { Metadata } from 'next';
import styles from '@/components/site/page.module.css';
import { PageTitle } from '@/components/site/PageTitle';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';

export const metadata: Metadata = {
  title: site.pages.work.title,
  description: site.pages.work.description,
};

const t = klient.work;

/** A heading as an anchor: «Dialog og gjensidig forståelse» → `dialog-og-gjensidig-forstaelse`. */
function anchor(title: string) {
  return title
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Vårt arbeid: the client's text (D3, 2026-11-18), the intro and the areas of work in their
 * order, each a section with its own anchor. The client's intro says six areas and lists
 * seven; all seven stand here as written until the client says otherwise (their question Q2).
 */
export default function VartArbeid() {
  return (
    <article className={styles.page}>
      <PageTitle href="/vart-arbeid" className={styles.title}>{t.title}</PageTitle>
      <p className={styles.lede}>{t.intro}</p>
      {t.areas.map((a) => {
        const id = anchor(a.title);
        return (
          <section key={id} id={id} className={styles.section} aria-labelledby={`${id}-tittel`}>
            <h2 id={`${id}-tittel`}>{a.title}</h2>
            <p>{a.text}</p>
            {'note' in a && <p>{a.note}</p>}
          </section>
        );
      })}
    </article>
  );
}
