'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { type BookHandle, createBook, pagePixels } from '@/components/about/book';
import { Onward } from '@/components/Onward';
import wash from '@/components/wash.module.css';
import { site } from '@/content/site.no';
import { film } from '@/lib/film';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { createFrame, type FrameHandle, keepFramesFitted } from '@/lib/pen';
import { createWaterWhenNear } from '@/lib/water';
import { setWordmarkOnDark } from '@/lib/wordmark';
import { drawFace, faces, indexAt, memberLabel, progressFor } from './pages';
import styles from './people.module.css';

/*
 * The words are the book's own chapters, so the landing page and `/om-oss` cannot drift:
 * chapter I is the story, chapter II the people. Read here rather than inside the
 * component because it is a content lookup, not a render.
 */
const [story, menneskene] = site.about.chapters;
const team = menneskene.team;
const count = team.length;

/**
 * Progress through the book: 1 the logo and the words, k + 2 member k. 0 would be the
 * closed book, and the book is never there — it stands open on the first spread from the
 * first frame («you should never see the cover», 2026-09-14).
 */
const WORDS = 1;
const LAST = progressFor(count - 1);

/** White pages on water: transparent round the pages, more light, a softer spine. */
const LOOK = { alpha: true, ambient: 0.84, gutter: 0.5 } as const;
/**
 * The camera, nearer than on `/om-oss` — the book fills its box rather than a screen. At
 * 2.28 the open spread stands 93% of the canvas's height (2.55 gave 83%): «make the book
 * larger so it fills up more of the section», 2026-09-13.
 */
const DIST = { spread: 2.28, single: 2.35 } as const;
/**
 * The page textures are painted at the size the page is seen (`pagePixels`), one texel
 * per pixel, between these: no wider than the `/om-oss` page — sixteen of those are some
 * 50 MB of texture memory, which a laptop does not notice and a phone does — and no
 * narrower than half of it, under which the type on the page stops being type.
 */
const TEX_W = { min: 384, max: 768 } as const;
const TEX_RATIO = 1040 / 768;
const LOGO = '/media/iqra-logo.png';
/** One turn, and the long way round — from the last spread back to the first, every leaf turning. */
const TURN = 0.95, WRAP = 1.6;

/** A logo that fails to load is a white page, not a book that never shows. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = src;
    if (img.complete && img.naturalWidth) resolve(img);
  });
}

/** One arrow, drawn pointing right; the back ring turns it round in the stylesheet. */
function Arrow() {
  return (
    <svg
      className={styles.arrow}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/**
 * Om oss · Teamet: the book from `/om-oss`, lying on the section's water.
 *
 * It lies open from the start, on the logo — the film's end card, on white — facing the
 * words: the chapter's first line and its paragraph. It used to start closed on that logo as its cover and open when the section was
 * reached; the cover went on 2026-09-14 («don't have a front page … you should never see
 * the cover»). The team is the pages after, one person to a spread, the portrait slot
 * facing the name; the two rings under the book turn them, and after the last the large
 * one comes all the way round to the first. On a phone the book shows one page at a time
 * and the words are set in a frame under it, since a phone has no room for a spread.
 *
 * The book is a canvas, so everything its pages say is also in the DOM under it: the
 * words in a frame, and the member card with its parts. That copy is hidden from sight
 * while the book runs — clipped, never `display:none`, so it stays in the accessibility
 * tree — and is the section's whole layout when the renderer declines, which is a device
 * without WebGL. Under reduced motion the rings jump rather than turn.
 */
export function People() {
  const root = useRef<HTMLElement>(null);
  /** Where the book is, rounded: what the band's label and the member card show. */
  const [spread, setSpread] = useState(WORDS);
  /** What the rings do. Set by the effect below, which owns the book. */
  const turn = useRef<((dir: 1 | -1) => void) | null>(null);
  /** The member card's frame, where the card has one: a step re-measures it. */
  const rowFrame = useRef<FrameHandle | null>(null);
  const index = Math.max(0, indexAt(spread));
  const member = team[index];

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const reduced = reducedMotion();

      const water = section.querySelector<HTMLCanvasElement>('[data-water]');
      const pool = water
        ? createWaterWhenNear(water, { reduced, floor: film.people, host: section })
        : null;

      /*
       * Light pages on a mid-tone floor, so the wordmark stays navy across this section as
       * it does over the ink above. Said rather than assumed, for the reason the other
       * sections carry: on a refresh the hero's scrubbed onUpdate re-fires at progress 1
       * and paints the wordmark white, which over this box is nearly invisible.
       */
      const watcher = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        onEnter: () => setWordmarkOnDark(false),
        onEnterBack: () => setWordmarkOnDark(false),
        onRefresh: (self) => { if (self.isActive) setWordmarkOnDark(false); },
      });

      /*
       * The book is built for the layout it is in — a spread, or one page at a time under
       * 900px — and rebuilt if a window is dragged across that line: the pages are painted
       * for one or the other, and the camera stands somewhere else for each. `all` so the
       * function runs when neither query matches, which is how jsdom answers every query.
       */
      const mm = gsap.matchMedia();
      mm.add({ single: '(max-width: 899px)', all: 'all' }, (ctx) => {
        const single = Boolean(ctx.conditions?.single);
        const canvas = section.querySelector<HTMLCanvasElement>('[data-book]');
        const wordsCard = section.querySelector<HTMLElement>('[data-words]');
        const row = section.querySelector<HTMLElement>('[data-row]');
        let book: BookHandle | null = null;
        let gone = false;
        let run: gsap.core.Animation | null = null;
        const at = { p: WORDS };
        let shown = -1;

        /** The renderer draws, and the label and the card follow the rounded progress. */
        const apply = (p: number) => {
          at.p = p;
          book?.setProgress(p);
          const s = Math.round(p);
          if (s !== shown) { shown = s; setSpread(s); }
        };

        /*
         * The frames, drawn with the tree's pen, round whatever the layout shows of the
         * readable copy: the words on a phone, the words and the card when there is no
         * book. A clipped card measures a pixel and gets no frame.
         */
        const frames: FrameHandle[] = [];
        let unfit = () => {};
        const frameUp = () => {
          for (const card of [wordsCard, row]) {
            if (!card || card.getBoundingClientRect().width < 2) continue;
            const f = createFrame(card);
            if (!f) continue;
            frames.push(f);
            f.layout();
            if (card === row) rowFrame.current = f;
          }
          unfit();
          unfit = keepFramesFitted(frames);
        };

        /*
         * `on` BEFORE building: the canvas is `display:none` in the readable state and a
         * display:none canvas measures zero, so the renderer would size itself against
         * nothing. Back to `off` if the renderer declines — a device without WebGL, or a
         * driver that will not compile the shaders — and the readable copy is the layout,
         * opening on the first member. The context is asked for here so a decline costs
         * no logo load, and with the renderer's own attributes, so it is the context the
         * renderer then gets.
         */
        section.dataset.book = 'on';
        const gl = canvas?.getContext('webgl', { antialias: true, alpha: LOOK.alpha }) ?? null;
        const decline = () => {
          section.dataset.book = 'off';
          apply(WORDS + 1);
          frameUp();
        };

        const build = async () => {
          if (!canvas || !gl) { decline(); return; }
          /*
           * The pages are painted once, at creation, so the face has to be in first —
           * `next/font` names the family, so it is read off the page rather than written
           * here, and every weight the pages use is asked for before anything is drawn.
           */
          const family = getComputedStyle(document.body).fontFamily || 'sans-serif';
          await Promise.all([200, 400, 500, 600].map((w) => document.fonts.load(`${w} 40px ${family}`)));
          const logo = await loadImage(LOGO);
          if (gone) return;
          // The renderer draws at the device's pixels (to 2×), so the page is measured in
          // those. A canvas with no size yet — a tab that has never been shown — gets full
          // pages rather than the smallest: they are painted once and seen at any size after.
          const dist = single ? DIST.single : DIST.spread;
          const seen = pagePixels(canvas.clientHeight * Math.min(window.devicePixelRatio || 1, 2), dist) || TEX_W.max;
          const W = Math.round(Math.min(TEX_W.max, Math.max(TEX_W.min, seen)));
          const H = Math.round(W * TEX_RATIO);
          const assets = { family, logo };
          const painted = faces(single).map((face) => drawFace(face, W, H, assets));
          book = createBook(canvas, { ...LOOK, faces: painted, single, dist });
          if (!book) { decline(); return; }
          if (single) frameUp();
          book.setProgress(at.p);
        };
        const ready = build().catch(decline);

        /**
         * A press: on to the next spread, or back — and past either end, the long way
         * round to the other. Without a book the same press steps the card, and the
         * words are not a stop: the first member is.
         */
        turn.current = (dir) => {
          const first = book ? WORDS : WORDS + 1;
          const p = at.p;
          const over = dir > 0 ? p >= LAST - 0.5 : p <= first + 0.5;
          const target = over ? (dir > 0 ? first : LAST) : Math.round(p) + dir;
          run?.kill();
          if (!book || reduced) { apply(target); return; }
          run = gsap.to(at, {
            p: target, duration: over ? WRAP : TURN, ease: EASE.inOut, onUpdate: () => apply(at.p),
          });
        };

        /*
         * The arrival, when the section is reached: the pen draws the frames as the words
         * rise. The book itself does nothing here — it is already open on its first
         * spread, and has been since it was painted. Once: frames drawn a second time on
         * the way back up would be a page redrawing itself.
         */
        const rise = section.querySelectorAll<HTMLElement>('[data-rise]');
        if (!reduced) gsap.set(rise, { opacity: 0, y: 22 });
        const arrive = () => {
          if (gone) return;
          const tl = gsap.timeline();
          frames.forEach((f) => tl.to(f, { p: 1, duration: 1.1, ease: EASE.none, onUpdate: () => f.draw() }, 0));
          tl.to(rise, { opacity: 1, y: 0, duration: 0.95, ease: EASE.out, stagger: 0.105 }, 0.3);
        };
        if (reduced) ready.then(() => { frames.forEach((f) => { f.p = 1; f.draw(); }); arrive(); });
        const entrance = ScrollTrigger.create({
          trigger: section, start: 'top 72%', once: true,
          onEnter: () => { if (!reduced) ready.then(arrive); },
        });

        return () => {
          gone = true;
          entrance.kill();
          run?.kill();
          unfit();
          frames.forEach((f) => f.destroy());
          rowFrame.current = null;
          book?.destroy();
          book = null;
          turn.current = null;
          gsap.set(rise, { clearProps: 'opacity,transform' });
          section.dataset.book = 'off';
        };
      });

      return () => { mm.revert(); watcher.kill(); pool?.destroy(); };
    },
    { scope: root },
  );

  /*
   * A step re-measures the card's frame: the role is the legend on the line, and the new
   * one is another width. Only where the card has a frame, which is the readable layout.
   */
  useGSAP(() => { rowFrame.current?.layout(); }, { scope: root, dependencies: [index] });

  const where = spread <= WORDS ? site.about.label : memberLabel(index, count);

  return (
    <section
      ref={root}
      id="om-oss-teamet"
      className={styles.people}
      aria-label={site.people.sectionLabel}
      data-book="off"
    >
      <div className={`${wash.box} ${wash.people}`} aria-hidden="true">
        <canvas className={wash.paint} data-water />
      </div>

      {/* The stage is the box's own rectangle: the book lies in it, the band sits at its foot. */}
      <div className={styles.stage}>
        <canvas className={styles.book} data-book aria-hidden="true" />

        {/*
          * The readable copy. Everything the pages say, as text: hidden while the book
          * runs, the layout when it does not — and on a phone the words are shown under
          * the book either way, since one page at a time leaves them no page.
          */}
        <div className={styles.readable} data-readable>
          <div className={`${wash.frameOnWater} ${styles.card}`} data-words>
            <canvas className={wash.frameCanvas} data-frame-canvas aria-hidden="true" />
            <p className={`${wash.legend} ${styles.label}`} data-legend>{site.about.label}</p>
            <p className={styles.lede} data-rise>{story.lede}</p>
            <p className={styles.para} data-rise>{story.paras[0]}</p>
          </div>

          <div
            className={`${wash.frameOnWater} ${styles.row}`}
            data-row
            data-index={index}
            aria-label={site.people.teamLabel}
          >
            <canvas className={wash.frameCanvas} data-frame-canvas aria-hidden="true" />
            {/* The role is the legend on the line; the count stays inside, at the top right. */}
            <p className={`${wash.legend} ${styles.eyebrow}`} data-legend data-part="role">{member.role}</p>
            <p className={`${styles.eyebrow} ${styles.counter}`} data-counter>{index + 1} / {count}</p>
            <div className={styles.body}>
              {/* An empty rectangle where a photograph would go. Drawn rather than left out,
                  because the card's shape is what it will be when it has a face in it — and
                  an initial or a silhouette would be a face we do not have. */}
              <div className={styles.portrait} data-part="portrait" aria-hidden="true" />
              {/* Announced on each step: the name and the line are what changed. */}
              <div className={styles.info} data-part="info" aria-live="polite">
                <p className={styles.display}>
                  <span className={styles.first}>{member.first}</span>
                  <span className={styles.last}>{member.last}</span>
                </p>
                <p className={styles.bio}>{member.bio}</p>
              </div>
            </div>
          </div>
        </div>

        {/* On the water's bottom line, under the band: on to Støtt oss. */}
        <Onward to="stott-oss" />

        {/* Under the book, inside the box: the offer, where you are, and the two rings. */}
        <div className={styles.controls} data-controls>
          <Link className={styles.more} href="/om-oss" prefetch={false}>
            {site.people.more} →
          </Link>
          <p className={styles.where} data-where aria-live="polite">{where}</p>
          <div className={styles.rings}>
            {/* Back is the smaller ring, and first: the eye lands on the large one, which
                is the way the book was designed to be read — on. */}
            <button
              type="button"
              className={`${styles.go} ${styles.back}`}
              aria-label={site.people.prev}
              onClick={() => turn.current?.(-1)}
            >
              <Arrow />
            </button>
            <button
              type="button"
              className={styles.go}
              aria-label={site.people.next}
              onClick={() => turn.current?.(1)}
            >
              <Arrow />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
