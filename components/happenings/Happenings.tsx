'use client';

import { useRef } from 'react';
import { site } from '@/content/site.no';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import styles from './happenings.module.css';

type EventItem = { day: string; month: string; title: string; meta: string; note: string };
type NewsItem = { date: string; title: string; note: string };

/** A column: what it is called, the sentence over it, its rows, and where «alle» goes. */
type Column<Item> = {
  label: string;
  line: string;
  more: string;
  href: string | null;
  items: readonly Item[];
};

type Props = {
  events?: Column<EventItem>;
  news?: Column<NewsItem>;
};

/**
 * Arrangementer · Nyheter — the page's breath.
 *
 * This is the only section between the hero and the footer with no box behind it, and that
 * is its entire job. Above it the two ink boxes; below it two boxes of water. A change of
 * material that happens between two coloured rectangles reads as a colour change; the same
 * change with the page's own white in the middle reads as the ink having cleared, which is
 * what the page is about. So the plainest section carries the idea.
 *
 * Which also suits what it holds. These are lists — dates, titles, one line each — and a
 * list wants a hairline and a date column, not weather behind it.
 *
 * There is no content for either yet, so both are bracketed placeholders held by the
 * production gate; see `content/site.no.ts`. A column with nothing in it is not rendered,
 * and neither is the section when both are empty — a headline over air is worse than a gap.
 */
export function Happenings({ events = site.events, news = site.news }: Props) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section || reducedMotion()) return;

      const rise = section.querySelectorAll<HTMLElement>('[data-rise]');
      // Hidden here rather than in the stylesheet, so a script that never runs leaves the
      // lists readable instead of blank. `opacity`, never `autoAlpha`: autoAlpha adds
      // visibility:hidden, which would take every row out of the accessibility tree until
      // a scroll event that may never arrive.
      gsap.set(rise, { opacity: 0, y: 18 });

      const tl = gsap.timeline({ paused: true });
      // Faster and tighter than the sections with boxes: there is no colour arriving with
      // it, and a list that dawdles in one item at a time reads as a page still loading.
      tl.to(rise, { opacity: 1, y: 0, duration: 0.8, ease: EASE.out, stagger: 0.06 });
      const entrance = ScrollTrigger.create({
        trigger: section, start: 'top 78%', once: true, onEnter: () => tl.play(),
      });

      return () => { entrance.kill(); };
    },
    { scope: root },
  );

  if (events.items.length === 0 && news.items.length === 0) return null;

  return (
    <section
      ref={root}
      id="arrangementer"
      className={styles.happenings}
      aria-label={`${events.label} og ${news.label}`}
    >
      <div className={styles.inner}>
        {events.items.length > 0 && (
          <div className={styles.column}>
            <p className={styles.label} data-rise>{events.label}</p>
            <h2 className={styles.line} data-rise>{events.line}</h2>
            <ul className={styles.list} aria-label={events.label}>
              {events.items.map((item, i) => (
                <li key={`${item.day}-${item.title}-${i}`} className={styles.event} data-rise>
                  {/* Not a `time` element: without a machine-readable `datetime` it would be
                      invalid, and the content has a day and a month rather than a date. */}
                  <p className={styles.date} data-date>
                    <span className={styles.day}>{item.day}</span>
                    <span className={styles.month}>{item.month}</span>
                  </p>
                  <div>
                    <p className={styles.title}>{item.title}</p>
                    <p className={styles.meta}>{item.meta}</p>
                    <p className={styles.note}>{item.note}</p>
                  </div>
                </li>
              ))}
            </ul>
            {events.href && (
              <a className={styles.more} href={events.href} data-rise>{events.more} →</a>
            )}
          </div>
        )}

        {news.items.length > 0 && (
          <div className={styles.column}>
            <p className={styles.label} data-rise>{news.label}</p>
            <h2 className={styles.line} data-rise>{news.line}</h2>
            <ul className={styles.list} aria-label={news.label}>
              {news.items.map((item, i) => (
                <li key={`${item.date}-${item.title}-${i}`} className={styles.news} data-rise>
                  <p className={styles.newsDate}>{item.date}</p>
                  <p className={styles.title}>{item.title}</p>
                  <p className={styles.note}>{item.note}</p>
                </li>
              ))}
            </ul>
            {news.href && (
              <a className={styles.more} href={news.href} data-rise>{news.more} →</a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
