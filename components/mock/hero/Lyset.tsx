'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { LOCKUP_VIEWBOX, LOCKUP_WORD } from '@/components/home/lockup';
import { MARK_ACCENTS, MARK_LETTERS } from '@/components/home/mark';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { css, lastCrossing, luminance, mix, moonAt, NAVY_DEEPEST, skyAt, sunAt, type Rgb } from './himmel';
import styles from './lyset.module.css';

const DEG = 180 / Math.PI;
/** How flat the floor is seen: a metre towards the viewer is this much of a metre up the screen. */
const FLAT = 0.3;
/** The longest cast drawn, in the name's heights (the sun a little over 8° up). */
const LONGEST = 7;
/** The day's light up to this minute, played in this long on arrival. */
const REPLAY = 3600;

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
/** Eased in and out, so the first light and the last minutes are each given their time. */
const easeInOut = (t: number) => {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
};
const clock = new Intl.DateTimeFormat('nb-NO', { timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit' });

/** The floor is the sky a step darker: a small step by day, a deeper one where the sun meets the horizon and at night. */
const floorOf = (sky: Rgb, deg: number) => mix(sky, NAVY_DEEPEST, 0.1 + 0.32 * Math.max(0, 1 - Math.abs(deg) / 7) + 0.45 * clamp(-deg / 10));

/** The light at a moment: the sky, the floor, and what the name casts on it (by the sun, or by the moon at night). */
function lightAt(ms: number) {
  const sun = sunAt(ms);
  const deg = sun.alt * DEG;
  const sky = skyAt(deg);
  const floor = floorOf(sky, deg);
  let source = sun;
  let strength = clamp((deg + 0.5) / 4) * 0.24;
  if (deg < -1) {
    const moon = moonAt(ms);
    const m = moon.lit * clamp((moon.alt * DEG) / 4) * clamp((-deg - 4) / 6) * 0.5;
    if (m > strength) {
      source = moon;
      strength = m;
    }
  }
  // The cast's run along the floor (in the name's heights) and its direction: away from the light.
  const run = Math.min(LONGEST, 1 / Math.tan(Math.max(source.alt, 0.5 / DEG)));
  const right = -Math.sin(source.az);
  const toward = Math.cos(source.az);
  return { deg, sky, floor, strength, skew: -run * right, squash: -run * toward * FLAT };
}

/** «HH:MM» for today in Oslo, or a full date, from `?t=`; otherwise now. */
function momentFromQuery(): number {
  const q = new URLSearchParams(window.location.search).get('t');
  const now = Date.now();
  if (!q) return now;
  const hm = /^(\d{1,2}):(\d{2})$/.exec(q);
  if (hm) {
    const [h, m] = clock.format(now).split(':').map(Number);
    return now + ((Number(hm[1]) * 60 + Number(hm[2])) - (h * 60 + m)) * 60000;
  }
  const t = Date.parse(q);
  return Number.isNaN(t) ? now : t;
}

/**
 * Where the replay starts: by day at this morning's first light (the sun 10° under the horizon, the
 * sky still the navy the page opens on), at night at last night's sunset, and at dusk or dawn an
 * hour and a quarter back.
 */
function replayFrom(ms: number): number {
  const deg = sunAt(ms).alt * DEG;
  if (deg > 2) return lastCrossing(ms, -10, true) ?? lastCrossing(ms, -0.8, true) ?? ms - 3 * 3600000;
  if (deg < -1) return lastCrossing(ms, -0.8, false) ?? ms - 3 * 3600000;
  return ms - 75 * 60000;
}

/**
 * MOCK 14 Lyset. The name standing in Oslo's light, as it is at the minute of the visit. The hero
 * is a view: a flat field of sky over a floor, in the guide's colours, and the lockup standing on
 * the floor like a monument in a square. The sky is the colour of the sky over Oslo now — the
 * navy at night, the crimson where the sun meets the horizon, the light by day — and the name
 * casts the real dark of this moment: the sun's, from where the sun stands over Oslo (its
 * height sets the length, its bearing the direction), or at night the moon's, as strong as the
 * moon is full and only while it is up. On arrival the day plays up to now in under four seconds —
 * from this morning's sunrise, or from last night's sunset — the cast swinging round and the
 * clock beside the buttons running with it, and settles on the present. It moves on by itself
 * with the minutes. `?t=14:30` (or a full date) shows another moment.
 */
export function Lyset() {
  const hero = useRef<HTMLElement>(null);

  useEffect(() => {
    const h = hero.current;
    if (!h) return;
    const sky = h.querySelector<HTMLElement>('[data-sky]');
    const floor = h.querySelector<HTMLElement>('[data-floor]');
    const cast = h.querySelector<HTMLElement>('[data-cast]');
    const time = h.querySelector<HTMLElement>('[data-time]');
    const header = document.getElementById('topp');
    if (!sky || !floor || !cast || !time) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let skyInk = '';
    let floorInk = '';
    let afterglow = false;
    let headerGround = '';
    let headerDark = false;
    // The header reads as part of the sky while the hero is under it.
    let onHeader = false;
    const toHeader = () => {
      if (!header) return;
      const under = window.scrollY < h.offsetHeight - header.offsetHeight / 2;
      if (under) {
        header.style.setProperty('--header-ground', headerGround);
        header.toggleAttribute('data-dark', headerDark);
      } else if (onHeader) {
        header.style.removeProperty('--header-ground');
        header.removeAttribute('data-dark');
      }
      onHeader = under;
    };
    // Light ink on a dark ground and dark ink on a light one, with a little hysteresis so a ground at the boundary does not flicker.
    const inkFor = (c: Rgb, was: string) => {
      const l = luminance(c);
      if (was === 'light') return l > 0.34 ? 'dark' : 'light';
      if (was === 'dark') return l < 0.26 ? 'light' : 'dark';
      return l > 0.3 ? 'dark' : 'light';
    };
    const show = (ms: number) => {
      const l = lightAt(ms);
      sky.style.backgroundColor = css(l.sky);
      floor.style.backgroundColor = css(l.floor);
      cast.style.transform = `matrix(1, 0, ${l.skew.toFixed(4)}, ${l.squash.toFixed(4)}, 0, 0)`;
      cast.style.opacity = Math.max(0.002, l.strength).toFixed(3);
      time.textContent = clock.format(ms);
      const si = inkFor(l.sky, skyInk);
      const fi = inkFor(l.floor, floorInk);
      if (si !== skyInk) h.setAttribute('data-sky-ink', (skyInk = si));
      if (fi !== floorInk) h.setAttribute('data-floor-ink', (floorInk = fi));
      // Where the sky is the crimson, the accents take the guide's turquoise, as its logo on crimson does.
      const glow = l.deg > -4.5 && l.deg < 3.5;
      if (glow !== afterglow) h.toggleAttribute('data-afterglow', (afterglow = glow));
      headerGround = css(l.sky);
      headerDark = si === 'light';
      toHeader();
    };

    let end = momentFromQuery();
    const offset = end - Date.now();
    const start = reduced ? end : replayFrom(end);
    // The page opens on the navy; the replay's first light is faded in from it, then played out.
    h.setAttribute('data-live', '');
    show(start);

    let raf = 0;
    let t0 = -1;
    const frame = (t: number) => {
      if (t0 < 0) {
        t0 = t;
        h.setAttribute('data-run', '');
      }
      const p = easeInOut((t - t0) / REPLAY);
      show(start + (end - start) * p);
      raf = p < 1 ? requestAnimationFrame(frame) : 0;
    };
    const go = window.setTimeout(() => (raf = requestAnimationFrame(frame)), reduced ? 0 : 450);
    // On with the minutes: the cast creeps as the sun does.
    const tick = window.setInterval(() => {
      if (raf) return;
      end = Date.now() + offset;
      show(end);
    }, 30000);
    window.addEventListener('scroll', toHeader, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(go);
      window.clearInterval(tick);
      window.removeEventListener('scroll', toHeader);
      header?.style.removeProperty('--header-ground');
      header?.removeAttribute('data-dark');
    };
  }, []);

  return (
    <section ref={hero} className={styles.hero} aria-labelledby="hovedtekst">
      <div className={styles.sky} data-sky aria-hidden="true" />
      <div className={styles.stage}>
        <div className={styles.floor} data-floor aria-hidden="true">
          <div className={styles.cast} data-cast>
            <svg viewBox={LOCKUP_VIEWBOX}>
              <filter id="lyset-soft" x="-5%" y="-5%" width="110%" height="110%">
                <feGaussianBlur stdDeviation="1.4" />
              </filter>
              <g filter="url(#lyset-soft)">
                {[...MARK_LETTERS, ...MARK_ACCENTS, ...LOCKUP_WORD].map((p, k) => (
                  <path key={k} transform={p.transform} d={p.d} />
                ))}
              </g>
            </svg>
          </div>
        </div>
        <h1 id="hovedtekst" className={styles.mark}>
          <svg viewBox={LOCKUP_VIEWBOX} role="img" aria-label={site.logoAlt}>
            {MARK_LETTERS.map((p, k) => (
              <path key={k} className={styles.letter} transform={p.transform} d={p.d} />
            ))}
            {MARK_ACCENTS.map((p, k) => (
              <path key={k} className={styles.accent} transform={p.transform} d={p.d} />
            ))}
            {LOCKUP_WORD.map((p, k) => (
              <path key={k} className={styles.word} transform={p.transform} d={p.d} />
            ))}
          </svg>
        </h1>
      </div>
      <div className={styles.band}>
        <p className={styles.lede}>{brief.home.paragraph}</p>
        <div className={styles.side}>
          <p className={styles.time}>
            {site.place} <span data-time>{' '}</span>
          </p>
          <p className={styles.buttons}>
            <Link href={site.cta.work.href} prefetch={false} className={styles.work}>{site.cta.work.label}</Link>
            <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
