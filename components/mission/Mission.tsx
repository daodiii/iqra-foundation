'use client';

import { useRef } from 'react';
import wash from '@/components/wash.module.css';
import { site } from '@/content/site.no';
import { film } from '@/lib/film';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { createInkWhenNear, type InkHandle } from '@/lib/ink';
import { createFrame, keepFramesFitted } from '@/lib/pen';
import { setWordmarkOnDark } from '@/lib/wordmark';
import styles from './mission.module.css';

const stanzas = site.mission.stanzas;
const lastStanza = stanzas.length - 1;

/**
 * Misjon is where the page lands. It does not pin and it does not scrub: after a hero that
 * opens and a tree that grows, a third scroll-driven section reads as the page still
 * clearing its throat. The copy arrives once and then the section simply is.
 *
 * The ink behind it is cream (`film.mission`) — it was the mosque, amber and cream, and it
 * is still the warm box after Visjon's cool one, as the film walks. It replaced the
 * folded drape that used to run down the right of this copy: the drape was a column beside
 * the words, and the box is now the whole weather behind them.
 */
export function Mission() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const reduced = reducedMotion();

      const inkCanvas = section.querySelector<HTMLCanvasElement>('[data-ink]');
      const ink: InkHandle | null = inkCanvas
        ? createInkWhenNear(inkCanvas, { reduced, palette: film.mission, host: section })
        : null;

      // The frame round the card, drawn with the tree's pen; null where the canvas declines,
      // and the card is then a frosted box with no line.
      const card = section.querySelector<HTMLElement>('[data-mission-text]');
      const frame = card ? createFrame(card) : null;
      const legend = section.querySelector<HTMLElement>('[data-legend]');
      const fitted = keepFramesFitted(frame ? [frame] : []);
      frame?.layout();

      // This section is a light box, like Visjon above it, so the wordmark stays
      // navy through both. It still has to be said rather than assumed: on a refresh the
      // hero's scrubbed onUpdate re-fires at progress 1 and paints the wordmark white,
      // which over this section is invisible. Same guard Visjon carries, for the same
      // reason.
      const watcher = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        onEnter: () => setWordmarkOnDark(false),
        onEnterBack: () => setWordmarkOnDark(false),
        onRefresh: (self) => { if (self.isActive) setWordmarkOnDark(false); },
      });

      if (reduced) {
        if (frame) { frame.p = 1; frame.draw(); }
        return () => { watcher.kill(); fitted(); frame?.destroy(); ink?.destroy(); };
      }

      const rise = section.querySelectorAll<HTMLElement>('[data-rise]');
      // Hidden here in JS, not in CSS, so a script that never runs leaves the copy
      // readable rather than invisible (the same choice Visjon makes for its lines).
      // `opacity`, never `autoAlpha`: autoAlpha adds visibility:hidden, which takes the
      // copy and the call to action out of the accessibility tree until the trigger
      // fires. Transparent text is still read; hidden text is not.
      gsap.set(rise, { opacity: 0, y: 22 });
      gsap.set(legend, { opacity: 0 });
      if (card) gsap.set(card, { '--frame-in': 0 });

      /*
       * The pen draws the frame (1.5s, at the arch's linear pace) and the inside comes up
       * with it; the legend first, then the stanzas one after another from a third of a
       * second in, the button last among them.
       */
      const tl = gsap.timeline({ paused: true });
      if (frame) tl.to(frame, { p: 1, duration: 1.5, ease: EASE.none, onUpdate: () => frame.draw() }, 0);
      if (card) tl.to(card, { '--frame-in': 1, duration: 1.5, ease: EASE.none }, 0);
      tl.to(legend, { opacity: 1, duration: 0.6, ease: EASE.out }, 0)
        .to(rise, { opacity: 1, y: 0, duration: 0.95, ease: EASE.out, stagger: 0.105 }, 0.3);
      const entrance = ScrollTrigger.create({
        trigger: section, start: 'top 72%', once: true, onEnter: () => tl.play(),
      });

      return () => { entrance.kill(); watcher.kill(); fitted(); frame?.destroy(); ink?.destroy(); };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="misjon" className={styles.mission} aria-labelledby="misjon-label">
      <div className={`${wash.box} ${wash.mosque}`} aria-hidden="true">
        <canvas className={wash.paint} data-ink />
      </div>
      <div className={styles.inner}>
        <div className={`${wash.frame} ${styles.text}`} data-mission-text>
          <canvas className={wash.frameCanvas} data-frame-canvas aria-hidden="true" />
          {/* The legend: on the frame's top line, half above it. */}
          <p id="misjon-label" className={`${wash.legend} ${styles.label}`} data-legend>{site.mission.label}</p>
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
          {/* Over the bottom edge, the line running on beneath it — «the button on the edge like C». */}
          <span className={`${wash.seat} ${styles.seat}`} data-seat>
            <a className={styles.cta} href={`mailto:${site.contact.email}`} data-rise>
              {site.hero.cta}
            </a>
          </span>
        </div>
        <div aria-hidden="true" />
      </div>
    </section>
  );
}
