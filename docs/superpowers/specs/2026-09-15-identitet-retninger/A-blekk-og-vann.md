# Direction A — «Blekk og vann» (the materials kept, in the brand's colours)

Worktree `C:\Users\daodi\code\iqra-foundation-dir-a`, branch `dir/a-materialer`, port **3021**,
scratchpad `C:\Users\daodi\AppData\Local\Temp\claude\C--Users-daodi-code-iqra-foundation\fbc1e303-3444-4286-890b-c9635366874b\scratchpad\dir-a\`.

## The idea, in one paragraph

The draft's materials become the brand's ground. Ink spreading through water and clear water
over a floor are things with real physical behaviour, and this owner has kept every material
that behaves and rejected every metaphor; what was wrong with them was only their colours
(sampled off a PNG and then chosen by eye) and the draft's structure. So: the same two
simulations (`lib/ink.ts`, `lib/water.ts`), recoloured to the guide's palette, hold the page's
sections; the pen (`lib/pen.ts`) draws the frame round every box of copy in the brand navy with
the logo's crimson at its tip; and the hero film is kept, seen through the logo itself.
Everything else of the draft — the giant Geist letters, the tree, the book, the wall, the
timeline — goes, and you say so in your report.

## The home page, top to bottom

1. **The hero: the film inside the mark.** A full-width band (min 560px, ~78vh on desktop,
   ~70vh on a phone) on the page's white. Centred: the logo mark «iQRa» from
   `public/brand/iqra-mark.svg` — its four navy paths become a mask (an SVG `<mask>` or
   `clip-path` with the same paths, scaled to ~62vw on desktop, ~88vw on a phone), and the
   film (`public/media/iqra-loop-1080.webm` first, `.mp4` second, poster `iqra-poster.jpg`,
   muted, looped, playsInline, `pickSource` from `lib/media.ts` picks 720p on a phone) plays
   inside the letters. The dot of the i and the tail out of the Q stay solid crimson on top of
   the mask (they are the accent, not windows). Under the mark, «Foundation» is not drawn — the
   headline takes over: `brief.home.headline` (General Sans 600, clamp(30px, 3.6vw, 52px),
   navy, max 18ch), `brief.home.paragraph` (Supreme 400, 18–20px, ink), the two buttons
   (`site.cta.work` navy filled pill, `site.cta.support` crimson filled pill — Støtt oss is
   always crimson on this site, it is «tydelig knapp»). Reduced motion or no video: the poster
   frame stands in the letters. With JavaScript off: the poster in the letters (the `<video>`
   carries `poster`). Nothing pins, nothing scrubs; the letters do not open — this is the
   name carrying the film, not the film carrying the name.
2. **Visjon and Misjon on ink.** One box of ink (the draft's box geometry: a rounded rectangle
   inset from the section, `border-radius` 30px on desktop / 20px on a phone, `overflow:
   hidden`, the canvas `position:absolute; inset:0`, a CSS still gradient underneath so the
   box has its colour before any script runs and on a device without WebGL2). The ink palette
   is the brand's: paper `--color-light` #f0f0f1, pigments in the turquoise family —
   `['#67c1bf', 3], ['#a3dad8', 3], ['#2c394b', 1]` at a load like the draft's Visjon
   (`strength: 0.9 * (0.55/0.7)`, `peak: 0.3 * (0.55/0.7)`) — write it as a new palette in
   `lib/film.ts` (`brand.ink`) and delete the draft's five scenes and their tests; rewrite
   `lib/film.test.ts` for the brand palettes (one hue family, darkest rarest, ground light).
   Two pen-framed cards on the ink, side by side on desktop (each ~44% wide), stacked on a
   phone: «Visjon» (legend on the frame's line, the pen's gap under it) with
   `brief.vision.headline` as its heading (General Sans 600, 24–28px) and
   `brief.vision.paragraph`; «Misjon» likewise. The frame material is the draft's
   `.frame` (lift it from `git show 5522a43:components/wash.module.css`): a hairline drawn by
   `createFrame(card)` on `[data-frame-canvas]` with `[data-legend]` in the gap, the inside
   barely frosted (`backdrop-filter: blur(12px) saturate(1.4)`, white at 0.3 — UNPREFIXED
   property only). The pen's colours in `lib/pen.ts` `drawStroke`: change the glow from rose
   to a turquoise haze (`rgba(103,193,191,0.35)`), the line navy, the moving tip crimson —
   the logo's accent. The frames draw themselves over 0.8s when the box is on screen
   (IntersectionObserver, once; instantly under reduced motion or without JS: `p = 1`, and
   the CSS still shows the copy regardless).
3. **The four areas on water.** One box of clear water (`createWaterWhenNear`) over a floor
   in the brand: pale `#e6f4f3` (turquoise at 25% into white — add as a token), deep
   `#67c1bf`, pools of navy at low alpha and light — a new `brand.water` scene in
   `lib/film.ts`, depth 0.45. On it, four pen-framed cards in a 4-column row at ≥1180px, 2×2
   at 700–1179, stacked on a phone: each card's legend is the area's name (`brief.areas[i]
   .name`), its copy the area's text, and the whole card is a link to `/vart-arbeid#<key>`
   (the name is the link; the card's frame is drawn round it). A crimson dot (the i's dot,
   10px) stands at the start of each legend: the same four dots are the full stops of the red
   thread in the footer — make the footer's thread render each full stop as a crimson dot
   span (`.` replaced by a dot element with the period kept for screen readers via
   `aria-hidden`/visually-hidden text).
4. **Footer** (the base's, restyled to your idiom: the reversed logo `iqra-logo-on-navy.svg`).

Home is these three sections. Nothing else.

## Vårt arbeid

The four areas as four sections down the page, alternating ink (Kunnskap, Møteplasser) and
water (Dialog, Samfunnsdeltakelse), each a box with one pen-framed card holding the area's name
as the legend and its text as the copy, each section `id` = the area key so `#kunnskap` lands
on it (`scroll-margin-top: calc(var(--header-h) + 16px)`). The page title «Vårt arbeid», the
mission headline as the lede on the page's white above the first box. On a phone every box is
a stacked card.

## Header

The base's structure. White bar, hairline bottom, the logo `iqra-logo.svg` at 40px, the items
General Sans 500 14px navy, the current page marked by a crimson dot before its label (the
i's dot again — one gesture, used everywhere), Støtt oss a crimson pill. On a phone the drawer.

## Type roles

Headings General Sans 600 (tight, −0.015em); the hero headline 600; text Supreme 400; labels
and legends General Sans 500 tracked +0.02em; buttons General Sans 500.

## Motion

Only the materials move: the film loops, the ink drifts, the water rains, the pen draws once.
Build each simulation with `buildWhenQuietNear` (`lib/near.ts`) so it never compiles its
shaders during a scroll. Reduced motion: no simulations (the stills), no pen animation.
Simulations decline on software GL by design (they return null); the CSS stills are the
complete answer.

## Notes

- The draft's `Vision.tsx` shows the wiring: `createInkWhenNear(canvas, { reduced, palette,
  host: section })`, `createFrame(card)` + `frame.p = 1; frame.draw()` / a GSAP tween on
  `p`, `keepFramesFitted(frames)`. The water: `createWaterWhenNear(canvas, { reduced, scene,
  depth, host })` — read `lib/water.ts` `WaterOptions`.
- Keep `lib/ink.ts`, `lib/water.ts`, `lib/pen.ts`, `lib/gsap.ts`, `lib/media.ts`, `lib/near.ts`
  and their tests green; `lib/gsap.ts` registers `normalizeScroll` at import — import it only
  from the client components that need GSAP, or drop GSAP entirely and drive the pen with
  requestAnimationFrame (simpler, and nothing on this page pins). Prefer the simpler.
- Measure the contrast of navy and `--color-ink-soft` on the frosted card over the darkest
  point of the stills (compute from the CSS still colours and the frost's alpha); ≥ 4.5:1 or
  raise the frost.
- Screenshots: launch Chromium headless with `args: ['--use-gl=angle', '--use-angle=d3d11',
  '--ignore-gpu-blocklist', '--enable-gpu', '--disable-gpu-sandbox']` so the simulations run
  (the default SwiftShader makes them decline and you would only see the stills); scroll in
  steps and wait ~1.5s at each box before shooting so the deferred builds land. Also shoot
  once WITHOUT the flags to see the stills, and say both looked right.
