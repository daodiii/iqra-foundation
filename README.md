# Iqra Foundation — landing page

The public landing page for Iqra Foundation, a Norwegian dawah organisation. One route,
`/`: a hero where the film plays inside giant IQRA letters, Visjon with a tree that grows
as you scroll, Misjon over a night still, then the footer.

Next 16 (App Router) and TypeScript, GSAP/ScrollTrigger for the motion, Tailwind v4 for
the reset and the design tokens, Vitest for units and Playwright for the browser. All copy
lives in `content/site.no.ts`; components never contain literal text.

Node >= 22.18 is required, and pinned in `package.json`. `scripts/check-content.mjs`
imports a `.ts` file natively (type stripping) and the Vitest config uses
`import.meta.dirname`, so on Node 20 the build fails in `prebuild`, before Next even
starts.

## Commands

| command | what it does |
|---|---|
| `npm run dev` | dev server on :3000 |
| `npm run build` then `npm start` | production build, then serve it |
| `npm test` | Vitest, one pass |
| `npm run e2e` | Playwright; it runs `build && start` itself, so start no server first |
| `npm run lint` | ESLint |
| `npm run media` | re-encode the film and the stills — see below |
| `npm run lhci` | Lighthouse CI against the production build |

## Things the code does not tell you

**`npm run media` is not part of the build.** It needs `ffmpeg` on your PATH, and it reads
the master film from a path hardcoded near the top of `scripts/media.mjs`
(`C:/Users/daodi/generations/...`), which exists only on the machine the film was made on.
Everything it produces is committed under `public/media`, so you need it only if the film
itself changes — and then you have to point `SRC` at your own copy first.

**`npm run lhci` does not finish on Windows.** The audit itself completes every time; what
crashes is `chrome-launcher`'s cleanup — `kill()` calls `destroyTmp()` outside the
try/catch that guards it, `rmSync` throws EPERM, and `@lhci/cli` forgives only one error
string, which this path never emits, so a finished report is thrown away. It should be
fine on a Linux CI runner. To audit locally, call the `lighthouse` binary directly with
the same settings. Note that the performance assertion in `lighthouserc.json` currently
fails on purpose: it holds the spec's numbers rather than the measured ones.

**The email address is a placeholder that will stop a production deploy.**
`content/site.no.ts` carries `contact.email: '[EPOST]'`. `prebuild` runs
`scripts/check-content.mjs`, which tolerates placeholders everywhere except one place:
when `VERCEL_ENV === 'production'` it exits 1 and the deploy fails. That is deliberate —
put the real address in before going live.
