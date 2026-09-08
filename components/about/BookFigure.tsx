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
      // Reduced motion gets the article, not a book it cannot turn.
      if (!canvas || reducedMotion()) return;

      // A phone is too narrow for a spread, so below 768px the book shows one page and
      // the sheet turns off it. That is a different scene, not a smaller one, so it is
      // rebuilt at the breakpoint rather than restyled.
      const mount = (single: boolean) => () => {
        // The section starts as `off`, which is right for no JS and no WebGL — but that
        // state also sets `display:none` on the canvas, and a display:none canvas
        // measures zero. Switch it on BEFORE building the renderer, or the book sizes
        // itself against nothing, keeps the default 300x150 backing store and never
        // draws. Back to `off` if the renderer declines, which is a driver that cannot
        // compile the shaders.
        section.dataset.canvas = 'on';
        const book: BookHandle | null = createBook(canvas, { single });
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
        });
        return () => { st.kill(); book.destroy(); };
      };

      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', mount(false));
      mm.add('(max-width: 767px)', mount(true));

      return () => { mm.revert(); section.dataset.canvas = 'off'; };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="om-oss" className={styles.about} data-canvas="off">
      <canvas className={styles.canvas} aria-hidden="true" />
      <div className={styles.hud} aria-hidden="true">
        <p className={styles.label}>{site.about.label}</p>
        <p className={styles.chapter} data-chapter>{chapterLabels[0]}</p>
      </div>
      <p className={styles.hint} aria-hidden="true">{site.about.hint}</p>

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
