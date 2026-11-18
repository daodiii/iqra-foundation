import type { Metadata } from 'next';
import styles from '@/components/site/page.module.css';
import { PageTitle } from '@/components/site/PageTitle';
import { Fanene } from '@/components/support/Fanene';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';

export const metadata: Metadata = {
  title: site.pages.support.title,
  description: site.pages.support.description,
};

const t = klient.support;

/**
 * Støtt oss: the client's text (D7, 2026-11-18), in their order and their words — the title and
 * its paragraph, what a gift goes to, the three ways to give, and their last line. Under «Gave»
 * hang the foundation's own ways to give, as the banners the owner picked: Vipps and AvtaleGiro,
 * and the account number once the client has given it (their question Q6).
 */
export default function StottOss() {
  return (
    <article className={styles.page}>
      <PageTitle href="/stott-oss" className={styles.title}>{t.title}</PageTitle>
      <p className={styles.lede}>{t.intro}</p>

      <section className={styles.section} aria-labelledby="bidraget">
        <h2 id="bidraget">{t.uses.title}</h2>
        <p>{t.uses.lead}</p>
        <ul className={styles.points}>
          {t.uses.points.map((p) => <li key={p}>{p}</li>)}
        </ul>
        <p>{t.uses.close}</p>
      </section>

      <section className={styles.section} aria-labelledby="bidra">
        <h2 id="bidra">{t.ways.title}</h2>
        {t.ways.items.map((w, i) => (
          <div key={w.title} className={styles.way}>
            <h3>{w.title}</h3>
            <p>{w.text}</p>
            {i === 0 && <Fanene />}
          </div>
        ))}
      </section>

      <div className={styles.section}>
        <p className={styles.close}>{t.close}</p>
      </div>
    </article>
  );
}
