'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import { clamp, eio, onFrame, reducedMotion } from './frame';
import { Knapp } from './Knapp';
import { EVENTS_HREF, NEWS_HREF } from './lenker';
import f from './forside.module.css';
import styles from './plakater.module.css';

/** A coming event as a poster: the day large, the month and year, the title, the time and the place. */
export type Poster = { slug: string; day: string; month: string; title: string; meta: string; dateTime: string };
/** A news item in the strip: its date written out, its title, its ingress, and where it leads. */
export type Strip = { slug: string; date: string; dateTime: string; title: string; summary: string; href: string };

const POSTER = [styles.p1, styles.p2, styles.p3];
const t = site.pages.news;
const h = klient.home.news;

/**
 * «Aktuelt», Plakatene: the site's real coming events and latest news, three of each at most, or the
 * site's own empty line for each list while nothing is published.
 */
export function Plakater({ events, news }: { events: Poster[]; news: Strip[] }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = reducedMotion();
    // the reveal, one after another among its siblings
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          const n = e.target as HTMLElement;
          const sib = Array.from(n.parentElement?.children ?? []).filter((c) => c.hasAttribute('data-rv'));
          n.style.transitionDelay = `${Math.max(0, sib.indexOf(n)) * 0.08}s`;
          n.dataset.in = '';
          io.unobserve(n);
        }),
      { rootMargin: '0px 0px -8% 0px' },
    );
    el.querySelectorAll('[data-rv]').forEach((n) => io.observe(n));
    const rule = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          (e.target as HTMLElement).dataset.in = '';
          rule.unobserve(e.target);
        }),
      { rootMargin: '0px 0px -10% 0px' },
    );
    el.querySelectorAll('[data-sv]').forEach((n) => rule.observe(n));

    // the posters rise into place and un-tilt as they arrive, and lean toward a mouse
    const posters = Array.from(el.querySelectorAll<HTMLElement>('[data-po]'));
    const offs = posters.map((po) => {
      const move = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse' || reduce) return;
        const r = po.getBoundingClientRect();
        const u = (e.clientX - r.left) / r.width;
        const v = (e.clientY - r.top) / r.height;
        po.style.setProperty('--ry', `${((u - 0.5) * 14).toFixed(2)}deg`);
        po.style.setProperty('--rx', `${((0.5 - v) * 12).toFixed(2)}deg`);
        po.style.setProperty('--lx', `${(u * 100).toFixed(1)}%`);
        po.style.setProperty('--ly', `${(v * 100).toFixed(1)}%`);
        po.style.setProperty('--lo', '1');
      };
      const leave = () => {
        po.style.setProperty('--ry', '0deg');
        po.style.setProperty('--rx', '0deg');
        po.style.setProperty('--lo', '0');
      };
      po.addEventListener('pointermove', move);
      po.addEventListener('pointerleave', leave);
      return () => {
        po.removeEventListener('pointermove', move);
        po.removeEventListener('pointerleave', leave);
      };
    });
    const stop = posters.length
      ? onFrame(() => {
          const H = window.innerHeight;
          posters.forEach((po, i) => {
            if (po.matches(':hover')) return;
            const r = po.getBoundingClientRect();
            const g = reduce ? 1 : eio(clamp((H * 0.98 - r.top) / (H * 0.55) - i * 0.12));
            po.style.setProperty('--rx', `${((1 - g) * 24).toFixed(2)}deg`);
            po.style.setProperty('--ty', `${((1 - g) * 90).toFixed(1)}px`);
            po.style.setProperty('--op', (0.15 + 0.85 * g).toFixed(3));
          });
        })
      : () => {};
    return () => {
      io.disconnect();
      rule.disconnect();
      offs.forEach((off) => off());
      stop();
    };
  }, []);

  return (
    <section ref={root} id="aktuelt" className={`${styles.pk} ${f.layer} ${f.layerIn} ${f.layerOut}`} style={{ zIndex: 4 }} aria-labelledby="aktuelt-tittel" data-lag="aktuelt">
      <div className={styles.hd}>
        <h2 id="aktuelt-tittel" className={styles.rv} data-rv>
          {h.title}
        </h2>
        <p className={`${styles.leadIn} ${styles.rv}`} data-rv>
          {h.intro}
        </p>
      </div>

      <div className={styles.sub}>
        <h3 className={styles.rv} data-rv>
          {t.upcoming}
        </h3>
        <span className={styles.rv} data-rv>
          <Knapp href={EVENTS_HREF} kind="ring" className={styles.all}>
            {site.pages.home.allEvents}
          </Knapp>
        </span>
      </div>
      {events.length ? (
        <ul className={styles.posters}>
          {events.map((e, i) => (
            <li key={e.slug}>
              <Link href={EVENTS_HREF} prefetch={false} className={`${styles.po} ${POSTER[i % 3]}`} data-po>
                {i === 0 && <span className={styles.pin} aria-hidden="true" />}
                <time className={styles.dd} dateTime={e.dateTime}>
                  {e.day}
                </time>
                <span className={`${styles.mm} ${styles.label}`}>{e.month}</span>
                <h4>{e.title}</h4>
                <span className={styles.meta}>{e.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>{t.emptyUpcoming}</p>
      )}

      <div className={styles.sub}>
        <h3 className={styles.rv} data-rv>
          {t.newsTitle}
        </h3>
        <span className={styles.rv} data-rv>
          <Knapp href={NEWS_HREF} kind="ring" className={styles.all}>
            {h.all}
          </Knapp>
        </span>
      </div>
      {news.length ? (
        <ul className={styles.strip}>
          {news.map((n) => (
            <li key={n.slug}>
              <Link href={n.href} prefetch={false} className={styles.sv} data-sv>
                <time className={`${styles.meta} ${styles.label}`} dateTime={n.dateTime}>
                  {n.date}
                </time>
                <h4>
                  <span className={styles.tl}>{n.title}</span>
                </h4>
                <p className={styles.sum}>{n.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>{t.emptyNews}</p>
      )}
    </section>
  );
}
