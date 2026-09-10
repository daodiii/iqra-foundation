'use client';

import { useRef } from 'react';
import wash from '@/components/wash.module.css';
import { site } from '@/content/site.no';
import { film } from '@/lib/film';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { createInkWhenNear, type InkHandle } from '@/lib/ink';
import { setWordmarkOnDark } from '@/lib/wordmark';
import glass from './glass.module.css';
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

/**
 * Filler, and meant to look like it. The three panes that are not the tree need words in
 * them to be judged at all, but this section's real copy is one hand-set headline — there
 * is no second and third paragraph waiting to be poured in here. Inventing plausible ones
 * would hide that: the arrangement would look finished when what it actually needs is
 * content that does not exist yet.
 */
const filler = {
  head: 'Her kan det stå en overskrift',
  body: 'Og her en kort tekst under den. To eller tre setninger, omtrent så lange som disse, er nok til å se hvordan vanlig brødtekst oppfører seg oppå glasset.',
  stripLabel: 'Notat',
  stripLine: 'En smal hylle nederst, i full bredde. Plass til én setning, en dato, eller noe kort som ikke trenger en egen rute.',
  stripMark: 'Kort tekst',
};

export function Vision() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const box = section.querySelector<HTMLElement>('[data-tree]');
      const canvas = box?.querySelector('canvas');
      const lines = section.querySelectorAll<HTMLElement>('[data-line]');
      const panes = section.querySelectorAll<HTMLElement>('[data-pane]');
      const reduced = reducedMotion();
      let tree: TreeHandle | null = null;
      if (box && canvas) {
        tree = createVisionTree(box, canvas, {
          reduced,
          limbLabels: Array.from(box.querySelectorAll<HTMLElement>('[data-limb]')),
          rootLabel: box.querySelector<HTMLElement>('[data-root]'),
        });
      }

      /*
       * The cave before sunrise, in ink. The host is the section rather than the canvas, so
       * a hand moving across the copy stirs the colour behind it too — the panes are glass
       * lying on the water, not a lid on it. `createInk` returns null wherever WebGL2 or a
       * float colour buffer is missing, and the box keeps the still gradient underneath.
       */
      const inkCanvas = section.querySelector<HTMLCanvasElement>('[data-ink]');
      const ink: InkHandle | null = inkCanvas
        ? createInkWhenNear(inkCanvas, { reduced, palette: film.vision, host: section })
        : null;
      const stop = () => { tree?.destroy(); ink?.destroy(); };

      if (reduced) {
        tree?.setT(99);
        return stop;
      }
      // The section is a full viewport tall, so its copy is readable long before the
      // trigger fires. Hide the lines here — in JS, so a failed script leaves the copy
      // visible — or the fromTo below snaps them back out and replays them on screen.
      // Reduced motion returns above and keeps its CSS rest state (vision.module.css).
      gsap.set(lines, { opacity: 0 });
      gsap.set(panes, { opacity: 0 });

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
        /*
         * The panes arrive first and the words after them, which is one move rather than
         * two: glass sliding into place, then the copy settling onto it. The rise is small
         * — four panels each travelling a visible distance would be the busiest thing on
         * the page, and this section's whole job is to be calm enough that the tree is the
         * thing that moves.
         */
        gsap.fromTo(panes,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, ease: EASE.out, stagger: 0.08 });
        gsap.fromTo(lines,
          { x: (i, el) => 120 * dir(el), skewX: (i, el) => -8 * dir(el), opacity: 0 },
          { x: 0, skewX: 0, opacity: 1, duration: 1.1, ease: EASE.out, stagger: 0.09, delay: 0.22 });
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

      return stop;
    },
    { scope: root },
  );

  return (
    <section ref={root} id="visjon" className={styles.vision} aria-labelledby="visjon-label">
      <div className={`${wash.box} ${wash.cave}`} aria-hidden="true">
        <canvas className={wash.paint} data-ink />
      </div>
      <div className={styles.inner}>
        {/* One. The section's real copy — the hand-set headline, on glass. */}
        <div className={glass.pane} data-pane>
          <div className={`${glass.paneBody} ${styles.textBody} ${styles.pad}`}>
            <span id="visjon-label" className={styles.label}>{site.vision.label}</span>
            <div className={styles.lines}>
              {site.vision.lines.map((line, i) => (
                <div key={line} className={styles.line} data-line data-dir={i % 2 === 0 ? -1 : 1}>{line}</div>
              ))}
            </div>
            <p className={styles.sub}>{site.vision.sub}</p>
          </div>
        </div>

        {/* Two, the middle one: the tree. */}
        <div className={`${glass.pane} ${styles.treePanel}`} data-pane>
          <div className={`${glass.paneBody} ${styles.treeBody}`}>
            <Tree />
          </div>
        </div>

        {/* Three. Filler, set as ordinary prose. */}
        <div className={glass.pane} data-pane>
          <div className={`${glass.paneBody} ${styles.textBody} ${styles.pad}`}>
            <span className={styles.label}>Tekst</span>
            <h3 className={styles.fillHead}>{filler.head}</h3>
            <p className={styles.fillBody}>{filler.body}</p>
          </div>
        </div>

        {/* Four. Full width, and short. */}
        <div className={`${glass.pane} ${styles.strip}`} data-pane>
          <div className={`${glass.paneBody} ${styles.stripBody}`}>
            <span className={styles.label}>{filler.stripLabel}</span>
            <p className={styles.stripLine}>{filler.stripLine}</p>
            <span className={styles.stripMark}>{filler.stripMark}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
