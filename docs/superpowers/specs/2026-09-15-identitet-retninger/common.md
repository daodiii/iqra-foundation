# Common brief for the three directions (read this first, then your direction's file)

You are building ONE design direction for the Iqra Foundation website, in your own git
worktree, so the site's owner can pick between three running pages. Effort is at max: spend
it on the design and on checking it on the running page, not on ceremony.

## Where you work — boundaries that are not negotiable

- Your worktree is the path named in your task (`C:\Users\daodi\code\iqra-foundation-dir-X`),
  on your branch (`dir/x-...`). Work ONLY there. Never touch `C:\Users\daodi\code\iqra-foundation`
  (the main checkout), `..\iqra-foundation-identitet`, `..\iqra-foundation-glatt` or another
  direction's worktree.
- Never start anything on port 3000 or 3001. Your port is named in your task. Before starting a
  server check the port is free (`netstat -ano | findstr :PORT`). Do not use `preview_start`
  (it serves the main checkout, not your worktree).
- Stage explicit paths (`git add <paths>`), never `git add -A` or `git add .`. Commit on your
  branch with a message that says what and why, ending with the line
  `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Do not push, do not merge.
- Do not invent content: no example event, name, document, date, photo or number. The site's
  prose is the foundation's brief, verbatim, and it is already in `content/brief.no.ts`; a
  unit test (`content/brief.test.ts`) fails if a word of it changes. You write only functional
  microcopy (labels, alt text, empty-state lines), in plain bokmål, in `content/site.no.ts`.
  `islam` is lower case.
- Read `docs/prompts/2026-09-15-fable-identitet-og-struktur.md` in your worktree first: it is the
  full brief (the foundation's text between the two rules) and the standard («What top-class
  means here», «Words», «The brand», «The structure to build»). Your direction file tells you
  which parts to build now.
- Read `AGENTS.md`: this Next version differs from your training data; its docs are in
  `node_modules/next/dist/docs/`.

## What is already in the worktree (the base — do not rebuild it, restyle it)

- `app/globals.css`: the design tokens (`@theme`): the five brand colours (`--color-navy`
  #2c394b, `--color-turquoise` #67c1bf, `--color-light` #f0f0f1, `--color-dark` #393e46,
  `--color-crimson` #ab5261) and named tints, the two faces (`--font-sans` = General Sans,
  `--font-text` = Supreme), easing, radius, `--margin`, `--header-h`. Every colour you use is
  one of these tokens or a new tint you add to `@theme`, traceable to one of the five. Never a
  literal hex in a component.
- `app/fonts.ts`: General Sans 400/500/600/700 and Supreme 400/500/700/800, self-hosted via
  `next/font/local` from `brand/fonts/`. If your direction needs another weight, the WOFF2 files
  for every weight are in
  `C:\Users\daodi\AppData\Local\Temp\claude\C--Users-daodi-code-iqra-foundation\fbc1e303-3444-4286-890b-c9635366874b\scratchpad\fonts\gs\GeneralSans_Complete\Fonts\WEB\fonts\`
  and `...\sup\Supreme_Complete\Fonts\WEB\fonts\` — copy the one you need into
  `brand/fonts/<family>/` and add it to `app/fonts.ts`.
- `public/brand/`: the logo as SVG, one file per colour combination the guide gives:
  `iqra-logo.svg` (navy, crimson accent, navy «Foundation» — for white, light and turquoise
  grounds), `iqra-logo-on-navy.svg`, `iqra-logo-on-dark.svg`, `iqra-logo-on-crimson.svg`
  (reversed, for those grounds), `iqra-logo-turquoise-foundation.svg` (navy + crimson accent +
  turquoise «Foundation», on white/light), `iqra-logo-turquoise-accent.svg` (navy + turquoise
  accent + crimson «Foundation»), `iqra-logo-crimson-mark.svg`, `iqra-logo-alt.svg` (the
  optional alternate, navy tail), `iqra-logo-white.svg`, `iqra-logo-black.svg` (mono),
  `iqra-mark.svg` (the mark alone, navy + crimson), `iqra-mark-plate.svg` and
  `iqra-logo-plate.svg` (on the turquoise square plate). The art is the guide's, cut from the
  PDF; never recolour it, never redraw it. Choose the variant the guide gives for the ground.
  `components/site/Logo.tsx` picks by ground (`ground="white|light|turquoise|navy|dark|crimson"`,
  `mark` for the mark alone); use it or extend it.
- `brand/guide/iqra-branding-2025.pdf` is the guide; `brand/logos/png/` the eight PNGs.
  A rendered preview of the guide is at
  `C:\Users\daodi\AppData\Local\Temp\claude\C--Users-daodi-code-iqra-foundation\fbc1e303-3444-4286-890b-c9635366874b\scratchpad\pdf\preview.png`
  (open it with the Read tool to see the guide's own layout language: flat plates of the
  five colours, the logo on each, «Foundation» tracked out in a rounded lowercase).
- `content/brief.no.ts` (the brief, verbatim: `brief.home.headline/paragraph/buttons`,
  `brief.vision`, `brief.mission`, `brief.about`, `brief.areas[]` (key, name, text),
  `brief.people`, `brief.menu[]`, `brief.thread.name/line` = «IQRA FOUNDATION» / «Kunnskap.
  Dialog. Møteplasser. Samfunnsdeltakelse.», `brief.documents`, `brief.resources`, `brief.four`)
  and `content/site.no.ts` (nav items with hrefs, buttons, labels, empty states, the four
  bracketed facts `[EPOST]` `[ORG.NR]` `[NUMMER]` `[KONTO]`).
- `components/site/`: `Header.tsx` (skip link, logo home, `Nav.tsx`), `Nav.tsx` (client: the
  nine items; a row on a desktop, a two-row header between 900 and 1179px, a drawer under 900px
  that traps focus, closes on Escape, locks scroll; `aria-current="page"`; Støtt oss is the
  button), `Footer.tsx` (navy: logo reversed, the nine links, the red thread, org.nr, e-mail,
  Oslo), `site.module.css` (their plain styles), `page.module.css` (the subpages' plain
  layout), `Logo.tsx`.
- `app/`: `layout.tsx` (fonts, metadata title template, Header + `<main id="innhold">` +
  Footer), `page.tsx` (Hjem, plain), `vart-arbeid/page.tsx`, `om-oss`, `arrangementer`,
  `ressurser`, `menneskene-bak`, `styringsdokumenter`, `kontakt`, `stott-oss`, `not-found.tsx`,
  `icon.svg`. The subpages other than Vårt arbeid stay as they are for now; give them your
  header/footer and tokens, and only restyle them if it is cheap.
- `lib/`: `content.ts` (the collections), `dates.ts`, `near.ts` (build a simulation when near
  AND the page is quiet), and the draft's materials `ink.ts`, `water.ts`, `pen.ts`, `film.ts`,
  `gsap.ts`, `media.ts` — only direction A uses them.
- The draft's old components (the film through letters, the tree, the book, the frames, the
  wash CSS) are in git history at commit `5522a43`: `git show 5522a43:components/wash.module.css`,
  `git show 5522a43:components/vision/Vision.tsx`, `git show 5522a43:components/hero/Hero.tsx`,
  `git show 5522a43:components/hero/hero.module.css`. Lift patterns from them if useful; do not
  restore them wholesale.
- Tests: `npm test` (vitest, currently 147 green), `npx tsc --noEmit`, `npm run lint`,
  `npm run build`. Keep all four green before you report. Write unit tests for what you build
  (Testing Library + jsdom; the setup stubs canvas 2D and returns null for WebGL). No e2e is
  needed at this stage.

## What you deliver

1. The identity system of your direction, made explicit in `app/globals.css` (adjust the
   tokens: type roles and weights, tints, radius, motion) and in the shell (`Header`, `Nav`,
   `Footer` restyled to your direction; keep their behaviour and their tests green, extend
   the tests if the structure changes).
2. The home page (`app/page.tsx` and its components under `components/home/` or your
   direction's folder), with the brief's text: headline (2), paragraph (2), the two buttons
   (`site.cta.work`, `site.cta.support`), Visjon (3), Misjon (4), and the four areas (6) as the
   through-line. Short: the menu does the work the long page used to do. Complete with
   JavaScript off and with `prefers-reduced-motion`.
3. Vårt arbeid (`app/vart-arbeid/page.tsx`): the four areas, each its own section, each
   linkable by `#kunnskap` `#dialog` `#moteplasser` `#samfunnsdeltakelse`, in your direction's
   language; a visitor can tell which area they are looking at.
4. The 404 and the other subpages inherit your shell and tokens and must not look broken.
5. Holds at 1440, 1280, 1024 and 390 px wide (and on a 1366×768 laptop): no horizontal
   scroll, nothing clipped, the nine menu items reachable, contrast ≥ 4.5:1 for text on every
   ground you introduce (check with a computation, not by eye), focus visible.
6. Verified on the running page: `npm run build`, then start `npx next start -p <your port>`
   in the background from your worktree, and shoot `/` and `/vart-arbeid` at 1440×900,
   1280×720 and 390×844 (device scale factor 2; a mobile context for the phone) with a
   Playwright script kept in the scratchpad folder named in your task (import playwright by
   absolute `file:///` URL from your worktree's node_modules — a bare import does not resolve
   from outside the project). Look at every screenshot with the Read tool and fix what you
   see. Then stop your server (PowerShell: `Get-CimInstance Win32_Process | Where-Object {
   $_.Name -eq 'node.exe' -and $_.CommandLine -like '*iqra-foundation-dir-X*' } | ForEach-Object
   { Stop-Process -Id $_.ProcessId -Force }`; from bash, `taskkill /PID <pid> /F` where the pid
   comes from `netstat -ano`) and confirm the port is free. The orchestrator restarts it.
7. Commit(s) on your branch. Your final report: what you built and why (in design terms, as
   a designer would read it), what you kept of the draft and what you replaced, the type roles
   and weights you chose, every token you added, the screenshot paths, the four checks'
   results (copy the summary lines), and anything you left open. Do not claim what a tool
   result in your session does not show.

## Craft rules (from the memory of this project — each cost a round once)

- Lightning CSS (this Next's CSS compiler) drops the unprefixed `backdrop-filter` if you also
  write `-webkit-backdrop-filter`: write ONLY the unprefixed property, ever, for anything
  prefixable.
- The user sees resolution: never draw anything below the screen's resolution (no scaled-up
  canvases, no blurry glows, no low-res images). Every canvas is sized to devicePixelRatio
  (cap 2).
- Nothing moves to show off; the page is complete with motion off. Honour
  `prefers-reduced-motion` in every animation, in CSS and in JS.
- No photography exists: the design must be complete with no photograph on it. The film's
  frames (`public/media/iqra-loop-*.{webm,mp4}`, `iqra-poster.jpg`) are the only real imagery
  (direction A only).
- Semantic HTML: one `<h1>` per page, sections with headings, `<nav>` landmarks named, buttons
  are buttons and links are links, `lang="nb"` (already set), a skip link (already there).
- Phone first in the sense that 390px is where the design is judged: shoot it, look at it.
- No em dashes, arrows or marketing gloss in any copy you write; short plain bokmål.
- Python scripts that write repo files must open them with `newline='\n'`; long heredocs in
  the Bash tool are unreliable — write scripts to files and run them.
