import type { Metadata } from 'next';
import styles from '@/components/site/page.module.css';
import { PageTitle } from '@/components/site/PageTitle';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import { getResources, type Resource } from '@/lib/content';
import { writeDate } from '@/lib/dates';

export const metadata: Metadata = {
  title: site.pages.resources.title,
  description: site.pages.resources.description,
};

const t = site.pages.resources;

/** One resource: its title (a link to the file or the page), its date, its summary, and the video itself when it is one. */
function Item({ r }: { r: Resource }) {
  const href = r.file ?? r.url;
  return (
    <li className={styles.item}>
      <h3>{href ? <a href={href}>{r.title}</a> : r.title}</h3>
      <p className={styles.meta}>
        <time dateTime={r.date}>{writeDate(r.date)}</time>
      </p>
      {r.video && (
        <video className={styles.video} src={r.video} controls preload="metadata" playsInline />
      )}
      <p>{r.summary}</p>
      {r.file && <p className={styles.meta}><a href={r.file}>{t.download}</a></p>}
      {!r.file && r.url && <p className={styles.meta}><a href={r.url}>{t.open}</a></p>}
    </li>
  );
}

/**
 * Ressurser: the library (M5 and D6, 2026-11-18). The client's intro, then the four
 * categories in their order — Publikasjoner og rapporter, Artikler og fagstoff, Videoer og
 * presentasjoner, Styringsdokumenter — each a section with its own anchor, the client's text
 * where they gave one, and what is published in it, newest first. A video plays on the page.
 * Everything is added and changed in the admin (the `ressurser` collection, by category).
 */
export default function Ressurser() {
  const items = getResources();
  const r = klient.resources;
  return (
    <article className={styles.page}>
      <PageTitle href="/ressurser" className={styles.title}>{r.title}</PageTitle>
      <p className={styles.lede}>{r.intro}</p>
      <nav className={styles.jump} aria-label={t.categoriesLabel}>
        <ul>
          {r.categories.map((c) => (
            <li key={c.key}>
              <a href={`#${c.key}`}>{c.title}</a>
            </li>
          ))}
        </ul>
      </nav>
      {r.categories.map((c) => {
        const inIt = items.filter((i) => i.category === c.key);
        return (
          <section key={c.key} id={c.key} className={styles.section} aria-labelledby={`${c.key}-tittel`}>
            <h2 id={`${c.key}-tittel`}>{c.title}</h2>
            {c.text && <p>{c.text}</p>}
            {inIt.length ? (
              <ul className={styles.list}>
                {inIt.map((i) => <Item key={i.slug} r={i} />)}
              </ul>
            ) : (
              <p className={styles.empty}>{t.empty}</p>
            )}
          </section>
        );
      })}
    </article>
  );
}
