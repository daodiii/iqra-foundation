import type { Metadata } from 'next';
import styles from '@/components/site/page.module.css';
import { site } from '@/content/site.no';

export const metadata: Metadata = {
  title: site.pages.contact.title,
  description: site.pages.contact.description,
};

/** Kontakt: the address and the organisation number, bracketed until they exist. No form: it would have nowhere to go. */
export default function Kontakt() {
  const t = site.pages.contact;
  return (
    <article className={styles.page}>
      <p className={styles.eyebrow}>{t.label}</p>
      <h1 className={styles.title}>{t.title}</h1>
      <p className={styles.lede}>{t.description}</p>
      <dl className={styles.facts}>
        <div>
          <dt>{t.emailLabel}</dt>
          <dd>
            <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
          </dd>
        </div>
        <div>
          <dt>{t.orgnrLabel}</dt>
          <dd>{site.contact.orgnr}</dd>
        </div>
        <div>
          <dt>{t.placeLabel}</dt>
          <dd>{site.place}</dd>
        </div>
      </dl>
    </article>
  );
}
