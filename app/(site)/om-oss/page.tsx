import type { Metadata } from 'next';
import styles from '@/components/site/page.module.css';
import { PageTitle } from '@/components/site/PageTitle';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';

export const metadata: Metadata = {
  title: site.pages.about.title,
  description: site.pages.about.description,
};

const t = klient.about;

/**
 * Om Iqra Foundation: the client's text (D2, 2026-11-18), every section in their order and
 * in their words — the foundation and its supervision, the name, the purpose, the values,
 * who it is for, and its independence.
 */
export default function OmOss() {
  return (
    <article className={styles.page}>
      <PageTitle href="/om-oss" className={styles.title}>{t.title}</PageTitle>
      <p className={styles.lede}>{t.intro}</p>

      <section className={styles.section} aria-labelledby="navnet">
        <h2 id="navnet">{t.name.title}</h2>
        <p>{t.name.text}</p>
      </section>

      <section className={styles.section} aria-labelledby="formal">
        <h2 id="formal">{t.purpose.title}</h2>
        <p>{t.purpose.lead}</p>
        <ul className={styles.points}>
          {t.purpose.points.map((p) => <li key={p}>{p}</li>)}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="verdigrunnlag">
        <h2 id="verdigrunnlag">{t.values.title}</h2>
        <p>{t.values.lead}</p>
        <ul className={styles.points}>
          {t.values.points.map((v) => (
            <li key={v.name}>
              <strong>{v.name}</strong> – {v.text}
            </li>
          ))}
        </ul>
        <p>{t.values.close}</p>
      </section>

      <section className={styles.section} aria-labelledby="hvem">
        <h2 id="hvem">{t.audience.title}</h2>
        <p>{t.audience.text}</p>
      </section>

      <section className={styles.section} aria-labelledby="stiftelse">
        <h2 id="stiftelse">{t.independent.title}</h2>
        {t.independent.paragraphs.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
      </section>
    </article>
  );
}
