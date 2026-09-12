# Broen: Arrangementer · Nyheter as one row, on ink in lit water

Date: 2026-09-12
Status: approved design, being implemented
Scope: the Arrangementer · Nyheter section (`components/happenings/`), its content, the
ink renderer's new mode, one new water floor and one new ink palette in `lib/film.ts`, the
box's still in `wash.module.css`, and the tests that encode the old axis. Not the other
sections, not the water renderer's shaders.

## Where this comes from

The brief, dictated on 2026-09-12: «We need to look at the arrangement and news section
again. Just make both of them one and make it really visually appealing and nice to look
at. Perhaps on the background, like, we have water and we have ink — something else that
can bridge the gap between those two would look really nice. Has to be spectacular for it
to work.»

Settled with the user, in order:

- **One row.** News and events in a single line of cards, oldest to newest, nothing above
  or below a line any more. (Chosen over «one list without the Nyhet/Arrangement split»
  and «keep the split, share the background».)
- **The material is D, «Blekk i vann»**, from the second round of mockups
  (https://claude.ai/code/artifact/a3bd0e6d-8cbe-4e56-9ce8-3a3412acac72): a real fluid,
  the ink dropped into clear, lit water — threads fall in from the top, unfurl, sink and
  thin out over a floor of light; a hand stirs it. Round one's A Ebru was rejected as not
  looking like ink on water; B, C, E and F were not chosen.
- **In date order, whatever the kind.** «Make it so that it is published by the date; news
  or arrangement doesn't matter.» The row is sorted by date across both lists, and «i dag»
  sits where today falls in it. The small Nyhet/Arrangement label stays on each card; it
  decides nothing about the order.

## What is there now

One time axis (PR #12): news below the line behind «i dag», events above it ahead, month
names written once where they change, the section on the page's own white with no box —
the «breath» between the ink boxes and the water boxes. The two lists are authored in
time order and carry `day` and `month` strings, never a date, because a real date on a
placeholder would be an invented one.

## The design

### The section

Heading on the page's white, as now: the label, «Det som kommer, og det som var.», the two
arrows. Below it a **box** like every other section's — the same inset, radius and glass —
holding the row. The box spans only the row (`inset: 0 var(--box-inset-x)` on a positioned
wrapper), not the heading. The «Alle …» links sit inside the box under the row, and are
still rendered only when the content file has an href.

The row is the existing drag rail: one `<ol>` of stops, native horizontal overflow with
snap, the mouse-drag, the arrows, the arrival at today. Each stop is a glass card
(`wash.card`): kind label, the day large with the month beside it, title, meta, note, and
the picture frame as a window onto the material. No month marks above the row, no hairline,
no pegs on the stops. The frames stay bracketed «[Bilde]» until there are photographs.

**«I dag»** is a crimson peg with the word under it, between the last stop dated before
today and the first dated after. Today is the visitor's, so it is decided on the client
after hydration (`useEffect`), not at build time on a static page; the server renders the
row without it, and the rail scrolls to it when it appears. The e2e still finds
`[data-today]`, on screen, with everything before it dated earlier and everything after it
dated later.

On a phone the row scrolls the same way; the cards are `76vw` wide, the box inset is the
phone inset. Nothing stacks — sideways is what a row is.

### The content

Each item gets **`date: string | null`** (ISO `YYYY-MM-DD`) and loses `day` and `month`,
which are derived from it. Null means «placeholder»: the card shows `[00]` and `[mnd]`
from the content's own strings, and the item sorts as a news item would (before today) or
an event would (after) so the placeholders keep the shape the section has today. Real
entries sort by their date, whichever list they are in. The content gate is untouched:
null is not a string, and a real date has no bracket to catch.

### The material

Two canvases in the box, each deferred and paused off-screen like the others:

1. **The water**, `lib/water.ts` unchanged, with a new floor `film.bridge`: paler than
   Arafat's, so the page still thins as it goes down (ink boxes → this → Arafat → green). A
   `WaterScene` at the page's one `DEPTH`, with pools of sky glare, a stone shadow, the
   ink's cream, and a pale blue.
2. **The ink**, `lib/ink.ts` in a new mode, `over`: the dye is colour carried by density
   rather than pigment absorbed by paper — stored as premultiplied colour + density,
   shown as `alpha = 1 − exp(−density · 1.85)` with the colour unmixed, on a context with
   alpha, so it composites over whatever is under the canvas. Its palette `film.drops` is
   the blues of Visjon and the golds of Misjon with one green from the water below. In
   this mode the live drops **rain**: they enter near the top with a downward push, small
   and dense, instead of appearing anywhere; the dye's dissipation is a palette knob
   (`clear`) so the threads take their time to thin. No ceiling is needed — the alpha
   saturates at the pigment's own colour and never darkens past it.

Both canvases carry `wash.paint` and fade in on their first frame. The box's CSS ground is
the floor's ground and its still is the floor's pools, as for the other water boxes, so a
device without WebGL2 sees lit water with no ink in it, which is a complete answer.

### What it costs

Two more WebGL2 contexts on the page (seven), both built only when the section is near
and stepped only while it is on screen — the same guard the other five have. The frame
cost is measured on the real GPU before the PR, not assumed.

## Tests

- `lib/ink.test.ts`: the pigment preparation for the three modes (subtractive purified,
  additive and over passed through as colour).
- `lib/film.test.ts`: the bridge floor is lighter than Arafat's and darker than the paper;
  the drops are only the page's own hues; hexes valid.
- `lib/ground.test.ts`: `.bridge` ground matches `film.bridge.ground` and its still is built
  from the floor's pools.
- `Happenings.test.tsx`: one row sorted by date across both lists; today between past and
  future; placeholders keep their side; labels on every card; frames; links; empty states.
- `e2e/sections.spec.ts`: the section order (ink, ink, ink-in-water, water, water); the box
  painted with `film.bridge.ground` and two canvases; the row sorted with today on screen;
  no dead links; the phone rail still scrolls and the page does not.
