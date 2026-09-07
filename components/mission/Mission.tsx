'use client';

import { useRef } from 'react';
import { site } from '@/content/site.no';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { setWordmarkOnDark } from '@/lib/wordmark';
import styles from './mission.module.css';

export function Mission() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const still = section.querySelector('img');
      const text = section.querySelector('[data-mission-text]');
      if (!still || !text) return;
      // The wordmark is white over the night still and navy over Visjon above us
      // (spec 9). Every handoff below starts at `top top`, when the fixed header is
      // actually over this section: at any earlier start the header is still on
      // Visjon's white, where white on white is invisible.
      const onDark = {
        onEnter: () => setWordmarkOnDark(true),
        onEnterBack: () => setWordmarkOnDark(true),
        onLeaveBack: () => setWordmarkOnDark(false),
        // The hero writes the wordmark from a scrubbed onUpdate that re-fires on
        // every refresh, and a refresh is also how we learn where we are after a
        // reload part-way down; say it again whenever we hold the header.
        onRefresh: (self: ScrollTrigger) => { if (self.isActive) setWordmarkOnDark(true); },
      };
      // Reduced motion lays the section out at rest — the CSS never hides the text —
      // but it still gets the handoff, because that is legibility, not motion:
      // measured over the still, navy is 1.42:1 and white 16.7:1 (spec 11 asks for
      // 4.5:1). A trigger with no tween, no pin and no scrub only watches the scroll.
      if (reducedMotion()) {
        const watcher = ScrollTrigger.create({ trigger: section, start: 'top top', ...onDark });
        return () => watcher.kill();
      }
      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', () => {
        gsap.timeline({
          scrollTrigger: {
            trigger: section, start: 'top top', end: '+=100%', pin: true, scrub: 0.6,
            // No refreshPriority: we are the last section, so the default 0 puts us
            // last in the refresh, after the hero (2) and Visjon (1) have pinned.
            ...onDark,
          },
        })
          .fromTo(still, { scale: 1 }, { scale: 1.06, duration: 1, ease: EASE.none }, 0)
          .fromTo(text, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: EASE.out }, 0.08);
      });
      mm.add('(max-width: 767px)', () => {
        // No pin on phones: the text rises once as the section comes up (spec 8)...
        gsap.fromTo(text, { y: 40, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, duration: 1, ease: EASE.out,
          scrollTrigger: { trigger: section, start: 'top 70%' },
        });
        // ...but the wordmark waits for `top top`. At `top 70%` we are only the
        // bottom 30% of the screen and the header still sits on Visjon's white.
        ScrollTrigger.create({ trigger: section, start: 'top top', ...onDark });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="misjon" className={styles.mission} aria-labelledby="misjon-label">
      <picture className={styles.still}>
        <source srcSet="/media/still-koran.avif" type="image/avif" />
        <source srcSet="/media/still-koran.webp" type="image/webp" />
        <img src="/media/still-koran.webp" alt="" loading="lazy" decoding="async" width={1920} height={1080} />
      </picture>
      <div className={styles.gradient} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.text} data-mission-text>
          <span id="misjon-label" className={styles.label}>{site.mission.label}</span>
          <p className={styles.body}>{site.mission.text}</p>
          <a className={styles.cta} href={`mailto:${site.contact.email}`}>{site.hero.cta}</a>
        </div>
      </div>
    </section>
  );
}
