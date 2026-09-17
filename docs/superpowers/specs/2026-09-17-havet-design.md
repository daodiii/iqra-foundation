# Havet — the four fields as one sea

The four fields on the home page of «Den røde tråden» (PR #35) rebuilt on the owner's
decision of 2026-09-17: not a mosaic that opens, but one act straight under the hero —
one water the size of the screen, and each field a tide of its colour that the scroll
pulls across it, the field's words surfacing once the tide has passed. Everything else on
the page — the hero, the seal, Om oss, Neste, Menneskene bak, Støtt oss, the footer — is
untouched.

## Where this comes from

- **The ask** (2026-09-17, ~17:00): «the 4 boxes need something cooler and show stopping.
  its the main point after the hero. make 3 brilliant mockups where all 4 are separate with
  some fantastic animations and motion control». Read, and stated before building, as: each
  area gets its own full moment, the four as one act under the hero, the scroll as the
  playhead.
- **Two rounds of six acts** on the branch `mock/boksene` (`e7018c9`, a throwaway): Y Rommene,
  Z Sporet, Æ Dypet, then («i did like æ, but i want to see 3 more … show stopping, with a x
  factor») Ø Kuben, Å Søylene, Ω Havet.
- **The choice: Ω Havet** — «i choose havet. put in memory, we continue in a new window. we
  will fix the size of the text later».
- **What stays from the standing decisions:** navy leads; each area wears its own colour;
  the water is calm; no dot labels, no pill links; the fields' words are the brief's;
  each field is one link to its section of Vårt arbeid; burgundy stays the accent.

## The act

A stage four screens tall, straight under the hero, before the seal's plate. A view the
height of the screen under the header is sticky inside it. The view holds one box of
water (`Box`, `calm`) the size of the view, and over the water the four fields' words as
four layers standing in the same place. The scroll is the playhead: `u` runs 0 → 3 down the
stage, and settles at the four whole numbers.

**The tide.** Between field `i` and field `i + 1` (for `i = min(2, ⌊u⌋)`, `t = u − i`) the
water's floor is retuned from the one area's water to the next: `WaterHandle.retune(from,
to, t)`. The second floor comes in from the left, `t` of the way across, as a soft band
(`TIDE_BAND = 0.08` of the width) whose edge the surface refracts — the rings bend the line.
Under the canvas the CSS ground is the same two colours mixed straight,
`color-mix(in srgb, <token i+1> t%, <token i>)`, so a device without WebGL2 still changes
colour. The height field is untouched: one water, a new floor.

**The words.** Field `k`'s layer is on (`--on`) by `clamp01((0.5 − |u − k|) / 0.3)`: gone
before the tide is halfway, fully up once it has passed. Two fields' words never share the
water (at most one `k` has `|u − k| < 0.5`). A layer is `data-on` (pointer-events, the link
clickable) while `|u − k| < 0.5`; off, it is `pointer-events: none` and out of the way.
An off layer sits 40 px lower; it rises as it comes on.

**A landing.** Once per arrival at a field (`|u − k| < 0.12`, re-armed once `|u − k| >
0.5`), a stone drops in the water under the field's NAME — the stir at the name's centre
in the canvas's 0–1 coordinates, y up — not at the box's centre.

**The settle.** GSAP ScrollTrigger, registered by the component itself (nothing on the site
imports `lib/gsap.ts` any more, and `normalizeScroll` stays off; `ignoreMobileResize` on
as the site had it): `start: 'top <header-h>px'`, `end: 'bottom bottom'`, `scrub: 0.4`,
`snap: { snapTo: settle, duration: { min: 0.25, max: 0.65 }, delay: 0.12, ease:
'power2.inOut', directional: false }`. `settle` is judged on the trigger's real
`progress` and `direction`, never on the landing GSAP projects from the velocity (a jump
of a third of a step was snapped two steps ahead by `snapTo: 1/3`): forward, past an eighth
of a step completes it; back, short of seven eighths returns; the result is always a whole
number over 3. There is no readable state between two fields, so it always settles.

**The boot settle.** ScrollTrigger's snap is deaf for the first half second of its life,
and a page that loads with its scroll restored mid-act gets no snap at all until the next
scroll (`lib/gsap.ts` documents the measurement). So 0.6 s after the trigger is made the
act checks itself once: if the page has not moved for a frame, the act is active, no snap
tween is running and `settle(progress)` differs from `progress`, it drives the window to
the settled position itself (0.65 s, `power2.inOut`) and stands down the moment anything
else moves the page (two pixels of slack).

**The words' size** — the OPEN item, the owner's words: «we will fix the size of the text
later». Built with the mock's numbers, in one place (`sea.module.css`, the `.stage`'s
custom properties): the name `clamp(32px, 8vw, 132px)` (phones ≤ 899 px: `clamp(30px,
8.6vw, 132px)`, so «Samfunnsdeltakelse» fits 350 px), the paragraph `clamp(17px, 1.5vw,
23px)` at 44ch (phones 40ch). Settled WITH the owner on the running page, not by guessing:
the one question asked in this build.

**Layout.** The name top-left, the paragraph and the logo (28 px, the guide's variant for
the ground) at the foot, the paragraph left and the logo right; under 700 px the foot
stacks (paragraph, then logo). The veil under the words runs left → right: the field's
own colour at 80 % fading to nothing at 78 % of the width, so the words stand in the left
column and the water opens to the right. On a dark field (navy, crimson) the type is
light/white with a breath of shadow; on turquoise and light, navy. The layer's colours are
the area's look (`AREA_LOOK`): `--ground` the area's token for the veil, `--card-ink` the
heading's ink, `--card-text` the text's. Padding: the field box's own (`fields.module.css`
`.field`: 30 px top and bottom, `clamp(24px, 3vw, 44px)` at the sides — measured on the
mock as served: 43.2 px at 1440, 24 px at 390; the mock's unit declared larger values that
the box's own always outranked, so this is what the owner saw). The stage's own background
is navy (seen only where `100vh` and `100dvh` differ, under the view on a phone while the
address bar shows).

**Without the act.** Under reduced motion no trigger is made, the stage gets no
`data-live`, and the stylesheet's default rules hold: the stage is in flow, the four
layers stand under one another on the one water, each at least 60 vh tall, all on, all
clickable. `Box` builds no simulation under reduced motion (the still is the whole answer)
— the four stand on the navy still. With JavaScript off, the same column.

**Without WebGL2.** `createWater` declines; the canvas stays transparent; the CSS ground
mixes with the tide as above. The navy still's pools (the stylesheet's, for the first
field) stay under the mix for all four — accepted; the mock did the same.

## The water (`lib/water.ts`)

`WaterHandle.retune(from: WaterFloor, to: WaterFloor, t: number)`. The show pass takes a
second floor (`groundB`, `nightB`, `causB`, `specB`), a `tide` and a `band`, and per pool
a `pside` (which floor it belongs to). `mixAt(p)` — how far the second floor has come at
point `p` of the bottom — is `1 − smoothstep(e − band/2, e + band/2, p.x)` with
`e = −band/2 + tide·(1 + band)`, evaluated at the REFRACTED floor point, so the surface
bends the edge. Night pools add light, day pools stain; between two floors the mix of
both: `mix(mix(c, pcol, a), c + pcol·a, nt)` with `nt = mix(night, nightB, m)`. The caustic
gain, the glint and its warmth mix the same way.

Pools: three of each floor (the shader holds six; a floor's fourth pool is its faintest and
is dropped), the second floor's phases offset by three so they wander independently. Until
`retune` is called the second floor is the first and `tide` is 0.

**Invariant:** with `tide = 0` and every pool on side A the shader is the old shader
exactly — `m = 0` everywhere, `mix(1 − m, m, 0) = 1`, and `mix(mix(c, pcol, a), c +
pcol·a, night)` is the old `night > .5 ? c + pcol·a : mix(c, pcol, a)` for `night ∈ {0, 1}`.
Every other box of water on the site is untouched. The JS twins `tideMix` and `tidePools`
are exported and tested; the GLSL line is the same expression and says so.

`createWaterWhenNear`'s handle forwards `retune` like `stir` (safe before the build).

## Deleted

- `components/home/Mosaic.tsx` and its test (`STIR_GAP` with it), the `.mosaic` rules in
  `scene.module.css`.
- `Fields` (the 2×2 grid) and its test, the `.plate`, `.grid`, `.item` rules and the 900 px
  grid rule in `fields.module.css`. `FieldBody` stays for the bands of Vårt arbeid; the
  `.field.<ground>` stills stay (the bands and the sea use them).

## The page, in order

1. **Hero** — as it is.
2. **The sea** — the act, full bleed, straight under the hero. Marked `data-fields`; the
   region is `site.pages.home.areasLabel`.
3. **Visjon · Misjon** — the seal, first in the plates' column (the `scene.module.css`
   `.stage`), which begins straight after the sea as the mock's `.plates` did.
4. Om oss, 5. Arrangementer, 6. Menneskene bak, 7. Støtt oss — as they are.

## Motion and cost

- One simulation instead of four under the hero (the sim is capped at 760 px wide, so one
  big canvas costs what one field did). The whole page: one water, three flat plates.
- The scrub tween is a GSAP tween: `lib/near.ts`'s `tweening()` sees it, so no box builds
  while the act is being scrolled — the same rule as every entrance.
- The sea's own box builds when near and quiet: it is near at load, and builds while the
  visitor reads the hero.
- Per frame while scrubbing: one `retune` (uniform writes), one `--ground` string, four
  `--on` writes, one `getBoundingClientRect` on the canvas. Nothing per frame at rest.
- Lighthouse, alternated on a quiet machine against the branch tip before this: within
  noise of it; LCP unchanged (the hero's film).

## Proof

Unit (vitest, jsdom):
- `lib/water.test.ts`: `tideMix(0, x) = 0` for `x ∈ {0, 0.5, 1}`; `tideMix(1, x) = 1`;
  at `tide = 0.5` the mix is 1 at `x = 0.4`, 0.5 at `x = 0.5`, 0 at `x = 0.6`, and the edge
  is `TIDE_BAND` wide; `tidePools` of two four-pool floors is six pools, the first three
  of `from` on side 0, the first three of `to` on side 1, colours as 0–1 RGB, the second
  side's phases offset by three; a two-pool floor keeps its two; a deferred water's `retune`
  before the build does nothing rather than throwing; `createWater` still declines without
  WebGL2.
- `components/home/tide.test.ts`: `settle` (forward: 0.30 → 1/3, 0.03 → 0, 0.70 → 2/3;
  back: 0.30 → 1/3, 0.96 → 1, 0.20 → 0; always a whole number over 3, never past 1 or
  under 0); `seaAt(u)` (u = 0: i 0, t 0, word 0 on 1 and live, the rest 0; u = 0.5: none
  on; u = 1: word 1 on 1; u = 2.4: i 2, t 0.4, word 2 on 1/3, not live; u = 3: i 2, t 1, word
  3 on 1); at most one word on for every u in steps of 0.01; `groundAt(u)` is the
  `color-mix` string of the two tokens with `t` as a percentage to one decimal.
- `components/home/Sea.test.tsx`: the region by its label, `data-fields`; one water box,
  calm, on the first area's ground and tone; four `[data-word]` in the areas' order, each
  with its `data-tone`, its heading (h3) with the area's name, its text verbatim, the
  guide's logo (decorative), one link named by the heading to `/vart-arbeid#<key>`; the
  stage is `data-live` after mount and NOT under reduced motion; no numbers 01–04.
- `app/(site)/page.test.tsx`: the areas region first, one water in it and one on the page,
  the four links and texts, at least five arrivals.
- `Mosaic.test.tsx` and `Fields.test.tsx` go with their components.

e2e (Playwright, the production build, desktop and phone):
- The home test in `pages.spec.ts`: `[data-fields]` is live, holds one water and four word
  layers; at the top word 0 is `data-on` and word 1 is not; scrolled to a third of the
  act plus a hair, within 3 s word 1 is `data-on` at `--on` 1.000, word 0 is not, and the
  sea's `--ground` is the second token at 100.0 %; a jump to 0.4 of a step settles to a
  whole step within 3 s; Dialog's link (on at u = 1) lands on `/vart-arbeid#dialog`.
- Reduced motion: no `data-live`; the four layers stand one under the other (tops
  strictly increasing).
- The rest of the home test unchanged (the seal opens, Om oss arrives, the sections in
  order, the honest lines).

On the running page (a production build served from the worktree on 3050):
- Shots at 1440, 1024, 768 and 390 wide at u = 0, 0.5, 1, 1.5, 2, 2.5, 3 (the tide's edge
  visible at the halves, the words up at the wholes), the edges (the hero above, the seal
  below), a landing frame with the stone under the name, reduced motion.
- Console clean, no page errors, ~60 rAF/s settled on the act.
- Lighthouse, alternated A B A B against the branch tip before this on a quiet machine
  (the owner's Chrome not on the site), from PowerShell; report both pairs.
- The text size: the owner's answer on the running page, one CSS change.

## Delivery

On `feat/havet` in `C:\Users\daodi\code\iqra-foundation-havet` (cut from
`feat/den-rode-traden` at `dc72f0b`), task by task, one commit each. Another session was
still finishing the D+R+V plan's last task in `..\iqra-foundation-mock` (its shots,
Lighthouse, the push and the PR body) when this was written: when it is idle and pushed,
`feat/den-rode-traden` is merged into `feat/havet`, the checks run again, and
`feat/havet` is pushed onto `feat/den-rode-traden` so PR #35 carries the sea; its body
gets a section. Before the push: everything else I would change, said in the message.

## Out of scope

The hero; the seal and the plates after it; the subpages; the mock furniture (the bar,
the strip, `?stille`, the other five acts — not carried over); the bracketed values; the
deploy; `mock/boksene` itself (a throwaway, read and left).

## Assumptions stated

1. The sea takes the mosaic's place and its entrance: no `Arrive` round it — the tide is
   the entrance.
2. `data-fields` moves from the mosaic's list to the sea's stage section, so «the fields
   first» keeps its meaning in the tests.
3. The words' sizes are the mock's until the owner says otherwise on the running page.
4. `Fields` (the grid) is deleted rather than kept unused; `FieldBody` and the stills stay.
5. The stage is 100 vh per step, the mock's length; the view is `100dvh − header`.
6. The box's `data-ground`/`data-tone` stay the first area's (as the mock); the word layers
   carry their own tone, and nothing on the box keys on them.
