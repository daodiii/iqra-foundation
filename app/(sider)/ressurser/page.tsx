import type { Metadata } from 'next';
import { Bokryggene } from '@/components/ressurser/Bokryggene';
import { Utgivelse } from '@/components/ressurser/Utgivelse';
import styles from '@/components/ressurser/bokryggene.module.css';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import { getResources } from '@/lib/content';

export const metadata: Metadata = {
  title: site.pages.resources.title,
  description: site.pages.resources.description,
};

const t = site.pages.resources;

/**
 * Ressurser: the library (M5 and D6, 2026-11-18), set as 19 «Bokryggene» (2026-11-20). The client's
 * intro, then the four categories in their order — Publikasjoner og rapporter, Artikler og fagstoff,
 * Videoer og presentasjoner, Styringsdokumenter — each a book on the shelf with its own anchor, the
 * client's text where they gave one, and what is published in it, newest first. A video plays on the
 * page. Everything is added and changed in the admin (the `ressurser` collection, by category).
 */
export default function Ressurser() {
  const items = getResources();
  const r = klient.resources;
  const books = r.categories.map((c) => {
    const inIt = items.filter((i) => i.category === c.key);
    return {
      key: c.key,
      title: c.title,
      text: c.text,
      body: inIt.length ? (
        <ul className={styles.list}>
          {inIt.map((i) => (
            <Utgivelse key={i.slug} r={i} />
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>{t.empty}</p>
      ),
    };
  });
  return <Bokryggene title={r.title} intro={r.intro} books={books} />;
}
