# Iqra Foundation website — design spec (v2.1)

Date: 2026-09-07 · Status: v2.1, revised after the motion prototypes · Direction: **the film through the letters**
Prototype (the build reference): https://claude.ai/code/artifact/666ad202-2bf8-4f5a-802e-d842d43cb6f6 — its source is committed under `docs/superpowers/specs/prototype/`.
Earlier canvas (v1 layouts, alternatives): https://claude.ai/code/artifact/3132d95a-e0df-487d-b603-4205a4c16cb7

## 0. What changed from v1

The user chose motion concept B ("Gjennom bokstavene") over the v1 hero, and then asked for a tree. In v2:

- The hero is the film playing **inside giant IQRA letters**; scrolling opens the letters until the film fills the screen and the headline lands. No film-first overlay, no scroll lock, no session flag, no skip button, no logo handoff, no replay.
- The film's white logo end card is **cut from the loop**; the loop is the montage only (0–4.3 s). The letters are the mark. A small text **wordmark "IQRA"** fades into the header once the letters have opened.
- **Visjon** is the vision text (kinetic lines, smaller than in the prototype's first cut) beside **the tree**: a seed that becomes a tree with a fat root called *Iqra* and three limbs called *Dialog*, *Brobygging* and *Kunnskap*, grown by the scroll. (v2.1: the tree moved from Misjon to Visjon and became this symbol; it is not the quranic-grammar tree, though it shares its drawing technique.)
- **Misjon** is the mission text over one pinned night still (the Quran). Then the footer.
- The traced SVG logo is not needed for v1 (no logo image on the landing page).

Everything not mentioned here is unchanged from v1 (audience, voice, tokens, stack, budgets).

## 1. Purpose and scope

A new public website for Iqra Foundation, a Norwegian dawah organisation, to make it easy for Norwegians who are curious about Islam to start a conversation.

**In scope (v1 build):** the landing page `/` with header, the letters hero, Visjon with the tree, Misjon, footer; the motion described below on desktop and phone; Norwegian copy, placeholder grade, in one file.

**Out of scope:** Om oss, Doner and payments, contact form, CMS, English toggle, analytics, cookie banner (no cookies; no storage at all in v2).

## 2. Audience and voice

Unchanged: plain Norwegian the way a person talks; short sentences; commas and full stops over dashes; no slogan triplets, no marketing gloss. The only fact used is that *Iqra* means "read" and was the first word revealed.

## 3. Design tokens

Colours: navy `#2a394b`, crimson `#ab5263`, white `#ffffff`, night `#0e1620`, film-black `#0b1118`, ink-soft `#4b586a`, muted `#8a94a3`, hairline `#e3e7ec`, and for the tree: twig navy `rgb(84,98,116)`, root grey `rgb(74,90,110)`, leaf gold `rgb(201,154,63)`.

Type (Geist and Geist Mono via `next/font/google`):

| role | desktop | phone | weight | line-height | tracking |
|---|---|---|---|---|---|
| hero letters (SVG mask text) | 290 units in a 1000-wide box | same box, fitted to width | 800 | — | −18 units |
| h1 | 120 px | 60 px | 600 | 0.94 | −0.045em |
| vision line | clamp(26px, 3.6vw, 52px) | same | 600 | 1.05 | −0.035em |
| vision sub | clamp(17px, 1.4vw, 21px) | same | 400 | 1.5 | 0 |
| mission text | 40 px | 26 px | 500 | 1.2 | −0.025em |
| lede | 21 px | 17 px | 400 | 1.5 | 0 |
| tree limb name | 16 px | 14 px | 500 | 1 | −0.01em |
| tree root name | 18 px | 16 px | 600 | 1 | −0.02em |
| wordmark | 18 px | 16 px | 700 | 1 | 0.08em, uppercase |
| mono label | 12 px | 11 px | 500 | 1 | 0.10em, uppercase |

Layout: margins 80 px desktop, 24 px phone; header 72 px on all sizes (transparent, fixed). CTA pill 52 px high. No cards, no shadows, no other radii.

Motion vocabulary: entrances `expo.out`, crossfades `power2.inOut`, scrubbed growth `none` then `power2.in`; durations 300 / 600 / 700 ms for time-based tweens; scroll-scrubbed tweens use the timeline fractions in §6–§8. Reduced motion: nothing scrubs or autoplays; everything is laid out at rest.

## 4. Content

`content/site.no.ts`, the only place copy lives:

```ts
export const site = {
  lang: 'nb',
  name: 'Iqra Foundation',
  meta: { title: 'Iqra Foundation', description: 'Iqra betyr les. Vi snakker gjerne med deg om islam.' },
  header: { wordmark: 'IQRA', homeLabel: 'Iqra Foundation, til toppen' },
  hero: {
    word: 'IQRA',                       // the letters the film plays through
    h1Lines: ['Iqra betyr', 'les'],     // the full stop is rendered separately, in crimson
    lede: 'Det er det første ordet i Koranen. For oss betyr det å lese, å lære, og å snakke med folk som lurer på noe.',
    cta: 'Still et spørsmål',
    hint: 'Bla nedover',
  },
  vision: {
    label: 'Visjon',
    lines: ['Vi vil ha et Norge', 'der folk kjenner islam', 'fra ekte møter,', 'ikke fra overskrifter.'],
    sub: 'Der det er lett å spørre, og lett å få et ærlig svar.',
    tree: { root: 'Iqra', limbs: ['Dialog', 'Brobygging', 'Kunnskap'] },   // limbs left to right
  },
  mission: {
    label: 'Misjon',
    text: 'Vi forteller om islam på en vennlig og ærlig måte. Vi inviterer til samtaler, svarer på spørsmål og møter folk der de er. Slik bygger vi broer, og lærer av hverandre.',
  },
  contact: { email: '[EPOST]' },        // placeholder until the user supplies it
} as const;
```

The CTA links to `mailto:${site.contact.email}`. The prebuild content check refuses a production deploy (`VERCEL_ENV=production`) while `contact.email` contains `[`; locally it only warns.

## 5. Architecture

**Stack:** Next 16 App Router, React 19, TypeScript, Tailwind 4, GSAP 3 (core + ScrollTrigger) with `@gsap/react`, Vitest 4 + Testing Library, Playwright 1.55 (Chromium desktop + Pixel 7 emulation), sharp (stills), ffmpeg on PATH, Lighthouse CI. Same versions as `iqra-portal`.

```
app/layout.tsx           html lang="nb", fonts, metadata, poster preload
app/page.tsx             <Header/> <main><Hero/><Vision/><Mission/></main> <Footer/>
app/globals.css          @theme tokens, --margin, --header-h, base styles
content/site.no.ts       all copy (§4)
lib/gsap.ts              registers ScrollTrigger + useGSAP; EASE, DUR
lib/media.ts             pickSource({narrow, webm}) → loop file URL (§6.4)
components/Header.tsx    fixed, transparent; the wordmark link #site-wordmark (hidden until the hero opens)
components/hero/Hero.tsx        client: video + SVG mask + copy; the pinned timeline (§6)
components/hero/maskOrigin.ts   pure: origin inside the first glyph's stem (§6.3)
components/hero/hero.module.css
components/vision/Vision.tsx    client: lines beside the tree; the pinned growth (§7)
components/vision/tree.ts       the tree: generation, fit, drawing (ported from the prototype's buildVisionTree) (§7)
components/vision/Tree.tsx      the canvas box and the four names
components/vision/vision.module.css
components/mission/Mission.tsx  client: pinned night still with the mission text (§8)
components/Footer.tsx           name, year, mailto
scripts/media.mjs        ffmpeg + sharp: loop cuts, poster, Quran still (§6.4)
scripts/check-content.mjs, scripts/lib/content-check.mjs
public/media/            iqra-loop-1080.{webm,mp4}, iqra-loop-720.{webm,mp4}, iqra-poster.jpg, still-koran.{avif,webp}
e2e/hero.spec.ts, e2e/sections.spec.ts
docs/superpowers/specs/prototype/   the prototype source: app.js (buildVisionTree, the hero timeline), styles.css, index.tpl.html
```

The page is server-rendered at rest: letters closed, copy present but transparent, sections below in normal flow. Client components add the GSAP timelines after hydration. No inline boot script is needed in v2 because nothing is state-dependent before hydration.

## 6. The hero — the film through the letters

### 6.1 Anatomy

```
<section class="hero" id="hero">           position: relative; height: 100svh; overflow: hidden; background: film-black
  <video class="film">                     absolute, inset 0, object-fit: cover; muted, loop, playsInline, poster
  <svg class="mask" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" overflow="visible">
    <defs><mask id="letters">
      <rect x="-20000" y="-20000" width="41000" height="41000" fill="#fff"/>
      <text id="word" x="500" y="318" text-anchor="middle" dominant-baseline="middle"
            font-family="Geist" font-weight="800" font-size="290" letter-spacing="-18" fill="#000">IQRA</text>
    </mask></defs>
    <rect x="-20000" y="-20000" width="41000" height="41000" fill="#fff" mask="url(#letters)"/>
  </svg>
  <div class="scrim">                      absolute, inset 0, gradient to film-black at the bottom, opacity 0
  <div class="copy">                       absolute, left margin, bottom 96px (64px on phone), opacity 0: h1, lede, CTA
  <p class="hint">                         absolute, bottom centre, mono: «Bla nedover»
```

`meet` (not `slice`) keeps the whole word inside the viewport on every aspect ratio; the oversized rects make the white overlay cover the viewport regardless. On a 1440×900 viewport the letters are ~1060 px wide; on a 390 px phone ~290 px.

### 6.2 Timeline (ScrollTrigger: pin the hero, `start: 'top top'`, `end: '+=300%'`, `scrub: 0.5`)

Timeline time runs 0 → 1.18; scroll progress maps onto it linearly.

| time | tween |
|---|---|
| 0 → 0.55 | `#word` scale 1 → 7 about the origin (§6.3), ease `none` — the letters grow steadily; the film is seen through bigger windows |
| 0.55 → 0.80 | `#word` scale 7 → 14, ease `power2.in` — the rush open |
| 0.64 → 0.80 | `.mask` opacity 1 → 0, ease `power2.inOut` — the last white slivers dissolve (a text mask above ~15× stops rendering in Chromium, so it is never scaled further) |
| 0.40 → 0.90 | `.film` scale 1.12 → 1.0, ease `power1.inOut` |
| 0 → 0.08 | `.hint` opacity 1 → 0 |
| 0.72 → 0.92 | `.scrim` opacity 0 → 1 |
| 0.82 → 1.02 | `.copy` opacity 0 → 1, y 40 → 0, ease `expo.out` |
| 0.70 → 0.90 | `#site-wordmark` opacity 0 → 1 (the header's wordmark appears once the letters are gone) |
| 1.02 → 1.18 | hold |

On arrival (time-based, not scrubbed): `.film` fades in inside the letters over 1.6 s from opacity 0 / scale 1.18 to opacity 1 / scale 1.12, ease `power2.out`.

### 6.3 Origin of the opening (`maskOrigin.ts`)

The letters must open from **solid ink**, or a white counter dominates mid-way. The origin is the centre of the first glyph's advance box, at the word's vertical middle:

```
start = word.getStartPositionOfChar(0).x, end = word.getEndPositionOfChar(0).x, bb = word.getBBox()
origin = `${(start + end) / 2} ${bb.y + bb.height / 2}`      // GSAP svgOrigin, viewBox units
```

`maskOrigin({ start, end, bbY, bbHeight })` is a pure function so the maths is unit-tested; the component feeds it the measurements after fonts are loaded (`document.fonts.ready`).

### 6.4 Media (`scripts/media.mjs`, `lib/media.ts`)

- **Loop files** cut from the master (`generations/hero-web-1080-upscaled/iqra-hero.mp4`) with `-t 4.3` (cave → sujood → Arafat → Quran → Haram; before the logo fade), no audio: `iqra-loop-1080.mp4` (H.264, crf 23, faststart), `iqra-loop-1080.webm` (VP9, crf 33), `iqra-loop-720.mp4`, `iqra-loop-720.webm` (crf 24 / 35). The `loop` attribute does the rest; the hard cut back to the cave reads as one more cut in a montage of cuts.
- **Poster** `iqra-poster.jpg`: frame 0 (the cave), 1920 wide, JPEG q≈80.
- **Quran still** `still-koran.avif` / `.webp` at 2.80 s, 1920 wide.
- `pickSource({ narrow, webm })` → `/media/iqra-loop-{720|1080}.{webm|mp4}`. Chosen after hydration; the video element is server-rendered with `preload="metadata"`, `muted`, `playsInline`, `loop`, the poster, and no `src`.
- `play()` is called after the source is set; a rejection (autoplay blocked) is ignored — the poster stays inside the letters and everything else still works.

### 6.5 Phones and reduced motion

- Phones keep the pinned opening (it is the site). `ScrollTrigger.config({ ignoreMobileResize: true })`. The copy block sits at bottom 64 px with the CTA full-width.
- `prefers-reduced-motion: reduce`: no pin, no scrub, no autoplay. The hero shows the poster inside the closed letters at 100svh; `.copy` is rendered visible in normal flow directly under the hero (white background); the wordmark is visible from the start.

## 7. Visjon — the lines and the tree

**Layout:** white section, `min-height: 100svh`, a two-column grid centred vertically (`padding: 100px margin 60px`): the text left (label «Visjon», one line per `site.vision.lines` at the vision-line size with 2 px between lines, then `site.vision.sub`), the tree right in a box `height: min(76vh, 720px)`. Phones: one column, tree first at 52vh, then the text.

**Lines:** line *i* comes from `x: 120px × dir`, `skewX: −8° × dir`, opacity 0 → 0, 0, 1, with `dir` alternating −1, 1, −1, 1; duration 1.1 s, ease `expo.out`, stagger 0.09 s; triggered once when the section's pin starts (desktop) or when it reaches 60 % of the viewport (phones).

**The tree** (`components/vision/tree.ts`, a `<canvas>` filling the box; `Tree.tsx` adds four absolutely positioned names) is `buildVisionTree` from `docs/superpowers/specs/prototype/app.js`, ported to TypeScript without changing its behaviour. It is a symbol, not an illustration: a seed that becomes a tree whose root is Iqra and whose three limbs are Dialog, Brobygging and Kunnskap.

- **Generation:** a seeded random walk (`makeRnd`, multiplicative congruential) grows quadratic-bezier segments from the root. Depth 0 is the trunk (length 1, nearly straight); it splits into **exactly three limbs** (spread 1.15, length 0.78); deeper levels split into 2–3 (spread 0.7 / 0.62 / 0.54, length 0.62–0.76) to depth 4. Seeds 9…399 are tried until a tree has 30–64 tips, canopy balance `|minX+maxX| / (maxX−minX) < 0.12`, and the outer limbs at least 0.9 apart. Roots: one recursive spread of depth 2 (4 then 2 children) below the ground line.
- **Fit:** canopy scaled to the box (`GY = 0.74 H`, `TOPY = 0.06 H`, width ≤ 0.9 W), centred with 30 % of its natural lean kept; the roots fill the room between the ground line and 40 px above the box bottom, where the root name sits. `K = clamp(H / 640, 0.5, 1.4)` scales widths, lights and offsets.
- **Fat and tapered:** widths by depth `[30, 14, 7, 3.4, 1.8] × K` (roots `[18, 9, 4.5] × K`); every segment is drawn in eight short pieces whose line width runs from its own depth's width to the next depth's, round caps. Colours: trunk and limbs `navy`, depth ≥ 3 twigs `rgb(84,98,116)`, roots `rgb(74,90,110)`; all solid (translucent overlapping strokes bead).
- **Growth:** the seed (crimson `#ab5263`, r `7K`, with a crimson halo) appears over the first 0.3 of growth time and is absorbed between 0.35 and 0.95 as the trunk takes over, so no dot remains once the roots have spread; every segment has a birth `0.3 + depth × 0.5 + jitter` (roots `0.25 + depth × 0.35`) and draws over 0.6; each tip light is born 0.62 after its twig; each limb's name fades in from `limb.birth + 1.3` over 0.5 at a point 34 K px beyond the tip that reaches farthest along that limb's direction (clamped inside the box); the root name fades in from 1.0. Growth time `T` reaches 3.8 at the end of the pin; past 3.0, gold light-leaves occasionally drift down from the tips.
- **Look:** lights: gold `rgb(201,154,63)` cores r 2.2–4.4 K with a 4× radial glow at 0.28 alpha, twinkling; a ground-line gradient at `GY` (navy, 0.35 at centre); wind sway `sin(0.75 t + 0.004 y + phase) × 5K × height^1.8` on branches and lights; no mist on white. The canvas renders at `min(devicePixelRatio, 2)`, only while on screen (IntersectionObserver), and rebuilds on resize (debounced 240 ms).

**Motion, desktop and tablet (≥768 px, motion allowed):** the section is pinned over `+=160%` with `scrub: 0.6`; on every update `tree.setT(progress × 3.8)`; the lines run on `onEnter`.

**Phones:** no pin; when the section reaches 60 % of the viewport, the lines run and `T` goes 0 → 3.8 over 5 s (linear), once. **Reduced motion:** `T = 99` (fully grown, no wind, no twinkle, no leaves), lines at rest, no pin.

## 8. Misjon — one night still

A section over the Quran still (object-fit cover, opacity 0.62 over night, vertical gradient `rgba(14,22,32,.15) → .85`), `min-height: 100svh`, the text block bottom-left (label, mission text, CTA; max-width 760 px).

**Desktop and tablet (≥768 px, motion allowed):** pinned over `+=100%` with `scrub: 0.6`: the still drifts scale 1.00 → 1.06 across the pin; the text block rises y 40 → 0, opacity 0 → 1 (expo.out) between 0.08 and 0.38 of the pin, then holds.

**Phones:** no pin; the text block rises once (1 s, expo.out) when the section reaches 70 % of the viewport. **Reduced motion:** text at rest, no pin.

## 9. Responsive rules

Breakpoints: phone < 768, tablet 768–1023, desktop ≥ 1024. Header 72 px everywhere, fixed, transparent; the wordmark is white over the film and the night still and navy over white (it switches by a `data-on-dark` attribute that the hero timeline sets at 0.7, Visjon's pin clears on enter, and Misjon's pin sets on enter and clears on leave-back). Footer stacks on phones.

## 10. Performance budget

- LCP ≤ 2.5 s on simulated 4G: the LCP element is the poster (preloaded from `layout.tsx`).
- CLS < 0.05: the hero is a fixed 100svh box; the copy is absolutely positioned; nothing shifts.
- JS ≤ 160 KB gzipped on `/`.
- Video: 1080p loop mp4 ≤ 3 MB, webm ≤ 1.6 MB; 720p mp4 ≤ 1.2 MB, webm ≤ 0.8 MB. Still: AVIF ≤ 150 KB, WebP ≤ 220 KB. Poster ≤ 160 KB.
- The tree draws only while on screen; a 700 px canvas at DPR 2 with ~150 segments and ~50 lights stays under 4 ms a frame on a laptop.
- Lighthouse CI: performance ≥ 0.9, accessibility ≥ 0.95 (mobile preset).

## 11. Accessibility

- `<html lang="nb">`; one `<h1>` (in the hero copy). The SVG mask, video and tree canvas are decorative (`aria-hidden`); the tree's four names are real text in the DOM (visible to screen readers as a list: root, then limbs) with an `aria-label` on the box: «Et tre: roten er Iqra, greinene er Dialog, Brobygging og Kunnskap».
- The hero copy is in the DOM from the start (transparent, not `display:none`), so screen readers and search engines read it at once.
- Keyboard: the CTA and the wordmark are the only interactive elements; visible focus rings.
- Text over stills and film: white on the scrim / gradient ≥ 4.5:1 at the text position.
- Reduced motion honoured as in §6.5, §7, §8.

## 12. Error handling

- Autoplay rejected or video error: poster inside the letters, timelines run as normal.
- Fonts not yet loaded when measuring the origin: the component waits for `document.fonts.ready` before building the timeline; until then the letters render in the fallback face, which is acceptable for a frame.
- No 2D context (very old or headless environments): the tree box stays empty; the names still render at their rest opacity.
- Resize: `ScrollTrigger.refresh()` on resize (GSAP does this); the mask origin is recomputed on `refreshInit`; the tree rebuilds and refits.

## 13. Testing

**Vitest:** `maskOrigin` (3 cases), `pickSource` (4 cases), `contentProblems` (3 cases), tree generation (`genTree`/`fitTree` are pure given a box: exactly three depth-1 limbs, 30–64 tips, balance < 0.12, limb names ordered left to right by x), `Hero` renders word/copy/video sources from content, `Vision` renders one line per entry and the four names, `Mission` renders label and text, `Header` wordmark link, `Footer` email and year.

**Playwright** (desktop Chromium 1440×900, Pixel 7):
1. Hero at top: `.mask` opacity 1, `#word` at identity transform, `.copy` opacity 0, wordmark opacity 0.
2. Scroll 60 % of the pin: `.mask` opacity 0, `.copy` opacity 1, wordmark opacity 1, video playing (`currentTime > 0`).
3. Reduced motion: no `.pin-spacer`, `.copy` visible, video paused.
4. Visjon desktop: at the end of its pin every line is at identity/opacity 1 and all four tree names have opacity 1; the canvas has non-white pixels (sample the centre column).
5. Misjon desktop: pinned, text opacity 1 at the end of its pin; phone: no pin for Visjon or Misjon, tree names reach opacity 1 within 7 s of the section entering.

**Budgets:** Lighthouse CI on the production build.

## 14. Setup steps

1. `npx --yes create-next-app@16 . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --disable-git --yes`
2. `npm i gsap @gsap/react` · `npm i -D vitest@4 @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test@~1.55.1 sharp @lhci/cli`
3. `node scripts/media.mjs`; commit `public/media`.
4. Build order: tokens → content → media → pure logic → header/footer → hero → vision (tree) → mission → e2e → Lighthouse.

## 15. Assumptions and open items

- `[EPOST]` until the user supplies the address.
- The logo image is not used on the landing page; it returns on Om oss / Doner later (the PNG in `generations/refs` is the source until a vector arrives).
- Hosting on Vercel assumed, not part of v1.
- The loop's hard cut from the Haram back to the cave is accepted as part of the montage; a crossfaded seamless loop can be made later if it bothers anyone.
- The tree's shape is deterministic (seeded) at a given box size, so it looks the same on every visit at the same viewport; different viewports may pick a different seed.

## 16. Corrections found during implementation

Written after the v1 build (branch `feat/v1-landing`). The numbered sections above stand as
they were written; this records what building against them disproved, one line of evidence
each.

**§3 Design tokens.** `muted` #8a94a3 is **3.07:1 on white** — AA wants 4.5:1 for normal
text, so it passes only at 24px, or 18.66px bold. It is a dark-ground colour: right for
«BLA NEDOVER» on film-black, wrong for «VISJON» and the footer, both 12px on white, where
Lighthouse's `color-contrast` audit scores 0. The three on-white usages now point at
`ink-soft` #4b586a (7.23:1); the token's value is unchanged. — Also: the motion vocabulary
lists `expo.out`, `power2.inOut`, `none` and `power2.in`, but the hero's arrival tween uses
**`power2.out`**, which is not in the list.

**§7 Visjon.** `scrub: 0.6` on the tree's trigger **does nothing**. GSAP wires the scrub
tween inside `if (animation)` (ScrollTrigger.js:1067; `self.scrubDuration(scrub)` at :1071)
and this trigger is bare — it drives the tree from `onUpdate` instead — so `self.progress`
is raw scroll: at 1440px of pin a ~100px wheel notch steps growth time by 0.26 of 3.8, with
no catch-up. The growth is therefore unsmoothed, and §7's intent is unmet on the section's
centrepiece. — Also: the birth formula does not order a branch after its parent. Measured
on the shipped tree (83 segments), **67 segments start drawing before their parent has
finished**, worst overlap 0.326 growth units, and each limb's name lands ~0.8–1.0 before
the branch it names has finished (names at 2.14–2.34, subtrees complete at 3.11–3.14). The
lights are the one part that is safe: a tip's light is born 0.62 after a segment that draws
in 0.6.

**§9 Responsive rules.** Written for desktop only. It does not say what happens on phones,
where nothing pins after the hero so every wordmark handoff needs its own trigger; and it
does not mention that a ScrollTrigger refresh re-runs the hero's scrubbed `onUpdate` and
repaints the wordmark, which is why three triggers carry an `onRefresh` guard.

**§10 Performance budget.** "The LCP element is the poster (preloaded from `layout.tsx`)"
does not hold — the LCP element is **the hero's SVG mask `<text>` node**, with 84% of LCP
time spent in render delay. The preload is present and correctly pathed; the letters-mask
technique is simply what paints last. — The **160 KB gz JS budget is not achievable on the
mandated stack**: `/` measures **222.1 KiB gz**, of which **169.4 KiB is the shared Next
16.3.4 + React 19 App Router floor** that even `/_not-found` pays. Not a bundler artefact —
`next build --webpack` gives 220.4 KiB, within 1.7 KiB. Deleting GSAP entirely would still
miss the budget.

**§11 Accessibility.** It asks for visible focus rings but says nothing about focus landing
on a **transparent** control. Both interactive elements start at opacity 0 — the wordmark
until the hero opens, the CTA until the copy arrives — so the first Tab stop on `/` is an
invisible link with an invisible focus ring. Still open.

**§12 Error handling.** "The mask origin is recomputed on `refreshInit`" is unnecessary, and
was not implemented. The SVG has a fixed `viewBox 0 0 1000 600`, so `getStartPositionOfChar`
and `getBBox` return user units that do not change with the viewport; the prototype
measures once as well.

**§13 Testing.** The Playwright list never asks the phone project for the wordmark colour,
yet **both** phone bugs found by hand during the build were wordmark handoffs. The phone
scenario should assert `data-on-dark` — false at Visjon's top, true at Misjon's — and now
does.

**§15 Assumptions.** "Different viewports may pick a different seed" is false. `generate()`
takes no box: it searches seeds 9…399 against shape criteria alone, and `fit()` maps the
chosen tree into whatever box it is handed afterwards. It is the same tree at every
viewport.
