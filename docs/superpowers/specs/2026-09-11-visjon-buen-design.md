# Visjon: the arch before sunrise

Date: 2026-09-11
Status: approved design, not yet implemented
Scope: the Visjon section of the landing page (`components/vision/`), its entry in the
content file, and its tests. Not Misjon, not the tree's drawing, not the ink.

## Where this comes from

The section was mocked and tuned live with the user on 2026-09-11, in three rounds: the
brief (the tree in the middle, IQRA FOUNDATION under the roots, three boxes around it), six
looks, and then look G shaped over eight rounds without being rejected. The mockup is the
reference: https://claude.ai/code/artifact/055ab498-a1b7-4d11-89f3-e261914dd005, tab
**G Før soloppgang**. Its source is kept at
`C:\Users\daodi\code\iqra-mocks\2026-09-11-visjon-buen\` — `40-stroke.js` for the arch and
the boxes, `50-scene.js` for the scene, `10-shared.js` for the words and the clock. Every
number below is that source's, except where a line says it is not.

Settled by the user, and not reopened here:

- the vision headline («Vi vil ha et Norge…») leaves this section;
- three values, **Dialog** left, **Trygghet** top, **Inkludering** right, each a glass card
  carrying a paragraph;
- the tree stands in the middle of the box with **IQRA FOUNDATION** under its roots, and it
  is not redrawn;
- one arch across the box, drawn with the tree's pen as the tree grows, and inside it, where
  the pen has passed, the ink is the cave's own sky before sunrise: stars at the top, mist
  by the crown, the first light on the horizon, grass on the surface, brown earth with the
  roots in it. Pre-dawn and not night, because the navy tree cannot be read on black;
- the paragraphs ship as they were written for the mockup (chosen 2026-09-11 over real copy
  now, or flagged filler). They read as real, and nothing on the page or in the build log
  says otherwise. If real copy is written later it replaces them in the content file.

## What is there now

Four glass panes in a CSS grid (PR #15): the headline pane, the tree in the middle pane, a
filler pane, and a filler strip across the bottom. `tree.ts` draws the tree and places three
limb names and «Iqra» on the canvas. The cave ink runs in the box behind everything. A GSAP
tween opens the tree in three seconds from `top 78%`, with an `onRefresh` guard for a page
restored mid-section.

## Approach

CSS places the three cards; JS places only what depends on a measurement — the tree's
stage, the arch, and the point on the arch where each card surfaces. The mockup placed the
cards in JS because four looks shared one `placeBoxes`; the site has one look, so the cards
are `position: absolute` with `clamp()` widths and the phone layout is a media query rather
than a class toggled at 700px. The alternative, porting the mock's JS placement as it is,
is more code doing the same thing.

## The section, built

### Markup

```
section#visjon [aria-labelledby=visjon-label]
  div .box.cave (wash)                  the ink canvas [data-ink], as today
  div .figure                           inset like the box: the coordinate space for all of it
    p#visjon-label .label  «Visjon»
    div .archArea [data-arch]
      canvas [data-scene]               the dawn scene, 2D
      canvas [data-stroke]              the arch, drawn with the pen, 2D
      div .stage [data-tree] role=figure aria-label=…
        canvas                          the tree (tree.ts), transparent
        p .mark [data-root]             IQRA / FOUNDATION
    article .card ×3 [data-value=dialog|trygghet|inkludering]
      h2 the name
      p  the paragraph
```

Layering, bottom to top: ink, scene, stroke, tree and mark, cards. The cards are
`wash.card` — glass, unchanged. The names are `h2`: they are the section's real headings
now, where the four-box filler was deliberately a paragraph.

### Content

```ts
vision: {
  label: 'Visjon',
  // The hand-set headline. Off this section since the arch; kept here because whether it
  // moves to Misjon is not decided, and deleting it would hide that there is a decision.
  lines: [...], sub: '...',
  values: [
    { key: 'dialog', name: 'Dialog', text: '…' },
    { key: 'trygghet', name: 'Trygghet', text: '…' },
    { key: 'inkludering', name: 'Inkludering', text: '…' },
  ],
  tree: {
    label: 'Et tre under en bue. Greinene er Dialog, Trygghet og Inkludering, og under røttene står Iqra Foundation.',
  },
},
```

`tree.limbs` and `tree.root` go: the canvas shows no names any more. The mark under the
roots reads `site.hero.wordLines` — it is the hero's lockup and must not drift from it.

The paragraphs, verbatim from the mock:

- **Dialog** — Vi liker å snakke med folk. Om islam, om tro, og om det som er vanskelig å
  spørre om. Du kan komme med det du lurer på, og vi svarer så ærlig vi kan. Vi lærer like
  mye av samtalen som du gjør.
- **Trygghet** — Det skal være trygt å lure på ting. Ingen spørsmål er dumme, og ingen blir
  dømt for å stille dem. Det du sier holder vi for oss selv, og du bestemmer selv hvor langt
  samtalen skal gå.
- **Inkludering** — Alle er velkomne hos oss. Du trenger ikke være muslim, og du trenger
  ikke kunne noe fra før. Vi møter folk der de er, med den bakgrunnen de har. Det er sånn vi
  selv vil bli møtt.

### Layout on a desktop (`min-width: 1100px`)

W and H are the figure's size, which is the box's; at 1440×900 that is 1272×776. The
section is `100svh` tall with a floor of 640px.

- Side cards: `width: clamp(300px, 27.5%, 350px)`, 16px from the box's edge, centred on
  `0.45H` (`top: 45%; transform: translateY(-50%)`). That is 350px at every width the mock
  was looked at, and it shrinks toward 300px between 1273px and 1235px of viewport. **The
  shrink is not the mock's**: the mock was only ever shot at 1440 and 1366.
- Top card: `width: clamp(380px, 34.6%, 440px)`, its top 30px under the box's top edge,
  centred. When the section is at the top of the screen this puts the card just under the
  header's haze; any higher puts the name under it — said to the user, accepted.
- Cards: padding `26px 28px 28px`, gap 12px; the name 28px/1, 600, `-0.03em`, navy; the
  paragraph 15px/1.55 in `--color-ink-soft`.
- The tree's stage: `min(800px, W)` wide, centred; its bottom at `0.95H`; its top placed
  so the crown — the renderer's 6% top margin — starts 14px under the top card:
  `top = (cardBottom + 14 − 0.06·bottom) / 0.94`. Then a cap that is **also not the
  mock's**: `height ≤ (column − 24) / 0.85`, where `column` is the gap between the side
  cards' inner edges and 0.85 is how wide the renderer's crown is against the stage's
  height, with the bottom held — so a laptop gets a smaller tree in the same place rather
  than a crown under the glass. At 1440 the cap does not bite (column 540, crown ≈ 423).
  This is the mock's own phone rule, where the tree is sized to the arch's width.
- The mark: centred under the roots, its `top` set by the renderer (`rootLabel`: deepest
  root + 26K). IQRA 34px, 700, `-0.05em`, navy; FOUNDATION 11px, 600, letter-spaced by JS
  to IQRA's measured width, on mount, on `document.fonts.ready`, and on resize — the hero's
  lockup logic, as the mock has it (`fitMark`).
- The label «Visjon» at 52px from the left and 62px from the top of the figure.

### Layout in flow (`max-width: 1099px`)

The mock's phone layout, starting at 1100px rather than the mock's 700px: between the two,
two 350px cards leave the tree a column 60px wide, and 1100 is already the line where this
section's grid broke before the phone breakpoint did anything.

- The section is `height: auto`, the figure is static, the box follows the section.
- `.archArea` is `position: relative; height: max(70svh, 420px)` at the top, with the tree
  inside it and the mark under the roots. The 420px floor is **not the mock's**: on a phone
  held sideways 70svh is under 300px, and see the arch below.
- The cards stack under it with 12px gaps and 12px side margins; padding `22px 22px 24px`;
  the name 24px, the paragraph 14.5px. The section pads 14px at the top and sides and 26px at
  the foot, so the last card has 12px of ink under it — the gap between cards. **Not the
  mock's**, which left 4px.
- The label at 52px / 100px, and 22px / 100px under 768px — under the header.

### The arch (`arch.ts`, pure)

Desktop: apex at `y = 0.10H`, feet at `(0.055W, H)` and `(W − 0.055W, H)`, and the circle
through them: `half = W/2 − 0.055W`, `s = H − apex`, `R = (half² + s²) / 2s`,
`cy = apex + R`. The path is one arc from the left foot (angle `atan2(H − cy, −half)`) over
the apex to the right foot (`atan2(H − cy, half) + 2π`). `contains(x, y)` is inside the
circle and `y ≤ H`.

Phone, where W and H are the arch area's size rather than the figure's: margin `m = 18`,
`r = (W − 2m)/2`, `apex = 96`, `yc = apex + r`. The path is a line
`(m, H) → (m, yc)`, an arc about `(W/2, yc)` of radius `r` from π to 2π, a line
`(W − m, yc) → (W − m, H)`. `contains` is inside the circle, or `|x − W/2| ≤ r` and
`y ≥ yc`, and `y ≤ H`. **Not the mock's:** `r` is also capped at `H − apex − 40`, so on an
area too short for the full half circle — a phone held sideways — the arc's centre stays
40px above the floor, the legs still exist, and they stand at `W/2 ± r` instead of at `m`.
The mock's arc fell below the area there.

Both: `pointAt(p)` walks the path by length, `trace(ctx, p)` strokes it up to `p`, and
`region()` is the closed `Path2D` — the path plus the box's floor — for the scene to clip
to. `contains` is arithmetic, not `isPointInPath`: the mock lost the left half of its grass
and stars on every 2× screen to that call's device-pixel argument, and arithmetic also runs
in jsdom.

The tree on a phone: `room = H − 36 − (apex + 26)`, `height = min((2r − 24)/0.85, room)`,
the stage centred in the room under the apex, `min(800px, W)` wide.

Where each card surfaces, as a fraction of the path: left where the pen reaches the left
flank at the side cards' centre height, top at 0.5, right at the right flank. In flow the
cards are below the arch, so the fractions only pace the reveal: 0.3, 0.55, 0.8.

### The stroke (`arch.ts`, `drawStroke`)

`lineCap: round`, at `DPR = min(devicePixelRatio, 2)` like the tree. Two passes: rose
`rgba(196,122,156,0.55)` 1.6px with `shadowColor rgba(196,122,156,0.5)` and `shadowBlur
14`, then navy `rgba(42,57,75,0.62)` 1.3px with no shadow. While `p < 1` the pen itself: a
radial `rgba(171,82,99)` 0.55 → 0 over 26px, and a 2.6px dot at 0.95 — the seed's crimson.

### The scene (`dawn.ts`)

All coordinates are the figure's. `GY`, the horizon, is `stage.top + GROUND·stage.height`
with `GROUND = 0.74` exported by `tree.ts` (its ground line, no longer re-typed); `top` is
the apex; `R` is the arch's radius; `cx = W/2`.

The still, painted once per layout into an offscreen canvas:

- sky, `top → GY`: `#1b2635` at 0, `#2f4258` at 0.2, `#6f8598` at 0.46, `#b3bfc2` at 0.76,
  `#e6dccb` at 1;
- earth, `GY → H`: `#cfb48e`, `#bf9d72` at 0.55, `#8a6234` — the film's Quran bronze;
- four strata: 1px, `rgba(58,40,20, 0.12–0.20)`, at `GY + 34 + i·(H − GY − 30)/4 + rnd·12`,
  wavy in 90px quadratic steps, seed 5;
- the glow: an ellipse at `(cx, GY)`, `gw = min(440, 0.36W)` by `0.3gw`, `rgb(236,214,170)`
  at 0.72 → 0.28 at 0.45 → 0.

Stars, seed 11: 620 candidates at `x = cx + (rnd − 0.5)·2R`, `y = top + rnd·rnd·band`,
`band = 0.68(GY − top)`, kept where `contains(x, y)`. Size 0.7–2.6; alpha
`(0.5 + 0.5rnd)·(1 − 0.7·(y − top)/band)`; 12% carry a halo of radius 8× the size in
`rgb(255,236,196)` at 0.55 of the alpha; the point is `rgb(255,244,225)`. Twinkle
`0.72 + 0.28·sin(t·k + ph)` with `k` 0.5–1.8; 0.85 flat under reduced motion.

Grass, seed 23: 1600 candidates across `2(R + 20)`; 30% a front row rooted at
`GY + 9..19`, the rest at `GY + 3..11`; kept where `contains(x, y − 6)`. Nothing grows below
the line: the roots are underground. `k = clamp(stage.height / 517, 0.55, 1)`, so a smaller
tree stands in shorter grass. Height `(7 + 24t^1.2 + 6·front)·k`; width `1.1 (1.5 front) +
0.9t`; alpha `0.55 (0.7 front) + 0.35rnd`; 40% `rgb(52,150,148)`, the rest the ramp's
`rgb(98,191,189)`. Each blade is a quadratic from its root to `(x + lean·h, y − h)` through
`(x + 0.25·lean·h, y − 0.55h)`, `lean = (rnd − 0.5)·0.7 + wind`,
`wind = 0.35·sin(0.75t + 0.004x + ph)` — the tree's own wind, 0 under reduced motion.

Per frame: clear; nothing if `p ≤ 0`; clip to `region()`, and while `p < 1` also to the
wiper — a sector about the pivot `(cx, H + 0.6R)` of radius `6R` from the angle of the left
foot to the angle of the pen, so its edge stands nearly upright and passes through the pen;
then the still, the stars, the grass. The ink turns to sky in the pen's wake, and the whole
opening is sky once the stroke closes.

Its own clock: once the stroke has closed, `settle()` starts a rAF loop that repaints at
the last `p` and pen; `destroy()` stops it. **Not the mock's:** the loop skips frames while
the arch is off screen (an IntersectionObserver on the arch area, last entry wins, as in
`tree.ts`) as well as while the document is hidden — the mock kept drawing two thousand
strokes a frame for a reader who had scrolled on to Støtt oss. Under reduced motion there
is no loop; the scene is painted once.

### Motion (`Vision.tsx`)

- Mount: the tree (`createVisionTree(stage, canvas, { reduced, limbLabels: [], rootLabel:
  mark })`), the ink (`createInkWhenNear`, host the section, palette `film.vision`), the
  scene, the stroke. Then layout: measure the figure and the top card, compute the geometry,
  size the stage (a changed size dispatches `resize` so the renderer refits, as the mock
  does), lay out the scene, redraw the stroke and the scene at the current `p`. Layout runs
  on mount, on `document.fonts.ready` (the cards are measured, and the font changes their
  height), and on resize, debounced 300ms — the tree's own debounce is 240ms.
- The cards are hidden in JS at mount, `gsap.set(cards, { opacity: 0, y: 16 })`, never in
  CSS, so a failed script leaves the words visible.
- Arrival: a `ScrollTrigger` at `top 78%`, once, with the `onRefresh` guard — as today.
  `gsap.to(growth, { T: GROW, duration: 3, ease: none })`; on each update `tree.setT(T)`,
  `p = T / GROW`, the stroke to `p`, the scene at `(p, pointAt(p), now)`, and each card
  whose surface point the pen has passed (`p ≥ at + 0.004`), once:
  `gsap.to(card, { opacity: 1, y: 0, duration: 0.9, ease: EASE.out })`. On complete,
  `scene.settle()`.
- The mark fades in by the renderer from `rootBirth`, as the root label did.
- Reduced motion: `tree.setT(99)`, the stroke at 1, the scene painted once at 1, the cards
  at their CSS rest state with nothing set on them.
- The wordmark handoff trigger at `top top`: untouched.
- Destroy: the tree, the ink, the scene, the stroke, the triggers, the listeners.

### Tests

Unit, in vitest:

- `arch.test.ts` — the desktop circle passes through the apex and both feet; `pointAt` at
  0, 0.5 and 1 is the left foot, the apex, the right foot; `contains` says yes at the
  centre and no above the apex and no outside the circle at a foot's height; the three
  surface fractions increase and lie in (0, 1); the stage's bottom is `0.95H` and its height
  respects the cap on a narrow box; the phone path's total length is two legs and a half
  circle, and `contains` says yes inside the legs.
- `dawn.test.ts` — `scatter` is deterministic; every star is inside; every blade is rooted
  between `GY + 3` and `GY + 19` and inside; `k` clamps at both ends.
- `Vision.test.tsx` — the three names and their paragraphs render, in order; the mark holds
  IQRA and FOUNDATION; the figure carries the label; the section is labelled by
  `visjon-label`; there is no `[data-line]`.

End to end, in `sections.spec.ts`:

- The desktop arrival test: the three cards reach opacity 1, the mark reaches opacity 1,
  the tree canvas has paint, the scene canvas has paint (a 2D sample, like `treeHasInk`),
  `boxIsPainted`, the wordmark navy, one pin spacer.
- The resize test: unchanged in intent — the tree stays on screen and has paint after the
  resize — plus the side cards still lie inside the box.
- The phone test: the three cards and the mark reach opacity 1, each card's top is below
  the arch area's bottom, and the page does not scroll sideways.
- The «hand-set lines fit» tests lose their Visjon half; Misjon keeps its own.
- `hero.spec.ts`'s check that Visjon does not move when the fonts land is untouched and
  must still pass.

### Verification before the PR

tsc, eslint, vitest, `next build`, the e2e (with port 3000 checked free first — playwright
skips its build if anything is listening), lhci. Screenshots of the built site on the real
GPU (`--use-angle=d3d11 --enable-gpu`) at 1440×900 at 2×, 1366×768, 1100 wide, and 390×844
at 3×, set beside the mock's shots. A frame-time measurement of the section with the scene
settled, so the grass has a number before it ships; if it costs more than the ink's share
of a frame, that is reported, not hidden.

## What this is not

- Not Misjon. The headline's move is a later decision; its lines stay in the content file.
- Not the tree. `tree.ts` gains two exported constants and nothing else.
- Not the ink. It is unchanged and still declines where WebGL2 is missing; the scene is 2D
  and always draws, so the arch opens onto the sky on every device.

## Open after this ships

- The header's haze against a top card that high, when the section is at the top of the
  screen. Accepted for now.
- Real copy, if these paragraphs turn out not to be it.
