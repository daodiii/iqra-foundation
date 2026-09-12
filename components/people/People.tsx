'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import wash from '@/components/wash.module.css';
import { site } from '@/content/site.no';
import { film } from '@/lib/film';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
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

function arrive(row: HTMLElement) {
  const { role, portrait, info } = parts(row);
  return gsap.timeline()
    .to(role, { opacity: 1, x: 0, duration: 0.5, ease: EASE.out }, 0)
    .to(portrait, { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: EASE.out }, 0.05)
    .to(info, { opacity: 1, x: 0, duration: 0.6, ease: EASE.out }, 0.2);
}

/**
 * Om oss · Teamet, on Arafat.
 *
 * The first box of WATER on the page: above it the ink of the cave and the mosque, below it
 * the green of the ask. Arafat is the one scene of the hero film the page had never used and
 * it is the gathering — a plain with everyone standing on it — so it belongs under the
 * section that says who «we» are, and the people are on it rather than beside it.
 *
 * Two white cards on the water, story left and team right, because they are two different
 * kinds of reading: a paragraph you follow and a list you scan. The story stops one
 * paragraph short of the chapter it quotes, which is what makes «Les hele historien» an
 * offer rather than a label.
 *
 * Under the two, one card for one person at a time: a portrait, the name set at display
 * size across its edge, the role above with a count beside it, and a line about them next
 * to a round arrow. The arrow is how you meet the next one — six cards in a row were a
 * screen and a half of the same shape, and a list of people is not what a team is. The
 * count is there so the arrow says what it does before anyone presses it.
 */
export function People() {
  const root = useRef<HTMLElement>(null);
  const row = useRef<HTMLDivElement>(null);
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

      /*
       * White cards on a mid-tone floor, so the wordmark stays navy across this section as
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

      const stop = () => { watcher.kill(); water?.destroy(); };
      if (reduced) return stop;

      const rise = section.querySelectorAll<HTMLElement>('[data-rise]');
      // Set here rather than in the stylesheet, so a script that never runs leaves both
      // cards readable. `opacity`, never `autoAlpha` — see the same note in Mission.
      gsap.set(rise, { opacity: 0, y: 22 });

      const tl = gsap.timeline({ paused: true });
      tl.to(rise, { opacity: 1, y: 0, duration: 0.95, ease: EASE.out, stagger: 0.12 });
      const entrance = ScrollTrigger.create({
        trigger: section, start: 'top 72%', once: true, onEnter: () => tl.play(),
      });

      // The member card arrives on its own, when it is reached — it is a screen below the
      // two cards, and a card that had faded in before it was scrolled to would be one the
      // reader never saw arrive.
      const card = row.current;
      if (card) hide(card);
      const arrival = card
        ? ScrollTrigger.create({
            trigger: card, start: 'top 85%', once: true, onEnter: () => { arrive(card); },
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
      hide(card);
      arrive(card);
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
      <div className={`${wash.box} ${wash.arafat}`} aria-hidden="true">
        <canvas className={wash.paint} data-water />
      </div>

      <div className={styles.inner}>
        <div className={`${wash.cardOnWater} ${styles.card}`} data-rise>
          <p className={styles.label}>{site.about.label}</p>
          <p className={styles.lede}>{story.lede}</p>
          {story.paras.slice(0, 2).map((para) => (
            <p key={para} className={styles.para}>{para}</p>
          ))}
          <Link className={styles.more} href="/om-oss" prefetch={false}>
            {site.people.more} →
          </Link>
        </div>

        <div className={`${wash.cardOnWater} ${styles.card}`} data-rise>
          <p className={styles.label}>{site.people.teamLabel}</p>
          <p className={styles.lede}>{menneskene.lede}</p>
          <p className={styles.count}>{menneskene.paras[0]}</p>
        </div>

        <div
          ref={row}
          className={`${wash.cardOnWater} ${styles.row}`}
          data-row
          data-index={index}
          aria-label={site.people.teamLabel}
        >
          <p className={styles.eyebrow}>
            <span data-part="role">{member.role}</span>
            <span className={styles.counter}>{index + 1} / {count}</span>
          </p>
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
                <button
                  type="button"
                  className={styles.go}
                  aria-label={site.people.next}
                  onClick={() => setIndex((i) => (i + 1) % count)}
                >
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
