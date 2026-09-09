'use client';

import { useRef } from 'react';
import wash from '@/components/wash.module.css';
import { site } from '@/content/site.no';
import { film } from '@/lib/film';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { createInkWhenNear, type InkHandle } from '@/lib/ink';
import { setWordmarkOnDark } from '@/lib/wordmark';
import styles from './mission.module.css';

const stanzas = site.mission.stanzas;
const lastStanza = stanzas.length - 1;

/**
 * Misjon is where the page lands. It does not pin and it does not scrub: after a hero that
 * opens and a tree that grows, a third scroll-driven section reads as the page still
 * clearing its throat. The copy arrives once and then the section simply is.
 *
 * The ink behind it is the mosque — amber and cream, the light through the arches — and it
 * is the second of the film's four scenes as the page walks down them. It replaced the
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

      // This section is white paper on ink, like Visjon above it, so the wordmark stays
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

      if (reduced) return () => { watcher.kill(); ink?.destroy(); };

      const rise = section.querySelectorAll<HTMLElement>('[data-rise]');
      const rule = section.querySelector<HTMLElement>('[data-rule]');
      // Hidden here in JS, not in CSS, so a script that never runs leaves the copy
      // readable rather than invisible (the same choice Visjon makes for its lines).
      // `opacity`, never `autoAlpha`: autoAlpha adds visibility:hidden, which takes the
      // copy and the call to action out of the accessibility tree until the trigger
      // fires. Transparent text is still read; hidden text is not.
      gsap.set(rise, { opacity: 0, y: 22 });
      gsap.set(rule, { scaleX: 0 });

      const tl = gsap.timeline({ paused: true });
      tl.to(rise, { opacity: 1, y: 0, duration: 0.95, ease: EASE.out, stagger: 0.105 }, 0)
        .to(rule, { scaleX: 1, duration: 1.1, ease: EASE.out }, 0.34);
      const entrance = ScrollTrigger.create({
        trigger: section, start: 'top 72%', once: true, onEnter: () => tl.play(),
      });

      return () => { entrance.kill(); watcher.kill(); ink?.destroy(); };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="misjon" className={styles.mission} aria-labelledby="misjon-label">
      <div className={`${wash.box} ${wash.mosque}`} aria-hidden="true">
        <canvas className={wash.ink} data-ink />
      </div>
      <div className={styles.inner}>
        <div className={`${wash.card} ${styles.text}`} data-mission-text>
          <p id="misjon-label" className={styles.label} data-rise>{site.mission.label}</p>
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
          <div className={styles.rule} data-rule />
          <a className={styles.cta} href={`mailto:${site.contact.email}`} data-rise>
            {site.hero.cta}
          </a>
        </div>
        <div aria-hidden="true" />
      </div>
    </section>
  );
}
