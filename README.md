# Iqra Foundation — nettsiden

The website of Iqra Foundation, a Norwegian foundation for knowledge, dialogue, meeting
places and participation. Nine pages, one per item of the foundation's own menu: Hjem, Om
oss, Vårt arbeid, Arrangementer, Ressurser, Menneskene bak, Styringsdokumenter, Kontakt,
Støtt oss. The site is built from the foundation's brief and its brand guide, and the brief's
text is the site's text, word for word — see «Content» below.

Next 16 (App Router) and TypeScript, Tailwind v4 for the reset and the design tokens, Vitest
for units, Playwright for the browser, Keystatic as the content editor. Node ≥ 22.18 is
required and pinned in `package.json`: `scripts/check-content.mjs` imports `.ts` files
natively, so on an older Node the build fails in `prebuild`, before Next starts.

## Commands

| command | what it does |
|---|---|
| `npm run dev` | dev server on :3000, with the content editor at `/keystatic` |
| `npm run build` then `npm start` | production build, then serve it |
| `npm test` | Vitest, one pass |
| `npm run e2e` | Playwright; it runs `build && start` itself, so start no server first |
| `npm run lint` | ESLint |
| `node scripts/check-content.mjs` | lists the placeholders still in the content |
| `node scripts/share-image.mjs` | re-renders `app/opengraph-image.png` (needs the Playwright browser) |
| `npm run lhci` | Lighthouse CI against the production build (see below) |

## Where things are

- `content/brief.no.ts` — the foundation's brief, verbatim. Generated from
  `docs/prompts/2026-09-15-fable-identitet-og-struktur.md` (the text between its two rules),
  and held to it by `content/brief.test.ts`: change a word on either side and `npm test`
  fails. Nothing on the site says anything in its own words except the functional microcopy
  in `content/site.no.ts` (labels, buttons, empty states, titles, descriptions).
- `content/<collection>/` — what changes over time: `arrangementer`, `ressurser`,
  `styringsdokumenter`, `menneskene`. One JSON file per entry, named by slug. Read by the
  pages through `lib/content.ts` only; written by hand or by Keystatic.
- `brand/` — the guide (`guide/iqra-branding-2025.pdf`), the eight logo PNGs, and the two
  typefaces (General Sans and Supreme, WOFF2, with the ITF Free Font License beside them).
  `public/brand/` holds the logo as SVG, one file per colour combination the guide gives;
  `components/site/Logo.tsx` picks the variant for the ground.
- `app/globals.css` — the design tokens: the guide's five colours and their named tints, the
  two faces, spacing, radius, motion. Components read tokens and never write a literal.

## Content

### The four facts that are still placeholders

`content/site.no.ts` carries `[EPOST]`, `[ORG.NR]`, `[NUMMER]` (Vipps) and `[KONTO]`.
`prebuild` runs `scripts/check-content.mjs`, which lists them and, when
`VERCEL_ENV === 'production'`, refuses the build — unless `ALLOW_PLACEHOLDERS=1`, which
`vercel.json` sets on purpose so the site can be live while openly unfinished. Put the real
values in, delete `build.env.ALLOW_PLACEHOLDERS` from `vercel.json` and the `robots` field in
`app/layout.tsx` (the site is `noindex` until then), and the gate is back.

### Adding an item by hand

Drop a JSON file in the collection's directory; it is on the page at the next build. The
shapes (`lib/content.ts` checks them and names the field when something is wrong):

```jsonc
// content/arrangementer/apen-kveld.json
{
  "title": "Åpen kveld",
  "start": "2027-01-20",        // ISO date; written out as «20. januar 2027»
  "time": "18:00",              // optional
  "end": "2027-01-21",          // optional, for several days
  "place": "Oslo",
  "text": "…",
  "link": "https://…",          // optional
  "image": { "src": "/media/arrangementer/apen-kveld.jpg", "alt": "…" },  // optional; alt required with a picture
  "area": "dialog"              // optional: kunnskap | dialog | moteplasser | samfunnsdeltakelse, or left out
}
// content/ressurser/rapport-2026.json
{ "title": "…", "kind": "rapport", "date": "2026-05-01", "summary": "…", "file": "/files/ressurser/rapport-2026.pdf" }
// kind: publikasjon | artikkel | rapport | presentasjon | video | annet; "url" instead of "file" for something hosted elsewhere
// "area" as on an event: one of the four areas, or left out; the card then carries the area's mark
// content/styringsdokumenter/vedtekter.json
{ "title": "Vedtekter", "kind": "vedtekter", "year": 2025, "file": "/files/styringsdokumenter/vedtekter.pdf" }
// kind: vedtekter | arsrapport | arsregnskap | strategi | annet
// content/menneskene/fornavn-etternavn.json
{ "name": "…", "role": "…", "bio": "…", "order": 10, "photo": { "src": "/media/menneskene/….jpg", "alt": "…" } }
```

Files go under `public/`: pictures in `public/media/<collection>/`, PDFs in
`public/files/<collection>/`. Arrangementer are split into kommende and tidligere by the
day of the build.

### Editing in the browser (Keystatic)

Keystatic is a git-based editor: every save is a file in the repository, so the site stays
static and nothing needs a database.

- **On this machine:** `npm run dev`, then http://localhost:3000/keystatic. Local mode
  writes the same files as above; commit them.
- **In production (from the browser, for the foundation):** GitHub mode, which needs a
  one-time setup. The admin and its API are not served until it is done
  (`lib/keystatic.ts`), because a local-mode admin on Vercel has no disk to write to.
  1. A GitHub account with write access to `daodiii/iqra-foundation` for each editor.
  2. A GitHub App: with the variables below unset, open `/keystatic` on a local `npm run
     dev`, switch `keystatic.config.ts` to `storage: { kind: 'github', repo: { owner:
     'daodiii', name: 'iqra-foundation' } }` and follow Keystatic's own setup screen, which
     creates the app and prints the variables; or create the app by hand at
     github.com/settings/apps with the callback URL `https://<site>/api/keystatic/github/oauth/callback`
     and repository permission «Contents: read and write».
  3. Four environment variables on Vercel (Settings → Environment Variables):
     `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`
     (any long random string) and `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`.
  4. Redeploy. `/keystatic` then asks editors to sign in with GitHub; a save becomes a
     commit on `main`, and Vercel rebuilds the site.

`keystatic.config.ts` declares the same collections as `lib/content.ts` reads, from one
declaration in `content/collections.ts`; `content/collections.test.ts` holds the two to it.

## Things the code does not tell you

**`npm run lhci` does not finish on Windows.** The audit completes; what crashes is
`chrome-launcher`'s cleanup. To audit locally, call the `lighthouse` binary directly with the
settings in `lighthouserc.json` (performance ≥ 0.90, accessibility ≥ 0.95, CLS ≤ 0.05).

**`npm run media` is not part of the build.** It needs `ffmpeg` and reads the master film
from a path near the top of `scripts/media.mjs` that exists only on the machine the film was
made on. Everything it produces is committed under `public/media`.

**The share card is a committed PNG.** `scripts/share-image.mjs` renders it with headless
Chromium from the repo's own logo and fonts; run it after changing either.
