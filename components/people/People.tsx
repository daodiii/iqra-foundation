'use client';

import Link from 'next/link';
import { useRef } from 'react';
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
 * Under the two, one card per person: a portrait, the name set at display size across its
 * edge, the role above and a line about them beside a round arrow. Portrait left on the
 * even rows and right on the odd, so six of them read as a sequence rather than a column.
 * They run the full width rather than sitting in the team card, because six portraits are
 * taller than the story is long, and a card centred against an empty column is not a card
 * anyone would put there.
 */
export function People() {
  const root = useRef<HTMLElement>(null);

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

      /*
       * Each member row arrives on its own, when it is reached — six rows are a screen and
       * a half, and a row that had already faded in before it was scrolled to would be one
       * the reader never saw arrive. Inside a row the three parts come in the order they
       * are read: the role slides in from its side, the portrait settles, and the name and
       * the line beside it slide in from the other side.
       */
      const rows = Array.from(section.querySelectorAll<HTMLElement>('[data-row]'));
      const arrivals = rows.map((row) => {
        const sign = row.dataset.side === 'right' ? -1 : 1;
        const role = row.querySelector('[data-part="role"]');
        const portrait = row.querySelector('[data-part="portrait"]');
        const info = row.querySelector('[data-part="info"]');
        gsap.set(role, { opacity: 0, x: -20 * sign });
        gsap.set(portrait, { opacity: 0, scale: 0.95, y: 30 });
        gsap.set(info, { opacity: 0, x: 40 * sign });
        const arrive = gsap.timeline({ paused: true })
          .to(role, { opacity: 1, x: 0, duration: 0.5, ease: EASE.out }, 0)
          .to(portrait, { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: EASE.out }, 0.05)
          .to(info, { opacity: 1, x: 0, duration: 0.6, ease: EASE.out }, 0.2);
        return ScrollTrigger.create({
          trigger: row, start: 'top 85%', once: true, onEnter: () => arrive.play(),
        });
      });

      return () => { entrance.kill(); arrivals.forEach((t) => t.kill()); stop(); };
    },
    { scope: root },
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

        <ol className={styles.members} aria-label={site.people.teamLabel}>
          {menneskene.team.map((member, i) => (
            // Keyed by position: every name is still a bracket, so nothing else here is
            // unique, and the list is static.
            <li
              key={`${member.role}-${i}`}
              className={`${wash.cardOnWater} ${styles.row}`}
              data-row
              data-side={i % 2 ? 'right' : 'left'}
            >
              <p className={styles.eyebrow} data-part="role">{member.role}</p>
              <div className={styles.body}>
                {/* An empty rectangle where a photograph would go. Drawn rather than left
                    out, because the row's shape is what it will be when it has a face in
                    it — and an initial or a silhouette would be a face we do not have. */}
                <div className={styles.portrait} data-part="portrait" aria-hidden="true" />
                <div className={styles.info} data-part="info">
                  <p className={styles.display}>
                    <span className={styles.first}>{member.first}</span>
                    <span className={styles.last}>{member.last}</span>
                  </p>
                  <div className={styles.details}>
                    {/* The arrow in the design this is set from is a button that does
                        nothing. Here it goes somewhere — to the chapter about the people —
                        because a control that answers a click with nothing would be the
                        only one on the site. It points forward on every row, whichever side
                        the portrait is on: it means «go on», not «back». */}
                    <Link
                      className={styles.go}
                      href="/om-oss"
                      prefetch={false}
                      aria-label={site.people.memberMore}
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
                    </Link>
                    <p className={styles.bio}>{member.bio}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
