'use client';

import { useRef, useState } from 'react';
import wash from '@/components/wash.module.css';
import { site } from '@/content/site.no';
import { film } from '@/lib/film';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { createWaterWhenNear, type WaterHandle } from '@/lib/water';
import { setWordmarkOnDark } from '@/lib/wordmark';
import styles from './support.module.css';

const support = site.support;
const tiers = support.tiers;

/**
 * nb-NO groups thousands with a non-breaking space. Written out rather than left to
 * `toLocaleString`, whose output depends on the ICU data the renderer happens to carry —
 * and this component renders on the server as well as in the browser, where a difference
 * of one space is a hydration mismatch.
 */
function kroner(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Støtt oss: the ask, rebuilt.
 *
 * It used to be a checkout on a night ground — «Støtt oss», then «250 kr» in enormous type,
 * without ever asking for anything. It is now green water, the last and deepest of the
 * page's four boxes, and it reads top to bottom: the sentence, then the three ways to give,
 * then one card for the standing gift.
 *
 * The green is the user's, and the page's one departure from the film: «make the last one a
 * green color that looks like green water». The Quran's gold that used to be here survives
 * as the middle route's colour, three inches below.
 *
 * The three routes lead because they are the part that works today. Every number on the
 * page is still a placeholder and there is no payment integration, so a route you copy into
 * your own bank is the only kind of giving that needs nothing built. The card below them
 * holds the choice — how much, every month — and the Vipps number to do it with.
 */
export function Support() {
  const root = useRef<HTMLElement>(null);
  const cardWater = useRef<WaterHandle | null>(null);
  // Typed, because the content file is `as const` and the preselect would otherwise infer
  // as the literal `1` — a state that can only ever be set back to what it already was.
  const [idx, setIdx] = useState<number>(support.giver.preselect);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const reduced = reducedMotion();

      const boxCanvas = section.querySelector<HTMLCanvasElement>('[data-water]');
      const water = boxCanvas
        ? createWaterWhenNear(boxCanvas, { reduced, floor: film.supportWater, host: section })
        : null;

      /*
       * The card runs the same solver on the night floor, where the colours are lamps and
       * add light to the ground rather than staining it. It is the page's last look at the
       * film — the Haram after dark — and the only night water on the site.
       */
      const cardCanvas = section.querySelector<HTMLCanvasElement>('[data-water-card]');
      cardWater.current = cardCanvas
        ? createWaterWhenNear(cardCanvas, { reduced, floor: film.supportCard, host: cardCanvas.parentElement })
        : null;

      /*
       * The section is a light box now, so the wordmark stays navy over it — this used to
       * be the one handoff to white after the hero, and the night ground it depended on is
       * gone. The guard is still needed: on a refresh the hero's scrubbed onUpdate re-fires
       * at progress 1 and paints the wordmark white, which over this box is invisible.
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
        water?.destroy();
        cardWater.current?.destroy();
        cardWater.current = null;
      };
      if (reduced) return stop;

      const rise = section.querySelectorAll<HTMLElement>('[data-rise]');
      // `opacity`, never `autoAlpha`: autoAlpha adds visibility:hidden, which would take
      // the amount and every control out of the accessibility tree until a scroll event
      // that may never arrive. Set here rather than in the stylesheet so a script that
      // never runs leaves the section readable instead of blank.
      gsap.set(rise, { opacity: 0, y: 22 });

      const tl = gsap.timeline({ paused: true });
      tl.to(rise, { opacity: 1, y: 0, duration: 0.95, ease: EASE.out, stagger: 0.09 });
      const entrance = ScrollTrigger.create({
        trigger: section, start: 'top 72%', once: true, onEnter: () => tl.play(),
      });

      return () => { entrance.kill(); stop(); };
    },
    { scope: root },
  );

  const amount = kroner(tiers[idx]);

  return (
    <section ref={root} id="stott-oss" className={styles.support} aria-labelledby="stott-label">
      <div className={`${wash.box} ${wash.green}`} aria-hidden="true">
        <canvas className={wash.paint} data-water />
      </div>

      <div className={styles.inner}>
        <div className={`${wash.cardOnWater} ${styles.head}`} data-rise>
          <p id="stott-label" className={styles.label}>{support.label}</p>
          {/* Two spans, because the break is chosen rather than found — and because the
              stylesheet sizes the heading to the longer LINE, which needs each to be a box
              of its own rather than two clauses in one flowing paragraph. */}
          <h2 className={styles.title} data-title>
            {support.title.map((line) => <span key={line}>{line}</span>)}
          </h2>
        </div>

        <ul className={styles.routes} aria-label={support.routesLabel}>
          {support.routes.map((route, i) => (
            <li key={route.label} className={`${wash.cardOnWater} ${styles.route}`} data-rise>
              <p className={styles.routeLabel}>{route.label}</p>
              {/* One stop of the film's own run of colour, in the order the page walks it:
                  the cave's slate, the Quran's gold, the night. */}
              <p className={styles.routeValue} style={{ color: film.routes[i] }}>{route.value}</p>
              <p className={styles.routeHow}>{route.how}</p>
            </li>
          ))}
        </ul>

        <div className={`${wash.night} ${styles.giver}`} data-rise>
          <canvas className={wash.paint} data-water-card aria-hidden="true" />
          <div className={styles.giverScrim} aria-hidden="true" />
          <div className={styles.giverInner}>
            <div className={styles.choose}>
              <p className={styles.giverLabel}>{support.giver.label}</p>
              <p className={styles.amount} aria-live="polite">
                <span data-amount>{amount}</span>{' '}
                <span className={styles.unit}>{support.giver.unit}</span>
              </p>
              <div className={styles.tiers} role="group" aria-label={support.giver.amountLabel}>
                {tiers.map((kr, i) => (
                  <button
                    key={kr}
                    type="button"
                    className={styles.tier}
                    aria-pressed={i === idx}
                    onClick={() => {
                      setIdx(i);
                      // The card answers the press. It is the only thing on the page that
                      // does anything when you choose, now that the button has nowhere to
                      // go — and it is one drop in water, so it costs nothing to say.
                      cardWater.current?.stir(0.26 + Math.random() * 0.2, 0.35 + Math.random() * 0.3);
                    }}
                  >
                    {kroner(kr)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.pay}>
              <p className={styles.payTitle}>{support.qr.title}</p>
              {/* Bracketed like every other number here. A drawn square would be the one
                  placeholder on the site a visitor could try, and it would fail in their
                  bank app rather than on the page. */}
              <div className={styles.qr}>{support.qr.value}</div>
              <p className={styles.payHow}>{support.qr.how}</p>
            </div>
          </div>
        </div>

        <p className={styles.tax} data-rise>{support.tax}</p>
      </div>
    </section>
  );
}
