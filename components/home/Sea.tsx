'use client';

import Link from 'next/link';
import { useEffect, useRef, type CSSProperties } from 'react';
import { Box } from '@/components/materials/Box';
import { Logo } from '@/components/site/Logo';
import { site } from '@/content/site.no';
import type { InkHandle } from '@/lib/ink';
import { scrollToY } from '@/lib/smooth';
import { sentences } from '@/lib/text';
import type { WaterHandle } from '@/lib/water';
import { AREA_LOOK, areaFloor, type Area } from './areas';
import { tideClock } from './clock';
import { openingEnd } from './Hero';
import fields from './fields.module.css';
import { useFit } from './fit';
import styles from './sea.module.css';
import { groundAt, HYST, inkAt, LANDED, LEFT, nearestPage, seaAreas, seaAt, STEPS } from './tide';

/** The longest of the four names: the index is sized by it. */
const widest = seaAreas.reduce((a, b) => (b.name.length > a.name.length ? b : a));

/** On a phone the stone drops into the water this far past the band's soft foot (px, `--band-edge`), below the lit name: under the band it would not be seen. */
const PAST_FOOT = 8;

/** A field's colours: its ground for the veil, and the inks that read on it. */
function inks(area: Area): CSSProperties {
  const look = AREA_LOOK[area.key];
  return { '--ground': `var(${look.token})`, '--card-ink': `var(${look.headingInk})`, '--card-text': `var(${look.ink})` } as CSSProperties;
}

/** The water on the frame at `u`: the floor from field i's to the next's, t of the way across. */
function tune(water: WaterHandle | InkHandle | null, u: number) {
  if (!water || !('retune' in water)) return;
  const { i, t } = seaAt(u);
  water.retune(areaFloor(seaAreas[i]), areaFloor(seaAreas[i + 1]), t);
}

/** The left page: the four names in the sea's order, the one on the water lit, each the way to its page. */
function Index({ go }: { go: (k: number) => void }) {
  const list = useRef<HTMLOListElement>(null);
  const longest = useRef<HTMLLIElement>(null);
  useFit(list, longest, { onto: list, max: 66, maxOfHeight: 0.2 });
  return (
    <ol ref={list} className={styles.index} data-index data-tone={seaAreas[0].tone}>
      {seaAreas.map((a, k) => (
        <li key={a.key} ref={a.key === widest.key ? longest : undefined} className={styles.item} data-item={k} data-here={k === 0 ? '' : undefined}>
          <button type="button" className={styles.go} onClick={() => go(k)}>
            {a.name}
          </button>
        </li>
      ))}
    </ol>
  );
}

/**
 * A phone's left page, laid across the head of the screen: the four names pinned under the
 * header on the field's own colour, the one on the water lit, each the way to its page, and the
 * field's logo at the foot of the list. The texts go by under it as they go by beside the names
 * on a desktop (the owner, 2026-09-24: «on the mobile site, we don't have the same scrolling
 * thing as desktop … Can that be changed so they're both the same?»). Only a phone draws it.
 */
function Band({ go }: { go: (k: number) => void }) {
  const first = seaAreas[0];
  return (
    <div className={styles.band} data-band style={inks(first)}>
      <ol className={styles.bandIndex}>
        {seaAreas.map((a, k) => (
          <li key={a.key} className={styles.item} data-item={k} data-here={k === 0 ? '' : undefined}>
            <button type="button" className={styles.go} onClick={() => go(k)}>
              {a.name}
            </button>
          </li>
        ))}
      </ol>
      <div className={styles.bandFeet}>
        {seaAreas.map((a, k) => (
          <span key={a.key} className={styles.foot} data-foot={k} data-on={k === 0 ? '' : undefined}>
            <Logo ground={a.ground} height={28} decorative />
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * A right page: the field's statement and its reading (the brief's text, its first sentence and
 * the rest), the whole of it the link to its section of Vårt arbeid. Its name is an `h2` (the sea
 * stands first under the hero, so each field is a section of the page) for a reader; the index
 * shows it to the eye, and on a phone the band does.
 */
function Page({ area, k }: { area: Area; k: number }) {
  const [first, ...rest] = sentences(area.text);
  return (
    <Link href={area.href} prefetch={false} className={styles.page} data-page={k} data-here={k === 0 ? '' : undefined} aria-labelledby={`felt-${area.key}`}>
      <h2 id={`felt-${area.key}`} className={styles.name}>
        {area.name}
      </h2>
      <p className={styles.say}>{first}</p>
      <p className={styles.text}>{rest.join(' ')}</p>
    </Link>
  );
}

/**
 * Havet: the four fields as one sea, as Bladene (sea.module.css says what is where). The scroll
 * is the browser's and the tide is ours: nothing here holds, snaps, steps or moves the page. On
 * every scroll the page nearest the middle of the screen (`nearestPage`, with a little hysteresis)
 * lights its name at once. The tide then goes to its field on its own clock (clock.ts), whole, in
 * about a second. The water's floor is retuned from one area's colour to the next
 * (`WaterHandle.retune`), and the same two colours are mixed as the box's own CSS ground for a
 * device without WebGL2. The words take the next field's inks once its tide has crossed their
 * page (`inkAt`), and a stone drops under the name as the field lands. A name is a button: it
 * brings its page to the middle on the page's own glide (lib/smooth.ts; the browser's smooth
 * scroll where the page does not glide), and the focus goes with it.
 * A phone has the same, with the names in a band at the head of the screen (`Band`): its colour
 * follows the tide, and the middle is the middle of the water under it.
 *
 * Under reduced motion the sea goes to a field at once: the name, the inks and the colour, with no
 * tide, no stone and no glide (the site's stylesheet drops every transition there too). Without
 * script the sticky screen is CSS alone, and the pages scroll over the navy in the first field's
 * inks.
 */
export function Sea() {
  const stage = useRef<HTMLElement>(null);
  const live = useRef<WaterHandle | InkHandle | null>(null);
  /** The frame on the screen. A water built later (near and quiet, lib/near.ts) is put straight onto it. */
  const shown = useRef<number | null>(null);
  const go = useRef<(k: number) => void>(() => {});

  useEffect(() => {
    const el = stage.current;
    const box = el?.querySelector<HTMLElement>('[data-material="water"]');
    const screen = el?.querySelector<HTMLElement>('[data-screen]');
    const index = el?.querySelector<HTMLElement>('[data-index]');
    const band = el?.querySelector<HTMLElement>('[data-band]');
    const sheet = el?.querySelector<HTMLElement>('[data-pages]');
    if (!el || !box || !screen || !index || !band || !sheet) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = box.querySelector('canvas');
    const pages = [...el.querySelectorAll<HTMLElement>('[data-page]')];
    // Both lists' names, the index's and the band's, each by its own number: only one is drawn.
    const items = [...el.querySelectorAll<HTMLElement>('[data-item]')];
    const veils = [...el.querySelectorAll<HTMLElement>('[data-veil]')];
    // The foot's logos by their own attribute: `Logo` puts `data-logo` on its <img>, and the mock's `[data-logo]` found eight.
    const feet = [...el.querySelectorAll<HTMLElement>('[data-foot]')];
    const own = (e: HTMLElement, name: 'item' | 'foot') => Number(e.dataset[name]);
    el.setAttribute('data-live', '');

    /** Which fields have had their stone, each re-armed once the tide is well away from it. */
    const landed = seaAreas.map(() => false);
    /**
     * The stone drops under the lit name, in whichever list is drawn. On a phone the band is over
     * the water, so it drops into the water just past the band's soft foot, below the name.
     */
    const stone = (k: number) => {
      const water = live.current;
      const frame = canvas?.getBoundingClientRect();
      const head = band.getBoundingClientRect();
      const name = (head.height ? band : index).querySelectorAll('button')[k]?.getBoundingClientRect();
      if (!water || !frame?.width || !frame.height || !name) return;
      const foot = parseFloat(getComputedStyle(band).getPropertyValue('--band-edge')) || 0;
      const y = head.height ? head.bottom + foot + PAST_FOOT : name.top + name.height / 2;
      water.stir((name.left + name.width / 2 - frame.left) / frame.width, 1 - (y - frame.top) / frame.height);
    };

    let inked = -1;
    const write = (u: number) => {
      shown.current = u;
      el.dataset.u = u.toFixed(3);
      tune(live.current, u);
      // On the box itself: it declares its own `--ground` (`.field.navy`), so a ground set on anything above it never showed.
      box.style.setProperty('--ground', groundAt(u));
      // The phone's band wears the fields' own colours as the tide crosses, the same mix as the box's
      // CSS ground, not a step behind it. (The water drawn over that ground has floors of its own.)
      band.style.setProperty('--band', groundAt(u));
      const k = inkAt(u);
      if (k !== inked) {
        inked = k;
        const area = seaAreas[k];
        for (const [name, value] of Object.entries(inks(area))) {
          sheet.style.setProperty(name, value as string);
          index.style.setProperty(name, value as string);
          band.style.setProperty(name, value as string);
        }
        sheet.dataset.tone = area.tone;
        index.dataset.tone = area.tone;
        veils.forEach((v, j) => v.toggleAttribute('data-on', j === k));
        feet.forEach((f) => f.toggleAttribute('data-on', own(f, 'foot') === k));
      }
      seaAreas.forEach((_, j) => {
        const d = Math.abs(u - j);
        if (!landed[j] && d < LANDED) {
          landed[j] = true;
          stone(j);
        } else if (landed[j] && d > LEFT) {
          landed[j] = false;
        }
      });
    };

    let centres: number[] = [];
    let line = 0;
    let span = 1;
    /**
     * The reading line (the middle of the screen under the header, and on a phone under the band
     * too) and each page's centre, in the page's coordinates. A band that is not drawn measures 0.
     * The screen is the one the stylesheet lays the pages out on (`--view-h`, the large viewport
     * under the header), not `innerHeight`: on a phone with its toolbar showing that is shorter, so
     * a name glided the last page past the end of the pin and the band slid under the header, and
     * the line moved as the toolbar came and went, with no scroll. Written to `data-line`, so the
     * e2e reads the line the sea reads rather than working it out again.
     */
    const measure = () => {
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
      const head = band.getBoundingClientRect().height;
      span = (screen.getBoundingClientRect().height || window.innerHeight - header) - head;
      line = header + head + span / 2;
      el.dataset.line = line.toFixed(1);
      centres = pages.map((p) => {
        const r = p.getBoundingClientRect();
        return r.top + window.scrollY + r.height / 2;
      });
    };
    measure();
    let field = nearestPage(centres, window.scrollY + line, 0, HYST * span);
    const light = (k: number) => {
      items.forEach((it) => it.toggleAttribute('data-here', own(it, 'item') === k));
      pages.forEach((p, j) => p.toggleAttribute('data-here', j === k));
    };
    light(field);
    const clock = reduced ? null : tideClock(write, STEPS, field);
    if (!clock) write(field);

    const read = () => {
      const next = nearestPage(centres, window.scrollY + line, field, HYST * span);
      if (next === field) return;
      field = next;
      light(field);
      if (clock) clock.aim(field);
      else write(field);
    };

    go.current = (k) => {
      measure();
      pages[k]?.focus({ preventScroll: true });
      scrollToY(centres[k] - line);
    };

    let queued = 0;
    const onScroll = () => {
      if (!queued)
        queued = requestAnimationFrame(() => {
          queued = 0;
          read();
        });
    };
    const onResize = () => {
      measure();
      read();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    // The pages move without a scroll when anything above them changes height: the fonts, the hero.
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(onResize) : null;
    ro?.observe(document.body);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
      if (queued) cancelAnimationFrame(queued);
      clock?.stop();
      go.current = () => {};
      el.removeAttribute('data-live');
    };
  }, []);

  const first = seaAreas[0];
  return (
    <section ref={stage} aria-label={site.pages.home.areasLabel} className={styles.stage} data-fields>
      <div className={styles.track}>
        <div className={styles.view} data-screen>
          <div className={styles.sea}>
            <Box
              material="water"
              floor={areaFloor(first)}
              tone={first.tone}
              ground={first.ground}
              className={`${fields.field} ${fields[first.ground]} ${styles.fill}`}
              calm
              after={openingEnd}
              onMaterial={(w) => {
                live.current = w;
                // Built late, at the first field's floor: put it straight onto the frame the sea is showing.
                if (shown.current !== null) tune(w, shown.current);
              }}
            >
              {seaAreas.map((a, k) => (
                <div key={a.key} className={styles.veil} data-veil={k} data-on={k === 0 ? '' : undefined} style={inks(a)} aria-hidden />
              ))}
              <div className={styles.spread} style={inks(first)}>
                <div className={styles.left}>
                  <Index go={(k) => go.current(k)} />
                </div>
                <div className={styles.feet}>
                  {seaAreas.map((a, k) => (
                    <span key={a.key} className={styles.foot} data-foot={k} data-on={k === 0 ? '' : undefined}>
                      <Logo ground={a.ground} height={28} decorative />
                    </span>
                  ))}
                </div>
              </div>
            </Box>
          </div>
        </div>
      </div>
      <div className={styles.head}>
        <div className={styles.headView}>
          <Band go={(k) => go.current(k)} />
        </div>
      </div>
      <div className={styles.pages} data-pages style={inks(first)} data-tone={first.tone}>
        {seaAreas.map((a, k) => (
          <Page key={a.key} area={a} k={k} />
        ))}
      </div>
    </section>
  );
}
