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
      mm.add('(min-width: 768px)', () => {
        ScrollTrigger.create({
          trigger: section, start: 'top top', end: '+=160%', pin: true, scrub: 0.6,
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
          onEnter: () => { linesIn(); setWordmarkOnDark(false); },
          onEnterBack: () => setWordmarkOnDark(false),
          // A resize re-runs the hero's onUpdate, which would paint the wordmark white
          // again over our white section; say it once more while we hold the header.
          onRefresh: (self) => { if (self.isActive) setWordmarkOnDark(false); },
          onUpdate: (self) => tree?.setT(self.progress * GROW),
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
