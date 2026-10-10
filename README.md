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
- `content/<collection>/` — what changes over time: `arrangementer`, `nyheter`, `ressurser`
  (one folder per post: `index.json`, and `body.mdoc` for a full text), `styringsdokumenter`,
  `menneskene` (one JSON file per entry), named by slug. Read by the pages through
  `lib/content.ts` only; written by hand or by Keystatic.
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

Make a folder named by the slug in the collection's directory, with an `index.json` (and, for a
post with a full text, a `body.mdoc` in Markdoc); it is on the page at the next build. Menneskene
and styringsdokumenter are a single `<slug>.json` instead. The shapes (`lib/content.ts` checks
them; a record that fails is left off the site and named in a build warning, and
`lib/content.real.test.ts` fails on it):

```jsonc
// content/arrangementer/apen-kveld/index.json   (+ body.mdoc for the full text, optional)
{
  "title": "Åpen kveld",
  "start": "2027-01-20",        // ISO date; written out as «20. januar 2027»
  "time": "18:00",              // optional
  "end": "2027-01-21",          // optional, for several days
  "place": "Oslo",
  "summary": "…",               // the card's short text
  "link": "https://…",          // optional: sign-up or more information
  "image": { "discriminant": true, "value": { "src": "/opplastet/arrangementer/apen-kveld/image/value/src.jpg", "alt": "…" } },  // optional; alt required with a picture
  "area": "dialog",             // optional: kunnskap | dialog | moteplasser | samfunnsdeltakelse, or left out
  "publish": true               // without it the post is a draft and is not shown
}
// content/nyheter/ny-styreleder/index.json   (+ body.mdoc)
{ "title": "…", "date": "2027-01-21", "summary": "…", "publish": true }
// image and area as on an event
// content/ressurser/rapport-2026/index.json   (+ body.mdoc for an article written here)
{ "title": "…", "kind": "rapport", "date": "2026-05-01", "summary": "…", "file": "/files/ressurser/rapport-2026.pdf", "publish": true }
// kind: publikasjon | artikkel | rapport | presentasjon | video | annet
// one of: "file", "url" (hosted elsewhere), or a body.mdoc (the full text is the resource)
// content/styringsdokumenter/vedtekter.json
{ "title": "Vedtekter", "kind": "vedtekter", "year": 2025, "file": "/files/styringsdokumenter/vedtekter.pdf" }
// kind: vedtekter | arsrapport | arsregnskap | strategi | annet
// content/menneskene/fornavn-etternavn.json
{ "name": "…", "role": "…", "bio": "…", "order": 10, "photo": { "src": "/media/menneskene/….jpg", "alt": "…" } }
```

A post's picture is written the way Keystatic writes it, the shape above: Keystatic will not
open a post whose picture is the plain `{ "src", "alt" }`. The reader also takes the plain
shape, which is what Menneskene's photos use. Files go under `public/`: a post's pictures in
`public/opplastet/<collection>/` (not `public/media/`, which is cached as immutable for a
year), PDFs in `public/files/<collection>/`. Arrangementer are split into kommende and
tidligere by the day the page is rendered (hourly).

### Editing in the browser (Keystatic)

Keystatic is a git-based editor: every save is a file in the repository, so the site stays
static and nothing needs a database. The editors' own guide, in Norwegian, is
`docs/slik-publiserer-du.md`.

- **On this machine:** `npm run dev`, then http://localhost:3000/keystatic. Local mode
  writes the same files as above; commit them.
- **In production (from the browser, for the foundation):** GitHub mode. A save is a commit
  on `main` by the editor's GitHub account; Vercel rebuilds and the change is live in a minute
  or two. The admin and its API are 404 until it is switched on (`lib/keystatic.ts`). Once:
  1. **The GitHub App.** On this machine, with no Keystatic variables in `.env`, run
     `$env:NEXT_PUBLIC_KEYSTATIC_STORAGE='github'; npm run dev` (PowerShell, in a window of its
     own, closed afterwards: the variable stays set in that window, and a later `npm run dev`
     there would save to GitHub) and open http://localhost:3000/keystatic. Keystatic's setup
     screen creates a GitHub App on your account and writes its four values into `.env` (which
     is not committed). If it does not, the app's page on GitHub shows its Client ID and makes
     a Client secret; `KEYSTATIC_SECRET` is any long random string; the slug is the app's name
     as its URL writes it. In the app's settings on GitHub, add the live callback URL
     `https://<site>/api/keystatic/github/oauth/callback`, and install the app on
     `daodiii/iqra-foundation`.
  2. **Vercel** (Settings → Environment Variables, Production): `NEXT_PUBLIC_KEYSTATIC_STORAGE`
     = `github`, and the four from `.env`: `KEYSTATIC_GITHUB_CLIENT_ID`,
     `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`.
     The mode is read from a `NEXT_PUBLIC_` variable on purpose: the admin's config also runs
     in the browser, where a server-only variable is always undefined.
  3. **Editors:** each one a GitHub account, added to the repository with write access.
  4. **Redeploy**, open `https://<site>/keystatic`, sign in, publish a test post, see it on the
     site, then untick «Publiser på nettsiden» and save to take it down.
- **The repository is public**, so a draft is readable on GitHub even though the site never
  shows it. Keeping it private needs Vercel Pro: on the Hobby plan Vercel will not deploy a
  private repository's commits by anyone but the account owner, and Keystatic commits as the
  editor.

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
