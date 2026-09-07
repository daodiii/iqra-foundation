# Iqra Foundation Website Implementation Plan (v2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the v1 landing page for Iqra Foundation: the film playing inside giant IQRA letters that open with the scroll, then the vision text beside a tree that grows from a seed (root Iqra; limbs Dialog, Brobygging, Kunnskap), then the mission over a night still, then the footer.

**Architecture:** Next 16 App Router, one route `/`, server-rendered at rest. Client components add GSAP timelines after hydration: the hero's pinned letter-opening, Visjon's pinned tree growth and kinetic lines, Misjon's pinned still. The tree is a canvas renderer ported from the committed prototype. No state before hydration, no storage, no inline scripts.

**Tech Stack:** Next 16.3 · React 19.2 · TypeScript 5 · Tailwind 4 · GSAP 3 (core + ScrollTrigger) + `@gsap/react` · Vitest 4 + Testing Library · Playwright 1.55 · sharp (stills) · ffmpeg (on PATH) · Lighthouse CI.

**Spec:** `docs/superpowers/specs/2026-09-07-iqra-foundation-website-design.md` (v2.1) — read it first; every task cites its sections. The prototype the spec describes is committed at `docs/superpowers/specs/prototype/` (`app.js`, `styles.css`, `index.tpl.html`); Tasks 6–8 port from it.

## Global Constraints

- Repo: `C:\Users\daodi\code\iqra-foundation`, Node 24, npm. Commit after every task with the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Never `git add -A`; stage explicit paths.
- Versions match `iqra-portal`: `create-next-app@16` (Next 16.3.x, React 19.2.x, Tailwind 4), `vitest@4`, `@playwright/test@~1.55.1`.
- Colours are exact: navy `#2a394b`, crimson `#ab5263`, white `#ffffff`, night `#0e1620`, film-black `#0b1118`, ink-soft `#4b586a`, muted `#8a94a3`, hairline `#e3e7ec`; tree twig `rgb(84,98,116)`, root `rgb(74,90,110)`, leaf gold `rgb(201,154,63)`.
- Fonts: Geist and Geist Mono via `next/font/google` only.
- Every Norwegian string lives in `content/site.no.ts`; components never contain literal copy (accessible names included).
- Motion vocabulary: entrances `expo.out`, crossfades `power2.inOut`, scrubbed growth `none` then `power2.in`; the hero mask is never scaled past 14.
- v1 header: the wordmark link only, no nav. CTA is `mailto:` with the `[EPOST]` placeholder until the user supplies an address.
- Budgets (§10): 1080p loop mp4 ≤ 3 MB, webm ≤ 1.6 MB; 720p mp4 ≤ 1.2 MB, webm ≤ 0.8 MB; still AVIF ≤ 150 KB, WebP ≤ 220 KB; poster ≤ 160 KB; JS ≤ 160 KB gz on `/`.
- Plain `<img>`/`<picture>`/`<video>`; disable `@next/next/no-img-element`.
- Reduced motion (`prefers-reduced-motion: reduce`): nothing pins, scrubs or autoplays; the page is laid out at rest.

## File structure

| File | Responsibility |
|---|---|
| `app/layout.tsx` | `<html lang="nb">`, fonts, metadata, poster preload |
| `app/page.tsx` | `Header`, `main` with `Hero`, `Vision`, `Mission`, then `Footer` |
| `app/globals.css` | Tailwind import, `@theme` tokens, `--margin`, `--header-h`, base styles |
| `content/site.no.ts` | All copy (§4) |
| `lib/gsap.ts` | Registers ScrollTrigger + useGSAP once; `gsap`, `ScrollTrigger`, `useGSAP`, `EASE`, `DUR`, `reducedMotion()` |
| `lib/media.ts` | `pickSource({narrow, webm})` → loop URL (§6.4) |
| `components/Header.tsx` + `header.module.css` | Fixed transparent header; `#site-wordmark` link, hidden until the hero opens; `data-on-dark` colour switch |
| `components/Footer.tsx` + `footer.module.css` | Name, year, mailto |
| `components/hero/maskOrigin.ts` | Pure origin maths (§6.3) |
| `components/hero/Hero.tsx` + `hero.module.css` | Video, SVG mask, copy, hint; the pinned timeline (§6.2) |
| `components/vision/tree.ts` | The tree: `createVisionTree(stage, opts)` ported from the prototype (§7) |
| `components/vision/Tree.tsx` | Canvas box with the four names, wires `createVisionTree` |
| `components/vision/Vision.tsx` + `vision.module.css` | Lines beside the tree; pinned growth (§7) |
| `components/mission/Mission.tsx` + `mission.module.css` | Night still with the mission text; pinned drift (§8) |
| `scripts/lib/content-check.mjs`, `scripts/check-content.mjs` | Content gate (§4) |
| `scripts/media.mjs` | Loop cuts, poster, still (§6.4) |
| `e2e/hero.spec.ts`, `e2e/sections.spec.ts` | Playwright (§13) |
| `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `lighthouserc.json` | Tooling |

---

### Task 1: Scaffold and tooling

**Files:**
- Create (by `create-next-app`): `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `app/*`, `public/*`, `.gitignore`
- Create: `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `.gitattributes`, `lib/smoke.test.ts`
- Modify: `package.json` (scripts), `eslint.config.mjs`, `.gitignore`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `start`, `lint`, `test`, `test:watch`, `e2e`, `media`, `lhci`; the `@/*` alias; Vitest with jsdom, Testing Library and canvas/media stubs; Playwright projects `desktop` (Chromium 1440×900) and `phone` (Pixel 7, Chromium — WebM plays in Playwright's Chromium, H.264 does not).

- [ ] **Step 1: Scaffold Next in the existing repo**

Run from `C:\Users\daodi\code\iqra-foundation` (the folder holds only `.git` and `docs/`, both allowed):

```bash
npx --yes create-next-app@16 . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --disable-git --yes
```

Expected: `Success!`. If it still prompts, accept the defaults.

- [ ] **Step 2: Install dependencies**

```bash
npm i gsap @gsap/react
npm i -D vitest@4 @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test@~1.55.1 sharp @lhci/cli
npx playwright install chromium
```

- [ ] **Step 3: Vitest config and setup**

`vitest.config.ts`:

```ts
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', 'e2e/**', '.next/**'],
  },
});
```

`vitest.setup.ts` (jsdom has no media playback, no `matchMedia`, no canvas, no `IntersectionObserver`, and no SVG text metrics; the components need all of them):

```ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  }),
});

HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
HTMLMediaElement.prototype.load = vi.fn();
HTMLMediaElement.prototype.pause = vi.fn();
HTMLMediaElement.prototype.canPlayType = vi.fn().mockReturnValue('probably');

class IO { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: IO });

// A 2D context stub: every drawing call is a no-op; gradients are inert objects.
const gradient = { addColorStop: () => {} };
const ctx2d = new Proxy({}, {
  get: (_t, key) => {
    if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => gradient;
    if (key === 'measureText') return () => ({ width: 10 });
    return () => {};
  },
  set: () => true,
});
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(ctx2d as unknown as CanvasRenderingContext2D);

Object.defineProperty(document, 'fonts', { value: { ready: Promise.resolve(), load: () => Promise.resolve([]) } });
```

- [ ] **Step 4: Playwright config**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 40_000,
  fullyParallel: false,
  retries: 0,
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

- [ ] **Step 5: Scripts, lint rule, git hygiene**

`package.json` `"scripts"`, exactly:

```json
{
  "dev": "next dev",
  "prebuild": "node scripts/check-content.mjs",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest",
  "e2e": "playwright test",
  "media": "node scripts/media.mjs",
  "lhci": "lhci autorun"
}
```

(`prebuild` points at a script Task 2 creates; `npm run build` fails until then — expected.)

In `eslint.config.mjs`, add to the exported config array:

```js
{ rules: { '@next/next/no-img-element': 'off' } },
```

Create `.gitattributes`:

```
* text=auto eol=lf
```

Append to `.gitignore`:

```
test-results/
playwright-report/
.lighthouseci/
scripts/.frames/
```

- [ ] **Step 6: Smoke test**

`lib/smoke.test.ts`:

```ts
import { expect, test } from 'vitest';

test('vitest runs with jsdom and the canvas stub', () => {
  document.body.innerHTML = '<canvas></canvas>';
  const c = document.querySelector('canvas') as HTMLCanvasElement;
  expect(c.getContext('2d')).not.toBeNull();
});
```

Run: `npm test` → Expected: `1 passed`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts eslint.config.mjs postcss.config.mjs .gitignore .gitattributes app public vitest.config.ts vitest.setup.ts playwright.config.ts lib/smoke.test.ts
git commit -m "chore: scaffold Next 16 with Vitest and Playwright

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Content, tokens, layout and the content gate

Implements spec §3, §4, §10 (poster preload).

**Files:**
- Create: `content/site.no.ts`, `scripts/lib/content-check.mjs`, `scripts/lib/content-check.test.ts`, `scripts/check-content.mjs`
- Modify: `app/globals.css` (replace), `app/layout.tsx` (replace), `app/page.tsx` (replace with a stub)
- Delete: `public/next.svg`, `public/vercel.svg`, `public/file.svg`, `public/globe.svg`, `public/window.svg`

**Interfaces:**
- Produces: `site` from `@/content/site.no` (shape below); CSS variables `--header-h` (72px), `--margin` (80px / 24px); Tailwind colours `navy crimson night film-black ink-soft muted hairline`; `--font-sans`, `--font-mono`, `--ease-out-expo`.
- Produces: `contentProblems(site, { production })` → `string[]`.

- [ ] **Step 1: Content file**

`content/site.no.ts`:

```ts
export const site = {
  lang: 'nb',
  name: 'Iqra Foundation',
  meta: {
    title: 'Iqra Foundation',
    description: 'Iqra betyr les. Vi snakker gjerne med deg om islam.',
  },
  header: { wordmark: 'IQRA', homeLabel: 'Iqra Foundation, til toppen' },
  hero: {
    word: 'IQRA',
    h1Lines: ['Iqra betyr', 'les'],
    lede: 'Det er det første ordet i Koranen. For oss betyr det å lese, å lære, og å snakke med folk som lurer på noe.',
    cta: 'Still et spørsmål',
    hint: 'Bla nedover',
  },
  vision: {
    label: 'Visjon',
    lines: ['Vi vil ha et Norge', 'der folk kjenner islam', 'fra ekte møter,', 'ikke fra overskrifter.'],
    sub: 'Der det er lett å spørre, og lett å få et ærlig svar.',
    tree: {
      root: 'Iqra',
      limbs: ['Dialog', 'Brobygging', 'Kunnskap'],
      label: 'Et tre: roten er Iqra, greinene er Dialog, Brobygging og Kunnskap',
    },
  },
  mission: {
    label: 'Misjon',
    text: 'Vi forteller om islam på en vennlig og ærlig måte. Vi inviterer til samtaler, svarer på spørsmål og møter folk der de er. Slik bygger vi broer, og lærer av hverandre.',
  },
  contact: { email: '[EPOST]' },
} as const;

export type Site = typeof site;
```

- [ ] **Step 2: Failing content-check tests**

`scripts/lib/content-check.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { contentProblems } from './content-check.mjs';
import { site } from '@/content/site.no';

describe('contentProblems', () => {
  test('the real content has no problems outside production', () => {
    expect(contentProblems(site, { production: false })).toEqual([]);
  });

  test('flags empty strings anywhere, with their path', () => {
    const broken = { ...site, hero: { ...site.hero, lede: '   ' } };
    expect(contentProblems(broken, { production: false })).toEqual(['hero.lede is empty']);
  });

  test('flags the email placeholder only in production', () => {
    expect(contentProblems(site, { production: true })).toEqual([
      'contact.email is still the [EPOST] placeholder',
    ]);
  });
});
```

Run: `npx vitest run scripts/lib/content-check.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement the checker and the prebuild script**

`scripts/lib/content-check.mjs`:

```js
/**
 * Walks the content object and returns human-readable problems.
 * Empty strings are always a problem. The email placeholder is a problem
 * only when `production` is true, so local builds and e2e keep working
 * until the real address arrives.
 */
export function contentProblems(site, { production }) {
  const problems = [];
  const walk = (value, path) => {
    if (typeof value === 'string') {
      if (value.trim() === '') problems.push(`${path} is empty`);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${path}[${i}]`));
      return;
    }
    if (value && typeof value === 'object') {
      for (const [key, v] of Object.entries(value)) walk(v, path ? `${path}.${key}` : key);
    }
  };
  walk(site, '');
  if (production && site.contact.email.includes('[')) {
    problems.push('contact.email is still the [EPOST] placeholder');
  }
  return problems;
}
```

`scripts/check-content.mjs` (Node 24 strips types, so the `.ts` import works):

```js
import { site } from '../content/site.no.ts';
import { contentProblems } from './lib/content-check.mjs';

const production = process.env.VERCEL_ENV === 'production';
const problems = contentProblems(site, { production });
if (problems.length) {
  console.error('Content check failed:\n- ' + problems.join('\n- '));
  process.exit(1);
}
const note = site.contact.email.includes('[')
  ? ' (email placeholder still in place; a production deploy will refuse it)'
  : '';
console.log('content ok' + note);
```

Run: `npx vitest run scripts/lib/content-check.test.ts` → `3 passed`. Run: `node scripts/check-content.mjs` → `content ok (...)`. If Node reports `ERR_UNKNOWN_FILE_EXTENSION`, change the script to `node --experimental-strip-types scripts/check-content.mjs` in `package.json`.

- [ ] **Step 4: Tokens**

`app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-navy: #2a394b;
  --color-crimson: #ab5263;
  --color-night: #0e1620;
  --color-film-black: #0b1118;
  --color-ink-soft: #4b586a;
  --color-muted: #8a94a3;
  --color-hairline: #e3e7ec;
  --font-sans: var(--font-geist), "Segoe UI", system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), "Cascadia Mono", Consolas, monospace;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}

:root {
  --header-h: 72px;
  --margin: 80px;
}

@media (max-width: 767px) {
  :root {
    --margin: 24px;
  }
}

html {
  background: #ffffff;
  color: var(--color-navy);
}

body {
  margin: 0;
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

:focus-visible {
  outline: 2px solid var(--color-crimson);
  outline-offset: 3px;
}
```

- [ ] **Step 5: Root layout**

`app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { site } from '@/content/site.no';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: site.meta.title,
  description: site.meta.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.lang} className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <link rel="preload" as="image" href="/media/iqra-poster.jpg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Stub page, delete template assets, verify**

`app/page.tsx` (temporary; Tasks 5–8 replace it):

```tsx
import { site } from '@/content/site.no';

export default function Page() {
  return (
    <main>
      <h1>{site.hero.h1Lines.join(' ')}.</h1>
    </main>
  );
}
```

```bash
git rm -q public/next.svg public/vercel.svg public/file.svg public/globe.svg public/window.svg
npm run build
```

Expected: `content ok ...` then a successful build with route `/`.

- [ ] **Step 7: Commit**

```bash
git add content/site.no.ts scripts/lib/content-check.mjs scripts/lib/content-check.test.ts scripts/check-content.mjs app/globals.css app/layout.tsx app/page.tsx
git commit -m "feat: content file, design tokens, root layout

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---
### Task 3: Media pipeline — loops, poster, still

Implements spec §6.4 and the budgets in §10.

**Files:**
- Create: `scripts/media.mjs`
- Generated and committed: `public/media/iqra-loop-1080.{mp4,webm}`, `public/media/iqra-loop-720.{mp4,webm}`, `public/media/iqra-poster.jpg`, `public/media/still-koran.{avif,webp}`

**Interfaces:**
- Produces the file names above; Task 4's `pickSource` and Task 6's `<video>` depend on them exactly.

- [ ] **Step 1: Write the script**

`scripts/media.mjs`:

```js
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import sharp from 'sharp';

const SRC = 'C:/Users/daodi/generations/hero-web-1080-upscaled';
const MASTER = `${SRC}/iqra-hero.mp4`;
const OUT = 'public/media';
mkdirSync(OUT, { recursive: true });
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
const kb = (f) => Math.round(statSync(f).size / 1024);

// 1. Loops: the montage only (0-4.3 s, before the logo fade), no audio.
function loop(scale, mp4, webm, crfMp4, crfWebm) {
  ff(['-i', MASTER, '-t', '4.3', '-an', '-vf', scale, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crfMp4),
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${OUT}/${mp4}`]);
  ff(['-i', MASTER, '-t', '4.3', '-an', '-vf', scale, '-c:v', 'libvpx-vp9', '-crf', String(crfWebm), '-b:v', '0',
    '-row-mt', '1', `${OUT}/${webm}`]);
}
loop('scale=1920:1080', 'iqra-loop-1080.mp4', 'iqra-loop-1080.webm', 23, 33);
loop('scale=1280:720', 'iqra-loop-720.mp4', 'iqra-loop-720.webm', 24, 35);

// 2. Poster: frame 0 of the film, already exported next to the master.
copyFileSync(`${SRC}/iqra-hero-poster.jpg`, `${OUT}/iqra-poster.jpg`);

// 3. The Quran still (the film cuts to it at 2.3 s and away at 3.3 s).
const png = `${OUT}/still-koran.png`;
ff(['-ss', '2.80', '-i', MASTER, '-frames:v', '1', png]);
await sharp(png).avif({ quality: 50 }).toFile(`${OUT}/still-koran.avif`);
await sharp(png).webp({ quality: 80 }).toFile(`${OUT}/still-koran.webp`);
unlinkSync(png);

for (const f of ['iqra-loop-1080.mp4', 'iqra-loop-1080.webm', 'iqra-loop-720.mp4', 'iqra-loop-720.webm',
  'iqra-poster.jpg', 'still-koran.avif', 'still-koran.webp']) {
  console.log(`${f.padEnd(22)} ${kb(`${OUT}/${f}`)} KB`);
}
```

- [ ] **Step 2: Run it and check the budget**

Run: `npm run media`
Expected: seven size lines. Budget: `iqra-loop-1080.mp4` ≤ 3072 KB, `.webm` ≤ 1638 KB; `iqra-loop-720.mp4` ≤ 1229 KB, `.webm` ≤ 819 KB; `iqra-poster.jpg` ≤ 160 KB; `still-koran.avif` ≤ 150 KB, `.webp` ≤ 220 KB. If a loop is over, raise its crf by 2 and rerun; if the AVIF is over, set `quality: 42`.

- [ ] **Step 3: Look once**

Open `public/media/still-koran.webp` with the Read tool: the open Quran on its stand by candlelight, sharp, no cut smear. Then check the loop's last frame is still the Haram (not the logo card):

```bash
ffmpeg -v error -y -sseof -0.1 -i public/media/iqra-loop-1080.mp4 -frames:v 1 -update 1 scripts/.frames/last.jpg
```

(create `scripts/.frames/` first; it is git-ignored). Open `scripts/.frames/last.jpg`: the aerial night view of Masjid al-Haram with no logo on it. If the logo shows, shorten `-t` to `4.2` in both `loop` calls and rerun.

- [ ] **Step 4: Commit**

```bash
git add scripts/media.mjs public/media
git commit -m "feat: montage loops, poster and the Quran still

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Pure logic — source picking, mask origin, GSAP module

Implements spec §6.3, §6.4 (`pickSource`), §3 (motion vocabulary).

**Files:**
- Create: `lib/media.ts`, `lib/media.test.ts`, `components/hero/maskOrigin.ts`, `components/hero/maskOrigin.test.ts`, `lib/gsap.ts`

**Interfaces:**
- Produces: `pickSource({ narrow, webm }): string`.
- Produces: `maskOrigin({ start, end, bbY, bbHeight }): string` — a GSAP `svgOrigin` value in viewBox units.
- Produces from `@/lib/gsap`: `gsap`, `ScrollTrigger`, `useGSAP`, `EASE = { out: 'expo.out', inOut: 'power2.inOut', none: 'none', in2: 'power2.in', in1: 'power1.inOut' }`, `DUR = { s: 0.3, m: 0.6, l: 0.7 }`, `reducedMotion(): boolean`.

- [ ] **Step 1: Failing tests**

`lib/media.test.ts`:

```ts
import { expect, test } from 'vitest';
import { pickSource } from './media';

test.each([
  [false, true, '/media/iqra-loop-1080.webm'],
  [false, false, '/media/iqra-loop-1080.mp4'],
  [true, true, '/media/iqra-loop-720.webm'],
  [true, false, '/media/iqra-loop-720.mp4'],
])('narrow=%s webm=%s -> %s', (narrow, webm, expected) => {
  expect(pickSource({ narrow, webm })).toBe(expected);
});
```

`components/hero/maskOrigin.test.ts`:

```ts
import { expect, test } from 'vitest';
import { maskOrigin } from './maskOrigin';

test('origin is the centre of the first glyph box at the word middle', () => {
  expect(maskOrigin({ start: 170, end: 250, bbY: 180, bbHeight: 220 })).toBe('210 290');
});

test('fractional measurements are kept, not rounded', () => {
  expect(maskOrigin({ start: 170.5, end: 250.5, bbY: 100, bbHeight: 50 })).toBe('210.5 125');
});

test('a zero-width glyph box still yields its own x', () => {
  expect(maskOrigin({ start: 40, end: 40, bbY: 0, bbHeight: 10 })).toBe('40 5');
});
```

Run: `npx vitest run lib/media.test.ts components/hero/maskOrigin.test.ts` → FAIL (modules missing).

- [ ] **Step 2: Implement**

`lib/media.ts`:

```ts
/** Phones get 720p; WebM (VP9) is preferred wherever it plays. */
export function pickSource({ narrow, webm }: { narrow: boolean; webm: boolean }): string {
  return `/media/iqra-loop-${narrow ? 720 : 1080}.${webm ? 'webm' : 'mp4'}`;
}
```

`components/hero/maskOrigin.ts`:

```ts
export type GlyphMeasure = { start: number; end: number; bbY: number; bbHeight: number };

/**
 * Where the letters open from: the middle of the first glyph's advance box,
 * halfway up the word. That point is inside the I's stem, so the growing
 * mask never exposes a counter (spec 6.3). Returns a GSAP svgOrigin string.
 */
export function maskOrigin({ start, end, bbY, bbHeight }: GlyphMeasure): string {
  return `${(start + end) / 2} ${bbY + bbHeight / 2}`;
}
```

`lib/gsap.ts`:

```ts
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/** The site's whole motion vocabulary (spec section 3). */
export const EASE = { out: 'expo.out', inOut: 'power2.inOut', none: 'none', in2: 'power2.in', in1: 'power1.inOut' } as const;
export const DUR = { s: 0.3, m: 0.6, l: 0.7 } as const;

export function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export { gsap, ScrollTrigger, useGSAP };
```

Run: `npx vitest run lib/media.test.ts components/hero/maskOrigin.test.ts` → `7 passed`. Run: `npx tsc --noEmit` → no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/media.ts lib/media.test.ts components/hero/maskOrigin.ts components/hero/maskOrigin.test.ts lib/gsap.ts
git commit -m "feat: source picking, mask origin maths, gsap module

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---
### Task 5: Header with the wordmark, footer, page skeleton

Implements spec §5 (page composition), §9 (header, wordmark colour switch), §11 (names from content).

**Files:**
- Create: `components/Header.tsx`, `components/header.module.css`, `components/Header.test.tsx`, `lib/wordmark.ts`, `components/Footer.tsx`, `components/footer.module.css`, `components/Footer.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `site` (Task 2).
- Produces: `#site-wordmark` (an `<a>`; starts at opacity 0 unless reduced motion; Task 6 tweens its opacity); `setWordmarkOnDark(onDark: boolean): void` from `@/lib/wordmark` (Tasks 6–8 call it when the ground behind the header changes).

- [ ] **Step 1: Failing tests**

`components/Header.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Header } from './Header';
import { setWordmarkOnDark } from '@/lib/wordmark';

test('the header is one link: the wordmark, named for screen readers', () => {
  render(<Header />);
  const link = screen.getByRole('link', { name: 'Iqra Foundation, til toppen' });
  expect(link).toHaveAttribute('id', 'site-wordmark');
  expect(link).toHaveAttribute('href', '/');
  expect(link).toHaveTextContent('IQRA');
  expect(screen.queryAllByRole('link')).toHaveLength(1);
});

test('setWordmarkOnDark flips the data attribute the stylesheet reads', () => {
  render(<Header />);
  setWordmarkOnDark(true);
  expect(document.getElementById('site-wordmark')).toHaveAttribute('data-on-dark', 'true');
  setWordmarkOnDark(false);
  expect(document.getElementById('site-wordmark')).toHaveAttribute('data-on-dark', 'false');
});
```

`components/Footer.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Footer } from './Footer';

test('footer shows the year, the name and the email', () => {
  render(<Footer />);
  expect(screen.getByText(new RegExp(`${new Date().getFullYear()} Iqra Foundation`))).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '[EPOST]' })).toHaveAttribute('href', 'mailto:[EPOST]');
});
```

Run: `npx vitest run components/Header.test.tsx components/Footer.test.tsx` → FAIL (modules missing).

- [ ] **Step 2: Implement the wordmark helper and the header**

`lib/wordmark.ts`:

```ts
/** The header is fixed and transparent; whoever changes the ground behind it says so here. */
export function setWordmarkOnDark(onDark: boolean): void {
  document.getElementById('site-wordmark')?.setAttribute('data-on-dark', String(onDark));
}
```

`components/Header.tsx`:

```tsx
import { site } from '@/content/site.no';
import styles from './header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <a id="site-wordmark" href="/" className={styles.wordmark} aria-label={site.header.homeLabel} data-on-dark="false">
        {site.header.wordmark}
      </a>
    </header>
  );
}
```

`components/header.module.css`:

```css
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 60;
  height: var(--header-h);
  display: flex;
  align-items: center;
  padding: 0 var(--margin);
  pointer-events: none; /* only the wordmark is clickable; the film underneath stays reachable */
}

.wordmark {
  pointer-events: auto;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--color-navy);
  opacity: 0; /* the hero timeline brings it in once the letters have opened */
  transition: color 300ms var(--ease-out-expo);
}

.wordmark[data-on-dark="true"] {
  color: #ffffff;
}

@media (max-width: 767px) {
  .wordmark {
    font-size: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wordmark {
    opacity: 1;
  }
}
```

- [ ] **Step 3: Implement the footer**

`components/Footer.tsx`:

```tsx
import { site } from '@/content/site.no';
import styles from './footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span>© {new Date().getFullYear()} {site.name}</span>
      <a className={styles.link} href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
    </footer>
  );
}
```

`components/footer.module.css`:

```css
.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 40px var(--margin);
  border-top: 1px solid var(--color-hairline);
  font: 500 12px/1 var(--font-mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.link {
  color: inherit;
  text-decoration: none;
  transition: color 300ms var(--ease-out-expo);
}

.link:hover {
  color: var(--color-crimson);
}

@media (max-width: 767px) {
  .footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

Run: `npx vitest run components/Header.test.tsx components/Footer.test.tsx` → `3 passed`.

- [ ] **Step 4: Page skeleton**

`app/page.tsx`:

```tsx
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { site } from '@/content/site.no';

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <h1 style={{ padding: '120px var(--margin)' }}>{site.hero.h1Lines.join(' ')}.</h1>
      </main>
      <Footer />
    </>
  );
}
```

Run `npm run build` → builds. Run `npm run dev`, open `http://localhost:3000`: the wordmark is invisible (opacity 0 — correct at this stage), the footer shows `© 2026 Iqra Foundation` and `[EPOST]`. In DevTools emulate reduced motion: the wordmark «IQRA» appears top-left in navy. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add components/Header.tsx components/header.module.css components/Header.test.tsx lib/wordmark.ts components/Footer.tsx components/footer.module.css components/Footer.test.tsx app/page.tsx
git commit -m "feat: fixed header with the wordmark, footer, page skeleton

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---
### Task 6: The hero — the film through the letters

Implements spec §6 (all of it), §9 (wordmark on dark), §11 (decorative media, copy in the DOM), §12 (autoplay, fonts, resize).

**Files:**
- Create: `components/hero/Hero.tsx`, `components/hero/hero.module.css`, `components/hero/Hero.test.tsx`
- Modify: `app/page.tsx`
- Reference: `docs/superpowers/specs/prototype/app.js` (the `B.init` hero timeline) and `styles.css` (`.b-pin`, `.b-mask`, `.b-copy`, `.b-hint`) — the behaviour to port.

**Interfaces:**
- Consumes: `site`, `pickSource`, `maskOrigin`, `gsap`/`ScrollTrigger`/`useGSAP`/`EASE`/`reducedMotion` (Task 4), `#site-wordmark` and `setWordmarkOnDark` (Task 5), the media files (Task 3).
- Produces: `<Hero />`; DOM hooks for e2e: `#hero`, `#hero-word`, `[data-mask]`, `[data-copy]`, `[data-hint]`, `video.film` (class from the module — e2e uses `#hero video`).

- [ ] **Step 1: Failing tests**

`components/hero/Hero.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { Hero } from './Hero';

beforeEach(() => {
  document.body.innerHTML = '<a id="site-wordmark" data-on-dark="false"></a>';
  vi.mocked(HTMLMediaElement.prototype.play).mockClear();
});

test('the letters, the headline and the lede come from the content file', () => {
  render(<Hero />);
  expect(document.getElementById('hero-word')?.textContent).toBe('IQRA');
  const h1 = screen.getByRole('heading', { level: 1 });
  expect(h1.textContent).toBe('Iqra betyrles.');
  expect(screen.getByText(/første ordet i Koranen/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Still et spørsmål' })).toHaveAttribute('href', 'mailto:[EPOST]');
});

test('the video is decorative, looped, muted, and gets the webm loop at desktop width', () => {
  render(<Hero />);
  const video = document.querySelector('#hero video') as HTMLVideoElement;
  expect(video).toHaveAttribute('aria-hidden', 'true');
  expect(video).toHaveAttribute('loop');
  expect(video).toHaveAttribute('poster', '/media/iqra-poster.jpg');
  expect(video.src).toMatch(/\/media\/iqra-loop-1080\.webm$/);
  expect(video.muted).toBe(true);
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
});

test('the mask covers far beyond the viewbox so the overlay never shows an edge', () => {
  render(<Hero />);
  const rects = document.querySelectorAll('#hero svg rect');
  expect(rects).toHaveLength(2);
  rects.forEach((r) => {
    expect(Number(r.getAttribute('width'))).toBeGreaterThan(20000);
    expect(Number(r.getAttribute('x'))).toBeLessThan(-10000);
  });
});
```

Run: `npx vitest run components/hero/Hero.test.tsx` → FAIL (module missing).

- [ ] **Step 2: The component**

`components/hero/Hero.tsx`:

```tsx
'use client';

import { useRef } from 'react';
import { site } from '@/content/site.no';
import { EASE, gsap, reducedMotion, useGSAP } from '@/lib/gsap';
import { pickSource } from '@/lib/media';
import { setWordmarkOnDark } from '@/lib/wordmark';
import { maskOrigin } from './maskOrigin';
import styles from './hero.module.css';

/** Fallback origin (viewBox units) when text metrics are unavailable, e.g. in jsdom. */
const FALLBACK_ORIGIN = '210 318';

function measureOrigin(word: SVGTextElement): string {
  try {
    const bb = word.getBBox();
    return maskOrigin({
      start: word.getStartPositionOfChar(0).x,
      end: word.getEndPositionOfChar(0).x,
      bbY: bb.y,
      bbHeight: bb.height,
    });
  } catch {
    return FALLBACK_ORIGIN;
  }
}

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wordRef = useRef<SVGTextElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      const video = videoRef.current;
      const word = wordRef.current;
      if (!section || !video || !word) return;

      // Media: pick the loop after hydration, never before (spec 6.4).
      video.src = pickSource({
        narrow: window.matchMedia('(max-width: 767px)').matches,
        webm: video.canPlayType('video/webm; codecs="vp9"') !== '',
      });
      video.muted = true;
      setWordmarkOnDark(false);

      if (reducedMotion()) return; // poster inside the closed letters; copy shown by CSS (spec 6.5)

      video.load();
      Promise.resolve(video.play()).catch(() => {}); // autoplay refused: the poster stays, nothing else changes

      const q = gsap.utils.selector(section);
      let cancelled = false;
      document.fonts.ready.then(() => {
        if (cancelled) return;
        const origin = measureOrigin(word);
        // On arrival the film fades up inside the letters, slightly zoomed.
        gsap.fromTo(video, { opacity: 0, scale: 1.18 }, { opacity: 1, scale: 1.12, duration: 1.6, ease: 'power2.out' });
        // Spec 6.2: letters grow as windows, then rush open; the last slivers dissolve.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=300%',
            pin: true,
            scrub: 0.5,
            onUpdate: (self) => setWordmarkOnDark(self.progress > 0.6),
          },
        });
        tl.to(word, { scale: 7, svgOrigin: origin, ease: EASE.none, duration: 0.55 }, 0)
          .to(word, { scale: 14, svgOrigin: origin, ease: EASE.in2, duration: 0.25 }, 0.55)
          .to(q('[data-mask]'), { opacity: 0, ease: EASE.inOut, duration: 0.16 }, 0.64)
          .to(video, { scale: 1, ease: EASE.in1, duration: 0.5 }, 0.4)
          .to(q('[data-hint]'), { opacity: 0, duration: 0.08 }, 0)
          .to(q('[data-scrim]'), { opacity: 1, duration: 0.2 }, 0.72)
          .fromTo(q('[data-copy]'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.2, ease: EASE.out }, 0.82)
          .to('#site-wordmark', { opacity: 1, duration: 0.2 }, 0.7)
          .to({}, { duration: 0.16 });
      });
      return () => {
        cancelled = true;
      };
    },
    { scope: root },
  );

  const last = site.hero.h1Lines.length - 1;
  return (
    <section ref={root} id="hero" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.stage}>
        <video ref={videoRef} className={styles.film} poster="/media/iqra-poster.jpg" preload="metadata" muted loop playsInline aria-hidden="true" />
        <svg className={styles.mask} data-mask viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <mask id="hero-letters">
              <rect x="-20000" y="-20000" width="41000" height="41000" fill="#fff" />
              <text
                ref={wordRef}
                id="hero-word"
                x="500"
                y="318"
                textAnchor="middle"
                dominantBaseline="middle"
                fontWeight="800"
                fontSize="290"
                letterSpacing="-18"
                fill="#000"
                style={{ fontFamily: 'var(--font-geist), "Segoe UI", system-ui, sans-serif' }}
              >
                {site.hero.word}
              </text>
            </mask>
          </defs>
          <rect x="-20000" y="-20000" width="41000" height="41000" fill="#ffffff" mask="url(#hero-letters)" />
        </svg>
        <div className={styles.scrim} data-scrim aria-hidden="true" />
        <p className={styles.hint} data-hint aria-hidden="true">{site.hero.hint}</p>
      </div>
      <div className={styles.copy} data-copy>
        <h1 id="hero-title" className={styles.h1}>
          {site.hero.h1Lines.map((line, i) => (
            <span key={line} className={styles.line}>
              {line}
              {i === last && <span className={styles.dot}>.</span>}
            </span>
          ))}
        </h1>
        <p className={styles.lede}>{site.hero.lede}</p>
        <a className={styles.cta} href={`mailto:${site.contact.email}`}>{site.hero.cta}</a>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: The styles**

`components/hero/hero.module.css`:

```css
.hero {
  position: relative;
  height: 100svh;
  overflow: hidden;
  background: var(--color-film-black);
}

.stage {
  position: absolute;
  inset: 0;
}

.film {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mask {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(11, 17, 24, 0) 40%, rgba(11, 17, 24, 0.82) 100%);
  opacity: 0;
}

.hint {
  position: absolute;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  margin: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.copy {
  position: absolute;
  left: var(--margin);
  right: var(--margin);
  bottom: 96px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  align-items: flex-start;
  color: #ffffff;
  opacity: 0; /* the timeline brings it in over the full film; it is in the DOM from the start */
}

.h1 {
  margin: 0;
  font-size: 120px;
  line-height: 0.94;
  font-weight: 600;
  letter-spacing: -0.045em;
}

.line {
  display: block;
}

.dot {
  color: var(--color-crimson);
}

.lede {
  margin: 0;
  font-size: 21px;
  line-height: 1.5;
  max-width: 480px;
  color: rgba(255, 255, 255, 0.82);
  text-wrap: pretty;
}

.cta {
  display: inline-flex;
  align-items: center;
  height: 52px;
  padding: 0 26px;
  border-radius: 999px;
  background: #ffffff;
  color: var(--color-navy);
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
}

@media (max-width: 767px) {
  .copy {
    bottom: 64px;
  }

  .h1 {
    font-size: 60px;
  }

  .lede {
    font-size: 17px;
  }

  .cta {
    width: 100%;
    justify-content: center;
  }
}

/* Reduced motion: the poster sits inside the closed letters; the copy follows
   in normal flow on white (spec 6.5). */
@media (prefers-reduced-motion: reduce) {
  .hero {
    height: auto;
    background: #ffffff;
  }

  .stage {
    position: relative;
    height: 100svh;
    background: var(--color-film-black);
  }

  .hint {
    display: none;
  }

  .copy {
    position: static;
    opacity: 1;
    color: var(--color-navy);
    padding: 48px 0 72px;
    margin: 0 var(--margin);
  }

  .lede {
    color: var(--color-ink-soft);
  }

  .cta {
    background: var(--color-navy);
    color: #ffffff;
  }
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run components/hero/Hero.test.tsx` → `3 passed`. (jsdom has no SVG text metrics; `measureOrigin` falls back, which is the tested path. The real origin is checked in the browser in Step 6.)

- [ ] **Step 5: Wire the page**

`app/page.tsx`:

```tsx
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Hero } from '@/components/hero/Hero';

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Hero />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 6: Look, against the prototype**

Run `npm run dev`, open `http://localhost:3000` at ~1440 wide with the prototype (`https://claude.ai/code/artifact/666ad202-2bf8-4f5a-802e-d842d43cb6f6`, tab B) beside it. Check:
1. The film plays inside the letters IQRA on white; «BLA NEDOVER» at the bottom; no wordmark yet.
2. Scrolling: the letters grow steadily as windows (film visible through them), then rush open, the white dissolves, the film fills the screen, the scrim darkens the bottom, «Iqra betyr / les.» with the crimson full stop, the lede and the white CTA arrive; the wordmark IQRA is now white top-left.
3. Scroll back up: everything reverses; the wordmark turns navy and fades again.
4. Narrow the window below 768 px and reload: the letters fit the width, the same opening works, the CTA is full width; in DevTools › Network the source is `iqra-loop-720.webm`.
5. Emulate reduced motion and reload: no pin; the poster inside the letters; the copy below on white; the wordmark visible in navy.
If mid-opening a big white shape with a curved edge dominates, the origin is wrong: log `measureOrigin(word)` — it must be inside the I (x ≈ 205–215 in viewBox units at 290 px font size).

- [ ] **Step 7: Commit**

```bash
git add components/hero/Hero.tsx components/hero/hero.module.css components/hero/Hero.test.tsx app/page.tsx
git commit -m "feat: the film through the letters, opening with the scroll

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---
### Task 7: Visjon — the lines and the tree

Implements spec §7 (all of it), §9 (wordmark back to navy), §11 (the tree's names in the DOM), §12 (no 2D context, resize).

**Files:**
- Create: `components/vision/tree.ts`, `components/vision/tree.test.ts`, `components/vision/Tree.tsx`, `components/vision/Vision.tsx`, `components/vision/vision.module.css`, `components/vision/Vision.test.tsx`
- Modify: `app/page.tsx`
- Reference: `docs/superpowers/specs/prototype/app.js` — `buildVisionTree` (from the line `function buildVisionTree(stage) {` to its closing `}`) is the behaviour to port; `styles.css` `.b-vision*`, `.b-kin*`, `.b-tree`, `.tree-label`, `.tree-root-label` are the styles.

**Interfaces:**
- Consumes: `site`, `gsap`/`ScrollTrigger`/`useGSAP`/`EASE`/`reducedMotion` (Task 4), `setWordmarkOnDark` (Task 5).
- Produces from `@/components/vision/tree`: `generate(): TreeModel`, `fit(model, box): FittedTree`, `createVisionTree(stage, canvas, opts): TreeHandle | null` with `TreeHandle = { setT(v: number): void; destroy(): void }`; `GROW = 3.8`.
- Produces: `<Vision />` with `#visjon`; DOM hooks for e2e: `[data-line]`, `[data-tree]`, `[data-limb]`, `[data-root]`, `#visjon canvas`.

- [ ] **Step 1: Failing tests for the model**

`components/vision/tree.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { fit, generate } from './tree';

describe('generate', () => {
  const model = generate();

  test('the trunk splits into exactly three limbs', () => {
    expect(model.segs.filter((s) => s.depth === 1)).toHaveLength(3);
    expect(model.segs[0].depth).toBe(0);
    expect(model.segs[0].parent).toBe(-1);
  });

  test('the canopy is full and balanced', () => {
    expect(model.tips.length).toBeGreaterThanOrEqual(30);
    expect(model.tips.length).toBeLessThanOrEqual(64);
    let minX = 0, maxX = 0;
    model.segs.forEach((s) => { minX = Math.min(minX, s.x1); maxX = Math.max(maxX, s.x1); });
    expect(Math.abs(minX + maxX) / (maxX - minX)).toBeLessThan(0.12);
  });

  test('the same seed gives the same tree', () => {
    const again = generate();
    expect(again.seed).toBe(model.seed);
    expect(again.segs.map((s) => s.x1)).toEqual(model.segs.map((s) => s.x1));
  });

  test('roots spread below the ground', () => {
    expect(model.rootSegs.length).toBeGreaterThan(4);
    model.rootSegs.forEach((s) => expect(s.y1).toBeGreaterThan(0));
  });
});

describe('fit', () => {
  const box = { W: 560, H: 700 };
  const fitted = fit(generate(), box);

  test('limb names are ordered left to right and sit inside the box', () => {
    expect(fitted.limbs).toHaveLength(3);
    expect(fitted.limbs[0].x).toBeLessThan(fitted.limbs[1].x);
    expect(fitted.limbs[1].x).toBeLessThan(fitted.limbs[2].x);
    fitted.limbs.forEach((l) => {
      expect(l.x).toBeGreaterThanOrEqual(40);
      expect(l.x).toBeLessThanOrEqual(box.W - 40);
      expect(l.y).toBeGreaterThanOrEqual(14);
      expect(l.y).toBeLessThanOrEqual(fitted.GY - 14);
    });
  });

  test('the canopy stays inside the box and the trunk ends at the ground line', () => {
    fitted.segs.forEach((s) => {
      expect(s.Y1).toBeGreaterThanOrEqual(fitted.TOPY - 1);
      expect(s.X1).toBeGreaterThanOrEqual(0);
      expect(s.X1).toBeLessThanOrEqual(box.W);
    });
    expect(fitted.segs[0].Y0).toBeCloseTo(fitted.GY, 5);
  });

  test('names arrive before growth is complete', () => {
    fitted.limbs.forEach((l) => expect(l.birth).toBeLessThan(3.0));
    expect(fitted.rootBirth).toBe(1.0);
  });
});
```

Run: `npx vitest run components/vision/tree.test.ts` → FAIL (module missing).

- [ ] **Step 2: The tree module**

`components/vision/tree.ts` — a TypeScript port of the prototype's `buildVisionTree`, split into a pure model (`generate`, `fit`) and a renderer (`createVisionTree`). Behaviour, numbers and drawing order are those of the prototype; read it side by side.

```ts
/** Growth time at the end of the Visjon pin; the tree is complete around 3.3. */
export const GROW = 3.8;

const MAXD = 4;
const NAVY = '42,57,75';
const TWIG = 'rgb(84,98,116)';
const ROOT = 'rgb(74,90,110)';
const GOLD = '201,154,63';
const CRIMSON = '171,82,99';

export type Seg = {
  x0: number; y0: number; cx: number; cy: number; x1: number; y1: number;
  depth: number; parent: number; ph: number; id: number;
};
export type FittedSeg = Seg & { X0: number; Y0: number; CX: number; CY: number; X1: number; Y1: number; birth: number };
export type Light = { seg: FittedSeg; R: number; ph: number; birth: number; sx: number; sy: number };
export type TreeModel = { seed: number; segs: Seg[]; tips: Seg[]; rootSegs: Seg[]; lightR: number[] };
export type FittedTree = {
  W: number; H: number; GY: number; TOPY: number; K: number;
  segs: FittedSeg[]; rootSegs: FittedSeg[]; lights: Light[];
  limbs: { x: number; y: number; birth: number }[]; rootBirth: number;
};
export type TreeHandle = { setT(v: number): void; destroy(): void };
export type TreeOptions = { reduced: boolean; limbLabels: HTMLElement[]; rootLabel: HTMLElement | null };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const makeRnd = (seed: number) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };

/** Seeded growth: exactly three limbs off the trunk, then twigs to depth 4; roots below. */
export function generate(): TreeModel {
  let segs: Seg[] = [], tips: Seg[] = [], lightR: number[] = [], seedUsed = 0;
  for (let seed = 9; seed < 400; seed++) {
    const rnd = makeRnd(seed);
    segs = []; tips = [];
    (function branch(x: number, y: number, ang: number, len: number, depth: number, parent: number) {
      ang = lerp(ang, -Math.PI / 2, depth === 0 ? 0 : 0.12);
      const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len;
      const perp = ang + Math.PI / 2, bow = (rnd() - 0.5) * len * (depth === 0 ? 0.12 : 0.5);
      const cx = (x + x1) / 2 + Math.cos(perp) * bow, cy = (y + y1) / 2 + Math.sin(perp) * bow;
      const id = segs.length;
      segs.push({ x0: x, y0: y, cx, cy, x1, y1, depth, parent, ph: rnd() * 6.283, id });
      if (depth >= MAXD) { tips.push(segs[id]); return; }
      const n = depth === 0 ? 3 : rnd() < 0.55 ? 2 : 3;
      const spread = [1.15, 0.7, 0.62, 0.54][depth] || 0.5;
      for (let k = 0; k < n; k++) {
        const off = (k - (n - 1) / 2) * spread + (rnd() - 0.5) * 0.2;
        branch(x1, y1, ang + off, len * (depth === 0 ? 0.78 : 0.62 + rnd() * 0.14), depth + 1, id);
      }
    })(0, 0, -Math.PI / 2, 1, 0, -1);
    let minX = 0, maxX = 0;
    segs.forEach((s) => { minX = Math.min(minX, s.x1); maxX = Math.max(maxX, s.x1); });
    const balance = Math.abs(minX + maxX) / (maxX - minX);
    const limbs = segs.filter((s) => s.depth === 1);
    const limbsApart = limbs.length === 3 && Math.abs(limbs[0].x1 - limbs[2].x1) > 0.9;
    if (tips.length >= 30 && tips.length <= 64 && balance < 0.12 && limbsApart) {
      const rl = makeRnd(seed + 100);
      lightR = tips.map(() => 2.2 + rl() * 2.2);
      seedUsed = seed;
      break;
    }
  }
  const rr = makeRnd(31);
  const rootSegs: Seg[] = [];
  (function root(x: number, y: number, ang: number, len: number, depth: number) {
    const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len;
    const perp = ang + Math.PI / 2, bow = (rr() - 0.5) * len * 0.5;
    const cx = (x + x1) / 2 + Math.cos(perp) * bow, cy = (y + y1) / 2 + Math.sin(perp) * bow;
    rootSegs.push({ x0: x, y0: y, cx, cy, x1, y1, depth, parent: -1, ph: 0, id: rootSegs.length });
    if (depth >= 2) return;
    const n = depth === 0 ? 4 : 2;
    for (let k = 0; k < n; k++) {
      const off = (k - (n - 1) / 2) * 1.0 + (rr() - 0.5) * 0.3;
      root(x1, y1, ang + off * 0.7, len * 0.6, depth + 1);
    }
  })(0, 0, Math.PI / 2, 0.3, 0);
  return { seed: seedUsed, segs, tips, rootSegs, lightR };
}

/** Map the model into a box, assign births, and place the names. */
export function fit(model: TreeModel, box: { W: number; H: number }): FittedTree {
  const { W, H } = box;
  const K = clamp(H / 640, 0.5, 1.4);
  const GY = H * 0.74, TOPY = H * 0.06;
  let minY = 0, minX = 0, maxX = 0;
  model.segs.forEach((s) => { minY = Math.min(minY, s.y1); minX = Math.min(minX, s.x1); maxX = Math.max(maxX, s.x1); });
  const ky = (GY - TOPY) / (-minY || 1);
  const kx = Math.min(ky, (W * 0.9) / Math.max(0.0001, maxX - minX));
  const midX = (minX + maxX) / 2;
  const mapX = (v: number) => W * 0.5 + (v - midX * 0.7) * kx;
  const mapY = (v: number) => GY + v * ky;
  const segs: FittedSeg[] = model.segs.map((s) => ({
    ...s, X0: mapX(s.x0), Y0: mapY(s.y0), CX: mapX(s.cx), CY: mapY(s.cy), X1: mapX(s.x1), Y1: mapY(s.y1),
    birth: 0.3 + s.depth * 0.5 + (s.ph % 1) * 0.24,
  }));
  const rk = (H - GY - 40 * K) / 0.42;
  const rootSegs: FittedSeg[] = model.rootSegs.map((s) => ({
    ...s, X0: W * 0.5 + s.x0 * rk * 1.6, Y0: GY + s.y0 * rk, CX: W * 0.5 + s.cx * rk * 1.6, CY: GY + s.cy * rk,
    X1: W * 0.5 + s.x1 * rk * 1.6, Y1: GY + s.y1 * rk, birth: 0.25 + s.depth * 0.35,
  }));
  const byId = new Map(segs.map((s) => [s.id, s]));
  const lights: Light[] = model.tips.map((t, i) => {
    const seg = byId.get(t.id)!;
    return { seg, R: model.lightR[i] * K, ph: seg.ph, birth: seg.birth + 0.62 + i * 0.01, sx: 0, sy: 0 };
  });
  const trunk = segs[0];
  const limbOf = (s: FittedSeg): FittedSeg => { while (s.depth > 1) s = byId.get(s.parent)!; return s; };
  const limbs = segs.filter((s) => s.depth === 1).sort((a, b) => a.X1 - b.X1).map((limb) => {
    const dx = limb.X1 - trunk.X1, dy = limb.Y1 - trunk.Y1, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    let best: Light | null = null, bp = -Infinity;
    for (const L of lights) if (limbOf(L.seg) === limb) {
      const p = (L.seg.X1 - trunk.X1) * ux + (L.seg.Y1 - trunk.Y1) * uy;
      if (p > bp) { bp = p; best = L; }
    }
    const tip = best ? best.seg : limb;
    return {
      x: clamp(tip.X1 + ux * 34 * K, 40, W - 40),
      y: clamp(tip.Y1 + uy * 28 * K - 6 * K, 14, GY - 14),
      birth: limb.birth + 1.3,
    };
  });
  return { W, H, GY, TOPY, K, segs, rootSegs, lights, limbs, rootBirth: 1.0 };
}

/** Mount the renderer on a canvas inside `stage`; returns null when there is no 2D context. */
export function createVisionTree(stage: HTMLElement, canvas: HTMLCanvasElement, opts: TreeOptions): TreeHandle | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const model = generate();
  let tree = fit(model, { W: 1, H: 1 });
  let T = 0, raf = 0, visible = true;
  const leaves = Array.from({ length: 10 }, () => ({ live: false, x: 0, y: 0, vy: 0, ph: 0, life: 0, span: 0, s: 0 }));
  const widths = () => [30, 14, 7, 3.4, 1.8].map((w) => w * tree.K);
  const rootWidths = () => [18, 9, 4.5].map((w) => w * tree.K);

  function size() {
    const W = stage.clientWidth, H = stage.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR; ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
    tree = fit(model, { W, H });
    tree.limbs.forEach((l, i) => { const el = opts.limbLabels[i]; if (el) { el.style.left = l.x + 'px'; el.style.top = l.y + 'px'; } });
    if (opts.rootLabel) opts.rootLabel.style.top = H - 6 + 'px';
  }

  const windX = (y: number, ph: number, t: number) => {
    if (opts.reduced) return 0;
    const hn = clamp((tree.GY - y) / (tree.GY - tree.TOPY), 0, 1);
    return Math.sin(t * 0.75 + y * 0.004 + ph) * 5 * tree.K * Math.pow(hn, 1.8);
  };
  const quad = (s: FittedSeg, u: number): [number, number] => {
    const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
    return [a * s.X0 + b * s.CX + c * s.X1, a * s.Y0 + b * s.CY + c * s.Y1];
  };

  function drawSeg(s: FittedSeg, t: number, isRoot: boolean) {
    const p = clamp((T - s.birth) / 0.6, 0, 1);
    if (p <= 0) return;
    const ws = isRoot ? rootWidths() : widths();
    const w0 = ws[s.depth] || 1, w1 = ws[s.depth + 1] || w0 * 0.55;
    ctx!.strokeStyle = isRoot ? ROOT : s.depth >= 3 ? TWIG : `rgb(${NAVY})`;
    ctx!.lineCap = 'round';
    let [px, py] = quad(s, 0);
    if (!isRoot) px += windX(py, s.ph, t);
    const steps = 8;
    for (let k = 1; k <= steps; k++) {
      const u = (k / steps) * p;
      let [x, y] = quad(s, u);
      if (!isRoot) x += windX(y, s.ph, t);
      ctx!.lineWidth = lerp(w0, w1, u);
      ctx!.beginPath(); ctx!.moveTo(px, py); ctx!.lineTo(x, y); ctx!.stroke();
      px = x; py = y;
    }
  }

  function draw(t: number) {
    const { W, H, GY, K, lights } = tree;
    ctx!.clearRect(0, 0, W, H);
    const gl = ctx!.createLinearGradient(0, 0, W, 0);
    gl.addColorStop(0, `rgba(${NAVY},0)`); gl.addColorStop(0.5, `rgba(${NAVY},0.35)`); gl.addColorStop(1, `rgba(${NAVY},0)`);
    ctx!.strokeStyle = gl; ctx!.lineWidth = 1; ctx!.beginPath(); ctx!.moveTo(0, GY); ctx!.lineTo(W, GY); ctx!.stroke();
    for (const s of tree.rootSegs) drawSeg(s, t, true);
    for (const s of tree.segs) drawSeg(s, t, false);

    // the seed wakes with a halo, then is absorbed as the trunk takes over
    const sp = clamp(T / 0.3, 0, 1);
    const seedAlpha = sp * (1 - clamp((T - 0.35) / 0.6, 0, 1));
    if (seedAlpha > 0) {
      const halo = clamp(1 - (T - 0.3) / 0.9, 0, 1) * 0.35;
      if (halo > 0) {
        const g = ctx!.createRadialGradient(W * 0.5, GY, 0, W * 0.5, GY, 60 * K);
        g.addColorStop(0, `rgba(${CRIMSON},${halo})`); g.addColorStop(1, `rgba(${CRIMSON},0)`);
        ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(W * 0.5, GY, 60 * K, 0, 6.2832); ctx!.fill();
      }
      ctx!.fillStyle = `rgba(${CRIMSON},${seedAlpha})`; ctx!.beginPath(); ctx!.arc(W * 0.5, GY, 7 * K * sp, 0, 6.2832); ctx!.fill();
    }

    for (const L of lights) {
      const la = clamp((T - L.birth) / 0.5, 0, 1);
      if (la <= 0) continue;
      L.sx = L.seg.X1 + windX(L.seg.Y1, L.seg.ph, t); L.sy = L.seg.Y1;
      const tw = opts.reduced ? 0.85 : 0.75 + 0.25 * Math.sin(L.ph + t * (0.7 + (L.ph % 0.9)));
      const g = ctx!.createRadialGradient(L.sx, L.sy, 0, L.sx, L.sy, L.R * 4);
      g.addColorStop(0, `rgba(${GOLD},${0.28 * tw * la})`); g.addColorStop(1, `rgba(${GOLD},0)`);
      ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(L.sx, L.sy, L.R * 4, 0, 6.2832); ctx!.fill();
      ctx!.fillStyle = `rgba(${GOLD},${(0.75 + 0.25 * tw) * la})`;
      ctx!.beginPath(); ctx!.arc(L.sx, L.sy, L.R * la, 0, 6.2832); ctx!.fill();
    }

    tree.limbs.forEach((l, i) => { const el = opts.limbLabels[i]; if (el) el.style.opacity = String(clamp((T - l.birth) / 0.5, 0, 1)); });
    if (opts.rootLabel) opts.rootLabel.style.opacity = String(clamp((T - tree.rootBirth) / 0.5, 0, 1));

    if (!opts.reduced && T > 3) for (const lf of leaves) {
      if (!lf.live) {
        if (Math.random() < 0.006 && lights.length) {
          const src = lights[(Math.random() * lights.length) | 0];
          lf.live = true; lf.x = src.sx; lf.y = src.sy; lf.vy = 14 + Math.random() * 12; lf.ph = Math.random() * 6.283;
          lf.life = 0; lf.span = 4 + Math.random() * 3; lf.s = (1.4 + Math.random() * 1.4) * K;
        }
        continue;
      }
      lf.life += 1 / 60; lf.y += lf.vy / 60; lf.x += Math.sin(lf.ph + t * 1.6) * 0.5;
      if (lf.y > GY || lf.life > lf.span) { lf.live = false; continue; }
      const a = Math.min(1, lf.life / 0.5) * Math.min(1, (lf.span - lf.life) / 0.8) * 0.6;
      ctx!.fillStyle = `rgba(${GOLD},${a})`; ctx!.fillRect(lf.x, lf.y, lf.s, lf.s);
    }
  }

  function frame(now: number) { raf = requestAnimationFrame(frame); if (!visible) return; draw(now / 1000); }
  size();
  raf = requestAnimationFrame(frame);
  const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.02 });
  io.observe(stage);
  let rt = 0;
  const onResize = () => { window.clearTimeout(rt); rt = window.setTimeout(size, 240); };
  window.addEventListener('resize', onResize);
  return {
    setT: (v) => { T = v; },
    destroy() { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener('resize', onResize); },
  };
}
```

Run: `npx vitest run components/vision/tree.test.ts` → `7 passed`.

- [ ] **Step 3: Failing component test**

`components/vision/Vision.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Vision } from './Vision';

test('one line per vision line, and the four names of the tree', () => {
  render(<Vision />);
  expect(document.querySelectorAll('[data-line]')).toHaveLength(4);
  expect(screen.getByText('Vi vil ha et Norge')).toBeInTheDocument();
  expect(screen.getByText('Der det er lett å spørre, og lett å få et ærlig svar.')).toBeInTheDocument();
  const limbs = [...document.querySelectorAll('[data-limb]')].map((el) => el.textContent);
  expect(limbs).toEqual(['Dialog', 'Brobygging', 'Kunnskap']);
  expect(document.querySelector('[data-root]')?.textContent).toBe('Iqra');
  expect(screen.getByRole('figure', { name: /roten er Iqra/ })).toBeInTheDocument();
  expect(document.getElementById('visjon')).toHaveAttribute('aria-labelledby', 'visjon-label');
});
```

Run: `npx vitest run components/vision/Vision.test.tsx` → FAIL (module missing).

- [ ] **Step 4: Tree box and Vision component**

`components/vision/Tree.tsx`:

```tsx
import { site } from '@/content/site.no';
import styles from './vision.module.css';

/** The canvas box; Vision mounts the renderer on it. The names are real text for readers. */
export function Tree() {
  return (
    <div className={styles.tree} data-tree role="figure" aria-label={site.vision.tree.label}>
      <canvas className={styles.canvas} aria-hidden="true" />
      {site.vision.tree.limbs.map((name) => (
        <span key={name} className={styles.limbName} data-limb>{name}</span>
      ))}
      <span className={styles.rootName} data-root>{site.vision.tree.root}</span>
    </div>
  );
}
```

`components/vision/Vision.tsx`:

```tsx
'use client';

import { useRef } from 'react';
import { site } from '@/content/site.no';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { setWordmarkOnDark } from '@/lib/wordmark';
import { createVisionTree, GROW, type TreeHandle } from './tree';
import { Tree } from './Tree';
import styles from './vision.module.css';

const dir = (el: Element) => Number((el as HTMLElement).dataset.dir);

export function Vision() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const box = section.querySelector<HTMLElement>('[data-tree]');
      const canvas = box?.querySelector('canvas');
      const lines = section.querySelectorAll<HTMLElement>('[data-line]');
      const reduced = reducedMotion();
      let tree: TreeHandle | null = null;
      if (box && canvas) {
        tree = createVisionTree(box, canvas, {
          reduced,
          limbLabels: Array.from(box.querySelectorAll<HTMLElement>('[data-limb]')),
          rootLabel: box.querySelector<HTMLElement>('[data-root]'),
        });
      }
      if (reduced) {
        tree?.setT(99);
        return () => tree?.destroy();
      }
      const linesIn = () =>
        gsap.fromTo(lines,
          { x: (i, el) => 120 * dir(el), skewX: (i, el) => -8 * dir(el), opacity: 0 },
          { x: 0, skewX: 0, opacity: 1, duration: 1.1, ease: EASE.out, stagger: 0.09 });
      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', () => {
        ScrollTrigger.create({
          trigger: section, start: 'top top', end: '+=160%', pin: true, scrub: 0.6,
          onEnter: () => { linesIn(); setWordmarkOnDark(false); },
          onEnterBack: () => setWordmarkOnDark(false),
          onUpdate: (self) => tree?.setT(self.progress * GROW),
        });
      });
      mm.add('(max-width: 767px)', () => {
        const p = { T: 0 };
        ScrollTrigger.create({
          trigger: section, start: 'top 60%', once: true,
          onEnter: () => { linesIn(); gsap.to(p, { T: GROW, duration: 5, ease: EASE.none, onUpdate: () => tree?.setT(p.T) }); },
        });
      });
      return () => { mm.revert(); tree?.destroy(); };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="visjon" className={styles.vision} aria-labelledby="visjon-label">
      <div className={styles.inner}>
        <div className={styles.text}>
          <span id="visjon-label" className={styles.label}>{site.vision.label}</span>
          <div className={styles.lines}>
            {site.vision.lines.map((line, i) => (
              <div key={line} className={styles.line} data-line data-dir={i % 2 === 0 ? -1 : 1}>{line}</div>
            ))}
          </div>
          <p className={styles.sub}>{site.vision.sub}</p>
        </div>
        <Tree />
      </div>
    </section>
  );
}
```

`components/vision/vision.module.css`:

```css
.vision {
  background: #ffffff;
  overflow: hidden;
}

.inner {
  min-height: 100svh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: 48px;
  padding: 100px var(--margin) 60px;
}

.text {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.label {
  font: 500 12px/1 var(--font-mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.lines {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.line {
  font-size: clamp(26px, 3.6vw, 52px);
  line-height: 1.05;
  font-weight: 600;
  letter-spacing: -0.035em;
  color: var(--color-navy);
  will-change: transform;
}

.sub {
  margin: 0;
  font-size: clamp(17px, 1.4vw, 21px);
  line-height: 1.5;
  color: var(--color-ink-soft);
  max-width: 520px;
}

.tree {
  position: relative;
  width: 100%;
  height: min(76vh, 720px);
}

.canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.limbName {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.01em;
  color: var(--color-navy);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
}

.rootName {
  position: absolute;
  left: 50%;
  transform: translate(-50%, -100%);
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--color-navy);
  opacity: 0;
  pointer-events: none;
}

@media (max-width: 767px) {
  .inner {
    grid-template-columns: minmax(0, 1fr);
    padding: 96px var(--margin) 48px;
    gap: 24px;
  }

  .tree {
    order: -1;
    height: 52vh;
  }

  .limbName {
    font-size: 14px;
  }

  .rootName {
    font-size: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .limbName,
  .rootName {
    opacity: 1;
  }
}
```

Run: `npx vitest run components/vision` → `8 passed`.

- [ ] **Step 5: Wire the page and look**

In `app/page.tsx` add `import { Vision } from '@/components/vision/Vision';` and render `<Vision />` after `<Hero />` inside `<main>`.

Run `npm run dev`, open at ~1440 wide, scroll past the hero. Check against the prototype's tree: the section pins; the four lines slide in from alternating sides; a crimson seed appears on the ground line and is absorbed as a fat navy trunk rises; the trunk splits into three limbs, twigs follow, gold lights appear at the tips and sway; «Dialog» left, «Brobygging» top, «Kunnskap» right fade in near their limbs; roots spread below the line with «Iqra» beneath them; the wordmark is navy. Narrow below 768 px: the tree sits above the text and grows by itself when it comes into view. Reduced motion: fully grown, still, names visible.

- [ ] **Step 6: Commit**

```bash
git add components/vision/tree.ts components/vision/tree.test.ts components/vision/Tree.tsx components/vision/Vision.tsx components/vision/vision.module.css components/vision/Vision.test.tsx app/page.tsx
git commit -m "feat: visjon with the lines and the tree that grows from a seed

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---
### Task 8: Misjon — one night still

Implements spec §8, §9 (wordmark white over the still), §11.

**Files:**
- Create: `components/mission/Mission.tsx`, `components/mission/mission.module.css`, `components/mission/Mission.test.tsx`
- Modify: `app/page.tsx`
- Reference: `docs/superpowers/specs/prototype/styles.css` (`.b-mission*`) and `app.js` (the `mission` timeline inside `B.init`).

**Interfaces:**
- Consumes: `site`, `gsap`/`ScrollTrigger`/`useGSAP`/`EASE`/`reducedMotion` (Task 4), `setWordmarkOnDark` (Task 5), `public/media/still-koran.{avif,webp}` (Task 3).
- Produces: `<Mission />` with `#misjon`; DOM hooks for e2e: `[data-mission-text]`, `#misjon img`.

- [ ] **Step 1: Failing test**

`components/mission/Mission.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Mission } from './Mission';

test('label, mission text and the call to action come from the content file', () => {
  render(<Mission />);
  expect(document.getElementById('misjon')).toHaveAttribute('aria-labelledby', 'misjon-label');
  expect(screen.getByText('Misjon')).toHaveAttribute('id', 'misjon-label');
  expect(screen.getByText(/bygger vi broer/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Still et spørsmål' })).toHaveAttribute('href', 'mailto:[EPOST]');
});

test('the still has an avif source, a webp source and an empty alt', () => {
  render(<Mission />);
  expect(document.querySelector('#misjon source[type="image/avif"]')).toHaveAttribute('srcset', '/media/still-koran.avif');
  expect(document.querySelector('#misjon source[type="image/webp"]')).toHaveAttribute('srcset', '/media/still-koran.webp');
  expect(document.querySelector('#misjon img')).toHaveAttribute('alt', '');
});
```

Run: `npx vitest run components/mission/Mission.test.tsx` → FAIL (module missing).

- [ ] **Step 2: Component and styles**

`components/mission/Mission.tsx`:

```tsx
'use client';

import { useRef } from 'react';
import { site } from '@/content/site.no';
import { EASE, gsap, reducedMotion, useGSAP } from '@/lib/gsap';
import { setWordmarkOnDark } from '@/lib/wordmark';
import styles from './mission.module.css';

export function Mission() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section || reducedMotion()) return;
      const still = section.querySelector('img');
      const text = section.querySelector('[data-mission-text]');
      if (!still || !text) return;
      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', () => {
        gsap.timeline({
          scrollTrigger: {
            trigger: section, start: 'top top', end: '+=100%', pin: true, scrub: 0.6,
            onEnter: () => setWordmarkOnDark(true),
            onEnterBack: () => setWordmarkOnDark(true),
            onLeaveBack: () => setWordmarkOnDark(false),
          },
        })
          .fromTo(still, { scale: 1 }, { scale: 1.06, duration: 1, ease: EASE.none }, 0)
          .fromTo(text, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: EASE.out }, 0.08);
      });
      mm.add('(max-width: 767px)', () => {
        gsap.fromTo(text, { y: 40, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, duration: 1, ease: EASE.out,
          scrollTrigger: { trigger: section, start: 'top 70%', onEnter: () => setWordmarkOnDark(true), onLeaveBack: () => setWordmarkOnDark(false) },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="misjon" className={styles.mission} aria-labelledby="misjon-label">
      <picture className={styles.still}>
        <source srcSet="/media/still-koran.avif" type="image/avif" />
        <source srcSet="/media/still-koran.webp" type="image/webp" />
        <img src="/media/still-koran.webp" alt="" loading="lazy" decoding="async" width={1920} height={1080} />
      </picture>
      <div className={styles.gradient} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.text} data-mission-text>
          <span id="misjon-label" className={styles.label}>{site.mission.label}</span>
          <p className={styles.body}>{site.mission.text}</p>
          <a className={styles.cta} href={`mailto:${site.contact.email}`}>{site.hero.cta}</a>
        </div>
      </div>
    </section>
  );
}
```

`components/mission/mission.module.css`:

```css
.mission {
  position: relative;
  background: var(--color-night);
  color: #ffffff;
  overflow: hidden;
}

.still {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.still img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.62;
  will-change: transform;
}

.gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(14, 22, 32, 0.15) 0%, rgba(14, 22, 32, 0.85) 100%);
  pointer-events: none;
}

.inner {
  position: relative;
  min-height: 100svh;
  display: flex;
  align-items: flex-end;
  padding: 120px var(--margin) 96px;
}

.text {
  display: flex;
  flex-direction: column;
  gap: 28px;
  align-items: flex-start;
  max-width: 760px;
}

.label {
  font: 500 12px/1 var(--font-mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.body {
  margin: 0;
  font-size: 40px;
  line-height: 1.2;
  font-weight: 500;
  letter-spacing: -0.025em;
  text-wrap: pretty;
}

.cta {
  display: inline-flex;
  align-items: center;
  height: 52px;
  padding: 0 26px;
  border-radius: 999px;
  background: #ffffff;
  color: var(--color-navy);
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
}

@media (max-width: 767px) {
  .inner {
    padding: 96px var(--margin) 48px;
  }

  .body {
    font-size: 26px;
  }

  .cta {
    width: 100%;
    justify-content: center;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .body {
    font-size: 32px;
  }
}
```

Run: `npx vitest run components/mission/Mission.test.tsx` → `2 passed`.

- [ ] **Step 3: Wire the page and look**

In `app/page.tsx` add `import { Mission } from '@/components/mission/Mission';` and render `<Mission />` after `<Vision />`.

Run `npm run dev`. After the tree: the Quran still, pinned; the text rises in; the wordmark turns white while the still is behind it and navy again when scrolling back up into Visjon; the footer follows. On phones no pin, the text rises once.

- [ ] **Step 4: Commit**

```bash
git add components/mission/Mission.tsx components/mission/mission.module.css components/mission/Mission.test.tsx app/page.tsx
git commit -m "feat: misjon over the night still

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---
### Task 9: End-to-end scenarios

Implements spec §13 (Playwright). Both projects are Chromium (`desktop` 1440×900, `phone` Pixel 7): Playwright's Chromium plays WebM; H.264 is not in its build, and its Windows WebKit cannot be relied on for video.

**Files:**
- Create: `e2e/hero.spec.ts`, `e2e/sections.spec.ts`

**Interfaces:**
- Consumes DOM hooks: `#hero`, `#hero-word`, `[data-mask]`, `[data-copy]`, `#site-wordmark`, `#visjon`, `[data-line]`, `[data-limb]`, `[data-root]`, `#visjon canvas`, `#misjon`, `[data-mission-text]`, `.pin-spacer` (added by ScrollTrigger when it pins).

- [ ] **Step 1: Hero scenarios**

`e2e/hero.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test';

const heroPinLength = (page: Page) => page.evaluate(() => window.innerHeight * 3);

test.describe('hero', () => {
  test('at the top the letters are closed and the copy hidden', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#hero-word')).toHaveCount(1);
    await expect(page.locator('[data-mask]')).toHaveCSS('opacity', '1');
    await expect(page.locator('[data-copy]')).toHaveCSS('opacity', '0');
    await expect(page.locator('#site-wordmark')).toHaveCSS('opacity', '0');
    const transform = await page.locator('#hero-word').getAttribute('transform');
    expect(transform === null || /^matrix\(1,0,0,1,0,0\)$/.test(transform)).toBe(true);
  });

  test('scrolling opens the letters into the film and lands the headline', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    const pin = await heroPinLength(page);
    await page.evaluate((y) => window.scrollTo(0, y), pin * 0.6);
    await expect(page.locator('[data-mask]')).toHaveCSS('opacity', '0', { timeout: 5_000 });
    await page.evaluate((y) => window.scrollTo(0, y), pin * 0.95);
    await expect(page.locator('[data-copy]')).toHaveCSS('opacity', '1', { timeout: 5_000 });
    await expect(page.locator('#site-wordmark')).toHaveCSS('opacity', '1', { timeout: 5_000 });
    await expect(page.locator('#site-wordmark')).toHaveAttribute('data-on-dark', 'true');
    const t = await page.evaluate(() => (document.querySelector('#hero video') as HTMLVideoElement).currentTime);
    expect(t).toBeGreaterThan(0);
  });

  test('the loop never reaches the logo card', async ({ page }) => {
    await page.goto('/');
    const duration = await page.evaluate(async () => {
      const v = document.querySelector('#hero video') as HTMLVideoElement;
      if (v.readyState < 1) await new Promise((r) => v.addEventListener('loadedmetadata', r, { once: true }));
      return v.duration;
    });
    expect(duration).toBeLessThanOrEqual(4.35);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('nothing pins or plays; the copy and the wordmark are simply there', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(800);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    await expect(page.locator('[data-copy]')).toBeVisible();
    await expect(page.locator('#site-wordmark')).toHaveCSS('opacity', '1');
    const paused = await page.evaluate(() => (document.querySelector('#hero video') as HTMLVideoElement).paused);
    expect(paused).toBe(true);
  });
});
```

- [ ] **Step 2: Section scenarios**

`e2e/sections.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test';

async function pastHero(page: Page) {
  await page.goto('/');
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3.2));
  await page.waitForTimeout(600);
}

const docTop = (page: Page, sel: string) => page.evaluate((s) => {
  const el = document.querySelector(s)!;
  return el.getBoundingClientRect().top + window.scrollY;
}, sel);

const canvasHasInk = (page: Page) => page.evaluate(() => {
  const c = document.querySelector('#visjon canvas') as HTMLCanvasElement;
  const ctx = c.getContext('2d')!;
  const x = Math.floor(c.width / 2);
  const data = ctx.getImageData(x, 0, 1, c.height).data;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 40) return true;
  return false;
});

test('desktop: visjon pins, the lines arrive, the tree grows and its names appear', async ({ page, isMobile }) => {
  test.skip(isMobile, 'pinned layout is desktop only');
  await pastHero(page);
  const top = await docTop(page, '#visjon');
  await page.evaluate((y) => window.scrollTo(0, y + 10), top);
  await page.waitForTimeout(1500);
  await expect(page.locator('#visjon [data-line]').first()).toHaveCSS('opacity', '1', { timeout: 5_000 });
  await page.evaluate((y) => window.scrollTo(0, y + window.innerHeight * 1.6), top);
  await page.waitForTimeout(2500);
  for (const name of ['Dialog', 'Brobygging', 'Kunnskap', 'Iqra']) {
    await expect(page.locator('#visjon [data-limb], #visjon [data-root]').filter({ hasText: name })).toHaveCSS('opacity', '1', { timeout: 5_000 });
  }
  expect(await canvasHasInk(page)).toBe(true);
  await expect(page.locator('#site-wordmark')).toHaveAttribute('data-on-dark', 'false');
});

test('desktop: misjon pins, the text arrives and the wordmark turns white', async ({ page, isMobile }) => {
  test.skip(isMobile, 'pinned layout is desktop only');
  await pastHero(page);
  const top = await docTop(page, '#misjon');
  await page.evaluate((y) => window.scrollTo(0, y + window.innerHeight * 0.9), top);
  await page.waitForTimeout(1500);
  await expect(page.locator('[data-mission-text]')).toHaveCSS('opacity', '1', { timeout: 5_000 });
  await expect(page.locator('#site-wordmark')).toHaveAttribute('data-on-dark', 'true');
  await expect(page.locator('.pin-spacer')).toHaveCount(3); // hero, visjon, misjon
});

test('phone: no pins after the hero; the tree grows by itself and the text arrives', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'stacked layout is the phone layout');
  await pastHero(page);
  await expect(page.locator('.pin-spacer')).toHaveCount(1); // only the hero pins on phones
  const top = await docTop(page, '#visjon');
  await page.evaluate((y) => window.scrollTo(0, y), top);
  for (const name of ['Dialog', 'Brobygging', 'Kunnskap', 'Iqra']) {
    await expect(page.locator('#visjon [data-limb], #visjon [data-root]').filter({ hasText: name })).toHaveCSS('opacity', '1', { timeout: 8_000 });
  }
  const mtop = await docTop(page, '#misjon');
  await page.evaluate((y) => window.scrollTo(0, y), mtop);
  await expect(page.locator('[data-mission-text]')).toHaveCSS('opacity', '1', { timeout: 5_000 });
});
```

- [ ] **Step 3: Run them**

Run: `npm run e2e`
Expected: desktop 4 hero + 2 sections pass (the phone sections test skips); phone 4 hero + 1 sections pass.

Likely first-run failures and their fixes:
- `[data-mask]` never reaches opacity 0: the scroll position is inside the pin but the scrub has not caught up — the 5 s auto-retry covers it; if it still fails, the timeline did not build because `document.fonts.ready` never resolved: check the console for a font error.
- The names never reach opacity 1 on desktop: the pin length differs from `+=160%`; compare with `ScrollTrigger.getAll()[1].end` in the console and adjust the scroll target.
- `.pin-spacer` count 3 fails with 2: `Mission`'s `matchMedia` branch did not match — the viewport is 1440 wide, so `(min-width: 768px)` must match; check that `mm.add` is called before `mm.revert` in a cleanup running too early (React strict mode double-invokes effects in dev; the e2e runs the production build).
- A name locator matches nothing: the names are the `[data-limb]` and `[data-root]` spans inside `#visjon`; the wordmark in the header is outside that scope and never matches.

- [ ] **Step 4: Commit**

```bash
git add e2e/hero.spec.ts e2e/sections.spec.ts
git commit -m "test: end-to-end hero, visjon and misjon scenarios

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Budgets and the final pass

Implements spec §10 (Lighthouse, JS size), §11 (accessibility score), §14 (order of work: last).

**Files:**
- Create: `lighthouserc.json`

- [ ] **Step 1: Lighthouse CI config**

`lighthouserc.json`:

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run start",
      "startServerReadyPattern": "Ready|started server",
      "url": ["http://localhost:3000/"],
      "numberOfRuns": 2
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.05 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

Lighthouse CI needs a Chrome. If `lhci` cannot find one, point it at Edge for the run: `$env:CHROME_PATH = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"`.

- [ ] **Step 2: Build and read the JS budget**

Run: `npm run build`
Expected: the route table shows `/` with a First Load JS figure ≤ 160 kB. If over, confirm `lib/gsap.ts` imports `gsap` and `gsap/ScrollTrigger` only (no `gsap/all`) and that `tree.ts` is imported by `Vision` alone.

- [ ] **Step 3: Run Lighthouse**

Run: `npm run lhci`
Expected: the three assertions pass on the mobile preset; the report link is printed. If performance is under 0.9: read the LCP element in the report — it must be the poster; if it is not, the preload in `app/layout.tsx` is missing or the poster path is wrong. If Total Blocking Time is the culprit, the loop's decode competes with hydration: in `Hero.tsx` wrap `video.load(); video.play()` in `requestIdleCallback` (fallback `setTimeout(fn, 0)`) and rerun.

- [ ] **Step 4: Whole-suite check**

Run, in this order, and record the outputs:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run e2e
```

Expected: no type errors, no lint errors, all unit tests pass, all e2e pass.

- [ ] **Step 5: Commit**

```bash
git add lighthouserc.json
git commit -m "chore: lighthouse budget for performance, accessibility and layout shift

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 6: Handover notes**

Report to the user, in plain words: how to run it locally (`npm run dev`), the two open items from spec §15 (the `[EPOST]` address; the seamless loop if the hard cut bothers anyone), the measured Lighthouse scores, and the First Load JS figure. Say explicitly which checks ran and passed, and which were skipped, if any.

---

## Self-review against the spec

- §1 scope → Tasks 5–8 build exactly the header, hero, visjon with the tree, misjon, footer; nothing else.
- §3 tokens and type → Task 2 (`@theme`), sizes in Tasks 6–8 CSS; tree colours in Task 7's constants.
- §4 content → Task 2; every string in Tasks 5–8 is read from `site` (tests assert it, including the tree's names and the figure label).
- §5 files → the File structure table; every file appears in exactly one task.
- §6 hero → Task 6 (timeline numbers match §6.2; `maskOrigin` from Task 4 with the jsdom fallback; media from Tasks 3–4; reduced motion via CSS + early return).
- §7 visjon and tree → Task 7 (`generate`/`fit` are the spec's bullets, line by line; growth mapping, phones and reduced motion as written).
- §8 misjon → Task 8; §9 wordmark colour switches → Tasks 6, 7, 8 call `setWordmarkOnDark` at the moments the spec names.
- §10 budgets → Task 3 (media sizes), Task 10 (LCP, CLS, JS).
- §11 accessibility → Task 5 (wordmark name), Task 6 (decorative media, h1, copy in DOM), Task 7 (figure label, names as text), Task 10 (score).
- §12 errors → Task 6 (autoplay catch, fonts.ready, measure fallback), Task 7 (`createVisionTree` returns null without a context; resize rebuilds).
- §13 tests → Tasks 2, 4, 5, 6, 7, 8 (unit), Task 9 (e2e), Task 10 (Lighthouse).
- §14 setup → Task 1.
- Type consistency: `TreeHandle`/`createVisionTree`/`GROW`/`generate`/`fit` names match between Task 7's module, its tests and `Vision.tsx`; `setWordmarkOnDark` (Task 5) is the only wordmark API used by Tasks 6–8; `pickSource` URLs match Task 3's file names; `EASE` keys used (`out`, `inOut`, `none`, `in2`, `in1`) all exist in Task 4.
- Deviations from the spec worth knowing: none intended. The prototype is the tie-breaker where the spec and this plan differ in a number.
