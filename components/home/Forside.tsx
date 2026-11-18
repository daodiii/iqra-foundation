import Link from 'next/link';
import { EventCard, NewsCard } from '@/components/aktuelt/Aktuelt';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import { getEvents, getNews, splitEvents, todayISO } from '@/lib/content';
import { Ikon, type IkonKey } from './Ikon';
import styles from './forside.module.css';

const h = klient.home;
const ICONS: readonly IkonKey[] = ['laering', 'engasjement', 'samarbeid'];

/** How many of each the front page shows (the owner, 2026-11-18: «3 would be good … and then you can click on it to see all»). */
export const SHOWN = 3;

/**
 * The front page under the hero, in the client's order (D1, 2026-11-18), every word theirs:
 *
 * - «Hvorfor vi finnes»;
 * - «Dette ønsker vi å skape» (M2), which replaces the four boxes Kunnskap, Samfunnsdeltakelse,
 *   Dialog and Møteplasser, its three areas each with an icon;
 * - «Fra kunnskap til handling», the document's own three-part section (whether it stays beside
 *   M2's is the client's question Q1);
 * - «Aktuelt»: the three latest news and the three next events, each list with its way on;
 * - «Sammen kan vi gjøre en forskjell» and its two buttons.
 */
export function Forside() {
  const news = getNews().slice(0, SHOWN);
  const { upcoming } = splitEvents(getEvents(), todayISO());
  const next = upcoming.slice(0, SHOWN);
  const t = site.pages.news;
  return (
    <div className={styles.forside}>
      <section id="hvorfor" className={styles.section} aria-labelledby="hvorfor-tittel">
        <h2 id="hvorfor-tittel" className={styles.title}>{h.why.title}</h2>
        <div className={styles.columns}>
          {h.why.paragraphs.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
        </div>
      </section>

      <section id="skape" className={`${styles.section} ${styles.light}`} aria-labelledby="skape-tittel">
        <h2 id="skape-tittel" className={styles.title}>{h.create.title}</h2>
        <p className={styles.intro}>{h.create.intro}</p>
        <ul className={styles.three}>
          {h.create.areas.map((a, i) => (
            <li key={a.title}>
              <Ikon name={ICONS[i]} className={styles.icon} />
              <h3>{a.title}</h3>
              <p>{a.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="handling" className={styles.section} aria-labelledby="handling-tittel">
        <h2 id="handling-tittel" className={styles.title}>{h.action.title}</h2>
        <ul className={styles.three}>
          {h.action.items.map((a) => (
            <li key={a.title}>
              <h3>{a.title}</h3>
              <p>{a.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="aktuelt" className={`${styles.section} ${styles.light}`} aria-labelledby="aktuelt-tittel">
        <h2 id="aktuelt-tittel" className={styles.title}>{h.news.title}</h2>
        <p className={styles.intro}>{h.news.intro}</p>
        <div className={styles.lists}>
          <div>
            <h3 className={styles.listTitle}>{t.newsTitle}</h3>
            {news.length ? <ul className={styles.list}>{news.map((n) => <NewsCard key={n.slug} n={n} />)}</ul> : <p className={styles.empty}>{t.emptyNews}</p>}
            <p className={styles.more}>
              <Link href="/aktuelt/nyheter" prefetch={false}>{h.news.all}</Link>
            </p>
          </div>
          <div>
            <h3 className={styles.listTitle}>{t.upcoming}</h3>
            {next.length ? <ul className={styles.list}>{next.map((e) => <EventCard key={e.slug} e={e} />)}</ul> : <p className={styles.empty}>{t.emptyUpcoming}</p>}
            <p className={styles.more}>
              <Link href="/aktuelt/arrangementer" prefetch={false}>{site.pages.home.allEvents}</Link>
            </p>
          </div>
        </div>
      </section>

      <section id="sammen" className={`${styles.section} ${styles.navy}`} aria-labelledby="sammen-tittel">
        <h2 id="sammen-tittel" className={styles.title}>{h.together.title}</h2>
        <p className={styles.intro}>{h.together.text}</p>
        <p className={styles.buttons}>
          <Link href={site.cta.partner.href} prefetch={false} className={styles.partner}>{site.cta.partner.label}</Link>
          <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
        </p>
      </section>
    </div>
  );
}
