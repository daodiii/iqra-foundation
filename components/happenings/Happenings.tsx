'use client';

import Image from 'next/image';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import wash from '@/components/wash.module.css';
import { site } from '@/content/site.no';
import { film } from '@/lib/film';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { createInkWhenNear, type InkHandle } from '@/lib/ink';
import { createWaterWhenNear, type WaterHandle } from '@/lib/water';
import styles from './happenings.module.css';

type Item = {
  /** ISO `YYYY-MM-DD`, or null while the entry is a placeholder. The day and the month are read off it. */
  date: string | null;
  title: string;
  meta?: string;
  note: string;
  /**
   * The photograph and the words for it, together or not at all — null where there is none,
   * which is all of them today. Paired so a picture cannot be added without its alt text.
   */
  image: { src: string; alt: string } | null;
};

type List = {
  label: string;
  more: string;
  href: string | null;
  items: readonly Item[];
};

type Props = {
  events?: List;
  news?: List;
};

const { happenings } = site;

/** Below this the row opens on today at the left edge rather than in the middle. The same line the stylesheet draws. */
const PHONE = '(max-width: 767px)';

type Kind = 'news' | 'event';
type Stop = { kind: Kind; item: Item; key: string };

/**
 * Where a stop sorts. A dated stop sorts by its date; an undated one — a placeholder — sorts
 * as its list would, news before any today and events after, so the row keeps its shape
 * while the content is still brackets. ISO dates compare as strings, which is why they are
 * strings all the way through and never a `Date`.
 */
const sortKey = (kind: Kind, date: string | null) => date ?? (kind === 'news' ? '0000-00-00' : '9999-99-99');

/** Today as the visitor sees it, local, in the same shape the content uses. */
function isoToday(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/*
 * Today is the client's: null on the server and through hydration, the visitor's date after.
 * An external store with nothing to subscribe to is how React is told that — the server
 * snapshot and the client snapshot differ on purpose, and React re-renders with the client's
 * once the page is live, without a state set inside an effect.
 */
const never = () => () => {};
const useToday = () => useSyncExternalStore(never, isoToday, () => null);

/** The day set large and the month beside it, both from the date — or the brackets. */
function dateParts(date: string | null): { day: string; month: string } {
  if (!date) return happenings.undated;
  return { day: String(Number(date.slice(8, 10))), month: happenings.months[Number(date.slice(5, 7)) - 1] ?? date.slice(5, 7) };
}

/**
 * Arrangementer · Nyheter, as one row on ink in lit water.
 *
 * The two lists are one row in date order, news and events mixed — «published by the date;
 * news or arrangement doesn't matter» — with «i dag» set where today falls between them.
 * The label on each card still says which it is; it decides nothing about the order.
 *
 * Today is the visitor's, so it is placed on the client after hydration rather than at
 * build time on a static page: the server renders the row without it, and the rail scrolls
 * to it when it appears. Nothing else on the page has a fixed point in it, which is what
 * makes this the one section you arrive at somewhere other than the start.
 *
 * Behind the row, the bridge between the ink boxes above and the water boxes below: the
 * page's own water (`lib/water.ts`, `film.bridge`) with the page's own inks dropped into it
 * (`lib/ink.ts` in its `over` mode, `film.drops`) — threads that fall in from the top,
 * unfurl, sink and thin out over the lit floor. Two canvases in one box; both are deferred
 * until the section is near and paused while it is off screen, like every other box.
 *
 * There is no content for either list yet, so every row is a bracketed placeholder held by
 * the production gate, and every picture is an empty frame; see `content/site.no.ts`. The
 * section is not rendered at all when both lists are empty.
 */
export function Happenings({ events = site.events, news = site.news }: Props) {
  const root = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const forward = useRef<HTMLButtonElement>(null);
  const today = useToday();

  /*
   * Arrive at today, not at the start of history — once it is on the row. Set on the rail's
   * own scrollLeft, so the page itself never moves: `scrollIntoView` on the marker would
   * drag the whole document to this section the moment it hydrates.
   *
   * On a desktop today stands in the middle with cards either side. On a phone that would
   * show half a card on each side and no whole one, so there today stands at the left edge
   * with the first thing coming fully in view beside it — «fully card» (2026-09-12) — and
   * the past is a swipe to the left. The breakpoint is the stylesheet's.
   */
  useEffect(() => {
    const track = rail.current;
    const marker = track?.querySelector<HTMLElement>('[data-today]');
    if (!track || !marker) return;
    const phone = window.matchMedia(PHONE).matches;
    const gutter = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    track.scrollLeft = phone
      ? marker.offsetLeft - gutter
      : marker.offsetLeft - track.clientWidth * 0.5 + marker.offsetWidth / 2;
  }, [today]);

  useGSAP(
    () => {
      const section = root.current;
      const track = rail.current;
      if (!section || !track) return;
      const reduced = reducedMotion();

      // The water under and the ink over it: two simulations, one box. Each declines on
      // its own where WebGL2 is missing and leaves the CSS still showing underneath.
      const waterCanvas = section.querySelector<HTMLCanvasElement>('[data-water]');
      const inkCanvas = section.querySelector<HTMLCanvasElement>('[data-ink]');
      const water: WaterHandle | null = waterCanvas
        ? createWaterWhenNear(waterCanvas, { reduced, floor: film.bridge, host: section })
        : null;
      const ink: InkHandle | null = inkCanvas
        ? createInkWhenNear(inkCanvas, { reduced, palette: film.drops, host: section })
        : null;

      const ends = () => {
        const max = track.scrollWidth - track.clientWidth;
        if (back.current) back.current.disabled = track.scrollLeft < 4;
        if (forward.current) forward.current.disabled = track.scrollLeft > max - 4;
      };
      ends();
      track.addEventListener('scroll', ends, { passive: true });

      /*
       * Drag the row with the pointer. A trackpad, a touch screen and the arrow keys all
       * move the same native overflow already; this is only for the mouse, which otherwise
       * has nothing to grab. The click that follows a real drag is swallowed so a stop is
       * still clickable but a drag never opens one.
       */
      let down: { x: number; left: number; moved: number } | null = null;
      const swallow = (e: Event) => e.preventDefault();
      const onDown = (e: PointerEvent) => {
        if (e.pointerType === 'touch') return;
        down = { x: e.clientX, left: track.scrollLeft, moved: 0 };
        track.setPointerCapture(e.pointerId);
        track.classList.add(styles.dragging);
      };
      const onMove = (e: PointerEvent) => {
        if (!down) return;
        const dx = e.clientX - down.x;
        down.moved = Math.max(down.moved, Math.abs(dx));
        track.scrollLeft = down.left - dx;
      };
      const onUp = (e: PointerEvent) => {
        if (!down) return;
        const { moved } = down;
        down = null;
        track.classList.remove(styles.dragging);
        if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId);
        if (moved > 6) track.addEventListener('click', swallow, { capture: true, once: true });
      };
      track.addEventListener('pointerdown', onDown);
      track.addEventListener('pointermove', onMove);
      track.addEventListener('pointerup', onUp);
      track.addEventListener('pointercancel', onUp);

      const stop = () => {
        track.removeEventListener('scroll', ends);
        track.removeEventListener('pointerdown', onDown);
        track.removeEventListener('pointermove', onMove);
        track.removeEventListener('pointerup', onUp);
        track.removeEventListener('pointercancel', onUp);
        water?.destroy();
        ink?.destroy();
      };

      if (reduced) return stop;

      const rise = section.querySelectorAll<HTMLElement>('[data-rise]');
      // Set here rather than in the stylesheet, so a script that never runs leaves the row
      // readable. `opacity`, never `autoAlpha`: autoAlpha adds visibility:hidden, which
      // would take every stop out of the accessibility tree until a scroll event arrives.
      gsap.set(rise, { opacity: 0, y: 18 });

      const tl = gsap.timeline({ paused: true });
      tl.to(rise, { opacity: 1, y: 0, duration: 0.8, ease: EASE.out, stagger: 0.08 });
      const entrance = ScrollTrigger.create({
        trigger: section, start: 'top 78%', once: true, onEnter: () => tl.play(),
      });

      return () => { entrance.kill(); stop(); };
    },
    { scope: root },
  );

  const row: Stop[] = [
    ...news.items.map((item) => ({ kind: 'news' as const, item, key: sortKey('news', item.date) })),
    ...events.items.map((item) => ({ kind: 'event' as const, item, key: sortKey('event', item.date) })),
  ].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

  if (row.length === 0) return null;

  // «I dag» goes before the first stop dated today or later; after everything if none is.
  const todayAt = today === null ? -1 : (() => { const i = row.findIndex((s) => s.key >= today); return i === -1 ? row.length : i; })();

  const nudge = (dir: number) => {
    const track = rail.current;
    if (!track) return;
    const stopEl = track.querySelector<HTMLElement>('li');
    const width = stopEl ? stopEl.getBoundingClientRect().width : 300;
    track.scrollBy({ left: dir * (width + 18), behavior: reducedMotion() ? 'auto' : 'smooth' });
  };

  const marker = (
    <li key="i-dag" className={styles.now} data-today>
      <span className={styles.stem} aria-hidden="true" />
      <span className={styles.peg} aria-hidden="true" />
      <p className={styles.flag}>{happenings.today}</p>
      <span className={styles.stem} aria-hidden="true" />
    </li>
  );

  return (
    <section ref={root} id="arrangementer" className={styles.happenings} aria-label={happenings.label}>
      <div className={styles.head}>
        <div data-rise>
          <p className={styles.label}>{happenings.label}</p>
          <h2 className={styles.line}>{happenings.line}</h2>
        </div>
        <div className={styles.arrows} data-rise>
          <button ref={back} type="button" className={styles.arrow} aria-label={happenings.back} onClick={() => nudge(-1)}>
            <Arrow dir="back" />
          </button>
          <button ref={forward} type="button" className={styles.arrow} aria-label={happenings.forward} onClick={() => nudge(1)}>
            <Arrow dir="forward" />
          </button>
        </div>
      </div>

      <div className={styles.pool}>
        {/* The box spans the row, not the heading: the water under, the ink over. */}
        <div className={`${wash.box} ${wash.bridge} ${styles.box}`} data-box aria-hidden="true">
          <canvas className={wash.paint} data-water />
          <canvas className={wash.paint} data-ink />
        </div>

        <div
          ref={rail}
          className={styles.rail}
          tabIndex={0}
          role="region"
          aria-label={happenings.railLabel}
        >
          {/* Ordered, because it is an order: the row is time and the list is what is on it. */}
          <ol className={styles.row} data-rise>
            {row.map((stop, i) => {
              const { item, kind } = stop;
              const { day, month } = dateParts(item.date);
              const card = (
                <li key={`${stop.key}-${i}`} className={`${styles.stop} ${kind === 'news' ? styles.past : ''}`}>
                  <article className={`${wash.card} ${styles.card}`}>
                    <p className={styles.kind}>{kind === 'event' ? happenings.kinds.event : happenings.kinds.news}</p>
                    <p className={styles.when}>
                      <span className={styles.day}>{day}</span>
                      <span className={styles.month}>{month}</span>
                    </p>
                    <h3 className={styles.title}>{item.title}</h3>
                    {item.meta && <p className={styles.meta}>{item.meta}</p>}
                    <p className={styles.note}>{item.note}</p>
                    <Frame item={item} />
                  </article>
                </li>
              );
              return i === todayAt ? [marker, card] : card;
            })}
            {todayAt === row.length && marker}
          </ol>
        </div>

        {(events.href || news.href) && (
          <p className={styles.links} data-rise>
            {events.href && <a className={styles.more} href={events.href}>{events.more} →</a>}
            {news.href && <a className={styles.more} href={news.href}>{news.more} →</a>}
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * The picture, or the room one would take.
 *
 * There are no photographs of this organisation, and the site already settled what to do
 * about that: the team list carries an empty circle where a face would go, because an
 * initial or a silhouette would be a face we do not have. A photograph of some other mosque
 * would be worse than either — the one placeholder a visitor could not tell from the real
 * thing, which is the rule that keeps the invented events out too. The frame is a window:
 * the water shows through it until there is a photograph to put in it.
 */
function Frame({ item }: { item: Item }) {
  if (!item.image) {
    return <p className={styles.frame} aria-hidden="true">{happenings.imageLabel}</p>;
  }
  return (
    <div className={styles.frame}>
      <Image
        src={item.image.src}
        alt={item.image.alt}
        fill
        // The frame is a fixed track on a desktop and most of the screen on a phone; without
        // this every one of them would be fetched at the full layout width.
        sizes="(max-width: 767px) 74vw, 256px"
        className={styles.photo}
      />
    </div>
  );
}

function Arrow({ dir }: { dir: 'back' | 'forward' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === 'back' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  );
}
