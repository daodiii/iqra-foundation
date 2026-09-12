'use client';

import { useRef } from 'react';
import wash from '@/components/wash.module.css';
import { site } from '@/content/site.no';
import { film } from '@/lib/film';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { createFrame, keepFramesFitted } from '@/lib/pen';
import { createWaterWhenNear } from '@/lib/water';
import { setWordmarkOnDark } from '@/lib/wordmark';
import styles from './support.module.css';

const support = site.support;

/**
 * Støtt oss: one screen, one number.
 *
 * It was a checkout — the head, three route frames, a night card with an amount picker and
 * a QR, a tax note — a screen and a half of boxes, and the one control in it led nowhere,
 * because nothing is wired to a payment. The user's call (2026-09-12): «way too big», and
 * then, of three grounds shown, the green water. So the section says one thing now. The
 * green water is the box, and inside it one frame drawn with the tree's pen holds the
 * question, the Vipps number set large, and one sentence about the other ways to give.
 *
 * Nothing here is a control. The number is text — the one kind of giving that needs nothing
 * built is a number you copy into your own app — and it stays bracketed until the real one
 * arrives, which is what holds the production build (`scripts/check-content.mjs`).
 */
export function Support() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const reduced = reducedMotion();

      const canvas = section.querySelector<HTMLCanvasElement>('[data-water]');
      const water = canvas
        ? createWaterWhenNear(canvas, { reduced, floor: film.supportWater, host: section })
        : null;

      /*
       * A light box, so the wordmark stays navy over it. The guard is still needed: on a
       * refresh the hero's scrubbed onUpdate re-fires at progress 1 and paints the wordmark
       * white, which over this box is invisible.
       */
      const watcher = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        onEnter: () => setWordmarkOnDark(false),
        onEnterBack: () => setWordmarkOnDark(false),
        onRefresh: (self) => { if (self.isActive) setWordmarkOnDark(false); },
      });

      const card = section.querySelector<HTMLElement>('[data-card]');
      const frame = card ? createFrame(card) : null;
      const fitted = keepFramesFitted(frame ? [frame] : []);
      frame?.layout();

      const stop = () => {
        watcher.kill();
        fitted();
        frame?.destroy();
        water?.destroy();
      };
      if (reduced) {
        if (frame) { frame.p = 1; frame.draw(); }
        return stop;
      }

      const rise = section.querySelectorAll<HTMLElement>('[data-rise]');
      // `opacity`, never `autoAlpha`: autoAlpha adds visibility:hidden, which would take
      // the number out of the accessibility tree until a scroll event that may never
      // arrive. Set here rather than in the stylesheet so a script that never runs leaves
      // the section readable instead of blank.
      gsap.set(rise, { opacity: 0, y: 22 });

      const tl = gsap.timeline({ paused: true });
      tl.to(rise, { opacity: 1, y: 0, duration: 0.95, ease: EASE.out, stagger: 0.09 });
      // The pen draws the frame as the first line rises.
      if (frame) tl.to(frame, { p: 1, duration: 1.1, ease: EASE.none, onUpdate: () => frame.draw() }, 0);
      const entrance = ScrollTrigger.create({
        trigger: section, start: 'top 72%', once: true, onEnter: () => tl.play(),
      });

      return () => { entrance.kill(); stop(); };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="stott-oss" className={styles.support} aria-labelledby="stott-label">
      <div className={`${wash.box} ${wash.green}`} aria-hidden="true">
        <canvas className={wash.paint} data-water />
      </div>

      <div className={styles.inner}>
        <div className={`${wash.frameOnWater} ${styles.card}`} data-card>
          <canvas className={wash.frameCanvas} data-frame-canvas aria-hidden="true" />
          <p id="stott-label" className={`${wash.legend} ${styles.label}`} data-legend>{support.label}</p>
          <h2 className={styles.title} data-rise>{support.title}</h2>
          <p className={styles.vipps} data-rise>
            {/* The length, not the width: the stylesheet turns it into a size that cannot run
                out of the frame, and it is the same on the server and in the browser. */}
            <span
              className={styles.number}
              style={{ '--chars': support.vipps.value.length } as React.CSSProperties}
              data-number
            >
              {support.vipps.value}
            </span>
            <span className={styles.numberLabel}>{support.vipps.label}</span>
          </p>
          <p className={styles.also} data-rise>{support.also}</p>
        </div>
      </div>
    </section>
  );
}
