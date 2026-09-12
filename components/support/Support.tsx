'use client';

import { useRef } from 'react';
import wash from '@/components/wash.module.css';
import { site } from '@/content/site.no';
import { film } from '@/lib/film';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { createFrame, type FrameHandle, keepFramesFitted } from '@/lib/pen';
import { createWaterWhenNear } from '@/lib/water';
import { setWordmarkOnDark } from '@/lib/wordmark';
import styles from './support.module.css';

const support = site.support;
const card = support.card;

/**
 * Støtt oss: one screen, two squares.
 *
 * It was a checkout — the head, three route frames, a night card with an amount picker and
 * a QR, a tax note — a screen and a half of boxes, and the one control in it led nowhere,
 * because nothing is wired to a payment. The user's call (2026-09-12): «way too big», then
 * the green water of three grounds shown, then, once that was live, «make it more like a
 * square and have another square in the same section with card payment, just for the
 * visuals». So: the green water is the box, and on it two squares drawn with the tree's
 * pen. The first holds the question, the Vipps number set large and one sentence about the
 * other ways to give. The second is a card form that is a picture of one.
 *
 * Nothing here is a control. The number is text — the one kind of giving that needs nothing
 * built is a number you copy into your own app — and it stays bracketed until the real one
 * arrives, which is what holds the production build (`scripts/check-content.mjs`). The form's
 * fields are drawn boxes and its button is a span; the drawing is hidden from assistive
 * tech, which is handed the one honest line under it instead.
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

      // The two squares, drawn with the tree's pen.
      const frames = Array.from(section.querySelectorAll<HTMLCanvasElement>('[data-frame-canvas]'))
        .map((c) => (c.parentElement ? createFrame(c.parentElement) : null))
        .filter((f): f is FrameHandle => f !== null);
      const fitted = keepFramesFitted(frames);
      frames.forEach((f) => f.layout());

      const stop = () => {
        watcher.kill();
        fitted();
        frames.forEach((f) => f.destroy());
        water?.destroy();
      };
      if (reduced) {
        frames.forEach((f) => { f.p = 1; f.draw(); });
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
      // The pen draws the first square as the first line rises, the second a beat later.
      frames.forEach((f, i) => {
        tl.to(f, { p: 1, duration: 1.1, ease: EASE.none, onUpdate: () => f.draw() }, i * 0.18);
      });
      const entrance = ScrollTrigger.create({
        trigger: section, start: 'top 72%', once: true, onEnter: () => tl.play(),
      });

      return () => { entrance.kill(); stop(); };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="stott-oss" className={styles.support} aria-labelledby="stott-label">
      <div className={`${wash.box} ${wash.support}`} aria-hidden="true">
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

        <div className={`${wash.frameOnWater} ${styles.card} ${styles.cardSquare}`} data-card-square>
          <canvas className={wash.frameCanvas} data-frame-canvas aria-hidden="true" />
          <p className={`${wash.legend} ${styles.label}`} data-legend>{card.label}</p>
          {/* A drawing of a form: boxes with their placeholders written in, chips with one
              pressed, and a button that is a span. Hidden from assistive tech as a whole,
              because a screen reader offered these as fields would be offered a form that
              goes nowhere; what it gets is the notice below. */}
          <div className={styles.form} data-card-form aria-hidden="true" data-rise>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>{card.amount}</span>
              <div className={styles.chips}>
                {card.tiers.map((kr, i) => (
                  <span key={kr} className={styles.chip} data-pressed={i === card.preselect}>{kr} {card.unit}</span>
                ))}
                <span className={styles.chip}>{card.other}</span>
              </div>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>{card.number}</span>
              <div className={`${styles.input} ${styles.placeholder}`}>
                {card.numberPlaceholder}
                <svg className={styles.cardIcon} viewBox="0 0 22 16" aria-hidden="true">
                  <rect x="0.5" y="0.5" width="21" height="15" rx="2.5" fill="none" stroke="currentColor" />
                  <rect x="1" y="4" width="20" height="3" fill="currentColor" />
                </svg>
              </div>
            </div>
            <div className={styles.two}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>{card.expiry}</span>
                <div className={`${styles.input} ${styles.placeholder}`}>{card.expiryPlaceholder}</div>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>{card.cvc}</span>
                <div className={`${styles.input} ${styles.placeholder}`}>{card.cvcPlaceholder}</div>
              </div>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>{card.name}</span>
              <div className={`${styles.input} ${styles.placeholder}`}>{card.namePlaceholder}</div>
            </div>
          </div>
          <p className={styles.notice} data-rise>{card.notice}</p>
          {/* The rise is on the button, never on the seat: the seat is placed by a transform, and a tween on it would overwrite that. */}
          <span className={`${wash.seat} ${styles.seat}`} data-seat>
            <span className={styles.pay} data-pay data-rise aria-hidden="true">{card.pay} {card.tiers[card.preselect]} {card.unit}</span>
          </span>
        </div>
      </div>
    </section>
  );
}
