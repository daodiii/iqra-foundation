'use client';

import { useRef } from 'react';
import ReactDOM from 'react-dom';
import { site } from '@/content/site.no';
import { ACT_SNAP, EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { pickSource } from '@/lib/media';
import { headerElements, setWordmarkOnDark } from '@/lib/wordmark';
import styles from './hero.module.css';

/**
 * Where the letters open from: the middle of the R's upright stem.
 *
 * The mask grows out of this point, so whatever sits under it is what fills the screen on
 * the way out, and it has to be ink. A counter, or the gap between the two lines, would
 * blow up into white and blank the film out instead of opening it (spec 6.3). A stem is
 * the one shape that keeps working at any scale, because it stays a full-height window and
 * only ever grows wider. Measured, the stem's run through this point is 451–500 across and
 * 163–368 down, so the margin is 25 units left, 24 right, 137 up and 68 down.
 *
 * It is 24 units left of the frame's centre, which is 2.4% of the width and not something
 * the eye catches — but it is not nothing, so: the R's stem is the nearest upright to the
 * middle, and the letters are tracked too tight to bring it closer. Loosening IQRA's
 * tracking walks the stem right by half a unit per unit of tracking while widening the
 * lockup by three, and the lockup already sits 12px from both edges of a 360px phone. The
 * stem runs out of road long before it reaches the middle.
 */
const ORIGIN = '476 300';

/**
 * The lockup, in viewBox units: IQRA large, FOUNDATION at a quarter of its size and
 * tracked out to the same width underneath. The tracking is doing real work — drop it
 * and the second line is three quarters the width of the first.
 *
 * Neither `x` is 500, for two separate reasons, and neither is a slip.
 *
 * The 22 between them squares the two lines up. `textAnchor="middle"` centres the advance
 * box, which carries one trailing letter-space, and IQRA's tracking is negative where
 * FOUNDATION's is positive, so the same anchor pulls them opposite ways: at 500 each the
 * ink came out 188–844 against 174–808, the second line 25 units left and 22 narrow. This
 * puts FOUNDATION's F on IQRA's I and its N 7 units inside the A, which is where the eye
 * wants it — the A is a diagonal, so aligning to its widest point, down at the baseline,
 * reads as overhanging.
 *
 * The 16 they are both shifted by centres the lockup in the frame. IQRA is not centred on
 * its own anchor: the I's stem starts a sidebearing in, while the A's foot overhangs its
 * advance, which left the ink at 188–844 — 16 right of centre. Invisible on a desktop, but
 * on a 375px phone the mask is deliberately near full-bleed, and 16 units showed up as 20px
 * of margin on the left against 2px on the right. Now the ink measures 173–825, centred on
 * 499, and the margins come out 249/252 at 1440px and 13/15 on a Pixel 7. Re-measure all of
 * it if the font or the sizes change.
 */
const LINE = [
  { size: 290, tracking: -18, x: 484, y: 290 },
  { size: 74, tracking: 18.6, x: 506, y: 423 },
] as const;

export function Hero() {
  /*
   * The poster is what fills the letters until the film has decoded, so it wants to be
   * fetched early. It used to be preloaded from the root layout, which put it in the
   * head of every route — including /om-oss, where nothing uses it and Chrome says so
   * in the console. Declared here it follows the only element that ever wants it.
   */
  ReactDOM.preload('/media/iqra-poster.jpg', { as: 'image' });
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lockupRef = useRef<SVGGElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      const video = videoRef.current;
      const lockup = lockupRef.current;
      if (!section || !video || !lockup) return;
      const cta = section.querySelector<HTMLAnchorElement>('[data-copy] a');

      // Media: pick the loop after hydration, never before (spec 6.4).
      video.src = pickSource({
        narrow: window.matchMedia('(max-width: 767px)').matches,
        webm: video.canPlayType('video/webm; codecs="vp9"') !== '',
      });
      video.muted = true;
      setWordmarkOnDark(false);

      if (reducedMotion()) return; // poster inside the closed letters; copy shown by CSS (spec 6.5)

      // The header is visible by default, because every page has one and only this page
      // has a hero to turn it back on. Hiding it is therefore the hero's job, done here
      // rather than in the stylesheet, and only once we know we are going to animate.
      gsap.set(headerElements(), { opacity: 0 });
      /*
       * The call to action comes in with the copy, so until then it is a transparent
       * link at the bottom of the film and it should not be a tab stop. Not `inert`, and
       * not on the copy as a whole: the headline and the lede are deliberately left
       * readable to a screen reader the entire time (that is why the copy is faded with
       * `opacity` and never `autoAlpha`), and this takes nothing out of that tree. It
       * only stops focus landing somewhere the eye cannot follow — the header solves the
       * same problem the other way, by showing itself when it is focused, which the copy
       * cannot do because its own parent carries the opacity.
       */
      if (cta) cta.tabIndex = -1;

      video.load();
      Promise.resolve(video.play()).catch(() => {}); // autoplay refused: the poster stays, nothing else changes

      const q = gsap.utils.selector(section);
      // On arrival the film fades up inside the letters, slightly zoomed.
      gsap.fromTo(video, { opacity: 0, scale: 1.18 }, { opacity: 1, scale: 1.12, duration: 1.6, ease: 'power2.out' });
      // Spec 6.2: letters grow as windows, then rush open; the last slivers dissolve.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          // 200%, not 300%: the opening is the same, it just asks for two screens
          // of scrolling rather than three to give it.
          end: '+=200%',
          pin: true,
          scrub: 0.5,
          // Take the pin a frame early. Without this a pin grabbed at speed is applied
          // after the scroll that triggered it, which the eye reads as a jump.
          anticipatePin: 1,
          snap: ACT_SNAP,
          /*
           * This used to be built inside `document.fonts.ready`, which made it the last
           * trigger created and cost 1800px of document height the moment the fonts
           * landed — everything below the hero moved under whoever was already
           * scrolling. It is created synchronously now, so the pin spacing is there on
           * the first frame, and creation order is document order again.
           *
           * Which makes this key redundant rather than load-bearing: it was here because
           * refreshes fall back to creation order, and ours was last. Kept for one more
           * commit so that if anything below lands wrong, it is attributable to the
           * un-deferring alone. Removing it is a separate change (see the 2026-09-09
           * scroll-fluidity spec); what turns sorting on is the key's PRESENCE, not its
           * value — ScrollTrigger.js:1036 sets _sort on `"refreshPriority" in vars`.
           */
          refreshPriority: 2,
          onUpdate: (st) => {
            setWordmarkOnDark(st.progress > 0.6);
            // The copy tween runs from 0.695 to 0.864 of the pin; by 0.8 there is
            // enough of the button on screen to focus something visible.
            if (cta) cta.tabIndex = st.progress > 0.8 ? 0 : -1;
          },
        },
      });
      tl.to(lockup, { scale: 7, svgOrigin: ORIGIN, ease: EASE.none, duration: 0.55 }, 0)
        .to(lockup, { scale: 14, svgOrigin: ORIGIN, ease: EASE.in2, duration: 0.25 }, 0.55)
        .to(q('[data-mask]'), { opacity: 0, ease: EASE.inOut, duration: 0.16 }, 0.64)
        .to(video, { scale: 1, ease: EASE.in1, duration: 0.5 }, 0.4)
        .to(q('[data-hint]'), { opacity: 0, duration: 0.08 }, 0)
        .to(q('[data-scrim]'), { opacity: 1, duration: 0.2 }, 0.72)
        .fromTo(q('[data-copy]'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.2, ease: EASE.out }, 0.82)
        .to({}, { duration: 0.16 });
      // The header sits outside this context's scope, so it goes in as elements:
      // a selector string would be looked up inside the hero.
      const header = headerElements();
      if (header.length) tl.to(header, { opacity: 1, duration: 0.2 }, 0.7);

      /*
       * The pin no longer waits for the fonts, but the sections below are text and their
       * heights still change when Geist swaps in. One refresh re-measures them. `next/font`
       * self-hosts with a metric-matched fallback, so this is a few pixels rather than the
       * screen it used to be.
       */
      let cancelled = false;
      document.fonts.ready.then(() => {
        if (!cancelled) ScrollTrigger.refresh();
      });
      return () => {
        cancelled = true;
        if (cta) cta.tabIndex = 0;
      };
    },
    { scope: root },
  );

  const last = site.hero.h1Lines.length - 1;
  return (
    <section ref={root} id="hero" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.stage}>
        <video ref={videoRef} className={styles.film} poster="/media/iqra-poster.jpg" preload="metadata" muted loop playsInline aria-hidden="true" />
        <svg className={styles.mask} data-mask viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <mask id="hero-letters">
              <rect x="-20000" y="-20000" width="41000" height="41000" fill="#fff" />
              {/* One group, so the two lines zoom as the single piece of lettering they read as. */}
              <g ref={lockupRef} id="hero-lockup">
                {site.hero.wordLines.map((line, i) => (
                  <text
                    key={line}
                    x={LINE[i].x}
                    y={LINE[i].y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontWeight="800"
                    fontSize={LINE[i].size}
                    letterSpacing={LINE[i].tracking}
                    fill="#000"
                    style={{ fontFamily: 'var(--font-geist), "Segoe UI", system-ui, sans-serif' }}
                  >
                    {line}
                  </text>
                ))}
              </g>
            </mask>
          </defs>
          <rect x="-20000" y="-20000" width="41000" height="41000" fill="#ffffff" mask="url(#hero-letters)" />
        </svg>
        <div className={styles.scrim} data-scrim aria-hidden="true" />
        <p className={styles.hint} data-hint aria-hidden="true">{site.hero.hint}</p>
      </div>
      <div className={styles.copy} data-copy>
        <h1 id="hero-title" className={styles.h1}>
          {site.hero.h1Lines.map((line, i) => (
            <span key={line} className={styles.line}>
              {line}
              {i === last && <span className={styles.dot}>.</span>}
            </span>
          ))}
        </h1>
        <p className={styles.lede}>{site.hero.lede}</p>
        <a className={styles.cta} href={`mailto:${site.contact.email}`}>{site.hero.cta}</a>
      </div>
    </section>
  );
}
