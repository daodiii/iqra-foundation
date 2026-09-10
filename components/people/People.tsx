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

      return () => { entrance.kill(); stop(); };
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
          <ul className={styles.team} aria-label={site.people.teamLabel}>
            {menneskene.team.map((member, i) => (
              // Keyed by position: every name is still `[Navn]`, so nothing else here is
              // unique, and the list is static.
              <li key={`${member.role}-${i}`} className={styles.member}>
                {/* An empty circle where a photograph would go. Drawn rather than left out,
                    because the row's rhythm is what the list will be when it has faces in
                    it — and an initial or a silhouette would be a face we do not have. */}
                <span className={styles.photo} aria-hidden="true" />
                <span className={styles.who}>
                  <span className={styles.name}>{member.name}</span>
                  <span className={styles.role}>{member.role}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
