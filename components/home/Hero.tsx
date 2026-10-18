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

/** On a phone the name goes into the header by itself over this long, once the page is scrolled this share of a screen (and back out above the second line). */
const GLIDE_MS = 420;
const TOUCH_IN = 0.1;
const TOUCH_OUT = 0.04;

/** The greeting's delay and length (hero.module.css) with a little to spare. */
const GREETING_MS = 200 + 1500 + 100;
/** How long a greeting cut short by a scroll takes to finish, if the visitor comes back to the top. */
const GIVE_WAY_MS = 500;
/** When the greeting began on the page's clock; null until the hero has mounted. No greeting (reduced motion): long past. */
let greetingBegan: number | null = null;

/**
 * When the hero's opening has played out, on the page's clock (`performance.now()`): the name
 * has stepped out of the header and landed by then. Heavy work that can wait — the sea's water
 * being built — waits for it, so it does not stall the greeting. It counts from the greeting's
 * own start once the hero has mounted; before that, from the first paint.
 */
export const openingEnd = () =>
  greetingBegan !== null
    ? greetingBegan + GREETING_MS
    : (performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? performance.now()) + 2000;

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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      greetingBegan = -GREETING_MS;
      return;
    }

    // From the name's place in the hero (in the page, unscrolled) to the header's logo (fixed on the screen).
    // Either of the header's two logos: they stand in the same place, one shown.
    const home = () => [...header.querySelectorAll<HTMLElement>('img[data-logo]')].find((el) => el.getBoundingClientRect().width > 0);
    let o = { x: 0, y: 0, w: 1 };
    let heroHeight = 0;
    // The screen's height as the path is laid out: not read again in a scroll frame, because a phone's
    // address bar folds away as the page scrolls and `innerHeight` grows with it, which moved the name's
    // progress under the visitor's finger (it stopped, went back, then went on).
    let vh = window.innerHeight;
    let vw = window.innerWidth;
    let to = { x: 0, y: 0, w: 1 };
    const measure = () => {
      vh = window.innerHeight;
      vw = window.innerWidth;
      heroHeight = h.offsetHeight;
      // The name's place in the flow, not where it flies: read it with the fixed positioning off.
      const flew = h.hasAttribute('data-fly');
      if (flew) h.removeAttribute('data-fly');
      const prev = d.style.transform;
      d.style.transform = 'none';
      const r = g.getBoundingClientRect();
      d.style.transform = prev;
      if (flew) h.setAttribute('data-fly', '');
      // The greeting may still be playing: read the name's box without it.
      const gs = getComputedStyle(g).transform;
      const m = gs && gs !== 'none' ? new DOMMatrixReadOnly(gs) : null;
      o = { x: m ? r.left - m.e : r.left, y: (m ? r.top - m.f : r.top) + window.scrollY, w: m ? r.width / m.a : r.width };
      // The name leaves the flow once the page scrolls (`data-fly`): its box keeps the heading's height.
      h.style.setProperty('--fly-w', `${o.w.toFixed(2)}px`);
      h.style.setProperty('--fly-h', `${(m ? r.height / m.d : r.height).toFixed(2)}px`);
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
    const id = requestAnimationFrame(() => {
      greetingBegan = performance.now();
      h.setAttribute('data-in', '');
      // From here the header's logo is this script's to show and hide (site.module.css, `data-handoff`).
      header.setAttribute('data-handoff', '');
    });

    let docked = false;
    let flying = false;
    let raf = 0;
    // The share of the way to the header the greeting had left when a scroll cut it short, and how it gives way.
    let carry = 0;
    let carryFrom = 0;
    let carryAt = 0;
    let seized = false;
    const seize = () => {
      seized = true;
      const running = g.getAnimations();
      if (!running.length || !h.hasAttribute('data-in')) return;
      // The greeting and the scroll's path were two moves added together, and the sum went past the header
      // and back. Take over where the greeting stands (`carry`: its share of the way to the header) and
      // go on from there.
      const grow = to.w / o.w - 1;
      const m = new DOMMatrixReadOnly(getComputedStyle(g).transform);
      const left = Math.abs(grow) > 0.01 ? (m.a - 1) / grow : to.x - o.x ? m.e / (to.x - o.x) : 0;
      running.forEach((a) => a.cancel());
      carryFrom = carry = Math.min(1, Math.max(0, left));
      carryAt = performance.now();
    };
    const place = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      const y = window.scrollY;
      // Docked and far below: nothing on it moves any more.
      if (docked && carry <= 0 && y > heroHeight * 1.2) return;
      if (y > 0 && !seized) seize();
      const p0 = smooth(y / (vh * DOCK));
      if (carry > 0) {
        const now = performance.now();
        if (p0 > 0) {
          // Scrolling: hold where the greeting stood and go on from there, straight for the header.
          carryFrom = carry;
          carryAt = now;
        } else {
          // Back at the top: the greeting carries on to its place.
          const t = (now - carryAt) / GIVE_WAY_MS;
          carry = t >= 1 ? 0 : carryFrom * (1 - smooth(t));
          if (carry > 0) raf = requestAnimationFrame(place);
        }
      }
      const p = carry + (1 - carry) * p0;
      // The name is fixed to the screen from the first frame, standing where it stands in the flow. Switching it
      // over at the first scroll let a phone, which scrolls the page itself before this script hears of it, move
      // the name up with the page for a frame or two and then snap it back to its place: the stutter.
      if (!flying) {
        flying = true;
        h.setAttribute('data-fly', '');
      }
      // On the screen, a straight way from where the name stood to the header's logo; the page scrolls under it.
      // Fixed to the screen, not cancelling the scroll by hand: a counter-translation by `scrollY` is a frame
      // behind the page whenever the glide (or a phone's own scrolling) moves it ahead of this script.
      const s = 1 + (to.w / o.w - 1) * p;
      d.style.transform = `translate3d(${(o.x + (to.x - o.x) * p).toFixed(2)}px, ${(o.y + (to.y - o.y) * p).toFixed(2)}px, 0) scale(${s.toFixed(5)})`;
      pic.style.transform = y > 0 ? `translate3d(0, ${(Math.min(y, vh * 1.2) * DEPTH).toFixed(1)}px, 0)` : '';
      // Landed: the header's own logo has faded in over it; this one steps aside.
      // Both in this one call, so one frame shows the one logo or the other, never both and never neither: an
      // observer and two fades did it before, and on a phone they drifted apart just before the header.
      if ((p >= 1) !== docked) {
        docked = p >= 1;
        h.toggleAttribute('data-docked', docked);
        header.toggleAttribute('data-landed', docked);
      }
    };
    // A phone scrolls the page on its own thread and tells this script afterwards, so a path laid by the scroll is
    // always a few frames behind it, most of all at the end, where the name is small and has to land exactly on
    // the header's logo (the owner's Samsung S22, 2026-10-18: it lags just before the navbar). There the scroll only
    // starts the move: a little way down the page the name goes into the header by itself on a timed transition,
    // which the browser runs off the main thread, and it comes back out when the visitor is at the top again.
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
      const at = (q: number) =>
        `translate3d(${(o.x + (to.x - o.x) * q).toFixed(2)}px, ${(o.y + (to.y - o.y) * q).toFixed(2)}px, 0) scale(${(1 + (to.w / o.w - 1) * q).toFixed(5)})`;
      let target = false;
      let timer = 0;
      const land = (v: boolean) => {
        if (v === docked) return;
        docked = v;
        h.toggleAttribute('data-docked', v);
        header.toggleAttribute('data-landed', v);
      };
      const set = (instant: boolean) => {
        clearTimeout(timer);
        const q = target ? 1 : 0;
        if (instant) {
          d.style.transition = 'none';
          d.style.transform = at(q);
          land(target);
          return;
        }
        // On its way back out the header's logo gives way at once; the name is on top of it, and the same picture.
        if (!target) land(false);
        // Cut short mid-greeting: go on from where the greeting stands.
        if (!seized) seize();
        if (carry > 0) {
          d.style.transition = 'none';
          d.style.transform = at(carry);
          void d.offsetWidth;
          carry = 0;
        }
        d.style.transition = `transform ${GLIDE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        d.style.transform = at(q);
        if (target) timer = window.setTimeout(() => target && land(true), GLIDE_MS + 40);
      };
      const onEnd = (e: TransitionEvent) => {
        if (e.target === d && e.propertyName === 'transform' && target) {
          clearTimeout(timer);
          land(true);
        }
      };
      d.addEventListener('transitionend', onEnd);
      const touchPlace = (instant = false) => {
        const y = window.scrollY;
        pic.style.transform = y > 0 ? `translate3d(0, ${(Math.min(y, vh * 1.2) * DEPTH).toFixed(1)}px, 0)` : '';
        // Two lines, so a finger resting between them does not make the name go in and out.
        const want = target ? y > vh * TOUCH_OUT : y > vh * TOUCH_IN;
        if (want === target && !instant) return;
        target = want;
        set(instant);
      };
      const onTouchScroll = () => touchPlace();
      window.addEventListener('scroll', onTouchScroll, { passive: true });
      const remeasure = () => {
        measure();
        d.style.transition = 'none';
        d.style.transform = at(target ? 1 : 0);
      };
      const onTouchResize = () => {
        if (window.innerWidth !== vw) remeasure();
      };
      window.addEventListener('resize', onTouchResize);
      const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(remeasure);
      ro?.observe(h);
      h.setAttribute('data-fly', '');
      d.style.transform = at(0);
      touchPlace(true);
      return () => {
        clearTimeout(timer);
        cancelAnimationFrame(id);
        window.removeEventListener('scroll', onTouchScroll);
        window.removeEventListener('resize', onTouchResize);
        d.removeEventListener('transitionend', onEnd);
        ro?.disconnect();
        header.removeAttribute('data-handoff');
        header.removeAttribute('data-landed');
      };
    }
    // At once, not in a frame of its own: the glide tells us inside the frame it moved the page, before it is painted.
    const onMove = place;
    const off = onScroll(onMove);
    window.addEventListener('scroll', onMove, { passive: true });
    const remeasure = () => {
      measure();
      place();
    };
    const onResize = () => {
      // Only the height changed: a phone's address bar folding away. Nothing here has moved.
      if (window.innerWidth === vw) return;
      remeasure();
    };
    window.addEventListener('resize', onResize);
    // The flow can still move after the first measure (a font arriving reflows the copy under the name): the
    // name is fixed now, so it has to be told.
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(remeasure);
    ro?.observe(h);
    place();
    return () => {
      header.removeAttribute('data-handoff');
      header.removeAttribute('data-landed');
      ro?.disconnect();
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
