import type { Metadata } from 'next';
import { AreaMark } from '@/components/site/AreaMark';
import { Frame } from '@/components/site/Frame';
import { Linked } from '@/components/site/Linked';
import styles from '@/components/site/page.module.css';
import { PageTitle } from '@/components/site/PageTitle';
import { site } from '@/content/site.no';
import { getEvents, getNews, splitEvents, todayISO, type Event, type NewsItem } from '@/lib/content';
import { writeDate, writeDateTime } from '@/lib/dates';

export const metadata: Metadata = {
  title: site.pages.events.title,
  description: site.pages.events.description,
};

/**
 * Kommende and tidligere are split on today's date when the page is rendered, and the page
 * is prerendered — so without this an event stayed under Kommende from its day until the
 * next deploy. Regenerated at most once an hour, on the first visit after the hour: the
 * split moves within the hour of midnight. The records are read from disk at that moment,
 * which is why `next.config.ts` traces `content/` into this route's function.
 */
export const revalidate = 3600;

/** A card's picture: as wide as the card, at most. */
const CARD = '(max-width: 700px) 100vw, 640px';

/** An event's card. Its title goes to its own page when it has a full text, else to its sign-up link when it has one. */
function EventItem({ e }: { e: Event }) {
  return (
    <li className={styles.item}>
      <h3>
        <Linked href={e.body ? `/arrangementer/${e.slug}` : e.link}>{e.title}</Linked>
      </h3>
      {e.area && (
        <p className={styles.meta}>
          <AreaMark area={e.area} />
        </p>
      )}
      <p className={styles.meta}>
        <time dateTime={e.time ? `${e.start}T${e.time}` : e.start}>{writeDateTime(e.start, e.time)}</time>
        {' · '}
        {e.place}
      </p>
      <p>{e.summary}</p>
      {e.image && <Frame picture={e.image} sizes={CARD} className={styles.picture} />}
    </li>
  );
}

/** A news item's card. Its title goes to its own page when it has a full text. */
function NewsCard({ n }: { n: NewsItem }) {
  return (
    <li className={styles.item}>
      <h3>
        <Linked href={n.body ? `/nyheter/${n.slug}` : null}>{n.title}</Linked>
      </h3>
      {n.area && (
        <p className={styles.meta}>
          <AreaMark area={n.area} />
        </p>
      )}
      <p className={styles.meta}>
        <time dateTime={n.date}>{writeDate(n.date)}</time>
      </p>
      <p>{n.summary}</p>
      {n.image && <Frame picture={n.image} sizes={CARD} className={styles.picture} />}
    </li>
  );
}

/**
 * Arrangementer: kommende, then the news (the owner, 2026-10-10: news lives here), then
 * tidligere — each with its own honest empty line. Kommende and tidligere are split on today's
 * date each time the page is rendered (see `revalidate`). The records are the `arrangementer`
 * and `nyheter` collections, published only.
 */
export default function Arrangementer() {
  const { upcoming, past } = splitEvents(getEvents(), todayISO());
  const news = getNews();
  const t = site.pages.events;
  return (
    <article className={styles.page}>
      <PageTitle href="/arrangementer" className={styles.title}>{t.title}</PageTitle>
      <p className={styles.lede}>{t.description}</p>
      <section className={styles.section} aria-labelledby="kommende">
        <h2 id="kommende">{t.upcoming}</h2>
        {upcoming.length ? <ul className={styles.list}>{upcoming.map((e) => <EventItem key={e.slug} e={e} />)}</ul> : <p className={styles.empty}>{t.emptyUpcoming}</p>}
      </section>
      <section id="nyheter" className={styles.section} aria-labelledby="nyheter-tittel">
        <h2 id="nyheter-tittel">{t.news}</h2>
        {news.length ? <ul className={styles.list}>{news.map((n) => <NewsCard key={n.slug} n={n} />)}</ul> : <p className={styles.empty}>{t.emptyNews}</p>}
      </section>
      <section className={styles.section} aria-labelledby="tidligere">
        <h2 id="tidligere">{t.past}</h2>
        {past.length ? <ul className={styles.list}>{past.map((e) => <EventItem key={e.slug} e={e} />)}</ul> : <p className={styles.empty}>{t.emptyPast}</p>}
      </section>
    </article>
  );
}
