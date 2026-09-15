# Iqra Foundation — build the site around who the foundation is

## The short version

You are rebuilding the Iqra Foundation website around the foundation's own brief (*The brief*, below) and its brand guide (*The brand*): nine menu items, eight subpages, the brief's text word for word, the guide's logo, palette and type on every page. The process is **one checkpoint**: two or three directions running on localhost ports, the user picks one, you build the whole site and open one PR that you do not merge. Three rules outrank everything else in this file:

1. **The brief's prose is the site's text, verbatim.** You write no prose of your own — only the functional microcopy listed under *Words*.
2. **Nothing is invented.** No example event, name, document or date; honest empty states and bracketed values (`[EPOST]`) instead.
3. **Your own branch in your own worktree.** Never the main checkout, never `git add -A`.

The existing materials — ink, water, a pen-drawn line, a book, a tree, the film — are available, not required. *Questions already answered* settles what you would otherwise ask, *Definition of done* says what done means, and the memory directory holds the history. Effort is at max; spend it on the design and the verification, not on ceremony.

## Why you are here

You are working in `C:\Users\daodi\code\iqra-foundation`, the Next.js site of Iqra Foundation, a new Norwegian foundation. It is live at https://iqra-foundation-red.vercel.app (pushing `main` deploys it). Everything on that site is a draft: it was built before the foundation had decided who it is, so it is built around the meaning of the name «Iqra» and around a set of animated materials, with one placeholder paragraph in every text slot and invented dates in the events boxes.

That decision has now been made. Below is the foundation's own brief: its positioning, its text, its structure and its menu. The foundation's brand guide (palette, logo variants, fonts) arrived on this machine the same day — the earlier sessions never had it and worked from colours sampled off a PNG. Your job is to turn the brief and the guide into a top-class website — the site a board member, a municipality, a partner organisation, a young person looking for a place to belong, and a donor will judge the foundation by. In ten seconds anyone should understand what Iqra Foundation is; in one click they should reach the page they came for.

## Who you are working with

The person you are working with owns the site and designs it. They read a page as a designer, they look on a phone as well as a laptop, they decide on the running page rather than on screenshots, and they answer in one word («go» = take your recommendation and keep moving; «in localhost» = put it on a port they can open; «merge» = merge it and verify it live). They chose this process: **one checkpoint** — you show directions, they pick, you build everything. Lead every question with a recommendation, so «go» has something to point at, and ask once, batched, only what the repo, the memory and this file cannot answer.

## The brief (verbatim — this is the site's text)

Everything between the two rules is the foundation's own text, exactly as it was sent. Copy from this file into the content module; do not retype it, and do not touch a word of it.

---

Det viktigste nå er å tydeliggjøre *hvem Iqra Foundation er, hva slags stiftelse vi skal være og hvilken rolle vi ønsker å ha i samfunnet*.

Jeg ønsker at vi bygger nettsiden rundt følgende retning:

### 1. Posisjonering

Iqra Foundation skal fremstå tydelig som en **selvstendig og allmennyttig stiftelse, forankret i islamske verdier og prinsipper**.

Vi skal være en åpen og inkluderende stiftelse med et tydelig samfunnsoppdrag. Fire områder skal være gjennomgående i både innholdet og den visuelle kommunikasjonen:

**Kunnskap | Dialog | Møteplasser | Samfunnsdeltakelse**

Nettsiden bør formidle at vi bygger en langsiktig institusjon og møteplass, ikke bare arrangerer enkeltstående aktiviteter.

### 2. Hovedtekst på forsiden

**En stiftelse for kunnskap, dialog, møteplasser og samfunnsdeltakelse**

Iqra Foundation er en selvstendig og allmennyttig stiftelse forankret i islamske verdier og prinsipper. Vi utvikler kunnskap, bygger møteplasser og fremmer dialog og aktiv samfunnsdeltakelse.

**Knapper:**
Utforsk vårt arbeid | Støtt oss

### 3. Visjon

**Et samfunn der kunnskap og dialog skaper forståelse, deltakelse og sterkere fellesskap.**

Vi ønsker å bidra til et samfunn der mennesker møtes, perspektiver utveksles og flere får mulighet til å lære, engasjere seg og delta.

### 4. Misjon

**Iqra Foundation skal utvikle kunnskap, bygge møteplasser og legge til rette for dialog og aktiv samfunnsdeltakelse.**

Med utgangspunkt i islamske verdier skaper vi arenaer for læring, refleksjon og meningsutveksling. Gjennom langsiktig arbeid og samarbeid ønsker vi å styrke forståelse, engasjement og deltakelse, særlig blant ungdom og voksne.

### 5. Om oss

**Om Iqra Foundation**

Iqra Foundation er en selvstendig, allmennyttig stiftelse forankret i islamske verdier og prinsipper.

Vi arbeider i skjæringspunktet mellom **kunnskap, dialog, møteplasser og samfunnsdeltakelse**.

Stiftelsen skal være en åpen og inkluderende arena for læring, refleksjon og meningsutveksling. Vi ønsker å bringe mennesker sammen, gjøre kunnskap tilgjengelig og skape rom for konstruktive samtaler om tro, samfunn og spørsmål som berører vår samtid.

Gjennom kunnskapsformidling, møteplasser, arrangementer og samarbeid med relevante samfunnsaktører skal Iqra Foundation bidra til økt forståelse, sterkere fellesskap og aktiv samfunnsdeltakelse.

### 6. Fire hovedområder

Jeg ønsker at disse presenteres tydelig, gjerne som fire egne bokser/seksjoner:

**Kunnskap**
Vi skaper arenaer for læring, refleksjon og kunnskapsdeling. Gjennom faglige aktiviteter og ressurser ønsker vi å gjøre kunnskap tilgjengelig og bidra til en mer kunnskapsbasert samfunnssamtale.

**Dialog**
Vi legger til rette for åpne og konstruktive samtaler om tro, samfunn og aktuelle spørsmål. Vi ønsker å bringe ulike perspektiver sammen og bidra til større forståelse og tillit.

**Møteplasser**
Vi utvikler møteplasser der mennesker kan møtes, lære, utveksle perspektiver og bygge relasjoner. Ambisjonen er å utvikle både aktiviteter og varige arenaer for kunnskap, dialog og fellesskap.

**Samfunnsdeltakelse**
Vi ønsker å styrke særlig ungdom og voksnes muligheter til å engasjere seg og delta aktivt i samfunnet. Vi skal fremme ansvar, frivillighet, lederskap, fellesskap og demokratisk deltakelse.

### 7. Menneskene bak Iqra

Jeg ønsker en egen side/seksjon som heter **«Menneskene bak Iqra»**.

Foreløpig kan følgende tekst brukes:

**Iqra Foundation forvaltes av et styre med ansvar for stiftelsens strategiske retning, økonomiske forvaltning og langsiktige utvikling. Bak stiftelsens arbeid står mennesker med ulik kompetanse og et felles engasjement for kunnskap, dialog og samfunnsdeltakelse.**

Navn, bilder, roller og korte presentasjoner kommer senere.

### 8. Meny og undersider

Jeg ønsker at de viktigste sidene blir tilgjengelige direkte fra toppmenyen. Det er litt for mye scrolling i dagens løsning.

Forslag til hovedmeny:

**Hjem | Om oss | Vårt arbeid | Arrangementer | Ressurser | Menneskene bak | Styringsdokumenter | Kontakt | Støtt oss**

«Støtt oss» bør være en tydelig knapp.

Jeg ønsker særlig egne sider for:

* Menneskene bak Iqra
* Arrangementer
* Ressurser
* Styringsdokumenter
* Kontakt
* Støtt oss

Under **Styringsdokumenter** skal vi etter hvert kunne publisere vedtekter, årsrapporter, årsregnskap, strategier og andre sentrale dokumenter.

Under **Ressurser** skal vi kunne samle publikasjoner, artikler, rapporter, presentasjoner, videoer og annet kunnskapsinnhold.

### 9. Iqra-identiteten

Jeg savner litt mer av selve Iqra-brandingen i dagens løsning. Logo, farger, typografi og grafiske elementer bør brukes mer konsekvent gjennom hele nettsiden.

Betydningen av «Iqra» kan fortsatt være en del av historien vår, men nettsiden bør ikke bygges primært rundt forklaringen av navnet. Hovedvekten bør ligge på **hva Iqra Foundation er og hvilket samfunnsoppdrag stiftelsen har**.

Den røde tråden gjennom hele nettsiden bør være:

**IQRA FOUNDATION**
**Kunnskap. Dialog. Møteplasser. Samfunnsdeltakelse.**

Det viktigste nå er å få på plass denne identiteten, hovedbudskapet, navigasjonen og strukturen. Mennesker, arrangementer, dokumenter og ressurser kan vi fylle inn fortløpende.

---

## What they said about the existing craft

Asked whether the ink, the water, the pen-drawn frames, the book, the tree and the hero film must stay, they answered: «Keep the materials. Perhaps change the colors and things to recenter around the brand. And don't have to keep everything. If it makes sense to keep it, do it, but don't be limited by it. That was just a draft, so we can replace it or we can keep it. Depends on what is best. But the logo and the Iqra Foundation, what they want is what's most important.»

So: the materials are available, not required. The logo and what the foundation wants come first. When you keep something, keep it because it serves the identity; when you replace something, say what it was and why.

## What top-class means here

- **Identity first.** The logo, the brand guide's palette, its type pair and a small set of graphic gestures, used the same way on every page — the site should look as if it came from the same hand as the guide. The red thread is the brief's: IQRA FOUNDATION — Kunnskap. Dialog. Møteplasser. Samfunnsdeltakelse. Make the design system explicit in code (tokens for colour, type, space, radius, motion) so consistency is enforced by the build, not remembered by the next session.
- **An institution, not an events calendar.** Calm, long-term, open, inclusive. Rooted in Islamic values and legible to everyone: a design that feels rooted and serious without the clichés — no generic arabesque wallpaper, no stock-mosque gloss, no «journey» tone.
- **Less scrolling.** Each page has one purpose. Home is short. The menu does the work the long page used to do.
- **The four areas are structural.** They appear in the content, in the navigation and in the visual language, and a visitor can tell which one they are looking at.
- **Material, not metaphor.** Across every round on this site, the user has kept things with real physical behaviour (paper that bends, ink that thins, water) and rejected every illustrative metaphor (a bridge for bridge-building, rooms for scenes, letter morphs, particle crowds, lanterns, lattices). Motion serves the identity; nothing moves to show off, and the page must be complete with motion off.
- **No photography exists yet.** The film's frames and four stock stand-ins are the only imagery, and the stand-ins are placeholders. Design so every page is complete with no photograph on it — the identity is carried by the logo, the palette, the type and the four-areas motif — and so a photo can be added per event or per person later without re-cutting the layout.
- **The user sees resolution.** Nothing is drawn below the screen's resolution; softness, blur bands and blockiness read as amateurish to them even when a downscaled comparison hides it. Anything that trades pixels for speed is a design decision to show on localhost at their real pixel ratio, never an optimisation to ship on numbers.
- **The phone is where it is judged.** A layout that collapses at 390 px is judged as the design, and the round is spent on the bug.
- **Accessible:** semantic HTML, a skip link, keyboard reaches everything, contrast passes on every ground, `prefers-reduced-motion` honoured, `lang="nb"`.
- **Fast:** the repo's budgets are Lighthouse performance ≥ 0.90, accessibility ≥ 0.95, CLS ≤ 0.05 (`lighthouserc.json`), measured locally (production is behind a Vercel bot challenge that skews headless runs).

## Words

- The brief's text is the site's prose, verbatim. Do not rewrite, shorten, extend or «improve» it. Do not write prose of your own.
- You write only functional microcopy: navigation labels, buttons, form labels, empty-state lines, alt text, `<title>`s and meta descriptions. Short, plain bokmål, no marketing gloss. Meta descriptions are sentences from the brief. One `<title>` pattern on every page; the home page's title is the name alone.
- What the brief says comes later (names, photos, roles, events, documents, resources, the contact address, the Vipps number, the org.nr) is not invented, not even as an example. Empty states are honest («Ingen arrangementer er publisert ennå.») and missing values are bracketed (`[EPOST]`, `[NUMMER]`, `[ORG.NR]`) so `scripts/check-content.mjs` reports them. Never a plausible invented event, name, document or date; the four invented dates on the current landing page go.
- **Roles are not invented either.** Today's six bracketed team rows carry guessed roles (Leder, Nestleder, Frivillig); the brief names only a board. If a bracketed row is needed to judge a layout, its role is `[Rolle]` too, and the collection ships empty.
- **Nyheter has no page.** The brief's menu has none, so the news boxes go with the timeline; articles belong under Ressurser.
- One exception to the no-prose rule: the paragraph in `content/site.no.ts` («Iqra er det første ordet i Koranen…») is the user's own words. The brief says the name's meaning can still be part of the story, and that paragraph is available for exactly that, in Om oss. Not as filler anywhere else.
- **The verbatim rule is enforced by the build.** The content module holds the one copy of the brief's text, and a unit test reads the brief from this file (between the two rules, markdown emphasis stripped), picks out the passages the site uses — the headline and paragraph of section 2, the sentences of 3, 4 and 5, the four areas of 6, the board paragraph of 7 — and asserts that each appears unchanged somewhere in the content. A later session that «improves» a sentence then fails `npm test` instead of shipping. Whether the brief's bold phrases are shown as emphasis on the page is a design call; the words are not.
- Conventions: bokmål; «…» quotes; dates written out («24. september 2026», ISO in the content); `islam` in lower case (the user sometimes writes it capitalised; keep the site's convention and say so once if it comes up).

## The brand — the official guide is in `C:\Users\daodi\Downloads`

Nine files arrived there on 2026-09-15 at 19:37: `Iqra branding .pdf` (the space before the extension is in the name) and `iqra-foundation-logos-july-2025-{1-MAIN,2,3,4,5,6,7,8}.png`. Bring them into the repo on your branch — the sources under `brand/`, what the site serves under `public/` — so no later session depends on a Downloads folder. Downloads is a read-only source: copy from it, never move or edit there.

- **The guide** is one tall page (2160 × 9240 pt): main logo, an optional alternate, the logo in every colour combination, the monochrome logos, the palette, the fonts. **Its logo art is vector.** The PDF contains no raster image at all — only paths and embedded font subsets (checked with pypdf on this machine, which has Python 3.13 and pypdf 6 on PATH and none of poppler, mutool or Inkscape). Extract the logos to SVG (poppler's `pdftocairo -svg`, `mutool draw` or Inkscape — install what you need and say which), crop and clean the paths, and check the result against the PNGs at 100 %. Until you have that, the PNGs are 4609 px and carry any size the site needs. The guide's own text is set in Supreme (Regular, Bold, Extrabold) and General Sans (Semibold, Bold), with Mulish Black somewhere on the page; those subsets are not usable as web fonts, but they tell you which weights the brand's designer reached for.
- **Palette**, as the guide states it — PRIMARY: navy `#2c394b`, turquoise `#67c1bf`. SECONDARY: light `#f0f0f1`, dark grey `#393e46`, crimson `#ab5261`. (Visual reference the guide links: https://huemint.com/brand-3/#palette=67c1bf-f0f0f1-2c394b-ab5261.) These replace the values the repo sampled off a PNG — `#2a394b`, `#ab5263`, the by-eye turquoise `#62bfbd` and the derived `#3f5b7a` — which live in `app/globals.css` (`--color-navy`, `--color-crimson`), `app/icon.svg` (a crimson circle: replace it with the mark), `components/about/pages.ts`, `lib/ramp.ts` and its test, and go. Tints and neutrals you derive are yours to choose, but every colour on the site should be traceable to these five.
- **The logo.** «iQRa» in navy, with the dot on the i and the tail sweeping out of the Q as the accent, and «Foundation» tracked out beneath in a rounded lowercase. The accent and the word take the brand colours in fixed combinations, one per ground, and the eight PNGs (each 4609×4598) are those combinations: **1-MAIN** navy + crimson accent, navy «Foundation», on the turquoise plate — the main logo; **2** the same on white; **3** the mark alone, no «Foundation», navy + crimson on white; **4** navy + turquoise accent, crimson «Foundation», on white; **5** navy + crimson accent, navy «Foundation», on light `#f0f0f1`; **6** navy + crimson accent, turquoise «Foundation», on light; **7** navy + turquoise accent, turquoise «Foundation», on white; **8** navy + turquoise accent, crimson «Foundation», on light. The guide also shows the logo reversed on navy, on dark grey and on crimson, the optional alternate with the tail in navy, and monochrome black and white — take those from the PDF. Use the variant the guide gives for each ground; do not recolour the mark yourself. The old `public/media/iqra-logo.png` is superseded and goes.
- **Type**, as the guide states it — primary **General Sans**, secondary **Supreme**, both from Fontshare (https://www.fontshare.com/fonts/general-sans, https://www.fontshare.com/fonts/supreme); optional secondary faces Ranade, Poppins, Inter. Fontshare serves General Sans in weights 200–700 and Supreme in 100–800 (no 600), each with italics — verified against its CSS API. Both are under the ITF Free Font License: free for commercial use, self-hosting permitted, the download carries OTF, WOFF and WOFF2 plus the licence file — keep the licence beside the font files in the repo, and do not redistribute them beyond that. Self-host with `next/font/local` (download from Fontshare, or ask the user to drop the zips in Downloads as they did the logos), ship WOFF2 only in the weights you use, and decide the roles — which face carries headings, which carries text, at what weights — inside the directions. Geist was the site's face until now, chosen before the guide existed; it goes.
- **Film and stills:** `public/media/iqra-loop-{720,1080}.{mp4,webm}` (a 6.5 s montage: the cave of Hira → sujood → Arafat → the Quran → Masjid al-Haram; the logo-on-white end card from 4.3 s was cut out of the loop in an earlier decision that predates this brief), `iqra-poster.jpg`, `iqra-gull-720.{mp4,webm}` (a gold pen writing اقرأ), `still-koran.{avif,webp}`. `scripts/media.mjs` cuts stills from the master in `C:\Users\daodi\generations\`. These frames are the only real imagery the foundation has; the four `midlertidig-*.jpg` are stock stand-ins.

## What is in the repo

Next 16.3.4 · React 19.2.8 · Tailwind 4 · GSAP 3.15 (ScrollTrigger) · Vitest 4 (29 files, 211 tests, about 14 s) · Playwright 1.55 (76 e2e in 4 files across two projects: desktop 1440×900 and Pixel 7; it builds and starts on port 3000 and reuses whatever is already listening there) · Lighthouse CI. Node 24 is installed; `engines` wants ≥ 22.18. Read `AGENTS.md` first: this Next differs from your training data, and its docs are in `node_modules/next/dist/docs/`. Comments in this repo are prose that explains why; match that density and voice.

- One landing page, `app/page.tsx`: Hero (the film through giant IQRA letters, then «IQRA FOUNDATION» with the paragraph), Vision (a tree and an arch on sky-blue ink), Mission (a pen-framed «wall» on cream ink with the gold-pen film), Happenings (four boxes with invented dates and stock photos), People (a WebGL book on green water — the team's pages), Support (two squares: the Vipps number and a visual-only card form); `/om-oss` (the book again, with a cover); a header with a text wordmark and two links; a footer with the org.nr and the e-mail, both bracketed.
- All text lives in `content/site.no.ts`. A production build refuses any bracketed placeholder (`scripts/check-content.mjs`); `vercel.json` sets `ALLOW_PLACEHOLDERS=1` and `app/layout.tsx` sets `noindex` — both stay until the real numbers exist.
- The materials live in `lib/` (`ink.ts`, `water.ts`, `pen.ts`, `ramp.ts`, `film.ts`) and the section components. They are well-built and tested, and they are a draft's answer to a brief that no longer exists. Keep what serves the brand, replace what does not, and say which.
- `docs/superpowers/` holds the specs and plans of the draft, and `docs/ideas/motion-ideas.md` its unbuilt ideas: history, not instructions. Where they and the memory disagree, the memory wins.
- **Memory:** `C:\Users\daodi\.claude\projects\C--Users-daodi-code-iqra-foundation\memory\MEMORY.md` indexes every decision, rejection and trap from the sessions that built this; it loads automatically. Read the files that touch what you are about to change. The rejections are binding — do not revive the timeline, the particle crowd, the six Misjon spectacles, the animation mockups for the glass boxes, or the third-size glow. The traps cost a round each when skipped: `preview_start` cannot serve a worktree; the e2e reuses port 3000; the hidden Browser pane freezes `requestAnimationFrame` (judge motion with Playwright on the real GPU, use the pane for the user's look); Playwright's Chromium has no H.264 (webm first in `<source>`); Lightning CSS drops a hand-prefixed `backdrop-filter`; Python text writes go CRLF on Windows; killing a Next server on Windows needs both the process name and the command line.
- **Two more traps, verified while this file was written, and one already fixed.** Until 2026-09-15, `npm test` in the main checkout swept `.claude\worktrees\brave-haibt-a385a6\**` — a leftover worktree of a merged fix, with its own `node_modules` — and reported 400 files and 54 failures that were not the repo's, after three minutes; `vitest.config.mts` now excludes `.claude/**` and `node_modules` at any depth, and the suite is 29 files in about 14 s. Run the suites from your own worktree in any case. `npm run lhci` never finishes on Windows (chrome-launcher's cleanup throws after the audit completes); run the `lighthouse` binary directly with the settings in `lighthouserc.json`. `.claude/launch.json` starts the MAIN checkout on 3000 (`next start`) or 3001 (`next dev`), which from a worktree is the wrong build.
- **Worktrees that exist now, neither yours:** `..\iqra-foundation-glatt` on `feat/misjon-glatt` holds `lib/near.ts` (build a section's simulation when it is near AND scroll is quiet — it removed a 226 ms freeze) and quicker Misjon lines; take the idea if you keep any simulation, do not disturb the worktree. `.claude\worktrees\brave-haibt-a385a6` is detached at a merged commit; leave it.
- Skills: the superpowers workflow loads automatically and is the house process; the checkpoint below is its approval gate, so treat the user's pick as the approved design and write the spec and plan from it. `frontend-design`, `impeccable` and `design-md-references` are there for the design passes if you want them.

## The structure to build

Pages, from the brief. Slugs are suggestions — ASCII, lowercase, Norwegian; keep `/om-oss` and `/stott-oss` because links to them exist.

| Menu | Route | Carries |
|---|---|---|
| Hjem | `/` | The main text (2) with «Utforsk vårt arbeid» → Vårt arbeid and «Støtt oss» → Støtt oss; Visjon and Misjon (3–4); the four areas as the through-line. Short. |
| Om oss | `/om-oss` | The Om oss text (5); the name's story may live here. |
| Vårt arbeid | `/vart-arbeid` | The four areas (6), each its own box or section, each linkable (`#kunnskap` …). |
| Arrangementer | `/arrangementer` | A list built for real events (date, title, place, text) with an honest empty state today. |
| Ressurser | `/ressurser` | Publications, articles, reports, presentations, videos — categories, honest empty state. |
| Menneskene bak | `/menneskene-bak` | The board text (7) now; the structure for names, photos, roles and short bios later. |
| Styringsdokumenter | `/styringsdokumenter` | Vedtekter, årsrapporter, årsregnskap, strategier — documents with a year and a file, honest empty state. |
| Kontakt | `/kontakt` | Contact — the address is `[EPOST]` and the org.nr `[ORG.NR]` until they exist. No form unless it has a destination. |
| Støtt oss | `/stott-oss` | A button in the menu and a page of its own — Vipps first; the numbers stay bracketed. |

**Home's headline** is the brief's (section 2): «En stiftelse for kunnskap, dialog, møteplasser og samfunnsdeltakelse». The logo carries the name; the red thread — IQRA FOUNDATION / Kunnskap. Dialog. Møteplasser. Samfunnsdeltakelse. — is a motif for the header, the footer and the seams between sections, not a second headline. A direction may argue otherwise, on the running page.

**Header, footer, 404.** The header is on every page with the logo in it (the guide's variant for that ground, not a text wordmark), all nine items one click away at 1440, 1280 and 1024 px, Støtt oss visibly a button, and on the phone a drawer that traps focus, closes on Escape and locks the page behind it. If nine cannot fit somewhere, show how you solved it inside the directions; do not drop items. The footer carries the logo, the nine links again, the red thread, `[ORG.NR]`, `[EPOST]` and Oslo — nothing else. `app/not-found.tsx` is a page in the same system: the header, one plain line («Siden finnes ikke.»), the menu.

**Collections — the floor**, in the brief's own categories. Add fields; do not remove these.

- `arrangementer`: title, start (ISO date, time optional), end (optional), place, text, link (optional), image `{src, alt}` (optional — one field, so a picture cannot arrive without its words). The page splits kommende and tidligere by today's date, each with its own empty line.
- `ressurser`: title, kind (publikasjon · artikkel · rapport · presentasjon · video · annet), date, summary, and either a file under `public/` or a URL.
- `styringsdokumenter`: title, kind (vedtekter · årsrapport · årsregnskap · strategi · annet), year, file.
- `menneskene`: name, role, photo `{src, alt}` (optional), bio, order.

Every collection ships empty. ISO dates in the record, written out on the page.

**Content layer — built so a CMS can own it.** The user will not edit the site through a CMS themselves, but the foundation may want to, so build the content the way a CMS would: every kind of thing that changes over time is a typed collection behind one access layer that the pages call — pages never read files themselves. Today the records are files in the repo (JSON, Markdown or TypeScript, your call) in a shape a CMS could write, and adding an item is one obvious edit, documented in the README. **Keystatic is the recommendation:** a git-based CMS whose edits land as commits, so Vercel rebuilds and the site stays static, and it brings its own login. Its docs give the shape — `@keystatic/core` and `@keystatic/next` (`@markdoc/markdoc` if a field is rich text); `keystatic.config.ts` at the root declaring the collections above; the admin UI at `app/keystatic/[[...params]]/page.tsx` with its layout and `makePage` client file; the API at `app/api/keystatic/[...params]/route.ts`; `storage: { kind: 'local' }` writes the repo's files under `next dev`, and GitHub mode needs a GitHub App and environment variables (its GitHub-mode page lists them). Three cautions. Its docs assume Next 14: prove it runs on this Next 16 before you commit to it, and if the adapter does not, stop at the documented setup — never downgrade Next or React to fit a CMS. Local mode cannot write on Vercel: until GitHub mode is configured, the admin and its API route are not part of the production build — the public site must never serve an admin that cannot save. And the pages read the collections through your access layer in both cases — Keystatic is a second door to the same files, not their owner. Write down exactly what the foundation must set up (a GitHub account with access to the repo, the GitHub App, the environment variables on Vercel) to edit from the browser in production. PDFs for Styringsdokumenter and Ressurser are files the CMS can upload, served from `public/`. The user keeps editing the files directly.

## Questions already answered

Do not ask these; the brief, the repo, the memory or the user has settled them.

- **Language:** bokmål only. No English version, no switcher.
- **Theme:** one, on the guide's light grounds. No dark mode; the reversed logos are for dark panels, not a second theme.
- **Domain:** none yet. `app/layout.tsx` reads the host from the environment; hardcode nothing.
- **Indexing:** `noindex` stays and `ALLOW_PLACEHOLDERS` stays, until the real numbers exist.
- **Analytics, cookies, consent banners, forms without a destination, payment integration:** none. Støtt oss is the Vipps number (bracketed) and the account line.
- **The film and the materials:** your call, made inside the directions, on the running page.
- **The typefaces' roles and weights:** your call, inside the directions.
- **The favicon** is the mark alone (variant 3 is the mark on white); **the share image** carries the logo, and the red thread if it stays legible at 1200×630.
- **The name's story:** the user's paragraph, in Om oss only, if a direction keeps it.
- **Nyheter:** no page. **Roles, names, dates, documents:** bracketed or absent, never plausible. **Team rows:** bracketed rows are allowed where a layout needs a body; the collection ships empty either way.
- **The CMS:** Keystatic, as above, as far as it goes without a database or a hand-rolled login.
- **Print stylesheet, RSS, sitemap, i18n routing:** none.

What only the user can answer is whatever the brief leaves open that changes the design. Ask it with the directions, once, your recommendation first.

## Process — one checkpoint

**1. Directions.** Read the brief, the repo and the memory. Then build two or three genuinely different directions — different designs, not three settings of one (the user has rejected a set for exactly that). They differ on the one question the user left open: at least one keeps the materials as the brand's ground (the ink and the water recoloured to the palette, the film kept), and at least one is built from the guide alone, with no simulation on the page; a third, if any, is a different structure, not a middle setting. Each direction is the identity system (logo use, palette, type, the four-areas motif), the home page, the navigation on desktop and phone, and one representative subpage (Vårt arbeid). Real enough to judge on the running page: each served on its own localhost port from its own worktree (`npm run build`, then `npx next start -p 3021` / `3022` / `3023` in the background; check the port is free first; `preview_start` cannot do this, and 3000 belongs to the e2e) and shot at 1440×900, 1280×720 and 390×844 at device pixel ratio 2 or 3. Present them in one message: what each direction is, what it does with the existing materials and why, one recommendation, and any question only the user can answer — then stop and wait for the pick. If you also publish an artifact to compare them side by side, it must hold at 390 px: the user opens artifacts on a phone. Do not build every page three times; do not ask what the repo or the memory can tell you.

**2. Build.** In the chosen direction, the whole site: every page, the menu, the content mapping, the empty states, the tokens, the tests, performance, accessibility, the phone. Work on your own branch in your own worktree (`git worktree list` first — another session may be standing in the main checkout). Every sub-agent inherits your boundaries: it builds only in your worktree, starts nothing on 3000 or 3001, stages explicit paths, and a verifier gets the brief and this file, not your summary of them. Establish how you check your own work against the brief and run it as you go; fresh-context verifier sub-agents beat self-critique. Keep a table as you build — each numbered section of the brief → the page and the content key that carry it → the test that proves it; it is the audit, and it goes in the PR. Delegate independent work and keep going while it runs. Before reporting anything as done, audit the claim against a tool result from this session.

**3. Hand-off.** Leave the finished site running on one port (3030) and say which; kill the direction servers and every other server you started, check the ports are free, and say so. Send screenshots of every page at the three sizes. Open one PR and do not merge it — «merge» is their word. The description says what shipped, what is stand-in (bracketed, listed), what you verified with the numbers, the audit table, and every recommendation you are holding — the field you would make optional, the label that reads wrong, the assumption they might veto — before anything deploys, so one deploy closes the batch; say «nothing else outstanding» if that is true. Record decisions and lessons in the memory directory the way the existing files do: one fact per file, a line in `MEMORY.md`.

## Definition of done

- Every page in the table exists, plus the 404, is reachable from the menu on desktop and phone, has its own `<title>` and a description in the brief's words, and can be read with JavaScript off.
- The brand is in the repo: the guide and the logo files committed, the logos served as SVG, the five palette values and the two typefaces as tokens, and none of the old sampled values left in the source. Geist and the old `public/media/iqra-logo.png` are gone. The favicon and the share image carry the logo.
- Everything that changes over time lives in typed collections behind one access layer; the CMS either runs in local mode against those same files or is documented to the point where switching it on is the foundation's setup, not more code; the README says how to add an item both ways.
- The brief's text is on the site verbatim and the test that proves it exists; nothing else pretends to be content; `node scripts/check-content.mjs` lists exactly the placeholders that remain and nothing surprising.
- `npx tsc --noEmit`, `npm run lint`, `npm test` (the repo's own files, not the nested worktree's), `npm run build` and `npx playwright test` (both projects) are green — tests updated for the new structure, deleted for what is gone, asserting the contract rather than a value that is meant to change — and no page logs a console error at either size.
- Lighthouse locally on `/` and one subpage within the budgets; reduced motion honoured; keyboard reaches everything; contrast passes on every ground.
- The site holds at 1440, 1280, 1024 and 390 px wide, and on a 1366×768 laptop.
- The PR description carries the audit table and the held recommendations; the memory directory carries the decisions.
- This file, brief included, is the reference for later sessions. It sits in the main checkout at `docs/prompts/2026-09-15-fable-identitet-og-struktur.md`; if it is not yet committed on `main` when you branch, copy it into your worktree unchanged and commit it on your branch. No separate copy of the brief is needed.

## Boundaries

- Do not invent content. Do not pad. Do not lower the resolution of anything drawn.
- Do not merge, deploy, change Vercel settings, or touch `robots` or `ALLOW_PLACEHOLDERS`.
- Do not work in the main checkout or in another session's worktree; never `git add -A`; stage explicit paths. Downloads is a read-only source.
- Do not revive anything the memory records as rejected.
- Do not add a database, hand-rolled authentication, analytics, cookies, or a form without a destination. The CMS is the one exception, and only one that keeps the site static and brings its own login. Do not downgrade Next, React or any dependency to fit a tool.
- Do not ask the user what the repo, the memory or this file answers; do ask, once and batched, what only they know.
- When you have enough information to act, act. Give a recommendation, not a survey. Your final message is for someone who did not watch you work: the outcome first, then what you need from them, in complete sentences, without the shorthand you built up on the way.
