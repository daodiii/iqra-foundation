# Direction C — «Fire felt» (a different structure: the four areas are the architecture)

Worktree `C:\Users\daodi\code\iqra-foundation-dir-c`, branch `dir/c-felt`, port **3023**,
scratchpad `C:\Users\daodi\AppData\Local\Temp\claude\C--Users-daodi-code-iqra-foundation\fbc1e303-3444-4286-890b-c9635366874b\scratchpad\dir-c\`.

## The idea, in one paragraph

The brief says the four areas «skal være gjennomgående i både innholdet og den visuelle
kommunikasjonen». This direction takes that literally: the four areas are the site's
structure and its colour. Each area owns one of the guide's colours — Kunnskap navy, Dialog
turquoise, Møteplasser light (#f0f0f1 with navy type), Samfunnsdeltakelse crimson — and the
home page is four fields, one per area, under a short opening. Wherever an area appears (the
home fields, the sections of Vårt arbeid, the four words of the red thread) it wears its
colour, so a visitor can tell which one they are looking at without reading. The logo on each
field is the guide's variant for that ground (`on-navy`, `iqra-logo.svg` on turquoise and
light, `on-crimson`) — the guide's own colour-variation panel becomes the site's home page.
Flat, no simulation, no film; the draft's craft is replaced entirely, and you say so.

## The home page, top to bottom

1. **The opening, short.** On white, one column, left-aligned, max 60% width at ≥1024px:
   `brief.home.headline` as the h1 (General Sans 700, clamp(34px, 4.2vw, 58px), navy, −0.02em,
   max 18ch), `brief.home.paragraph` (General Sans 400, 18–20px, ink, max 56ch), the two
   buttons (`site.cta.work` navy filled, `site.cta.support` crimson filled). Padding so the
   whole opening is ~40vh on a desktop — the fields must be visible under it on a 1366×768
   laptop without scrolling.
2. **The four fields.** A 2×2 grid at ≥900px (each cell min 300px tall, ~38vh), a single
   column on a phone (each ~220px min). The grid is full-bleed (edge to edge, no gutters
   between cells, no radius — plates, like the guide). Cell i: background = the area's colour;
   in the top-left the area's number «01»–«04» in the cell's text colour at 60% (General Sans
   500, 13px, tracked 0.12em); the name as h2 (General Sans 700, clamp(26px, 2.6vw, 40px));
   the text (General Sans 400, 16–17px, max 44ch); bottom-right, the logo variant for that
   ground at 28px height, decorative (`alt=""`). The whole cell is a link to
   `/vart-arbeid#<key>` (wrap the cell's content in one `<a>` with the heading inside; the
   focus ring is inset 6px). Text colours: on navy — `--color-light` text and white heading;
   on turquoise — navy text (contrast 4.6:1, check it) and navy heading; on light — navy; on
   crimson — white. Hover: the cell's number and logo go to 100% and the cell lifts by 2px
   (transform, 160ms; none under reduced motion).
3. **Visjon and Misjon.** Below the fields, on white, two columns (stacked on a phone): each
   with a label («Visjon», «Misjon», General Sans 600 13px tracked, crimson), the headline
   (`brief.vision.headline` / `brief.mission.headline`, General Sans 600, clamp(22px, 2.2vw,
   30px), navy) and the paragraph (General Sans 400, 17px, ink-soft). A hairline between the
   two at ≥900px.
4. **Footer**: navy, the reversed logo, the nine links, the red thread with each of its four
   words carrying its area colour — Kunnskap in `--color-light`, Dialog in turquoise,
   Møteplasser in white, Samfunnsdeltakelse in a crimson lifted enough to read on navy
   (compute; mix crimson 60% into white if needed and add the token), the four full stops as
   dots — and the facts.

Home is these three sections and the footer. Nothing else.

## Vårt arbeid

The four areas as four full-bleed bands down the page, each in its colour with its logo variant
at the top-right and its number, name (h2) and text (max 60ch) at the left, each `id` = the
area key with `scroll-margin-top`; the page's h1 «Vårt arbeid» and the lede
`brief.mission.headline` on white above the first band. The bands are the home fields opened
out: the same cell, the whole width, taller (min 46vh on desktop).

## Header

White, hairline bottom, `iqra-logo.svg` at 40px; the nine items General Sans 500 14px navy;
the current page's label carries a 4px square of navy under it (not a dot: this direction's
mark is the square field); Støtt oss a crimson pill. Between 900 and 1179px the two-row
header; the drawer under 900px is a navy plate with light text, Støtt oss crimson at the foot,
and the reversed logo at its top.

## Type roles

General Sans for everything (700 headings, 600 section headings and labels, 500 menu and
numbers, 400 text). Supreme is not used in this direction (keep it in `app/fonts.ts` only if
another page still reads `--font-text`; set `--font-text` to General Sans in the tokens so the
subpages follow).

## Motion

On first paint the four fields rise in with a 60ms stagger (opacity + 8px translate, 500ms,
CSS animation, none under reduced motion). Hover lift on the fields. Nothing else.

## Notes

- Contrast table to compute and print in your report: navy text on turquoise, navy on light,
  white on crimson, light on navy, and the thread's four colours on navy.
- The four field colours belong in `@theme` as area tokens (`--color-area-kunnskap` … ) so
  Vårt arbeid, the thread and the fields read one declaration. Put the mapping (key → ground
  → logo variant → text colour) in one small module (`components/home/areas.ts`) with a unit
  test that every area of `brief.areas` has a colour and a logo variant.
- Remove nothing from `lib/`, import none of the materials.
