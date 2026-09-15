import type { Metadata } from 'next';
import styles from '@/components/site/page.module.css';
import { site } from '@/content/site.no';
import { getEvents, splitEvents, todayISO, type Event } from '@/lib/content';
import { writeDateTime } from '@/lib/dates';

export const metadata: Metadata = {
  title: site.pages.events.title,
  description: site.pages.events.description,
};

function EventItem({ e }: { e: Event }) {
  return (
    <li className={styles.item}>
      <h3>{e.link ? <a href={e.link}>{e.title}</a> : e.title}</h3>
      <p className={styles.meta}>
        <time dateTime={e.time ? `${e.start}T${e.time}` : e.start}>{writeDateTime(e.start, e.time)}</time>
        {' · '}
        {e.place}
      </p>
      <p>{e.text}</p>
      {e.image && <img src={e.image.src} alt={e.image.alt} loading="lazy" />}
    </li>
  );
}

/**
 * Arrangementer: kommende and tidligere, split on today's date at build time, each with
 * its own honest empty line. The records are the `arrangementer` collection.
 */
export default function Arrangementer() {
  const { upcoming, past } = splitEvents(getEvents(), todayISO());
  const t = site.pages.events;
  return (
    <article className={styles.page}>
      <p className={styles.eyebrow}>{t.label}</p>
      <h1 className={styles.title}>{t.title}</h1>
      <p className={styles.lede}>{t.description}</p>
      <section className={styles.section} aria-labelledby="kommende">
        <h2 id="kommende">{t.upcoming}</h2>
        {upcoming.length ? <ul className={styles.list}>{upcoming.map((e) => <EventItem key={e.slug} e={e} />)}</ul> : <p className={styles.empty}>{t.emptyUpcoming}</p>}
      </section>
      <section className={styles.section} aria-labelledby="tidligere">
        <h2 id="tidligere">{t.past}</h2>
        {past.length ? <ul className={styles.list}>{past.map((e) => <EventItem key={e.slug} e={e} />)}</ul> : <p className={styles.empty}>{t.emptyPast}</p>}
      </section>
    </article>
  );
}
