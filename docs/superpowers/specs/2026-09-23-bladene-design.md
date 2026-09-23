# Havet as Bladene — design

**Date:** 2026-09-23 · **Branch:** `feat/bladene` (from `main` at `2749730`)
**Replaces:** the live sea of PRs #53/#54 (four screens tall, one hold on the navy), which the owner
called «a bit weird … feels very weird».

## The pick

Round seven of the sea's scroll put three whole alternatives on a running page (`mock/havet-flyt`,
local only, `afec9ac`): 1 Brottet, 2 Bladene, 3 Tidevannet. The owner:

> «B was without a doubt the best one. Maybe a bit more space between the different sections, but
> that was a fantastic solution.»

«B» is the second of the three, **2 Bladene**. One principle sits under it, and it is the reason
it works where six rounds of scroll control did not: **the scroll is the browser's, the tide is
ours.** Nothing holds, snaps, steps or moves the page. The scroll only says which field, and the
tide goes there on its own clock.

## What Bladene is

The spread (Oppslaget, 2026-09-19), opened out.

- **The screen** is the water, the veil, the four names (the left page) and the logo at its foot.
  It is one screen, sticky under the header for the whole section.
- **The four right pages** hold each field's statement and reading, and each page is the link to
  `/vart-arbeid#<key>`. They are in the flow over the screen and scroll natively, like any text.
- **The page nearest the middle of the screen** lights its name at once. Its tide then comes in on
  its own clock, about a second and whole: a crossing is `TIDE_MS` 950 ms, a longer journey is
  quicker per field, and a new aim mid-tide keeps its speed. The words take the next field's inks
  once its tide is `INK_AT` 0.72 across. A stone drops under the name as the field lands.
- **The other pages** stand dimmed (0.3) in the inks of the water they are on.
- **A name is a button.** It brings its page to the middle with the browser's own smooth scroll,
  and moves the focus to that page.
- **The section is the pages' height:** half a screen of margin, four pages of `--page-h`, half a
  screen of margin. So the first page is in the middle as the section reaches the header, and the
  last is there as it leaves.

## Decisions

| Question | Decision | Source |
|---|---|---|
| Space between the sections | `--page-h` 60svh on desktop (the mock had 48vh) and 84svh on a phone (66vh). One named value each, shown on the running page, one correction expected. | the owner's note; the brief |
| Phone: where the four names go | **A: at the head of every page**, its own lit, as in the mock. B (one pinned list) was shown beside it. Its band let the text sliding under it show through. | the owner, 2026-09-23 |
| Phone: the logo | It moves from the foot of the screen into each page, at its foot. The pages' text ran over it. | stated with the phone question, not vetoed |
| Reduced motion | The sea goes to a field at once: the name, the inks and the colour change with no tide, no stone and no glide. The site's stylesheet already drops every transition there. A name jumps (`behavior: 'auto'`). | the brief left it to the plan |
| Without script | Sticky is CSS, so the pages scroll over the navy screen in the first field's inks and all stay readable. The names are inert buttons. | the brief |
| The index's landmark | A list of buttons inside the region, **not** a `<nav>`. The mock's `<nav>` reused the region's label, and a second label would be new copy. The names are in-page controls, and each page's `h2` is what a reader navigates by. | this plan |
| The clock's `lead` | **Not carried.** Bladene passed 0 and never used it. | this plan |
| ScrollTrigger | Leaves the home page. `step.ts`, the hold and the four word layers go. gsap core stays (`lib/near.ts`). | the brief |

## Three bugs found in the mock, fixed in the build

1. **The CSS ground never changed.** `groundAt(u)` was written on `[data-sea]`, but the box
   declares its own `--ground` (`.field.navy`), so the box stayed navy under every field. This
   shows without WebGL2, before the water is built, and under reduced motion (where the CSS is
   the whole answer). The white field's navy text then sat on grey-navy, measured with
   `--disable-webgl2`. **Fix:** write the ground on the box itself.
2. **A water built late stayed on the first field.** The water is built when near and quiet, with
   the first field's floor, and nothing retuned it. A reload inside the sea showed navy water
   under Møteplasser's inks, on the real GPU. **Fix:** `onMaterial` retunes the new water to the
   frame on screen.
3. **The foot logo was the wrong one.** The mock found its four foot logos by `[data-logo]`, but
   `Logo` puts its own `data-logo` on the `<img>`, so the query matched eight elements. Fields 1
   and 3 showed no logo, and Dialog's turquoise showed the crimson one. **Fix:** give them their
   own attribute (`data-foot`).

## The dials, each named once

`TIDE_MS` 950 (`clock.ts`) · `HYST` 0.06 of the screen · `INK_AT` 0.72 · `LANDED` 0.12 /
`LEFT` 0.5 (`tide.ts`) · the veil 0.7 s, the inks 0.45 s, the names 0.5 s, the dimmed pages 0.3,
`--page-h` (`sea.module.css`).

## Measured on the mock (probe-motion.mjs, real GPU, 1440×900)

The page moved exactly the gesture's distance (120 to 3 000 px). Frames were p50 and p95 16.7 ms.
The tide landed on a whole field 0.8–1.4 s after the hand stopped and never went back on a forward
gesture.
