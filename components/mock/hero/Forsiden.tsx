'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { LOCKUP_VIEWBOX, LOCKUP_WORD } from '@/components/home/lockup';
import { MARK_ACCENTS, MARK_LETTERS } from '@/components/home/mark';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import styles from './forsiden.module.css';

const ORDER = ['kunnskap', 'samfunnsdeltakelse', 'dialog', 'moteplasser'];
const AREAS = ORDER.map((key) => {
  const a = brief.areas.find((x) => x.key === key)!;
  return { key, name: a.name, first: a.text.split('. ')[0] + '.' };
});

const long = (iso: string, weekday: boolean) =>
  new Intl.DateTimeFormat('nb-NO', {
    timeZone: 'Europe/Oslo',
    weekday: weekday ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${iso}T12:00:00Z`));

type Next = { title: string; start: string; time: string | null; place: string } | null;

/** Days, hours, minutes, seconds to an instant; zeros once it has passed. */
function left(to: number, now: number) {
  const s = Math.max(0, Math.floor((to - now) / 1000));
  return [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60];
}

/**
 * MOCK 11 Forsiden. The first screen set as the front page of a serious journal: the guide's lockup
 * as the masthead with the place and today's date, a heavy navy rule drawn under it, the brief's
 * paragraph as the lead with the two buttons, the next event with a live count to it, and the four
 * areas as four columns in their own colours, each with its first sentence from the brief. Nothing
 * held back: everything a visitor came for is on the first screen, set with care, and it arrives
 * like a page being printed, top to bottom.
 */
export function Forsiden({ today, next }: { today: string; next: Next }) {
  const hero = useRef<HTMLElement>(null);
  const [count, setCount] = useState<number[] | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => hero.current?.setAttribute('data-in', ''));
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    if (!next) return;
    const to = new Date(`${next.start}T${next.time ?? '00:00'}:00`).getTime();
    const tick = () => setCount(left(to, Date.now()));
    const first = window.setTimeout(tick, 0);
    const t = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [next]);

  return (
    <section ref={hero} className={styles.hero} aria-labelledby="hovedtekst">
      <div className={styles.masthead}>
        <h1 id="hovedtekst" className={styles.mark}>
          <svg viewBox={LOCKUP_VIEWBOX} role="img" aria-label={site.logoAlt}>
            {MARK_LETTERS.map((p, k) => (
              <path key={k} className={styles.letter} transform={p.transform} d={p.d} />
            ))}
            {LOCKUP_WORD.map((p, k) => (
              <path key={k} className={styles.letter} transform={p.transform} d={p.d} />
            ))}
            {MARK_ACCENTS.map((p, k) => (
              <path key={k} className={styles.accent} transform={p.transform} d={p.d} />
            ))}
          </svg>
        </h1>
        <p className={styles.dateline}>
          {site.place}
          <br />
          <time dateTime={today}>{long(today, true)}</time>
        </p>
      </div>
      <span className={styles.rule} aria-hidden="true" />
      <div className={styles.lead}>
        <p className={styles.lede}>{brief.home.paragraph}</p>
        <p className={styles.buttons}>
          <Link href={site.cta.work.href} prefetch={false} className={styles.work}>{site.cta.work.label}</Link>
          <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
        </p>
      </div>
      {next && (
        <Link href="/arrangementer" prefetch={false} className={styles.next}>
          <span className={styles.when}>
            <time dateTime={next.start}>{long(next.start, false)}</time>
            {next.time ? ` kl. ${next.time}` : ''}
          </span>
          <span className={styles.title}>{next.title}</span>
          <span className={styles.count} aria-label="Tid igjen">
            {['dager', 'timer', 'min', 'sek'].map((u, i) => (
              <span key={u} className={styles.unit}>
                <span className={styles.num}>{count ? String(count[i]).padStart(2, '0') : '00'}</span>
                <span className={styles.lab}>{u}</span>
              </span>
            ))}
          </span>
        </Link>
      )}
      <ul className={styles.areas} aria-label="Fire områder">
        {AREAS.map((a, i) => (
          <li key={a.key} data-area={a.key} style={{ '--i': i } as CSSProperties}>
            <Link href={`/vart-arbeid#${a.key}`} prefetch={false} className={styles.area}>
              <span className={styles.name}>{a.name}</span>
              <span className={styles.first}>{a.first}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
