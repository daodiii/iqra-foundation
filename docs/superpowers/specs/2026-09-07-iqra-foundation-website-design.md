# Iqra Foundation website — design spec (v2)

Date: 2026-09-07 · Status: v2, revised after the motion prototypes · Direction: **the film through the letters**
Prototype: https://claude.ai/code/artifact/666ad202-2bf8-4f5a-802e-d842d43cb6f6 (opens on concept B)
Earlier canvas (v1 layouts, alternatives): https://claude.ai/code/artifact/3132d95a-e0df-487d-b603-4205a4c16cb7

## 0. What changed from v1

The user chose motion concept B ("Gjennom bokstavene") over the v1 hero. In v2:

- The hero is the film playing **inside giant IQRA letters**; scrolling opens the letters until the film fills the screen and the headline lands. There is no film-first overlay, no scroll lock, no session flag, no skip button, no logo handoff, no replay.
- The film's white logo end card is **cut from the loop**; the loop is the montage only (0–4.3 s). The letters are the mark. A small text **wordmark "IQRA"** fades into the header once the letters have opened.
- After the hero: **Visjon** as kinetic lines on white (from alternating sides), then **Misjon** over one pinned night still (the Quran), then the footer. The two-still stage and its rail are gone.
- The traced SVG logo is not needed for v1 (no logo image on the landing page).

Everything not mentioned here is unchanged from v1 (audience, voice, tokens, stack, budgets).

## 1. Purpose and scope

A new public website for Iqra Foundation, a Norwegian dawah organisation, to make it easy for Norwegians who are curious about Islam to start a conversation.

**In scope (v1 build):** the landing page `/` with header, the letters hero, Visjon, Misjon, footer; the motion described below on desktop and phone; Norwegian copy, placeholder grade, in one file.

**Out of scope:** Om oss, Doner and payments, contact form, CMS, English toggle, analytics, cookie banner (no cookies; no storage at all in v2).

## 2. Audience and voice

Unchanged: plain Norwegian the way a person talks; short sentences; commas and full stops over dashes; no slogan triplets, no marketing gloss. The only fact used is that *Iqra* means "read" and was the first word revealed.

## 3. Design tokens

Colours: navy `#2a394b`, crimson `#ab5263`, white `#ffffff`, night `#0e1620`, film-black `#0b1118`, ink-soft `#4b586a`, muted `#8a94a3`, hairline `#e3e7ec`.

Type (Geist and Geist Mono via `next/font/google`):

| role | desktop | phone | weight | line-height | tracking |
|---|---|---|---|---|---|
| hero letters (SVG mask text) | 290 units in a 1000-wide box | same box, fitted to width | 800 | — | −18 units |
| h1 | 120 px | 60 px | 600 | 0.94 | −0.045em |
| kinetic line | clamp(34px, 5.6vw, 84px) | same | 600 | 1.0 | −0.04em |
| mission text | 40 px | 26 px | 500 | 1.2 | −0.025em |
| lede | 21 px | 17 px | 400 | 1.5 | 0 |
| wordmark | 18 px | 16 px | 700 | 1 | 0.08em, uppercase |
| mono label | 12 px | 11 px | 500 | 1 | 0.10em, uppercase |

Layout: margins 80 px desktop, 24 px phone; header 72 px on all sizes (transparent, fixed). CTA pill 52 px high. No cards, no shadows, no other radii.

Motion vocabulary: entrances `expo.out`, crossfades `power2.inOut`, scrubbed growth `none` then `power2.in`; durations 300 / 600 / 700 ms for time-based tweens; scroll-scrubbed tweens use the timeline fractions in §6. Reduced motion: nothing scrubs or autoplays; everything is laid out at rest.

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
components/vision/Vision.tsx    client: kinetic lines (§7)
components/mission/Mission.tsx  client: pinned night still on ≥768 px, stacked below (§8)
components/Footer.tsx           name, year, mailto
scripts/media.mjs        ffmpeg + sharp: loop cuts, poster, Quran still (§6.4)
scripts/check-content.mjs, scripts/lib/content-check.mjs
public/media/            iqra-loop-1080.{webm,mp4}, iqra-loop-720.{webm,mp4}, iqra-poster.jpg, still-koran.{avif,webp}
e2e/hero.spec.ts, e2e/sections.spec.ts
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

## 7. Visjon — kinetic lines

White section, padding 18vh top / 24vh bottom. Label «Visjon» (mono), then one `<div>` per entry of `site.vision.lines` at the kinetic-line size, then `site.vision.sub` in ink-soft at clamp(18px, 1.6vw, 24px), max-width 640 px.

Motion (time-based, triggered once at `start: 'top 75%'`): line *i* comes from `x: 140px × dir`, `skewX: −10° × dir`, opacity 0 → 0, 0, 1 with `dir` alternating −1, 1, −1, 1; duration 1.1 s, ease `expo.out`, stagger 0.09 s. Reduced motion: lines at rest.

## 8. Misjon — one night still, and the tree

Layout: a section over the Quran still (object-fit cover, opacity 0.62 over night, vertical gradient to 0.85 night at the bottom). Inside, a two-column grid bottom-aligned: the text block left (label, mission text at 40 / 26 px, CTA), the **tree** right (`height: min(70vh, 640px)`). On phones the grid is one column with the tree above the text at 42vh.

**The tree** (`components/mission/tree.ts` + `Tree.tsx`, a `<canvas>` filling a `min(72vh, 680px)` box; 46vh on phones) is a port of the tree on quranic-grammar.com, whose working prototype is committed at `docs/superpowers/specs/prototype/app.js` (`buildIqraTree`). The build copies that function into TypeScript without changing its behaviour:

- **Generation:** a seeded random walk (`makeRnd`, multiplicative congruential) grows quadratic-bezier segments from the root: depth 0 always splits into **three limbs** (the three actions in the mission text), deeper levels into 2–3, to depth 4; each segment bends toward straight up (`lerp(ang, −π/2, 0.14)`), bows sideways, and shortens by 0.6–0.76. Seeds 9…199 are tried until a tree has 28–60 tips and a canopy balance `|minX+maxX|/(maxX−minX) < 0.16`. Roots: one recursive spread of depth 2 below the ground line.
- **Fit:** the canopy is scaled to the box (`GY = 0.86 H`, `TOPY = 0.06 H`, width ≤ 0.92 W), centred with 30 % of its natural lean kept.
- **Growth:** every segment has a birth time `0.3 + depth × 0.5 + jitter` and draws over 0.6 s of growth time; each tip light is born 0.62 after its twig. The seed (crimson `#ab5263` dot with a gold basin glow and a rose core, additive blending) appears over the first 0.3. Growth time `T` reaches 3.8 at the end of the pin; the tree is complete around 3.3; past 3.0 light-leaves occasionally drift down from the tips.
- **Look:** strokes `rgba(227,179,92, 0.5 + 0.28 × (1 − depth/4))`, widths 6.5 / 4.2 / 2.8 / 1.8 / 1.1 by depth, round caps; roots at 0.26 alpha; lights: pale-gold cores `rgba(252,240,212)` r 1.8–4 with a 4.6× radial glow, twinkling; a ground line gradient at `GY`; four drifting mist ellipses; wind sway `sin(0.75 t + 0.004 y + phase) × 6 × height^1.8` on branches and lights. The canvas renders at `min(devicePixelRatio, 2)`, only while on screen (IntersectionObserver), and rebuilds on resize (debounced 240 ms).

**Motion, desktop and tablet (≥768 px, motion allowed):** the section is pinned over `+=140%` with `scrub: 0.6`. On every ScrollTrigger update, `tree.setT(progress × 3.8)`. The same timeline drifts the still scale 1.00 → 1.06 across the pin and raises the text block (y 40 → 0, opacity 0 → 1, expo.out) between 0.08 and 0.38.

**Phones:** no pin; when the section reaches 60 % of the viewport, `T` runs 0 → 3.8 over 4.5 s (linear) once, and the text block rises at the same time. **Reduced motion:** `T = 99` (fully grown, no wind, no twinkle, no leaves), text at rest, no pin.

## 9. Responsive rules

Breakpoints: phone < 768, tablet 768–1023, desktop ≥ 1024. Header 72 px everywhere, fixed, transparent, `mix-blend` never used; the wordmark is white over the film and navy over white (it switches by a `data-on-dark` attribute that the hero timeline toggles at 0.7 and the Misjon pin toggles on enter/leave). Footer stacks on phones.

## 10. Performance budget

- LCP ≤ 2.5 s on simulated 4G: the LCP element is the poster (preloaded from `layout.tsx`).
- CLS < 0.05: the hero is a fixed 100svh box; the copy is absolutely positioned; nothing shifts.
- JS ≤ 160 KB gzipped on `/`.
- Video: 1080p loop mp4 ≤ 3 MB, webm ≤ 1.6 MB; 720p mp4 ≤ 1.2 MB, webm ≤ 0.8 MB. Still: AVIF ≤ 150 KB, WebP ≤ 220 KB. Poster ≤ 160 KB.
- Lighthouse CI: performance ≥ 0.9, accessibility ≥ 0.95 (mobile preset).

## 11. Accessibility

- `<html lang="nb">`; one `<h1>` (in the hero copy). The SVG mask and video are decorative (`aria-hidden`); the site name is in the wordmark link's `aria-label`.
- The hero copy is in the DOM from the start (transparent, not `display:none`), so screen readers and search engines read it at once.
- Keyboard: the CTA and the wordmark are the only interactive elements; visible focus rings.
- Text over stills and film: white on the scrim / gradient ≥ 4.5:1 at the text position.
- Reduced motion honoured as in §6.5, §7, §8.

## 12. Error handling

- Autoplay rejected or video error: poster inside the letters, timelines run as normal.
- Fonts not yet loaded when measuring the origin: the component waits for `document.fonts.ready` before building the timeline; until then the letters render in the fallback face, which is acceptable for a frame.
- Resize: `ScrollTrigger.refresh()` on resize (GSAP does this); the origin is recomputed on `refreshInit`.

## 13. Testing

**Vitest:** `maskOrigin` (3 cases), `pickSource` (4 cases), `contentProblems` (3 cases), `Hero` renders word/copy/video sources from content, `Vision` renders one line per entry, `Mission` renders label and text, `Header` wordmark link, `Footer` email and year.

**Playwright** (desktop Chromium 1440×900, Pixel 7):
1. Hero at top: `.mask` opacity 1, `#word` at identity transform, `.copy` opacity 0, wordmark opacity 0.
2. Scroll 60 % of the pin: `.mask` opacity 0, `.copy` opacity 1, wordmark opacity 1, video playing (`currentTime > 0`).
3. Reduced motion: no `.pin-spacer`, `.copy` visible, video paused.
4. Visjon: after scrolling to it, every line has `transform: none`/identity and opacity 1.
5. Misjon desktop: pinned (`.pin-spacer` count 1 for it), text opacity 1 at the end of its pin; phone: no pin for Misjon, image block then text visible.

**Budgets:** Lighthouse CI on the production build.

## 14. Setup steps

1. `npx --yes create-next-app@16 . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --disable-git --yes`
2. `npm i gsap @gsap/react` · `npm i -D vitest@4 @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test@~1.55.1 sharp @lhci/cli`
3. `node scripts/media.mjs`; commit `public/media`.
4. Build order: tokens → content → media → pure logic → header/footer → hero → vision/mission → e2e → Lighthouse.

## 15. Assumptions and open items

- `[EPOST]` until the user supplies the address.
- The logo image is not used on the landing page; it returns on Om oss / Doner later (the PNG in `generations/refs` is the source until a vector arrives).
- Hosting on Vercel assumed, not part of v1.
- The loop's hard cut from the Haram back to the cave is accepted as part of the montage; a crossfaded seamless loop can be made later if it bothers anyone.
