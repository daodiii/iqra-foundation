'use client';

import { useRef } from 'react';
import { site } from '@/content/site.no';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { setWordmarkOnDark } from '@/lib/wordmark';
import { createVisionTree, GROW, type TreeHandle } from './tree';
// TreeFigure, not Tree: on a case-insensitive filesystem './Tree' resolves to tree.ts.
import { Tree } from './TreeFigure';
import styles from './vision.module.css';

const dir = (el: Element) => Number((el as HTMLElement).dataset.dir);

export function Vision() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const box = section.querySelector<HTMLElement>('[data-tree]');
      const canvas = box?.querySelector('canvas');
      const lines = section.querySelectorAll<HTMLElement>('[data-line]');
      const reduced = reducedMotion();
      let tree: TreeHandle | null = null;
      if (box && canvas) {
        tree = createVisionTree(box, canvas, {
          reduced,
          limbLabels: Array.from(box.querySelectorAll<HTMLElement>('[data-limb]')),
          rootLabel: box.querySelector<HTMLElement>('[data-root]'),
        });
      }
      if (reduced) {
        tree?.setT(99);
        return () => tree?.destroy();
      }
      // The section is a full viewport tall, so its copy is readable long before the
      // trigger fires. Hide the lines here — in JS, so a failed script leaves the copy
      // visible — or the fromTo below snaps them back out and replays them on screen.
      // Reduced motion returns above and keeps its CSS rest state (vision.module.css).
      gsap.set(lines, { opacity: 0 });
      const linesIn = () =>
        gsap.fromTo(lines,
          { x: (i, el) => 120 * dir(el), skewX: (i, el) => -8 * dir(el), opacity: 0 },
          { x: 0, skewX: 0, opacity: 1, duration: 1.1, ease: EASE.out, stagger: 0.09 });
      const mm = gsap.matchMedia();

      /*
       * Where the tree stands when the section arrives, before the pin has any progress
       * to give it: the seed woken and haloed, nothing grown. It has to be the pin's
       * floor as well as the entrance's ceiling, or the first pixel of pinned scroll
       * would put growth back to 0 and blink the seed out again.
       */
      const SEED_T = 0.24;

      mm.add('(min-width: 768px)', () => {
        /*
         * A screen of scrolling separates the hero letting go from this section reaching
         * the top, and the pin starts at the far end of it. Everything used to wait for
         * that, so the whole of it was spent looking at a label, a sub-line and an empty
         * box with a hairline across it. The copy and the seed now arrive when the
         * section does; the pin only grows what it has already been handed.
         */
        let wake: gsap.core.Tween | null = null;
        let arrived = false;
        const seed = { T: 0 };
        const arrive = () => {
          if (arrived) return;
          arrived = true;
          linesIn();
          wake = gsap.to(seed, {
            T: SEED_T, duration: 0.7, ease: EASE.out, onUpdate: () => tree?.setT(seed.T),
          });
        };
        ScrollTrigger.create({
          trigger: section, start: 'top 78%', once: true, refreshPriority: 1,
          onEnter: arrive,
          /*
           * Landing here from a reload rather than scrolling in: the browser restores
           * the scroll position, the start is already behind us, and `onEnter` has
           * nothing left to fire on — so the lines would keep the opacity 0 set above,
           * invisible and permanently so. The pin has always had the same hole, and
           * nothing above this level can see it: hidden on purpose and hidden by
           * accident look identical.
           *
           * Measured on refresh, never at creation. The hero builds its pin inside
           * `document.fonts.ready`, which resolves after this effect runs, so at
           * creation every position below the hero is a screen short and this would
           * fire for a visitor who is still up in the film.
           */
          onRefresh: (self) => { if (self.progress > 0) arrive(); },
        });

        ScrollTrigger.create({
          trigger: section, start: 'top top', end: '+=110%', pin: true, scrub: 0.6,
          // Refresh order decides what a trigger measures, and it is creation order
          // unless priorities say otherwise. The hero builds its trigger inside
          // document.fonts.ready, so it is created after us; without an explicit
          // priority we would size ourselves against a hero with no pin spacing and
          // start 2700px too early. Highest refreshes first, so the sections descend
          // in document order: hero 2, us 1, everything below the default 0.
          // Do not "simplify" this key away: what turns sorting on is the key's PRESENCE
          // — ScrollTrigger.js:1036 sets _sort on `"refreshPriority" in vars` — and the
          // values are only the tie-break before the comparator (:2655) falls back to
          // document position. Delete the keys and the refresh reverts to creation order,
          // which is the 2700px bug again.
          refreshPriority: 1,
          // The entrance tween and this share one tree, so whichever arrives second has
          // to stop the other rather than fight it for `setT` frame by frame.
          onEnter: () => { wake?.kill(); setWordmarkOnDark(false); },
          onEnterBack: () => setWordmarkOnDark(false),
          // A resize re-runs the hero's onUpdate, which would paint the wordmark white
          // again over our white section; say it once more while we hold the header.
          onRefresh: (self) => { if (self.isActive) setWordmarkOnDark(false); },
          onUpdate: (self) => tree?.setT(SEED_T + self.progress * (GROW - SEED_T)),
        });
      });
      mm.add('(max-width: 767px)', () => {
        const p = { T: 0 };
        // The tree starts growing as soon as it is properly on screen.
        ScrollTrigger.create({
          trigger: section, start: 'top 60%', once: true, refreshPriority: 1,
          onEnter: () => {
            linesIn();
            gsap.to(p, { T: GROW, duration: 5, ease: EASE.none, onUpdate: () => tree?.setT(p.T) });
          },
        });
        // The wordmark waits for the header to actually be over us. At `top 60%` this
        // section is only the bottom 40% of the screen and the header still sits on the
        // hero's dark film, where navy on #0b1118 is ~1.5:1 — invisible. The hero pins
        // on phones too (no matchMedia guard) and leaves data-on-dark="true" behind, so
        // the handoff has to happen at `top top`, as it does on desktop (spec 9).
        ScrollTrigger.create({
          trigger: section, start: 'top top', refreshPriority: 1,
          onEnter: () => setWordmarkOnDark(false),
          onEnterBack: () => setWordmarkOnDark(false),
          // A resize re-runs the hero's onUpdate, which would repaint the wordmark
          // white over our white section; say it once more while we hold the header.
          onRefresh: (self) => { if (self.isActive) setWordmarkOnDark(false); },
        });
      });
      return () => { mm.revert(); tree?.destroy(); };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="visjon" className={styles.vision} aria-labelledby="visjon-label">
      <div className={styles.inner}>
        <div className={styles.text}>
          <span id="visjon-label" className={styles.label}>{site.vision.label}</span>
          <div className={styles.lines}>
            {site.vision.lines.map((line, i) => (
              <div key={line} className={styles.line} data-line data-dir={i % 2 === 0 ? -1 : 1}>{line}</div>
            ))}
          </div>
          <p className={styles.sub}>{site.vision.sub}</p>
        </div>
        <Tree />
      </div>
    </section>
  );
}
