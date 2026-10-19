import styles from '@/components/site/page.module.css';

type Section = { id: string; heading: string; paragraphs: readonly string[]; list?: readonly string[] };

/**
 * A legal page: the one layout of the subpages (page.module.css) with its sections under hairlines, and the
 * date it was last changed under them. Plain text, read top to bottom; nothing here moves.
 */
export function LegalPage({ title, lede, sections, updated }: { title: string; lede: string; sections: readonly Section[]; updated: string }) {
  return (
    <article className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lede}>{lede}</p>
      {sections.map((s) => (
        <section key={s.id} className={styles.section} aria-labelledby={s.id}>
          <h2 id={s.id}>{s.heading}</h2>
          {s.paragraphs.map((p) => (
            <p key={p.slice(0, 32)}>{p}</p>
          ))}
          {s.list && (
            <ul>
              {s.list.map((li) => (
                <li key={li}>{li}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
      <p className={styles.section}>Sist oppdatert {updated}.</p>
    </article>
  );
}
