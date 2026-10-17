'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { LOGO_ON_NAVY_CRIMSON, LOGO_RATIO } from '@/components/site/Logo';
import { onScroll } from '@/lib/smooth';
import styles from './hero.module.css';

/** The name goes back into the header over this share of the screen's height of scrolling. */
const DOCK = 0.45;
/** The picture lags the page by this much as the hero scrolls away. */
const DEPTH = 0.35;
/** The logo's intrinsic height for its width and height attributes; the stylesheet sizes it. */
const HEIGHT = 400;
/** A phone's crop of the picture (public/hero/staden-phone.webp): the middle of the 1920 file, its full height. */
const PHONE_CROP = { width: 720, height: 1072 };

const smooth = (t: number) => {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
};

/**
 * When the hero's opening has played out, on the page's clock (`performance.now()`): the name
 * has stepped out of the header and landed by 1.9 s after the first paint (its greeting is 200ms
 * late and 1500ms long, hero.module.css). Heavy work that can wait — the sea's water being built —
 * waits for it, so it does not stall the greeting.
 */
export const openingEnd = () => (performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? performance.now()) + 2000;

/**
 * The hero (mock 25 Staden, midtstilt, chosen by the owner 2026-10-17: «25 … That was the one I
 * was happy with … take away the time … And then we can do it»).
 *
 * One navy ground, the darker of the guide's two («just have the darkest of the two»), with the
 * header on it; on it, so faint it is felt more than seen, the owner's own picture of a city of
 * domes, arcades and a crowded court, as pale-blue ink (public/hero/staden-*.webp: the picture's
 * dark as the ink's strength, baked in; a CSS mask did the same and cost frames). The guide's
 * logo, reversed with the crimson accents, is the heading, centred and as large as the first
 * screen allows; under it, centred, the brief's paragraph and its two buttons.
 *
 * The name comes out to meet the visitor: the page opens with the logo where it always is, small in
 * the header, and it steps out of the header, growing as it comes, into the hero. Scrolled on, it
 * goes back the way it came, straight across the screen into the header's logo — the same file —
 * and the header's own logo takes over (HeaderMotion watches `#hovedtekst`, which is the part that
 * moves). The picture settles from a little larger as the name arrives and lags the page on the way
 * down. Under reduced motion, or without JavaScript, the name stands in the hero from the start and
 * nothing moves.
 */
export function Hero() {
  const hero = useRef<HTMLElement>(null);
  const dock = useRef<HTMLSpanElement>(null);
  const greet = useRef<HTMLSpanElement>(null);
  const picture = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = hero.current;
    const d = dock.current;
    const g = greet.current;
    const pic = picture.current;
    const header = document.getElementById('topp');
    if (!h || !d || !g || !pic || !header) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // From the name's place in the hero (in the page, unscrolled) to the header's logo (fixed on the screen).
    // Either of the header's two logos: they stand in the same place, one shown.
    const home = () => [...header.querySelectorAll<HTMLElement>('img[data-logo]')].find((el) => el.getBoundingClientRect().width > 0);
    let o = { x: 0, y: 0, w: 1 };
    let to = { x: 0, y: 0, w: 1 };
    const measure = () => {
      const prev = d.style.transform;
      d.style.transform = 'none';
      const r = g.getBoundingClientRect();
      d.style.transform = prev;
      // The greeting may still be playing: read the name's box without it.
      const gs = getComputedStyle(g).transform;
      const m = gs && gs !== 'none' ? new DOMMatrixReadOnly(gs) : null;
      o = { x: m ? r.left - m.e : r.left, y: (m ? r.top - m.f : r.top) + window.scrollY, w: m ? r.width / m.a : r.width };
      const target = home();
      if (!target) return;
      // Against the header, not the screen: the header is fixed at the top left and only ever moves by
      // its own transform, and coming back to the home page from a page read to its foot it is still
      // sliding back in (`data-away`), so the screen put the logo 57px above the top for good.
      const hr = target.getBoundingClientRect();
      const hb = header.getBoundingClientRect();
      to = { x: hr.left - hb.left, y: hr.top - hb.top, w: hr.width };
    };
    measure();

    // The greeting: out of the header's logo, into the hero. Unless the name is already standing there:
    // a phone that took longer than the stylesheet's 1.5 s to run this has shown it in place
    // (`appear`, which sets `--shown`), and set off from the header now it would jump back into it and
    // come out again.
    if (getComputedStyle(g).getPropertyValue('--shown').trim() !== '1') {
      g.style.setProperty('--gx', `${(to.x - o.x).toFixed(2)}px`);
      g.style.setProperty('--gy', `${(to.y - (o.y - window.scrollY)).toFixed(2)}px`);
      g.style.setProperty('--gs', (to.w / o.w).toFixed(5));
    }
    const id = requestAnimationFrame(() => h.setAttribute('data-in', ''));

    let raf = 0;
    let docked = false;
    const place = () => {
      raf = 0;
      const y = window.scrollY;
      const p = smooth(y / (window.innerHeight * DOCK));
      if (y <= 0) {
        d.style.transform = '';
        pic.style.transform = '';
      } else {
        // On the screen, a straight way from where the name stood to the header's logo; the page scrolls under it.
        const s = 1 + (to.w / o.w - 1) * p;
        d.style.transform = `translate3d(${((to.x - o.x) * p).toFixed(2)}px, ${(y + (to.y - o.y) * p).toFixed(2)}px, 0) scale(${s.toFixed(5)})`;
        pic.style.transform = `translate3d(0, ${(Math.min(y, window.innerHeight * 1.2) * DEPTH).toFixed(1)}px, 0)`;
      }
      // Landed: the header's own logo has faded in over it; this one steps aside.
      if ((p >= 1) !== docked) {
        docked = p >= 1;
        h.toggleAttribute('data-docked', docked);
      }
    };
    const onMove = () => {
      if (!raf) raf = requestAnimationFrame(place);
    };
    const off = onScroll(onMove);
    window.addEventListener('scroll', onMove, { passive: true });
    const onResize = () => {
      measure();
      place();
    };
    window.addEventListener('resize', onResize);
    place();
    return () => {
      cancelAnimationFrame(id);
      cancelAnimationFrame(raf);
      off();
      window.removeEventListener('scroll', onMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section ref={hero} className={styles.hero} aria-labelledby="hovedtekst" data-header="dark" data-hero>
      <div ref={picture} className={styles.picture} aria-hidden="true">
        {/* A phone shows the middle of the picture at its full height (cover, on a tall screen): its own crop of
            it, not the whole 1920 file a 3× screen picked by width (759 KB for a ground at 17%). */}
        <picture>
          <source media="(max-width: 767px)" srcSet="/hero/staden-phone.webp" width={PHONE_CROP.width} height={PHONE_CROP.height} />
          <img
            className={styles.ink}
            src="/hero/staden-960.webp"
            srcSet="/hero/staden-960.webp 960w, /hero/staden-1920.webp 1920w"
            sizes="100vw"
            alt=""
            width={1920}
            height={1072}
            decoding="async"
            data-picture
          />
        </picture>
      </div>
      <h1 className={styles.mark}>
        {/* The id is on the part that moves: the header watches it, and shows its own logo once this has landed on it. */}
        <span ref={dock} id="hovedtekst" className={styles.dock}>
          <span ref={greet} className={styles.greet}>
            <img src={LOGO_ON_NAVY_CRIMSON} alt={site.logoAlt} width={Math.round(HEIGHT * LOGO_RATIO)} height={HEIGHT} decoding="async" fetchPriority="high" />
          </span>
        </span>
      </h1>
      <div className={styles.copy}>
        <p className={styles.lede}>{brief.home.paragraph}</p>
        <p className={styles.buttons}>
          <Link href={site.cta.work.href} prefetch={false} className={styles.work}>{site.cta.work.label}</Link>
          <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
        </p>
      </div>
    </section>
  );
}
