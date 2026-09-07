# Motion ideas for later sessions

Kept here so they survive the session. None of these are built; each has a line on what it would take.
The rule that made concept B work still applies: one bold moment per screen, everything around it quiet.

## 1. Broen — the bridge builds itself

Two short texts stand on opposite banks with a gap between them: «Du» on the left, «Vi» on the right (or «Spørsmål» and «Svar»). As you scroll, hairline planks lay themselves across the gap one by one, from both sides, until they meet in the middle; the CTA «Still et spørsmål» stands on the finished bridge. Brobygging made literal, and the call to action sits where the two sides touch.

Build: SVG planks drawn with `stroke-dashoffset`, scrubbed by a pin; ~120 lines.

## 2. Pennen — the word written by hand

The Arabic اقرأ is written stroke by stroke by a moving pen tip (the crimson dot), following the real calligraphic strokes in order, right to left, with the ink thickening where a pen would press. When the word is complete, «Les» appears letter by letter *inside* the Arabic strokes, as if the translation lives in the ink.

Build: needs a proper calligraphic vector of the word (a calligrapher, or a careful trace); then variable-width stroke drawing on canvas along the path, and an SVG text mask for «Les». The most "how did they do that" of the set.

## 3. Samtalen — the dialogue made visible

Two columns of short lines arrive alternately, like a conversation, but set big: a question on the left in ink-soft, an answer on the right in navy. A single light moves between the columns as each side speaks. It ends on the left with «Og du?» and the CTA. Dialog as the page's own behaviour, not a word.

Build: GSAP timeline, one light element with `x` tweened between columns, lines from the content file; ~80 lines. Could replace or follow Misjon.

## 4. Lykten — the visitor carries the light

A section that starts almost dark. The visitor's cursor is a soft lantern: text within its radius is readable, the rest is night. On touch screens the lantern rides the scroll position. Dawah as bringing light, without saying so; and everyone reads the whole text anyway, because they move to find it.

Build: a CSS `mask-image: radial-gradient(...)` following the pointer, plus a fallback that fully reveals after a few seconds so nobody is stuck; ~60 lines.

## 5. Fem rom — the film's five scenes as rooms

The five scenes of the film (the cave, the prayer, Arafat, the book, the house) become five tall panels side by side. Scrolling moves you sideways through them like walking past rooms; each panel holds one sentence about what that scene means for the foundation. The last room is the one you are in: a mirror-like white panel with «Iqra Foundation, Oslo» and the CTA.

Build: horizontal pin with ScrollTrigger (`xPercent` over a pinned container), stills from the film, one sentence each; ~100 lines plus copy.

## 6. Stjernebildene — constellations that spell the three words

Past the hero, a night sky. Stars drift; as you scroll, some of them connect with hairlines into three constellations, and each constellation is the shape of one word: Dialog, Brobygging, Kunnskap. Then the lines fade and the stars are just stars again.

Build: canvas star field (from the particle concept A) with pre-authored point sets per word (sampled from rendered text, like concept A did for the Arabic); lines drawn between neighbouring points on scroll; ~150 lines.

## 7. Boken — Om oss as a book

For the Om oss page: the page is a book on a desk seen from above; each section is a page that turns in 3D as you scroll, with the text on the page and the next page's shadow underneath. The Quran still from the film is the closed cover at the start.

Build: CSS 3D transforms on page elements, scrubbed; a good fit for a page with several short sections; ~120 lines.
