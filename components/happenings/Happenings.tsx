'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { site } from '@/content/site.no';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import styles from './happenings.module.css';

type Item = {
  day: string;
  month: string;
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
const MONTHS: Record<string, string> = happenings.months;

/** The month above the line. Anything the map does not know — a bracket, for now — is
 *  shown as it was written rather than swallowed. */
const monthWord = (month: string) => MONTHS[month] ?? month;

type Stop =
  | { kind: 'news' | 'event'; item: Item }
  | { kind: 'today' };

/**
 * Arrangementer · Nyheter, as one time axis.
 *
 * The two lists were two columns; they are one line now, and that is a claim about the
 * content rather than a layout: news lie BEHIND «i dag» and events AHEAD of it, so the
 * section is the same line read each way. Nothing else on the page has a fixed point in it,
 * which is what makes this the one section you arrive at somewhere other than the start.
 *
 * The pictures hug the axis from both sides and the words run outward from it, so the frames
 * make a corridor along the line and it is the pictures that carry the eye sideways. The
 * line itself only has to keep the time.
 *
 * It stays the page's breath between the ink above and the water below — no box, no ground,
 * nothing but the page's own white — because a change of material that happens between two
 * coloured rectangles reads as a change of colour, and the same change with white in the
 * middle reads as the ink having cleared.
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

  useGSAP(
    () => {
      const section = root.current;
      const track = rail.current;
      if (!section || !track) return;

      /*
       * Arrive at today, not at the start of history. Set on the rail's own scrollLeft, so
       * the page itself never moves: `scrollIntoView` on the marker would drag the whole
       * document to this section the moment it hydrates.
       */
      const today = track.querySelector<HTMLElement>('[data-today]');
      if (today) track.scrollLeft = today.offsetLeft - track.clientWidth * 0.36;

      const ends = () => {
        const max = track.scrollWidth - track.clientWidth;
        if (back.current) back.current.disabled = track.scrollLeft < 4;
        if (forward.current) forward.current.disabled = track.scrollLeft > max - 4;
      };
      ends();
      track.addEventListener('scroll', ends, { passive: true });

      /*
       * Drag the line with the pointer. A trackpad, a touch screen and the arrow keys all
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
      };

      if (reducedMotion()) return stop;

      const rise = section.querySelectorAll<HTMLElement>('[data-rise]');
      // Set here rather than in the stylesheet, so a script that never runs leaves the axis
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

  const axis: Stop[] = [
    ...news.items.map((item) => ({ kind: 'news' as const, item })),
    { kind: 'today' as const },
    ...events.items.map((item) => ({ kind: 'event' as const, item })),
  ];

  if (events.items.length === 0 && news.items.length === 0) return null;

  const nudge = (dir: number) => {
    const track = rail.current;
    if (!track) return;
    const stopEl = track.querySelector<HTMLElement>('li');
    const width = stopEl ? stopEl.getBoundingClientRect().width : 246;
    track.scrollBy({ left: dir * width, behavior: reducedMotion() ? 'auto' : 'smooth' });
  };

  let named: string | null = null;

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

      <div
        ref={rail}
        className={styles.rail}
        tabIndex={0}
        role="region"
        aria-label={happenings.railLabel}
      >
        {/* Ordered, because it is an order: the axis is time and the list is what is on it. */}
        <ol className={styles.axis} data-rise>
          {axis.map((stop, i) => {
            if (stop.kind === 'today') {
              return (
                <li key="i-dag" className={styles.now} data-today>
                  <span className={styles.peg} aria-hidden="true" />
                  <p className={styles.flag}>{happenings.today}</p>
                </li>
              );
            }
            const { item } = stop;
            // Named once, where it changes. On every stop it stops being a ruler and
            // becomes noise; the eye only needs telling when the month turns over.
            const turned = item.month !== named;
            named = item.month;
            return (
              <li key={`${item.month}-${item.day}-${i}`} className={`${styles[stop.kind]} ${styles.stop}`}>
                {turned && <span className={styles.mark}>{monthWord(item.month)}</span>}
                <article className={styles.body}>
                  <p className={styles.kind}>
                    {stop.kind === 'event' ? happenings.kinds.event : happenings.kinds.news}
                  </p>
                  <p className={styles.when}>
                    <span className={styles.day}>{item.day}</span>
                    <span className={styles.month}>{item.month}</span>
                  </p>
                  <h3 className={styles.title}>{item.title}</h3>
                  {item.meta && <p className={styles.meta}>{item.meta}</p>}
                  <p className={styles.note}>{item.note}</p>
                  <Frame item={item} />
                </article>
                <span className={styles.peg} aria-hidden="true" />
              </li>
            );
          })}
        </ol>
      </div>

      {(events.href || news.href) && (
        <p className={styles.links} data-rise>
          {events.href && <a className={styles.more} href={events.href}>{events.more} →</a>}
          {news.href && <a className={styles.more} href={news.href}>{news.more} →</a>}
        </p>
      )}
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
 * thing, which is the rule that keeps the invented events out too.
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
        sizes="(max-width: 767px) 74vw, 246px"
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
