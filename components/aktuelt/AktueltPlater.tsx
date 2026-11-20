import Link from 'next/link';
import type { ReactNode } from 'react';
import { Knapp } from '@/components/forside/Knapp';
import { Lines } from '@/components/forside/Lines';
import { Plate, Plater } from '@/components/plater/Plater';
import { after } from '@/components/plater/after';
import p from '@/components/plater/plater.module.css';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import type { Event, NewsItem } from '@/lib/content';
import { writeDate } from '@/lib/dates';
import { ARCHIVE_HREF, VIEWS, newsHref, type View } from './links';
import { SAMPLE } from './samples';
import styles from './aktuelt-plater.module.css';

const t = site.pages.news;

const Sample = () => <span className={p.ex}>{SAMPLE}</span>;

/** A news item: its date, the headline (a link to the article when it has one), the ingress. The newest is set at poster size. */
function NewsItemPlate({ n, sample, top, i }: { n: NewsItem; sample: boolean; top: boolean; i: number }) {
  const linked = !sample && !!n.body;
  return (
    <li className={`${styles.n} ${top ? styles.top : ''} ${linked ? styles.linked : ''}`} data-rise="" style={after(i * 0.08)}>
      <p className={styles.mt}>
        <time dateTime={n.date}>{writeDate(n.date)}</time>
        {sample && <Sample />}
      </p>
      <h3>
        {linked ? (
          <Link href={newsHref(n.slug)} prefetch={false} className={styles.stretch}>
            {n.title}
          </Link>
        ) : (
          n.title
        )}
      </h3>
      <p className={styles.sum}>{n.summary}</p>
    </li>
  );
}

/** An event as a calendar leaf: the day set huge, the month and year under it, the title, the time and place, and what else it has. */
function EventLeaf({ e, sample, past = false, i }: { e: Event; sample: boolean; past?: boolean; i: number }) {
  const [y, m, d] = e.start.split('-').map(Number);
  const end: ReactNode =
    !sample && past && e.recording ? (
      <a href={e.recording}>{t.recording}</a>
    ) : !sample && !past && e.link ? (
      <a href={e.link}>{t.signup}</a>
    ) : null;
  return (
    <li className={styles.leaf} data-rise="" style={after(i * 0.1)}>
      <span className={styles.day} aria-hidden="true">
        {String(d).padStart(2, '0')}
      </span>
      <span className={styles.mo} aria-hidden="true">
        {site.months[m - 1]} {y}
      </span>
      <time dateTime={e.start} className={p.sr}>
        {writeDate(e.start)}
      </time>
      <h3>{e.title}</h3>
      <p className={styles.wh}>
        {e.time && (
          <>
            <time dateTime={`${e.start}T${e.time}`}>kl. {e.time}</time>
            <span aria-hidden="true">·</span>
          </>
        )}
        <span>{e.place}</span>
        {sample && <Sample />}
      </p>
      {e.text && <p className={styles.sum}>{e.text}</p>}
      {e.program && (
        <p className={styles.sum}>
          <strong>{t.program}</strong> {e.program}
        </p>
      )}
      {past && e.report && (
        <p className={styles.sum}>
          <strong>{t.report}</strong> {e.report}
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
 * collection is empty it shows the front page's samples, marked «Eksempel».
 */
export function AktueltPlater({
  view,
  news,
  upcoming,
  past,
  sampleNews,
  sampleEvents,
}: {
  view: View;
  news: NewsItem[];
  upcoming: Event[];
  past: Event[];
  sampleNews: boolean;
  sampleEvents: boolean;
}) {
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
            {VIEWS.map((v) => (
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
                <NewsItemPlate key={n.slug} n={n} sample={sampleNews} top={i === 0} i={i} />
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
                <EventLeaf key={e.slug} e={e} sample={sampleEvents} i={i} />
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
                    <EventLeaf key={e.slug} e={e} sample={false} past i={i} />
                  ))}
                </ol>
              ) : (
                <None text={t.emptyPast} />
              )}
            </>
          )}
          <p className={styles.arch} data-rise="">
            <Knapp href={ARCHIVE_HREF} kind="ring">
              {t.archiveLink}
            </Knapp>
          </p>
        </Plate>
      )}
    </Plater>
  );
}
