# Scroll fluidity: stage 1, the jank

Date: 2026-09-09
Status: approved design, not yet implemented
Scope: the landing page's scroll behaviour. Stage 1 of two.

## The complaint

Scrolling the landing page "isn't as smooth or as sticky as would be optimal", and
"sometimes it goes to weird places". Asked to separate the symptoms, the answer was three
of four:

- it suddenly snaps somewhere else
- it feels stepped, not fluid
- I get stranded mid-animation

and explicitly **not** "it keeps moving after I stop". That last one matters as much as
the three: the trailing, liquid quality of `scrub` is wanted. Stage 1 does not touch
`scrub`.

## What is actually there

| section | behaviour |
| --- | --- |
| Hero | pinned, `+=200%`, `scrub: 0.5`, `refreshPriority: 2` |
| Visjon | pinned (desktop only), `+=110%`, `scrub: 0.6`, `refreshPriority: 1` |
| Misjon | not pinned, timeline plays once at `top 72%` |
| Støtt oss | not pinned, timeline plays once at `top 72%` |
| Book (`/om-oss`) | pinned, `+=turns*70%`, `scrub: 0.6` |

There is no smooth-scroll layer, no `normalizeScroll`, no `snap` and no `anticipatePin`
anywhere in the codebase. Native scroll drives scrubbed pins directly.

## Root causes

### 1. The hero's pin arrives after first paint — this is the big one

`Hero.tsx` creates its pinned `ScrollTrigger` inside `document.fonts.ready.then(...)`,
which resolves after the effect has returned. Before it resolves the document has no pin
spacing; after it, the document is **1800px taller** at a 900px-tall window (`+=200%`,
measured), and every section below the hero moves down by that much. A visitor who has
begun scrolling has the content shift under them. That is the "suddenly snaps somewhere
else".

This is not a narrow race. `heroPinned` in `e2e/hero.spec.ts` polls **up to 15 seconds**
for the pin spacer, with the comment "the pin lands some way after load — how far after
depends on the font cache."

**The deferral is now vestigial.** The only thing in that block that needed font metrics
was `measureOrigin(word)`, removed on 2026-09-09 when the mask origin became the constant
`ORIGIN`. What remains — the video fade-up tween, and the timeline plus its trigger — has
no font dependency: `start: 'top top'` is document-top and `end: '+=200%'` is
viewport-relative.

### 2. The browser's async scrolling fights the pinned elements

Wheel and touch scrolling is handled off the main thread, so scroll position and the
scrubbed animation desynchronise in small increments. That is the "stepped, not fluid".

### 3. Pins engage a frame late

Without `anticipatePin`, a pin taken at speed is applied after the scroll that triggered
it, which reads as a jump at the moment each pinned section grabs.

### 4. Nothing settles an act

With no `snap`, releasing mid-pin leaves a half-finished composition — letters half open,
a tree half grown — with no cue about which way to go.

## Non-goals

- **`scrub` is not touched.** The trailing feel is wanted.
- **ScrollSmoother is deferred.** It is available (gsap 3.15.0 ships a real
  `ScrollSmoother.js`, 41KB of source as installed — the shipped gzipped cost has not
  been measured, but it is material against a `categories:performance >= 0.9` assertion),
  and it virtualises scroll position
  — which would require reworking 18 `window.scrollTo` call sites across four spec files
  plus the `getBoundingClientRect().top + window.scrollY` arithmetic in
  `sections.spec.ts`. Stage 1 is expected to be enough; if the glide still falls short
  once it can be felt, ScrollSmoother becomes a well-understood follow-on.
- **Stage 2 is deferred.** Giving Misjon and Støtt oss scrubbed motion, so the page stops
  changing interaction model halfway down, is separate work. It gets easier once positions
  below the hero stop moving.
- **The book does not snap.** Page-turning wants free positioning.

## Design

### 1. Create the hero's trigger synchronously

Remove the `document.fonts.ready` wrapper in `Hero.tsx`; build the video tween, the
timeline and the trigger directly in the `useGSAP` callback. The `self.add(...)`
hand-join goes with it — it exists only because the deferred callback ran outside the
GSAP context.

Keep one `ScrollTrigger.refresh()` on `document.fonts.ready`, for the text-height
dependent sections below. `Geist` is loaded through `next/font/google`, which self-hosts
with a metric-matched fallback, so that refresh should adjust by a few pixels rather than
by a screen.

### 2. Leave `refreshPriority` standing

With the hero created synchronously, creation order becomes document order and the
priorities become belt-and-braces rather than load-bearing. The comments in `Hero.tsx`
and `Vision.tsx` are emphatic about a 2700px bug, so: update those comments to record
that the cause is gone, and remove the keys — along with Vision's
`onRefresh: (self) => { if (self.progress > 0) arrive(); }` re-entry hack — in a
**separate commit**, so a regression is attributable to one change or the other.

### 3. Normalise the scroll

In `lib/gsap.ts`, beside the existing `ScrollTrigger.config({ ignoreMobileResize: true })`:

    if (!reducedMotion()) ScrollTrigger.normalizeScroll(true);

This takes wheel and touch onto rAF on the main thread, which is the fix for root cause 2.
It adds no bytes: `normalizeScroll` is part of ScrollTrigger, and `Observer.js` is already
installed.

### 4. anticipatePin

`anticipatePin: 1` on the three pinned triggers: `Hero.tsx`, `Vision.tsx`'s
`min-width: 768px` branch, and `BookFigure.tsx`.

### 5. Snap to act ends only

On the Hero and Vision pinned triggers:

    snap: {
      snapTo: (v) => (v < 0.12 ? 0 : v > 0.88 ? 1 : v),
      duration: { min: 0.15, max: 0.5 },
      delay: 0.08,
      ease: 'power1.inOut',
      directional: true,
    }

Returning `v` unchanged in the middle band means no movement at all there, so the snap
rescues a stranded visitor without ever fighting one who stopped deliberately.

### Reduced motion

`normalizeScroll` is guarded above. Snap rides on triggers that already sit inside
reduced-motion guards: `Hero.tsx` returns early at `reducedMotion()`, and `Vision.tsx`
branches on `reduced`. No new guard is needed, but the reduced-motion e2e block must
confirm it.

## Files touched

| file | change |
| --- | --- |
| `lib/gsap.ts` | `normalizeScroll`, guarded by `reducedMotion()` |
| `components/hero/Hero.tsx` | un-defer the trigger; `anticipatePin`; `snap`; one `refresh()` on fonts.ready |
| `components/vision/Vision.tsx` | `anticipatePin`; `snap` |
| `components/about/BookFigure.tsx` | `anticipatePin` |
| `e2e/hero.spec.ts` | new font-load regression test |

## Testing

**New regression test.** Delay the font response with `page.route`, then assert:

1. the hero's pin spacer exists *before* the fonts resolve, and
2. a below-fold section's absolute top moves by no more than **10px** across font load.
   The metric-matched fallback should hold it to a few pixels; 10 leaves room for
   rounding without admitting anything like the 1800px it is guarding against.

That tests root cause 1 directly rather than a proxy for it.

**Existing suite.** All 45 must pass. Two specific interactions to verify, both already
covered:

- `Support.tsx:121` calls `scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' })`.
  Native smooth scrolling while `normalizeScroll` owns the scroller is the most likely
  conflict.
- the `/#stott-oss` anchor link in `Header.tsx`, covered by "landing: the nav link lands
  on Støtt oss and its copy is there when it arrives".

**Evidence rather than assertion.** `heroPinned`'s 15-second poll should begin resolving
immediately. If it does not, root cause 1 is not fixed.

**Lighthouse.** Run `npm run lhci`. CLS is asserted at 0.05 and performance at 0.9.
Landing the pin on frame one should improve CLS, since the document reaches its final
height before the visitor can act — but it is asserted, so it gets measured.

**Feel check.** The glide and the snap need human judgement, not a test. Snap combined
with the existing `scrub: 0.5` lag is the most likely thing to need tuning; the snap
thresholds and `duration` are the knobs.

## Risks

- `normalizeScroll` takes over scrolling. Beyond the two call sites above, it changes how
  scrolling feels even where nothing is pinned. If it feels worse rather than better, it
  is one line to remove.
- Snap and `scrub` lag may compound into mush. Tunable; worst case the snap comes out.
- Removing the deferral changes when the pin spacer appears, which is load-bearing for
  every section's measured position. The position assertions in `sections.spec.ts` are the
  safety net.

## Follow-ups, deliberately not in this change

1. Remove `refreshPriority` and Vision's `onRefresh` re-entry hack (separate commit).
2. Stage 2: scrubbed motion for Misjon and Støtt oss, so the page stops changing
   interaction model halfway down.
3. ScrollSmoother, only if stage 1's glide falls short.
4. Snap the book to page turns on `/om-oss`.
