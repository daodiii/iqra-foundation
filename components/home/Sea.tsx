'use client';

import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import { Box } from '@/components/materials/Box';
import { Logo } from '@/components/site/Logo';
import { site } from '@/content/site.no';
import type { InkHandle } from '@/lib/ink';
import type { WaterHandle } from '@/lib/water';
import { AREA_LOOK, areaFloor, areas, type Area } from './areas';
import fields from './fields.module.css';
import styles from './sea.module.css';
import { groundAt, LANDED, LEFT, seaAt, settle, STEPS } from './tide';

/*
 * Registered here, not through lib/gsap.ts: nothing else on the site scrubs any more, and
 * `normalizeScroll` stays off (it swallowed nested touch for three days once). The mobile
 * address bar's resize is ignored as the site always had it, so the act's start and end do
 * not move under a thumb.
 */
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/** The snap is deaf for the first half second of ScrollTrigger's life (lib/gsap.ts has the measurements); the act looks once, after it. */
const BOOT_SETTLE = 0.6;

/** The layer's colours: the area's ground for the veil, and the inks that read on it. */
function wordVars(area: Area): CSSProperties {
  const look = AREA_LOOK[area.key];
  return { '--ground': `var(${look.token})`, '--card-ink': `var(${look.headingInk})`, '--card-text': `var(${look.ink})` } as CSSProperties;
}

/**
 * What every field carries: the name, the brief's text, the guide's logo for its ground;
 * the whole of it the link to its section. The sea stands first under the hero, so each
 * name is an `h2`, a section of the page like Visjon and Om oss after it — an `h3`
 * straight after the `h1` broke the page's heading order (Lighthouse, on the mosaic).
 */
function FieldWords({ area }: { area: Area }) {
  return (
    <Link href={area.href} prefetch={false} className={styles.cell} aria-labelledby={`felt-${area.key}`}>
      <h2 id={`felt-${area.key}`} className={styles.name}>{area.name}</h2>
      <div className={styles.foot}>
        <p className={styles.text}>{area.text}</p>
        <span className={styles.logo}>
          <Logo ground={area.ground} height={28} decorative />
        </span>
      </div>
    </Link>
  );
}

/**
 * The boot settle. ScrollTrigger schedules no snap until half a second after it starts,
 * and none at all for a page that loads with its scroll restored mid-act until the next
 * scroll. So once, after that half second, the act checks itself: stranded between two
 * fields, it drives the window to where `settle` says, the way the snap would have — and
 * lets go the moment anything else moves the page. `hold` is given the drive so an unmount
 * can kill it.
 */
function settleNow(st: ScrollTrigger | undefined, hold: (drive: gsap.core.Tween) => void) {
  if (!st || !st.isActive) return;
  const before = window.scrollY;
  requestAnimationFrame(() => {
    // Still moving? Then ScrollTrigger is awake and its own snap will collect it.
    if (window.scrollY !== before) return;
    // `getTween(true)` is the number 0 once a snap has finished — `?.` does not guard 0.
    const tween = st.getTween(true) as gsap.core.Tween | 0 | undefined;
    if (tween && tween.isActive()) return;
    const to = settle(st.progress, st);
    if (Math.abs(to - st.progress) < 0.001) return;
    const toScroll = ScrollTrigger.getScrollFunc(window);
    const at = { y: window.scrollY };
    let wrote = at.y;
    const drive = gsap.to(at, {
      y: st.start + to * (st.end - st.start),
      duration: 0.65,
      ease: 'power2.inOut',
      onUpdate: () => {
        // Two pixels of slack because the browser rounds.
        if (Math.abs(window.scrollY - wrote) > 2) return void drive.kill();
        toScroll(at.y);
        wrote = window.scrollY;
      },
    });
    hold(drive);
  });
}

/**
 * The act: `u` runs 0 to STEPS across the stage — a ScrollTrigger from the stage's top
 * under the header to its bottom at the foot of the screen, scrubbed with a little lag and
 * settling at the four stops once the scroll rests — and `write` puts each `u` on the
 * elements, once per change and once per refresh. Under reduced motion nothing is made and
 * the stage is never `data-live`.
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
    const headerH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: () => `top ${headerH()}px`,
        end: 'bottom bottom',
        scrub: 0.4,
        snap: { snapTo: settle, duration: { min: 0.25, max: 0.65 }, delay: 0.12, ease: 'power2.inOut', directional: false },
      },
    });
    tl.to({}, { duration: 1 });
    const put = () => fn.current(tl.progress() * STEPS);
    tl.eventCallback('onUpdate', put);
    ScrollTrigger.addEventListener('refresh', put);
    put();
    let drive: gsap.core.Tween | null = null;
    const boot = gsap.delayedCall(BOOT_SETTLE, () => settleNow(tl.scrollTrigger, (d) => { drive = d; }));
    return () => {
      boot.kill();
      drive?.kill();
      ScrollTrigger.removeEventListener('refresh', put);
      tl.scrollTrigger?.kill();
      tl.kill();
      el.removeAttribute('data-live');
    };
  }, [stage]);
}

/**
 * Havet: the four fields as one sea. One water the size of the screen, calm; between
 * field i and i + 1 its floor is retuned from the one area's water to the next, `t` of the
 * way across — the tide comes in from the left, its edge bent by the surface
 * (`WaterHandle.retune`) — and the CSS ground under the canvas mixes the same two colours
 * for a device without WebGL2. The four fields' words stand in the same place and cross as
 * the tide passes; a field's landing drops a stone under its name. The box's ground and
 * tone are the first field's: the layers carry their own, and nothing on the box keys on
 * them once the act runs.
 */
export function Sea() {
  const stage = useRef<HTMLElement>(null);
  const live = useRef<WaterHandle | InkHandle | null>(null);
  // Which fields have had their stone this visit; the first has (the page opens on it).
  const landed = useRef<boolean[]>(areas.map((_, k) => k === 0));
  useAct(stage, (u) => {
    const el = stage.current;
    const sea = el?.querySelector<HTMLElement>('[data-sea]');
    const canvas = sea?.querySelector<HTMLCanvasElement>('canvas');
    if (!el || !sea || !canvas) return;
    const frame = seaAt(u);
    const water = live.current;
    if (water && 'retune' in water) water.retune(areaFloor(areas[frame.i]), areaFloor(areas[frame.i + 1]), frame.t);
    sea.style.setProperty('--ground', groundAt(u));
    el.querySelectorAll<HTMLElement>('[data-word]').forEach((word) => {
      const k = Number(word.dataset.word);
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
  const first = areas[0];
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
            {areas.map((a, k) => (
              <div key={a.key} data-word={k} data-tone={a.tone} className={styles.word} style={wordVars(a)}>
                <FieldWords area={a} />
              </div>
            ))}
          </Box>
        </div>
      </div>
    </section>
  );
}
