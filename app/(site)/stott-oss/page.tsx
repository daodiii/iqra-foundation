import type { Metadata } from 'next';
import styles from '@/components/site/page.module.css';
import { site } from '@/content/site.no';

export const metadata: Metadata = {
  title: site.pages.support.title,
  description: site.pages.support.description,
};

/** Støtt oss: Vipps first, then the account. The numbers are bracketed until the foundation has them. */
export default function StottOss() {
  const t = site.pages.support;
  return (
    <article className={styles.page}>
      <p className={styles.eyebrow}>{t.label}</p>
      <h1 className={styles.title}>{t.title}</h1>
      <p className={styles.lede}>{t.description}</p>
      <dl className={styles.facts}>
        <div>
          <dt>{site.support.vipps.label}</dt>
          <dd>{site.support.vipps.value}</dd>
        </div>
        <div>
          <dt>{site.support.account.label}</dt>
          <dd>{site.support.account.value}</dd>
        </div>
      </dl>
    </article>
  );
}
