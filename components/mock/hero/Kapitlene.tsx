'use client';

import Link from 'next/link';
import { useEffect, useRef, type CSSProperties } from 'react';
import { MARK_ACCENTS, MARK_LETTERS } from '@/components/home/mark';
import { LOCKUP_VIEWBOX, LOCKUP_WORD } from '@/components/home/lockup';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { ChapterFilm, HOME_ORDER, useChapters } from './chapters';
import styles from './kapitlene.module.css';

const [VX, VY, VW, VH] = LOCKUP_VIEWBOX.split(' ').map(Number);
const box = (t: string) => `scale(${1 / VW} ${1 / VH}) translate(${-VX} ${-VY}) ${t}`;

/** The i's stem in the art (mark.ts: x 186.755–235.654, y 461.507–671.507 after its flip), as fractions of the lockup's box. */
const STEM = { x: (211.2045 - VX) / VW, y: (566.507 - VY) / VH, hw: 24.4495 / VW, hh: 105 / VH };
/** The film full on the screen this long, then the pull-back. */
const HOLD = 650;
const PULL = 2400;
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * MOCK 1 Kapitlene. The first screen is the film, full: the visitor is inside the i's stem. The
 * camera pulls back (one move, 2.4 s, exponential so the speed reads even) until the stem is a
 * letter and the film is in iQRa on white paper, FOUNDATION in the guide's navy under it. The film
 * never scales: the letters move over it (the window carries the inverse transform). Under the
 * lockup the four areas are the film's chapters, each playing its own shot with its bar filling;
 * a tap on one plays that shot. The paragraph and the two buttons as a band at the lockup's width.
 */
export function Kapitlene() {
  const ch = useChapters(HOME_ORDER, 150);
  const hero = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = hero.current;
    const s = stage.current;
    if (!h || !s) return;
    const place = () => {
      const sw = s.offsetWidth;
      const sh = s.offsetHeight;
      const sx = s.offsetLeft;
      const sy = s.offsetTop;
      const W = h.clientWidth;
      const H = h.clientHeight;
      h.style.setProperty('--fx', `${-sx}px`);
      h.style.setProperty('--fy', `${-sy}px`);
      h.style.setProperty('--fw', `${W}px`);
      h.style.setProperty('--fh', `${H}px`);
      const px = sx + STEM.x * sw;
      const py = sy + STEM.y * sh;
      h.style.setProperty('--ox', `${px}px`);
      h.style.setProperty('--oy', `${py}px`);
      return Math.max(Math.max(px, W - px) / (STEM.hw * sw), Math.max(py, H - py) / (STEM.hh * sh)) * 1.04;
    };
    const max = place();
    const onResize = () => place();
    window.addEventListener('resize', onResize);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      h.removeAttribute('data-pre');
      h.setAttribute('data-band', '');
      return () => window.removeEventListener('resize', onResize);
    }
    h.style.setProperty('--s', String(max));
    h.removeAttribute('data-pre');
    let raf = 0;
    const t0 = performance.now() + HOLD;
    const frame = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - t0) / PULL));
      const e = inOut(t);
      h.style.setProperty('--s', (max ** (1 - e)).toFixed(4));
      if (e > 0.96) h.setAttribute('data-band', '');
      if (t < 1) raf = requestAnimationFrame(frame);
      else h.setAttribute('data-done', '');
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section ref={hero} className={styles.hero} aria-labelledby="hovedtekst" data-pre="">
      <div className={styles.group}>
        <div ref={stage} className={styles.stage}>
          <div className={styles.window} style={{ clipPath: 'url(#k-letters)' }}>
            <ChapterFilm chapters={HOME_ORDER} active={ch.active} video={ch.video} className={styles.film} />
          </div>
          <h1 id="hovedtekst" className={styles.mark}>
            <svg viewBox={LOCKUP_VIEWBOX} role="img" aria-label={site.logoAlt}>
              <defs>
                <clipPath id="k-letters" clipPathUnits="objectBoundingBox">
                  {MARK_LETTERS.map((p, k) => (
                    <path key={k} transform={box(p.transform)} d={p.d} />
                  ))}
                </clipPath>
              </defs>
              {LOCKUP_WORD.map((p, k) => (
                <path key={k} className={styles.word} transform={p.transform} d={p.d} />
              ))}
              {MARK_ACCENTS.map((p, i) => (
                <path key={i} className={styles.accent} transform={p.transform} d={p.d} />
              ))}
            </svg>
          </h1>
        </div>
        <div className={styles.band}>
          <ul className={styles.chapters} aria-label="Fire områder">
            {HOME_ORDER.map((c, i) => (
              <li key={c.key} style={{ '--i': i } as CSSProperties}>
                <button type="button" className={styles.chapter} aria-pressed={i === ch.active} onClick={() => ch.choose(i)}>
                  <span className={styles.track}>
                    <span ref={ch.bar(i)} className={styles.fill} />
                  </span>
                  <span className={styles.name}>{c.name}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.copy}>
            <p className={styles.lede}>{brief.home.paragraph}</p>
            <p className={styles.buttons}>
              <Link href={site.cta.work.href} prefetch={false} className={styles.work}>{site.cta.work.label}</Link>
              <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
