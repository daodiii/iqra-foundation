# Pennen: every box on the site is a line drawn with the tree's pen

Date: 2026-09-12
Status: approved design, being implemented
Scope: the material every card on the landing page is made of — Visjon's three, Misjon's
one, the Arrangementer · Nyheter row, Om oss · Teamet's two cards and the member card, Støtt
oss's head and three routes — and the pen that draws it, moved out of `components/vision/`
into `lib/`. Not the night card in Støtt oss, not `/om-oss`, not the boxes' colours or
simulations, not the copy.

## Where this comes from

The brief (2026-09-12): «the boxes in vision and mission … look a bit generic. Something
more unique, that looks really professional, modern, and still creative … like it's done by
an expert web designer.» Three mockups were built, each a different answer to *what a box
is* (https://claude.ai/code/artifact/fc032736-e060-4565-9544-adee7d3f14bf): A Dis (the
frost with no edge), B Pennen (the box is a line drawn by the arch's own pen), C Merket (a
navy label plate pinned over the corner).

Settled with the user, in order:

- **B Pennen.** The frame is drawn with the same pen that draws the arch, the card's name
  sits ON the top line, and the inside is barely frosted.
- **The button over the line, as C has it** («B, but with the button on the edge like C»):
  the frame's bottom line runs on under Misjon's button instead of breaking around it, and
  the button carries C's soft crimson shadow. The first-round B with the gap is kept in the
  mock as «B0» for comparison and is not built.
- **Inkludering's name on the right** («on desktop have inkludering on the right side so it
  doesn't clash with the line»): the arch's right flank crosses that card's top edge where
  the name sat. Mirrored, the line crosses the unbroken part, as it does for Dialog.
- **Every box on the site** («make all the boxes on the site like this»).

## What is there now

`wash.module.css` `.card` and `.cardOnWater`: a white gradient pane at `--glass-fill` 0.77
(+0.05 on water), `backdrop-filter: blur(26px) saturate(1.6)`, a masked gradient rim, a
corner sheen and 3% grain, a drop shadow that says the card is above the material. Fourteen
cards wear it: Visjon 3, Misjon 1, Arrangementer · Nyheter one per stop, Om oss · Teamet 3,
Støtt oss 4. The night card (`wash.night`, the standing gift) is a box in its own right —
dark, with its own water — and wears none of it.

The pen lives in `components/vision/arch.ts`: `makePath` walks arcs and lines by length,
`drawStroke` draws a rose glow under a navy line and, while the stroke is still being
drawn, the seed's crimson at its tip.

## The design

### The rule

Every box is the same thing: a hairline frame drawn with the tree's pen, the box's first
line sitting on the frame's top line, the inside barely frosted, and where a box has a
button, the button over its bottom edge. What differs between boxes is only which element
is the first line and when the pen arrives.

### The material — `.frame` in `wash.module.css`

Replaces `.card` and `.cardOnWater`, which go, along with the rim, the sheen, the grain,
the shadow and the `--glass-fill` knob. Nothing else on the page uses them.

- **The box**: `position: relative; isolation: isolate; border-radius: 10px` (Misjon and
  the people cards 12px). No shadow: the frame is a line ON the material, not a pane above
  it, and a shadow would say otherwise.
- **The inside**: a `::before` layer, `inset: 0`, `background: rgba(255 255 255 /
  var(--frame-fill))`, `backdrop-filter: blur(12px) saturate(1.4)`, `opacity:
  var(--frame-in, 1)` — the custom property is what the arrival tweens, so a script that
  never runs leaves the inside at 1. `--frame-fill` is **0.30** on the two ink boxes (the
  sky and the cream are pale; measured on the mock, navy and the soft ink both clear 5:1 at
  the deepest tone the ceilings allow). On the water boxes the floor is darker and the
  inside stays milkier: **`.frameOnWater`** (`composes: frame`) starts at **0.60**, and the
  green box overrides to what its floor needs. The numbers are set by measurement, not by
  eye: with glyphs and canvases hidden, the darkest pixel under each card's copy against the
  box's still must give ≥ 4.5:1 for `--color-ink-soft` and ≥ 7:1 for navy — the same rule
  the glass was held to. Starting guesses: bridge 0.50, Arafat 0.60, green 0.68; the plan
  measures and writes the final numbers beside each override with the measured ratio.
- **The line**: a canvas (`.frameCanvas`, `data-frame-canvas`, `aria-hidden`) positioned
  `inset: -32px` — 32px of room on every side for the pen's glow and its crimson tip —
  `pointer-events: none`, `z-index: 0`. Everything the card holds sits above it
  (`position: relative; z-index: 1` on the copy wrapper or on each child, as each section
  already lays out).
- **The legend**: the box's first line, positioned absolutely with its vertical centre on
  the top edge — `top: -0.5em; line-height: 1` (not a transform: GSAP animates the member
  card's role by transform, and a transform set here would be overwritten) — `left: 22px`
  by default, `padding: 0 8px`, `white-space: nowrap`, `z-index: 1`. Where the box's copy
  starts, its top padding leaves room under the line for the legend's lower half plus the
  gap the section already had.

  **A departure from the mock, for legibility on water.** The mock's legend had no backing:
  its upper half stood on the raw ink, which on the sky and the cream is pale. On Arafat
  the darkest pool is `#65636e` and on the green `#1f5c4d`; a 12px label straddling that
  line would read on its lower half and fail on its upper. So the legend carries a **tab**:
  a `::before` covering its upper half only (`inset: 0 0 50% 0`, `border-radius: 6px 6px 0
  0`) in the same fill and blur as the inside. Above the line the tab, below it the inside,
  both at `--frame-fill`, so the backing is continuous across the line and there is no
  double-milk seam. On the ink boxes at 0.30 it is a faint lighter rectangle behind the
  name; on water it is what makes the label readable. Applied everywhere, so a box is the
  same box on every material.
- **The gap**: the pen leaves the top line open where the legend is — from 6px left of the
  legend's box to 6px right of it — and the stroke starts at the gap's right end, goes
  clockwise round the box, and ends at the gap's left end, so the line opens and closes at
  the word. A box with no legend (none on the page today; the type allows it) is one closed
  path starting after the top-left corner.
- **The seat**: a wrapper for a button pinned over the bottom edge — `position: absolute;
  bottom: 0; transform: translateY(50%)`, `z-index: 1`, the line running on beneath. The
  button inside it keeps its own rise. Only Misjon has one today. Its button takes the soft
  crimson shadow `0 14px 26px -12px rgba(171 82 99 / 0.6)`, C's, which says it sits above
  the edge.
- **Without `backdrop-filter`**: the inside is `rgba(255 255 255 / 0.9)`, as the glass fell
  back to 0.95 — navy type must never sit straight on a moving simulation.
- **Lightning CSS**: write the unprefixed `backdrop-filter` only and let the build add the
  prefix; hand-pairing the two leaves only the prefixed one, which Blink ignores (the trap
  `wash.module.css` already documents). The e2e that greps the served CSS for both forms
  stays and is what proves it.

### The pen — `lib/pen.ts`

`Seg`, `ArchPath`, `makePath` and `drawStroke` move here from `components/vision/arch.ts`
unchanged; `arch.ts` imports them, and `arch.test.ts` keeps passing without edits beyond the
import. One pen, one place, because the whole point is that the arch and every box are
drawn by the same hand.

New, beside them:

- `framePath(W, H, r, gap?: { from: number; to: number }): ArchPath` — the rounded rectangle
  as segments: from `gap.to` along the top edge to the top-right corner's arc, down the
  right side, the bottom-right arc, the whole bottom edge (no gap: the button sits over the
  line), the bottom-left arc, up the left side, the top-left arc, and along the top edge to
  `gap.from`. Without a gap the path starts at the top-left arc's end and closes there.
  Pure geometry, tested in jsdom: the length is the perimeter less the gap, `pointAt(0)` is
  `(gap.to, 0)`, `pointAt(1)` is `(gap.from, 0)`, and the point halfway down the right side
  is `(W, H/2)`.
- `createFrame(card: HTMLElement): FrameHandle | null` — finds `[data-frame-canvas]` and
  `[data-legend]` inside the card; returns null when there is no canvas or no 2D context
  (jsdom, or a canvas that declines), and the card is then a frosted box with no line,
  which is a complete answer. The handle:
  - `layout()` — measures the card's client size and the legend's rect relative to it,
    reads the card's computed `border-top-left-radius` for `r`, sizes the canvas at `W+64 ×
    H+64` × DPR (DPR capped at 2, as the arch's canvas is), sets the transform so the
    card's top-left is the origin, rebuilds the path, and redraws at the current `p`. Cheap
    enough to call on every resize and on `document.fonts.ready`, and the member card
    calls it on every step because its legend changes width.
  - `p` — how far the pen has come, 0..1, a plain property so a GSAP tween can drive it:
    `gsap.to(frame, { p: 1, duration, ease: EASE.none, onUpdate: frame.draw })`. The pen
    is drawn by the section's own timeline, in step with everything else it moves, rather
    than by a loop of its own.
  - `draw()` — clears the canvas and calls `drawStroke(ctx, path, p)`. Sets
    `data-frame-drawn="true"` on the card when `p` reaches 1, so a test can wait for the
    line rather than guess at a duration.
  - `destroy()` — releases the canvas (width 0) and drops references.

  The frame never reads the clock and never schedules a frame of its own: at rest it costs
  nothing, and there are fourteen of them.

### The boxes, one by one

The first line of each box is its legend. Nothing is added to the copy; what sits on the
line is the element that was already first.

- **Visjon** (`components/vision/`): the three value cards. The legend is the `<h2>` name,
  26px 600 (down from 28px inside the pane); the paragraph below, at the same size. The
  top slot moves from 30px to **52px** so Trygghet's name clears the header's haze when the
  section is at the top of the screen (the haze fades out at 104px; the figure's top is at
  62px on a 900px screen, and 52 − 13 puts the name's top at 101px). **Inkludering's legend
  sits at the right** (`.slotRight .legend { left: auto; right: 22px }`) on the desktop
  layout only; in flow every legend is at the left. Arrival: as the arch's pen passes a
  card's flank the card's own pen draws its frame (1.1s, linear, the arch's speed), the
  legend fades in (0.6s), the inside fades in with the line (`--frame-in` 0→1, 1.1s), and
  the paragraph rises 0.45s later (0.8s, `EASE.out`). The card element itself is no longer
  faded as a whole; its parts are hidden by script (`gsap.set`), never in CSS, so a script
  that fails leaves the copy visible. The arch's stage is still placed from the cards'
  measured boxes, which the legend overflows above and the canvas beyond — neither changes
  `getBoundingClientRect` of the card, so `desktopStage` and `surfaces` are untouched.
- **Misjon** (`components/mission/`): the legend is «Misjon», 14px 500 `.03em` in the soft
  ink; the stanzas as they are; **the rule goes** (markup, CSS, the `data-rule` tween); the
  button sits in a seat over the bottom edge, at the card's left padding, with the crimson
  shadow. The card's bottom padding becomes 64px so the last stanza clears the button's
  upper half. Arrival: at «top 72%» as now — the frame draws 1.5s, the legend fades, the
  stanzas rise with their stagger from 0.3s, the button last. On phones the card starts
  lower than today (`.inner` top padding **124px** under 860px, from clamp(72px, 11vh,
  110px)): its legend now stands on the card's top edge and would otherwise sit under the
  header's haze.
- **Arrangementer · Nyheter** (`components/happenings/`): every stop's card. The legend is
  the kind — «NYHET» / «ARRANGEMENT», the 11px tracked caps it already is. `.past .card`
  keeps its idea (what has been sits a touch deeper) as `--frame-fill` a step lower. The
  rail's bottom padding goes from 22px to 34px so the pen's tip is not clipped at the
  bottom edge while it is being drawn. Arrival: when the row rises, the frames draw one
  after another along the row — 0.9s each, 0.08s apart, in list order — including the stops
  that are scrolled out of view, so the row is whole wherever the visitor scrolls to.
- **Om oss · Teamet** (`components/people/`): the two cards' legends are «Om oss» and
  «Teamet», the 12px labels. «Les hele historien →» stays inside its card: it is a text
  link, not a button. The member card's legend is the **role** — the eyebrow splits: the
  role becomes the legend on the line (its 12px `.3em` tracked caps kept) and the counter
  «1 / 6» stays inside at the top right. Arrival: the two cards' frames draw as each card
  rises in the existing stagger; the member card's frame draws with `arrive()` (1.1s) —
  and `arrive` still slides the role in from the left, which now slides the legend along
  the line. On a step, `hide → arrive` replays as now and the frame calls `layout()` for
  the new role's width and redraws complete.
- **Støtt oss** (`components/support/`): the head card's legend is «Støtt oss»; each
  route's is its label — «Kontonummer», «Vipps», «AvtaleGiro». The heading keeps its
  container-query fit; the head card's top padding grows by the legend's lower half. The
  night card is not touched. Arrival: each frame draws as its card rises in the stagger.

### Motion, reduced

Under `prefers-reduced-motion: reduce` every frame is drawn complete at mount (`p = 1`),
every inside is at 1, and no part is hidden — as the sections already treat their copy.

### Accessibility

The legends are the same elements they were (labels, an `<h2>`, the role span): nothing is
moved out of the reading order, and positioning them on the line is visual only. The canvas
is `aria-hidden`. The button stays a link in the document, inside its card. Contrast is
measured, above.

### Performance

Fourteen canvases, each drawn only while its arrival runs (a second or so) and then still;
`drawStroke`'s `shadowBlur` is paid only on those frames. No frame reads the clock. The
`backdrop-filter` count is unchanged (one per card plus the legends' tabs, which are small).
Lighthouse holds the bar it has: performance ≥ 0.90 (thin, and thin before this — re-run
once before believing a failure), accessibility 1.00, CLS 0.

## Tests

- `lib/pen.test.ts`: `framePath` geometry (length, the two ends at the gap, the right side's
  midpoint, the no-gap path closing where it starts); `createFrame` returns null in jsdom
  (no 2D context) and never throws; `arch.test.ts` unchanged but for the import.
- Component tests: Mission renders no rule and has the legend and the seat; Vision's cards
  carry a legend and a frame canvas; People's member card has the role as the legend and
  the counter inside; Support's routes carry legends. Each asserts the DOM contract
  (`data-legend`, `data-frame-canvas`) the pen reads.
- `e2e/sections.spec.ts`: Visjon waits for `data-frame-drawn` on the three cards and the
  legends at opacity 1 instead of the card's own opacity; Misjon waits for the drawn frame
  and the button's seat over the edge (the button's vertical centre within 2px of the
  card's bottom edge); the served CSS still carries both `backdrop-filter` forms; the box
  grounds unchanged.
- The gate: `tsc`, `eslint`, `vitest`, `next build`, `playwright` desktop + phone, Lighthouse
  twice.

## Departures from the mock, written down

- The legend has a tab (its upper half backed in the frame's fill) — legibility on water.
- The frames are driven by the sections' GSAP timelines, not a loop per card.
- Inkludering's legend sits at the right on desktop.
- The button sits over an unbroken bottom line, with the crimson shadow.

## Out of scope, still open

The night card keeps its own material. `/om-oss` has no boxes. The copy in Visjon's three
cards is what shipped in PR #16 and is not touched. Whether the `[Bilde]` frames in the row
should take a pen line of their own was not asked and is not done.
