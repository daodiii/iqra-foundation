'use client';

import { useRef } from 'react';
import wash from '@/components/wash.module.css';
import { site } from '@/content/site.no';
import { film } from '@/lib/film';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { createInkWhenNear, type InkHandle } from '@/lib/ink';
import { createFrame, type FrameHandle, keepFramesFitted } from '@/lib/pen';
import { setWordmarkOnDark } from '@/lib/wordmark';
import { createGoldFilm, writeEase, WRITE_SECONDS } from './gold';
import styles from './mission.module.css';

const stanzas = site.mission.stanzas;
const lastStanza = stanzas.length - 1;
const wall = site.mission.wall;

/**
 * Misjon is the wall: six tiles on the cream, the film the tall one. In the
 * middle, the tall one, a pen writes اقرأ in molten gold on the night («Veggen», chosen
 * 2026-09-13 over the night and the frosted glass). Round it the mission, and five smaller
 * boxes with the site's other short things — Visjon's line, a question, how we work, how to
 * reach us — all of it on the cream ink the section has had since the film's colours were
 * measured: the box is the ground, the tiles sit on it, and where the grid has no tile the
 * ink shows through. «Where did the background go? I still want that beige ink thing»
 * (2026-09-13), after a first cut had taken the box away with the old card.
 *
 * Every box is a line drawn by the tree's pen, as every box on the page is; and every pen
 * keeps pace with the gold one — the frames ease along the film's own written curve, so a
 * corner of a frame lands when a stroke of the word does. The film writes once and the
 * word stays («film does it once»). Nothing here pins or scrubs: the copy arrives once and
 * the section simply is, which it has been since it stopped being the third scroll-driven act.
 */
export function Mission() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const reduced = reducedMotion();

      // The cream behind everything (`film.mission`), built when the section comes near. The
      // section is the host, so a hand over the words draws in the ink as much as one over
      // the open cells.
      const inkCanvas = section.querySelector<HTMLCanvasElement>('[data-ink]');
      const ink: InkHandle | null = inkCanvas
        ? createInkWhenNear(inkCanvas, { reduced, palette: film.mission, host: section })
        : null;

      // Every box's line, drawn with the tree's pen; null where a canvas declines, and the
      // box is then a frosted rectangle with no line.
      const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-frame]'));
      const frames = cards.map(createFrame).filter((f): f is FrameHandle => f !== null);
      const fitted = keepFramesFitted(frames);
      frames.forEach((f) => f.layout());
      const legends = section.querySelectorAll<HTMLElement>('[data-legend]');

      const video = section.querySelector<HTMLVideoElement>('video');
      const gold = video ? createGoldFilm(video, { reduced }) : null;

      // This section is a light box, like Visjon above it, so the wordmark stays navy through
      // both. It still has to be said rather than assumed: on a refresh the hero's scrubbed
      // onUpdate re-fires at progress 1 and paints the wordmark white, which over this
      // section is invisible. Same guard Visjon carries, for the same reason.
      const watcher = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        onEnter: () => setWordmarkOnDark(false),
        onEnterBack: () => setWordmarkOnDark(false),
        onRefresh: (self) => { if (self.isActive) setWordmarkOnDark(false); },
      });

      const teardown = () => {
        watcher.kill();
        fitted();
        gold?.destroy();
        frames.forEach((f) => f.destroy());
        ink?.destroy();
      };

      if (reduced) {
        frames.forEach((f) => { f.p = 1; f.draw(); });
        gold?.play();
        return teardown;
      }

      const rise = section.querySelectorAll<HTMLElement>('[data-rise]');
      // Hidden here in JS, not in CSS, so a script that never runs leaves the copy
      // readable rather than invisible. `opacity`, never `autoAlpha`: autoAlpha adds
      // visibility:hidden, which takes the copy and the call to action out of the
      // accessibility tree until the trigger fires. Transparent text is still read.
      gsap.set(rise, { opacity: 0, y: 22 });
      gsap.set(legends, { opacity: 0 });
      gsap.set(cards, { '--frame-in': 0 });

      /*
       * The arrival. The gold pen lands at 0.46 s and the word is whole at 3.5; the frames
       * follow that curve exactly, so the wall is drawn by the time the word is. The insides
       * come up with the lines, the legends first, then the tiles' words and the film's
       * caption one after another from a third of a second in.
       */
      const tl = gsap.timeline({ paused: true });
      frames.forEach((f) => tl.to(f, { p: 1, duration: WRITE_SECONDS, ease: writeEase, onUpdate: () => f.draw() }, 0));
      tl.to(cards, { '--frame-in': 1, duration: 1.5, ease: EASE.none }, 0)
        .to(legends, { opacity: 1, duration: 0.6, ease: EASE.out }, 0)
        .to(rise, { opacity: 1, y: 0, duration: 0.95, ease: EASE.out, stagger: 0.07 }, 0.3);
      const entrance = ScrollTrigger.create({
        trigger: section,
        start: 'top 72%',
        once: true,
        onEnter: () => { gold?.play(); tl.play(); },
      });

      return () => { entrance.kill(); teardown(); };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="misjon" className={styles.mission} aria-labelledby="misjon-label">
      <div className={`${wash.box} ${wash.mosque}`} aria-hidden="true">
        <canvas className={wash.paint} data-ink />
      </div>
      <div className={styles.grid}>
        {/* The mission: the box it has always been, the legend on the line, the button over the foot. */}
        <div className={`${wash.frame} ${styles.tile} ${styles.text} ${styles.words}`} data-frame data-mission-text data-tile="mis">
          <canvas className={wash.frameCanvas} data-frame-canvas aria-hidden="true" />
          <p id="misjon-label" className={`${wash.legend} ${styles.label}`} data-legend>{site.mission.label}</p>
          <div className={styles.stanzas}>
            {stanzas.map((lines, si) => (
              <p key={lines[0]} className={styles.stanza} data-rise>
                {lines.map((line, li) => {
                  // The page opens on the crimson full stop in «Iqra betyr les.» and closes
                  // on this one. Nobody will notice, which is rather the point.
                  const isFinal = si === lastStanza && li === lines.length - 1;
                  return (
                    <span key={line} className={styles.line}>
                      {isFinal ? line.replace(/\.$/, '') : line}
                      {isFinal && <span className={styles.dot}>.</span>}
                    </span>
                  );
                })}
              </p>
            ))}
          </div>
          <span className={`${wash.seat} ${styles.seat}`} data-seat>
            <a className={styles.cta} href={`mailto:${site.contact.email}`} data-rise>
              {site.hero.cta}
            </a>
          </span>
        </div>

        {/* Visjon's line — off Visjon since the arch, and this is the home it has for now. */}
        <div className={`${wash.frame} ${styles.tile} ${styles.text}`} data-frame data-tile="vis" data-rise>
          <canvas className={wash.frameCanvas} data-frame-canvas aria-hidden="true" />
          <p className={`${wash.legend} ${styles.label}`} data-legend>{site.vision.label}</p>
          <div className={styles.body}>
            <p className={styles.vlines}>
              {site.vision.lines.map((line) => <span key={line} className={styles.line}>{line}</span>)}
            </p>
            <p className={styles.vsub}>{site.vision.sub}</p>
          </div>
        </div>

        <div className={`${wash.frame} ${styles.tile} ${styles.text}`} data-frame data-tile="spm" data-rise>
          <canvas className={wash.frameCanvas} data-frame-canvas aria-hidden="true" />
          <p className={`${wash.legend} ${styles.label}`} data-legend>{wall.question.label}</p>
          <div className={styles.body}>
            <p className={styles.q}>{wall.question.q}</p>
            <p className={styles.a}>{wall.question.a}</p>
          </div>
        </div>

        <div className={`${wash.frame} ${styles.tile} ${styles.text}`} data-frame data-tile="slk" data-rise>
          <canvas className={wash.frameCanvas} data-frame-canvas aria-hidden="true" />
          <p className={`${wash.legend} ${styles.label}`} data-legend>{wall.how.label}</p>
          <div className={styles.body}>
            <ul className={styles.list}>
              {wall.how.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>

        <div className={`${wash.frame} ${styles.tile} ${styles.text}`} data-frame data-tile="kon" data-rise>
          <canvas className={wash.frameCanvas} data-frame-canvas aria-hidden="true" />
          <p className={`${wash.legend} ${styles.label}`} data-legend>{wall.contact.label}</p>
          <div className={styles.body}>
            <p className={styles.kon}>{wall.contact.line}</p>
          </div>
        </div>

        {/*
          * The film. Muted and inline so it may start itself; no loop, the word is written
          * once and stays. The webm first: it is the smaller file, and Chromium builds without
          * proprietary codecs (Playwright's among them) have nothing else to play. The
          * caption is the hero's own first line, so the word and what it means are one tile.
          */}
        <div className={`${styles.tile} ${styles.film}`} data-tile="vid" data-rise>
          <video muted playsInline preload="metadata" aria-label={wall.film.alt}>
            <source src="/media/iqra-gull-720.webm" type="video/webm" />
            <source src="/media/iqra-gull-720.mp4" type="video/mp4" />
          </video>
          <div className={styles.cap}>
            <p className={styles.capTitle}>{wall.film.title}</p>
            <p className={styles.capLine}>{wall.film.line}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
