'use client';

import Link from 'next/link';
import gsap from 'gsap';
import { useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import { Box } from '@/components/materials/Box';
import { Logo } from '@/components/site/Logo';
import { site } from '@/content/site.no';
import type { InkHandle } from '@/lib/ink';
import { sentences } from '@/lib/text';
import type { WaterHandle } from '@/lib/water';
import { AREA_LOOK, areaFloor, type Area } from './areas';
import fields from './fields.module.css';
import { useFit } from './fit';
import styles from './sea.module.css';
import { takeTheSteps } from './step';
import { groundAt, LANDED, LEFT, seaAreas, seaAt, STEPS } from './tide';

/** The longest of the four names: the index is sized by it. */
const widest = seaAreas.reduce((a, b) => (b.name.length > a.name.length ? b : a));

/** The layer's colours: the area's ground for the veil, and the inks that read on it. */
function wordVars(area: Area): CSSProperties {
  const look = AREA_LOOK[area.key];
  return { '--ground': `var(${look.token})`, '--card-ink': `var(${look.headingInk})`, '--card-text': `var(${look.ink})` } as CSSProperties;
}

/**
 * What every field carries — the spread (Oppslaget, chosen 2026-09-19 from six): the left
 * page the four fields' names down the whole height in the sea's order, the one on the
 * water lit and the field's heading, the others dimmed — so a visitor sees there are four
 * stops and which this is; the right page the brief's text, its first sentence as the
 * statement and its second as the reading; the guide's logo at the foot. The whole of it
 * the link to its section. The sea stands first under the hero, so each name is an `h2`,
 * a section of the page like Visjon and Om oss after it — an `h3` straight after the `h1`
 * broke the page's heading order (Lighthouse, on the mosaic). The names are sized by the
 * longest («Samfunnsdeltakelse»), fitted to the left page's width.
 */
function FieldWords({ area }: { area: Area }) {
  const [first, ...rest] = sentences(area.text);
  const list = useRef<HTMLOListElement>(null);
  const longest = useRef<HTMLLIElement>(null);
  useFit(list, longest, { onto: list, max: 66, maxOfHeight: 0.2 });
  return (
    <Link href={area.href} prefetch={false} className={styles.cell} aria-labelledby={`felt-${area.key}`}>
      <ol ref={list} className={styles.index}>
        {seaAreas.map((a) => {
          const ref = a.key === widest.key ? longest : undefined;
          return a.key === area.key ? (
            <li key={a.key} ref={ref} className={styles.item} data-here>
              <h2 id={`felt-${area.key}`} className={styles.name}>{a.name}</h2>
            </li>
          ) : (
            <li key={a.key} ref={ref} className={styles.item} aria-hidden>{a.name}</li>
          );
        })}
      </ol>
      <div className={styles.page}>
        <p className={styles.say}>{first}</p>
        <p className={styles.text}>{rest.join(' ')}</p>
      </div>
      <span className={styles.logo}>
        <Logo ground={area.ground} height={28} decorative />
      </span>
    </Link>
  );
}

/**
 * The act: `u` runs 0 to STEPS across the stage — a ScrollTrigger from the stage's top
 * under the header to its bottom at the foot of the screen — and `write` puts each `u` on
 * the elements, once per change and once per refresh.
 *
 * The scroll across those four screens is not the visitor's any more, it is stepped:
 * `takeTheSteps` (step.ts) takes the wheel and the thumb for as long as the act holds the
 * screen and moves the page exactly one field per gesture, over the second the owner
 * settled on (2026-09-22). So the scrub is only the tenth of a second that keeps a scroll made some
 * other way — a key, the scrollbar — from cutting rather than crossing; the drive's own
 * ease is what the tide rides. ScrollTrigger's `snap` is gone with it, and so is the boot
 * settle that used to rescue an act stranded inside the half second the snap is deaf for:
 * step.ts settles a stranded page itself, from the first frame, whatever stranded it.
 *
 * Under reduced motion nothing is made and the stage is never `data-live`.
 *
 * ScrollTrigger is loaded here, after hydration, not imported with the page: nothing else
 * on the site uses it any more, and carried in the home page's chunk it cost the page's
 * first load 28 KB and a longer hydration task (Lighthouse, 2026-09-17: 0.88 → 0.85 on
 * the mobile throttle). The page opens on the first field, so that frame is written by
 * hand the moment the stage is live, and the plugin takes over when it arrives — from the
 * cache, a few frames; over a slow network, the sea stands still on Kunnskap until then.
 * Registered here, not through lib/gsap.ts: `normalizeScroll` stays off (it swallowed
 * nested touch for three days once). The mobile address bar's resize is ignored as the
 * site always had it, so the act's start and end do not move under a thumb.
 */
function useAct(stage: RefObject<HTMLElement | null>, write: (u: number) => void) {
  const fn = useRef(write);
  useEffect(() => {
    fn.current = write;
  }, [write]);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.setAttribute('data-live', '');
    fn.current(0);
    let gone = false;
    let down: (() => void) | null = null;
    void import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
      if (gone) return;
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });
      const headerH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: () => `top ${headerH()}px`,
          end: 'bottom bottom',
          scrub: 0.1,
        },
      });
      tl.to({}, { duration: 1 });
      const put = () => fn.current(tl.progress() * STEPS);
      tl.eventCallback('onUpdate', put);
      ScrollTrigger.addEventListener('refresh', put);
      put();
      const st = tl.scrollTrigger;
      const loose = takeTheSteps(el, () => (st ? { start: st.start, end: st.end } : null), ScrollTrigger.getScrollFunc(window));
      down = () => {
        loose();
        ScrollTrigger.removeEventListener('refresh', put);
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    });
    return () => {
      gone = true;
      down?.();
      el.removeAttribute('data-live');
    };
  }, [stage]);
}

/**
 * Havet: the four fields as one sea, stepped one gesture at a time (step.ts). One water
 * the size of the screen, calm; between
 * field i and i + 1 its floor is retuned from the one area's water to the next, `t` of the
 * way across — the tide comes in from the left, its edge bent by the surface
 * (`WaterHandle.retune`) — and the CSS ground under the canvas mixes the same two colours
 * for a device without WebGL2. The four fields' words stand in the same place and cross as
 * the tide passes; a field's landing drops a stone under its name. The four come in the
 * sea's own order (`SEA_ORDER`: navy, burgundy, turquoise, white). The box's ground and
 * tone are the first field's: the layers carry their own, and nothing on the box keys on
 * them once the act runs.
 */
export function Sea() {
  const stage = useRef<HTMLElement>(null);
  const live = useRef<WaterHandle | InkHandle | null>(null);
  // Which fields have had their stone this visit; the first has (the page opens on it).
  const landed = useRef<boolean[]>(seaAreas.map((_, k) => k === 0));
  useAct(stage, (u) => {
    const el = stage.current;
    const sea = el?.querySelector<HTMLElement>('[data-sea]');
    const canvas = sea?.querySelector<HTMLCanvasElement>('canvas');
    if (!el || !sea || !canvas) return;
    const frame = seaAt(u);
    const water = live.current;
    if (water && 'retune' in water) water.retune(areaFloor(seaAreas[frame.i]), areaFloor(seaAreas[frame.i + 1]), frame.t);
    sea.style.setProperty('--ground', groundAt(u));
    el.querySelectorAll<HTMLElement>('[data-field]').forEach((word) => {
      const k = Number(word.dataset.field);
      const { on, live: isOn } = frame.words[k];
      word.style.setProperty('--on', on.toFixed(3));
      word.toggleAttribute('data-on', isOn);
      const d = Math.abs(u - k);
      const had = landed.current;
      if (!had[k] && d < LANDED) {
        had[k] = true;
        // The stone drops under the NAME, not at the box's centre: the canvas's 0–1 coordinates, y up.
        const name = word.querySelector('h2');
        const box = canvas.getBoundingClientRect();
        if (name && water && box.width && box.height) {
          const r = name.getBoundingClientRect();
          water.stir((r.left + r.width / 2 - box.left) / box.width, 1 - (r.top + r.height / 2 - box.top) / box.height);
        }
      } else if (had[k] && d > LEFT) {
        had[k] = false;
      }
    });
  });
  const first = seaAreas[0];
  return (
    <section ref={stage} aria-label={site.pages.home.areasLabel} className={styles.stage} data-fields>
      <div className={styles.view}>
        <div className={styles.sea} data-sea>
          <Box
            material="water"
            floor={areaFloor(first)}
            tone={first.tone}
            ground={first.ground}
            className={`${fields.field} ${fields[first.ground]} ${styles.fill}`}
            calm
            onMaterial={(w) => { live.current = w; }}
          >
            {seaAreas.map((a, k) => (
              <div key={a.key} data-field={k} data-tone={a.tone} className={styles.word} style={wordVars(a)}>
                <FieldWords area={a} />
              </div>
            ))}
          </Box>
        </div>
      </div>
    </section>
  );
}
