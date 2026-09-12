'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import wash from '@/components/wash.module.css';
import { site } from '@/content/site.no';
import { film } from '@/lib/film';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { createFrame, type FrameHandle, keepFramesFitted } from '@/lib/pen';
import { createWaterWhenNear } from '@/lib/water';
import { setWordmarkOnDark } from '@/lib/wordmark';
import styles from './people.module.css';

/*
 * Both cards are the book's own chapters, so the landing page and `/om-oss` cannot drift:
 * chapter I is the story, chapter II the people. Read here rather than inside the component
 * because it is a content lookup, not a render.
 */
const [story, menneskene] = site.about.chapters;

/**
 * The member card's three parts, in reading order. `arrive` is the entrance the card was
 * set from: the role slides in from the left, the portrait settles, the name and the line
 * slide in from the right. It plays once when the card is scrolled to, and again on every
 * press of the arrow — so a step reads as the next person arriving, not as text swapping.
 */
function parts(row: HTMLElement) {
  return {
    role: row.querySelector('[data-part="role"]'),
    portrait: row.querySelector('[data-part="portrait"]'),
    info: row.querySelector('[data-part="info"]'),
  };
}

function hide(row: HTMLElement) {
  const { role, portrait, info } = parts(row);
  gsap.set(role, { opacity: 0, x: -20 });
  gsap.set(portrait, { opacity: 0, scale: 0.95, y: 30 });
  gsap.set(info, { opacity: 0, x: 40 });
}

function arrive(row: HTMLElement, frame: FrameHandle | null) {
  const { role, portrait, info } = parts(row);
  const tl = gsap.timeline();
  // The first arrival draws the frame with the tree's pen; a step has the line already.
  if (frame) tl.to(frame, { p: 1, duration: 1.1, ease: EASE.none, onUpdate: () => frame.draw() }, 0);
  return tl
    .to(role, { opacity: 1, x: 0, duration: 0.5, ease: EASE.out }, 0)
    .to(portrait, { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: EASE.out }, 0.05)
    .to(info, { opacity: 1, x: 0, duration: 0.6, ease: EASE.out }, 0.2);
}

/** One arrow, drawn pointing right; the back ring turns it round in the stylesheet. */
function Arrow() {
  return (
    <svg
      className={styles.arrow}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/**
 * Om oss · Teamet, on Arafat.
 *
 * The first box of WATER on the page: above it the ink of the cave and the mosque, below it
 * the green of the ask. Arafat is the one scene of the hero film the page had never used and
 * it is the gathering — a plain with everyone standing on it — so it belongs under the
 * section that says who «we» are, and the people are on it rather than beside it.
 *
 * Two cards drawn on the water, story left and team right, because they are two different
 * kinds of reading: a paragraph you follow and a list you scan. The story stops one
 * paragraph short of the chapter it quotes, which is what makes «Les hele historien» an
 * offer rather than a label.
 *
 * Under the two, one card for one person at a time: a portrait, the name set at display
 * size across its edge, the role above with a count beside it, and a line about them next
 * to two round arrows. The large one is how you meet the next person and the small one
 * takes you back — six cards in a row were a screen and a half of the same shape, and a
 * list of people is not what a team is. The count is there so the arrows say what they
 * do before anyone presses them.
 */
export function People() {
  const root = useRef<HTMLElement>(null);
  const row = useRef<HTMLDivElement>(null);
  /** The member card's frame, shared with the step effect below: a step re-measures it. */
  const frame = useRef<FrameHandle | null>(null);
  const [index, setIndex] = useState(0);
  const member = menneskene.team[index];
  const count = menneskene.team.length;

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const reduced = reducedMotion();

      const canvas = section.querySelector<HTMLCanvasElement>('[data-water]');
      const water = canvas
        ? createWaterWhenNear(canvas, { reduced, floor: film.people, host: section })
        : null;

      // The frames, drawn with the tree's pen: one round each of the two cards, one round the
      // member card. Measured at rest, before anything is hidden.
      const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-rise]'));
      const cardFrames = cards.map((c) => createFrame(c));
      const card = row.current;
      frame.current = card ? createFrame(card) : null;
      const all = [...cardFrames, frame.current].filter((f): f is FrameHandle => f !== null);
      const fitted = keepFramesFitted(all);
      all.forEach((f) => f.layout());

      /*
       * Light frames on a mid-tone floor, so the wordmark stays navy across this section as
       * it does over the ink above. Said rather than assumed, for the reason the other
       * sections carry: on a refresh the hero's scrubbed onUpdate re-fires at progress 1
       * and paints the wordmark white, which over this box is nearly invisible.
       */
      const watcher = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        onEnter: () => setWordmarkOnDark(false),
        onEnterBack: () => setWordmarkOnDark(false),
        onRefresh: (self) => { if (self.isActive) setWordmarkOnDark(false); },
      });

      const stop = () => {
        watcher.kill();
        fitted();
        all.forEach((f) => f.destroy());
        frame.current = null;
        water?.destroy();
      };
      if (reduced) {
        all.forEach((f) => { f.p = 1; f.draw(); });
        return stop;
      }

      const rise = section.querySelectorAll<HTMLElement>('[data-rise]');
      // Set here rather than in the stylesheet, so a script that never runs leaves both
      // cards readable. `opacity`, never `autoAlpha` — see the same note in Mission.
      gsap.set(rise, { opacity: 0, y: 22 });

      const tl = gsap.timeline({ paused: true });
      tl.to(rise, { opacity: 1, y: 0, duration: 0.95, ease: EASE.out, stagger: 0.12 });
      // Each card's frame is drawn as the card rises, in the same stagger.
      cardFrames.forEach((f, i) => {
        if (f) tl.to(f, { p: 1, duration: 1.1, ease: EASE.none, onUpdate: () => f.draw() }, i * 0.12);
      });
      const entrance = ScrollTrigger.create({
        trigger: section, start: 'top 72%', once: true, onEnter: () => tl.play(),
      });

      // The member card arrives on its own, when it is reached — it is a screen below the
      // two cards, and a card that had faded in before it was scrolled to would be one the
      // reader never saw arrive.
      if (card) hide(card);
      const arrival = card
        ? ScrollTrigger.create({
            trigger: card, start: 'top 85%', once: true, onEnter: () => { arrive(card, frame.current); },
          })
        : null;

      return () => { entrance.kill(); arrival?.kill(); stop(); };
    },
    { scope: root },
  );

  /*
   * A step replays the entrance on the new person. Not on mount: the first arrival is the
   * scroll trigger's, above, and playing it here as well would show the card twice.
   */
  const stepped = useRef(false);
  useGSAP(
    () => {
      const card = row.current;
      if (!card || reducedMotion()) return;
      if (!stepped.current) { stepped.current = true; return; }
      // The role is the legend on the line, and the new one is another width: the frame is
      // measured again and redrawn closed round it before the parts replay.
      frame.current?.layout();
      hide(card);
      arrive(card, null);
    },
    { scope: root, dependencies: [index] },
  );

  return (
    <section
      ref={root}
      id="om-oss-teamet"
      className={styles.people}
      aria-label={site.people.sectionLabel}
    >
      <div className={`${wash.box} ${wash.people}`} aria-hidden="true">
        <canvas className={wash.paint} data-water />
      </div>

      <div className={styles.inner}>
        <div className={`${wash.frameOnWater} ${styles.card}`} data-rise>
          <canvas className={wash.frameCanvas} data-frame-canvas aria-hidden="true" />
          <p className={`${wash.legend} ${styles.label}`} data-legend>{site.about.label}</p>
          <p className={styles.lede}>{story.lede}</p>
          {story.paras.slice(0, 2).map((para) => (
            <p key={para} className={styles.para}>{para}</p>
          ))}
          <Link className={styles.more} href="/om-oss" prefetch={false}>
            {site.people.more} →
          </Link>
        </div>

        <div className={`${wash.frameOnWater} ${styles.card}`} data-rise>
          <canvas className={wash.frameCanvas} data-frame-canvas aria-hidden="true" />
          <p className={`${wash.legend} ${styles.label}`} data-legend>{site.people.teamLabel}</p>
          <p className={styles.lede}>{menneskene.lede}</p>
          <p className={styles.count}>{menneskene.paras[0]}</p>
        </div>

        <div
          ref={row}
          className={`${wash.frameOnWater} ${styles.row}`}
          data-row
          data-index={index}
          aria-label={site.people.teamLabel}
        >
          <canvas className={wash.frameCanvas} data-frame-canvas aria-hidden="true" />
          {/* The role is the legend on the line; the count stays inside, at the top right. */}
          <p className={`${wash.legend} ${styles.eyebrow}`} data-legend data-part="role">{member.role}</p>
          <p className={`${styles.eyebrow} ${styles.counter}`} data-counter>{index + 1} / {count}</p>
          <div className={styles.body}>
            {/* An empty rectangle where a photograph would go. Drawn rather than left out,
                because the card's shape is what it will be when it has a face in it — and
                an initial or a silhouette would be a face we do not have. */}
            <div className={styles.portrait} data-part="portrait" aria-hidden="true" />
            {/* Announced on each step: the name and the line are what changed. */}
            <div className={styles.info} data-part="info" aria-live="polite">
              <p className={styles.display}>
                <span className={styles.first}>{member.first}</span>
                <span className={styles.last}>{member.last}</span>
              </p>
              <div className={styles.details}>
                {/* Back is the smaller ring, and first: the eye lands on the large one,
                    which is the way the card was designed to be read — on. */}
                <button
                  type="button"
                  className={`${styles.go} ${styles.back}`}
                  aria-label={site.people.prev}
                  onClick={() => setIndex((i) => (i + count - 1) % count)}
                >
                  <Arrow />
                </button>
                <button
                  type="button"
                  className={styles.go}
                  aria-label={site.people.next}
                  onClick={() => setIndex((i) => (i + 1) % count)}
                >
                  <Arrow />
                </button>
                <p className={styles.bio}>{member.bio}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
