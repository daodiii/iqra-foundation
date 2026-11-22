import Link from 'next/link';
import styles from '@/components/site/page.module.css';
import { copy } from '@/content/copy';
import { PATHS, type Lang } from '@/content/paths';
import { getEvents, getNews, splitEvents, todayISO, type Event, type NewsItem } from '@/lib/content';
import { writeDate, writeDateTime } from '@/lib/dates';
import { newsHref, type View } from './links';
import { samplesFor } from './samples';
import { AktueltPlater } from './AktueltPlater';

export { ARCHIVE_HREF, VIEWS, viewsFor, newsHref, type View } from './links';

/** A news item in a list: its date, its headline (a link to the article when it has a text), its ingress. */
export function NewsCard({ n, lang = 'no' }: { n: NewsItem; lang?: Lang }) {
  const t = copy(lang).site.pages.news;
  return (
    <li className={styles.item}>
      <p className={styles.meta}>
        <time dateTime={n.date}>{writeDate(n.date, lang)}</time>
      </p>
      <h3>{n.body ? <Link href={newsHref(n.slug, lang)} prefetch={false}>{n.title}</Link> : n.title}</h3>
      {n.image && <img src={n.image.src} alt={n.image.alt} loading="lazy" />}
      <p>{n.summary}</p>
      {n.body && (
        <p className={styles.meta}>
          <Link href={newsHref(n.slug, lang)} prefetch={false}>{t.readMore}</Link>
        </p>
      )}
    </li>
  );
}

/**
 * An event: title, date and time, place, the description, the programme, and sign-up (M3, D5).
 * In the archive it carries its write-up and its recording instead, where they exist.
 */
export function EventCard({ e, archive = false, lang = 'no' }: { e: Event; archive?: boolean; lang?: Lang }) {
  const { site } = copy(lang);
  const t = site.pages.news;
  const foreign = lang === 'en';
  return (
    <li className={styles.item} lang={foreign ? 'nb' : undefined}>
      {foreign && <p className={styles.meta} lang="en">{site.language.inNorwegian}</p>}
      <h3>{e.title}</h3>
      <p className={styles.meta}>
        <time dateTime={e.time ? `${e.start}T${e.time}` : e.start}>{writeDateTime(e.start, e.time, lang)}</time>
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

/**
 * Aktuelt: one page for news and events with the filter the client asks for — Alle, Nyheter,
 * Arrangementer (M3) — and their text (D5), set as «Platene» (AktueltPlater.tsx, mock 42, 2026-11-20).
 * Under Arrangementer the past events stand as the archive, which also has a page of its own.
 * Events move from upcoming to the archive by date on their own (`revalidate` on the routes).
 * While nothing is published the page shows the front page's samples, marked «Eksempel».
 */
export function Aktuelt({ view, lang = 'no' }: { view: View; lang?: Lang }) {
  const samples = samplesFor(lang);
  const realNews = getNews();
  const { upcoming: realUpcoming, past } = splitEvents(getEvents(), todayISO());
  const sampleNews = !realNews.length;
  const sampleEvents = !realUpcoming.length;
  return (
    <AktueltPlater
      view={view}
      lang={lang}
      news={sampleNews ? samples.news : realNews}
      upcoming={sampleEvents ? samples.events : realUpcoming}
      past={past}
      sampleNews={sampleNews}
      sampleEvents={sampleEvents}
    />
  );
}

/** The archive: every past event, newest first, with its write-up and recording where they exist. */
export function Arkiv({ lang = 'no' }: { lang?: Lang }) {
  const t = copy(lang).site.pages.news;
  const { past } = splitEvents(getEvents(), todayISO());
  return (
    <article className={styles.page}>
      <p className={styles.meta}>
        <Link href={PATHS.events[lang]} prefetch={false}>
          <span aria-hidden="true">← </span>
          {t.title}
        </Link>
      </p>
      <h1 className={styles.title}>{t.archiveTitle}</h1>
      <p className={styles.lede}>{t.archiveDescription}</p>
      <section className={styles.section} aria-label={t.past}>
        {past.length ? <ul className={styles.list}>{past.map((e) => <EventCard key={e.slug} e={e} archive lang={lang} />)}</ul> : <p className={styles.empty}>{t.emptyPast}</p>}
      </section>
    </article>
  );
}
