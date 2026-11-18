import Link from 'next/link';
import styles from '@/components/site/page.module.css';
import { PageTitle } from '@/components/site/PageTitle';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import { getEvents, getNews, splitEvents, todayISO, type Event, type NewsItem } from '@/lib/content';
import { writeDate, writeDateTime } from '@/lib/dates';

const t = site.pages.news;

/** The three views of Aktuelt (M3): all, news, events. Each is its own address, so the filter is three links. */
export type View = 'alle' | 'nyheter' | 'arrangementer';

export const VIEWS: readonly { view: View; label: string; href: string }[] = [
  { view: 'alle', label: klient.news.filter.all, href: '/aktuelt' },
  { view: 'nyheter', label: klient.news.filter.news, href: '/aktuelt/nyheter' },
  { view: 'arrangementer', label: klient.news.filter.events, href: '/aktuelt/arrangementer' },
];

export const ARCHIVE_HREF = '/aktuelt/arkiv';
export const newsHref = (slug: string) => `/aktuelt/nyheter/${slug}`;

/** A news item in a list: its date, its headline (a link to the article when it has a text), its ingress. */
export function NewsCard({ n }: { n: NewsItem }) {
  return (
    <li className={styles.item}>
      <p className={styles.meta}>
        <time dateTime={n.date}>{writeDate(n.date)}</time>
      </p>
      <h3>{n.body ? <Link href={newsHref(n.slug)} prefetch={false}>{n.title}</Link> : n.title}</h3>
      {n.image && <img src={n.image.src} alt={n.image.alt} loading="lazy" />}
      <p>{n.summary}</p>
      {n.body && (
        <p className={styles.meta}>
          <Link href={newsHref(n.slug)} prefetch={false}>{t.readMore}</Link>
        </p>
      )}
    </li>
  );
}

/**
 * An event: title, date and time, place, the description, the programme, and sign-up (M3, D5).
 * In the archive it carries its write-up and its recording instead, where they exist.
 */
export function EventCard({ e, archive = false }: { e: Event; archive?: boolean }) {
  return (
    <li className={styles.item}>
      <h3>{e.title}</h3>
      <p className={styles.meta}>
        <time dateTime={e.time ? `${e.start}T${e.time}` : e.start}>{writeDateTime(e.start, e.time)}</time>
        {' · '}
        {e.place}
      </p>
      {e.image && <img src={e.image.src} alt={e.image.alt} loading="lazy" />}
      <p>{e.text}</p>
      {e.program && (
        <p className={styles.block}>
          <strong>{t.program}</strong>
          {e.program}
        </p>
      )}
      {archive && e.report && (
        <p className={styles.block}>
          <strong>{t.report}</strong>
          {e.report}
        </p>
      )}
      {archive && e.recording && (
        <p className={styles.meta}>
          <a href={e.recording}>{t.recording}</a>
        </p>
      )}
      {!archive && e.link && (
        <p className={styles.meta}>
          <a href={e.link}>{t.signup}</a>
        </p>
      )}
    </li>
  );
}

function Filter({ view }: { view: View }) {
  return (
    <nav className={styles.filter} aria-label={t.filterLabel}>
      <ul>
        {VIEWS.map((v) => (
          <li key={v.view}>
            <Link href={v.href} prefetch={false} aria-current={v.view === view ? 'page' : undefined}>
              {v.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Aktuelt: one page for news and events with the filter the client asks for — Alle, Nyheter,
 * Arrangementer (M3) — and their text (D5). Under Arrangementer the past events stand as the
 * archive, which also has a page of its own (the owner: «Archive can be both»). Events move
 * from upcoming to the archive by date on their own (`revalidate` on the routes).
 */
export function Aktuelt({ view }: { view: View }) {
  const news = getNews();
  const { upcoming, past } = splitEvents(getEvents(), todayISO());
  const showNews = view !== 'arrangementer';
  const showEvents = view !== 'nyheter';
  return (
    <article className={styles.page}>
      <PageTitle href="/aktuelt" className={styles.title}>{t.title}</PageTitle>
      <p className={styles.lede}>{klient.news.intro}</p>
      <Filter view={view} />

      {showNews && (
        <section className={styles.section} aria-labelledby="nyheter">
          <h2 id="nyheter">{t.newsTitle}</h2>
          <p>{klient.news.newsText}</p>
          {news.length ? <ul className={styles.list}>{news.map((n) => <NewsCard key={n.slug} n={n} />)}</ul> : <p className={styles.empty}>{t.emptyNews}</p>}
        </section>
      )}

      {showEvents && (
        <section className={styles.section} aria-labelledby="arrangementer">
          <h2 id="arrangementer">{t.eventsTitle}</h2>
          <p>{klient.news.eventsText}</p>
          <h3 className={styles.subhead}>{t.upcoming}</h3>
          {upcoming.length ? <ul className={styles.list}>{upcoming.map((e) => <EventCard key={e.slug} e={e} />)}</ul> : <p className={styles.empty}>{t.emptyUpcoming}</p>}
          {view === 'arrangementer' && (
            <>
              <h3 className={styles.subhead} id="tidligere">{t.past}</h3>
              {past.length ? <ul className={styles.list}>{past.map((e) => <EventCard key={e.slug} e={e} archive />)}</ul> : <p className={styles.empty}>{t.emptyPast}</p>}
            </>
          )}
          <p className={styles.meta}>
            <Link href={ARCHIVE_HREF} prefetch={false}>{t.archiveLink}</Link>
          </p>
        </section>
      )}
    </article>
  );
}

/** The archive: every past event, newest first, with its write-up and recording where they exist. */
export function Arkiv() {
  const { past } = splitEvents(getEvents(), todayISO());
  return (
    <article className={styles.page}>
      <p className={styles.meta}>
        <Link href="/aktuelt/arrangementer" prefetch={false}>
          <span aria-hidden="true">← </span>
          {t.title}
        </Link>
      </p>
      <h1 className={styles.title}>{t.archiveTitle}</h1>
      <p className={styles.lede}>{t.archiveDescription}</p>
      <section className={styles.section} aria-label={t.past}>
        {past.length ? <ul className={styles.list}>{past.map((e) => <EventCard key={e.slug} e={e} archive />)}</ul> : <p className={styles.empty}>{t.emptyPast}</p>}
      </section>
    </article>
  );
}
