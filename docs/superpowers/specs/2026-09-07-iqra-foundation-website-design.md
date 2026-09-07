# Iqra Foundation website — design spec

Date: 2026-09-07 · Status: draft for review · Direction: **B · Natt og dag**
Mockups: https://claude.ai/code/artifact/3132d95a-e0df-487d-b603-4205a4c16cb7

## 1. Purpose and scope

A new public website for Iqra Foundation, a Norwegian dawah organisation. The site
exists to make it easy for Norwegians who are curious about Islam to start a
conversation with the foundation.

**In scope for this version (v1):**

- The landing page `/` with: header, hero (the 6.5 s film that lands on the logo and
  becomes the page), the "Stage" (Visjon and Misjon over stills from the film), and a
  small footer.
- The full hero choreography and scroll choreography described below, on desktop and
  phone.
- Norwegian (bokmål) copy, placeholder grade, editable in one file.

**Out of scope (later versions):** Om oss page, Doner page and payments, a contact
form, CMS, English toggle, analytics, cookie banner (no cookies are set in v1;
`sessionStorage` only).

## 2. Audience and voice

Primary reader: a Norwegian who is not Muslim and is curious, sceptical or just
wondering. Secondary: Muslims who want to help.

Copy rules (the user's explicit instruction): plain language anyone can follow, the way
a person talks. Short sentences. Commas and full stops rather than dashes. No slogan
triplets, no "journey", no marketing gloss, no eyebrow-label clichés. Facts do not have
to be accurate yet; the only fact used is that *Iqra* means "read" and was the first
word revealed.

## 3. Design tokens

Colours (from the logo and the film's end card):

| token | value | use |
|---|---|---|
| `--navy` | `#2a394b` | text, logo, CTA fill |
| `--crimson` | `#ab5263` | the full stop in the headline, link hover, nothing else |
| `--white` | `#ffffff` | page ground; must be exactly the white the film ends on |
| `--night` | `#0e1620` | Stage background behind the stills |
| `--film-black` | `#0b1118` | film overlay ground before the poster paints |
| `--ink-soft` | `#4b586a` | lede paragraph |
| `--muted` | `#8a94a3` | mono labels, footer |
| `--hairline` | `#e3e7ec` | rules |

Type (Geist and Geist Mono via `next/font/google`, self-hosted at build):

| role | desktop | phone | weight | line-height | tracking |
|---|---|---|---|---|---|
| h1 | 120 px | 60 px | 600 | 0.94 | −0.045em |
| stage text | 40 px | 26 px | 500 | 1.2 | −0.025em |
| lede | 21 px | 17 px | 400 | 1.5 | 0 |
| CTA / nav | 16 / 15 px | 16 px | 500 | 1 | −0.01em |
| mono label | 12 px | 11 px | 500 | 1 | 0.10em, uppercase |

Layout: content margins 80 px on desktop, 24 px on phone. Header 100 px on desktop,
72 px on phone. The CTA is a pill (`border-radius: 999px`, height 52 px). No other
radii, no cards, no shadows.

Motion vocabulary: entrances `expo.out` (`cubic-bezier(0.16, 1, 0.3, 1)`), crossfades
`power2.inOut`, durations 300 / 600 / 700 ms. One overshoot only: the crimson full stop
(`back.out(1.7)`, 300 ms). No parallax on text, no custom cursor, no scroll-jacking
apart from the scroll lock during the film.

Tokens live in `app/globals.css` under Tailwind 4's `@theme`; hero and stage motion
CSS lives in CSS modules next to the components.

## 4. Content

All strings live in `content/site.no.ts` and nowhere else:

```ts
export const site = {
  lang: 'nb',
  name: 'Iqra Foundation',
  meta: {
    title: 'Iqra Foundation',
    description: 'Iqra betyr les. Vi snakker gjerne med deg om islam.',
  },
  hero: {
    h1Lines: ['Iqra betyr', 'les'],   // the full stop is rendered separately, in crimson
    lede: 'Det er det første ordet i Koranen. For oss betyr det å lese, å lære, og å snakke med folk som lurer på noe.',
    cta: 'Still et spørsmål',
    skip: 'Hopp over',
  },
  stage: {
    visjon: {
      label: 'Visjon',
      text: 'Vi vil ha et Norge der folk kjenner islam fra ekte møter, ikke fra overskrifter. Der det er lett å spørre, og lett å få et ærlig svar.',
    },
    misjon: {
      label: 'Misjon',
      text: 'Vi forteller om islam på en vennlig og ærlig måte. Vi inviterer til samtaler, svarer på spørsmål og møter folk der de er. Slik bygger vi broer, og lærer av hverandre.',
    },
  },
  contact: { email: '[EPOST]' },     // placeholder until the user supplies it
  footer: { replay: 'Se filmen igjen' },
} as const;
```

The CTA links to `mailto:${site.contact.email}`. A unit test fails the production build
if `contact.email` still contains `[`.

## 5. Architecture

**Stack:** Next 16 (App Router, Turbopack), React 19, TypeScript, Tailwind 4, GSAP 3
(core + ScrollTrigger), Vitest, Playwright. Same versions as `iqra-portal`.

**Repo:** `C:\Users\daodi\code\iqra-foundation`, deployed to Vercel later.

```
app/
  layout.tsx            html lang="nb", fonts, metadata, the inline head script (§6.2)
  page.tsx              <Header/> <Hero/> <Stage/> <Footer/>
  globals.css           @theme tokens, base styles, html[data-hero] rules
components/
  Header.tsx            logo slot (the SVG logo lives here at rest)
  hero/
    Hero.tsx            client component: film overlay + white block; owns the state machine
    FilmOverlay.tsx     <video>, progress hairline, skip button
    useHeroMachine.ts   state machine hook (§6.3)
    coverRect.ts        pure: cover-fit maths (§6.4)
    hero.module.css     masks, overlay, transitions
  stage/
    Stage.tsx           client component: pinned scrollytelling or stacked, by media query
    stage.module.css
  Footer.tsx            name, year, email, replay link
  Logo.tsx              the traced SVG as a React component
content/
  site.no.ts            all copy (§4)
lib/
  gsap.ts               registers ScrollTrigger once, exports shared eases/durations
  media.ts              picks the video source (§6.5)
public/media/
  iqra-hero-1080.mp4 / .webm     copied from generations/hero-web-1080-upscaled
  iqra-hero-720.mp4 / .webm      generated
  iqra-hero-poster.jpg           copied (frame 0)
  still-arafat.avif / .webp      extracted from the film at 1920 wide
  still-koran.avif / .webp
public/logo.svg                  traced from generations/refs/iqra_logo_vector.png
scripts/
  media.mjs             ffmpeg: 720p variants, stills, poster; measures the logo rect
  trace-logo.mjs        sharp + potrace: two-colour SVG
docs/superpowers/specs/          this file
```

**Data flow:** `Hero` holds the machine state and passes it down; `Header` receives the
logo's target slot ref; `Stage` is independent and only needs to know whether motion is
allowed and which breakpoint it is on. Nothing is global except the GSAP registration.

## 6. Hero choreography

### 6.1 Timeline (desktop; phone is identical in sequence)

| t | what happens |
|---|---|
| 0.0 s | Film overlay covers the viewport (`position: fixed; inset: 0`), poster visible from first paint. Scroll locked. After hydration the source is chosen and `play()` is called. |
| 0.0–6.5 s | Video plays, `object-fit: cover`. A 2 px hairline at the bottom fills with `currentTime / duration`. «Hopp over» fades in at 1.0 s (300 ms). |
| any time | Wheel, `touchmove`, `keydown` or the skip button → **skip**: `video.currentTime = duration`, then the landing runs with `timeScale(2)`. |
| 6.5 s | `ended` → **handoff**: the SVG logo (already in the header slot in the DOM) is transformed so it sits exactly over the logo in the last frame (§6.4), 100 ms crossfade in; then the overlay's video is hidden and the overlay background becomes `--white`. |
| 6.5–7.1 s | The logo tweens from the frame position to its header slot: translate + scale, 600 ms, expo.out. The overlay fades out over the same 600 ms so the white block underneath (identical white) takes over without a seam. |
| 6.9–7.6 s | Headline lines rise from masked line boxes (`overflow: hidden`, `translateY(110%) → 0`), 700 ms expo.out, 80 ms stagger. The crimson full stop scales 0 → 1 with `back.out(1.7)`, 300 ms, starting when the second line lands. Lede and CTA rise 24 px and fade in, 500 ms, starting 150 ms after the last line. |
| 7.3 s | Scroll unlocks. State becomes **rest**. `sessionStorage['iqra:hero-seen'] = '1'`. |
| at rest | Header 100 px + white block so that the hero (header + white block) is `max(520px, 58svh)` tall; the top of the Arafat still is visible below the fold. |

The film is never looped. «Se filmen igjen» in the footer resets the machine to `film`
(scrolls to top first, 400 ms).

### 6.2 Flash-free start

The page is server-rendered in the **rest** state. An inline script in `<head>`
(before any stylesheet paints) sets `document.documentElement.dataset.hero = 'film'`
when all of these hold: JavaScript runs, `sessionStorage['iqra:hero-seen']` is unset,
and `matchMedia('(prefers-reduced-motion: reduce)').matches` is false. CSS keyed on
`html[data-hero="film"]` shows the overlay, hides the headline (already in its
pre-rise position) and sets `overflow: hidden` on `html`. With JavaScript off nothing
runs and the rest page is what you get. The video element is in the server markup with
`preload="none"`, `muted`, `playsinline`, `autoplay` **not** set, and no `src`; React
adds the source and calls `play()` after hydration (§6.5).

### 6.3 State machine (`useHeroMachine`)

States: `film`, `landing`, `rest`.
Initial: `film` if `html[data-hero="film"]` was set, else `rest`.

| state | event | next | side effects |
|---|---|---|---|
| film | `ENDED` | landing | run landing timeline at `timeScale(1)` |
| film | `SKIP` | landing | seek to end, run landing at `timeScale(2)` |
| film | `ERROR` / `AUTOPLAY_BLOCKED` / `TIMEOUT(9 s)` | rest | remove overlay immediately, no animation, unlock scroll |
| landing | `LANDED` | rest | unlock scroll, set session flag |
| rest | `REPLAY` | film | scroll to top, reset overlay, reload source, play |

The machine is a pure reducer (testable without the DOM); the hook wires DOM events to
it and runs the GSAP timelines as effects.

### 6.4 Logo handoff maths (`coverRect.ts`)

The last frame of the film is 1920 × 1080 with the logo's bounding box at
`LOGO_RECT = { x, y, w, h }` in source pixels. `scripts/media.mjs` measures it once
(bounding box of non-white pixels in the last frame) and writes it as a constant into
`components/hero/logoRect.ts`; it is not guessed.

Given the overlay's size `W × H`:

```
s   = max(W / 1920, H / 1080)             // cover scale
offX = (W − 1920·s) / 2,  offY = (H − 1080·s) / 2
screen = { x: offX + LOGO_RECT.x·s, y: offY + LOGO_RECT.y·s, w: LOGO_RECT.w·s, h: LOGO_RECT.h·s }
```

The header logo's slot rect is measured with `getBoundingClientRect()`. The tween goes
from `screen` to the slot (translate by the difference of top-left corners, scale by
`screen.w / slot.w`, `transform-origin: 0 0`). The traced SVG has the same aspect ratio
as the PNG that was composited into the film, so the fit is exact to within a pixel.

### 6.5 Media selection (`lib/media.ts`)

After hydration: `narrow = matchMedia('(max-width: 767px)').matches`;
`webm = video.canPlayType('video/webm; codecs="vp9"') !== ''`. Source =
`/media/iqra-hero-{narrow ? 720 : 1080}.{webm ? 'webm' : 'mp4'}`. Set `video.src`,
`video.load()`, then `await video.play()`; a rejected promise is `AUTOPLAY_BLOCKED`.
The poster (`/media/iqra-hero-poster.jpg`, frame 0) is preloaded from `layout.tsx`
with `<link rel="preload" as="image">` so it is the LCP element.

## 7. The Stage (Visjon + Misjon)

**Desktop and tablet (≥ 768 px, motion allowed):** one `100svh` section pinned by
ScrollTrigger over `+=200%` of scroll with `scrub: 0.6`. Contents: two stills
(absolutely positioned, `object-fit: cover`, opacity 0.62 over `--night`, plus a
vertical gradient `rgba(14,22,32,.15) → rgba(14,22,32,.85)`), two text blocks
(mono label + stage text, bottom-left, `max-width: 900px`), and a rail top-left with
two steps.

Progress `p` from 0 to 1 drives one GSAP timeline:

- `0 → 1`: both stills scale `1.00 → 1.06` (very slow drift).
- `0.00 → 0.35`: Visjon text at rest.
- `0.35 → 0.50`: Visjon text `y: −40px, opacity: 0`; Arafat still opacity `0.62 → 0`,
  Quran still `0 → 0.62` (power2.inOut).
- `0.50 → 0.65`: Misjon text `y: 40px → 0, opacity: 0 → 1` (expo.out).
- `0.65 → 1.00`: hold, then the pin releases into the footer.

Rail: the step for the active block is white, the other 40 % white; it switches at
`p = 0.5`. Anchor `#visjon` is the stage's top.

**Phone (< 768 px) or reduced motion:** no pin. Two stacked blocks, each a 4:5
image (same still treatment) with the label and text over the lower part, exactly as
the phone frame on the canvas. `gsap.matchMedia()` chooses at runtime and on resize.

## 8. Responsive rules

- Breakpoints: phone `< 768`, tablet `768–1023`, desktop `≥ 1024`. Type follows the
  table in §3, with tablet using desktop sizes scaled by 0.8.
- The hero white block: desktop grid `7fr / 5fr` (headline left, lede + CTA right,
  bottom-aligned); phone stacks headline, lede, full-width CTA.
- Header: logo 52 px tall on desktop, 40 px on phone. v1 has **no nav links**: the
  header is the logo only; Om oss and Doner links are added when those pages exist.
  The CTA lives in the hero body.
- Footer: name and year left, `mailto:` and «Se filmen igjen» right; stacks on phone.

## 9. Performance budget

- LCP ≤ 2.5 s on simulated 4G (Lighthouse mobile), LCP element = poster.
- CLS < 0.05: the overlay is fixed, the headline's masked boxes reserve their height at
  rest size before the rise.
- JavaScript ≤ 160 KB gzipped on `/`; GSAP core + ScrollTrigger only.
- Video: 1080p mp4 ≤ 4 MB, webm ≤ 2.2 MB; 720p mp4 ≤ 1.6 MB, webm ≤ 1.1 MB. Not
  preloaded before hydration; never blocks paint.
- Stills ≤ 150 KB AVIF, ≤ 220 KB WebP fallback; served with `<picture>`, `loading="lazy"`
  for the Quran still, eager for Arafat (it peeks above the fold at rest).
- Fonts: Geist and Geist Mono self-hosted by `next/font`, `display: swap` never
  triggers because they are preloaded.
- Lighthouse CI budget in `lighthouserc.json`: performance ≥ 90 mobile, accessibility
  ≥ 95.

## 10. Accessibility

- `<html lang="nb">`. One `<h1>` (the headline). Sections have `aria-labelledby` on
  their labels.
- The video is decorative: `aria-hidden="true"`, no audio track, no controls. «Hopp
  over» is a `<button>`, visible focus ring, reachable by Tab, and any key press skips.
- During the film, focus is on the skip button so keyboard users are never trapped in
  a locked page.
- `prefers-reduced-motion: reduce` → rest state, no autoplay, stacked Stage, no scale
  drift. «Se filmen igjen» still works (explicit intent) and plays the video with no
  page motion afterwards.
- Text over stills: white on the gradient-darkened image; contrast measured against
  the overlay colour at the text position ≥ 4.5:1.
- The logo `<a>` has `aria-label="Iqra Foundation, til toppen"`.

## 11. Error handling

- `video.play()` rejects → `AUTOPLAY_BLOCKED` → rest immediately.
- `error` event on the video or a chosen source that fails to load → rest.
- `ended` not received within 9 s of `play()` resolving → `TIMEOUT` → rest.
- GSAP fails to load (should not happen; it is bundled) → the CSS resting layout is
  complete without it; the overlay is removed by the machine's `ERROR` path.
- Resize during the film: the cover rect is recomputed on `ended`, not cached.
- Resize during the Stage pin: ScrollTrigger refreshes; switching across 768 px
  rebuilds via `gsap.matchMedia()`.

## 12. Testing

**Vitest (unit):**

- `coverRect`: wider-than-video container, taller-than-video container, exact 16:9;
  results checked to 0.5 px.
- `heroReducer`: every transition in §6.3, plus "unknown event leaves state unchanged".
- `content`: no empty strings in `site`; production build fails if `contact.email`
  contains `[`.
- `media.pickSource`: 4 combinations of narrow × webm.

**Playwright (e2e, Chromium desktop 1440×900 and WebKit iPhone 13 emulation):**

1. Fresh visit: overlay visible with poster; video playing; within 9 s
   `html[data-hero]` is `rest`, the h1 is visible, the header logo is in its slot.
2. Skip: wheel event at 1 s → rest within 2 s.
3. Reduced motion (emulated): no video `play()`, rest at load, Stage stacked.
4. Repeat visit: reload after 1 → rest at load, no overlay.
5. Stage (desktop): scroll two screens → Misjon text visible, rail step 2 active.
6. Phone: Stage stacked, both stills present, no pinned element.

**Budgets:** Lighthouse CI on the production build (§9).

## 13. Setup steps (for the implementation plan)

1. `npx create-next-app@latest . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm` in the repo folder (it accepts the existing `.git` and `docs/`).
2. `npm i gsap` · `npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @playwright/test sharp potrace @lhci/cli`.
3. `node scripts/media.mjs` (needs ffmpeg on PATH; present on this machine) and
   `node scripts/trace-logo.mjs`; commit the outputs under `public/`.
4. Build components in the order: tokens → content → Logo → Header → Hero (machine,
   overlay, handoff) → Stage → Footer → tests → Lighthouse.

## 14. Assumptions and open items

- Header has no nav links in v1 (decided in review). Om oss and Doner come later.
- `contact.email` is a placeholder until the user supplies the address.
- If the SVG trace of the logo is rough, fall back to a 2× PNG and ask the user for the
  original vector; the handoff maths is the same either way.
- Hosting on Vercel is assumed but not part of v1's work.
- The stills are frames from the AI-generated film; if the foundation later has real
  photographs, they drop into the same slots.
