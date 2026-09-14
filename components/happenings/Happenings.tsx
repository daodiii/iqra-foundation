'use client';

import Image from 'next/image';
import { useRef } from 'react';
import wash from '@/components/wash.module.css';
import { site } from '@/content/site.no';
import { film } from '@/lib/film';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { createFrame, type FrameHandle, keepFramesFitted } from '@/lib/pen';
import { createWaterWhenNear, type WaterHandle } from '@/lib/water';
import styles from './happenings.module.css';

type Item = {
  /** ISO `YYYY-MM-DD`; the box writes it out. */
  date: string;
  /** The words in the box. */
  note: string;
  /**
   * The photograph and the words for it, together or not at all — null where there is
   * none. Paired so a picture cannot be added without its alt text.
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

type Kind = 'news' | 'event';

/** «24. september 2026» from `2026-09-24`: the day without its zero, the month in full. */
function dateText(date: string): string {
  const [year, month, day] = date.split('-');
  return `${Number(day)}. ${happenings.months[Number(month) - 1] ?? month} ${year}`;
}

/**
 * Arrangementer · Nyheter: four boxes on ink in lit water.
 *
 * The two lists are one row, the events in the order they are listed and then the news.
 * Each box is its kind on the frame's line, a picture, its date written out, and the words
 * under it. It used to be a timeline — one row in date order with «i dag» standing where
 * today fell, and the rail opening on it — until 2026-09-14: «take away today … let it
 * just be four boxes». So nothing sorts, and nothing here is placed on the client; the
 * date is printed on the box and decides nothing.
 *
 * On a desktop the boxes share the row's width; below that they keep their width and the
 * rail scrolls sideways, which on a phone is what it is for. Behind the row, still water:
 * the page's own water (`lib/water.ts`, `film.bridge`), sage, the shallowest box on the
 * page. It used to have the page's inks raining into it — two simulations in one box — and
 * was the loudest thing below the film for it; the ink went on 2026-09-12, «something much
 * calmer». One canvas, deferred until the section is near and paused while it is off
 * screen, like every other box.
 *
 * The boxes are filled with stand-ins so the section can be seen with something in it;
 * see `content/site.no.ts` for what they are and why the pictures carry a bracket. The
 * section is not rendered at all when both lists are empty.
 */
export function Happenings({ events = site.events, news = site.news }: Props) {
  const root = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      const track = rail.current;
      if (!section || !track) return;
      const reduced = reducedMotion();

      // The water: one simulation, one box. It declines where WebGL2 is missing and leaves
      // the CSS still showing underneath.
      const waterCanvas = section.querySelector<HTMLCanvasElement>('[data-water]');
      const water: WaterHandle | null = waterCanvas
        ? createWaterWhenNear(waterCanvas, { reduced, floor: film.bridge, host: section })
        : null;

      // The frame round every box, drawn with the tree's pen — the ones scrolled out of
      // view too, so the row is whole wherever the visitor arrives on it.
      const frames = Array.from(section.querySelectorAll<HTMLCanvasElement>('[data-frame-canvas]'))
        .map((c) => (c.parentElement ? createFrame(c.parentElement) : null))
        .filter((f): f is FrameHandle => f !== null);
      const fitted = keepFramesFitted(frames);
      frames.forEach((f) => f.layout());

      /*
       * Drag the row with the pointer, where the row is wider than the rail. A trackpad, a
       * touch screen and the arrow keys all move the same native overflow already; this is
       * only for the mouse, which otherwise has nothing to grab. The click that follows a
       * real drag is swallowed so a box is still clickable but a drag never opens one.
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
        track.removeEventListener('pointerdown', onDown);
        track.removeEventListener('pointermove', onMove);
        track.removeEventListener('pointerup', onUp);
        track.removeEventListener('pointercancel', onUp);
        fitted();
        frames.forEach((f) => f.destroy());
        water?.destroy();
      };

      // The frames are drawn whole, not by the pen: below Misjon the boxes are simply there
      // («the animation of making the boxes can go away after misjon», 2026-09-13), and
      // only what is in them still rises.
      frames.forEach((f) => { f.p = 1; f.draw(); });
      if (reduced) return stop;

      const rise = section.querySelectorAll<HTMLElement>('[data-rise]');
      // Set here rather than in the stylesheet, so a script that never runs leaves the row
      // readable. `opacity`, never `autoAlpha`: autoAlpha adds visibility:hidden, which
      // would take every box out of the accessibility tree until a scroll event arrives.
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

  const row: { kind: Kind; item: Item }[] = [
    ...events.items.map((item) => ({ kind: 'event' as const, item })),
    ...news.items.map((item) => ({ kind: 'news' as const, item })),
  ];

  if (row.length === 0) return null;

  return (
    <section ref={root} id="arrangementer" className={styles.happenings} aria-label={happenings.label}>
      <div className={styles.head} data-rise>
        <p className={styles.label}>{happenings.label}</p>
        <h2 className={styles.line}>{happenings.line}</h2>
      </div>

      <div className={styles.pool}>
        {/* The box spans the row, not the heading. */}
        <div className={`${wash.box} ${wash.bridge} ${styles.box}`} data-box aria-hidden="true">
          <canvas className={wash.paint} data-water />
        </div>

        <div
          ref={rail}
          className={styles.rail}
          tabIndex={0}
          role="region"
          aria-label={happenings.railLabel}
        >
          <ul className={styles.row} data-rise>
            {row.map(({ kind, item }, i) => (
              <li key={`${kind}-${i}`} className={styles.stop}>
                <article className={`${wash.frame} ${styles.card}`}>
                  <canvas className={wash.frameCanvas} data-frame-canvas aria-hidden="true" />
                  {/* The kind is the legend, on the frame's top line. */}
                  <p className={`${wash.legend} ${styles.kind}`} data-legend>{kind === 'event' ? happenings.kinds.event : happenings.kinds.news}</p>
                  <Frame item={item} />
                  <p className={styles.when}><time dateTime={item.date}>{dateText(item.date)}</time></p>
                  <p className={styles.note}>{item.note}</p>
                </article>
              </li>
            ))}
          </ul>
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
 * There are no photographs of this organisation, and the site settled what to do about
 * that: the team list carries an empty circle where a face would go, because an initial
 * or a silhouette would be a face we do not have. The four pictures in the content file
 * today are stock stand-ins, put there to see the section with something in it, and each
 * says so in its alt where the content gate can read it. Where there is none, the frame is
 * a window: the water shows through it until there is a photograph to put in it.
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
        // A quarter of the rail on a desktop, a fixed box below that, most of the screen on
        // a phone; without this every one of them would be fetched at the full layout width.
        sizes="(max-width: 767px) 70vw, (max-width: 1199px) 256px, 25vw"
        className={styles.photo}
      />
    </div>
  );
}
