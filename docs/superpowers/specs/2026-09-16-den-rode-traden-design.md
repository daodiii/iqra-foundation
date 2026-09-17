# Den røde tråden — design

2026-09-16. Status: written after the checkpoint, from the owner's brainstorm and the live mock
at `/mock`; awaiting the owner's review before the implementation plan.

## Where this comes from

The identity-and-structure prompt (`docs/prompts/2026-09-15-fable-identitet-og-struktur.md`)
produced a base branch and three directions: A «Blekk og vann» (the draft's materials in
the brand's colours), B «Guiden alene» (flat, from the guide only), C «Fire felt» (the four
areas as colour fields). None was picked whole. The owner's verdict, 2026-09-16: the ink and
the water are what make the page look like something special; C's header and footer are the
best; C's four boxes without the numbers could be a section; and the site should use the
guide's white, burgundy, navy and turquoise, in water and ink, to make the sections.

A mock with every section switchable (material × ground × pigment, `/mock` on
`mock/materialer`) settled the rest: the four areas as four boxes of water, each over its
own colour, with the type popped by a veil; and the principle that each area owns a colour
wherever it appears — the brief's own «gjennomgående i både innholdet og den visuelle
kommunikasjonen». Two decisions the owner made explicitly:

- **Burgundy stays the brand's accent everywhere** (the dot, the pen's tip, the Støtt oss
  button). Samfunnsdeltakelse shares it as a ground. A full ground with the area's name on
  it is the area; a small accent is the brand.
- The four fields are **water**, not ink («4x vann was very cool»).

## The brief, and what carries it

| Brief | Carried by |
|---|---|
| 1 Posisjonering: selvstendig, allmennyttig, islamske verdier; the four areas through content and visual communication; a long-term institution | The copy verbatim; the four areas as the only colour on the site (the fields, the bands, the marks, the thread); no event feed on the home page, the institution's pages (Om oss, Menneskene bak, Styringsdokumenter) in the menu |
| 2 Hovedtekst + the two buttons | The hero: the film inside the mark, the headline, the paragraph, Utforsk vårt arbeid (navy) and Støtt oss (burgundy) |
| 3 Visjon, 4 Misjon | Two pen-framed cards on the brand's turquoise ink, under the hero |
| 5 Om oss | `/om-oss`: the four paragraphs; the line «i skjæringspunktet mellom kunnskap, dialog, møteplasser og samfunnsdeltakelse» carries the four area marks; the name's story below, as a story |
| 6 Fire hovedområder «gjerne som fire egne bokser» | The four fields of water on the home page, 2×2; the four bands of Vårt arbeid |
| 7 Menneskene bak Iqra | `/menneskene-bak`: the board paragraph, the empty collection with its honest line |
| 8 Meny og undersider, Støtt oss a button, own pages, less scrolling | C's header with the nine items, Støtt oss the burgundy pill; the six pages; the home page is three sections |
| 9 Identiteten: logo, colours, type used consistently; the name not the point; the thread | The tokens, the logo per ground, the two faces; the thread in the footer with the four words in their colours; the area colours as the one system |

## The system

### Colour

The guide's five, as tokens (`app/globals.css` `@theme`, already on the branch): navy
#2c394b, turquoise #67c1bf, light #f0f0f1, dark #393e46, crimson #ab5261, white. The tints
A added (`ink-soft`, `hairline`, `turquoise-mid` #a3dad8, `water-pale` #e6f4f3,
`water-floor` #addddc), and from C: the area tokens and the lift.

**The area mapping, declared once:**

| Area | Ground token | Water | Type on it | Logo variant | In the thread on navy |
|---|---|---|---|---|---|
| Kunnskap | `--color-area-kunnskap` = navy | night: ground navy, pools turquoise-mid and light | white heading, light text | `on-navy` | light |
| Dialog | `--color-area-dialog` = turquoise | the brand's water: pale #e6f4f3 to deep turquoise at depth 0.45, pools light / navy / turquoise-mid / navy | navy | `iqra-logo.svg` | turquoise |
| Møteplasser | `--color-area-moteplasser` = light | pale mix(white, light, 0.16) to deep light at 0.45, the same pools | navy | `iqra-logo.svg` | white |
| Samfunnsdeltakelse | `--color-area-samfunnsdeltakelse` = crimson | night: ground crimson, pools light | white heading, white text (the light is 4.4:1 on crimson; white is 5.1:1) | `on-crimson` | `--color-crimson-lift` (crimson 55% into white, 5.2:1) |

The night scenes have no depth ramp (`night: true` in `lib/water.ts`); the pale ones take the
page's `WATER_DEPTH` 0.45. Pool geometry is the brand water's: `[x, y, r, a]` =
`[0.2, 0.82, 0.5, 0.55]`, `[0.8, 0.22, 0.42, 0.16]`, `[0.58, 0.62, 0.5, 0.45]`,
`[0.1, 0.16, 0.34, 0.1]` on the pale scenes; `[0.2, 0.82, 0.5, 0.35]`,
`[0.8, 0.22, 0.42, 0.14]`, `[0.58, 0.62, 0.5, 0.28]` on the night ones (from
`components/mock/palettes.ts` `waterSceneFor`, ground × auto pigment). These four scenes
move into `lib/film.ts` as `brand.areaWater[key]`, beside `brand.ink` and `brand.water`,
and each gets a CSS still in `materials.module.css` mixed from the tokens, held equal to
`floorAt(scene, depth).ground` by `lib/film.test.ts` as the two existing ones are.

**Rules.** The colour marks the area and never decorates the page. All four appear
together only in the fields and in the bands. Elsewhere a colour appears only beside the
area's name, as a mark. Everything else is white or light with navy type. Visjon and Misjon
are the whole foundation, not an area: they stay on the brand's turquoise ink.

### Type

A's roles: General Sans for headings, labels, legends and buttons (600 headings, 500
labels tracked +0.02em); Supreme 400 for text. The fields and the bands: the name General
Sans 700 `clamp(30px, 3vw, 46px)` / 1.04, −0.02em; the text Supreme **500**
`clamp(17px, 1.2vw, 18.5px)` / 1.5, max 40ch; on the dark grounds a text shadow
`0 1px 2px rgb(0 0 0 / 0.28)`. `app/fonts.ts` ships General Sans 400/500/600/700 and
Supreme 400/500/700/800 already.

### The materials

`lib/ink.ts`, `lib/water.ts`, `lib/pen.ts`, `lib/near.ts` as on the branch. The box
(`components/materials/Box.tsx`) takes a palette or a floor, a tone and a ground; a dark box
(`data-tone="dark"`) gives its cards navy frost, light type and the light pen (`PEN_LIGHT`),
and the dot goes light on crimson. Built when near and quiet, paused off screen, nothing
under reduced motion, the CSS still where WebGL2 declines.

## The pages

### Home

Three sections and the footer. Nothing else.

1. **The hero** — as A: the film inside the mark (`iqra-mark.svg` as the mask, the dot and
   the tail solid crimson), 78vh desktop / 70vh phone, min 560px; the headline, the
   paragraph, the two pills. Poster under reduced motion and without JS.
2. **Visjon and Misjon** — as A: one box of the brand's ink, two pen-framed cards side by
   side (44% each) from 900px, stacked below; the legend on the line, the pen's gap.
3. **The four fields** — one rounded plate (`--box-radius` 30px, 20px on a phone, inset
   `--box-inset`, `overflow: hidden`), holding a 2×2 grid from 900px and a column below,
   edge to edge inside the plate, no gutters. Each cell is a box of water over its area's
   scene, `min-height: max(280px, 34vh)` from 900px, 220px below, padding 30px ×
   `clamp(24px, 3vw, 44px)`. In it, top-left: the name as `h3` and the text, both links'
   content — the whole cell is one `<a>` to `/vart-arbeid#<key>`, `aria-labelledby` the
   name; bottom-right the logo variant for the ground at 28px, opacity 0.8, `alt=""`. No
   numbers. **The veil**: a pseudo-element under the words, over the water, a linear
   gradient at 118deg of the ground at 82% → 58% at 38% → 0% at 72%, so the water is calm
   where it is read and alive where it is looked at. Hover: none beyond the link's
   underline; focus: a 3px ring in the heading's colour, offset 4px.
4. **The footer** — C's: the reversed logo, the nine links, the thread with each word in
   its area's colour and the full stops as dots, the facts.

### Vårt arbeid

The title and the mission headline as the lede on white (A's `work.module.css` head). Then
the four fields opened out: four plates of water down the page in A's plate rhythm (inset,
radius, one gutter), each in its area's scene, `min-height: min(56vh, 560px)`, the name
as `h2` and the text at the left, the veil, the logo top-right; each `id` = the area key,
`scroll-margin-top` the header + 16px. Not links.

### The other pages

`/om-oss`, `/arrangementer`, `/ressurser`, `/menneskene-bak`, `/styringsdokumenter`,
`/kontakt`, `/stott-oss` and the 404 keep the base's structure and A's `page.module.css`,
under C's shell. Quiet: white, navy type. Restyled only where cheap. Two small additions:

- **The area mark**: a 10px square of the area's colour (Møteplasser: light with a 1px navy
  hairline) before the area's name, inline. Used in Om oss's «skjæringspunktet» line and on
  cards that carry an area.
- **The area on content**: `arrangementer` and `ressurser` get an optional `area` select
  (the four keys) in `keystatic.config.ts` and `content/collections.ts`, typed in
  `lib/content.ts` (`area: AreaKey | null`), with fixtures; a card with an area shows the
  mark and the name under its title. `styringsdokumenter` and `menneskene` do not.

### The shell

C's `Header`, `Nav`, `Footer`, `site.module.css` (on the branch): the white bar, the
hairline, the logo at 40px, the nine items General Sans 500 14px, the current item's 4px
navy square, Støtt oss the burgundy pill; two rows 900–1179px (`--header-h: 118px` in
`globals.css`, after `:root`); the navy drawer under 900px. The admin route group:
`app/(site)/layout.tsx` carries the header and footer, `/keystatic` does not.

## Motion and cost

Five simulations on the home page (one ink, four water), four on Vårt arbeid. Each is
built by `buildWhenQuietNear` and pauses off screen; the ink simulates at 144px base
(112 narrow) and the water at its own; on a phone the fields stack and at most two are on
screen. Reduced motion: the stills, no pen. Software GL: the stills. Only the materials
move; the pen draws each frame once.

## Proof

- Unit (vitest): the mapping has a scene, a logo file on disk and type colours for every
  area of the brief; the four stills equal their floors; contrast ≥ 4.5:1 for the heading
  and the text on each ground under the veil's darkest point (computed from the scene's
  ground and the veil's 82%), and ≥ 3:1 on the raw floor; the fields render four links with
  the brief's names and texts and no numbers; the bands carry the ids; the area mark
  renders for each key; collections with and without an area read back.
- e2e (playwright, the base's suites extended): the home page's four links land on the
  four ids; the thread's words; the shell at 1440/1280/1024 and the drawer on a phone.
- Shots: `/` and `/vart-arbeid` at 1440×900, 1280×720, 1024×768, 390×844 (DPR 2–3, GPU
  flags) and 1366×768; `/om-oss`, `/arrangementer` and the 404 at 1440 and 390. No
  horizontal overflow, no console errors.
- Lighthouse on `/` and `/om-oss`, run from PowerShell (the Bash tool rewrites a bare
  `/path` argument), the JSON checked to exist before a score is quoted.

## Delivery

Branch `feat/den-rode-traden` from `mock/materialer` (which is A `b686620` + C's shell +
the dark-ground box + the mock). Order: merge the base `feat/identitet-og-struktur`
(`beaa054`: tests, README, scripts, e2e, briefs) in first; build; remove the `/mock` route
and `components/mock/` at the end (the derivations it needs live in `lib/film.ts` by then);
one PR against `main`, left unmerged for the owner. The three direction branches and
worktrees stay until the PR merges.

## Out of scope

The real photograph, the real facts (`[EPOST] [ORG.NR] [NUMMER] [KONTO]`), the people's
names, any content in the collections, the Vercel deploy. The hero's film stays the one
piece of imagery.

## Assumptions stated

- The hero is A's, unchanged; the owner has not asked for it to change.
- Visjon and Misjon stay on the turquoise ink, outside the area mapping.
- «Flate» (C's flat fields) is not built; the water fields replace it.
- The mock's chips and presets are a tool and are removed before the PR.
