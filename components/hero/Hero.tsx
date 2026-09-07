'use client';

import { useRef } from 'react';
import { site } from '@/content/site.no';
import { EASE, gsap, reducedMotion, useGSAP } from '@/lib/gsap';
import { pickSource } from '@/lib/media';
import { setWordmarkOnDark } from '@/lib/wordmark';
import { maskOrigin } from './maskOrigin';
import styles from './hero.module.css';

/** Fallback origin (viewBox units) when text metrics are unavailable, e.g. in jsdom. */
const FALLBACK_ORIGIN = '210 318';

function measureOrigin(word: SVGTextElement): string {
  try {
    const bb = word.getBBox();
    return maskOrigin({
      start: word.getStartPositionOfChar(0).x,
      end: word.getEndPositionOfChar(0).x,
      bbY: bb.y,
      bbHeight: bb.height,
    });
  } catch {
    return FALLBACK_ORIGIN;
  }
}

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wordRef = useRef<SVGTextElement>(null);

  useGSAP(
    (self) => {
      const section = root.current;
      const video = videoRef.current;
      const word = wordRef.current;
      if (!section || !video || !word) return;

      // Media: pick the loop after hydration, never before (spec 6.4).
      video.src = pickSource({
        narrow: window.matchMedia('(max-width: 767px)').matches,
        webm: video.canPlayType('video/webm; codecs="vp9"') !== '',
      });
      video.muted = true;
      setWordmarkOnDark(false);

      if (reducedMotion()) return; // poster inside the closed letters; copy shown by CSS (spec 6.5)

      video.load();
      Promise.resolve(video.play()).catch(() => {}); // autoplay refused: the poster stays, nothing else changes

      const q = gsap.utils.selector(section);
      let cancelled = false;
      document.fonts.ready.then(() => {
        if (cancelled) return;
        // The fonts land after this callback has returned, so join the context by
        // hand: animations made outside it escape the hook's cleanup, and React's
        // Strict Mode double mount would then leave two pinned triggers behind.
        self.add(() => {
          const origin = measureOrigin(word);
          // On arrival the film fades up inside the letters, slightly zoomed.
          gsap.fromTo(video, { opacity: 0, scale: 1.18 }, { opacity: 1, scale: 1.12, duration: 1.6, ease: 'power2.out' });
          // Spec 6.2: letters grow as windows, then rush open; the last slivers dissolve.
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: '+=300%',
              pin: true,
              scrub: 0.5,
              // This trigger is built inside document.fonts.ready, so it is created
              // last, and GSAP refreshes in creation order unless told otherwise.
              // Every section below measures its start against our pin spacing, so we
              // must refresh first: highest priority wins, and the sections carry
              // descending priorities in document order (hero 2, visjon 1, rest 0).
              refreshPriority: 2,
              onUpdate: (st) => setWordmarkOnDark(st.progress > 0.6),
            },
          });
          tl.to(word, { scale: 7, svgOrigin: origin, ease: EASE.none, duration: 0.55 }, 0)
            .to(word, { scale: 14, svgOrigin: origin, ease: EASE.in2, duration: 0.25 }, 0.55)
            .to(q('[data-mask]'), { opacity: 0, ease: EASE.inOut, duration: 0.16 }, 0.64)
            .to(video, { scale: 1, ease: EASE.in1, duration: 0.5 }, 0.4)
            .to(q('[data-hint]'), { opacity: 0, duration: 0.08 }, 0)
            .to(q('[data-scrim]'), { opacity: 1, duration: 0.2 }, 0.72)
            .fromTo(q('[data-copy]'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.2, ease: EASE.out }, 0.82)
            .to({}, { duration: 0.16 });
          // The wordmark sits in the header, outside this context's scope, so it goes
          // in as an element: a selector string would be looked up inside the hero.
          const wordmark = document.getElementById('site-wordmark');
          if (wordmark) tl.to(wordmark, { opacity: 1, duration: 0.2 }, 0.7);
        });
      });
      return () => {
        cancelled = true;
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
              <text
                ref={wordRef}
                id="hero-word"
                x="500"
                y="318"
                textAnchor="middle"
                dominantBaseline="middle"
                fontWeight="800"
                fontSize="290"
                letterSpacing="-18"
                fill="#000"
                style={{ fontFamily: 'var(--font-geist), "Segoe UI", system-ui, sans-serif' }}
              >
                {site.hero.word}
              </text>
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
