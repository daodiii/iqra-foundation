'use client';

import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import { LOGO_RATIO } from '@/components/site/Logo';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { onScroll } from '@/lib/smooth';
import styles from './hybrid.module.css';
import { castAt, clock, momentFromQuery, replayFrom, skyOver } from './oslo';

/** The name goes back to the header over this share of the screen's height of scrolling. */
const DOCK = 0.45;
const HEIGHT = 400;
/** The day's light up to now, played in this long, starting this long after the page opens. */
const REPLAY = 3600;
const REPLAY_AT = 450;
/** In the logo file's own box: the mark's baseline (the horizon runs behind it) and FOUNDATION's (the name's foot). */
const BASELINE = 0.703;
const FOOT = 0.961;
const smooth = (t: number) => {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
};

type Props = {
  /** What lies on the sky behind the name: a picture, the words, the floor. */
  ground?: ReactNode;
  /** A line under the buttons (a picture's credit). */
  note?: ReactNode;
  /** Play the day's light up to now on arrival, as 14 Lyset does. */
  replay?: boolean;
  /** The name casts the sun's (or the moon's) real dark on the floor once it has landed. */
  cast?: boolean;
  /** A fixed ground in place of the sky of the minute (the replay then moves only the cast and the clock). */
  palette?: { sky: string; floor: string; ink: 'light' | 'dark' };
  /** The reversed logo to use on a dark ground; the header's is swapped to it while the mock is up, so the two meet exactly. */
  darkLogo?: string;
  /** `side`: the copy in a column beside the name. `stack`: the name large on top, the paragraph across the width under it, the buttons at the foot. `center`: the stack on the centre line. */
  layout?: 'side' | 'stack' | 'center';
  className?: string;
};

/**
 * MOCKS 16–18, the shared part: 15 Hilsenen on 14 Lyset's sky. The hero is the colour of the sky
 * over Oslo at the minute of the visit (navy at night, crimson at the horizon, light by day), and
 * the header takes the same colour, so the two read as one ground. The name steps out of the
 * header's logo into the hero — the guide's own file, the reversed one on a dark sky — and goes
 * back into it as the visitor scrolls, landing exactly on the header's logo, which takes over. The
 * paragraph, the place and time, and the two buttons stand beside it from the first frame. Each
 * mock adds one thing (`ground`), and may replay the day and let the name cast on a floor.
 */
export function Hybrid({ ground, note, replay = false, cast = false, palette, darkLogo = '/brand/iqra-logo-on-navy.svg', layout = 'side', className }: Props) {
  const hero = useRef<HTMLElement>(null);
  const dock = useRef<HTMLSpanElement>(null);
  const greet = useRef<HTMLSpanElement>(null);
  const time = useRef<HTMLSpanElement>(null);
  const caster = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const h = hero.current;
    const d = dock.current;
    const g = greet.current;
    const c = caster.current;
    const header = document.getElementById('topp');
    if (!h || !d || !g || !header) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- the sky (now, or the replay's moment), on the hero and the header ---
    const end = momentFromQuery();
    const offset = end - Date.now();
    const from = replay && !reduced ? replayFrom(end) : end;
    let moment = from;
    const skyAt = (ms: number) => (palette ? { ...skyOver(ms), color: palette.sky, floor: palette.floor, ink: palette.ink, afterglow: false } : skyOver(ms));
    let sky = skyAt(moment);
    // The header's reversed logo, swapped for this mock's own, and given back on the way out.
    const navyLogo = header.querySelector<HTMLImageElement>('img[data-logo="navy"]');
    const navySrc = navyLogo?.getAttribute('src') ?? null;
    if (navyLogo && darkLogo !== navySrc) navyLogo.setAttribute('src', darkLogo);
    let landed = reduced;
    let away = 0;
    const castNow = () => {
      if (!c) return;
      const k = castAt(moment);
      c.style.transform = `matrix(1, 0, ${k.skew.toFixed(4)}, ${k.squash.toFixed(4)}, 0, 0)`;
      c.style.opacity = (landed ? Math.max(0.002, k.strength * 0.3 * (1 - away)) : 0.002).toFixed(3);
    };
    const paint = () => {
      h.style.setProperty('--sky', sky.color);
      h.style.setProperty('--floor', sky.floor);
      h.setAttribute('data-ink', sky.ink);
      h.toggleAttribute('data-afterglow', sky.afterglow);
      if (time.current) time.current.textContent = clock.format(moment);
      castNow();
    };
    paint();
    let onHeader = false;
    const toHeader = () => {
      const under = window.scrollY < h.offsetHeight - header.offsetHeight / 2;
      if (under) {
        header.style.setProperty('--header-ground', sky.color);
        header.toggleAttribute('data-dark', sky.ink === 'light');
        header.toggleAttribute('data-afterglow', sky.afterglow);
      } else if (onHeader) {
        header.style.removeProperty('--header-ground');
        header.removeAttribute('data-dark');
        header.removeAttribute('data-afterglow');
      }
      onHeader = under;
    };
    toHeader();

    // --- from the name's place in the hero (in the page) to the header's logo (fixed on the screen) ---
    // Either of the header's two logos: they stand in the same place, one shown.
    const home = () => [...header.querySelectorAll<HTMLElement>('img[data-logo]')].find((el) => el.getBoundingClientRect().width > 0);
    let o = { x: 0, y: 0, w: 1 };
    let to = { x: 0, y: 0, w: 1 };
    const measure = () => {
      const target = home();
      const prev = d.style.transform;
      d.style.transform = 'none';
      const r = g.getBoundingClientRect();
      d.style.transform = prev;
      const gs = getComputedStyle(g).transform;
      const m = gs && gs !== 'none' ? new DOMMatrixReadOnly(gs) : null;
      o = { x: m ? r.left - m.e : r.left, y: (m ? r.top - m.f : r.top) + window.scrollY, w: m ? r.width / m.a : r.width };
      // The horizon runs behind the mark's baseline, from the hero's top.
      const top = h.getBoundingClientRect().top + window.scrollY;
      h.style.setProperty('--horizon', `${(o.y - top + (o.w / LOGO_RATIO) * BASELINE).toFixed(1)}px`);
      if (!target) return;
      const hr = target.getBoundingClientRect();
      to = { x: hr.left, y: hr.top, w: hr.width };
    };
    measure();

    if (!reduced) {
      g.style.setProperty('--gx', `${(to.x - o.x).toFixed(2)}px`);
      g.style.setProperty('--gy', `${(to.y - (o.y - window.scrollY)).toFixed(2)}px`);
      g.style.setProperty('--gs', (to.w / o.w).toFixed(5));
    }
    const id = requestAnimationFrame(() => h.setAttribute('data-in', ''));
    // The name has landed in the hero: from now on it casts.
    const land = window.setTimeout(() => {
      landed = true;
      h.setAttribute('data-landed', '');
      castNow();
    }, 1500);

    // --- the opening: the header's watcher clears its ground on its first callback, so ours is held; and the replay ---
    let open = 0;
    let t0 = -1;
    const opening = (t: number) => {
      if (t0 < 0) t0 = t;
      const e = t - t0;
      if (from !== end && e >= REPLAY_AT) {
        moment = from + (end - from) * smooth((e - REPLAY_AT) / REPLAY);
        sky = skyAt(moment);
        paint();
      }
      toHeader();
      open = e < (replay ? REPLAY_AT + REPLAY : 1600) ? requestAnimationFrame(opening) : 0;
    };
    open = requestAnimationFrame(opening);

    let raf = 0;
    let docked = false;
    const place = () => {
      raf = 0;
      const p = smooth(window.scrollY / (window.innerHeight * DOCK));
      if (window.scrollY <= 0) {
        d.style.transform = '';
      } else {
        // On the screen, a straight way from where the name stood to the header's logo; the page scrolls under it.
        const s = 1 + (to.w / o.w - 1) * p;
        const x = (to.x - o.x) * p;
        const y = window.scrollY + (to.y - o.y) * p;
        d.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${s.toFixed(5)})`;
      }
      // What the name casts stays on the floor; it fades as the name leaves for the header.
      away = Math.min(1, p * 3);
      castNow();
      if ((p >= 1) !== docked) {
        docked = p >= 1;
        h.toggleAttribute('data-docked', docked);
      }
    };
    const onMove = () => {
      toHeader();
      if (!raf) raf = requestAnimationFrame(place);
    };
    const off = reduced ? () => {} : onScroll(onMove);
    window.addEventListener('scroll', onMove, { passive: true });
    const onResize = () => {
      measure();
      place();
    };
    window.addEventListener('resize', onResize);
    place();
    // On with the minutes: the sky changes as the sun moves.
    const tick = window.setInterval(() => {
      if (open) return;
      moment = Date.now() + offset;
      sky = skyAt(moment);
      paint();
      toHeader();
    }, 60000);
    return () => {
      cancelAnimationFrame(id);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(open);
      window.clearTimeout(land);
      window.clearInterval(tick);
      off();
      window.removeEventListener('scroll', onMove);
      window.removeEventListener('resize', onResize);
      header.style.removeProperty('--header-ground');
      header.removeAttribute('data-dark');
      header.removeAttribute('data-afterglow');
      if (navyLogo && navySrc) navyLogo.setAttribute('src', navySrc);
    };
    // The palette and the logo are fixed per mock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replay]);

  const w = Math.round(HEIGHT * LOGO_RATIO);
  return (
    <section ref={hero} className={`${styles.hero} ${className ?? ''}`} aria-labelledby="hovedtekst" data-layout={layout}>
      <div className={styles.sky} aria-hidden="true" />
      {ground}
      <h1 className={styles.mark}>
        {cast ? (
          <span ref={caster} className={styles.cast} style={{ transformOrigin: `50% ${FOOT * 100}%` }} aria-hidden="true">
            <img src="/brand/iqra-logo.svg" alt="" width={w} height={HEIGHT} decoding="async" />
          </span>
        ) : null}
        {/* The id is on the part that moves: the header watches it, and shows its own logo once this has landed on it. */}
        <span ref={dock} id="hovedtekst" className={styles.dock}>
          <span ref={greet} className={styles.greet}>
            <img className={styles.onLight} src="/brand/iqra-logo.svg" alt={site.logoAlt} width={w} height={HEIGHT} decoding="async" />
            <img className={styles.onDark} src={darkLogo} alt="" aria-hidden="true" width={w} height={HEIGHT} decoding="async" />
          </span>
        </span>
      </h1>
      <div className={styles.copy}>
        <p className={styles.lede}>{brief.home.paragraph}</p>
        <p className={styles.time}>
          {site.place} <span ref={time}>{' '}</span>
        </p>
        <p className={styles.buttons}>
          <Link href={site.cta.work.href} prefetch={false} className={styles.work}>{site.cta.work.label}</Link>
          <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
        </p>
        {note ? <div className={styles.note}>{note}</div> : null}
      </div>
    </section>
  );
}
