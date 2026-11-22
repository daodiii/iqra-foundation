import Link from 'next/link';
import type { ReactNode } from 'react';
import { Knapp } from '@/components/forside/Knapp';
import { Lines } from '@/components/forside/Lines';
import { Plate, Plater } from '@/components/plater/Plater';
import { after } from '@/components/plater/after';
import p from '@/components/plater/plater.module.css';
import { copy, type Copy } from '@/content/copy';
import { PATHS, type Lang } from '@/content/paths';
import type { Event, NewsItem } from '@/lib/content';
import { writeDate, writeTime } from '@/lib/dates';
import { newsHref, viewsFor, type View } from './links';
import styles from './aktuelt-plater.module.css';

/**
 * The mark beside an item's date: on an English page, «In Norwegian» on what an editor wrote (the
 * owner's choice, 2026-11-22: the posts stay Norwegian, and say so).
 */
function Mark({ c }: { c: Copy }) {
  if (c.lang === 'en') return <span className={p.ex}>{c.site.language.inNorwegian}</span>;
  return null;
}

/** A news item: its date, the headline (a link to the article when it has one), the ingress. The newest is set at poster size. */
function NewsItemPlate({ n, top, i, c }: { n: NewsItem; top: boolean; i: number; c: Copy }) {
  const linked = !!n.body;
  const foreign = c.lang === 'en' ? 'nb' : undefined;
  return (
    <li className={`${styles.n} ${top ? styles.top : ''} ${linked ? styles.linked : ''}`} data-rise="" style={after(i * 0.08)}>
      <p className={styles.mt}>
        <time dateTime={n.date}>{writeDate(n.date, c.lang)}</time>
        <Mark c={c} />
      </p>
      <h3 lang={foreign}>
        {linked ? (
          <Link href={newsHref(n.slug, c.lang)} prefetch={false} className={styles.stretch}>
            {n.title}
          </Link>
        ) : (
          n.title
        )}
      </h3>
      <p className={styles.sum} lang={foreign}>{n.summary}</p>
    </li>
  );
}

/** An event as a calendar leaf: the day set huge, the month and year under it, the title, the time and place, and what else it has. */
function EventLeaf({ e, past = false, i, c }: { e: Event; past?: boolean; i: number; c: Copy }) {
  const t = c.site.pages.news;
  const foreign = c.lang === 'en' ? 'nb' : undefined;
  const [y, m, d] = e.start.split('-').map(Number);
  const end: ReactNode =
    past && e.recording ? (
      <a href={e.recording}>{t.recording}</a>
    ) : !past && e.link ? (
      <a href={e.link}>{t.signup}</a>
    ) : null;
  return (
    <li className={styles.leaf} data-rise="" style={after(i * 0.1)}>
      <span className={styles.day} aria-hidden="true">
        {String(d).padStart(2, '0')}
      </span>
      <span className={styles.mo} aria-hidden="true">
        {c.site.months[m - 1]} {y}
      </span>
      <time dateTime={e.start} className={p.sr}>
        {writeDate(e.start, c.lang)}
      </time>
      <h3 lang={foreign}>{e.title}</h3>
      <p className={styles.wh}>
        {e.time && (
          <>
            <time dateTime={`${e.start}T${e.time}`}>{writeTime(e.time, c.lang)}</time>
            <span aria-hidden="true">·</span>
          </>
        )}
        <span>{e.place}</span>
        <Mark c={c} />
      </p>
      {e.text && <p className={styles.sum} lang={foreign}>{e.text}</p>}
      {e.program && (
        <p className={styles.sum}>
          <strong>{t.program}</strong> <span lang={foreign}>{e.program}</span>
        </p>
      )}
      {past && e.report && (
        <p className={styles.sum}>
          <strong>{t.report}</strong> <span lang={foreign}>{e.report}</span>
        </p>
      )}
      {end && <p className={styles.end}>{end}</p>}
    </li>
  );
}

function None({ text }: { text: string }) {
  return (
    <p className={styles.none} data-rise="">
      {text}
    </p>
  );
}

/**
 * Aktuelt as «Platene» (mock 42, the owner's pick of 2026-11-20): the title, the intro and the filter on
 * white; the news on navy, the newest at poster size; the events as a calendar, the days set huge. The
 * filter is three addresses (M3). Under Arrangementer the past events follow as the archive. While a
 * collection is empty its list says so in the site's own words.
 */
export function AktueltPlater({
  view,
  news,
  upcoming,
  past,
  lang = 'no',
}: {
  view: View;
  lang?: Lang;
  news: NewsItem[];
  upcoming: Event[];
  past: Event[];
}) {
  const c = copy(lang);
  const t = c.site.pages.news;
  const klient = c.klient;
  const showNews = view !== 'arrangementer';
  const showEvents = view !== 'nyheter';
  return (
    <Plater>
      <Plate tone="white" label="aktuelt-tittel" data-view={view}>
        <Lines as="h1" id="aktuelt-tittel" className={p.h1} text={t.title} />
        <p className={p.intro} data-rise="">
          {klient.news.intro}
        </p>
        <nav className={styles.tabs} aria-label={t.filterLabel} data-rise="">
          <ul>
            {viewsFor(lang).map((v) => (
              <li key={v.view}>
                <Link href={v.href} prefetch={false} scroll={false} aria-current={v.view === view ? 'page' : undefined}>
                  {v.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Plate>

      {showNews && (
        <Plate tone="navy" id="nyheter" label="nyheter-tittel">
          <div className={p.gh}>
            <Lines as="h2" id="nyheter-tittel" className={p.h} text={t.newsTitle} />
            <p data-rise="">{klient.news.newsText}</p>
          </div>
          {news.length ? (
            <ul className={styles.news}>
              {news.map((n, i) => (
                <NewsItemPlate key={n.slug} n={n} top={i === 0} i={i} c={c} />
              ))}
            </ul>
          ) : (
            <None text={t.emptyNews} />
          )}
        </Plate>
      )}

      {showEvents && (
        <Plate tone={showNews ? 'white' : 'navy'} id="arrangementer" label="arrangementer-tittel">
          <div className={p.gh}>
            <Lines as="h2" id="arrangementer-tittel" className={p.h} text={t.eventsTitle} />
            <p data-rise="">{klient.news.eventsText}</p>
          </div>
          {view === 'arrangementer' && <h3 className={styles.sub}>{t.upcoming}</h3>}
          {upcoming.length ? (
            <ol className={styles.cal}>
              {upcoming.map((e, i) => (
                <EventLeaf key={e.slug} e={e} i={i} c={c} />
              ))}
            </ol>
          ) : (
            <None text={t.emptyUpcoming} />
          )}
          {view === 'arrangementer' && (
            <>
              <h3 className={styles.sub} id="tidligere">
                {t.past}
              </h3>
              {past.length ? (
                <ol className={`${styles.cal} ${styles.past}`}>
                  {past.map((e, i) => (
                    <EventLeaf key={e.slug} e={e} past i={i} c={c} />
                  ))}
                </ol>
              ) : (
                <None text={t.emptyPast} />
              )}
            </>
          )}
          <p className={styles.arch} data-rise="">
            <Knapp href={PATHS.archive[lang]} kind="ring">
              {t.archiveLink}
            </Knapp>
          </p>
        </Plate>
      )}
    </Plater>
  );
}
