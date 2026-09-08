'use client';

import { useRef } from 'react';
import { site } from '@/content/site.no';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { setWordmarkOnDark } from '@/lib/wordmark';
import { createDrape, type DrapeHandle } from './drape';
import styles from './mission.module.css';

const stanzas = site.mission.stanzas;
const lastStanza = stanzas.length - 1;

/**
 * Misjon is where the page lands. It does not pin and it does not scrub: after a hero
 * that opens and a tree that grows, a third scroll-driven section reads as the page
 * still clearing its throat. The copy arrives once and then the section simply is.
 */
export function Mission() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const canvas = section.querySelector('canvas');
      const reduced = reducedMotion();
      const drape: DrapeHandle | null = canvas ? createDrape(canvas, { reduced }) : null;

      // This section is white now, like Visjon above it, so the wordmark stays navy
      // through both. It still has to be said rather than assumed: on a refresh the
      // hero's scrubbed onUpdate re-fires at progress 1 and paints the wordmark white,
      // which over white is invisible. Same guard Visjon carries, for the same reason.
      const watcher = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        onEnter: () => setWordmarkOnDark(false),
        onEnterBack: () => setWordmarkOnDark(false),
        onRefresh: (self) => { if (self.isActive) setWordmarkOnDark(false); },
      });

      if (reduced) return () => { watcher.kill(); drape?.destroy(); };

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

      return () => { entrance.kill(); watcher.kill(); drape?.destroy(); };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="misjon" className={styles.mission} aria-labelledby="misjon-label">
      <canvas className={styles.drape} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.text} data-mission-text>
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
