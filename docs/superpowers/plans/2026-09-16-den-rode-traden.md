# Den røde tråden Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Iqra Foundation site as one direction: A's materials, C's shell, and the four areas carried by water in their own colours wherever they appear, ending in one PR left unmerged.

**Architecture:** Next 16 app router, static pages; the ink and water are WebGL2 simulations (`lib/ink.ts`, `lib/water.ts`) drawn into a `Box` over a CSS still; the four areas' colours are tokens in `app/globals.css` mapped once in `components/home/areas.ts`, with their water scenes in `lib/film.ts`. Content is the brief verbatim (`content/brief.no.ts`, held by a test) plus collections of JSON files read by `lib/content.ts` and written by Keystatic.

**Tech Stack:** Next 16, React 19, TypeScript, CSS modules + Tailwind 4 `@theme` tokens, vitest + Testing Library (jsdom), Playwright e2e, Keystatic, Lighthouse.

**Spec:** `docs/superpowers/specs/2026-09-16-den-rode-traden-design.md` — read it first; this plan argues from it.

## Global Constraints

- Work ONLY in the worktree `C:\Users\daodi\code\iqra-foundation-mock` on branch `feat/den-rode-traden`. Never touch `C:\Users\daodi\code\iqra-foundation` (main checkout), `..\iqra-foundation-identitet`, `..\iqra-foundation-dir-{a,b,c}`, `..\iqra-foundation-glatt`.
- Ports: serve on **3030** only. Never 3000/3001 except the e2e's own webServer (it takes 3000; check it is free first). Do not use `preview_start` (it serves the main checkout).
- Stage explicit paths (`git add <paths>`), never `git add -A` / `git add .`. Every commit ends with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. Do not push until the PR task; never merge.
- Copy: no invented content (no example event, name, date, number, photo). The brief's text is `content/brief.no.ts` and `content/brief.test.ts` fails if a word changes. New microcopy only in `content/site.no.ts`, plain bokmål, `islam` lower case, no em dashes, no arrows.
- Colour: every colour is a token in `app/globals.css` `@theme` or a tint added there; never a literal hex in a component. The only hexes outside are in `lib/film.ts` (the shaders need hexes) and `lib/pen.ts`.
- `backdrop-filter`: write ONLY the unprefixed property (Lightning CSS drops it if the `-webkit-` form is beside it).
- Every canvas is sized to devicePixelRatio (cap 2); nothing is drawn below screen resolution.
- Every animation honours `prefers-reduced-motion`; the page is complete with JavaScript off.
- Text contrast ≥ 4.5:1 on every ground, by computation, not by eye.
- Semantic HTML: one `<h1>` per page, sections with headings, named `<nav>` landmarks, links are links.
- Python that writes repo files: `open(p, 'w', newline='\n')`. Long heredocs in the Bash tool are unreliable: write scripts to files and run them.
- The four checks before every commit that touches code: `npx tsc --noEmit`, `npm run lint`, `npx vitest run`, `npm run build` (the last one at least at the end of each task).
- Read `AGENTS.md`: this Next version differs from training data; its docs are in `node_modules/next/dist/docs/`.

---

## File structure

| File | Responsibility |
|---|---|
| `lib/film.ts` | the materials' palettes: `brand.ink`, `brand.water`, `brand.floor`, and NEW `brand.areaWater` / `brand.areaFloor` (four scenes keyed by ground) |
| `lib/film.test.ts` | holds the palettes to the guide and to the tokens; extended for the four scenes |
| `app/globals.css` | tokens; NEW `--color-water-floor-light` |
| `components/home/areas.ts` | the one area map: key → ground token, type colours, logo variant, thread colour, NEW `tone`; `Area` type |
| `components/home/areas.test.ts` | every area of the brief has a look, a logo file, a scene |
| `components/home/Fields.tsx` NEW | the 2×2 water fields on the home page + `FieldBody` shared with the bands |
| `components/home/Bands.tsx` NEW | Vårt arbeid's four bands of water |
| `components/home/fields.module.css` NEW | the plate, the grid, the fields' stills per ground, the veil, the type, the bands |
| `components/home/Fields.test.tsx` NEW, `Bands.test.tsx` NEW | render tests |
| `components/site/AreaMark.tsx` NEW + `mark.module.css` NEW | the 10px square before an area's name; `MarkedLine` for a sentence with the four names |
| `components/site/AreaMark.test.tsx` NEW | |
| `lib/content.ts` | NEW `AREA_KEYS`, `AreaKey`, `area` on `Event` and `Resource` |
| `lib/content.test.ts` | extended for `area` |
| `keystatic.config.ts` | `area` select on arrangementer and ressurser |
| `app/(site)/layout.tsx` NEW | the shell; `app/layout.tsx` keeps html/body/fonts/metadata only |
| `app/(site)/…` | every site route moves in; `app/not-found.tsx` stays at the root and renders the shell itself |
| `app/(site)/page.tsx`, `app/(site)/vart-arbeid/page.tsx`, `app/(site)/om-oss/page.tsx`, `app/(site)/arrangementer/page.tsx`, `app/(site)/ressurser/page.tsx` | use Fields, Bands, MarkedLine, AreaMark |
| `e2e/pages.spec.ts`, `e2e/shell.spec.ts` | extended |
| `app/mock/`, `components/mock/` | DELETED at the end |
| `README.md` | the area field |

---

### Task 1: The branch, and the base merged in

**Files:**
- Branch: `feat/den-rode-traden` from `mock/materialer` (commit `d94c188` or later) in `C:\Users\daodi\code\iqra-foundation-mock`
- Merge: `feat/identitet-og-struktur` (`beaa054`)

**Interfaces:**
- Produces: a branch where `lib/content.test.ts`, `content/collections.test.ts`, `lib/dates.test.ts`, `e2e/*.spec.ts`, `scripts/dev/*.mjs` (from the base) coexist with A's materials, C's shell and the mock.

- [ ] **Step 1: Confirm the worktree is clean and no server holds a port you need**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && git status --porcelain | wc -l && git log --oneline -1 && netstat -ano | grep -E ':30(00|30) ' | grep LISTEN || echo "3000 and 3030 free"
```
Expected: `0`, the mock branch's tip, and `3000 and 3030 free`. If 3024 is still held by the mock's server it does not matter for this task.

- [ ] **Step 2: Create the branch**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && git checkout -b feat/den-rode-traden && git branch --show-current
```

- [ ] **Step 3: Merge the base**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && git merge --no-edit feat/identitet-og-struktur 2>&1 | tail -20
```
Expected: a merge commit, or a short conflict list. The base's commits after `b5288ff` add `lib/content.test.ts`, `lib/dates.test.ts`, `content/collections.test.ts`, `e2e/pages.spec.ts`, `e2e/shell.spec.ts`, `scripts/dev/{contrast,keystatic-create,lighthouse,shoot}.mjs`, `scripts/share-image.mjs`, `app/opengraph-image.png` + `.alt.txt`, the five briefs under `docs/superpowers/specs/2026-09-15-identitet-retninger/`, and modify `README.md` and `.gitignore`. None of those exist on the mock branch, so a conflict is unlikely. If `README.md` or `.gitignore` conflicts, keep BOTH sides' hunks (they are additions), then `git add README.md .gitignore && git commit --no-edit`.

- [ ] **Step 4: Run the four checks**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && npx tsc --noEmit; echo "tsc $?"; npm run lint 2>&1 | tail -3; npx vitest run 2>&1 | tail -6; npm run build 2>&1 | grep -E "error|✓ Compiled|exit"; echo "build $?"
```
Expected: tsc 0, lint 0, vitest all passed (about 24 files; the base's 3 test files plus the branch's 18 plus the mock's), build clean with `/mock` in the route list.

If `lib/content.test.ts` or the others fail because of the branch: read the failure; the base's tests were green on `beaa054` and the branch changed no `lib/content.ts`, so a failure is a merge mistake, not a design change.

- [ ] **Step 5: Commit is the merge commit; nothing more to add. Record the tip**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && git log --oneline -3
```

---

### Task 2: The four water scenes and the area map

**Files:**
- Modify: `lib/film.ts` (add `AreaGround`, `AREA_WATER`, `brand.areaWater`, `brand.areaFloor`)
- Modify: `lib/film.test.ts` (the keys test; new tests)
- Modify: `app/globals.css` (`--color-water-floor-light`)
- Modify: `components/home/areas.ts` (`tone`, `scene`, `floor` on `Area`; `AreaKey` from `lib/content`)
- Modify: `components/home/areas.test.ts`
- Modify: `lib/content.ts` (`AREA_KEYS`, `AreaKey` — the type moves here so `lib/` does not import `components/`)

**Interfaces:**
- Produces: `brand.areaWater: Record<AreaGround, WaterScene>`, `brand.areaFloor: Record<AreaGround, WaterFloor>`, `type AreaGround = 'navy' | 'turquoise' | 'light' | 'crimson'` (from `lib/film.ts`); `AREA_KEYS: readonly AreaKey[]`, `type AreaKey = 'kunnskap' | 'dialog' | 'moteplasser' | 'samfunnsdeltakelse'` (from `lib/content.ts`); `areas: readonly Area[]` where `Area` has `key, name, text, ground: AreaGround, token, ink, headingInk, ring, onNavy, tone: 'light' | 'dark', number, href` (from `components/home/areas.ts`).

- [ ] **Step 1: Write the failing tests in `lib/film.test.ts`**

Replace the first test (`the draft’s five scenes are gone…`) and append the area tests. Edit with a script (`scratchpad/task2-film-test.py`), or by hand:

```ts
// replace:
test('the draft’s five scenes are gone: one ink, one water, and the water’s floor', () => {
  expect(Object.keys(brand)).toEqual(['ink', 'water', 'floor']);
});
// with:
test('one ink, one water, its floor, and the four areas’ water', () => {
  expect(Object.keys(brand)).toEqual(['ink', 'water', 'floor', 'areaWater', 'areaFloor']);
  expect(Object.keys(brand.areaWater)).toEqual(['navy', 'turquoise', 'light', 'crimson']);
});
```

Append at the end of the file:

```ts
/* ----- the areas’ water ----- */

/** The veil under a field's words: the ground at this alpha over the water (fields.module.css). */
const VEIL = 0.82;
const over = (top: string, alpha: number, under: string) => toHex(rgb(top).map((v, i) => v * alpha + rgb(under)[i] * (1 - alpha)));

test('Dialog’s water is the brand’s water itself', () => {
  expect(brand.areaWater.turquoise).toBe(brand.water);
  expect(brand.areaFloor.turquoise.ground).toBe(brand.floor.ground);
});

test('navy and crimson are night water: the ground is the colour itself, the pools add light', () => {
  for (const g of ['navy', 'crimson'] as const) {
    expect(brand.areaWater[g].night).toBe(true);
    expect(brand.areaWater[g].pale).toBe(FIVE[g]);
    expect(brand.areaWater[g].deep).toBe(FIVE[g]);
    expect(brand.areaFloor[g].ground).toBe(FIVE[g]);
    for (const [hex] of brand.areaWater[g].pools) expect(lum(hex), hex).toBeGreaterThan(190);
  }
});

test('light is pale water: the floor at the page’s depth is #f7f7f8, and the token carries it', () => {
  expect(brand.areaWater.light.night).toBeFalsy();
  expect(brand.areaWater.light.deep).toBe(FIVE.light);
  expect(brand.areaFloor.light.ground).toBe('#f7f7f8');
  expect(floorAt(brand.areaWater.light, WATER_DEPTH).ground).toBe('#f7f7f8');
  expect(GLOBALS).toContain(`--color-water-floor-light: ${brand.areaFloor.light.ground};`);
});

test('every colour in the areas’ water is one of the five or a tint of one, and no scene holds more pools than the shader', () => {
  for (const scene of Object.values(brand.areaWater)) {
    for (const h of [scene.pale, scene.deep, ...scene.pools.map(([h]) => h)]) expect(traceable(h), h).toBe(true);
    expect(scene.pools.length).toBeLessThanOrEqual(POOL_LIMIT);
  }
});

/**
 * The words sit on the veil (the ground at 0.82 over the water); the darkest point under
 * them is the floor with the strongest pool over it. Light type on navy and crimson, navy
 * type on turquoise and light: each clears 4.5:1 there. Without the veil, the raw floor
 * still clears 3:1, so a device that paints the still and no veil is readable.
 */
test('the fields’ type clears 4.5:1 on the veil and 3:1 on the raw floor', () => {
  // White on crimson, not the light: the light is 4.4:1 on crimson and white 5.1:1 (materials.module.css sets it).
  const type = { navy: '#f0f0f1', crimson: '#ffffff', turquoise: FIVE.navy, light: FIVE.navy } as const;
  for (const g of ['navy', 'turquoise', 'light', 'crimson'] as const) {
    const floor = brand.areaFloor[g];
    const strongest = [...floor.pools].sort((a, b) => b[4] - a[4])[0];
    const darkest = over(strongest[0], strongest[4], floor.ground);
    expect(contrast(type[g], over(floor.ground, VEIL, darkest)), `${g} on the veil`).toBeGreaterThanOrEqual(4.5);
    expect(contrast(type[g], darkest), `${g} raw`).toBeGreaterThanOrEqual(3);
  }
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && npx vitest run lib/film.test.ts 2>&1 | tail -15
```
Expected: FAIL — `brand.areaWater` undefined / keys mismatch.

- [ ] **Step 3: Add the scenes to `lib/film.ts`**

After the `WATER_DEPTH` export and before `export const brand`, add:

```ts
/** The four grounds an area can own: the tokens `--color-area-*` in globals.css, by name. */
export type AreaGround = 'navy' | 'turquoise' | 'light' | 'crimson';

/**
 * Water in the four areas' colours, keyed by the ground the area owns
 * (`components/home/areas.ts` says which area owns which). Navy and crimson are night
 * water: the ground is the colour itself, the depth ramp does not run, and the pools add
 * light (turquoise-mid and the light on navy; the light on crimson). Turquoise is the
 * brand's water. Light is the palest: white a sixth into the light, deepening to the light
 * itself, the brand water's pools. The pool geometry is the brand water's, so four fields
 * side by side read as one body of water in four colours.
 */
const AREA_WATER: Record<AreaGround, WaterScene> = {
  navy: {
    pale: '#2c394b',
    deep: '#2c394b',
    night: true,
    pools: [
      ['#a3dad8', 0.2, 0.82, 0.5, 0.35],
      ['#f0f0f1', 0.8, 0.22, 0.42, 0.14],
      ['#a3dad8', 0.58, 0.62, 0.5, 0.28],
    ],
  },
  turquoise: WATER,
  light: {
    pale: '#fdfdfd',
    deep: '#f0f0f1',
    pools: WATER.pools,
  },
  crimson: {
    pale: '#ab5261',
    deep: '#ab5261',
    night: true,
    pools: [
      ['#f0f0f1', 0.2, 0.82, 0.5, 0.35],
      ['#f0f0f1', 0.8, 0.22, 0.42, 0.14],
      ['#f0f0f1', 0.58, 0.62, 0.5, 0.28],
    ],
  },
};

const AREA_FLOOR: Record<AreaGround, WaterFloor> = {
  navy: floorAt(AREA_WATER.navy, WATER_DEPTH),
  turquoise: floorAt(AREA_WATER.turquoise, WATER_DEPTH),
  light: floorAt(AREA_WATER.light, WATER_DEPTH),
  crimson: floorAt(AREA_WATER.crimson, WATER_DEPTH),
};
```

Change the import line to `import { floorAt, type WaterFloor, type WaterScene } from './water';` and the export to:

```ts
export const brand = {
  ink: INK,
  water: WATER,
  /** The water resolved at the page's depth: what `createWater` is handed. */
  floor: floorAt(WATER, WATER_DEPTH),
  areaWater: AREA_WATER,
  areaFloor: AREA_FLOOR,
} as const;
```

Update the file's header comment: the draft's scenes are gone; what is left is one ink, one water, and the four areas' water.

- [ ] **Step 4: Add the token to `app/globals.css`**

After `--color-water-floor: #addddc;` add:

```css
  /* The light area's water at the page's depth: white a sixth into the light, then 45% towards it (`brand.areaFloor.light`). */
  --color-water-floor-light: #f7f7f8;
```

- [ ] **Step 5: Run the film tests**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && npx vitest run lib/film.test.ts 2>&1 | tail -8
```
Expected: PASS. If the contrast test fails for `light` (navy type on a near-white floor cannot fail) or `turquoise` (navy on #addddc under the veil: the veil is the floor colour itself, so this is navy on ~#addddc ≈ 5.6:1) read the numbers it prints before changing anything.

- [ ] **Step 6: Move `AreaKey` to `lib/content.ts` and extend the area map**

In `lib/content.ts`, after the `Picture` type:

```ts
/** The four areas' keys, from the brief; an event or a resource may carry one. */
export const AREA_KEYS = brief.areas.map((a) => a.key) as readonly AreaKey[];
export type AreaKey = (typeof brief.areas)[number]['key'];
```
with `import { brief } from '@/content/brief.no';` at the top.

In `components/home/areas.ts`:
- replace `export type AreaKey = (typeof brief.areas)[number]['key'];` with `import { type AreaKey } from '@/lib/content'; export type { AreaKey };`
- replace `export type AreaGround = Extract<Ground, 'navy' | 'turquoise' | 'light' | 'crimson'>;` with `import { brand, type AreaGround } from '@/lib/film'; export type { AreaGround };` (keep the `Ground` import only if still used; otherwise remove it)
- extend the `Area` type and the map:

```ts
export type Area = (typeof brief.areas)[number] & AreaLook & {
  /** «01» to «04», the brief's order. */
  number: string;
  /** Where the area is read in full. */
  href: `/vart-arbeid#${AreaKey}`;
  /** A navy or a crimson field is dark: light type, navy frost, the light pen. */
  tone: 'light' | 'dark';
};

export const areas: readonly Area[] = brief.areas.map((a, i) => ({
  ...a,
  ...AREA_LOOK[a.key],
  number: String(i + 1).padStart(2, '0'),
  href: `/vart-arbeid#${a.key}`,
  tone: AREA_LOOK[a.key].ground === 'navy' || AREA_LOOK[a.key].ground === 'crimson' ? 'dark' : 'light',
}));

/** The area's water, resolved at the page's depth. */
export function areaFloor(area: Area) {
  return brand.areaFloor[area.ground];
}
```

- [ ] **Step 7: Extend `components/home/areas.test.ts`**

Append:

```ts
import { brand } from '@/lib/film';
import { areaFloor, areas } from './areas';

test('every area has a water scene and a tone that matches its ground', () => {
  for (const a of areas) {
    expect(brand.areaWater[a.ground]).toBeDefined();
    expect(areaFloor(a).ground).toMatch(/^#[0-9a-f]{6}$/);
    expect(a.tone).toBe(a.ground === 'navy' || a.ground === 'crimson' ? 'dark' : 'light');
  }
});
```
(merge the imports with the file's existing ones.)

- [ ] **Step 8: Run tsc and the two test files**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && npx tsc --noEmit; echo "tsc $?"; npx vitest run lib/film.test.ts components/home/areas.test.ts 2>&1 | tail -6
```
Expected: tsc 0, all pass. The mock's `components/mock/palettes.ts` still compiles (it does not import `AreaKey`).

- [ ] **Step 9: Commit**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && git add lib/film.ts lib/film.test.ts app/globals.css components/home/areas.ts components/home/areas.test.ts lib/content.ts && git commit -q -F - <<'EOF'
the four areas' water: night on navy and crimson, the brand's on turquoise, pale on light

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
git log --oneline -1
```

---

### Task 3: The four fields on the home page

**Files:**
- Create: `components/home/Fields.tsx`, `components/home/fields.module.css`, `components/home/Fields.test.tsx`
- Modify: `app/page.tsx` (the water box → `<Fields />`), `app/page.test.tsx`, `components/home/home.module.css` (drop `.waterBox`, `.areas`)

**Interfaces:**
- Consumes: `areas`, `areaFloor`, `Area` (Task 2); `Box` props `material, floor, tone, ground, className` (on the branch); `Logo` with `ground` and `decorative`.
- Produces: `Fields()` (the section), `FieldBody({ area, headingId, level })` for the bands, CSS classes `field`, `cell`, `name`, `text`, `logo`, `band` in `fields.module.css`.

- [ ] **Step 1: Write the failing test `components/home/Fields.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { Fields } from './Fields';

describe('the four fields', () => {
  test('four boxes of water, each its area’s ground and tone, each one link to its section, no numbers', () => {
    const { container } = render(<Fields />);
    const section = screen.getByRole('region', { name: site.pages.home.areasLabel });
    const boxes = section.querySelectorAll('[data-material="water"]');
    expect(boxes).toHaveLength(4);
    const expected = { kunnskap: ['navy', 'dark'], dialog: ['turquoise', 'light'], moteplasser: ['light', 'light'], samfunnsdeltakelse: ['crimson', 'dark'] };
    brief.areas.forEach((a, i) => {
      const [ground, tone] = expected[a.key];
      expect(boxes[i]).toHaveAttribute('data-ground', ground);
      expect(boxes[i]).toHaveAttribute('data-tone', tone);
      const link = screen.getByRole('link', { name: a.name, exact: true });
      expect(link).toHaveAttribute('href', `/vart-arbeid#${a.key}`);
      expect(boxes[i]).toContainElement(link);
      expect(screen.getByRole('heading', { level: 3, name: a.name })).toBeInTheDocument();
      expect(screen.getByText(a.text)).toBeInTheDocument();
    });
    expect(container.textContent).not.toMatch(/\b0[1-4]\b/);
    // the guide's logo for each ground, decorative
    expect(section.querySelectorAll('img[alt=""]')).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && npx vitest run components/home/Fields.test.tsx 2>&1 | tail -6
```
Expected: FAIL — cannot find module `./Fields`.

- [ ] **Step 3: Write `components/home/Fields.tsx`**

```tsx
import Link from 'next/link';
import { Box } from '@/components/materials/Box';
import { Logo } from '@/components/site/Logo';
import { site } from '@/content/site.no';
import { areaFloor, areas, type Area } from './areas';
import styles from './fields.module.css';

/**
 * What every field carries, on the home page and opened out as a band on Vårt arbeid:
 * the name, the brief's text, and the guide's logo for the ground, in the corner,
 * decorative because the name is the text beside it. No number: the colour and the name
 * say which area this is.
 */
export function FieldBody({ area, headingId, level: Heading = 'h3' }: { area: Area; headingId: string; level?: 'h2' | 'h3' }) {
  return (
    <>
      <Heading id={headingId} className={styles.name}>{area.name}</Heading>
      <p className={styles.text}>{area.text}</p>
      <span className={styles.logo}>
        <Logo ground={area.ground} height={28} decorative />
      </span>
    </>
  );
}

/**
 * The four areas as four fields of water, each over its own colour, 2×2 from 900px and a
 * column below, edge to edge inside one rounded plate — the guide's colour panel, in
 * water. Each field is one link to its section of Vårt arbeid, named by its heading. The
 * water is built when the field is near and the page is quiet (`Box`), and a field on a
 * dark ground takes light type and the light pen.
 */
export function Fields() {
  return (
    <section aria-label={site.pages.home.areasLabel} className={styles.plate}>
      <ul className={styles.grid} data-fields>
        {areas.map((a) => (
          <li key={a.key} className={styles.item}>
            <Box material="water" floor={areaFloor(a)} tone={a.tone} ground={a.ground} className={`${styles.field} ${styles[a.ground]}`}>
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

- [ ] **Step 4: Write `components/home/fields.module.css`**

```css
/*
 * The four fields: one plate holding a grid of water, each cell its area's colour. The
 * stills (`--ground`, `--still`) are mixed from the tokens the scenes in lib/film.ts are
 * written from, in the same places as the pools (`.field.<ground>` outranks `.water` in
 * materials.module.css). The veil under the words is the field's own colour fading out
 * towards the logo: calm where it is read, alive where it is looked at.
 */

.plate {
  overflow: hidden;
  border-radius: var(--box-radius);
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  margin: 0;
  padding: 0;
  list-style: none;
}

.item {
  display: grid;
}

/* A field's box: no corner of its own (the plate clips the grid's), C's cell padding. */
.field {
  --box-radius: 0;
  --box-pad-y: 30px;
  --box-pad-x: clamp(24px, 3vw, 44px);
  --frost: var(--frost-water);
  min-height: 220px;
}

/* Night water on navy: turquoise-mid and the light as pools of light. */
.field.navy {
  --ground: var(--color-area-kunnskap);
  --still:
    radial-gradient(45% 50% at 58% 38%, color-mix(in srgb, var(--color-turquoise-mid) 25%, transparent) 0%, transparent 70%),
    radial-gradient(38% 42% at 80% 78%, color-mix(in srgb, var(--color-light) 13%, transparent) 0%, transparent 70%),
    radial-gradient(45% 50% at 20% 18%, color-mix(in srgb, var(--color-turquoise-mid) 32%, transparent) 0%, transparent 70%);
}

/* The brand's water: the same still as `.water` in materials.module.css. */
.field.turquoise {
  --ground: var(--color-water-floor);
  --still:
    radial-gradient(33% 36% at 10% 84%, color-mix(in srgb, var(--color-navy) 9%, transparent) 0%, transparent 70%),
    radial-gradient(48% 53% at 58% 38%, color-mix(in srgb, var(--color-turquoise-mid) 41%, transparent) 0%, transparent 70%),
    radial-gradient(40% 45% at 80% 78%, color-mix(in srgb, var(--color-navy) 15%, transparent) 0%, transparent 70%),
    radial-gradient(48% 53% at 20% 18%, color-mix(in srgb, var(--color-light) 50%, transparent) 0%, transparent 70%);
}

/* Pale water on the light: the same pools over a near-white floor. */
.field.light {
  --ground: var(--color-water-floor-light);
  --still:
    radial-gradient(33% 36% at 10% 84%, color-mix(in srgb, var(--color-navy) 9%, transparent) 0%, transparent 70%),
    radial-gradient(48% 53% at 58% 38%, color-mix(in srgb, var(--color-turquoise-mid) 41%, transparent) 0%, transparent 70%),
    radial-gradient(40% 45% at 80% 78%, color-mix(in srgb, var(--color-navy) 15%, transparent) 0%, transparent 70%),
    radial-gradient(48% 53% at 20% 18%, color-mix(in srgb, var(--color-light) 50%, transparent) 0%, transparent 70%);
}

/* Night water on crimson: the light as pools of light. */
.field.crimson {
  --ground: var(--color-area-samfunnsdeltakelse);
  --still:
    radial-gradient(45% 50% at 58% 38%, color-mix(in srgb, var(--color-light) 25%, transparent) 0%, transparent 70%),
    radial-gradient(38% 42% at 80% 78%, color-mix(in srgb, var(--color-light) 13%, transparent) 0%, transparent 70%),
    radial-gradient(45% 50% at 20% 18%, color-mix(in srgb, var(--color-light) 32%, transparent) 0%, transparent 70%);
}

.cell {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  color: var(--card-text);
  text-decoration: none;
}

/*
 * The veil: the field's own colour under the words, from the corner the text starts in,
 * fading out towards the logo. Above the canvas (the box's inner is a stacking context)
 * and under the type. The alphas are the ones lib/film.test.ts computes contrast with.
 */
.cell::before {
  content: '';
  position: absolute;
  inset: calc(-1 * var(--box-pad-y)) calc(-1 * var(--box-pad-x));
  z-index: -1;
  background: linear-gradient(
    118deg,
    color-mix(in srgb, var(--ground) 82%, transparent) 0%,
    color-mix(in srgb, var(--ground) 58%, transparent) 38%,
    color-mix(in srgb, var(--ground) 0%, transparent) 72%
  );
  pointer-events: none;
}

.cell:hover .name {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 6px;
}

.cell:focus-visible {
  outline: 3px solid var(--card-ink);
  outline-offset: 4px;
}

.name {
  margin: 0;
  font: 700 clamp(30px, 3vw, 46px) / 1.04 var(--font-sans);
  letter-spacing: -0.02em;
  color: var(--card-ink);
  text-wrap: balance;
}

.text {
  margin: 14px 0 0;
  max-width: 40ch;
  font-family: var(--font-text);
  font-weight: 500;
  font-size: clamp(17px, 1.2vw, 18.5px);
  line-height: 1.5;
  color: var(--card-text);
  text-wrap: pretty;
}

/* Light type on dark water: a breath of shadow keeps it clear of the glints. */
.field[data-tone="dark"] .name,
.field[data-tone="dark"] .text {
  text-shadow: 0 1px 2px rgb(0 0 0 / 0.28);
}

.logo {
  display: block;
  margin-top: auto;
  padding-top: 24px;
  align-self: flex-end;
  line-height: 0;
  opacity: 0.8;
  transition: opacity var(--dur-s) var(--ease-out);
}

.cell:hover .logo,
.cell:focus-visible .logo {
  opacity: 1;
}

/* ----- the bands of Vårt arbeid: a field opened out ----- */

.band {
  --box-pad-y: clamp(40px, 6vh, 64px);
  --box-pad-x: 5%;
  --frost: var(--frost-water);
  min-height: min(56vh, 560px);
}

.bandBody {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  color: var(--card-text);
}

.bandBody::before {
  content: '';
  position: absolute;
  inset: calc(-1 * var(--box-pad-y)) calc(-1 * var(--box-pad-x));
  z-index: -1;
  background: linear-gradient(
    118deg,
    color-mix(in srgb, var(--ground) 82%, transparent) 0%,
    color-mix(in srgb, var(--ground) 58%, transparent) 38%,
    color-mix(in srgb, var(--ground) 0%, transparent) 72%
  );
  pointer-events: none;
}

.band .text {
  max-width: 60ch;
}

/* On a band the logo stands top-right, the words at the left, as the spec draws it. */
.band .logo {
  position: absolute;
  top: 0;
  right: 0;
  margin: 0;
  padding: 0;
}

@media (min-width: 900px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }

  .field {
    min-height: max(280px, 34vh);
  }
}

@media (max-width: 699px) {
  .plate {
    border-radius: 20px;
  }

  .band {
    --box-pad-y: 36px;
    --box-pad-x: 14px;
    min-height: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .logo {
    transition: none;
  }
}
```

- [ ] **Step 4b: White type on crimson**

The box's dark tone gives cards light type; on crimson the light is 4.4:1 and white is 5.1:1. In `components/materials/materials.module.css`, extend the crimson rule:

```css
/* On crimson the crimson dot would vanish, and the light falls short of 4.5:1: both go white. */
.box[data-tone="dark"][data-ground="crimson"] {
  --dot-color: var(--color-white);
  --card-text: var(--color-white);
}
```
(the rule exists on the branch with only `--dot-color`; add the line and reword the comment.)

- [ ] **Step 5: Run the Fields test**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && npx vitest run components/home/Fields.test.tsx 2>&1 | tail -8
```
Expected: PASS. If `getByRole('region', …)` fails: a `<section aria-label>` is a region; check the label matches `site.pages.home.areasLabel` («Fire hovedområder»).

- [ ] **Step 6: Put the fields on the home page**

Rewrite `app/page.tsx`:

```tsx
import { Fields } from '@/components/home/Fields';
import { Hero } from '@/components/home/Hero';
import styles from '@/components/home/home.module.css';
import { Box } from '@/components/materials/Box';
import { Frame } from '@/components/materials/Frame';
import mat from '@/components/materials/materials.module.css';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';

/**
 * Hjem, in three plates and nothing else: the film inside the mark with the brief's main
 * text (2) and its two buttons; Visjon and Misjon (3, 4) as two pen-framed cards on one
 * box of the brand's ink; the four areas (6) as four fields of water, each in its own
 * colour, each a link to its section of Vårt arbeid. Short, by the brief's own
 * instruction; the menu does the rest.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <div className={styles.plates} data-plates>
        <Box material="ink" className={styles.inkBox}>
          <div className={styles.pair}>
            <section aria-labelledby="visjon-tittel" id="visjon">
              <Frame legend={site.pages.home.visionLabel} legendId="visjon-tittel" level="h2">
                <h3 className={mat.title}>{brief.vision.headline}</h3>
                <p className={mat.text}>{brief.vision.paragraph}</p>
              </Frame>
            </section>
            <section aria-labelledby="misjon-tittel" id="misjon">
              <Frame legend={site.pages.home.missionLabel} legendId="misjon-tittel" level="h2">
                <h3 className={mat.title}>{brief.mission.headline}</h3>
                <p className={mat.text}>{brief.mission.paragraph}</p>
              </Frame>
            </section>
          </div>
        </Box>
        <Fields />
      </div>
    </>
  );
}
```

Remove `.waterBox`, `.areas`, `.areas > li` and their media-query entries from `components/home/home.module.css` (keep `.plates`, `.inkBox`, `.pair`).

- [ ] **Step 7: Update `app/page.test.tsx`**

Replace the areas block and the final count:

```tsx
    const areas = screen.getByRole('region', { name: site.pages.home.areasLabel });
    expect(areas.querySelectorAll('[data-material="water"]')).toHaveLength(4);
    for (const a of brief.areas) {
      const link = screen.getByRole('link', { name: a.name, exact: true });
      expect(link).toHaveAttribute('href', `/vart-arbeid#${a.key}`);
      expect(areas).toContainElement(link);
      expect(screen.getByText(a.text)).toBeInTheDocument();
    }
    // The hero, the ink, and four fields of water; nothing else.
    expect(container.querySelectorAll('[data-material]')).toHaveLength(5);
    expect(container.querySelector('[data-plates]')).not.toBeNull();
```
and change the test's title to `…the four areas as four fields of water, each a link to its section of Vårt arbeid`.

- [ ] **Step 8: Run tsc, lint, the home tests**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && npx tsc --noEmit; echo "tsc $?"; npm run lint 2>&1 | tail -2; npx vitest run app/page.test.tsx components/home 2>&1 | tail -6
```
Expected: all green. The mock (`components/mock/MockPage.tsx`) imports `home.waterBox` and `home.areas`: if tsc complains, replace those two class references in `MockPage.tsx` with `styles.field` from `fields.module.css` is NOT wanted — simply keep the two classes in `home.module.css` until Task 9 deletes the mock, and delete them then. Choose the latter: put `.waterBox` / `.areas` back if you removed them, and note it for Task 9.

- [ ] **Step 9: Commit**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && git add components/home/Fields.tsx components/home/fields.module.css components/home/Fields.test.tsx app/page.tsx app/page.test.tsx components/home/home.module.css components/materials/materials.module.css && git commit -q -F - <<'EOF'
the four fields: water in each area's colour on the home page, one link each, the veil under the words

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 4: Vårt arbeid as four bands of water

**Files:**
- Create: `components/home/Bands.tsx`, `components/home/Bands.test.tsx`
- Modify: `app/vart-arbeid/page.tsx`, `app/vart-arbeid/page.test.tsx`; `app/vart-arbeid/work.module.css` (drop `.box`, `.card`, `.left`, `.right`; keep `.work`, `.head`, `.title`, `.lede`, `.plates`, `.area`)

**Interfaces:**
- Consumes: `FieldBody`, `fields.module.css` classes `band`, `bandBody` (Task 3); `areas`, `areaFloor` (Task 2).
- Produces: `Bands()`.

- [ ] **Step 1: Write the failing test `components/home/Bands.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { Bands } from './Bands';

describe('the bands of Vårt arbeid', () => {
  test('four sections of water, each with its area’s id, ground and text, the name an h2, not a link', () => {
    const { container } = render(<Bands />);
    const expected = { kunnskap: 'navy', dialog: 'turquoise', moteplasser: 'light', samfunnsdeltakelse: 'crimson' };
    for (const a of brief.areas) {
      const section = container.querySelector(`section#${a.key}`)!;
      expect(section).not.toBeNull();
      const heading = screen.getByRole('heading', { level: 2, name: a.name });
      expect(section).toHaveAttribute('aria-labelledby', heading.id);
      expect(section.querySelector('[data-material="water"]')).toHaveAttribute('data-ground', expected[a.key]);
      expect(section).toHaveTextContent(a.text);
    }
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(container.querySelectorAll('[data-material]')).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && npx vitest run components/home/Bands.test.tsx 2>&1 | tail -5
```

- [ ] **Step 3: Write `components/home/Bands.tsx`**

```tsx
import { Box } from '@/components/materials/Box';
import { areaFloor, areas } from './areas';
import { FieldBody } from './Fields';
import styles from './fields.module.css';
import work from '@/app/vart-arbeid/work.module.css';

/**
 * The four areas down Vårt arbeid: the home page's fields opened out, one plate of water
 * each in its colour, taller, the name an h2 and the whole area's text beside it. Each
 * section carries its key as id, so `/vart-arbeid#dialog` lands on it under the header.
 */
export function Bands() {
  return (
    <div className={work.plates}>
      {areas.map((a) => (
        <section key={a.key} id={a.key} className={work.area} aria-labelledby={`${a.key}-tittel`}>
          <Box material="water" floor={areaFloor(a)} tone={a.tone} ground={a.ground} className={`${styles.field} ${styles.band} ${styles[a.ground]}`}>
            <div className={styles.bandBody}>
              <FieldBody area={a} headingId={`${a.key}-tittel`} level="h2" />
            </div>
          </Box>
        </section>
      ))}
    </div>
  );
}
```

Note `.field` sets `--box-radius: 0`; the bands want A's plate corner, so add to `fields.module.css` under `.band`: `--box-radius: 30px;` (and in the 699px media block `.band { --box-radius: 20px; }`). Add those two lines now.

- [ ] **Step 4: Rewrite `app/vart-arbeid/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { Bands } from '@/components/home/Bands';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import styles from './work.module.css';

export const metadata: Metadata = {
  title: site.pages.work.title,
  description: site.pages.work.description,
};

/**
 * Vårt arbeid: the four areas (6), each its own section and its own plate of water in its
 * colour, each linkable by its key. The title and the mission headline as the lede stand
 * on the page's white above the first plate.
 */
export default function VartArbeid() {
  return (
    <article className={styles.work} data-plates>
      <header className={styles.head}>
        <h1 className={styles.title}>{site.pages.work.title}</h1>
        <p className={styles.lede}>{brief.mission.headline}</p>
      </header>
      <Bands />
    </article>
  );
}
```

- [ ] **Step 5: Update `app/vart-arbeid/page.test.tsx`**

Read the existing test; keep its h1 and lede assertions; replace any assertion about the alternating materials or framed cards with:

```tsx
    for (const a of brief.areas) {
      const section = container.querySelector(`section#${a.key}`)!;
      expect(section.querySelector('[data-material="water"]')).not.toBeNull();
      expect(screen.getByRole('heading', { level: 2, name: a.name })).toBeInTheDocument();
      expect(section).toHaveTextContent(a.text);
    }
```

- [ ] **Step 6: Run tsc, lint, the tests**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && npx tsc --noEmit; echo "tsc $?"; npm run lint 2>&1 | tail -2; npx vitest run app/vart-arbeid components/home 2>&1 | tail -6
```
Expected: green. The mock's `MockPage.tsx` imports `work.box`, `work.card`, `work.left`, `work.right`: keep those classes in `work.module.css` until Task 9, as in Task 3.

- [ ] **Step 7: Commit**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && git add components/home/Bands.tsx components/home/Bands.test.tsx components/home/fields.module.css app/vart-arbeid/page.tsx app/vart-arbeid/page.test.tsx app/vart-arbeid/work.module.css && git commit -q -F - <<'EOF'
Vårt arbeid: the four fields opened out into four bands of water, each in its colour, each its anchor

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 5: The area mark, and the four names marked in Om oss

**Files:**
- Create: `components/site/AreaMark.tsx`, `components/site/mark.module.css`, `components/site/AreaMark.test.tsx`
- Modify: `app/om-oss/page.tsx`

**Interfaces:**
- Consumes: `areas`, `AreaKey` (Task 2).
- Produces: `AreaMark({ area: AreaKey })` (the square + the name, inline), `MarkedLine({ text })` (a sentence with every area name marked, text unchanged).

- [ ] **Step 1: Write the failing test `components/site/AreaMark.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { AreaMark, MarkedLine } from './AreaMark';

describe('the area mark', () => {
  test('a square of the area’s colour before its name; the square is decorative', () => {
    const { container } = render(<AreaMark area="dialog" />);
    expect(screen.getByText('Dialog')).toBeInTheDocument();
    const square = container.querySelector('[data-area="dialog"]')!;
    expect(square).toHaveAttribute('aria-hidden', 'true');
  });

  test('a sentence keeps its text word for word and marks each of the four names', () => {
    const text = brief.about.paragraphs[1]; // «Vi arbeider i skjæringspunktet mellom kunnskap, dialog, møteplasser og samfunnsdeltakelse.»
    const { container } = render(<p><MarkedLine text={text} /></p>);
    expect(container.querySelector('p')!.textContent).toBe(text);
    expect(container.querySelectorAll('[data-area]')).toHaveLength(4);
    expect(container.querySelector('[data-area="samfunnsdeltakelse"]')).not.toBeNull();
  });

  test('a sentence without an area name is returned unmarked', () => {
    const { container } = render(<p><MarkedLine text="Iqra Foundation er en stiftelse." /></p>);
    expect(container.querySelectorAll('[data-area]')).toHaveLength(0);
    expect(container.querySelector('p')!.textContent).toBe('Iqra Foundation er en stiftelse.');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && npx vitest run components/site/AreaMark.test.tsx 2>&1 | tail -5
```

- [ ] **Step 3: Write `components/site/AreaMark.tsx`**

```tsx
import { Fragment } from 'react';
import { areas } from '@/components/home/areas';
import type { AreaKey } from '@/lib/content';
import styles from './mark.module.css';

/**
 * The mark: a 10px square of the area's colour before the area's name — the only way a
 * colour appears on the site away from the fields and the bands, and never without the
 * name. Møteplasser's square is the light with a navy hairline, or it would vanish on
 * white. The square is decorative; the name is the text.
 */
export function AreaMark({ area }: { area: AreaKey }) {
  const a = areas.find((x) => x.key === area);
  if (!a) return null;
  return (
    <span className={styles.mark}>
      <span className={styles.square} data-area={a.key} aria-hidden="true" />
      {a.name}
    </span>
  );
}

const NAMES = new RegExp(`(${areas.map((a) => a.name).join('|')})`, 'gi');

/**
 * A sentence with each area's name marked where it stands — «i skjæringspunktet mellom
 * kunnskap, dialog, møteplasser og samfunnsdeltakelse» — the text itself untouched, so the
 * brief's verbatim test and a screen reader both read the sentence as written.
 */
export function MarkedLine({ text }: { text: string }) {
  const parts = text.split(NAMES);
  return (
    <>
      {parts.map((part, i) => {
        const a = areas.find((x) => x.name.toLowerCase() === part.toLowerCase());
        return a ? (
          <Fragment key={i}>
            <span className={styles.square} data-area={a.key} aria-hidden="true" />
            {part}
          </Fragment>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        );
      })}
    </>
  );
}
```

- [ ] **Step 4: Write `components/site/mark.module.css`**

```css
/* The area mark: a square of the area's colour, then the name. */
.mark {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font: 500 14px/1 var(--font-sans);
  letter-spacing: var(--tracking-label);
  color: var(--color-navy);
}

.square {
  display: inline-block;
  width: var(--dot);
  height: var(--dot);
  margin-right: 0.35em;
  vertical-align: 0.05em;
  background: var(--color-navy);
  box-sizing: border-box;
}

.square[data-area="kunnskap"] { background: var(--color-area-kunnskap); }
.square[data-area="dialog"] { background: var(--color-area-dialog); }
.square[data-area="moteplasser"] { background: var(--color-area-moteplasser); border: 1px solid var(--color-navy); }
.square[data-area="samfunnsdeltakelse"] { background: var(--color-area-samfunnsdeltakelse); }

.mark .square {
  margin-right: 0;
}
```

- [ ] **Step 5: Run the test**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && npx vitest run components/site/AreaMark.test.tsx 2>&1 | tail -5
```
Expected: PASS. If the split leaves a name unmatched, the brief writes the names in lower case inside the sentence («kunnskap»): the regex is case-insensitive and the lookup lower-cases both sides, so check `brief.about.paragraphs[1]` is the sentence with the four words.

- [ ] **Step 6: Use it in Om oss**

In `app/om-oss/page.tsx`, replace the paragraphs map with:

```tsx
      <div className={styles.prose}>
        {brief.about.paragraphs.map((p, i) => (
          <p key={p.slice(0, 24)}>{i === 1 ? <MarkedLine text={p} /> : p}</p>
        ))}
      </div>
```
and import `{ MarkedLine } from '@/components/site/AreaMark'`.

- [ ] **Step 7: Run tsc, lint, and the brief test**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && npx tsc --noEmit; echo "tsc $?"; npm run lint 2>&1 | tail -2; npx vitest run content/brief.test.ts components/site 2>&1 | tail -5
```

- [ ] **Step 8: Commit**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && git add components/site/AreaMark.tsx components/site/mark.module.css components/site/AreaMark.test.tsx app/om-oss/page.tsx && git commit -q -F - <<'EOF'
the area mark: a square of the area's colour before its name, and the four names marked in Om oss

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 6: The area on events and resources

**Files:**
- Modify: `lib/content.ts` (`area` on `Event` and `Resource`, an `optOneOf` reader), `lib/content.test.ts`, `keystatic.config.ts`, `app/arrangementer/page.tsx`, `app/ressurser/page.tsx`, `README.md`

**Interfaces:**
- Consumes: `AREA_KEYS`, `AreaKey` (Task 2), `AreaMark` (Task 5).
- Produces: `Event.area: AreaKey | null`, `Resource.area: AreaKey | null`.

- [ ] **Step 1: Write the failing tests in `lib/content.test.ts`**

Inside `describe('arrangementer', …)` add:

```ts
  test('an area is carried when it is one of the four, null when absent or empty, refused otherwise', () => {
    write('a.json', { title: 'A', start: '2027-01-20', place: 'Oslo', text: 'T', area: 'dialog' });
    expect(getEvents(dir)[0].area).toBe('dialog');
    write('a.json', { title: 'A', start: '2027-01-20', place: 'Oslo', text: 'T', area: '' });
    expect(getEvents(dir)[0].area).toBeNull();
    write('a.json', { title: 'A', start: '2027-01-20', place: 'Oslo', text: 'T' });
    expect(getEvents(dir)[0].area).toBeNull();
    write('a.json', { title: 'A', start: '2027-01-20', place: 'Oslo', text: 'T', area: 'sport' });
    expect(() => getEvents(dir)).toThrow(/«area» must be one of kunnskap, dialog, moteplasser, samfunnsdeltakelse/);
  });
```
and the first arrangementer test's expected object gains `area: null` (after `image: null`). Inside the resources describe add the same shape for `getResources` with a record `{ title: 'R', kind: 'rapport', date: '2026-01-01', summary: 'S', url: 'https://x.y', area: 'kunnskap' }`, and give the existing resource expectations `area: null`.

- [ ] **Step 2: Run to verify it fails**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && npx vitest run lib/content.test.ts 2>&1 | tail -8
```

- [ ] **Step 3: Add the field to `lib/content.ts`**

Add `area: AreaKey | null;` to `Event` (after `image`) and to `Resource` (after `url`), with the comment `/** One of the four areas, when the item belongs to one. */`. Add a reader beside `oneOf`:

```ts
const optOneOf = <T extends string>(file: string, raw: Raw, key: string, kinds: readonly T[]): T | null =>
  optStr(file, raw, key) === null ? null : oneOf(file, raw, key, kinds);
```
and in `getEvents` add `area: optOneOf(file, raw, 'area', AREA_KEYS),`, in `getResources` `area: optOneOf(file, raw, 'area', AREA_KEYS),`.

- [ ] **Step 4: Add the select to `keystatic.config.ts`**

In both `arrangementer` and `ressurser` schemas, after `text` / `summary`:

```ts
        area: fields.select({
          label: 'Område',
          description: 'Hvilket av de fire områdene dette hører til, om det hører til ett.',
          options: [
            { label: 'Ingen', value: '' },
            { label: 'Kunnskap', value: 'kunnskap' },
            { label: 'Dialog', value: 'dialog' },
            { label: 'Møteplasser', value: 'moteplasser' },
            { label: 'Samfunnsdeltakelse', value: 'samfunnsdeltakelse' },
          ],
          defaultValue: '',
        }),
```
(The labels are the brief's names; the values are the keys `lib/content.ts` reads.)

- [ ] **Step 5: Run the content tests and the collections test**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && npx vitest run lib/content.test.ts content/collections.test.ts 2>&1 | tail -6
```
Expected: PASS.

- [ ] **Step 6: Show the mark on the cards**

In `app/arrangementer/page.tsx` `EventItem`, after the `<h3>`:
```tsx
      {e.area && <p className={styles.meta}><AreaMark area={e.area} /></p>}
```
In `app/ressurser/page.tsx`, after the `<h3>` inside the item:
```tsx
                {r.area && <p className={styles.meta}><AreaMark area={r.area} /></p>}
```
Both import `{ AreaMark } from '@/components/site/AreaMark'`.

- [ ] **Step 7: README**

In `README.md`, in the section that lists an event's fields («adding an item by hand»), add one line: `area` — one of `kunnskap`, `dialog`, `moteplasser`, `samfunnsdeltakelse`, or left out; the same on resources. Keep the README's own wording.

- [ ] **Step 8: Run tsc, lint, vitest, build**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && npx tsc --noEmit; echo "tsc $?"; npm run lint 2>&1 | tail -2; npx vitest run 2>&1 | tail -5; npm run build 2>&1 | grep -E "error|✓ Compiled"
```

- [ ] **Step 9: Commit**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && git add lib/content.ts lib/content.test.ts keystatic.config.ts app/arrangementer/page.tsx app/ressurser/page.tsx README.md && git commit -q -F - <<'EOF'
an event or a resource may belong to one of the four areas, and its card carries the mark

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 7: The route group: the shell off the admin

**Files:**
- Create: `app/(site)/layout.tsx`
- Move: `app/page.tsx`, `app/page.test.tsx`, `app/om-oss/`, `app/vart-arbeid/`, `app/arrangementer/`, `app/ressurser/`, `app/menneskene-bak/`, `app/styringsdokumenter/`, `app/kontakt/`, `app/stott-oss/` → under `app/(site)/`
- Modify: `app/layout.tsx` (html/body only), `app/not-found.tsx` (renders the shell itself), `components/home/Bands.tsx` (the `work.module.css` import path)
- Untouched: `app/keystatic/`, `app/api/`, `app/icon.svg`, `app/opengraph-image.*`, `app/mock/` (until Task 9)

- [ ] **Step 1: Move the routes (Bash, paths with parentheses quoted)**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && mkdir -p "app/(site)" && git mv app/page.tsx "app/(site)/page.tsx" && git mv app/page.test.tsx "app/(site)/page.test.tsx" && for d in om-oss vart-arbeid arrangementer ressurser menneskene-bak styringsdokumenter kontakt stott-oss; do git mv "app/$d" "app/(site)/$d"; done && git status --short | head -30
```

- [ ] **Step 2: Write `app/(site)/layout.tsx`**

```tsx
import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';

/** The site's shell: every public page is the header, the main region and the footer. The admin (/keystatic) is outside this group and gets none of it. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="innhold">{children}</main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Strip the shell from `app/layout.tsx`**

Remove the `Header` and `Footer` imports and render:
```tsx
      <body>{children}</body>
```
Keep everything else (fonts, metadata, `lang`).

- [ ] **Step 4: Make the 404 carry the shell itself**

`app/not-found.tsx` renders under the root layout for an unmatched URL, so it wraps itself: import `Header` and `Footer` and return `<><Header /><main id="innhold">…the existing markup…</main><Footer /></>`. Read the file first and keep its content and classes.

- [ ] **Step 5: Fix the one import that named the old path**

`components/home/Bands.tsx`: `import work from '@/app/(site)/vart-arbeid/work.module.css';`. Then:

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && grep -rn "@/app/" --include=*.ts --include=*.tsx app components lib e2e | grep -v "(site)" | grep -v "app/fonts\|globals.css\|keystatic"
```
Expected: no other stale path.

- [ ] **Step 6: tsc, lint, vitest, build, and the admin check**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && npx tsc --noEmit; echo "tsc $?"; npm run lint 2>&1 | tail -2; npx vitest run 2>&1 | tail -5; npm run build 2>&1 | grep -E "error|✓ Compiled|○ /|ƒ /"
```
Expected: the same routes as before (`/`, `/om-oss`, … `/keystatic/[[...params]]`). Then the admin without the shell, in dev mode on 3030:

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && (npx next dev -p 3030 > /tmp/dev.log 2>&1 &) && sleep 8 && curl -s http://localhost:3030/keystatic | grep -c "innhold"; curl -s http://localhost:3030/om-oss | grep -c 'id="innhold"'
```
Expected: `0` for the admin (no `main#innhold`), `1` for Om oss. Then kill the dev server: PowerShell `Get-CimInstance Win32_Process | ? { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*iqra-foundation-mock*' -and $_.CommandLine -like '*next*dev*' } | % { Stop-Process -Id $_.ProcessId -Force }` and confirm `netstat -ano | findstr :3030` is empty.

- [ ] **Step 7: Commit**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && git add -u app && git add "app/(site)/layout.tsx" components/home/Bands.tsx && git status --short | grep -v "^[RMAD]" ; git commit -q -F - <<'EOF'
the site's shell in a route group: the header and footer on every public page and not on the admin

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```
(`git add -u app` stages the moves and edits under `app/` only; check the status shows nothing unexpected before committing.)

---

### Task 8: e2e: the fields, the bands, the thread's colours

**Files:**
- Modify: `e2e/pages.spec.ts`, `e2e/shell.spec.ts`

- [ ] **Step 1: Extend the home test in `e2e/pages.spec.ts`**

Inside the first test, after the areas loop, add:

```ts
  // four fields of water, each on its area's ground; the first one's link lands on its band
  const fields = main.locator('[data-fields] [data-material="water"]');
  await expect(fields).toHaveCount(4);
  await expect(fields.nth(0)).toHaveAttribute('data-ground', 'navy');
  await expect(fields.nth(3)).toHaveAttribute('data-ground', 'crimson');
  await main.getByRole('link', { name: brief.areas[1].name, exact: true }).click();
  await expect(page).toHaveURL(/\/vart-arbeid#dialog$/);
  await expect(page.locator('#dialog')).toBeInViewport();
```
and in the vårt arbeid test, inside the loop: `await expect(section.locator('[data-material="water"]')).toHaveCount(1);`.

Add to the om-oss test: `await expect(page.locator('[data-area]')).toHaveCount(4);`.

- [ ] **Step 2: Extend `e2e/shell.spec.ts`**

Append:

```ts
test('the thread’s four words each carry their area', async ({ page }) => {
  await page.goto('/kontakt');
  const words = page.getByRole('contentinfo').locator('[data-thread] [data-area]');
  await expect(words).toHaveCount(4);
  await expect(words).toHaveText(brief.areas.map((a) => new RegExp(`^${a.name}`)));
});
```

- [ ] **Step 3: Run the e2e (it builds and starts on 3000; 3000 must be free)**

```bash
netstat -ano | grep -E ':3000 ' | grep LISTEN && echo "3000 BUSY: stop it first (see memory: killing next servers on Windows)" || (cd /c/Users/daodi/code/iqra-foundation-mock && CI=1 npx playwright test 2>&1 | tail -15)
```
Expected: all passed (about 30 tests across desktop and phone), skips only where the suite skips by design. If the fields' click test flakes on the phone project because the drawer covers the link, scroll first: `await main.getByRole('link', …).scrollIntoViewIfNeeded()`.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && git add e2e/pages.spec.ts e2e/shell.spec.ts && git commit -q -F - <<'EOF'
e2e: the fields land on their bands, the bands are water, the thread's words carry their areas

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 9: The mock removed

**Files:**
- Delete: `app/mock/`, `components/mock/`
- Modify: `components/home/home.module.css` (drop `.waterBox`, `.areas` now), `app/(site)/vart-arbeid/work.module.css` (drop `.box`, `.card`, `.left`, `.right`)
- Keep: `Box`'s `palette/floor/tone/ground/style` props, `PEN_LIGHT`, the dark-tone rules in `materials.module.css` (the fields use them)

- [ ] **Step 1: Remove**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && git rm -rq app/mock components/mock && git status --short | head
```
Then delete the unused classes named above and any `data-mock` leftovers: `grep -rn "mock" --include=*.ts --include=*.tsx --include=*.css app components lib` must print nothing.

- [ ] **Step 2: tsc, lint, vitest, build**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && npx tsc --noEmit; echo "tsc $?"; npm run lint 2>&1 | tail -2; npx vitest run 2>&1 | tail -5; npm run build 2>&1 | grep -E "error|✓ Compiled|/mock"
```
Expected: green, and `/mock` no longer in the route list.

- [ ] **Step 3: Commit**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && git add -u && git status --short | grep -v "^[MD]"; git commit -q -F - <<'EOF'
the mock removed: what it was for is in lib/film.ts and the fields now

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```
(`git add -u` here stages only deletions and edits of tracked files; the status check before the commit must show no unexpected path.)

---

### Task 10: Verification on the running page, Lighthouse, the PR

**Files:**
- Shots under the session scratchpad; nothing in the repo except what the shots make you fix.

- [ ] **Step 1: Build and serve on 3030**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && npm run build 2>&1 | grep -E "error|✓ Compiled" && netstat -ano | grep -E ':3030 ' | grep LISTEN || echo "3030 free"
```
Then, as a background Bash command: `cd /c/Users/daodi/code/iqra-foundation-mock && npx next start -p 3030`. Confirm `curl -s -o /dev/null -w '%{http_code}' http://localhost:3030/` is `200`.

- [ ] **Step 2: Shoot `/` and `/vart-arbeid` at the four widths with the GPU flags**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && SCRATCH="$CLAUDE_SCRATCHPAD" node scripts/dev/shoot.mjs 3030 d iqra-foundation-mock 2>&1 | tail -4
```
(`$CLAUDE_SCRATCHPAD` = this session's scratchpad path from the system prompt; without it the script writes to `.scratch/`, which is gitignored.) Expected: `no console errors, no horizontal overflow`. Then look at EVERY shot with the Read tool, the 390 ones first. Also shoot `/om-oss`, `/arrangementer` and `/denne-siden-finnes-ikke` at 1440 and 390 with a copy of the script's page list changed, and a 1366×768 desktop of `/` (the fields must be visible under the hero's fold: scroll one screen and shoot).

Fix what you see; each fix gets the four checks and its own commit.

- [ ] **Step 3: Reduced motion and JavaScript off, on the running page**

A Playwright script in the scratchpad (import via `file:///C:/Users/daodi/code/iqra-foundation-mock/node_modules/playwright/index.mjs`): a context with `reducedMotion: 'reduce'` and one with `javaScriptEnabled: false`, `goto('http://localhost:3030/')`, assert the four names are visible and each `[data-fields] [data-material]` has a non-transparent computed `background-color` (the still). Print the results; both must be complete.

- [ ] **Step 4: Lighthouse, from PowerShell**

The Bash tool rewrites a bare `/vart-arbeid` argument into a Windows path; run this from the PowerShell tool:

```powershell
Set-Location C:\Users\daodi\code\iqra-foundation-mock; node scripts/dev/lighthouse.mjs 3030 iqra-foundation-mock / /om-oss
```
Then confirm the JSON files it names exist before quoting any number. Record performance, accessibility, best-practices, CLS and LCP for both. Discount the Vercel bot challenge only on the production host; locally there is none.

- [ ] **Step 5: Stop the server, confirm the port**

PowerShell: `Get-CimInstance Win32_Process | ? { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*iqra-foundation-mock*' -and $_.CommandLine -like '*next*start*' } | % { Stop-Process -Id $_.ProcessId -Force }; netstat -ano | findstr :3030` → empty.

- [ ] **Step 6: Push the branch and open the PR, unmerged**

```bash
cd /c/Users/daodi/code/iqra-foundation-mock && git push -u origin feat/den-rode-traden 2>&1 | tail -3
```
Then `gh pr create --base main --head feat/den-rode-traden --title "Den røde tråden: the identity and the structure, the four areas in water" --body-file <a file in the scratchpad>`. The body: what the site is now (the spec's «The brief, and what carries it» table, condensed), the departures from the spec if any, the four checks' summary lines, the e2e count, the Lighthouse numbers, the screenshot list, and what is still bracketed. End the body with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. After opening: `gh pr view --json changedFiles,additions,deletions,commits` and confirm the numbers match your own commits (a base mismatch shows as many more files). Do NOT merge; do not enable auto-merge.

- [ ] **Step 7: Memory**

Update `iqra-identitet-handoff.md` in the project memory (Read it first; the harness rewrites frontmatter): the PR number, the branch, the commits, what was verified, what is open. Add its line to `MEMORY.md`. State outcomes as they are: a check that was skipped is written as skipped.

---

## Self-review

- **Spec coverage.** Colour system and mapping: Task 2. Home page (hero as A, Visjon/Misjon on ink, four fields, footer): Task 3 (the hero and the ink box are untouched from A; C's footer is on the branch). Vårt arbeid bands: Task 4. The area mark and Om oss: Task 5. The area on content and the cards: Task 6. The shell (C's, on the branch) and the route group: Task 7. Motion and cost: inherited from `Box` (built when near and quiet, stills under reduced motion) and asserted in Task 10 step 3. Proof: Tasks 2–6 (unit), 8 (e2e), 10 (shots, Lighthouse). Delivery: Tasks 1, 9, 10. Out of scope and assumptions: unchanged by the plan.
- **Placeholders.** None: every step has its code or its command. The one deliberate reading step (Task 7 step 4, the 404's existing markup) tells the engineer to read the file and keep it, which is the instruction.
- **Type consistency.** `AreaGround` is exported from `lib/film.ts` and re-exported by `components/home/areas.ts`; `AreaKey` from `lib/content.ts` and re-exported the same way; `areaFloor(area)` returns `WaterFloor`; `FieldBody` takes `level?: 'h2' | 'h3'`; `Box` takes `floor`, `tone`, `ground`, `className` as on the branch; `data-fields`, `data-thread`, `data-area`, `data-material`, `data-ground`, `data-tone` are the attributes the tests read, and each is set by the component named.
