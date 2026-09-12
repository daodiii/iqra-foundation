'use client';

import { useRef } from 'react';
import wash from '@/components/wash.module.css';
import { site } from '@/content/site.no';
import { film } from '@/lib/film';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { createInkWhenNear, type InkHandle } from '@/lib/ink';
import { setWordmarkOnDark } from '@/lib/wordmark';
import { desktopArch, desktopStage, drawStroke, phoneArch, phoneStage, type Arch, type Rect } from './arch';
import { createVisionTree, GROW } from './tree';
// TreeFigure, not Tree: on a case-insensitive filesystem './Tree' resolves to tree.ts.
import { Tree } from './TreeFigure';
import styles from './vision.module.css';

/**
 * How long the tree takes to open, in seconds. Nothing holds the reader here now that the
 * pin is gone, so it has to be shorter than a pass down the section rather than longer: at
 * five — the figure the phone branch used to run — a normal scroll left a half-grown tree
 * behind it. The arch is drawn on the same clock.
 *
 * The arch is a stroke and nothing more. It used to open onto a painted pre-dawn — sky,
 * stars, grass, earth under the roots — and that went by the user's call (2026-09-12: «just
 * have the tree and the arch, delete everything inside»). What is inside the stroke now is
 * the box's own ink.
 */
const OPEN = 3;

/**
 * Below this the section flows — the arch keeps the top of it with the tree inside, and
 * the cards stack under it. The same line vision.module.css draws: the CSS decides the
 * layout, and this only asks which one it chose.
 */
const FLOW = '(max-width: 1099px)';

/** The slots the three cards stand in: left, top, right. */
const SLOTS = [styles.slotLeft, styles.slotTop, styles.slotRight];

/**
 * FOUNDATION tracked out to IQRA's width, as the hero's lockup is: the tracking is what
 * makes the two lines one mark. Measured rather than set, because it depends on which font
 * has landed.
 */
function fitMark(mark: HTMLElement | null) {
  const first = mark?.querySelector<HTMLElement>('[data-mark-first]');
  const second = mark?.querySelector<HTMLElement>('[data-mark-second]');
  if (!first || !second) return;
  second.style.letterSpacing = '0';
  second.style.marginRight = '0';
  const target = first.getBoundingClientRect().width;
  const natural = second.getBoundingClientRect().width;
  const letters = (second.textContent ?? '').length || 1;
  const spacing = Math.max(0, (target - natural) / letters);
  second.style.letterSpacing = `${spacing}px`;
  // Letter-spacing lands after the last letter too; take that back so the line centres.
  second.style.marginRight = `${-spacing}px`;
}

export function Vision() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const figure = section.querySelector<HTMLElement>('[data-figure]');
      const area = section.querySelector<HTMLElement>('[data-arch]');
      const stage = section.querySelector<HTMLElement>('[data-tree]');
      const strokeCanvas = section.querySelector<HTMLCanvasElement>('[data-stroke]');
      const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-value]'));
      if (!figure || !area || !stage || !strokeCanvas || cards.length !== 3) return;
      const treeCanvas = stage.querySelector('canvas');
      const mark = stage.querySelector<HTMLElement>('[data-root]');
      const reduced = reducedMotion();
      const DPR = Math.min(window.devicePixelRatio || 1, 2);

      const tree = treeCanvas ? createVisionTree(stage, treeCanvas, { reduced, limbLabels: [], rootLabel: mark }) : null;

      /*
       * The sky, in ink (`film.vision`). The host is the section rather than the canvas, so
       * a hand moving across the copy stirs the colour behind it too — the cards are glass
       * lying on the water, not a lid on it. `createInk` returns null wherever WebGL2 or a
       * float colour buffer is missing, and the box keeps the still gradient underneath;
       * the stroke and the tree are 2D and draw either way.
       */
      const inkCanvas = section.querySelector<HTMLCanvasElement>('[data-ink]');
      const ink: InkHandle | null = inkCanvas
        ? createInkWhenNear(inkCanvas, { reduced, palette: film.vision, host: section })
        : null;
      const strokeCtx = strokeCanvas.getContext('2d');

      /* The geometry, remade on every layout. */
      let arch: Arch | null = null;
      let surfaces: [number, number, number] = [0.3, 0.55, 0.8];
      let W = 0;
      let H = 0;
      /** The tree's growth time; the stroke is drawn from it. */
      let T = reduced ? 99 : 0;
      let dead = false;
      const shown = [false, false, false];

      const draw = () => {
        if (!arch || !strokeCtx) return;
        strokeCtx.clearRect(0, 0, W, H);
        drawStroke(strokeCtx, arch.path, Math.min(1, T / GROW));
      };

      /*
       * Everything that depends on a measurement. The cards are placed by CSS; this reads
       * where they landed and puts the arch and the stage around them. In flow the arch
       * area is the space; on a desktop it is the whole figure.
       */
      const layout = () => {
        W = area.clientWidth;
        H = area.clientHeight;
        if (W < 1 || H < 1) return; // not laid out: display none, or jsdom
        if (strokeCtx) {
          strokeCanvas.width = W * DPR;
          strokeCanvas.height = H * DPR;
          strokeCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
        }
        let rect: Rect;
        if (window.matchMedia(FLOW).matches) {
          arch = phoneArch(W, H);
          rect = phoneStage(arch, W, H);
          surfaces = arch.surfaces(0);
        } else {
          arch = desktopArch(W, H);
          const fig = figure.getBoundingClientRect();
          const [left, top, right] = cards.map((c) => c.getBoundingClientRect());
          rect = desktopStage(W, H, top.bottom - fig.top, right.left - left.right);
          surfaces = arch.surfaces((left.top + left.bottom) / 2 - fig.top);
        }
        const size = [rect.left, rect.top, rect.width, rect.height].map((v) => `${Math.round(v)}px`);
        const changed = stage.style.width !== size[2] || stage.style.height !== size[3];
        [stage.style.left, stage.style.top, stage.style.width, stage.style.height] = size;
        // The renderer fitted the tree to whatever size the stage had before; tell it.
        if (changed) tree?.refit();
        draw();
      };

      let rt = 0;
      const onResize = () => {
        window.clearTimeout(rt);
        rt = window.setTimeout(() => { fitMark(mark); layout(); }, 300);
      };
      window.addEventListener('resize', onResize);
      const stop = () => {
        dead = true;
        window.removeEventListener('resize', onResize);
        window.clearTimeout(rt);
        tree?.destroy();
        ink?.destroy();
      };

      if (reduced) tree?.setT(99);
      // Hide the cards here — in JS, so a failed script leaves the copy visible — never in CSS.
      else gsap.set(cards, { opacity: 0, y: 16 });
      fitMark(mark);
      layout();
      // The cards are measured, and the web font changes their height: again when it lands.
      document.fonts.ready.then(() => { if (!dead) { fitMark(mark); layout(); } });

      if (reduced) return stop;

      /*
       * The tree opens by itself on a clock, and the arch is drawn on the same clock with
       * the tree's pen: `p` is how far the pen has come. Each card surfaces as the pen
       * reaches its flank, once — glass sliding into place in the stroke's wake, not a
       * stagger.
       */
      const growth = { T: 0 };
      let arrived = false;
      const arrive = () => {
        if (arrived) return;
        arrived = true;
        gsap.to(growth, {
          T: GROW, duration: OPEN, ease: EASE.none,
          onUpdate: () => {
            T = growth.T;
            tree?.setT(T);
            draw();
            const p = T / GROW;
            cards.forEach((card, i) => {
              if (shown[i] || p < surfaces[i] + 0.004) return;
              shown[i] = true;
              gsap.to(card, { y: 0, opacity: 1, duration: 0.9, ease: EASE.out });
            });
          },
        });
      };

      ScrollTrigger.create({
        trigger: section, start: 'top 78%', once: true, refreshPriority: 1,
        onEnter: arrive,
        /*
         * Landing here from a reload rather than scrolling in: the browser restores the
         * scroll position, the start is already behind us, and `onEnter` has nothing left
         * to fire on — so the cards would keep the opacity 0 set above, invisible and
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
      {/* Inset exactly as the box is, so 16px from this edge is 16px inside the ink. */}
      <div className={styles.figure} data-figure>
        <p id="visjon-label" className={styles.label}>{site.vision.label}</p>
        {/* The arch: the stroke, and the tree with the name under its roots. The ink shows through the opening. */}
        <div className={styles.arch} data-arch>
          <canvas className={styles.layer} data-stroke aria-hidden="true" />
          <Tree />
        </div>
        {/* The three values, on glass: Dialog on the left flank, Trygghet on the apex, Inkludering on the right. */}
        {site.vision.values.map((v, i) => (
          <div key={v.key} className={`${styles.slot} ${SLOTS[i]}`}>
            <div className={`${wash.card} ${styles.value}`} data-value={v.key}>
              <h2 className={styles.name}>{v.name}</h2>
              <p className={styles.text}>{v.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
