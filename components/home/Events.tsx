'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Flat } from '@/components/materials/Flat';
import { AreaMark } from '@/components/site/AreaMark';
import { pageHref, TitleLink } from '@/components/site/TitleLink';
import { site } from '@/content/site.no';
import type { Event } from '@/lib/content';
import { timeLeft, writeDateTime, zonedTime } from '@/lib/dates';
import { soft } from '@/lib/soft';
import { Arrive } from './Arrive';
import styles from './events.module.css';
import plate from './plate.module.css';
import { Scene } from './Scene';
import { Words } from './Words';

/**
 * Arrangementer as Neste, the owner's choice of 2026-09-17: on one navy plate the next
 * event is the statement — its date in a line, its title word by word at the vision's
 * size, its place and its area, and under it a count of the days, hours, minutes and
 * seconds until it starts, ticking. The two after it stand as small rows beside the
 * brief's paragraph. While nothing is coming: the name as the heading, the honest line and the
 * paragraph, on a plate that stands shorter (`data-empty`) — no band announcing that nothing is
 * happening. Either way the name is the way on to /arrangementer (`TitleLink`), where the past
 * events are. The home page shows three at most, as before.
 *
 * Elite study: it opens as every section does — «Arrangementer» a section title on the grid's
 * first column (it was a 15px grey label), the brief's paragraph beside it — on the navy ramp's
 * lifted step, so it is not the seal's navy again two plates later.
 */

const t = site.pages.events;

/** «30.09», a row's short date. */
const ddmm = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;

/**
 * The time left to an event, ticking once a second until the instant has passed, when the
 * count stands at zeros and the ticking stops. Nothing until mounted — the server cannot
 * know the visitor's now, and the two must agree at hydration. Under reduced motion it is
 * read once and stands.
 */
function Count({ event }: { event: Event }) {
  const [left, setLeft] = useState<ReturnType<typeof timeLeft> | null>(null);
  useEffect(() => {
    const at = zonedTime(event.start, event.time);
    const tick = () => setLeft(timeLeft(at - Date.now()));
    tick();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      tick();
      if (at <= Date.now()) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [event.start, event.time]);
  if (!left) return <dl className={styles.count} aria-hidden="true" />;
  const two = (n: number) => String(n).padStart(2, '0');
  const parts: [string, string][] = [
    [String(left.days), t.count.days],
    [two(left.hours), t.count.hours],
    [two(left.minutes), t.count.minutes],
    [two(left.seconds), t.count.seconds],
  ];
  return (
    <dl className={styles.count}>
      {parts.map(([value, label]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Events({ upcoming }: { upcoming: Event[] }) {
  const [next, ...rest] = upcoming.slice(0, 3);
  return (
    <Scene dark>
      <Flat tint="navy-lift" className={`${plate.plate} ${styles.plate}`}>
        <Arrive as="div">
          <section id="arrangementer" aria-labelledby="arrangementer-tittel" className={`${plate.grid} ${styles.wrap}`} data-empty={next ? undefined : ''}>
            <div className={plate.head}>
              <div className={styles.name}>
                <h2 id="arrangementer-tittel" className={styles.heading} data-title>
                  <TitleLink href={pageHref(t.label)}>{t.title}</TitleLink>
                </h2>
                {!next && <p className={styles.empty} data-prose>{t.emptyUpcoming}</p>}
              </div>
              <p className={plate.lede} data-prose>{soft(t.description)}</p>
            </div>
            {next ? (
              <>
                <div className={styles.main}>
                  <p className={styles.when} data-prose>{writeDateTime(next.start, next.time)}</p>
                  <h3 className={styles.title}><Words text={next.title} /></h3>
                  <p className={styles.place} data-prose>{next.place}</p>
                  {next.area && <p className={styles.area} data-prose><AreaMark area={next.area} /></p>}
                  <Count event={next} />
                </div>
                {rest.length > 0 && (
                  <ol className={styles.rows}>
                    {rest.map((e, i) => (
                      <li key={e.slug} className={styles.row} data-card style={{ '--i': i + 1 } as CSSProperties}>
                        <span className={styles.rowWhen}>{ddmm(e.start)}{e.time && ` · ${e.time}`}</span>
                        <h3 className={styles.rowWhat}>{e.title}</h3>
                        <span className={styles.rowWhere}>{e.place}</span>
                        {e.area && <span className={styles.rowArea}><AreaMark area={e.area} /></span>}
                      </li>
                    ))}
                  </ol>
                )}
              </>
            ) : null}
          </section>
        </Arrive>
      </Flat>
    </Scene>
  );
}
