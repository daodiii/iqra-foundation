# Direction B — «Guiden alene» (built from the brand guide only; no simulation, no film)

Worktree `C:\Users\daodi\code\iqra-foundation-dir-b`, branch `dir/b-guiden`, port **3022**,
scratchpad `C:\Users\daodi\AppData\Local\Temp\claude\C--Users-daodi-code-iqra-foundation\fbc1e303-3444-4286-890b-c9635366874b\scratchpad\dir-b\`.

## The idea, in one paragraph

The site looks as if it came from the same hand as the brand guide. The guide's language is
flat plates of the five colours with the logo on each, «Foundation» tracked out in a rounded
lowercase under the mark, and nothing else — so the site is built from exactly that: white
and light pages, plates of navy and turquoise where a section needs weight, the logo on its
own turquoise plate as the one picture the foundation owns, tracked-out lowercase labels in
the manner of «Foundation», and the dot of the i as the single ornament. Calm, institutional,
typographic; no canvas, no shader, no film. Everything of the draft's craft is replaced, and
you say so in your report: the materials were a draft's answer to a brief that no longer
exists, and this direction answers the guide instead.

## The home page, top to bottom

1. **The opening: text and the plate.** On white, two columns at ≥1024px (text 7/12, plate
   5/12), stacked on a phone (plate first, at 70% width centred, then the text). Left: an
   eyebrow «Iqra Foundation» in the tracked lowercase style (General Sans 500, 13px,
   letter-spacing 0.28em, lowercase, crimson — this is the «Foundation» gesture from the logo,
   used as the site's label style everywhere), then `brief.home.headline` as the h1 (General
   Sans 700, clamp(36px, 4.6vw, 64px), navy, line-height 1.05, −0.02em, max 16ch), then
   `brief.home.paragraph` (Supreme 400, 19–21px, `--color-ink`, max 52ch), then the two
   buttons: `site.cta.work` navy filled, `site.cta.support` crimson filled (Støtt oss is always
   crimson on this site). Right: `public/brand/iqra-logo-plate.svg` — the MAIN logo on its
   turquoise square — as an `<img>` with rounded corners (radius 24px), sized to the column,
   `alt=""` (the name is in the text beside it). No motion beyond a soft fade-up of the column
   on load (CSS, 400ms, honours reduced motion).
2. **The red thread as a band.** Full-width navy plate (`--color-navy`), 96–120px tall on a
   desktop. Left: `brief.thread.name` «IQRA FOUNDATION» in General Sans 700, 14px, tracked
   0.18em, `--color-light`. Right (or under it on a phone): `brief.thread.line` «Kunnskap.
   Dialog. Møteplasser. Samfunnsdeltakelse.» in General Sans 500, clamp(16px, 1.6vw, 22px),
   turquoise, with every full stop rendered as a crimson dot (a span; keep the period for
   screen readers). This band is the site's motif; the footer repeats it.
3. **Visjon and Misjon.** A light section (`--color-light`) with two columns (a 1px hairline
   of navy at 12% between them at ≥900px; stacked on a phone). Each: the eyebrow style label
   («visjon», «misjon» — lowercase tracked, crimson), the headline (`brief.vision.headline` /
   `brief.mission.headline`, General Sans 600, clamp(22px, 2.2vw, 30px), navy) and the
   paragraph (Supreme 400, 17–18px).
4. **The four areas.** On white: a 4-column row (2×2 between 700 and 1179px, one column on a
   phone). Each column: a crimson dot (10px, the i's dot) then the number «01»–«04» in
   General Sans 500 13px tracked (turquoise-deep), a hairline above the column (navy 12%),
   the name (`brief.areas[i].name`, General Sans 600, 22px, navy) as a link to
   `/vart-arbeid#<key>`, the text (Supreme 400, 16px, ink-soft). Above the row, the label
   «vårt arbeid» in the eyebrow style and the four-word line `brief.four` («Kunnskap | Dialog |
   Møteplasser | Samfunnsdeltakelse») set large? No — keep the row alone; the band above
   already carries the four words.
5. **Footer**: navy plate, `iqra-logo-on-navy.svg`, the nine links in three columns, the
   thread again (same treatment as the band), the facts.

Home is these four sections and the footer. Nothing else.

## Vårt arbeid

White page: the eyebrow «vårt arbeid», the h1 «Vårt arbeid», the lede `brief.mission.headline`.
Then four full-width sections alternating white and light, each with its number «01» large
(General Sans 700, clamp(48px, 8vw, 120px), turquoise at 30% into white — a token — standing
behind or beside the heading), the name as h2, the text at Supreme 18px on a 60ch measure, each
`id` = the area key with `scroll-margin-top`. On a phone the number sits above the name.

## Header

White, hairline bottom, `iqra-logo.svg` at 40px; items General Sans 500 14px navy; the
current page underlined 2px turquoise (offset 6px); Støtt oss a crimson pill. Between 900 and
1179px the two-row header; a drawer under 900px, whose panel is a light plate with the items
large (General Sans 600, 22px) and Støtt oss crimson at the foot.

## Type roles

General Sans carries every heading, label and button (700 for the h1, 600 for section
headings, 500 for labels); Supreme carries every paragraph (400). The tracked lowercase label
style («Foundation») is the one typographic ornament; use it for eyebrows only.

## Motion

None that a visitor would call motion: hover and focus transitions (160ms), the opening
column's fade-up (400ms). Nothing on scroll.

## Notes

- Add the tints you need to `@theme` (`--color-turquoise-30`, etc.) and use nothing else.
- Compute contrast: turquoise text on navy (#67c1bf on #2c394b ≈ 6.3:1, fine at 16px+);
  crimson on white (#ab5261 on #ffffff ≈ 5.0:1, fine); turquoise on white fails for text
  (2.0:1) — never set text in turquoise on white or light; use `--color-turquoise-deep`
  (mix 70% turquoise into navy) for small turquoise-ish text on light grounds and check it.
- Remove nothing from `lib/` (the materials are the other direction's business), but import
  none of it.
