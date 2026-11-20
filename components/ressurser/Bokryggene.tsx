'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Lines } from '@/components/forside/Lines';
import { reducedMotion } from '@/components/forside/frame';
import { Morph } from '@/components/site/Morph';
import { morphName } from '@/components/site/TitleLink';
import f from '@/components/forside/forside.module.css';
import styles from './bokryggene.module.css';

export type Book = {
  key: string;
  title: string;
  text: string | null;
  /** What is published in the category, or the empty line: built on the server (page.tsx). */
  body: ReactNode;
};

/** Each book's cloth, in the categories' order (the mock's): navy, teal, crimson, and pale teal with navy letters. */
const CLOTH: Record<string, string>[] = [
  { '--bc': 'var(--navy)' },
  { '--bc': 'var(--teal)' },
  { '--bc': 'var(--rod)' },
  { '--bc': 'var(--teal-pale)', '--bf': 'var(--navy)', '--bl': 'rgba(27,42,74,.2)' },
];

const PHONE = 900;

/**
 * Ressurser as 19 «Bokryggene» (the owner's pick, 2026-11-20): the title on navy, then the four
 * categories standing like books on a shelf, their titles up the spines. Choosing one pulls it
 * out: it widens and opens, the others stand back. The books rise into place when the shelf is
 * reached. On a phone the books lie as stacked bands, and the chosen one opens downward.
 *
 * A book is its category's section (`#<key>`), so an address with the anchor (`/ressurser#styringsdokumenter`,
 * where the old Styringsdokumenter page sends) opens that book. The spine is the category's heading
 * and its button. An open book is as tall as the shelf, or taller when what it holds needs more
 * room: nothing in it is shrunk or cut.
 */
export function Bokryggene({ title, intro, books }: { title: string; intro: string; books: Book[] }) {
  const [open, setOpen] = useState(0);
  const [on, setOn] = useState(false);
  const [pre, setPre] = useState(true);
  const shelf = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  // The title glides in and the intro fades up once the page stands.
  useEffect(() => {
    let b = 0;
    const a = requestAnimationFrame(() => (b = requestAnimationFrame(() => setOn(true))));
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, []);

  // Arriving at a book's anchor opens it, now and whenever the anchor changes.
  useEffect(() => {
    const go = () => {
      const i = books.findIndex((b) => `#${b.key}` === window.location.hash);
      if (i >= 0) setOpen(i);
    };
    go();
    window.addEventListener('hashchange', go);
    return () => window.removeEventListener('hashchange', go);
  }, [books]);

  // The books rise into place when a quarter of the shelf is on screen (at once without motion).
  useEffect(() => {
    const el = wrap.current;
    if (!el || reducedMotion() || typeof IntersectionObserver === 'undefined') {
      setPre(false);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPre(false);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Size the shelf: the open cover's width (the shelf less three spines), and the heights that hold what is in a book.
  useLayoutEffect(() => {
    const el = shelf.current;
    if (!el) return;
    const size = () => {
      const all = Array.from(el.children) as HTMLElement[];
      const need = (book: HTMLElement) => {
        const cv = book.querySelector<HTMLElement>('[data-cover]');
        const fit = cv?.firstElementChild as HTMLElement | null;
        if (!cv || !fit) return 0;
        const cs = getComputedStyle(cv);
        let h = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        for (const c of Array.from(fit.children) as HTMLElement[]) h += c.offsetHeight + parseFloat(getComputedStyle(c).marginTop);
        return Math.ceil(h);
      };
      if (window.innerWidth > PHONE) {
        const sw = Math.min(128, Math.max(74, window.innerWidth * 0.08));
        const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
        el.style.setProperty('--ow', `${el.clientWidth - (all.length - 1) * (sw + gap)}px`);
        const book = all[open];
        el.style.setProperty('--sh', book ? `${need(book)}px` : '0px');
      } else {
        el.style.removeProperty('--sh');
        const base = Math.min(window.innerHeight * 0.7, 520);
        all.forEach((book) => book.style.setProperty('--oh', `${Math.max(base, need(book))}px`));
      }
    };
    size();
    let w = window.innerWidth;
    let h = window.innerHeight;
    const again = () => {
      // A phone's address bar changes only the height by a little: keep the bands still for that.
      if (window.innerWidth === w && Math.abs(window.innerHeight - h) < 120) return;
      w = window.innerWidth;
      h = window.innerHeight;
      size();
    };
    window.addEventListener('resize', again);
    document.fonts?.ready.then(size);
    return () => window.removeEventListener('resize', again);
  }, [open]);

  return (
    <>
      <section className={`${styles.hero} ${f.pad}`} data-on={on ? '' : undefined}>
        <Morph name={morphName('/ressurser')}>
          <Lines as="h1" className={styles.h1} text={title} on={on} />
        </Morph>
        <p className={styles.intro}>{intro}</p>
      </section>
      <div ref={wrap} className={styles.wrap} data-pre={pre ? '' : undefined}>
        <div ref={shelf} className={styles.shelf}>
          {books.map((b, i) => {
            const isOpen = i === open;
            return (
              <section
                key={b.key}
                id={b.key}
                className={styles.book}
                data-open={isOpen ? '' : undefined}
                style={{ ...CLOTH[i % CLOTH.length], '--i': i } as CSSProperties}
                aria-labelledby={`${b.key}-tittel`}
              >
                <h2 className={styles.spine} id={`${b.key}-tittel`}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`${b.key}-innhold`}
                    tabIndex={isOpen ? -1 : 0}
                    onClick={() => setOpen(i)}
                  >
                    <span>{b.title}</span>
                  </button>
                </h2>
                <div className={styles.cover} id={`${b.key}-innhold`} data-cover inert={!isOpen}>
                  <div className={styles.fit}>
                    <div>
                      <p className={styles.title} aria-hidden="true">
                        {b.title}
                      </p>
                      {b.text && <p className={styles.tx}>{b.text}</p>}
                    </div>
                    <div className={styles.foot}>{b.body}</div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
