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

/**
 * How long the tree takes to open, in seconds. Nothing holds the reader here now that the
 * pin is gone, so it has to be shorter than a pass down the section rather than longer: at
 * five — the figure the phone branch used to run — a normal scroll left a half-grown tree
 * behind it.
 */
const OPEN = 3;

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

      /*
       * The tree opens by itself, and there is no longer a desktop branch and a phone
       * branch — the phone's shape of it, a clock rather than a pin, everywhere.
       *
       * It used to be scrubbed by a pin: a screen and a bit of scrolling whose only
       * content was the tree opening, so the section held you still while you turned a
       * crank to be shown the thing you had already arrived at. Growing it on a clock
       * says the same thing and gives the scroll back; it also removes the last pin
       * after the hero, so nothing below the film sticks.
       */
      const growth = { T: 0 };
      let arrived = false;
      const arrive = () => {
        if (arrived) return;
        arrived = true;
        gsap.fromTo(lines,
          { x: (i, el) => 120 * dir(el), skewX: (i, el) => -8 * dir(el), opacity: 0 },
          { x: 0, skewX: 0, opacity: 1, duration: 1.1, ease: EASE.out, stagger: 0.09 });
        gsap.to(growth, { T: GROW, duration: OPEN, ease: EASE.none, onUpdate: () => tree?.setT(growth.T) });
      };

      ScrollTrigger.create({
        trigger: section, start: 'top 78%', once: true, refreshPriority: 1,
        onEnter: arrive,
        /*
         * Landing here from a reload rather than scrolling in: the browser restores the
         * scroll position, the start is already behind us, and `onEnter` has nothing left
         * to fire on — so the lines would keep the opacity 0 set above, invisible and
         * permanently so. Hidden on purpose and hidden by accident look identical.
         *
         * Measured on refresh, never at creation. The hero builds its pin inside
         * `document.fonts.ready`, which resolves after this effect runs, so at creation
         * every position below the hero is a screen short and this would fire for a
         * visitor who is still up in the film.
         */
        onRefresh: (self) => { if (self.progress > 0) arrive(); },
      });

      // The wordmark waits for the header to actually be over us. At the section's own
      // arrival it is still down the screen, and the header is on the hero's dark film
      // where navy on #0b1118 is ~1.5:1 — invisible. The hero pins on phones too and
      // leaves data-on-dark="true" behind, so the handoff belongs at `top top` (spec 9).
      ScrollTrigger.create({
        trigger: section, start: 'top top', refreshPriority: 1,
        onEnter: () => setWordmarkOnDark(false),
        onEnterBack: () => setWordmarkOnDark(false),
        // A resize re-runs the hero's onUpdate, which would repaint the wordmark white
        // over our white section; say it once more while we hold the header.
        onRefresh: (self) => { if (self.isActive) setWordmarkOnDark(false); },
      });

      return () => tree?.destroy();
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
