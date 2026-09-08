'use client';

import { useRef } from 'react';
import { site } from '@/content/site.no';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { createBook, type BookHandle } from './book';
import styles from './about.module.css';

/** Cover, one per chapter, then the contact page: the same five states the book turns to. */
const chapterLabels = [
  'Omslag',
  ...site.about.chapters.map((c) => `${c.num} · ${c.title}`),
  site.about.contact.label,
];

/**
 * The book is drawn on a canvas, so the whole of Om oss would be invisible to a reader,
 * a search engine and anyone without WebGL. The document below the canvas is the real
 * page: it is always in the DOM, hidden from sight only while the canvas is running, and
 * shown as an ordinary article when it is not.
 */
export function Book() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const canvas = section.querySelector('canvas');
      const label = section.querySelector<HTMLElement>('[data-chapter]');
      const chrome = section.querySelectorAll<HTMLElement>('[data-chrome]');
      // Reduced motion gets the article, not a book it cannot turn.
      if (!canvas || reducedMotion()) return;

      const mount = () => {
        // The section starts as `off`, which is right for no JS and no WebGL — but that
        // state also sets `display:none` on the canvas, and a display:none canvas
        // measures zero. Switch it on BEFORE building the renderer, or the book sizes
        // itself against nothing, keeps the default 300x150 backing store and never
        // draws. Back to `off` if the renderer declines, which is a driver that cannot
        // compile the shaders.
        section.dataset.canvas = 'on';
        const book: BookHandle | null = createBook(canvas);
        if (!book) { section.dataset.canvas = 'off'; return; }

        const at = { p: 0 };
        let shown = -1;
        const tl = gsap.timeline({ paused: true });
        tl.to(at, {
          p: book.turns, duration: 1, ease: EASE.none,
          onUpdate: () => {
            book.setProgress(at.p);
            const c = book.chapterAt(at.p);
            if (label && c !== shown) { shown = c; label.textContent = chapterLabels[c] ?? ''; }
          },
        });
        const st = ScrollTrigger.create({
          trigger: section, start: 'top top', end: `+=${book.turns * 110}%`,
          pin: true, scrub: 0.6, animation: tl,
          /*
           * The chapter label and the hint are positioned inside the section, and the
           * header is fixed. So the moment the pin lets go, the chrome rides up the
           * screen and prints straight through the wordmark. Take it out over the last
           * of the pin, while the section is still being held: by the time it moves,
           * there is nothing left to collide. Also right on its own terms — «bla for å
           * bla om» is the wrong thing to say on the page you stop at.
           */
          onUpdate: (self) => {
            const o = 1 - gsap.utils.clamp(0, 1, (self.progress - 0.94) / 0.06);
            for (const el of chrome) el.style.opacity = String(o);
          },
        });
        return () => {
          st.kill();
          book.destroy();
          for (const el of chrome) el.style.opacity = '';
        };
      };

      /*
       * The book is a spread, and a spread only reads at desktop widths: the page is
       * drawn on a 768px texture, so body copy set at 32px there renders at
       * `32 × pageWidth / 768` — about 10px on a 768px screen and 19px at 1440. Below
       * the spec's desktop breakpoint the section keeps `data-canvas="off"` and the
       * article underneath is the page, which is the same document at 18px.
       */
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px)', mount);

      return () => { mm.revert(); section.dataset.canvas = 'off'; };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="om-oss" className={styles.about} data-canvas="off">
      <canvas className={styles.canvas} aria-hidden="true" />
      <div className={styles.hud} data-chrome aria-hidden="true">
        <p className={styles.label}>{site.about.label}</p>
        <p className={styles.chapter} data-chapter>{chapterLabels[0]}</p>
      </div>
      <p className={styles.hint} data-chrome aria-hidden="true">{site.about.hint}</p>

      <article className={styles.readable}>
        <h1>{site.about.cover.title}</h1>
        <p>{site.about.cover.sub}</p>
        {site.about.chapters.map((ch) => (
          <section key={ch.num}>
            <h2>{ch.num}. {ch.title}</h2>
            <p>{ch.lede}</p>
            {ch.paras.map((p) => <p key={p}>{p}</p>)}
            {'team' in ch && (
              <ul className={styles.team} data-team>
                {ch.team.map((m, i) => (
                  <li key={`${m.role}-${i}`}><span>{m.name}</span><span>{m.role}</span></li>
                ))}
              </ul>
            )}
            {'figures' in ch && (
              <ul className={styles.figures}>
                {ch.figures.map((f) => (
                  <li key={f.label}><b>{f.value}</b> {f.label}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <section>
          <h2>{site.about.ask.title}</h2>
          <p>{site.about.ask.lede}</p>
          <p>{site.about.contact.para}</p>
          <a className={styles.cta} href={`mailto:${site.contact.email}`}>{site.hero.cta}</a>
        </section>
      </article>
    </section>
  );
}
