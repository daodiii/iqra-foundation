'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Knapp } from '@/components/forside/Knapp';
import { Lines } from '@/components/forside/Lines';
import f from '@/components/forside/forside.module.css';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import type { Event, NewsItem } from '@/lib/content';
import { writeDate } from '@/lib/dates';
import { ARCHIVE_HREF, VIEWS, newsHref, type View } from './links';
import { SAMPLE } from './samples';
import styles from './tavla.module.css';

const t = site.pages.news;

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Digits on their own flap cards, each with its hinge; a colon stands between them bare. */
function Cards({ text }: { text: string }) {
  return (
    <span className={styles.fl} aria-hidden="true">
      {[...text].map((c, i) =>
        c === ':' ? (
          <span key={i} className={styles.cl}>
            :
          </span>
        ) : (
          <i key={i} data-spin="">
            {c}
          </i>
        ),
      )}
    </span>
  );
}

/** A date as the board sets it: the day on two flap cards, the month written out, the year under it. */
function DateTile({ iso }: { iso: string }) {
  const [y, m, d] = iso.split('-').map(Number);
  return (
    <div className={`${styles.tile} ${styles.dt}`}>
      <time dateTime={iso} className={styles.sr}>
        {writeDate(iso)}
      </time>
      <Cards text={String(d).padStart(2, '0')} />
      <span className={styles.mo} aria-hidden="true">
        <span className={styles.mn}>{site.months[m - 1]}</span>
        <span className={styles.yr}>{y}</span>
      </span>
    </div>
  );
}

const Sample = () => <span className={styles.ex}>{SAMPLE}</span>;

function NewsRow({ n, sample }: { n: NewsItem; sample: boolean }) {
  const linked = !sample && !!n.body;
  const body = (
    <>
      <DateTile iso={n.date} />
      <div className={`${styles.tile} ${styles.t}`}>
        <h3 className={styles.h}>{linked ? <Link href={newsHref(n.slug)} prefetch={false} className={styles.stretch}>{n.title}</Link> : n.title}</h3>
        <span className={styles.sum}>{n.summary}</span>
      </div>
      {(sample || linked) && (
        <div className={`${styles.tile} ${styles.x}`}>
          {sample ? (
            <Sample />
          ) : (
            <span className={styles.more} aria-hidden="true">
              {t.readMore}
            </span>
          )}
        </div>
      )}
    </>
  );
  return <li className={`${styles.row} ${styles.n} ${linked ? styles.link : ''} ${sample || linked ? '' : styles.two}`}>{body}</li>;
}

function EventRow({ e, sample, past = false }: { e: Event; sample: boolean; past?: boolean }) {
  const end: ReactNode = sample ? (
    <Sample />
  ) : past && e.recording ? (
    <a href={e.recording}>{t.recording}</a>
  ) : !past && e.link ? (
    <a href={e.link}>{t.signup}</a>
  ) : null;
  return (
    <li className={`${styles.row} ${styles.e} ${end ? '' : styles.four}`}>
      <DateTile iso={e.start} />
      <div className={`${styles.tile} ${styles.tw}`}>
        {e.time && (
          <>
            <time dateTime={`${e.start}T${e.time}`} className={styles.sr}>
              kl. {e.time}
            </time>
            <span className={styles.k} aria-hidden="true">
              kl.
            </span>
            <Cards text={e.time} />
          </>
        )}
      </div>
      <div className={`${styles.tile} ${styles.t}`}>
        <h3 className={styles.h}>{e.title}</h3>
        {e.text && <span className={styles.sum}>{e.text}</span>}
        {e.program && (
          <span className={styles.sum}>
            <strong>{t.program}</strong> {e.program}
          </span>
        )}
        {past && e.report && (
          <span className={styles.sum}>
            <strong>{t.report}</strong> {e.report}
          </span>
        )}
      </div>
      <div className={`${styles.tile} ${styles.pl}`}>
        <span className={styles.place}>{e.place}</span>
      </div>
      {end && <div className={`${styles.tile} ${styles.x}`}>{end}</div>}
    </li>
  );
}

const GLYPHS = '0123456789';
/** A flap card runs through digits before it settles on its own (the text node is kept, so React's stays valid). */
function spin(node: HTMLElement, delay: number) {
  const text = node.firstChild;
  if (!text || text.nodeType !== 3) return;
  const final = node.dataset.t ?? (node.dataset.t = text.nodeValue ?? '');
  const t0 = performance.now() + delay;
  const step = (now: number) => {
    if (now - t0 >= 140) {
      text.nodeValue = final;
      return;
    }
    text.nodeValue = GLYPHS[(Math.random() * GLYPHS.length) | 0];
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** A board: its tiles flap in row by row the first time it comes into view, and the digits spin. */
function Board({ id, title, text, children }: { id: string; title: string; text: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced() || typeof IntersectionObserver === 'undefined') {
      el.dataset.in = '';
      return;
    }
    const io = new IntersectionObserver(
      ([en]) => {
        if (!en.isIntersecting) return;
        io.disconnect();
        el.querySelectorAll<HTMLElement>(`.${styles.row}, .${styles.none}`).forEach((r, ri) =>
          r.querySelectorAll<HTMLElement>(`.${styles.tile}`).forEach((tile, ci) => tile.style.setProperty('--fd', `${(ri * 0.14 + ci * 0.06).toFixed(2)}s`)),
        );
        el.dataset.in = '';
        el.querySelectorAll<HTMLElement>('[data-spin]').forEach((n, i) => spin(n, 260 + i * 45));
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section ref={ref} className={styles.board} aria-labelledby={id}>
      <div className={styles.gh}>
        <h2 id={id}>{title}</h2>
        <p>{text}</p>
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className={styles.none}>
      <p className={styles.tile}>{text}</p>
    </div>
  );
}

/**
 * Aktuelt as the owner's pick «Tavla, hvit» (mock 36, 2026-11-20): a departures board on white. Each
 * news item and event is a row of tiles that flap in; the day and the time stand on their own navy
 * flap cards and spin before they settle; the month is written out. The filter is three addresses,
 * as before. While a collection is empty it shows the front page's samples, marked «Eksempel».
 */
export function Tavla({
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
  const [on, setOn] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(r);
  }, []);
  const showNews = view !== 'arrangementer';
  const showEvents = view !== 'nyheter';
  return (
    <article className={`${styles.tavla} ${f.pad}`} data-view={view}>
      <div className={styles.top}>
        <Lines as="h1" text={t.title} on={on} className={styles.h1} />
        <p className={styles.intro}>{klient.news.intro}</p>
      </div>
      <nav className={styles.flt} aria-label={t.filterLabel}>
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

      {showNews && (
        <Board id="nyheter" title={t.newsTitle} text={klient.news.newsText}>
          {news.length ? (
            <ul className={styles.rows}>
              {news.map((n) => (
                <NewsRow key={n.slug} n={n} sample={sampleNews} />
              ))}
            </ul>
          ) : (
            <Empty text={t.emptyNews} />
          )}
        </Board>
      )}

      {showEvents && (
        <Board id="arrangementer" title={t.eventsTitle} text={klient.news.eventsText}>
          <h3 className={styles.sub}>{t.upcoming}</h3>
          {upcoming.length ? (
            <ul className={styles.rows}>
              {upcoming.map((e) => (
                <EventRow key={e.slug} e={e} sample={sampleEvents} />
              ))}
            </ul>
          ) : (
            <Empty text={t.emptyUpcoming} />
          )}
          {view === 'arrangementer' && (
            <>
              <h3 className={styles.sub} id="tidligere">
                {t.past}
              </h3>
              {past.length ? (
                <ul className={styles.rows}>
                  {past.map((e) => (
                    <EventRow key={e.slug} e={e} sample={false} past />
                  ))}
                </ul>
              ) : (
                <Empty text={t.emptyPast} />
              )}
            </>
          )}
          <p className={styles.arch}>
            <Knapp href={ARCHIVE_HREF} kind="ring">
              {t.archiveLink}
            </Knapp>
          </p>
        </Board>
      )}
    </article>
  );
}
