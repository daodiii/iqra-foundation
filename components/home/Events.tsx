'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Flat } from '@/components/materials/Flat';
import { AreaMark } from '@/components/site/AreaMark';
import { site } from '@/content/site.no';
import type { Event } from '@/lib/content';
import { timeLeft, writeDateTime, zonedTime } from '@/lib/dates';
import { Arrive } from './Arrive';
import styles from './events.module.css';
import { Scene } from './Scene';
import { Words } from './Words';

/**
 * Arrangementer as Neste, the owner's choice of 2026-09-17: on one navy plate the next
 * event is the statement — its date in a line, its title word by word at the vision's
 * size, its place and its area, and under it a count of the days, hours, minutes and
 * seconds until it starts, ticking. The two after it stand as small rows beside the
 * brief's paragraph. While nothing is coming: the honest line and the paragraph. The
 * home page shows three at most, as before.
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
    <Scene>
      <Flat tint="navy" className={styles.plate}>
        <Arrive as="div">
          <section id="arrangementer" aria-labelledby="arrangementer-tittel" className={styles.wrap}>
            <div className={styles.main}>
              <h2 id="arrangementer-tittel" className={styles.name} data-prose>{t.title}</h2>
              {next ? (
                <>
                  <p className={styles.when} data-prose>{writeDateTime(next.start, next.time)}</p>
                  <h3 className={styles.title}><Words text={next.title} /></h3>
                  <p className={styles.place} data-prose>{next.place}</p>
                  {next.area && <p className={styles.area} data-prose><AreaMark area={next.area} /></p>}
                  <Count event={next} />
                </>
              ) : (
                <p className={styles.text} data-prose>{t.emptyUpcoming}</p>
              )}
            </div>
            <div className={styles.side}>
              <p className={styles.text} data-prose>{t.description}</p>
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
            </div>
          </section>
        </Arrive>
      </Flat>
    </Scene>
  );
}
