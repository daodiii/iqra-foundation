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
      const linesIn = () =>
        gsap.fromTo(lines,
          { x: (i, el) => 120 * dir(el), skewX: (i, el) => -8 * dir(el), opacity: 0 },
          { x: 0, skewX: 0, opacity: 1, duration: 1.1, ease: EASE.out, stagger: 0.09 });
      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', () => {
        ScrollTrigger.create({
          trigger: section, start: 'top top', end: '+=160%', pin: true, scrub: 0.6,
          // The hero pins above us but builds its trigger inside document.fonts.ready,
          // so ours is created first. Refresh order decides what a trigger measures:
          // without this we would size ourselves against a hero that has no pin spacing
          // yet and start 2700px too early. Lower priority refreshes later (spec 7).
          refreshPriority: -1,
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
        let grown = false;
        // The growth runs once, but the wordmark has to answer every time this white
        // section arrives under the header, so the trigger itself is not `once` (spec 9).
        ScrollTrigger.create({
          trigger: section, start: 'top 60%', refreshPriority: -1,
          onEnter: () => {
            setWordmarkOnDark(false);
            if (grown) return;
            grown = true;
            linesIn();
            gsap.to(p, { T: GROW, duration: 5, ease: EASE.none, onUpdate: () => tree?.setT(p.T) });
          },
          onEnterBack: () => setWordmarkOnDark(false),
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
