# Scenene, Seglet og Neste — the home page rebuilt

The home page of «Den røde tråden» (PR #35) rebuilt on the owner's decisions of
2026-09-17: the plates open to the screen as they are read (D Scenene), the ink is gone
and the water stays only in the four fields and calmer, Visjon and Misjon are one seal on
navy (R Seglet), Arrangementer is the next event as a statement (V Neste), Ressurser leaves
the landing page, and the thread, the dot labels and the pill links go. The hero and the
footer are untouched. Everything else on the site is untouched.

## Where this comes from

- **D Scenene** (chosen from six page-wide directions): every plate is laid out at the full
  width of the page and clipped to the guide's inset; as it passes the middle of the screen
  the clip opens to the edges and the corners go square, then closes as it leaves. Nothing
  pins. Sections arrive at the tip line — the arrival the owner kept from direction C.
  With it, the owner's four cuts: the four fields first under the hero, no thread in the
  margin, no dot labels over titles, no pill links under sections («the title is the
  section's name and the menu is the way on»).
- **The materials verdict**: «the water and the smoke backgrounds … don't really scream
  serious». The ink goes everywhere; the water stays inside the four fields, calmer.
- **R Seglet** (chosen from nine Visjon/Misjon plates): the vision inside the mark's ring
  on navy, the four areas' names orbiting, the crimson dot at twelve, the mission beside.
- **V Neste** (chosen from six Arrangementer plates): the next event as the plate's
  statement — its date, its title word by word at the vision's size, its place, and a
  count of days, hours, minutes and seconds under it; the two after it as small rows.
- **Ressurser is not on the landing page** (the owner, with V). The menu is its way in.
- **Navy leads**: the owner said the site does not need to be turquoise; navy is the
  guide's primary. Støtt oss stands on flat navy — proposed as the default, never vetoed.
- Everything on the page is the brief's words or the site's functional microcopy, as
  before. The only new microcopy is the count's four labels.

## The page, in order

1. **Hero** — as it is.
2. **The four fields** — one mosaic that opens to the screen; each field's water `calm`;
   when the mosaic locks open a stone drops in each field's water, 110 ms apart.
3. **Visjon · Misjon** — the seal, on one navy plate that opens.
4. **Om oss** — on white: the title (a size up) and the brief's first two paragraphs, the
   second with its four marks; no eyebrow, no link.
5. **Arrangementer** — Neste, on one navy plate that opens.
6. **Menneskene bak** — on white: the title, the board paragraph, the people or the honest
   line; no eyebrow, no link.
7. **Støtt oss** — on one navy plate that opens: the pen-framed card as it is (the two
   bracketed numbers, the crimson button), centred.
8. **Footer** — as it is.

Between plates and white sections the page's own gutters, as now. The thread, the
eyebrows, the pill links and the Ressurser card are gone from the page; `#ressurser` is no
longer an id on it.

## The system

### The scene

`components/home/Scene.tsx` (`'use client'`) wraps one plate. It renders `<div
class="scene">` with `--open` on it, 0 to 1:

- `off` = (plate centre − viewport centre) / viewport height, per scroll frame (one
  `requestAnimationFrame` per scroll or resize event, passive listeners).
- `open = 1 − smoothstep((|off| − 0.2) / 0.38)`: fully open within ±0.2 H of the middle,
  closed beyond ±0.58 H. `openness(off)` is a pure export, tested.
- `onOpen(isOpen)` is called on the edge of `open > 0.97`, both ways.
- Under `prefers-reduced-motion: reduce` no listener is attached and `--open` stays 0.

`components/home/scene.module.css`:

- `.stage`: the plates' column — `display: grid; gap: var(--gutter); padding: 0 0
  var(--gutter)` — full width, no horizontal padding: the clip does the inset.
- `.scene > *` (the plate): `border-radius: 0; clip-path: inset(0 calc(var(--box-inset) *
  (1 − var(--open))) round calc(var(--box-radius) * (1 − var(--open))))`.
- The plate's content keeps the closed column: `.scene > [data-material] > div { width:
  calc(100% − 2 * var(--box-inset)); justify-self: center }`.
- The mosaic's cells keep theirs: `.mosaic [data-material] { --box-radius: 0 }`; odd cells
  `> div { width: calc(100% − var(--box-inset)); justify-self: end }`, even cells `start`;
  under 900 px every cell `calc(100% − 2 * var(--box-inset))`, centred.
- Reduced motion: `.scene { --open: 0 }`.

`home.module.css` loses `.plates`, `.inkBox` and `.pair` (the ink box is gone; the pair is
the seal's now); Vårt arbeid keeps its own `.plates` in `work.module.css`, untouched.

### The arrival

`components/home/Arrive.tsx` (`'use client'`) and `components/home/tip.ts` — the hook file
is not `arrive.ts`: `arrive.ts` and `Arrive.tsx` resolve to the same module on Windows
(TS1149).

- `useArrive(ref, onChange?, after = 48)`: the tip is `scrollY + 0.66 · innerHeight`
  (`LEAD = 0.66`). The element is marked `data-arrived` when the tip passes its top + 48 px
  and unmarked when the tip goes back above its top − 120 px, so scrolling up and down
  plays the arrival again. What stands on the first screen is already there: an element
  whose top is inside the viewport when the hook mounts is arrived at once, and one that
  stands on the page's first screen (judged once, at mount — a phone's address bar
  collapsing must not re-judge it) is never cleared, since the tip line sits above its
  top. Under reduced motion it is arrived at once, once. Listeners: scroll (passive) and
  resize; `check()` runs on mount.
- `Arrive` renders `as` (`'div' | 'section'`, default div) with `data-arrive`, sets
  `data-live` on mount (removed on unmount), forwards every other attribute (`id`,
  `aria-labelledby`, `className`), and calls `onArrive(arrived)` both ways.
- `arrive.module.css` — everything keyed on `.arrive[data-live]`, so **without script
  nothing is ever hidden**:
  - `[data-live]:not([data-arrived])` → `[data-prose]`, `[data-card]`: `opacity: 0;
    transform: translateY(18px); transition: none`; `[data-title]`: `clip-path: inset(0 0
    100% 0); transform: translateY(14px)`.
  - `[data-live][data-arrived]` → transitions `opacity 640ms / transform 760ms
    var(--ease-out-expo)`; `[data-prose]` delay 170 ms; `[data-card]` delay `calc(var(--i,
    0) * 120ms)`; `[data-title]` `clip-path 820ms, transform 820ms`, delay 60 ms.
  - A card or prose that holds the focus is shown before it arrives (`:focus-within` →
    `opacity: 1; transform: none`): the keyboard can land on a card the tip has not
    reached, and Chrome scrolls a focused element only as far as needed.
  - Reduced motion: no transitions.
- Every state a plate hides before its arrival (the seal's ring, orbit and dot, the
  statement's words, the count) is gated the same way, on `[data-live]:not([data-arrived])`
  of its own `Arrive` element. The mocks gated some of these on `[data-arrived]` alone,
  which hides them with JavaScript off; the build does not.

### The words

`components/home/Words.tsx`: the statement word by word. Splits on spaces; each word is a
`<span class="word" style="--w: i">`; a final full stop is a nested `<span class="stop">`
inside the last word (crimson: the logo's dot). The text content is the input unchanged,
so the brief's verbatim test and `getByText(…, { exact: true })` match the paragraph.
Its own sheet, `words.module.css`, used by the seal and by Neste alike: `[data-live]:not
([data-arrived]) .word { opacity: 0; transform: translateY(0.35em) }`; arrived: `opacity
520ms var(--ease-out) calc(var(--w) * 38ms), transform 760ms var(--ease-out-expo)
calc(var(--w) * 38ms)`; reduced motion: standing.

### The flat plate

`components/materials/Flat.tsx` + `flat.module.css`: a plate with no material in it, the
Box's shell (`mat.box`, `mat.inner`, the tone tokens, the pen's tone) so the frames draw on
it as on water. Props: `tint: 'navy' | 'light' | 'turquoise-pale'`, `className`, `art?`
(a node laid under the copy — kept for the day a plate wants one; unused on this page),
`frost?`. It renders `data-material="flat"`, `data-tone` (`dark` for navy), `data-ground`
= the tint, `--ground` and `--still: none`, `--frost: 0.35`. This page uses `navy` only.

### The water, calm

`lib/water.ts` gets `WaterOptions.calm`: rain two and a half times rarer (`RAIN`/`RAIN_NIGHT`
gaps × 2.5), half as heavy (amplitude × 0.55), a stir half as deep (× 0.5, radius × 0.8).
Off, nothing changes. `components/materials/Box.tsx` gets `calm?: boolean` (passed
through) and `onMaterial?: (live) => void`, called once the simulation is built (with the
handle; never for a device that declined). `Fields` and `Bands` pass `calm` — the same
water behaves the same on the home page and on Vårt arbeid. The ink branch of `Box` stays,
but `createInk` is imported lazily (`await import('@/lib/ink')` inside the build callback)
so the ink's code is not in any page's bundle while nothing uses it.

### The mosaic

`components/home/Mosaic.tsx` (`'use client'`): `Arrive` › `Scene` › `Fields` (the
arrival outside the scene, so the scene's first child is the plate the clip works on).
The fields' veil — the field's colour under the words, fading towards the logo — is drawn
on the box (`.field::before`, edge to edge), not on the cell's inner: in an open cell the
inner keeps the closed column and a veil on it stopped short of the water's edge. `Fields`
gains `data-card` + `--i` on each `li` (harmless outside an `Arrive`) and props `calm` and
`onMaterial(key, live)`. On `onOpen(true)` the mosaic stirs each field's water at its
centre (`stir(0.5, 0.5)`) `i × 110 ms` apart, in the areas' order; nothing on close.
The section keeps `aria-label={site.pages.home.areasLabel}` and `data-fields`.

### The seal (R)

`components/home/Seal.tsx` (`'use client'`) + `seal.module.css`. One `Scene` › `Flat
tint="navy"` (`--box-pad-y: clamp(64px, 9vh, 96px)`) › `Arrive` › the grid:

- `.sealRow`: `grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); grid-template-rows:
  auto auto; column-gap: clamp(32px, 5vw, 88px); row-gap: 8px; align-items: center`.
- `<section id="visjon" aria-labelledby="visjon-tittel">` spans the whole grid
  (`grid-column: 1 / -1; grid-row: 1 / span 2`) and is itself a **subgrid** on both axes
  (`display: grid; grid-template-columns: subgrid; grid-template-rows: subgrid`). Inside it
  the seal takes column 1, rows 1–2, and the paragraph column 2, row 1 (`align-self: end`).
  Not `display: contents`: the section keeps a real box (a zero-rect section fooled every
  script that measured it) and its semantics.
- `<section id="misjon" aria-labelledby="misjon-tittel" data-card style="--i: 1">` at
  column 2, row 2 (`align-self: start`): a hairline `hr` (`rgb(103 193 191 / 0.45)`, margin
  26px 0), `h2.name` «Misjon», `p.headline` (600 `clamp(21px, 1.9vw, 28px)/1.25`, white),
  `p.text` (Supreme `clamp(16px, 1.2vw, 18px)/1.6`, light at 0.88, max 54ch, margin-top 16).
  The two sections overlap in the grid area of column 2, row 2; `#visjon` lays nothing
  there and `#misjon`, later in the DOM, paints and receives the pointer.
- The seal: `position: relative; width: min(100%, 640px); aspect-ratio: 1; justify-self:
  center`. Inside, an `svg viewBox="0 0 100 100"` (`overflow: visible`, aria-hidden):
  - `<circle cx=50 cy=50 r=47 pathLength=100>` — turquoise, `stroke-width: 0.28`,
    `stroke-dasharray: 100`, rotated −90° about the centre so it draws from twelve;
    hidden as `stroke-dashoffset: 100`, arrived → 0 over 1500 ms `var(--ease-out-expo)`.
  - `<g class="orbit">` turning once in 80 s (`animation: spin 80s linear infinite`),
    opacity 0 → 1 over 900 ms after 900 ms; in it `<text><textPath href="#segl-bane"
    textLength={2π·40.5} lengthAdjust="spacing">` with the four areas' names in the
    brief's order, joined by «  ·  », **twice round** (once round was stretched letter by
    letter); font 500 `3.05px` (svg units), letter-spacing 0.06em, fill light at 0.78. The
    path `segl-bane` is the circle of radius 40.5 drawn as two arcs from (9.5, 50).
  - `<circle cx=50 cy=3 r=2.1>` crimson: `transform: scale(0)` (transform-box fill-box,
    origin center) → 1 with `cubic-bezier(0.34, 1.56, 0.64, 1)` over 460 ms after 1450 ms.
  - The inside (`position: absolute; inset: 0; display: grid; place-content: center;
    padding: 19%; text-align: center`): `h2#visjon-tittel.name` «Visjon» (500 15px, light
    at 0.72, margin-bottom 14px) and `p.statement` = `Words(brief.vision.headline)` at 600
    `clamp(19px, 1.8vw, 27px)/1.22`, white, `letter-spacing: var(--tracking-tight)`,
    balanced.
- The vision's paragraph: `p.lead` (Supreme `clamp(17px, 1.35vw, 20px)/1.55`, light at
  0.86, max 52ch) with `data-prose`.
- Under 900 px: one column, three rows (seal `min(100%, 440px)`, paragraph, mission), the
  inside's padding 16%, the statement 18px.
- Reduced motion: the ring drawn, the orbit still and visible, the dot in place, the words
  standing.
- Contrast on navy: white 12.6:1, the light 10.3:1; the names at 0.72 ≈ 6.5:1.

### Neste (V)

`components/home/Events.tsx` (`'use client'`) + `events.module.css`. Props: `upcoming:
Event[]` (the server's `splitEvents(getEvents(), todayISO()).upcoming`). One `Scene` ›
`Flat tint="navy"` › `Arrive` › `<section id="arrangementer" aria-labelledby=
"arrangementer-tittel">`:

- `.wrap`: `grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr); column-gap:
  clamp(32px, 5vw, 96px); row-gap: 48px; align-items: end`; one column under 900 px.
- Left, `.main`: `h2#arrangementer-tittel.name` «Arrangementer» (`data-prose`); then, with
  a next event: `p.when` = `writeDateTime(start, time)` (500 15px, tabular, light at 0.72,
  `data-prose`); `h3.title` = `Words(title)` (600 `clamp(30px, 3.8vw, 56px)/1.06`,
  −0.02em, white, max 18ch, balanced; 30px under 900 px); `p.place` = the place (500 16px,
  light at 0.8, margin-top 18, `data-prose`) followed, when the event has an area, by an
  `AreaMark` on its own line; then the count. With none: `p.text` = the honest line
  `site.pages.events.emptyUpcoming` (`data-prose`).
- Right, `.side`: `p.text` = `site.pages.events.description` (`data-prose`); then the second
  and third events as `ol.rows` › `li.row[data-card][--i]`: `span.rowWhen` «30.09 · 19:00»
  (`ddmm` + time; 500 13px tabular, 0.04em, light at 0.72), `h3.rowWhat` (600 17px/1.3,
  white), `span.rowWhere` = place (500 13px, light at 0.72) and the `AreaMark` when there
  is an area; hairline rules `rgb(103 193 191 / 0.45)` above the list and `0.2` between.
- **The count**: `dl.count` of four `div`s, each `dd` (600 `clamp(26px, 2.4vw, 36px)/1`,
  tabular, white; days unpadded, the rest two digits) over `dt` (500 11px, 0.08em,
  uppercase, light at 0.6) — the labels `site.pages.events.count = { days: 'dager', hours:
  'timer', minutes: 'min', seconds: 'sek' }`, the one addition to the site's microcopy.
  It renders an empty `dl` on the server and until mounted (so the server and the client
  agree), then the time left to `zonedTime(start, time)` and ticks every second; at zero
  it stays at zeros. Under reduced motion it is computed once and does not tick. Hidden
  before the arrival (`opacity 0, translateY(10px)`), in over 600/700 ms after 900 ms.
- `lib/dates.ts` gets `zonedTime(iso, time | null, zone = 'Europe/Oslo'): number` — the
  instant of that wall-clock time in Oslo, midnight when there is no time, found with
  `Intl.DateTimeFormat` (no library): guess the UTC instant, read the zone's wall clock at
  it, correct by the difference, once more for a DST edge. Tested: 2026-09-24 18:00 →
  16:00 Z; 2026-01-10 18:00 → 17:00 Z; null time → 00:00 Oslo. And `timeLeft(ms)` →
  `{ days, hours, minutes, seconds }`, tested at 0, at 59 s, at 7 d 2 h 30 m 35 s.
- `AreaMark` on a dark plate: `mark.module.css` gains `[data-tone="dark"] .mark { color:
  var(--color-light) }` and the squares in the areas' on-navy colours (`--color-light`,
  `--color-turquoise`, `--color-white` with no border, `--color-crimson-lift`) — the same
  tokens `areas.ts` gives the footer's words.

### The white sections

`components/home/Sections.tsx` keeps `OmOss`, `People` and `Support`; `EventsAndResources`
goes. `OmOss` and `People` render `<Arrive as="section" id=… className={styles.white}
aria-labelledby=…>`: the `h2` with `data-title`, the prose in a `div[data-prose]`; no
`page.eyebrow`, no `.more`, no `data-knot`. `sections.module.css`: `.white { padding: 72px
var(--margin) 24px; max-width: calc(var(--measure) + 2 * var(--margin) + 200px) }`
(48px / 12px under 700 px); `.title { font-size: clamp(36px, 4.8vw, 62px); max-width:
18ch }`; `.link`, `.linkOnCard`, `.more`'s link rules and `.pair` go; `.buttonCrimson`
stays for Støtt oss.

### Støtt oss

`Support` renders `Scene` › `Flat tint="navy" className={plate centre}` › `Arrive` ›
`<section id="stott-oss" aria-labelledby="stott-oss-tittel" data-card>` › `Frame` (the
legend «Støtt oss» as `h2`, the facts, the crimson button) — the card as it is, on navy,
the pen in light, `max-width: 560px`, centred. `Sections.tsx` becomes a client component
only where it must: `Support` and the two white sections use `Arrive`, which is a client
component taking server children; `Sections.tsx` itself stays a server module.

### Content and copy

- `site.pages.home.more` is deleted (all four labels: nothing uses them).
- `site.pages.events.count` is added (four labels).
- Nothing else in `content/` changes. The brief's test (`content/brief.test.ts`) and the
  content check keep passing.

### Deleted

`components/home/Thread.tsx`, `thread.module.css`; `data-knot` and `data-knot-at` from the
home page (nothing else reads them); `EventsAndResources`; the `.inkBox`/`.pair`/`.plates`
rules in `home.module.css`; the ink `Box` on the home page. `lib/ink.ts` and its test stay.

## Motion and cost

- Seven simulations on the page become four (the two ink boxes and the events' water go);
  the seal is SVG and CSS; the count is one `setInterval`; the scenes and the arrivals are
  scroll listeners coalesced to one frame. The page should be lighter than `aa863ca`, not
  heavier: TBT down, LCP unchanged (the hero's film).
- Nothing pins or scrubs. A plate opens and closes with the scroll; an arrival plays once
  per pass and replays on the way back.
- Reduced motion: plates stay inset, nothing stirs, nothing draws, the count stands still.

## Proof

Unit (vitest, jsdom):
- `Scene.test.tsx`: `openness`: 1 at |off| ≤ 0.2, 0 at |off| ≥ 0.58, 0.5 at 0.39, monotone
  between; reduced motion leaves `--open` unset.
- `tip.test.tsx`: with `getBoundingClientRect`, `scrollY` and `innerHeight` stubbed:
  arrives at tip ≥ top + 48, leaves at tip < top − 120, tells `onChange` both ways;
  reduced motion arrives at once.
- `Arrive.test.tsx`: the tag, `data-live` after mount, attributes forwarded.
- `Words.test.tsx`: text content unchanged; one `--w` per word; the full stop in `.stop`.
- `Flat.test.tsx`: `data-material="flat"`, `data-tone="dark"` for navy, `--ground`.
- `Seal.test.tsx`: `#visjon`/`#misjon` labelled by their `h2`s; the statement, the two
  paragraphs and the mission headline verbatim; the inscription holds each area's name
  twice; the plate is flat and dark.
- `Events.test.tsx`: three events → the first's title as an `h3` in the statement, the
  other two as rows, the count present after mount with the four labels (fake timers, a
  fixed system time); no events → the honest line and the paragraph; an event with an area
  → its `AreaMark`.
- `dates.test.ts`: `zonedTime` and `timeLeft` as above.
- `page.test.tsx` rewritten: one h1; the sections in order after the fields: `visjon`,
  `misjon`, `om-oss`, `arrangementer`, `menneskene-bak`, `stott-oss`; four fields of water;
  three flat navy plates; no thread canvas; no links inside `#om-oss` or `#menneskene-bak`;
  `#om-oss` with four marks; the honest lines; the Støtt oss button; no `data-knot`.
- Existing tests that named the removed things are updated, none deleted without a
  replacement.

e2e (Playwright, the production build):
- The home test in `pages.spec.ts` rewritten: title, description, h1, the buttons, Visjon /
  Misjon verbatim, the four fields (grounds navy … crimson), the section ids in order, no
  `more` links, no `[data-thread-canvas]`; the seal's ring and inscription present; three
  `[data-material="flat"][data-ground="navy"]`; scroll the seal's plate to the middle →
  its scene's `--open` reads ≥ 0.97 and its `clip-path` has no inset; scroll to Om oss →
  `#om-oss[data-arrived]`; the field link lands on its band.
- The JS-off and reduced-motion tests pass unchanged: nothing hidden, nothing waiting.
- `shell.spec.ts` untouched (the footer's thread is its own).

On the running page (a production build served from the worktree on 3030):
- Shots at 1440, 1024, 768 and 390 wide: each plate centred and open, mid-scroll frames
  of the seal's ring drawing and the count in; the phone frames.
- Console clean, no page errors, 60 rAF/s settled.
- Lighthouse, alternated A B A B against `aa863ca` on a quiet machine (the owner's Chrome
  not on the site), from PowerShell; report both pairs.

## Delivery

On `feat/den-rode-traden` in `C:\Users\daodi\code\iqra-foundation-mock`, task by task,
one commit each, pushed; PR #35's title and body rewritten to this page. Before the PR is
updated: everything else I would change, said in the message.

## Out of scope

The hero; the footer; the subpages (their eyebrow labels included — flagged, not done);
the deploy; the bracketed values; `lib/ink.ts` (kept, no longer bundled); the mock branches
(`mock/former`, `mock/papir`) — throwaways, read and left.

## Assumptions stated

1. `calm` goes on Vårt arbeid's bands as well as the fields.
2. The count's labels are functional microcopy in `site.no.ts` (dager · timer · min · sek).
3. The event's time is Oslo wall-clock time; the count is computed against Europe/Oslo.
4. Støtt oss is flat navy; nothing else is laid under it.
5. Ressurser leaves the home page entirely; `/ressurser` and its menu item stay.
6. The ink's code stays in the repository, imported lazily so it ships nowhere.
