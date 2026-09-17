# Scenene, Seglet og Neste — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the home page on the owner's decisions: plates that open to the screen as they are read, the ink gone and the water calm inside the four fields, Visjon/Misjon as a seal on navy, Arrangementer as the next event with a count, Ressurser off the page, no thread, no labels, no pill links.

**Architecture:** Three small client pieces carry the motion — `Scene` (a plate's clip opens with the scroll), `Arrive` + `useArrive` (a section's contents rise when the tip line passes it) and `Words` (a statement word by word) — and every plate is one of them wrapped round a `Flat` navy plate or the fields. The page (`app/(site)/page.tsx`) is a server component that lays the pieces in order; the collections are read on the server as before. Every hidden-before-arrival state is gated on `data-live`, so with JavaScript off nothing is hidden.

**Tech Stack:** Next.js 16 (App Router, CSS Modules, Lightning CSS), React 19, TypeScript, vitest + Testing Library (jsdom), Playwright, the site's own `lib/water.ts`, `lib/pen.ts` (through `Frame`), `lib/dates.ts`.

**Spec:** `docs/superpowers/specs/2026-09-17-scenene-seglet-neste-design.md` — the argument; this plan is the steps. Read both.

## Global Constraints

- Work in `C:\Users\daodi\code\iqra-foundation-mock` on branch `feat/den-rode-traden` (PR #35). One commit per task; stage explicit paths, never `git add -A`. Do not push until Task 12 says so.
- **Read `node_modules/next/dist/docs/` before writing Next code** (the repo's AGENTS.md rule): this Next is not the one in training data.
- Every string on the page is the brief's (`content/brief.no.ts`, verbatim, tested) or functional microcopy in `content/site.no.ts`. The only new microcopy is `site.pages.events.count` (four labels). No prose of your own anywhere — not in a placeholder, not in a label.
- No eyebrow labels, no dot markers over titles, no per-section pill links (the owner calls these slop). The section is its title, its words and the menu.
- **Without JavaScript nothing is hidden.** Every rule that hides something before an arrival is keyed on `[data-live]:not([data-arrived])`, and `data-live` is set only by script. Under `prefers-reduced-motion: reduce` nothing transitions, opens, draws, stirs or ticks.
- CSS: declare `backdrop-filter` and other prefixable properties UNPREFIXED only (Lightning CSS adds the prefix; a hand-written prefixed pair loses the unprefixed one). Every rule in a CSS module must contain a local class (CSS modules refuse pure attribute selectors).
- Windows: never create `arrive.ts` beside `Arrive.tsx` (TS1149, case-insensitive resolution); the hook file is `tip.ts`. Python that writes text files passes `newline='\n'`.
- Colour tokens only (`--color-navy`, `--color-turquoise`, `--color-light`, `--color-white`, `--color-crimson`, `--color-crimson-lift`, the `--color-area-*`); hairlines on navy are `rgb(103 193 191 / 0.45)` (rules) and `rgb(103 193 191 / 0.2)` (between rows); light type on navy is `rgb(240 240 241 / 0.72)` for the quiet lines, `0.86`–`0.88` for running text, white for headlines.
- Tests: `npm test` (vitest, jsdom, `@testing-library/react`, `@testing-library/jest-dom/vitest` matchers), `npx tsc --noEmit`, `npm run lint`, `npm run e2e` (Playwright builds and starts on port 3000 — **check nothing is listening on 3000 first**, it reuses whatever is there). Playwright's test-results dir is wiped on each run; keep scripts in the scratchpad.
- Do not touch the hero, the footer, the subpages, `lib/ink.ts`, the mock branches.

---

## File structure

Created:
- `components/materials/Flat.tsx`, `flat.module.css`, `Flat.test.tsx` — a plate with no material.
- `components/home/tip.ts` — `useArrive`, `LEAD`, `tipY`.
- `components/home/Arrive.tsx`, `arrive.module.css`, `Arrive.test.tsx`, `tip.test.tsx` — the arrival.
- `components/home/Scene.tsx`, `scene.module.css`, `Scene.test.tsx` — the opening plate and the plates' column.
- `components/home/Words.tsx`, `words.module.css`, `Words.test.tsx` — a statement word by word.
- `components/home/Mosaic.tsx`, `Mosaic.test.tsx` — the four fields as one scene.
- `components/home/Seal.tsx`, `seal.module.css`, `Seal.test.tsx` — Visjon/Misjon (R).
- `components/home/Events.tsx`, `events.module.css`, `Events.test.tsx` — Arrangementer (V).

Modified:
- `lib/water.ts` (+`calm`), `lib/water.test.ts`.
- `components/materials/Box.tsx` (+`calm`, +`onMaterial`, the ink imported lazily), `Box.test.tsx`.
- `components/home/Fields.tsx` (+`calm`, +`onMaterial`, `data-card`), `Bands.tsx` (`calm`).
- `lib/dates.ts` (+`zonedTime`, +`timeLeft`), `lib/dates.test.ts`.
- `content/site.no.ts` (+`pages.events.count`, −`pages.home.more`).
- `components/site/mark.module.css` (the mark on a dark plate).
- `components/home/Sections.tsx`, `sections.module.css` (Om oss, Menneskene bak, Støtt oss).
- `app/(site)/page.tsx`, `app/(site)/page.test.tsx`.
- `e2e/pages.spec.ts` (the home test).

Deleted:
- `components/home/Thread.tsx`, `thread.module.css`, `home.module.css`.

---

### Task 1: The water, calm; the Box tells who asks; the ink loaded lazily

**Files:**
- Modify: `lib/water.ts` (the `WaterOptions` type ~line 138–150; `const rain` ~line 377; `raindrop` ~line 452; `stir` ~line 611)
- Modify: `lib/water.test.ts`
- Modify: `components/materials/Box.tsx`
- Modify: `components/materials/Box.test.tsx`
- Modify: `components/home/Fields.tsx`, `components/home/Bands.tsx`

**Interfaces:**
- Produces: `WaterOptions.calm?: boolean`; `Box` props `calm?: boolean`, `onMaterial?: (live: InkHandle | WaterHandle) => void`.

- [ ] **Step 1: Write the failing tests**

Append to `lib/water.test.ts`:

```ts
test('calm water is an option, and declines where there is no WebGL2 like any other', () => {
  const canvas = document.createElement('canvas');
  expect(createWater(canvas, { reduced: false, floor: floorAt(SCENE, DEPTH), calm: true })).toBeNull();
});
```

In `components/materials/Box.test.tsx`, change the ink test to await the lazy import and add two tests. Replace the test `'ink is built with the brand’s ink palette, the pointer tracked on the box'` with:

```tsx
  test('ink is built with the brand’s ink palette, the pointer tracked on the box — loaded only when asked for', async () => {
    render(<Box material="ink"><p>x</p></Box>);
    const box = screen.getByText('x').closest('[data-material]');
    expect(near).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(ink).toHaveBeenCalledTimes(1));
    const [canvas, opts] = ink.mock.calls[0] as unknown as [HTMLCanvasElement, { palette: unknown; host: Element; reduced: boolean }];
    expect(canvas).toHaveAttribute('data-paint');
    expect(opts.palette).toBe(brand.ink);
    expect(opts.host).toBe(box);
    expect(opts.reduced).toBe(false);
    expect(water).not.toHaveBeenCalled();
  });

  test('calm is passed to the water, and whoever asked is told the handle once it is built', () => {
    const handle = { destroy: vi.fn(), stir: vi.fn() };
    water.mockReturnValueOnce(handle as never);
    const told = vi.fn();
    render(<Box material="water" calm onMaterial={told}><p>x</p></Box>);
    const [, opts] = water.mock.calls[0] as unknown as [HTMLCanvasElement, { calm: boolean }];
    expect(opts.calm).toBe(true);
    expect(told).toHaveBeenCalledWith(handle);
  });

  test('nobody is told about a water that declined', () => {
    const told = vi.fn();
    render(<Box material="water" onMaterial={told}><p>x</p></Box>);
    expect(water).toHaveBeenCalledTimes(1);
    expect(told).not.toHaveBeenCalled();
  });
```

and import `waitFor`: `import { render, screen, waitFor } from '@testing-library/react';`.

- [ ] **Step 2: Run the tests to see them fail**

Run: `npx vitest run lib/water.test.ts components/materials/Box.test.tsx`
Expected: the calm test passes already (an unknown option is ignored — fine), the Box tests fail: `told` not called, `opts.calm` undefined.

- [ ] **Step 3: The water's `calm`**

In `lib/water.ts`, add to `WaterOptions` after `host`:

```ts
  /**
   * Calmer water (the owner's verdict of 2026-09-17: the rings had become the subject):
   * rain two and a half times rarer and half as heavy, a stir half as deep. The surface
   * still lives. Off, nothing changes.
   */
  calm?: boolean;
```

Replace `const rain = night ? RAIN_NIGHT : RAIN;` with:

```ts
  const calm = opts.calm ? { gap: 2.5, amp: 0.55, stir: 0.5 } : { gap: 1, amp: 1, stir: 1 };
  const rain = (night ? RAIN_NIGHT : RAIN).map((v) => v * calm.gap) as [number, number];
```

In `raindrop`, multiply the depth: `-(0.22 + Math.random() * 0.4) * calm.amp,`.

In `stir`, replace `drop(x, y, -1.2, 0.016);` with `drop(x, y, -1.2 * calm.stir, 0.016 * (calm.stir < 1 ? 0.8 : 1));`.

- [ ] **Step 4: The Box**

Replace `components/materials/Box.tsx`'s imports, props and effect with:

```tsx
'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { brand } from '@/lib/film';
import type { InkHandle, InkPalette } from '@/lib/ink';
import { buildWhenQuietNear } from '@/lib/near';
import { createWater, type WaterFloor, type WaterHandle } from '@/lib/water';
import styles from './materials.module.css';

export type Material = 'ink' | 'water';

/** Which pen and which frost a card on this box takes: navy on a pale box, light on a dark one. */
export type Tone = 'light' | 'dark';

type Props = {
  material: Material;
  /** The ink's palette; the brand's turquoise ink unless said otherwise. */
  palette?: InkPalette;
  /** The water's floor; the brand's turquoise floor unless said otherwise. */
  floor?: WaterFloor;
  tone?: Tone;
  /** The name of the ground, for CSS that keys on it (the dot on crimson). */
  ground?: string;
  className?: string;
  /** `--ground` and `--still` for a box whose colour is not the stylesheet's. */
  style?: CSSProperties;
  /** Calmer water: rarer, lighter rain and a shallower stir (`WaterOptions.calm`). */
  calm?: boolean;
  /** Told the handle once the simulation is built — for whoever wants to stir it. Never told about one that declined. */
  onMaterial?: (live: InkHandle | WaterHandle) => void;
  children: ReactNode;
};

/**
 * A box of material: a rounded plate of ink or of water, holding what is put in it.
 *
 * The colour is in CSS from the first paint (`.ink`, `.water` in materials.module.css) and
 * the simulation is built later — once the box is near the viewport AND the page is quiet
 * (`buildWhenQuietNear`), so its shaders never compile in the middle of a scroll. It is
 * built directly rather than through `createInkWhenNear`, which waits only for near.
 * Under reduced motion nothing is built: the still is the whole answer, as it is on a
 * device that declines WebGL2 (both simulations return null there and the canvas stays
 * transparent over the still).
 *
 * The ink's code is loaded only by a box that asks for ink: no page uses it now, and it
 * should cost the pages that do not nothing.
 *
 * The pointer is tracked on the box, not on the canvas, so a hand moving over the copy
 * stirs the material behind it: the frames are lines drawn on the water, not lids on it.
 */
export function Box({ material, palette, floor, tone = 'light', ground, className, style, calm = false, onMaterial, children }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const paint = useRef<HTMLCanvasElement>(null);
  const told = useRef(onMaterial);

  useEffect(() => {
    told.current = onMaterial;
  }, [onMaterial]);

  useEffect(() => {
    const host = root.current;
    const canvas = paint.current;
    if (!host || !canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let live: InkHandle | WaterHandle | null = null;
    let gone = false;
    const cancel = buildWhenQuietNear(canvas, () => {
      if (material === 'ink') {
        void import('@/lib/ink').then(({ createInk }) => {
          if (gone) return;
          live = createInk(canvas, { reduced: false, palette: palette ?? brand.ink, host });
          if (live) told.current?.(live);
        });
        return;
      }
      live = createWater(canvas, { reduced: false, floor: floor ?? brand.floor, host, calm });
      if (live) told.current?.(live);
    });
    return () => {
      gone = true;
      cancel();
      live?.destroy();
    };
  }, [material, palette, floor, calm]);

  return (
    <div
      ref={root}
      className={`${styles.box} ${styles[material]} ${className ?? ''}`}
      style={style}
      data-material={material}
      data-tone={tone}
      data-ground={ground}
    >
      <canvas ref={paint} className={styles.paint} data-paint aria-hidden="true" />
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
```

- [ ] **Step 5: The fields and the bands ask for calm water**

In `components/home/Bands.tsx`, the `Box` gets `calm`:

```tsx
          <Box material="water" floor={areaFloor(a)} tone={a.tone} ground={a.ground} calm className={`${styles.field} ${styles.band} ${styles[a.ground]}`}>
```

In `components/home/Fields.tsx`, `Fields` takes props and each `li` is a card (the arrival's stagger, harmless without an `Arrive` round it):

```tsx
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Box } from '@/components/materials/Box';
import { Logo } from '@/components/site/Logo';
import { site } from '@/content/site.no';
import type { AreaKey } from '@/lib/content';
import type { InkHandle } from '@/lib/ink';
import type { WaterHandle } from '@/lib/water';
import { areaFloor, areas, type Area } from './areas';
import styles from './fields.module.css';
```

(keep `FieldBody` as it is) and:

```tsx
type Props = {
  /** Calmer water in the fields (`Box`'s `calm`). */
  calm?: boolean;
  /** Told each field's water once it is built, by the area's key. */
  onMaterial?: (key: AreaKey, live: InkHandle | WaterHandle) => void;
};

/**
 * The four areas as four fields of water, each over its own colour, 2×2 from 900px and a
 * column below, edge to edge inside one rounded plate — the guide's colour panel, in
 * water. Each field is one link to its section of Vårt arbeid, named by its heading. The
 * water is built when the field is near and the page is quiet (`Box`), and a field on a
 * dark ground takes light type and the light pen. Each field is a card in the arrival's
 * sense (`data-card`, its place in `--i`), so a page that wraps the fields in an
 * `Arrive` gets them one after another.
 */
export function Fields({ calm = false, onMaterial }: Props = {}) {
  return (
    <section aria-label={site.pages.home.areasLabel} className={styles.plate}>
      <ul className={styles.grid} data-fields>
        {areas.map((a, i) => (
          <li key={a.key} className={styles.item} data-card style={{ '--i': i } as CSSProperties}>
            <Box
              material="water"
              floor={areaFloor(a)}
              tone={a.tone}
              ground={a.ground}
              calm={calm}
              onMaterial={onMaterial ? (live) => onMaterial(a.key, live) : undefined}
              className={`${styles.field} ${styles[a.ground]}`}
            >
              <Link href={a.href} prefetch={false} className={styles.cell} aria-labelledby={`felt-${a.key}`}>
                <FieldBody area={a} headingId={`felt-${a.key}`} />
              </Link>
            </Box>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 6: Run the tests, the types and the lint**

Run: `npx vitest run lib/water.test.ts components/materials/Box.test.tsx components/home/Fields.test.tsx && npx tsc --noEmit && npx eslint lib/water.ts components/materials/Box.tsx components/home/Fields.tsx components/home/Bands.tsx`
Expected: all pass, no type errors, no lint errors.

- [ ] **Step 7: Commit**

```bash
git add lib/water.ts lib/water.test.ts components/materials/Box.tsx components/materials/Box.test.tsx components/home/Fields.tsx components/home/Bands.tsx
git commit -m "the water calm in the fields and the bands; a box tells who asked once its water is built; the ink loaded only by a box that wants it"
```

---

### Task 2: The flat plate

**Files:**
- Create: `components/materials/Flat.tsx`, `components/materials/flat.module.css`, `components/materials/Flat.test.tsx`

**Interfaces:**
- Produces: `Flat({ tint, className?, art?, frost?, children })`, `type Tint = 'navy' | 'light' | 'turquoise-pale'`; renders `[data-material="flat"][data-tone][data-ground]`.

- [ ] **Step 1: Write the failing test**

`components/materials/Flat.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Flat } from './Flat';

describe('Flat', () => {
  test('a navy plate is flat, dark and named for its ground, with the copy in the box’s inner column', () => {
    render(<Flat tint="navy"><p>copy</p></Flat>);
    const plate = screen.getByText('copy').closest('[data-material]') as HTMLElement;
    expect(plate).toHaveAttribute('data-material', 'flat');
    expect(plate).toHaveAttribute('data-tone', 'dark');
    expect(plate).toHaveAttribute('data-ground', 'navy');
    expect(plate.getAttribute('style')).toContain('--ground: var(--color-navy)');
    expect(plate.getAttribute('style')).toContain('--still: none');
    expect(screen.getByText('copy').parentElement).toBe(plate.lastElementChild);
  });

  test('a pale plate takes the light tone, and a node laid under the copy comes first', () => {
    render(<Flat tint="light" art={<i data-testid="art" />}><p>copy</p></Flat>);
    const plate = screen.getByText('copy').closest('[data-material]') as HTMLElement;
    expect(plate).toHaveAttribute('data-tone', 'light');
    expect(plate.firstElementChild).toBe(screen.getByTestId('art'));
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run components/materials/Flat.test.tsx`
Expected: FAIL — cannot find module `./Flat`.

- [ ] **Step 3: Write the plate**

`components/materials/flat.module.css`:

```css
/*
 * A flat plate: the Box's shell without a material. The frost is between the ink's and
 * the water's; anything laid under the copy (`art`) sits where the paint would.
 */

.flat {
  --frost: 0.35;
}
```

`components/materials/Flat.tsx`:

```tsx
import type { CSSProperties, ReactNode } from 'react';
import styles from './flat.module.css';
import mat from './materials.module.css';

/** The grounds a flat plate can have: two of the guide's pale tints, and its navy. */
export type Tint = 'navy' | 'light' | 'turquoise-pale';

const GROUND: Record<Tint, string> = {
  navy: 'var(--color-navy)',
  light: 'var(--color-light)',
  'turquoise-pale': 'var(--color-turquoise-pale)',
};

type Props = {
  tint: Tint;
  className?: string;
  /** A node laid under the copy — a canvas or an svg — where a box's paint would be. Not a div: the scene's column rule is for the inner div alone. */
  art?: ReactNode;
  /** The cards' frost on this plate, 0-1; the stylesheet's 0.35 unless said otherwise. */
  frost?: number;
  children: ReactNode;
};

/**
 * A plate with no material in it: a flat ground in one of the guide's colours, the same
 * shell as a Box (its tokens, its inner column, the pen's tone) so the frames draw on it
 * as they do on water. Navy is a dark plate: light type, the light pen. The home page
 * stands Visjon/Misjon, Arrangementer and Støtt oss on navy plates.
 */
export function Flat({ tint, className, art, frost, children }: Props) {
  return (
    <div
      className={`${mat.box} ${styles.flat} ${className ?? ''}`}
      style={{ '--ground': GROUND[tint], '--still': 'none', ...(frost !== undefined ? { '--frost': frost } : {}) } as CSSProperties}
      data-material="flat"
      data-tone={tint === 'navy' ? 'dark' : 'light'}
      data-ground={tint}
    >
      {art}
      <div className={mat.inner}>{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run components/materials/Flat.test.tsx && npx eslint components/materials/Flat.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/materials/Flat.tsx components/materials/flat.module.css components/materials/Flat.test.tsx
git commit -m "a flat plate: the box's shell with no material in it"
```

---

### Task 3: The arrival

**Files:**
- Create: `components/home/tip.ts`, `components/home/Arrive.tsx`, `components/home/arrive.module.css`, `components/home/tip.test.tsx`, `components/home/Arrive.test.tsx`

**Interfaces:**
- Produces: `useArrive(ref, onChange?, after = 48)`, `LEAD = 0.66`, `tipY()`; `Arrive({ as?, onArrive?, ...attrs })` rendering `[data-arrive]` + `[data-live]` (mounted) + `[data-arrived]` (when reached); the CSS hooks `data-title`, `data-prose`, `data-card` with `--i`.

- [ ] **Step 1: Write the failing tests**

`components/home/tip.test.tsx`:

```tsx
import { act, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useArrive } from './tip';

/** An element whose top is 1000px down the page, in a 900px window. */
const TOP = 1000;
const realMatchMedia = window.matchMedia;

function Probe({ onChange }: { onChange?: (arrived: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useArrive(ref, onChange);
  return <div ref={ref} data-testid="el">x</div>;
}

const scrollTo = (y: number) => {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
  act(() => { window.dispatchEvent(new Event('scroll')); });
};

beforeEach(() => {
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    const top = TOP - window.scrollY;
    return { top, bottom: top + 100, left: 0, right: 0, width: 0, height: 100, x: 0, y: top, toJSON() {} } as DOMRect;
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  window.matchMedia = realMatchMedia;
});

describe('useArrive', () => {
  test('arrives when the tip (66% down the screen) passes the top + 48, and leaves 120px above it', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(<Probe onChange={onChange} />);
    const el = getByTestId('el');
    expect(el).not.toHaveAttribute('data-arrived');
    // tip = scrollY + 594; arrives at tip >= 1048, i.e. scrollY >= 454
    scrollTo(450);
    expect(el).not.toHaveAttribute('data-arrived');
    scrollTo(460);
    expect(el).toHaveAttribute('data-arrived');
    expect(onChange).toHaveBeenLastCalledWith(true);
    // leaves at tip < 880, i.e. scrollY < 286: not yet
    scrollTo(300);
    expect(el).toHaveAttribute('data-arrived');
    scrollTo(200);
    expect(el).not.toHaveAttribute('data-arrived');
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  test('under reduced motion it is arrived at once and left alone', () => {
    window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('prefers-reduced-motion') })) as typeof window.matchMedia;
    const onChange = vi.fn();
    const { getByTestId } = render(<Probe onChange={onChange} />);
    expect(getByTestId('el')).toHaveAttribute('data-arrived');
    expect(onChange).toHaveBeenCalledWith(true);
    scrollTo(0);
    expect(getByTestId('el')).toHaveAttribute('data-arrived');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
```

`components/home/Arrive.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Arrive } from './Arrive';

describe('Arrive', () => {
  test('renders the element asked for with its attributes, live once mounted, not yet arrived', () => {
    render(
      <Arrive as="section" id="om-oss" aria-labelledby="om-oss-tittel" className="white">
        <h2 id="om-oss-tittel" data-title>Om oss</h2>
      </Arrive>,
    );
    const section = screen.getByRole('heading', { name: 'Om oss' }).closest('section') as HTMLElement;
    expect(section).toHaveAttribute('id', 'om-oss');
    expect(section).toHaveAttribute('aria-labelledby', 'om-oss-tittel');
    expect(section.className).toContain('white');
    expect(section).toHaveAttribute('data-arrive');
    expect(section).toHaveAttribute('data-live');
    expect(section).not.toHaveAttribute('data-arrived');
  });

  test('is a div unless told otherwise', () => {
    render(<Arrive><p>x</p></Arrive>);
    expect(screen.getByText('x').parentElement?.tagName).toBe('DIV');
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run components/home/tip.test.tsx components/home/Arrive.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write the hook**

`components/home/tip.ts`:

```ts
'use client';

import { useEffect, useRef, type RefObject } from 'react';

/** Where the tip stands: this far down the screen, the reading line the arrivals answer to. */
export const LEAD = 0.66;
export const tipY = () => window.scrollY + window.innerHeight * LEAD;

/**
 * Marks the element `data-arrived` once the tip has passed its top (plus `after` px), and
 * clears it again when the tip goes back 120px above it — so scrolling up and down plays
 * the arrival again, and a section on the edge does not flicker. Under reduced motion it
 * is arrived at once and left alone. `onChange` is told both ways.
 */
export function useArrive(ref: RefObject<HTMLElement | null>, onChange?: (arrived: boolean) => void, after = 48) {
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  }, [onChange]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.setAttribute('data-arrived', '');
      cb.current?.(true);
      return;
    }
    let arrived = false;
    const check = () => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      const t = tipY();
      if (!arrived && t >= top + after) {
        arrived = true;
        el.setAttribute('data-arrived', '');
        cb.current?.(true);
      } else if (arrived && t < top - 120) {
        arrived = false;
        el.removeAttribute('data-arrived');
        cb.current?.(false);
      }
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [ref, after]);
}
```

- [ ] **Step 4: Write the component and its sheet**

`components/home/arrive.module.css`:

```css
/*
 * The arrival: when the tip line reaches a section, its title rises out of its own line,
 * then its copy, then its cards one after another; scrolled back above, they go down
 * again. Only when the section is live (script ran): otherwise everything stands.
 */

.arrive[data-live] :is([data-prose], [data-card]) {
  transition: opacity 640ms var(--ease-out-expo), transform 760ms var(--ease-out-expo);
}

.arrive[data-live]:not([data-arrived]) :is([data-prose], [data-card]) {
  opacity: 0;
  transform: translateY(18px);
  transition: none;
}

.arrive[data-live][data-arrived] [data-prose] {
  transition-delay: 170ms;
}

.arrive[data-live][data-arrived] [data-card] {
  transition-delay: calc(var(--i, 0) * 120ms);
}

/* The title rises out of its own line. */
.arrive[data-live] [data-title] {
  transition: clip-path 820ms var(--ease-out-expo), transform 820ms var(--ease-out-expo);
  transition-delay: 60ms;
}

.arrive[data-live]:not([data-arrived]) [data-title] {
  clip-path: inset(0 0 100% 0);
  transform: translateY(14px);
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .arrive [data-title],
  .arrive [data-prose],
  .arrive [data-card] {
    transition: none;
  }
}
```

`components/home/Arrive.tsx`:

```tsx
'use client';

import { useEffect, useRef, type HTMLAttributes, type ReactNode, type RefObject } from 'react';
import styles from './arrive.module.css';
import { useArrive } from './tip';

/**
 * A section that arrives: as the tip line passes its top, its title (`data-title`), its
 * copy (`data-prose`) and its cards (`data-card`, staggered by `--i`) come up in sequence;
 * scrolled back above, they go down again. The element is marked `data-live` on mount,
 * so without script nothing is ever hidden. `onArrive` is told either way, for whatever a
 * plate does when its content lands.
 */
type Props = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section';
  onArrive?: (arrived: boolean) => void;
  children: ReactNode;
};

export function Arrive({ as = 'div', className, onArrive, children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);
  useArrive(ref, onArrive);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.setAttribute('data-live', '');
    return () => el.removeAttribute('data-live');
  }, []);
  const Tag = as;
  return (
    <Tag ref={ref as RefObject<HTMLDivElement>} className={`${styles.arrive} ${className ?? ''}`} data-arrive="" {...rest}>
      {children}
    </Tag>
  );
}
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run components/home/tip.test.tsx components/home/Arrive.test.tsx && npx tsc --noEmit && npx eslint components/home/tip.ts components/home/Arrive.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/home/tip.ts components/home/Arrive.tsx components/home/arrive.module.css components/home/tip.test.tsx components/home/Arrive.test.tsx
git commit -m "the arrival: a section's title, copy and cards come up as the tip line reaches it, and go down again above it"
```

---

### Task 4: The scene

**Files:**
- Create: `components/home/Scene.tsx`, `components/home/scene.module.css`, `components/home/Scene.test.tsx`

**Interfaces:**
- Produces: `openness(off: number): number`, `smoothstep`, `OPEN_WITHIN = 0.2`, `CLOSED_BEYOND = 0.58`; `Scene({ className?, onOpen?, children })` rendering `div.scene` with `--open`; the sheet's `.stage` (the plates' column) and `.mosaic` (the fields' cells) classes, exported as `styles.stage` / `styles.mosaic`.

- [ ] **Step 1: Write the failing test**

`components/home/Scene.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { openness, Scene } from './Scene';

const realMatchMedia = window.matchMedia;
afterEach(() => { window.matchMedia = realMatchMedia; });

describe('openness', () => {
  test('a plate is open within a fifth of the screen of the middle, closed beyond 0.58, and between in between', () => {
    expect(openness(0)).toBe(1);
    expect(openness(0.2)).toBe(1);
    expect(openness(-0.2)).toBe(1);
    expect(openness(0.58)).toBe(0);
    expect(openness(-0.9)).toBe(0);
    expect(openness(0.39)).toBeCloseTo(0.5, 5);
    expect(openness(0.3)).toBeGreaterThan(openness(0.4));
    expect(openness(0.4)).toBeGreaterThan(openness(0.5));
  });
});

describe('Scene', () => {
  test('sets --open on its element from where it stands, once mounted', () => {
    render(<Scene><div>plate</div></Scene>);
    const scene = screen.getByText('plate').parentElement as HTMLElement;
    const open = Number(scene.style.getPropertyValue('--open'));
    expect(Number.isNaN(open)).toBe(false);
    expect(open).toBeGreaterThanOrEqual(0);
    expect(open).toBeLessThanOrEqual(1);
  });

  test('under reduced motion it never opens: no --open at all', () => {
    window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('prefers-reduced-motion') })) as typeof window.matchMedia;
    render(<Scene><div>plate</div></Scene>);
    const scene = screen.getByText('plate').parentElement as HTMLElement;
    expect(scene.style.getPropertyValue('--open')).toBe('');
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run components/home/Scene.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the sheet**

`components/home/scene.module.css`:

```css
/*
 * The scenes. Every plate is laid out at the page's full width and clipped to the guide's
 * inset; `--open` (set per scroll frame by Scene) takes the clip to the edges and the
 * corners square as the plate passes the middle of the screen, and back as it leaves. The
 * content inside keeps the column it had, so only the plate grows. Nothing pins.
 */

/* The plates' column: full width, one gutter between, one before what follows. The clip does the inset. */
.stage {
  display: grid;
  gap: var(--gutter);
  padding: 0 0 var(--gutter);
}

.scene {
  --open: 0;
}

/* The plate: clipped to the inset when closed, to the edges when open; the corners follow. */
.scene > :first-child {
  border-radius: 0;
  clip-path: inset(0 calc(var(--box-inset) * (1 - var(--open))) round calc(var(--box-radius) * (1 - var(--open))));
}

/* A plate's content keeps the closed plate's column. */
.scene > [data-material] > div {
  width: calc(100% - 2 * var(--box-inset));
  justify-self: center;
}

/* The mosaic's fields keep their columns: the outer edge of each cell is the inset. */
.mosaic [data-material] {
  --box-radius: 0;
}

.mosaic li:nth-child(odd) [data-material] > div {
  width: calc(100% - var(--box-inset));
  justify-self: end;
}

.mosaic li:nth-child(even) [data-material] > div {
  width: calc(100% - var(--box-inset));
  justify-self: start;
}

@media (max-width: 899px) {
  .mosaic li:nth-child(odd) [data-material] > div,
  .mosaic li:nth-child(even) [data-material] > div {
    width: calc(100% - 2 * var(--box-inset));
    justify-self: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .scene {
    --open: 0;
  }
}
```

- [ ] **Step 4: Write the component**

`components/home/Scene.tsx`:

```tsx
'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './scene.module.css';

/** A plate is fully open within this far of the middle of the screen, in screen heights … */
export const OPEN_WITHIN = 0.2;
/** … and fully closed beyond this. */
export const CLOSED_BEYOND = 0.58;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smoothstep = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

/** How open a plate is, 0-1, from where its centre stands against the middle of the screen, in screen heights. */
export function openness(off: number): number {
  return 1 - smoothstep((Math.abs(off) - OPEN_WITHIN) / (CLOSED_BEYOND - OPEN_WITHIN));
}

type Props = {
  className?: string;
  /** Told when the plate locks open (`--open` past 0.97) and when it lets go. */
  onOpen?: (open: boolean) => void;
  children: ReactNode;
};

/**
 * A plate that opens as it passes the middle of the screen. `--open` is 0 to 1 on the
 * element, set once per scroll or resize frame; the sheet turns it into the clip. Under
 * reduced motion nothing is listened to and the plate stays inset.
 */
export function Scene({ className, onOpen, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const told = useRef(onOpen);
  useEffect(() => {
    told.current = onOpen;
  }, [onOpen]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let wasOpen = false;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const H = window.innerHeight;
      const open = openness((r.top + r.height / 2 - H / 2) / H);
      el.style.setProperty('--open', open.toFixed(3));
      const isOpen = open > 0.97;
      if (isOpen !== wasOpen) {
        wasOpen = isOpen;
        told.current?.(isOpen);
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div ref={ref} className={`${styles.scene} ${className ?? ''}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Run the test**

Run: `npx vitest run components/home/Scene.test.tsx && npx tsc --noEmit && npx eslint components/home/Scene.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/home/Scene.tsx components/home/scene.module.css components/home/Scene.test.tsx
git commit -m "the scene: a plate laid out full width opens to the edges as it passes the middle of the screen"
```

---

### Task 5: The words

**Files:**
- Create: `components/home/Words.tsx`, `components/home/words.module.css`, `components/home/Words.test.tsx`

**Interfaces:**
- Produces: `Words({ text })` — spans `[data-word]` with `--w`, the final full stop in `[data-stop]`; text content unchanged.

- [ ] **Step 1: Write the failing test**

`components/home/Words.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { Words } from './Words';

describe('Words', () => {
  test('the text is unchanged, one word per span in order, the full stop the last word’s own', () => {
    render(<p data-testid="p"><Words text={brief.vision.headline} /></p>);
    const p = screen.getByTestId('p');
    expect(p).toHaveTextContent(brief.vision.headline);
    expect(p.textContent).toBe(brief.vision.headline);
    const words = [...p.querySelectorAll('[data-word]')];
    expect(words).toHaveLength(brief.vision.headline.split(' ').length);
    words.forEach((w, i) => expect((w as HTMLElement).style.getPropertyValue('--w')).toBe(String(i)));
    const stop = p.querySelector('[data-stop]') as HTMLElement;
    expect(stop.textContent).toBe('.');
    expect(words[words.length - 1]).toContainElement(stop);
  });

  test('a line without a full stop has no stop', () => {
    render(<p data-testid="p"><Words text="Kunnskap og dialog" /></p>);
    expect(screen.getByTestId('p').querySelector('[data-stop]')).toBeNull();
    expect(screen.getByTestId('p').textContent).toBe('Kunnskap og dialog');
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run components/home/Words.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the words**

`components/home/words.module.css`:

```css
/*
 * A statement word by word: each word rises into place a little after the one before,
 * once the section it stands in has arrived (`Arrive`). Live and not arrived, the words
 * wait; without script they stand. The full stop is the logo's dot.
 */

.word {
  display: inline-block;
}

[data-live]:not([data-arrived]) .word {
  opacity: 0;
  transform: translateY(0.35em);
  transition: none;
}

[data-live][data-arrived] .word {
  opacity: 1;
  transform: none;
  transition:
    opacity 520ms var(--ease-out) calc(var(--w, 0) * 38ms),
    transform 760ms var(--ease-out-expo) calc(var(--w, 0) * 38ms);
}

.stop {
  color: var(--color-crimson);
}

@media (prefers-reduced-motion: reduce) {
  .word,
  [data-live]:not([data-arrived]) .word,
  [data-live][data-arrived] .word {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

`components/home/Words.tsx`:

```tsx
import { Fragment, type CSSProperties } from 'react';
import styles from './words.module.css';

/**
 * A statement word by word, for the arrival to bring up one after another: each word in
 * its own span with its place in `--w`, a final full stop in a span of its own inside the
 * last word (crimson: the logo's dot). The text content is the input unchanged, so the
 * brief's verbatim test and a screen reader both read the sentence as written.
 */
export function Words({ text }: { text: string }) {
  const stop = text.endsWith('.');
  const words = (stop ? text.slice(0, -1) : text).split(' ');
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span className={styles.word} style={{ '--w': i } as CSSProperties} data-word>
            {word}
            {stop && i === words.length - 1 && <span className={styles.stop} data-stop>.</span>}
          </span>
        </Fragment>
      ))}
    </>
  );
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run components/home/Words.test.tsx && npx eslint components/home/Words.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/home/Words.tsx components/home/words.module.css components/home/Words.test.tsx
git commit -m "a statement word by word, the full stop the logo's dot, the text unchanged"
```

---

### Task 6: The mosaic

**Files:**
- Create: `components/home/Mosaic.tsx`, `components/home/Mosaic.test.tsx`

**Interfaces:**
- Consumes: `Scene`, `Arrive`, `Fields({ calm, onMaterial })`, `styles.mosaic` from `scene.module.css`.
- Produces: `Mosaic()` — the four fields as one scene; `STIR_GAP = 110`.

- [ ] **Step 1: Write the failing test**

`components/home/Mosaic.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { Mosaic } from './Mosaic';

describe('Mosaic', () => {
  test('the four fields, each a card in the arrival, inside one scene', () => {
    const { container } = render(<Mosaic />);
    const region = screen.getByRole('region', { name: site.pages.home.areasLabel });
    expect(region.querySelectorAll('[data-material="water"]')).toHaveLength(4);
    const cards = region.querySelectorAll('li[data-card]');
    expect(cards).toHaveLength(4);
    cards.forEach((c, i) => expect((c as HTMLElement).style.getPropertyValue('--i')).toBe(String(i)));
    // the arrival wraps the scene, and the scene's first child is the plate the clip works on
    const arrive = container.querySelector('[data-arrive]') as HTMLElement;
    expect(arrive).toContainElement(region);
    expect(region.parentElement?.firstElementChild).toBe(region);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run components/home/Mosaic.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the mosaic**

`components/home/Mosaic.tsx`:

```tsx
'use client';

import { useRef } from 'react';
import type { AreaKey } from '@/lib/content';
import type { InkHandle } from '@/lib/ink';
import type { WaterHandle } from '@/lib/water';
import { areas } from './areas';
import { Arrive } from './Arrive';
import { Fields } from './Fields';
import { Scene } from './Scene';
import styles from './scene.module.css';

type Material = InkHandle | WaterHandle;

/** Between one field's stone and the next, when the mosaic locks open. */
export const STIR_GAP = 110;

/**
 * The four fields as one scene: the mosaic opens to the screen as it passes the middle,
 * and when it locks open a stone drops in each field's water, one after another in the
 * areas' order. The fields arrive one after another (`Arrive` round the scene, so the
 * scene's own first child is still the plate the clip works on).
 */
export function Mosaic() {
  const waters = useRef<Partial<Record<AreaKey, Material>>>({});
  return (
    <Arrive as="div">
      <Scene
        className={styles.mosaic}
        onOpen={(open) => {
          if (!open) return;
          areas.forEach((a, i) => window.setTimeout(() => waters.current[a.key]?.stir(0.5, 0.5), i * STIR_GAP));
        }}
      >
        <Fields calm onMaterial={(key, live) => { waters.current[key] = live; }} />
      </Scene>
    </Arrive>
  );
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run components/home/Mosaic.test.tsx components/home/Fields.test.tsx && npx tsc --noEmit && npx eslint components/home/Mosaic.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/home/Mosaic.tsx components/home/Mosaic.test.tsx
git commit -m "the mosaic: the four fields as one scene, a stone in each when it locks open"
```

---

### Task 7: The seal (Visjon · Misjon)

**Files:**
- Create: `components/home/Seal.tsx`, `components/home/seal.module.css`, `components/home/Seal.test.tsx`

**Interfaces:**
- Consumes: `Scene`, `Flat`, `Arrive`, `Words`, `areas`, `brief`, `site.pages.home.visionLabel/missionLabel`.
- Produces: `Seal()`, `INSCRIPTION` (the four names twice round).

- [ ] **Step 1: Write the failing test**

`components/home/Seal.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { INSCRIPTION, Seal } from './Seal';

describe('Seal', () => {
  test('Visjon and Misjon as two sections on one flat navy plate, every word the brief’s', () => {
    const { container } = render(<Seal />);
    const plate = container.querySelector('[data-material]') as HTMLElement;
    expect(plate).toHaveAttribute('data-material', 'flat');
    expect(plate).toHaveAttribute('data-tone', 'dark');
    expect(container.querySelectorAll('[data-material]')).toHaveLength(1);

    const vision = container.querySelector('section#visjon') as HTMLElement;
    const visionName = within(vision).getByRole('heading', { level: 2, name: site.pages.home.visionLabel });
    expect(vision).toHaveAttribute('aria-labelledby', visionName.id);
    expect(within(vision).getByText(brief.vision.headline)).toBeInTheDocument();
    expect(within(vision).getByText(brief.vision.paragraph)).toBeInTheDocument();

    const mission = container.querySelector('section#misjon') as HTMLElement;
    const missionName = within(mission).getByRole('heading', { level: 2, name: site.pages.home.missionLabel });
    expect(mission).toHaveAttribute('aria-labelledby', missionName.id);
    expect(within(mission).getByText(brief.mission.headline)).toBeInTheDocument();
    expect(within(mission).getByText(brief.mission.paragraph)).toBeInTheDocument();
    expect(mission).toHaveAttribute('data-card');
  });

  test('the ring carries the four areas’ names twice round, decorative; the dot stands at twelve', () => {
    const { container } = render(<Seal />);
    const svg = container.querySelector('section#visjon svg') as SVGElement;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    for (const a of brief.areas) expect(INSCRIPTION.split(a.name)).toHaveLength(3);
    expect(svg.querySelector('textPath')?.textContent).toBe(INSCRIPTION);
    const circles = svg.querySelectorAll('circle');
    expect(circles).toHaveLength(2);
    expect(circles[0]).toHaveAttribute('pathLength', '100');
    expect(circles[1]).toHaveAttribute('cy', '3');
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run components/home/Seal.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the sheet**

`components/home/seal.module.css`:

```css
/*
 * The seal: Visjon inside the mark's ring on navy, the four areas' names in slow orbit,
 * the crimson dot at twelve, Misjon beside. The ring draws itself from twelve as the
 * section arrives, the names fade in, the dot pops; scrolled back above, it all resets.
 * Live and not arrived, everything waits; without script it all stands.
 */

.plate {
  --box-pad-y: clamp(64px, 9vh, 96px);
}

.row {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  grid-template-rows: auto auto;
  column-gap: clamp(32px, 5vw, 88px);
  row-gap: 8px;
  align-items: center;
}

/*
 * The vision section spans the whole grid and is a subgrid of it, so the seal can stand in
 * the first column across both rows and the paragraph in the second column's first row
 * while the section keeps a real box — `display: contents` would give it none, and a
 * section with no box fools everything that measures it.
 */
.vision {
  grid-column: 1 / -1;
  grid-row: 1 / span 2;
  display: grid;
  grid-template-columns: subgrid;
  grid-template-rows: subgrid;
  align-items: center;
  scroll-margin-top: calc(var(--header-h) + 16px);
}

.seal {
  grid-column: 1;
  grid-row: 1 / span 2;
  position: relative;
  width: min(100%, 640px);
  aspect-ratio: 1;
  justify-self: center;
}

.lead {
  grid-column: 2;
  grid-row: 1;
  align-self: end;
  margin: 0;
  max-width: 52ch;
  font-family: var(--font-text);
  font-size: clamp(17px, 1.35vw, 20px);
  line-height: 1.55;
  color: rgb(240 240 241 / 0.86);
  text-wrap: pretty;
}

/* Misjon, beside: the second column's second row. It paints over the vision's empty corner there. */
.mission {
  grid-column: 2;
  grid-row: 2;
  align-self: start;
  scroll-margin-top: calc(var(--header-h) + 16px);
}

.rule {
  margin: 26px 0;
  border: 0;
  height: 1px;
  background: rgb(103 193 191 / 0.45);
}

/* The section's name: a small heading in the light. */
.name {
  margin: 0 0 18px;
  font: 500 15px/1 var(--font-sans);
  letter-spacing: var(--tracking-label);
  color: rgb(240 240 241 / 0.72);
}

.headline {
  margin: 0;
  font: 600 clamp(21px, 1.9vw, 28px) / 1.25 var(--font-sans);
  letter-spacing: var(--tracking-tight);
  color: var(--color-white);
  text-wrap: balance;
}

.text {
  margin: 16px 0 0;
  max-width: 54ch;
  font-family: var(--font-text);
  font-size: clamp(16px, 1.2vw, 18px);
  line-height: 1.6;
  color: rgb(240 240 241 / 0.88);
  text-wrap: pretty;
}

/* ----- the ring ----- */

.ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* The ring draws itself from the top, clockwise. */
.line {
  fill: none;
  stroke: var(--color-turquoise);
  stroke-width: 0.28;
  stroke-dasharray: 100;
  stroke-dashoffset: 0;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
}

[data-live]:not([data-arrived]) .line {
  stroke-dashoffset: 100;
  transition: none;
}

[data-live][data-arrived] .line {
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 1500ms var(--ease-out-expo);
}

/* The four areas' names, twice round, turning once in eighty seconds. */
.orbit {
  transform-origin: 50% 50%;
  animation: spin 80s linear infinite;
}

[data-live]:not([data-arrived]) .orbit {
  opacity: 0;
  transition: none;
}

[data-live][data-arrived] .orbit {
  opacity: 1;
  transition: opacity 900ms var(--ease-out) 900ms;
}

.inscription {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 3.05px;
  letter-spacing: 0.06em;
  fill: rgb(240 240 241 / 0.78);
}

/* The dot on the ring, at twelve. */
.dot {
  fill: var(--color-crimson);
  transform-box: fill-box;
  transform-origin: center;
}

[data-live]:not([data-arrived]) .dot {
  transform: scale(0);
  transition: none;
}

[data-live][data-arrived] .dot {
  transform: scale(1);
  transition: transform 460ms cubic-bezier(0.34, 1.56, 0.64, 1) 1450ms;
}

/* ----- inside the ring ----- */

.inside {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  padding: 19%;
  text-align: center;
}

.inside .name {
  margin-bottom: 14px;
}

.statement {
  margin: 0;
  font: 600 clamp(19px, 1.8vw, 27px) / 1.22 var(--font-sans);
  letter-spacing: var(--tracking-tight);
  color: var(--color-white);
  text-wrap: balance;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 899px) {
  .row {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    row-gap: 28px;
  }

  .vision {
    grid-column: 1;
    grid-row: 1 / span 2;
  }

  .seal {
    grid-column: 1;
    grid-row: 1;
    width: min(100%, 440px);
  }

  .lead {
    grid-column: 1;
    grid-row: 2;
  }

  .mission {
    grid-column: 1;
    grid-row: 3;
  }

  .inside {
    padding: 16%;
  }

  .statement {
    font-size: 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .line,
  .orbit,
  .dot,
  [data-live]:not([data-arrived]) .line,
  [data-live]:not([data-arrived]) .orbit,
  [data-live]:not([data-arrived]) .dot,
  [data-live][data-arrived] .line,
  [data-live][data-arrived] .orbit,
  [data-live][data-arrived] .dot {
    opacity: 1;
    stroke-dashoffset: 0;
    transition: none;
    animation: none;
  }

  .line,
  [data-live]:not([data-arrived]) .line,
  [data-live][data-arrived] .line {
    transform: rotate(-90deg);
  }

  .dot,
  [data-live]:not([data-arrived]) .dot,
  [data-live][data-arrived] .dot {
    transform: scale(1);
  }
}
```

- [ ] **Step 4: Write the component**

`components/home/Seal.tsx`:

```tsx
'use client';

import type { CSSProperties } from 'react';
import { Flat } from '@/components/materials/Flat';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { areas } from './areas';
import { Arrive } from './Arrive';
import { Scene } from './Scene';
import styles from './seal.module.css';
import { Words } from './Words';

/**
 * Visjon and Misjon as a seal, on one navy plate: the vision — its name, its statement
 * word by word, the full stop the logo's dot — inside the mark's ring, a turquoise
 * hairline that draws itself from twelve as the section arrives, the four areas' names
 * twice round it in slow orbit, the crimson dot at twelve; the vision's paragraph and the
 * mission in the column beside; stacked on a phone. R, the owner's choice of 2026-09-17.
 */

const t = site.pages.home;
/** The four names twice round: once round fell short of the circle and was stretched letter by letter. */
export const INSCRIPTION = (areas.map((a) => a.name).join('  ·  ') + '  ·  ').repeat(2);
/** The ring's radius and the inscription's, in the seal's 100-unit box. */
const R = 47;
const R_TEXT = 40.5;

export function Seal() {
  return (
    <Scene>
      <Flat tint="navy" className={styles.plate}>
        <Arrive as="div">
          <div className={styles.row}>
            <section id="visjon" aria-labelledby="visjon-tittel" className={styles.vision}>
              <div className={styles.seal}>
                <svg className={styles.ring} viewBox="0 0 100 100" aria-hidden="true">
                  <defs>
                    <path id="segl-bane" d={`M50,50 m-${R_TEXT},0 a${R_TEXT},${R_TEXT} 0 1,1 ${R_TEXT * 2},0 a${R_TEXT},${R_TEXT} 0 1,1 -${R_TEXT * 2},0`} />
                  </defs>
                  <circle className={styles.line} cx="50" cy="50" r={R} pathLength="100" />
                  <g className={styles.orbit}>
                    <text className={styles.inscription}>
                      <textPath href="#segl-bane" textLength={(2 * Math.PI * R_TEXT).toFixed(2)} lengthAdjust="spacing">{INSCRIPTION}</textPath>
                    </text>
                  </g>
                  <circle className={styles.dot} cx="50" cy={50 - R} r="2.1" />
                </svg>
                <div className={styles.inside}>
                  <h2 id="visjon-tittel" className={styles.name}>{t.visionLabel}</h2>
                  <p className={styles.statement}><Words text={brief.vision.headline} /></p>
                </div>
              </div>
              <p className={styles.lead} data-prose>{brief.vision.paragraph}</p>
            </section>
            <section id="misjon" aria-labelledby="misjon-tittel" className={styles.mission} data-card style={{ '--i': 1 } as CSSProperties}>
              <hr className={styles.rule} />
              <h2 id="misjon-tittel" className={styles.name}>{t.missionLabel}</h2>
              <p className={styles.headline}>{brief.mission.headline}</p>
              <p className={styles.text}>{brief.mission.paragraph}</p>
            </section>
          </div>
        </Arrive>
      </Flat>
    </Scene>
  );
}
```

- [ ] **Step 5: Run the test**

Run: `npx vitest run components/home/Seal.test.tsx && npx tsc --noEmit && npx eslint components/home/Seal.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/home/Seal.tsx components/home/seal.module.css components/home/Seal.test.tsx
git commit -m "the seal: Visjon inside the mark's ring on navy, the four areas in orbit, Misjon beside"
```

---

### Task 8: The time of an event, and the count's labels

**Files:**
- Modify: `lib/dates.ts`, `lib/dates.test.ts`
- Modify: `content/site.no.ts` (the `events` block, ~line 96–107)

**Interfaces:**
- Produces: `zonedTime(iso, time, zone = 'Europe/Oslo'): number`, `timeLeft(ms): { days, hours, minutes, seconds }`, `site.pages.events.count = { days, hours, minutes, seconds }`.

- [ ] **Step 1: Write the failing tests**

Append to `lib/dates.test.ts`:

```ts
import { timeLeft, zonedTime } from './dates';

test('an event’s wall-clock time in Oslo is an instant: summer is two hours ahead of UTC, winter one', () => {
  expect(zonedTime('2026-09-24', '18:00')).toBe(Date.UTC(2026, 8, 24, 16, 0));
  expect(zonedTime('2026-01-10', '18:00')).toBe(Date.UTC(2026, 0, 10, 17, 0));
});

test('without a time the event starts at midnight in Oslo', () => {
  expect(zonedTime('2026-09-24', null)).toBe(Date.UTC(2026, 8, 23, 22, 0));
});

test('the time left is days, hours, minutes and seconds, and never less than nothing', () => {
  expect(timeLeft(0)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  expect(timeLeft(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  expect(timeLeft(59_000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 59 });
  expect(timeLeft(((7 * 24 + 2) * 3600 + 30 * 60 + 35) * 1000)).toEqual({ days: 7, hours: 2, minutes: 30, seconds: 35 });
});
```

(Fold the new import into the existing import line: `import { timeLeft, writeDate, writeDateTime, zonedTime } from './dates';`.)

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run lib/dates.test.ts`
Expected: FAIL — `zonedTime` is not exported.

- [ ] **Step 3: Write the functions**

Append to `lib/dates.ts`:

```ts
/**
 * The instant of a wall-clock time in a zone — an event's start, which the content
 * writes as Oslo's clock — without a zone library: guess the instant as if the clock
 * were UTC, read what the zone's clock says at that instant, correct by the difference,
 * and once more in case the guess landed across a change of the clocks.
 */
export function zonedTime(iso: string, time: string | null, zone = 'Europe/Oslo'): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`not an ISO date: ${iso}`);
  const [h, min] = time ? time.split(':').map(Number) : [0, 0];
  const wall = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), h, min);
  const clock = new Intl.DateTimeFormat('sv-SE', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
  // The zone's clock at an instant, read back as if it were UTC: «2026-09-24 18:00:00».
  const reads = (at: number) => {
    const s = clock.format(new Date(at));
    return Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)), Number(s.slice(11, 13)), Number(s.slice(14, 16)), Number(s.slice(17, 19)));
  };
  let at = wall - (reads(wall) - wall);
  at = wall - (reads(at) - at);
  return at;
}

export type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

/** How long until, in whole days, hours, minutes and seconds; nothing once it has passed. */
export function timeLeft(ms: number): TimeLeft {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}
```

- [ ] **Step 4: The labels**

In `content/site.no.ts`, inside `pages.events` after `more: 'Les mer',`:

```ts
      /** The count on the home page, under the next event: how long until it starts. */
      count: { days: 'dager', hours: 'timer', minutes: 'min', seconds: 'sek' },
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run lib/dates.test.ts content && npx tsc --noEmit`
Expected: PASS (the content check's tests too).

- [ ] **Step 6: Commit**

```bash
git add lib/dates.ts lib/dates.test.ts content/site.no.ts
git commit -m "an event's start as an instant in Oslo, the time left in four numbers, and the count's four labels"
```

---

### Task 9: Neste (Arrangementer)

**Files:**
- Create: `components/home/Events.tsx`, `components/home/events.module.css`, `components/home/Events.test.tsx`
- Modify: `components/site/mark.module.css` (the mark on a dark plate)

**Interfaces:**
- Consumes: `Scene`, `Flat`, `Arrive`, `Words`, `AreaMark`, `zonedTime`, `timeLeft`, `writeDateTime`, `site.pages.events.{title,description,emptyUpcoming,count}`, `Event`.
- Produces: `Events({ upcoming: Event[] })`.

- [ ] **Step 1: Write the failing test**

`components/home/Events.test.tsx`:

```tsx
import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { site } from '@/content/site.no';
import type { Event } from '@/lib/content';
import { Events } from './Events';

const event = (n: number, start: string, time: string | null, area: Event['area'] = null): Event => ({
  slug: `e${n}`, title: `Arrangement ${n}`, start, time, end: null, place: `Sted ${n}`, text: '', link: null, image: null, area,
});
const three = [event(1, '2026-09-24', '18:00', 'dialog'), event(2, '2026-09-30', '19:00'), event(3, '2026-10-08', null)];
const t = site.pages.events;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
  vi.setSystemTime(new Date('2026-09-17T10:00:00Z'));
});
afterEach(() => { vi.useRealTimers(); });

describe('Events', () => {
  test('the next event is the statement — its date, its title word by word, its place, its area — and counts down; the two after it are rows', () => {
    const { container } = render(<Events upcoming={three} />);
    const section = container.querySelector('section#arrangementer') as HTMLElement;
    const name = within(section).getByRole('heading', { level: 2, name: t.title });
    expect(section).toHaveAttribute('aria-labelledby', name.id);
    expect(section.closest('[data-material]')).toHaveAttribute('data-ground', 'navy');
    expect(within(section).getByText('24. september 2026 kl. 18:00')).toBeInTheDocument();
    const title = within(section).getByRole('heading', { level: 3, name: 'Arrangement 1' });
    expect(title.querySelectorAll('[data-word]')).toHaveLength(2);
    expect(within(section).getByText('Sted 1')).toBeInTheDocument();
    expect(within(section).getByText('Dialog')).toBeInTheDocument();
    expect(within(section).getByText(t.description)).toBeInTheDocument();
    // 2026-09-24 18:00 in Oslo is 16:00Z: seven days and six hours from 10:00Z on the 17th
    const count = section.querySelector('dl') as HTMLElement;
    expect(within(count).getByText('7').previousElementSibling).toHaveTextContent(t.count.days);
    expect(within(count).getByText('06').previousElementSibling).toHaveTextContent(t.count.hours);
    expect(count.querySelector('div')?.firstElementChild?.tagName).toBe('DT');
    expect(within(count).getAllByText('00')).toHaveLength(2);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(within(count).getByText('05')).toBeInTheDocument();
    expect(within(count).getAllByText('59')).toHaveLength(2);
    // the rest, as rows, each a card
    const rows = section.querySelectorAll('li[data-card]');
    expect(rows).toHaveLength(2);
    expect(within(rows[0] as HTMLElement).getByRole('heading', { level: 3, name: 'Arrangement 2' })).toBeInTheDocument();
    expect(rows[0]).toHaveTextContent('30.09 · 19:00');
    expect(rows[1]).toHaveTextContent('08.10');
    expect(rows[1]).not.toHaveTextContent('·');
    expect(within(section).queryByText(t.emptyUpcoming)).toBeNull();
  });

  test('with nothing coming: the name, the honest line and the paragraph, no count', () => {
    const { container } = render(<Events upcoming={[]} />);
    const section = container.querySelector('section#arrangementer') as HTMLElement;
    expect(within(section).getByText(t.emptyUpcoming)).toBeInTheDocument();
    expect(within(section).getByText(t.description)).toBeInTheDocument();
    expect(section.querySelector('dl')).toBeNull();
    expect(section.querySelectorAll('li')).toHaveLength(0);
  });

  test('one event alone: the statement, no rows', () => {
    const { container } = render(<Events upcoming={[three[0]]} />);
    const section = container.querySelector('section#arrangementer') as HTMLElement;
    expect(within(section).getByRole('heading', { level: 3, name: 'Arrangement 1' })).toBeInTheDocument();
    expect(section.querySelectorAll('li')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run components/home/Events.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: The mark on a dark plate**

Append to `components/site/mark.module.css`:

```css
/* On a dark plate the mark takes the light, and the squares the colours the areas have on navy (areas.ts's `onNavy`). */
[data-tone="dark"] .mark {
  color: var(--color-light);
}

[data-tone="dark"] .square[data-area="kunnskap"] { background: var(--color-light); }
[data-tone="dark"] .square[data-area="dialog"] { background: var(--color-turquoise); }
[data-tone="dark"] .square[data-area="moteplasser"] { background: var(--color-white); border: 0; }
[data-tone="dark"] .square[data-area="samfunnsdeltakelse"] { background: var(--color-crimson-lift); }
```

- [ ] **Step 4: Write the sheet**

`components/home/events.module.css`:

```css
/*
 * Neste: the next event as the plate's statement, the count under it, the two after it
 * beside. The words come in as the vision's do (words.module.css); the count fades in
 * after them. Live and not arrived, they wait; without script everything stands.
 */

.plate {
  --box-pad-y: clamp(64px, 9vh, 96px);
}

.wrap {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr);
  column-gap: clamp(32px, 5vw, 96px);
  row-gap: 48px;
  align-items: end;
  scroll-margin-top: calc(var(--header-h) + 16px);
}

.main,
.side {
  min-width: 0;
}

/* The section's name: a small heading in the light. */
.name {
  margin: 0 0 18px;
  font: 500 15px/1 var(--font-sans);
  letter-spacing: var(--tracking-label);
  color: rgb(240 240 241 / 0.72);
}

.text {
  margin: 0;
  max-width: 54ch;
  font-family: var(--font-text);
  font-size: clamp(16px, 1.2vw, 18px);
  line-height: 1.6;
  color: rgb(240 240 241 / 0.88);
  text-wrap: pretty;
}

.when {
  margin: 0 0 14px;
  font: 500 15px/1.4 var(--font-sans);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  color: rgb(240 240 241 / 0.72);
}

.title {
  margin: 0;
  max-width: 18ch;
  font: 600 clamp(30px, 3.8vw, 56px) / 1.06 var(--font-sans);
  letter-spacing: -0.02em;
  color: var(--color-white);
  text-wrap: balance;
}

.place {
  margin: 18px 0 0;
  font: 500 16px/1.4 var(--font-sans);
  color: rgb(240 240 241 / 0.8);
}

.area {
  margin: 10px 0 0;
}

/* ----- the count ----- */

.count {
  display: flex;
  gap: clamp(20px, 2.4vw, 36px);
  margin: 36px 0 0;
  min-height: 52px;
}

/* The label comes first in the markup (a dt before its dd) and second on the screen. */
.count > div {
  display: grid;
  row-gap: 6px;
}

.count dt {
  order: 2;
}

.count dd {
  margin: 0;
  min-width: 2ch;
  font: 600 clamp(26px, 2.4vw, 36px) / 1 var(--font-sans);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--tracking-tight);
  color: var(--color-white);
}

.count dt {
  font: 500 11px/1 var(--font-sans);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(240 240 241 / 0.6);
}

[data-live]:not([data-arrived]) .count {
  opacity: 0;
  transform: translateY(10px);
  transition: none;
}

[data-live][data-arrived] .count {
  opacity: 1;
  transform: none;
  transition: opacity 600ms var(--ease-out) 900ms, transform 700ms var(--ease-out-expo) 900ms;
}

/* ----- the rest ----- */

.rows {
  margin: 28px 0 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid rgb(103 193 191 / 0.45);
}

.row {
  display: grid;
  row-gap: 3px;
  padding: 14px 0;
  border-bottom: 1px solid rgb(103 193 191 / 0.2);
}

.rowWhen {
  font: 500 13px/1.4 var(--font-sans);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  color: rgb(240 240 241 / 0.72);
}

.rowWhat {
  margin: 0;
  font: 600 17px/1.3 var(--font-sans);
  letter-spacing: var(--tracking-tight);
  color: var(--color-white);
  text-wrap: balance;
}

.rowWhere {
  font: 500 13px/1.4 var(--font-sans);
  color: rgb(240 240 241 / 0.72);
}

.rowArea {
  margin-top: 4px;
}

@media (max-width: 899px) {
  .wrap {
    grid-template-columns: 1fr;
    row-gap: 40px;
  }

  .title {
    font-size: 30px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .count,
  [data-live]:not([data-arrived]) .count,
  [data-live][data-arrived] .count {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

- [ ] **Step 5: Write the component**

`components/home/Events.tsx`:

```tsx
'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Flat } from '@/components/materials/Flat';
import { AreaMark } from '@/components/site/AreaMark';
import { site } from '@/content/site.no';
import type { Event } from '@/lib/content';
import { timeLeft, writeDateTime, zonedTime } from '@/lib/dates';
import { Arrive } from './Arrive';
import styles from './events.module.css';
import { Scene } from './Scene';
import { Words } from './Words';

/**
 * Arrangementer as Neste, the owner's choice of 2026-09-17: on one navy plate the next
 * event is the statement — its date in a line, its title word by word at the vision's
 * size, its place and its area, and under it a count of the days, hours, minutes and
 * seconds until it starts, ticking. The two after it stand as small rows beside the
 * brief's paragraph. While nothing is coming: the honest line and the paragraph. The
 * home page shows three at most, as before.
 */

const t = site.pages.events;

/** «30.09», a row's short date. */
const ddmm = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;

/**
 * The time left to an event, ticking once a second. Nothing until mounted — the server
 * cannot know the visitor's now, and the two must agree at hydration. Under reduced
 * motion it is read once and stands.
 */
function Count({ event }: { event: Event }) {
  const [left, setLeft] = useState<ReturnType<typeof timeLeft> | null>(null);
  useEffect(() => {
    const at = zonedTime(event.start, event.time);
    const tick = () => setLeft(timeLeft(at - Date.now()));
    tick();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [event.start, event.time]);
  if (!left) return <dl className={styles.count} aria-hidden="true" />;
  const two = (n: number) => String(n).padStart(2, '0');
  const parts: [string, string][] = [
    [String(left.days), t.count.days],
    [two(left.hours), t.count.hours],
    [two(left.minutes), t.count.minutes],
    [two(left.seconds), t.count.seconds],
  ];
  return (
    <dl className={styles.count}>
      {parts.map(([value, label]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Events({ upcoming }: { upcoming: Event[] }) {
  const [next, ...rest] = upcoming.slice(0, 3);
  return (
    <Scene>
      <Flat tint="navy" className={styles.plate}>
        <Arrive as="div">
          <section id="arrangementer" aria-labelledby="arrangementer-tittel" className={styles.wrap}>
            <div className={styles.main}>
              <h2 id="arrangementer-tittel" className={styles.name} data-prose>{t.title}</h2>
              {next ? (
                <>
                  <p className={styles.when} data-prose>{writeDateTime(next.start, next.time)}</p>
                  <h3 className={styles.title}><Words text={next.title} /></h3>
                  <p className={styles.place} data-prose>{next.place}</p>
                  {next.area && <p className={styles.area} data-prose><AreaMark area={next.area} /></p>}
                  <Count event={next} />
                </>
              ) : (
                <p className={styles.text} data-prose>{t.emptyUpcoming}</p>
              )}
            </div>
            <div className={styles.side}>
              <p className={styles.text} data-prose>{t.description}</p>
              {rest.length > 0 && (
                <ol className={styles.rows}>
                  {rest.map((e, i) => (
                    <li key={e.slug} className={styles.row} data-card style={{ '--i': i + 1 } as CSSProperties}>
                      <span className={styles.rowWhen}>{ddmm(e.start)}{e.time && ` · ${e.time}`}</span>
                      <h3 className={styles.rowWhat}>{e.title}</h3>
                      <span className={styles.rowWhere}>{e.place}</span>
                      {e.area && <span className={styles.rowArea}><AreaMark area={e.area} /></span>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </Arrive>
      </Flat>
    </Scene>
  );
}
```

- [ ] **Step 6: Run the test**

Run: `npx vitest run components/home/Events.test.tsx && npx tsc --noEmit && npx eslint components/home/Events.tsx`
Expected: PASS. If `getByText('Dialog')` finds two elements, the AreaMark renders the name once — check the test's fixture (only the first event has an area).

- [ ] **Step 7: Commit**

```bash
git add components/home/Events.tsx components/home/events.module.css components/home/Events.test.tsx components/site/mark.module.css
git commit -m "Neste: the next event as the statement on navy, the count under it, the two after it beside"
```

---

### Task 10: The page

**Files:**
- Modify: `components/home/Sections.tsx`, `components/home/sections.module.css`
- Modify: `app/(site)/page.tsx`, `app/(site)/page.test.tsx`
- Modify: `content/site.no.ts` (delete `pages.home.more`)
- Modify: `e2e/pages.spec.ts` (delete the three lines that read `site.pages.home.more`; the full rewrite is Task 11)
- Delete: `components/home/Thread.tsx`, `components/home/thread.module.css`, `components/home/home.module.css`

**Interfaces:**
- Consumes: `Mosaic`, `Seal`, `Events`, `Scene`, `Flat`, `Arrive`, `styles.stage` from `scene.module.css`.
- Produces: the home page; `OmOss()`, `People({ people })`, `Support()` from `Sections.tsx`; `Collections` type unchanged.

- [ ] **Step 1: Rewrite the page test**

Replace `app/(site)/page.test.tsx` with:

```tsx
import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import Home from './page';

describe('Hjem', () => {
  test('one h1, the brief’s; the four fields of water first, each a link to its section of Vårt arbeid; then Visjon and Misjon as a seal on navy', () => {
    const { container } = render(<Home />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);

    const areas = screen.getByRole('region', { name: site.pages.home.areasLabel });
    expect(areas.querySelectorAll('[data-material="water"]')).toHaveLength(4);
    for (const a of brief.areas) {
      const link = screen.getByRole('link', { name: a.name });
      expect(link).toHaveAttribute('href', `/vart-arbeid#${a.key}`);
      expect(areas).toContainElement(link);
      expect(screen.getByText(a.text)).toBeInTheDocument();
    }

    for (const [id, label, text] of [['visjon', site.pages.home.visionLabel, brief.vision], ['misjon', site.pages.home.missionLabel, brief.mission]] as const) {
      const section = container.querySelector(`section#${id}`) as HTMLElement;
      const name = within(section).getByRole('heading', { level: 2, name: label });
      expect(section).toHaveAttribute('aria-labelledby', name.id);
      expect(within(section).getByText(text.headline)).toBeInTheDocument();
      expect(within(section).getByText(text.paragraph)).toBeInTheDocument();
      expect(section.closest('[data-material]')).toHaveAttribute('data-material', 'flat');
    }
    // The fields come before the seal.
    const order = [...container.querySelectorAll('[data-fields], section#visjon')];
    expect(order[0]).toHaveAttribute('data-fields');

    // Four waters, three flat navy plates: the seal, Arrangementer, Støtt oss. No ink anywhere.
    expect(container.querySelectorAll('[data-material="water"]')).toHaveLength(4);
    const flats = container.querySelectorAll('[data-material="flat"]');
    expect(flats).toHaveLength(3);
    flats.forEach((f) => expect(f).toHaveAttribute('data-ground', 'navy'));
    expect(container.querySelector('[data-material="ink"]')).toBeNull();
  });

  test('then the rest of the site, in order: Om oss, Arrangementer, Menneskene bak, Støtt oss — no labels, no links under them, the lists honest while empty', () => {
    const { container } = render(<Home />);
    const t = site.pages;
    const ids = [...container.querySelectorAll('section[id]')].map((s) => s.id);
    expect(ids.slice(-4)).toEqual(['om-oss', 'arrangementer', 'menneskene-bak', 'stott-oss']);
    expect(ids).not.toContain('ressurser');

    const about = container.querySelector('section#om-oss') as HTMLElement;
    const aboutTitle = within(about).getByRole('heading', { level: 2, name: brief.about.title });
    expect(about).toHaveAttribute('aria-labelledby', aboutTitle.id);
    expect(aboutTitle).toHaveAttribute('data-title');
    expect(about).toHaveTextContent(brief.about.paragraphs[0]);
    expect(about).toHaveTextContent(brief.about.paragraphs[1]);
    expect(about.querySelectorAll('[data-area]')).toHaveLength(4);
    expect(within(about).queryAllByRole('link')).toHaveLength(0);

    const events = container.querySelector('section#arrangementer') as HTMLElement;
    expect(within(events).getByRole('heading', { level: 2, name: t.events.title })).toBeInTheDocument();
    expect(events).toHaveTextContent(t.events.emptyUpcoming);
    expect(events.closest('[data-material]')).toHaveAttribute('data-material', 'flat');

    const people = container.querySelector('section#menneskene-bak') as HTMLElement;
    const peopleTitle = within(people).getByRole('heading', { level: 2, name: brief.people.title });
    expect(people).toHaveAttribute('aria-labelledby', peopleTitle.id);
    expect(people).toHaveTextContent(brief.people.paragraph);
    expect(people).toHaveTextContent(t.people.empty);
    expect(within(people).queryAllByRole('link')).toHaveLength(0);

    const support = container.querySelector('section#stott-oss') as HTMLElement;
    expect(within(support).getByRole('heading', { level: 2, name: t.support.title })).toBeInTheDocument();
    expect(within(support).getByRole('link', { name: site.cta.support.label })).toHaveAttribute('href', site.cta.support.href);
    expect(support).toHaveTextContent(site.support.vipps.value);
    expect(support.closest('[data-material]')).toHaveAttribute('data-material', 'flat');

    // Nothing of the thread or its knots, no eyebrow labels.
    expect(container.querySelector('canvas[data-thread-canvas]')).toBeNull();
    expect(container.querySelectorAll('[data-knot], [data-knot-at]')).toHaveLength(0);
    // Every section after the hero arrives: the white ones are arrivals themselves, the plates hold one.
    expect(container.querySelectorAll('[data-arrive]').length).toBeGreaterThanOrEqual(6);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run "app/(site)/page.test.tsx"`
Expected: FAIL (the old page has ink, the thread, the links, `#ressurser`).

- [ ] **Step 3: The sections**

Replace `components/home/Sections.tsx` with:

```tsx
import Link from 'next/link';
import { Flat } from '@/components/materials/Flat';
import { Frame } from '@/components/materials/Frame';
import { MarkedLine } from '@/components/site/AreaMark';
import page from '@/components/site/page.module.css';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import type { Event, Person, Resource } from '@/lib/content';
import { Arrive } from './Arrive';
import { Scene } from './Scene';
import styles from './sections.module.css';

/**
 * The rest of the site on the home page, in the guide's rhythm of material and white by
 * turns: Om oss on white, Menneskene bak on white, Støtt oss as the pen-framed card on a
 * navy plate that opens. Each is the page's own words (the brief's) and its honest line
 * while a collection is empty; the title is the section's name and the menu is the way
 * on — no labels over the titles, no links under the sections. Each section arrives
 * (`Arrive`): the title rises out of its line, then the copy.
 */

export type Collections = { upcoming: Event[]; resources: Resource[]; people: Person[] };

const t = site.pages;

export function OmOss() {
  return (
    <Arrive as="section" id="om-oss" className={styles.white} aria-labelledby="om-oss-tittel">
      <h2 id="om-oss-tittel" className={styles.title} data-title>{brief.about.title}</h2>
      <div className={styles.prose} data-prose>
        <p>{brief.about.paragraphs[0]}</p>
        <p><MarkedLine text={brief.about.paragraphs[1]} /></p>
      </div>
    </Arrive>
  );
}

export function People({ people }: Pick<Collections, 'people'>) {
  return (
    <Arrive as="section" id="menneskene-bak" className={styles.white} aria-labelledby="menneskene-bak-tittel">
      <h2 id="menneskene-bak-tittel" className={styles.title} data-title>{brief.people.title}</h2>
      <div data-prose>
        <p className={page.lede}>{brief.people.paragraph}</p>
        {people.length ? (
          <ul className={styles.list}>
            {people.slice(0, 4).map((p) => (
              <li key={p.slug} className={styles.item}>
                <h3>{p.name}</h3>
                <p className={styles.meta}>{p.role}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>{t.people.empty}</p>
        )}
      </div>
    </Arrive>
  );
}

/** Støtt oss on a navy plate: the two numbers, bracketed until the foundation has them, and the brief's button. */
export function Support() {
  return (
    <Scene>
      <Flat tint="navy" className={`${styles.plate} ${styles.centre}`}>
        <Arrive as="div">
          <section id="stott-oss" aria-labelledby="stott-oss-tittel" className={styles.cardSection} data-card>
            <Frame legend={t.support.title} legendId="stott-oss-tittel" level="h2" className={styles.card}>
              <dl className={styles.facts}>
                <div>
                  <dt>{site.support.vipps.label}</dt>
                  <dd>{site.support.vipps.value}</dd>
                </div>
                <div>
                  <dt>{site.support.account.label}</dt>
                  <dd>{site.support.account.value}</dd>
                </div>
              </dl>
              <p className={styles.more}>
                <Link href={site.cta.support.href} prefetch={false} className={styles.buttonCrimson}>{site.cta.support.label}</Link>
              </p>
            </Frame>
          </section>
        </Arrive>
      </Flat>
    </Scene>
  );
}
```

In `components/home/sections.module.css`:
- Replace the `.white` and `.title` rules with:

```css
.white {
  padding: 72px var(--margin) 24px;
  max-width: calc(var(--measure) + 2 * var(--margin) + 200px);
  scroll-margin-top: calc(var(--header-h) + 16px);
}

.title {
  font-size: clamp(36px, 4.8vw, 62px);
  max-width: 18ch;
}
```

- Delete the `.plates` rule (the scene's `.stage` replaces it), the `.pair` rule and its 899px media rule, the `.link`, `.link:hover`, `.linkOnCard`, `.linkOnCard:hover` rules; in the shared `.link, .linkOnCard, .buttonCrimson` rule keep only `.buttonCrimson` as its selector (and in the reduced-motion rule at the end). Keep `.plate`, `.cardSection`, `.card`, `.centre .card`, `.list`, `.item`, `.meta`, `.empty`, `.facts`, `.more`, `.buttonCrimson`.
- In the 699px media rule replace `.white { padding: 44px var(--margin) 8px; }` with `.white { padding: 48px var(--margin) 12px; }`.

- [ ] **Step 4: The page**

Replace `app/(site)/page.tsx` with:

```tsx
import { Events } from '@/components/home/Events';
import { Hero } from '@/components/home/Hero';
import { Mosaic } from '@/components/home/Mosaic';
import styles from '@/components/home/scene.module.css';
import { Seal } from '@/components/home/Seal';
import { OmOss, People, Support } from '@/components/home/Sections';
import { getEvents, getPeople, splitEvents, todayISO } from '@/lib/content';

/**
 * Hjem: the whole site in one page. The film inside the mark with the brief's main text
 * (2) and its two buttons; the four areas (6) as four fields of water, one mosaic; Visjon
 * and Misjon (3, 4) as a seal on navy; Om oss (5) on white; Arrangementer as the next
 * event on navy; Menneskene bak (7) on white; Støtt oss on navy. Every plate is laid out
 * at the page's full width and opens to the screen as it is read (`Scene`); every section
 * arrives as the tip line reaches it (`Arrive`). The menu is the way on from each.
 */
export default function Home() {
  const { upcoming } = splitEvents(getEvents(), todayISO());
  return (
    <>
      <Hero />
      <div className={styles.stage}>
        <Mosaic />
        <Seal />
      </div>
      <OmOss />
      <div className={styles.stage}>
        <Events upcoming={upcoming} />
      </div>
      <People people={getPeople()} />
      <div className={styles.stage}>
        <Support />
      </div>
    </>
  );
}
```

- [ ] **Step 5: The deletions and the content**

```bash
git rm -q components/home/Thread.tsx components/home/thread.module.css components/home/home.module.css
```

In `content/site.no.ts` delete the `more` block from `pages.home` (the comment line and the five lines of the object). In `e2e/pages.spec.ts` delete the three lines beginning `const more = site.pages.home.more;` through the closing `}` of its `for` loop (lines ~40–43); Task 11 rewrites the test.

Check nothing else names them:

```bash
grep -rn -E "home\.more|Thread|home\.module\.css|data-knot" --include=*.ts --include=*.tsx --include=*.css . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.claude
```

Expected: no matches outside `docs/` (the footer's `[data-thread]` is a different attribute and stays).

- [ ] **Step 6: Run everything**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: all green. `Hero.test.tsx` still passes (the hero is untouched). If `page.test.tsx`'s `[data-arrive]` count is below 6, count what renders: Mosaic (1), Seal (1), Om oss (1), Events (1), People (1), Support (1) = 6.

- [ ] **Step 7: Build**

Run: `rm -rf .next/dev; npm run build`
Expected: the build passes (the content check first, then Next). A stale `.next/dev/types` from an earlier dev run breaks the type step — hence the `rm`.

- [ ] **Step 8: Commit**

```bash
git add app/(site)/page.tsx app/(site)/page.test.tsx components/home/Sections.tsx components/home/sections.module.css content/site.no.ts e2e/pages.spec.ts
git commit -m "the home page rebuilt: the mosaic, the seal, Om oss, Neste, Menneskene bak, Støtt oss on navy; the thread, the labels, the links and Ressurser gone"
```

(The `git rm` from Step 5 is already staged.)

---

### Task 11: e2e

**Files:**
- Modify: `e2e/pages.spec.ts` (the home test, lines ~13–53)

- [ ] **Step 1: Rewrite the home test**

Replace the first test in `e2e/pages.spec.ts` (from `test('the home page is the name alone…` to its closing `});`) with:

```ts
test('the home page is the name alone, and carries the brief’s main text, the four areas, Visjon and Misjon as a seal, and the rest of the site', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(site.name);
  expect(await page.locator('html').getAttribute('lang')).toBe('nb');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', brief.home.paragraph);
  await expect(page.locator('h1')).toHaveText(brief.home.headline);
  await expect(page.getByText(brief.home.paragraph, { exact: true })).toBeVisible();
  const main = page.getByRole('main');
  await expect(main.getByRole('link', { name: site.cta.work.label })).toHaveAttribute('href', site.cta.work.href);
  // Støtt oss is a button twice on the page: under the hero's text and in its own section at the foot.
  await expect(main.getByRole('link', { name: site.cta.support.label }).first()).toHaveAttribute('href', site.cta.support.href);
  await expect(main.getByRole('link', { name: site.cta.support.label })).toHaveCount(2);
  // four fields of water first, each on its area's ground
  const fields = main.locator('[data-fields] [data-material="water"]');
  await expect(fields).toHaveCount(4);
  await expect(fields.nth(0)).toHaveAttribute('data-ground', 'navy');
  await expect(fields.nth(3)).toHaveAttribute('data-ground', 'crimson');
  for (const a of brief.areas) {
    await expect(main.getByRole('link', { name: a.name, exact: true }).first()).toHaveAttribute('href', `/vart-arbeid#${a.key}`);
  }
  // Visjon and Misjon as a seal on a flat navy plate: the ring, the four names twice round it, the words verbatim
  await expect(main.getByText(brief.vision.headline, { exact: true })).toBeAttached();
  await expect(main.getByText(brief.vision.paragraph, { exact: true })).toBeAttached();
  await expect(main.getByText(brief.mission.headline, { exact: true })).toBeAttached();
  await expect(main.getByText(brief.mission.paragraph, { exact: true })).toBeAttached();
  const seal = main.locator('section#visjon svg');
  await expect(seal.locator('circle')).toHaveCount(2);
  for (const a of brief.areas) expect(await seal.locator('textPath').textContent()).toContain(a.name);
  await expect(main.locator('[data-material="flat"][data-ground="navy"]')).toHaveCount(3);
  await expect(main.locator('[data-material="ink"]')).toHaveCount(0);
  // then the rest of the site: four sections in order, no links under them, the lists honest while empty
  const ids = await main.locator('section[id]').evaluateAll((els) => els.map((e) => e.id));
  expect(ids.slice(-4)).toEqual(['om-oss', 'arrangementer', 'menneskene-bak', 'stott-oss']);
  expect(ids).not.toContain('ressurser');
  await expect(main.locator('section#om-oss a, section#menneskene-bak a')).toHaveCount(0);
  await expect(main.getByText(site.pages.events.emptyUpcoming, { exact: true })).toBeAttached();
  await expect(main.getByText(site.pages.people.empty, { exact: true })).toBeAttached();
  // nothing of the thread
  await expect(main.locator('canvas[data-thread-canvas]')).toHaveCount(0);
  // the seal's plate opens as it passes the middle of the screen, and Om oss arrives as the tip line reaches it
  const plate = main.locator('section#visjon').locator('xpath=ancestor::*[@data-material][1]');
  await plate.evaluate((el) => {
    const r = el.getBoundingClientRect();
    window.scrollTo(0, window.scrollY + r.top + r.height / 2 - window.innerHeight / 2);
  });
  await expect.poll(async () => Number(await plate.evaluate((el) => (el.parentElement as HTMLElement).style.getPropertyValue('--open')))).toBeGreaterThan(0.97);
  expect(await plate.evaluate((el) => getComputedStyle(el).clipPath)).toMatch(/inset\(0(px)? 0px round 0px\)|inset\(0px\)|none/);
  await main.locator('section#om-oss').evaluate((el) => window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - window.innerHeight * 0.5));
  await expect(main.locator('section#om-oss')).toHaveAttribute('data-arrived', '');
  // the first field's link lands on its band
  await page.evaluate(() => window.scrollTo(0, 0));
  await main.getByRole('link', { name: brief.areas[1].name, exact: true }).click();
  await expect(page).toHaveURL(/\/vart-arbeid#dialog$/);
  await expect(page.locator('#dialog')).toBeInViewport();
});
```

If the computed `clipPath` string differs (browsers serialise `inset(0 0px round 0px)` variously), read `--open` alone and drop the `clipPath` line — the number is the proof.

- [ ] **Step 2: Make sure nothing is on port 3000, then run the suite**

Run (PowerShell): `Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue` — expected nothing. If something listens, find it with `Get-CimInstance Win32_Process | ? { $_.Name -eq 'node.exe' -and $_.CommandLine -match '3000' }` and stop it (read the command line first). Then:

Run: `npx playwright test`
Expected: all pass (previously 41 passed / 3 skipped; the same shape). The first run builds and starts the server itself (up to 180 s). If the JS-off test fails on the home page, something is gated on `[data-arrived]` without `[data-live]` — find it with `grep -rn "\[data-arrived\]" components/home/*.css | grep -v "data-live"`.

- [ ] **Step 3: Commit**

```bash
git add e2e/pages.spec.ts
git commit -m "e2e: the home page as it is now — the fields, the seal, the sections in order, a plate that opens, a section that arrives"
```

---

### Task 12: On the running page, Lighthouse, the PR

**Files:**
- Scripts in the session scratchpad only (nothing new in the repo).

- [ ] **Step 1: Serve the build on 3030**

The old 3030 server serves `aa863ca` from this worktree's previous build. Stop it (PowerShell, read the command lines first):

```powershell
Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match '3030' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

Confirm `Get-NetTCPConnection -LocalPort 3030 -State Listen` is empty, then from the worktree: `npm run build` (already built in Task 10 if nothing changed since — rebuild anyway after Task 11's changes to be sure), then in the background `npx next start -p 3030`.

- [ ] **Step 2: Shoot it**

Write `tour.mjs` in the scratchpad (Playwright from this worktree's `node_modules`, `chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu', '--disable-gpu-sandbox'] })`). For each of 1440×900 (DPR 2), 1024×768, 768×1024, 390×844 (DPR 3, `isMobile`, `hasTouch`): go to `http://localhost:3030/`, wait `networkidle` + 800 ms, then for each of `[data-fields]`, `section#visjon`, `section#om-oss`, `section#arrangementer`, `section#menneskene-bak`, `section#stott-oss`: find its plate (`closest('[data-material]')` or itself for the white ones), approach in steps of 40 % of the viewport so the arrivals fire, centre it (or put its top at 40 px if taller than the viewport), wait 3000 ms, screenshot to `shots/tour-<w>/<n>-<id>.png`. Collect `pageerror` and console errors; print them. Also at 1440: mid-arrival frames of the seal (land its plate's top at 40 % of the viewport in one jump, shoot at 250, 600, 1000, 1600, 2400 ms, jpeg) and of Neste; and one frame with reduced motion (`newContext({ reducedMotion: 'reduce' })`) of the seal to see it complete and inset.

Look at every frame (the images, not the file list). Fix what is wrong in the source, rebuild, re-shoot. Report what was fixed.

- [ ] **Step 3: rAF and the count**

In the same script, settled on the seal: `requestAnimationFrame` count over one second → expect ~60. On Neste with no events the plate shows the honest line; to see the count, this is the mock's `?eksempler` — not on the site. Confirm the count's `dl` is empty in the DOM when there are no events (`section#arrangementer dl` count 0).

- [ ] **Step 4: Lighthouse, alternated, on a quiet machine**

Check no Chrome of the owner's is on the site (`Get-CimInstance Win32_Process | ? { $_.Name -eq 'chrome.exe' } | select -First 3 CommandLine` — read, do not kill). Serve `aa863ca` beside the new build: `git worktree add ../iqra-foundation-base aa863ca` (detached), `npm ci` there, `npm run build`, `npx next start -p 3031` in the background. Create the output dir first (`mkdir` under `$SCRATCH/lh`). From **PowerShell** (Bash rewrites `/` paths): run `node scripts/dev/lighthouse.mjs 3031 iqra-foundation-base /` then `node scripts/dev/lighthouse.mjs 3030 iqra-foundation-mock /`, then both again (A B A B). Report the four performance scores, LCP and TBT (add TBT to the script's line if it is not printed: `j.audits['total-blocking-time'].numericValue`). A monotonic drift across the four runs means the machine was not quiet — say so and rerun; never quote a single run. Afterwards stop 3031 and `git worktree remove ../iqra-foundation-base`.

- [ ] **Step 5: The batch, then the push and the PR**

Before pushing, write down for the owner everything else you would change (the CLAUDE.md rule) — at least: the subpages' eyebrow labels (the same furniture the owner called slop, out of scope here), and anything the shots showed. Then:

```bash
git push origin feat/den-rode-traden
gh pr view 35 --json changedFiles,additions,deletions,commits --jq '{files: .changedFiles, add: .additions, del: .deletions, commits: (.commits | length)}'
```

Check the numbers match this branch's own history (`git log --oneline main..HEAD | wc -l`). Then rewrite the PR's title and body (`gh pr edit 35 --title "…" --body-file <file>`; write the body to a file in the scratchpad first — an inline heredoc mangles backticks): the title «Scenene, Seglet og Neste: the home page rebuilt», the body the record — the decisions, the page in order, the system in a paragraph each, the proof (tests, e2e, shots, the Lighthouse pairs), what is stand-in, what was left out and why, ending with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

- [ ] **Step 6: Memory**

Write the memory note for the build (what shipped, the numbers, what the owner still has to decide, where the servers are) and update `MEMORY.md`'s index line; update `iqra-alvor-runden.md`'s handoff as resolved.

---

## Self-review

**Spec coverage.** The scene (Task 4), the arrival (Task 3), the words (Task 5), the flat plate (Task 2), calm water + Box + lazy ink + Fields/Bands (Task 1), the mosaic (Task 6), the seal (Task 7), dates + labels (Task 8), Neste + the mark on dark (Task 9), the white sections, Støtt oss, the page, the deletions, the content (Task 10), e2e (Task 11), shots/Lighthouse/PR/memory (Task 12). The spec's «Every state a plate hides is gated on data-live» is in every sheet (arrive, words, seal, events). Reduced motion is in every sheet and every hook. Contrast numbers are the spec's. Assumptions 1–6 are carried: calm on bands (Task 1), labels (Task 8), Oslo time (Task 8), Støtt oss flat navy (Task 10), Ressurser gone (Task 10), ink lazy (Task 1).

**Placeholders.** None: every step has its code or its exact command.

**Type consistency.** `onMaterial(live: InkHandle | WaterHandle)` on Box; `onMaterial(key: AreaKey, live)` on Fields; `Mosaic` stores `Partial<Record<AreaKey, InkHandle | WaterHandle>>` and calls `.stir(0.5, 0.5)` (WaterHandle.stir(x, y); InkHandle has the same signature — check `lib/ink.ts:69` before Task 6 and narrow to `WaterHandle` in Mosaic if it does not). `zonedTime(iso, time | null, zone?)` and `timeLeft(ms)` as used in `Events`. `Words({ text })` in Seal and Events. `Arrive({ as, ...HTMLAttributes })` used with `id`/`aria-labelledby`/`className` in Sections. `styles.stage` and `styles.mosaic` from `scene.module.css` in page.tsx and Mosaic.tsx.
