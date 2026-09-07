# Iqra Foundation Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the v1 landing page for Iqra Foundation: a 6.5 s hero film that lands on the logo and becomes the page, then Visjon and Misjon over pinned stills from the film.

**Architecture:** Next 16 App Router, one route `/`. The page is server-rendered in its resting state; an inline head script flips it to the film state before first paint on a fresh visit. A pure reducer (`heroMachine.ts`) owns the hero's states (`film → landing → rest`); GSAP runs the landing timeline and the pinned Stage; all state-dependent CSS keys off `html[data-hero]`.

**Tech Stack:** Next 16.3 · React 19.2 · TypeScript 5 · Tailwind 4 · GSAP 3 (core + ScrollTrigger) + `@gsap/react` · Vitest 4 + Testing Library · Playwright 1.55 · sharp + potrace (asset scripts) · ffmpeg (on PATH) · Lighthouse CI.

**Spec:** `docs/superpowers/specs/2026-09-07-iqra-foundation-website-design.md` — read it first; every task below cites the section it implements.

## Global Constraints

- Repo: `C:\Users\daodi\code\iqra-foundation`, branch `main`, Node 24, npm. Commit after every task with the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Versions match `iqra-portal`: `next@16.3.x`, `react@19.2.x`, `tailwindcss@4`, `vitest@4`, `@playwright/test@1.55.x`.
- Colours are exact: navy `#2a394b`, crimson `#ab5263`, white `#ffffff`, night `#0e1620`, film-black `#0b1118`, ink-soft `#4b586a`, muted `#8a94a3`, hairline `#e3e7ec`.
- Fonts: Geist and Geist Mono via `next/font/google` only. No other font family anywhere.
- Every Norwegian string lives in `content/site.no.ts`. Components never contain literal copy.
- Motion vocabulary: entrances `expo.out`, crossfades `power2.inOut`, durations 0.3 / 0.6 / 0.7 s; the crimson full stop is the only overshoot (`back.out(1.7)`).
- v1 header has **no nav links** (logo only). CTA is `mailto:` with the `[EPOST]` placeholder until the user supplies an address.
- Images in `public/media`: AVIF ≤ 150 KB, WebP ≤ 220 KB; video 1080p mp4 ≤ 4 MB, webm ≤ 2.2 MB; 720p mp4 ≤ 1.6 MB, webm ≤ 1.1 MB.
- Use plain `<img>`/`<picture>`/`<video>`; disable `@next/next/no-img-element`.
- Never `git add -A`. Stage explicit paths.

## File structure

| File | Responsibility |
|---|---|
| `app/layout.tsx` | `<html lang="nb">`, fonts, metadata, poster preload, the inline boot script (§6.2) |
| `app/page.tsx` | Composes `Header`, `Hero`, `Stage`, `Footer` |
| `app/globals.css` | Tailwind import, `@theme` tokens, header/margin variables, `html[data-hero]` scroll lock and logo hiding |
| `content/site.no.ts` | All copy (§4) |
| `lib/gsap.ts` | Registers ScrollTrigger + useGSAP once; exports `gsap`, `ScrollTrigger`, `useGSAP`, `EASE`, `DUR` |
| `lib/media.ts` | `pickSource({narrow, webm})` → video URL (§6.5) |
| `components/Logo.tsx` + `components/logoMeta.ts` | Generated: `<img src="/logo.svg">` with the traced logo's aspect (§5) |
| `components/Header.tsx` + `header.module.css` | Logo only, `id="site-logo"`, z-index above the film overlay |
| `components/Footer.tsx` + `ReplayButton.tsx` + `footer.module.css` | Name, year, mailto, «Se filmen igjen» (dispatches `iqra:replay`) |
| `components/hero/heroMachine.ts` | Pure reducer: states, events, effects (§6.3) |
| `components/hero/coverRect.ts` | Pure cover-fit maths (§6.4) |
| `components/hero/logoRect.ts` | Generated constants `FRAME`, `LOGO_RECT` (§6.4) |
| `components/hero/FilmOverlay.tsx` | `<video>`, progress hairline, skip button, source pick, play, timeout, skip listeners |
| `components/hero/Hero.tsx` | Owns the machine; runs landing / abort / settle / replay effects; the white block markup |
| `components/hero/hero.module.css` | Overlay, masks, pre-rise positions, hero layout at all breakpoints |
| `components/stage/step.ts` | `stepForProgress(p)` |
| `components/stage/Stage.tsx` + `stage.module.css` | Visjon + Misjon, pinned timeline on ≥768 px with motion, stacked otherwise (§7) |
| `scripts/lib/bbox.mjs`, `scripts/lib/content-check.mjs` | Pure helpers, unit-tested |
| `scripts/media.mjs`, `scripts/trace-logo.mjs`, `scripts/check-content.mjs` | Asset pipeline and the prebuild content gate |
| `e2e/hero.spec.ts`, `e2e/stage.spec.ts` | Playwright scenarios (§12) |
| `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `lighthouserc.json` | Tooling |

---

### Task 1: Scaffold and tooling

**Files:**
- Create (by `create-next-app`): `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `app/*`, `public/*`, `.gitignore`
- Create: `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `.gitattributes`, `lib/smoke.test.ts`
- Modify: `package.json` (scripts), `eslint.config.mjs` (img rule), `.gitignore`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `start`, `lint`, `test`, `test:watch`, `e2e`, `media`, `logo`, `lhci`; the `@/*` import alias; Vitest with jsdom + Testing Library; Playwright projects `desktop` (Chromium 1440×900) and `phone` (Pixel 7, Chromium — WebM plays in Playwright's Chromium, H.264 does not, which is why the phone project is Chromium and not WebKit).

- [ ] **Step 1: Scaffold Next in the existing repo**

Run from `C:\Users\daodi\code\iqra-foundation`:

```bash
npx --yes create-next-app@latest . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --disable-git --yes
```

Expected: it accepts the folder (only `.git` and `docs/` exist, both allowed), installs, and prints `Success!`. If it still prompts for anything, accept the default.

- [ ] **Step 2: Install runtime and dev dependencies**

```bash
npm i gsap @gsap/react
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test sharp potrace @lhci/cli
npx playwright install chromium
```

- [ ] **Step 3: Write the Vitest config and setup**

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

`vitest.setup.ts` (jsdom has no media playback and no `matchMedia`; the hero needs both):

```ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
HTMLMediaElement.prototype.load = vi.fn();
HTMLMediaElement.prototype.pause = vi.fn();
HTMLMediaElement.prototype.canPlayType = vi.fn().mockReturnValue('probably');
```

- [ ] **Step 4: Write the Playwright config**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
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

In `package.json` set `"scripts"` to exactly:

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
  "logo": "node scripts/trace-logo.mjs",
  "lhci": "lhci autorun"
}
```

(`prebuild` points at a script Task 2 creates; until then `npm run build` will fail on the missing file — that is expected and Task 2 fixes it.)

In `eslint.config.mjs`, append to the exported array:

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
scripts/.last-frame.png
```

- [ ] **Step 6: Smoke test to prove Vitest runs**

`lib/smoke.test.ts`:

```ts
import { expect, test } from 'vitest';

test('vitest runs with jsdom', () => {
  document.body.innerHTML = '<p>hei</p>';
  expect(document.querySelector('p')?.textContent).toBe('hei');
});
```

Run: `npm test`
Expected: `1 passed`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts eslint.config.mjs postcss.config.mjs .gitignore .gitattributes app public vitest.config.ts vitest.setup.ts playwright.config.ts lib/smoke.test.ts
git commit -m "chore: scaffold Next 16 with Vitest and Playwright

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Content, tokens, layout and the content gate

Implements spec §3, §4, §6.2 (boot script), §9 (poster preload).

**Files:**
- Create: `content/site.no.ts`, `scripts/lib/content-check.mjs`, `scripts/lib/content-check.test.ts`, `scripts/check-content.mjs`
- Modify: `app/globals.css` (replace), `app/layout.tsx` (replace), `app/page.tsx` (replace with a stub)
- Delete: `public/next.svg`, `public/vercel.svg`, `public/file.svg`, `public/globe.svg`, `public/window.svg`

**Interfaces:**
- Produces: `site` (shape below) from `@/content/site.no`; CSS variables `--header-h`, `--margin`; Tailwind colours `navy crimson night film-black ink-soft muted hairline`; `--font-sans`, `--font-mono`, `--ease-out-expo`; `html[data-hero]` contract: `film` and `landing` lock scroll and hide `#site-logo`.
- Produces: `contentProblems(site, { production })` → `string[]`.

- [ ] **Step 1: Write the content file**

`content/site.no.ts`:

```ts
export const site = {
  lang: 'nb',
  name: 'Iqra Foundation',
  meta: {
    title: 'Iqra Foundation',
    description: 'Iqra betyr les. Vi snakker gjerne med deg om islam.',
  },
  hero: {
    h1Lines: ['Iqra betyr', 'les'],
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
  contact: { email: '[EPOST]' },
  footer: { replay: 'Se filmen igjen' },
} as const;

export type Site = typeof site;
```

- [ ] **Step 2: Write the failing content-check tests**

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

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run scripts/lib/content-check.test.ts`
Expected: FAIL — cannot find module `./content-check.mjs`.

- [ ] **Step 4: Implement the checker and the prebuild script**

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

`scripts/check-content.mjs` (Node 24 strips types, so the `.ts` import works directly):

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

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run scripts/lib/content-check.test.ts` → Expected: `3 passed`.
Run: `node scripts/check-content.mjs` → Expected: `content ok (email placeholder still in place; ...)`. If Node reports `ERR_UNKNOWN_FILE_EXTENSION`, change the script to `node --experimental-strip-types scripts/check-content.mjs` in `package.json`.

- [ ] **Step 6: Replace globals.css with the tokens**

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
  --header-h: 100px;
  --margin: 80px;
}

@media (max-width: 767px) {
  :root {
    --header-h: 72px;
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
}

/* The hero's state lives on <html>. film and landing lock the page and keep
   the header logo out of the way until the landing animation places it. */
html[data-hero="film"],
html[data-hero="landing"] {
  overflow: hidden;
}

html[data-hero="film"] #site-logo,
html[data-hero="landing"] #site-logo {
  visibility: hidden;
}

:focus-visible {
  outline: 2px solid var(--color-crimson);
  outline-offset: 3px;
}
```

- [ ] **Step 7: Replace the root layout**

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

// Runs before first paint. Fresh visit + motion allowed => the film state.
// Anything else (repeat visit, reduced motion, no JS) => the resting page.
const heroBoot =
  "(function(){try{if(sessionStorage.getItem('iqra:hero-seen'))return;" +
  "if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;" +
  "document.documentElement.setAttribute('data-hero','film')}catch(e){}})();";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.lang} className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preload" as="image" href="/media/iqra-hero-poster.jpg" />
        <script dangerouslySetInnerHTML={{ __html: heroBoot }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Stub the page and delete template assets**

`app/page.tsx` (temporary; Tasks 6–8 replace it):

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
```

- [ ] **Step 9: Verify the build and commit**

Run: `npm run build`
Expected: `content ok ...` then a successful Next build with route `/`.

```bash
git add content/site.no.ts scripts/lib/content-check.mjs scripts/lib/content-check.test.ts scripts/check-content.mjs app/globals.css app/layout.tsx app/page.tsx
git commit -m "feat: content file, design tokens, root layout with hero boot script

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---
### Task 3: Media pipeline and the measured logo rect

Implements spec §5 (public/media), §6.4 (LOGO_RECT), §9 (sizes).

**Files:**
- Create: `scripts/lib/bbox.mjs`, `scripts/lib/bbox.test.ts`, `scripts/media.mjs`
- Generated and committed: `public/media/iqra-hero-1080.{mp4,webm}`, `public/media/iqra-hero-720.{mp4,webm}`, `public/media/iqra-hero-poster.jpg`, `public/media/still-arafat.{avif,webp}`, `public/media/still-koran.{avif,webp}`, `components/hero/logoRect.ts`

**Interfaces:**
- Produces: `bbox(data, width, height, channels, threshold?)` → `{ x, y, w, h } | null`.
- Produces: `FRAME = { w: 1920, h: 1080 }` and `LOGO_RECT = { x, y, w, h }` (integers, source pixels) from `@/components/hero/logoRect`.

- [ ] **Step 1: Write the failing bbox test**

`scripts/lib/bbox.test.ts`:

```ts
import { expect, test } from 'vitest';
import { bbox } from './bbox.mjs';

function image(width: number, height: number, dark: Array<[number, number]>) {
  const data = new Uint8Array(width * height * 3).fill(255);
  for (const [x, y] of dark) {
    const i = (y * width + x) * 3;
    data[i] = 42; data[i + 1] = 57; data[i + 2] = 75;
  }
  return data;
}

test('returns the tight box around dark pixels', () => {
  const data = image(4, 3, [[1, 1], [2, 2]]);
  expect(bbox(data, 4, 3, 3, 240)).toEqual({ x: 1, y: 1, w: 2, h: 2 });
});

test('returns null for an all-white image', () => {
  expect(bbox(image(4, 3, []), 4, 3, 3, 240)).toBeNull();
});

test('ignores near-white noise above the threshold', () => {
  const data = image(3, 1, []);
  data[0] = 245; // lighter than threshold, must not count
  expect(bbox(data, 3, 1, 3, 240)).toBeNull();
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run scripts/lib/bbox.test.ts` → Expected: FAIL, cannot find `./bbox.mjs`.

- [ ] **Step 3: Implement bbox**

`scripts/lib/bbox.mjs`:

```js
/**
 * Bounding box of the pixels that are darker than `threshold` in any of the
 * first three channels. `data` is a raw interleaved buffer (as sharp emits).
 * Returns null when no pixel qualifies.
 */
export function bbox(data, width, height, channels, threshold = 240) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (data[i] < threshold || data[i + 1] < threshold || data[i + 2] < threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run scripts/lib/bbox.test.ts` → Expected: `3 passed`.

- [ ] **Step 5: Write the media script**

`scripts/media.mjs`:

```js
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { bbox } from './lib/bbox.mjs';

const SRC = 'C:/Users/daodi/generations/hero-web-1080-upscaled';
const OUT = 'public/media';
const MASTER = `${SRC}/iqra-hero.mp4`;

mkdirSync(OUT, { recursive: true });
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
const kb = (file) => Math.round(statSync(file).size / 1024);

// 1. Web-ready 1080p sources and the poster, as they are.
copyFileSync(MASTER, `${OUT}/iqra-hero-1080.mp4`);
copyFileSync(`${SRC}/iqra-hero.webm`, `${OUT}/iqra-hero-1080.webm`);
copyFileSync(`${SRC}/iqra-hero-poster.jpg`, `${OUT}/iqra-hero-poster.jpg`);

// 2. 720p variants for phones.
ff(['-i', MASTER, '-an', '-vf', 'scale=1280:720', '-c:v', 'libx264', '-preset', 'slow', '-crf', '23',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${OUT}/iqra-hero-720.mp4`]);
ff(['-i', MASTER, '-an', '-vf', 'scale=1280:720', '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0',
  '-row-mt', '1', `${OUT}/iqra-hero-720.webm`]);

// 3. Stills for the Stage, straight from the film.
for (const [name, t] of [['still-arafat', '2.60'], ['still-koran', '3.90']]) {
  const png = `${OUT}/${name}.png`;
  ff(['-ss', t, '-i', MASTER, '-frames:v', '1', png]);
  await sharp(png).avif({ quality: 50 }).toFile(`${OUT}/${name}.avif`);
  await sharp(png).webp({ quality: 80 }).toFile(`${OUT}/${name}.webp`);
  unlinkSync(png);
}

// 4. Where the logo sits in the last frame: the DOM logo is placed exactly there.
const last = 'scripts/.last-frame.png';
ff(['-sseof', '-0.1', '-i', MASTER, '-frames:v', '1', '-update', '1', last]);
const { data, info } = await sharp(last).raw().toBuffer({ resolveWithObject: true });
const rect = bbox(data, info.width, info.height, info.channels, 240);
if (!rect) throw new Error('No logo found in the last frame');
writeFileSync(
  'components/hero/logoRect.ts',
  `// Generated by scripts/media.mjs from the film's last frame. Do not edit by hand.\n` +
    `export const FRAME = { w: ${info.width}, h: ${info.height} } as const;\n` +
    `export const LOGO_RECT = { x: ${rect.x}, y: ${rect.y}, w: ${rect.w}, h: ${rect.h} } as const;\n`,
);
unlinkSync(last);

for (const f of ['iqra-hero-1080.mp4', 'iqra-hero-1080.webm', 'iqra-hero-720.mp4', 'iqra-hero-720.webm',
  'iqra-hero-poster.jpg', 'still-arafat.avif', 'still-arafat.webp', 'still-koran.avif', 'still-koran.webp']) {
  console.log(`${f.padEnd(24)} ${kb(`${OUT}/${f}`)} KB`);
}
console.log('logo rect', rect, 'in', info.width, 'x', info.height);
```

- [ ] **Step 6: Run it and check the budget**

Run: `npm run media`
Expected: a size line per file and a logo rect roughly `x≈420 y≈250 w≈1080 h≈560` (the logo is centred; `x + w/2` must be within 10 px of 960). Budget (§9): `still-*.avif` ≤ 150 KB, `still-*.webp` ≤ 220 KB, `iqra-hero-720.mp4` ≤ 1600 KB, `iqra-hero-720.webm` ≤ 1100 KB. If an AVIF is over, lower `quality` to 42 and rerun; if the 720 mp4 is over, raise `-crf` to 25.

- [ ] **Step 7: Look at the stills once**

Open `public/media/still-arafat.webp` and `public/media/still-koran.webp` with the Read tool. Expected: the Arafat wide shot (white-robed crowd on the slope, hazy sky) and the open Quran by candlelight, no black frames, no cut-transition smear. If a still shows a transition, move its timestamp by ±0.2 s in the script and rerun.

- [ ] **Step 8: Commit**

```bash
git add scripts/lib/bbox.mjs scripts/lib/bbox.test.ts scripts/media.mjs public/media components/hero/logoRect.ts
git commit -m "feat: media pipeline, hero video sources, stage stills, measured logo rect

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Trace the logo to SVG

Implements spec §5 (logo) and §14 (fallback).

**Files:**
- Create: `scripts/trace-logo.mjs`, `components/Logo.tsx`, `components/Logo.test.tsx`
- Generated and committed: `public/logo.svg`, `components/logoMeta.ts`

**Interfaces:**
- Produces: `LOGO_META = { w: number; h: number }` (viewBox size) from `@/components/logoMeta`; `<Logo />` renders `<img src="/logo.svg" alt="" width height>`.

- [ ] **Step 1: Write the trace script**

`scripts/trace-logo.mjs`:

```js
import { writeFileSync } from 'node:fs';
import potrace from 'potrace';
import sharp from 'sharp';

const SRC = 'C:/Users/daodi/generations/refs/iqra_logo_vector.png';
const NAVY = '#2a394b';
const CRIMSON = '#ab5263';

// Tight crop so the SVG's viewBox is the logo's own bounding box.
const { data, info } = await sharp(SRC).trim().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;

// Split the two inks into black-on-white masks. Crimson has far more red than green;
// navy has more green than red.
const navy = Buffer.alloc(width * height, 255);
const crimson = Buffer.alloc(width * height, 255);
for (let i = 0, p = 0; i < data.length; i += 4, p++) {
  if (data[i + 3] < 128) continue;
  if (data[i] > data[i + 1] + 40) crimson[p] = 0;
  else navy[p] = 0;
}

const toPng = (mask) => sharp(mask, { raw: { width, height, channels: 1 } }).png().toBuffer();
const trace = (png, color) =>
  new Promise((resolve, reject) =>
    potrace.trace(png, { color, threshold: 128, turdSize: 4, optTolerance: 0.2 }, (err, svg) =>
      err ? reject(err) : resolve(svg),
    ),
  );
const pathOf = (svg) => svg.match(/<path[^>]*\sd="([^"]+)"/)[1];

const [navySvg, crimsonSvg] = await Promise.all([
  trace(await toPng(navy), NAVY),
  trace(await toPng(crimson), CRIMSON),
]);
const navyPath = pathOf(navySvg);
const crimsonPath = pathOf(crimsonSvg);

writeFileSync(
  'public/logo.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">` +
    `<path fill="${NAVY}" fill-rule="evenodd" d="${navyPath}"/>` +
    `<path fill="${CRIMSON}" fill-rule="evenodd" d="${crimsonPath}"/></svg>`,
);
writeFileSync(
  'components/logoMeta.ts',
  `// Generated by scripts/trace-logo.mjs. Do not edit by hand.\n` +
    `export const LOGO_META = { w: ${width}, h: ${height} } as const;\n`,
);

// A raster of the trace, only so the result can be looked at.
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
  `<rect width="100%" height="100%" fill="#fff"/>` +
  `<path fill="${NAVY}" fill-rule="evenodd" d="${navyPath}"/><path fill="${CRIMSON}" fill-rule="evenodd" d="${crimsonPath}"/></svg>`))
  .resize(1200).png().toFile('scripts/.logo-preview.png');
console.log(`logo.svg ${width}x${height}, paths ${navyPath.length + crimsonPath.length} chars; preview at scripts/.logo-preview.png`);
```

Add `scripts/.logo-preview.png` to `.gitignore`.

- [ ] **Step 2: Run it and look at the result**

Run: `npm run logo`
Then open `scripts/.logo-preview.png` with the Read tool. Accept when: the letters i, Q, R, a and the word "Foundation" have smooth edges, the counters (inside of Q, R, a, o, d) are holes not filled blobs, the dot and the Q-tail are crimson, nothing else is. If "Foundation" is wobbly or a counter is filled: set `turdSize: 2, optTolerance: 0.1` and rerun once. If still bad, use the fallback in Step 5.

- [ ] **Step 3: Write the failing Logo test**

`components/Logo.test.tsx`:

```tsx
import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Logo } from './Logo';
import { LOGO_META } from './logoMeta';

test('the traced svg has the two brand inks and a viewBox', () => {
  const svg = readFileSync('public/logo.svg', 'utf8');
  expect(svg).toContain('fill="#2a394b"');
  expect(svg).toContain('fill="#ab5263"');
  expect(svg).toContain(`viewBox="0 0 ${LOGO_META.w} ${LOGO_META.h}"`);
  expect(LOGO_META.w / LOGO_META.h).toBeGreaterThan(1.5);
});

test('Logo renders the svg as a decorative image with intrinsic size', () => {
  render(<Logo />);
  const img = screen.getByRole('presentation');
  expect(img).toHaveAttribute('src', '/logo.svg');
  expect(img).toHaveAttribute('width', String(LOGO_META.w));
  expect(img).toHaveAttribute('height', String(LOGO_META.h));
});
```

Run: `npx vitest run components/Logo.test.tsx` → Expected: FAIL, cannot find `./Logo`.

- [ ] **Step 4: Implement Logo**

`components/Logo.tsx`:

```tsx
import { LOGO_META } from './logoMeta';

/** Decorative logo image. The wrapping link carries the accessible name. */
export function Logo() {
  return <img src="/logo.svg" alt="" width={LOGO_META.w} height={LOGO_META.h} decoding="async" />;
}
```

Run: `npx vitest run components/Logo.test.tsx` → Expected: `2 passed`.

- [ ] **Step 5: Fallback only if Step 2 failed**

Skip this step if the trace was accepted. Otherwise: `await sharp(SRC).trim().png().toFile('public/logo.png')` in the script (keep `logoMeta.ts` from the trimmed size), change `Logo.tsx` to `src="/logo.png"`, adjust the first test to check `public/logo.png` exists instead of the svg inks, and note in the handover that the original vector is needed.

- [ ] **Step 6: Commit**

```bash
git add scripts/trace-logo.mjs public/logo.svg components/logoMeta.ts components/Logo.tsx components/Logo.test.tsx .gitignore
git commit -m "feat: trace the logo to a two-colour svg

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---
### Task 5: Pure hero logic (cover maths, state machine, source pick, GSAP module)

Implements spec §6.3, §6.4, §6.5, §11 (transitions). No DOM in this task.

**Files:**
- Create: `components/hero/coverRect.ts`, `components/hero/coverRect.test.ts`, `components/hero/heroMachine.ts`, `components/hero/heroMachine.test.ts`, `lib/media.ts`, `lib/media.test.ts`, `lib/gsap.ts`

**Interfaces:**
- Produces: `coverRect(container: Size, source: Size, rect: Rect): Rect` with `Size = { w; h }`, `Rect = { x; y; w; h }`.
- Produces: `HeroState = 'film' | 'landing' | 'rest'`; `HeroEffect = 'land' | 'landFast' | 'abort' | 'settle' | 'replay'`; `HeroEvent` (discriminated on `type`: `INIT{state}`, `ENDED`, `SKIP`, `ERROR`, `AUTOPLAY_BLOCKED`, `TIMEOUT`, `LANDED`, `REPLAY`, `EFFECT_DONE`); `Machine = { state; effect }`; `initialMachine`; `heroReducer(m, e): Machine`.
- Produces: `pickSource({ narrow, webm }): string`.
- Produces: `gsap`, `ScrollTrigger`, `useGSAP`, `EASE = { out, inOut, pop }`, `DUR = { s: 0.3, m: 0.6, l: 0.7 }` from `@/lib/gsap`.

- [ ] **Step 1: Write the failing coverRect tests**

`components/hero/coverRect.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { coverRect } from './coverRect';

const source = { w: 1920, h: 1080 };
const rect = { x: 424, y: 256, w: 1072, h: 552 };
const close = (r: { x: number; y: number; w: number; h: number }, e: typeof r) => {
  expect(r.x).toBeCloseTo(e.x, 1);
  expect(r.y).toBeCloseTo(e.y, 1);
  expect(r.w).toBeCloseTo(e.w, 1);
  expect(r.h).toBeCloseTo(e.h, 1);
};

describe('coverRect', () => {
  test('container with the same aspect ratio: rect unchanged', () => {
    close(coverRect({ w: 1920, h: 1080 }, source, rect), rect);
  });

  test('wider container: video is cropped top and bottom', () => {
    // scale 2000/1920 = 1.041667, vertical offset (1000 - 1125) / 2 = -62.5
    close(coverRect({ w: 2000, h: 1000 }, source, rect), { x: 441.7, y: 204.2, w: 1116.7, h: 575.0 });
  });

  test('taller container: video is cropped left and right', () => {
    // scale 1200/1080 = 1.111111, horizontal offset (900 - 2133.33) / 2 = -616.67
    close(coverRect({ w: 900, h: 1200 }, source, rect), { x: -145.6, y: 284.4, w: 1191.1, h: 613.3 });
  });
});
```

- [ ] **Step 2: Run to verify failure, then implement**

Run: `npx vitest run components/hero/coverRect.test.ts` → FAIL (module missing).

`components/hero/coverRect.ts`:

```ts
export type Size = { w: number; h: number };
export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Where a rectangle given in the source's own pixels lands on screen when the
 * source is fitted into `container` the way `object-fit: cover` does: scaled
 * uniformly to cover, centred, overflow cropped.
 */
export function coverRect(container: Size, source: Size, rect: Rect): Rect {
  const s = Math.max(container.w / source.w, container.h / source.h);
  const offX = (container.w - source.w * s) / 2;
  const offY = (container.h - source.h * s) / 2;
  return { x: offX + rect.x * s, y: offY + rect.y * s, w: rect.w * s, h: rect.h * s };
}
```

Run again → Expected: `3 passed`.

- [ ] **Step 3: Write the failing state-machine tests**

`components/hero/heroMachine.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { heroReducer, initialMachine, type HeroEvent, type Machine } from './heroMachine';

const at = (state: Machine['state']): Machine => ({ state, effect: null });

describe('heroReducer', () => {
  test('starts at rest with no effect', () => {
    expect(initialMachine).toEqual({ state: 'rest', effect: null });
  });

  test('INIT adopts the state the boot script chose', () => {
    expect(heroReducer(initialMachine, { type: 'INIT', state: 'film' })).toEqual(at('film'));
  });

  test.each<[Machine['state'], HeroEvent['type'], Machine]>([
    ['film', 'ENDED', { state: 'landing', effect: 'land' }],
    ['film', 'SKIP', { state: 'landing', effect: 'landFast' }],
    ['film', 'ERROR', { state: 'rest', effect: 'abort' }],
    ['film', 'AUTOPLAY_BLOCKED', { state: 'rest', effect: 'abort' }],
    ['film', 'TIMEOUT', { state: 'rest', effect: 'abort' }],
    ['landing', 'LANDED', { state: 'rest', effect: 'settle' }],
    ['rest', 'REPLAY', { state: 'film', effect: 'replay' }],
  ])('%s + %s', (state, type, expected) => {
    expect(heroReducer(at(state), { type } as HeroEvent)).toEqual(expected);
  });

  test.each<[Machine['state'], HeroEvent['type']]>([
    ['rest', 'ENDED'],
    ['rest', 'SKIP'],
    ['landing', 'SKIP'],
    ['landing', 'ENDED'],
    ['landing', 'ERROR'],
    ['film', 'LANDED'],
    ['film', 'REPLAY'],
  ])('%s ignores %s', (state, type) => {
    const m = at(state);
    expect(heroReducer(m, { type } as HeroEvent)).toBe(m);
  });

  test('EFFECT_DONE clears the effect and keeps the state', () => {
    expect(heroReducer({ state: 'landing', effect: 'land' }, { type: 'EFFECT_DONE' })).toEqual(at('landing'));
  });
});
```

- [ ] **Step 4: Run to verify failure, then implement**

Run: `npx vitest run components/hero/heroMachine.test.ts` → FAIL (module missing).

`components/hero/heroMachine.ts`:

```ts
export type HeroState = 'film' | 'landing' | 'rest';

/** What the component must do once, right after a transition. */
export type HeroEffect = 'land' | 'landFast' | 'abort' | 'settle' | 'replay';

export type HeroEvent =
  | { type: 'INIT'; state: HeroState }
  | { type: 'ENDED' }
  | { type: 'SKIP' }
  | { type: 'ERROR' }
  | { type: 'AUTOPLAY_BLOCKED' }
  | { type: 'TIMEOUT' }
  | { type: 'LANDED' }
  | { type: 'REPLAY' }
  | { type: 'EFFECT_DONE' };

export type Machine = { state: HeroState; effect: HeroEffect | null };

export const initialMachine: Machine = { state: 'rest', effect: null };

export function heroReducer(m: Machine, e: HeroEvent): Machine {
  switch (e.type) {
    case 'INIT':
      return { state: e.state, effect: null };
    case 'EFFECT_DONE':
      return m.effect ? { ...m, effect: null } : m;
    case 'ENDED':
      return m.state === 'film' ? { state: 'landing', effect: 'land' } : m;
    case 'SKIP':
      return m.state === 'film' ? { state: 'landing', effect: 'landFast' } : m;
    case 'ERROR':
    case 'AUTOPLAY_BLOCKED':
    case 'TIMEOUT':
      return m.state === 'film' ? { state: 'rest', effect: 'abort' } : m;
    case 'LANDED':
      return m.state === 'landing' ? { state: 'rest', effect: 'settle' } : m;
    case 'REPLAY':
      return m.state === 'rest' ? { state: 'film', effect: 'replay' } : m;
    default:
      return m;
  }
}
```

Run again → Expected: all pass (17 tests).

- [ ] **Step 5: Source picking, test first**

`lib/media.test.ts`:

```ts
import { expect, test } from 'vitest';
import { pickSource } from './media';

test.each([
  [false, true, '/media/iqra-hero-1080.webm'],
  [false, false, '/media/iqra-hero-1080.mp4'],
  [true, true, '/media/iqra-hero-720.webm'],
  [true, false, '/media/iqra-hero-720.mp4'],
])('narrow=%s webm=%s -> %s', (narrow, webm, expected) => {
  expect(pickSource({ narrow, webm })).toBe(expected);
});
```

`lib/media.ts`:

```ts
/** Phones get 720p; WebM (VP9) is preferred wherever it plays. */
export function pickSource({ narrow, webm }: { narrow: boolean; webm: boolean }): string {
  return `/media/iqra-hero-${narrow ? 720 : 1080}.${webm ? 'webm' : 'mp4'}`;
}
```

Run: `npx vitest run lib/media.test.ts` → Expected: `4 passed`.

- [ ] **Step 6: The GSAP module**

`lib/gsap.ts`:

```ts
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/** The site's whole motion vocabulary (spec §3). */
export const EASE = { out: 'expo.out', inOut: 'power2.inOut', pop: 'back.out(1.7)' } as const;
export const DUR = { s: 0.3, m: 0.6, l: 0.7 } as const;

export { gsap, ScrollTrigger, useGSAP };
```

Run: `npx tsc --noEmit` → Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/hero/coverRect.ts components/hero/coverRect.test.ts components/hero/heroMachine.ts components/hero/heroMachine.test.ts lib/media.ts lib/media.test.ts lib/gsap.ts
git commit -m "feat: hero state machine, cover-fit maths, source picking, gsap module

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Header and footer

Implements spec §8 (header, footer), §10 (logo link name).

**Files:**
- Create: `components/Header.tsx`, `components/header.module.css`, `components/Footer.tsx`, `components/ReplayButton.tsx`, `components/footer.module.css`, `components/Header.test.tsx`, `components/Footer.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `Logo` (Task 4), `site` (Task 2).
- Produces: `#site-logo` — the `<a>` the hero animates (Task 7 reads its `getBoundingClientRect()`); the `iqra:replay` window event (Task 7 listens).

- [ ] **Step 1: Write the failing tests**

`components/Header.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Header } from './Header';

test('header is the logo link only, named for screen readers', () => {
  render(<Header />);
  const link = screen.getByRole('link', { name: 'Iqra Foundation, til toppen' });
  expect(link).toHaveAttribute('id', 'site-logo');
  expect(link).toHaveAttribute('href', '/');
  expect(screen.queryAllByRole('link')).toHaveLength(1);
});
```

`components/Footer.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { Footer } from './Footer';

test('footer shows the year, the email and a replay button', () => {
  render(<Footer />);
  expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '[EPOST]' })).toHaveAttribute('href', 'mailto:[EPOST]');
  expect(screen.getByRole('button', { name: 'Se filmen igjen' })).toBeInTheDocument();
});

test('replay button asks the hero to play again', () => {
  const heard = vi.fn();
  window.addEventListener('iqra:replay', heard);
  render(<Footer />);
  fireEvent.click(screen.getByRole('button', { name: 'Se filmen igjen' }));
  expect(heard).toHaveBeenCalledTimes(1);
  window.removeEventListener('iqra:replay', heard);
});
```

Run: `npx vitest run components/Header.test.tsx components/Footer.test.tsx` → FAIL (modules missing).

- [ ] **Step 2: Implement Header**

`components/Header.tsx`:

```tsx
import { Logo } from './Logo';
import styles from './header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <a id="site-logo" href="/" className={styles.logo} aria-label="Iqra Foundation, til toppen">
        <Logo />
      </a>
    </header>
  );
}
```

`components/header.module.css`:

```css
.header {
  position: relative;
  z-index: 60; /* above the film overlay (50): the logo animates over it */
  height: var(--header-h);
  display: flex;
  align-items: center;
  padding: 0 var(--margin);
}

.logo {
  display: block;
  width: fit-content; /* the box must equal the image: the hero measures it */
  height: 52px;
}

.logo img {
  display: block;
  height: 100%;
  width: auto;
}

@media (max-width: 767px) {
  .logo {
    height: 40px;
  }
}
```

- [ ] **Step 3: Implement Footer and ReplayButton**

`components/ReplayButton.tsx`:

```tsx
'use client';

import { site } from '@/content/site.no';
import styles from './footer.module.css';

/** Decoupled from the hero: it only announces the wish; the hero listens. */
export function ReplayButton() {
  return (
    <button type="button" className={styles.link} onClick={() => window.dispatchEvent(new CustomEvent('iqra:replay'))}>
      {site.footer.replay}
    </button>
  );
}
```

`components/Footer.tsx`:

```tsx
import { site } from '@/content/site.no';
import { ReplayButton } from './ReplayButton';
import styles from './footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span>© {new Date().getFullYear()} {site.name}</span>
      <div className={styles.right}>
        <a className={styles.link} href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
        <ReplayButton />
      </div>
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

.right {
  display: flex;
  gap: 28px;
}

.link {
  color: inherit;
  text-decoration: none;
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;
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

- [ ] **Step 4: Run the tests**

Run: `npx vitest run components/Header.test.tsx components/Footer.test.tsx` → Expected: `3 passed`.

- [ ] **Step 5: Put them on the page**

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
        <h1>{site.hero.h1Lines.join(' ')}.</h1>
      </main>
      <Footer />
    </>
  );
}
```

Run: `npm run build` → Expected: builds. Run `npm run dev`, open `http://localhost:3000`: the logo sits top-left at 52 px tall on a white page, the footer shows `© 2026 Iqra Foundation`, `[EPOST]` and `Se filmen igjen`. Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add components/Header.tsx components/header.module.css components/Footer.tsx components/ReplayButton.tsx components/footer.module.css components/Header.test.tsx components/Footer.test.tsx app/page.tsx
git commit -m "feat: header with the logo link, footer with email and replay

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---
### Task 7: The hero — film overlay, landing choreography, replay

Implements spec §6.1, §6.2 (state pick-up), §6.3 (wiring), §6.4, §6.5, §8 (hero layout), §10 (skip focus, decorative video), §11 (abort paths).

**Files:**
- Create: `components/hero/FilmOverlay.tsx`, `components/hero/Hero.tsx`, `components/hero/hero.module.css`, `components/hero/Hero.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `heroReducer`, `initialMachine`, `HeroEvent` (Task 5); `coverRect` (Task 5); `FRAME`, `LOGO_RECT` (Task 3); `pickSource` (Task 5); `gsap`, `EASE`, `DUR` (Task 5); `#site-logo` and `iqra:replay` (Task 6); `site` (Task 2).
- Produces: `<Hero />`; DOM hooks used by e2e: `[data-overlay]`, `[data-line]`, `[data-dot]`, `[data-after]`, `html[data-hero]`.

How the pieces fit: `Hero` owns `useReducer(heroReducer)`. Every state change is mirrored to `html[data-hero]`, and CSS does the rest (scroll lock, overlay visibility, pre-rise positions, hidden header logo). Every `effect` the reducer emits is run once in a layout effect, then cleared with `EFFECT_DONE`. `FilmOverlay` only knows how to play the film and report what happened.

- [ ] **Step 1: Write the failing Hero tests**

`components/hero/Hero.test.tsx`:

```tsx
import { act, fireEvent, render } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { Hero } from './Hero';

beforeEach(() => {
  document.documentElement.removeAttribute('data-hero');
  document.body.innerHTML = '<a id="site-logo" href="/"></a>';
  sessionStorage.clear();
  vi.mocked(HTMLMediaElement.prototype.play).mockClear();
});

test('rests when the boot script did not ask for the film', () => {
  render(<Hero />);
  expect(document.documentElement.dataset.hero).toBe('rest');
  expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
});

test('plays the film when the boot script chose it, preferring webm at desktop width', () => {
  document.documentElement.dataset.hero = 'film';
  render(<Hero />);
  expect(document.documentElement.dataset.hero).toBe('film');
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
  const video = document.querySelector('video') as HTMLVideoElement;
  expect(video.src).toMatch(/\/media\/iqra-hero-1080\.webm$/);
  expect(video.muted).toBe(true);
  expect(document.activeElement).toBe(document.querySelector('[data-overlay] button'));
});

test('the film ending moves the hero into landing', () => {
  document.documentElement.dataset.hero = 'film';
  render(<Hero />);
  act(() => {
    fireEvent(document.querySelector('video') as HTMLVideoElement, new Event('ended'));
  });
  expect(document.documentElement.dataset.hero).toBe('landing');
});

test('a wheel during the film skips it', () => {
  document.documentElement.dataset.hero = 'film';
  render(<Hero />);
  act(() => {
    fireEvent.wheel(window);
  });
  expect(document.documentElement.dataset.hero).toBe('landing');
});

test('blocked autoplay drops straight to rest and remembers the visit', async () => {
  vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new Error('NotAllowedError'));
  document.documentElement.dataset.hero = 'film';
  render(<Hero />);
  await act(async () => {});
  expect(document.documentElement.dataset.hero).toBe('rest');
  expect(sessionStorage.getItem('iqra:hero-seen')).toBe('1');
});

test('the headline comes from the content file, full stop separate', () => {
  render(<Hero />);
  const lines = document.querySelectorAll('[data-line]');
  expect(lines).toHaveLength(2);
  expect(lines[0].textContent).toBe('Iqra betyr');
  expect(lines[1].textContent).toBe('les.');
  expect(document.querySelector('[data-dot]')?.textContent).toBe('.');
});
```

Run: `npx vitest run components/hero/Hero.test.tsx` → FAIL (module missing).

- [ ] **Step 2: Write the film overlay**

`components/hero/FilmOverlay.tsx`:

```tsx
'use client';

import { useEffect, useRef, type Dispatch, type RefObject } from 'react';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import type { HeroEvent } from './heroMachine';
import styles from './hero.module.css';

/** If `ended` has not arrived this long after playback started, give up (spec §11). */
export const FILM_TIMEOUT_MS = 9000;

type Props = {
  active: boolean;
  dispatch: Dispatch<HeroEvent>;
  overlayRef: RefObject<HTMLDivElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
};

export function FilmOverlay({ active, dispatch, overlayRef, videoRef }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    let raf = 0;
    let timeout = 0;

    const tick = () => {
      if (barRef.current && video.duration > 0) {
        barRef.current.style.transform = `scaleX(${video.currentTime / video.duration})`;
      }
      raf = requestAnimationFrame(tick);
    };
    const skip = (e: Event) => {
      if (e.cancelable) e.preventDefault();
      dispatch({ type: 'SKIP' });
    };

    video.src = pickSource({
      narrow: window.matchMedia('(max-width: 767px)').matches,
      webm: video.canPlayType('video/webm; codecs="vp9"') !== '',
    });
    video.muted = true;
    video.load();
    Promise.resolve(video.play())
      .then(() => {
        if (cancelled) return;
        timeout = window.setTimeout(() => dispatch({ type: 'TIMEOUT' }), FILM_TIMEOUT_MS);
        raf = requestAnimationFrame(tick);
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'AUTOPLAY_BLOCKED' });
      });

    window.addEventListener('wheel', skip, { passive: false });
    window.addEventListener('touchmove', skip, { passive: false });
    window.addEventListener('keydown', skip);
    skipRef.current?.focus({ preventScroll: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
      window.removeEventListener('wheel', skip);
      window.removeEventListener('touchmove', skip);
      window.removeEventListener('keydown', skip);
    };
  }, [active, dispatch, videoRef]);

  return (
    <div ref={overlayRef} className={styles.overlay} data-overlay>
      <video
        ref={videoRef}
        className={styles.video}
        poster="/media/iqra-hero-poster.jpg"
        preload="none"
        muted
        playsInline
        aria-hidden="true"
        onEnded={() => dispatch({ type: 'ENDED' })}
        onError={() => dispatch({ type: 'ERROR' })}
      />
      <div className={styles.bar} aria-hidden="true">
        <div ref={barRef} className={styles.barFill} />
      </div>
      <button ref={skipRef} type="button" className={styles.skip} onClick={() => dispatch({ type: 'SKIP' })}>
        {site.hero.skip}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 2v10M3 8l4 4 4-4" />
        </svg>
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Write the hero**

`components/hero/Hero.tsx`:

```tsx
'use client';

import { useLayoutEffect, useReducer, useRef } from 'react';
import { site } from '@/content/site.no';
import { DUR, EASE, gsap } from '@/lib/gsap';
import { coverRect } from './coverRect';
import { FilmOverlay } from './FilmOverlay';
import { heroReducer, initialMachine } from './heroMachine';
import { FRAME, LOGO_RECT } from './logoRect';
import styles from './hero.module.css';

const SEEN_KEY = 'iqra:hero-seen';

export function Hero() {
  const [m, dispatch] = useReducer(heroReducer, initialMachine);
  const overlayRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const whiteRef = useRef<HTMLDivElement>(null);

  // Adopt the state the boot script chose before first paint (spec §6.2).
  useLayoutEffect(() => {
    if (document.documentElement.dataset.hero === 'film') dispatch({ type: 'INIT', state: 'film' });
  }, []);

  // html[data-hero] drives every state-dependent style.
  useLayoutEffect(() => {
    document.documentElement.dataset.hero = m.state;
  }, [m.state]);

  // The footer asks for a replay with a DOM event; scroll up first, then restart.
  useLayoutEffect(() => {
    const onReplay = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.setTimeout(() => dispatch({ type: 'REPLAY' }), 400);
    };
    window.addEventListener('iqra:replay', onReplay);
    return () => window.removeEventListener('iqra:replay', onReplay);
  }, []);

  // Run the effect the reducer asked for, exactly once.
  useLayoutEffect(() => {
    if (!m.effect) return;
    const white = whiteRef.current;
    const overlay = overlayRef.current;
    const video = videoRef.current;
    if (!white || !overlay || !video) return;
    const logo = document.getElementById('site-logo');
    const lines = Array.from(white.querySelectorAll<HTMLElement>('[data-line]'));
    const dot = white.querySelector<HTMLElement>('[data-dot]');
    const after = Array.from(white.querySelectorAll<HTMLElement>('[data-after]'));

    switch (m.effect) {
      case 'land':
      case 'landFast': {
        // Spec §6.1: t=0 is the film's last frame. Times below are seconds after it.
        const from = coverRect({ w: overlay.clientWidth, h: overlay.clientHeight }, FRAME, LOGO_RECT);
        const tl = gsap.timeline({ defaults: { ease: EASE.out } });
        tl.timeScale(m.effect === 'landFast' ? 2 : 1);
        if (logo) {
          const slot = logo.getBoundingClientRect();
          const scale = slot.width > 0 ? from.w / slot.width : 1;
          gsap.set(logo, { transformOrigin: '0 0', x: from.x - slot.left, y: from.y - slot.top, scale, autoAlpha: 0 });
          tl.to(logo, { autoAlpha: 1, duration: 0.1, ease: 'none' }, 0) // over the frame's own logo
            .to(logo, { x: 0, y: 0, scale: 1, duration: DUR.m }, 0.1); // travels to the header slot
        }
        tl.set(overlay, { backgroundColor: '#ffffff' }, 0.1)
          .set(video, { autoAlpha: 0 }, 0.1)
          .to(overlay, { autoAlpha: 0, duration: DUR.m, ease: EASE.inOut }, 0.1)
          .fromTo(lines, { yPercent: 125 }, { yPercent: 0, duration: DUR.l, stagger: 0.08 }, 0.4)
          .call(() => dispatch({ type: 'LANDED' }), [], 0.8); // scroll unlocks here
        if (dot) tl.fromTo(dot, { scale: 0 }, { scale: 1, duration: DUR.s, ease: EASE.pop }, 0.98);
        tl.fromTo(after, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.08 }, 1.33);
        break;
      }
      case 'abort':
      case 'settle':
        try {
          sessionStorage.setItem(SEEN_KEY, '1');
        } catch {
          // storage can be unavailable; the page still works without the memory
        }
        break;
      case 'replay':
        gsap.set([logo, overlay, video, ...lines, dot, ...after].filter(Boolean) as HTMLElement[], { clearProps: 'all' });
        break;
    }
    dispatch({ type: 'EFFECT_DONE' });
  }, [m.effect]);

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <FilmOverlay active={m.state === 'film'} dispatch={dispatch} overlayRef={overlayRef} videoRef={videoRef} />
      <div ref={whiteRef} className={styles.white}>
        <h1 id="hero-title" className={styles.h1}>
          {site.hero.h1Lines.map((line, i) => (
            <span key={line} className={styles.mask}>
              <span data-line>
                {line}
                {i === site.hero.h1Lines.length - 1 && <span data-dot>.</span>}
              </span>
            </span>
          ))}
        </h1>
        <div className={styles.aside}>
          <p data-after className={styles.lede}>{site.hero.lede}</p>
          <a data-after className={styles.cta} href={`mailto:${site.contact.email}`}>{site.hero.cta}</a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Write the hero styles**

`components/hero/hero.module.css`:

```css
/* ---- film overlay ---------------------------------------------------- */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: var(--color-film-black);
  display: none;
}

:global(html[data-hero="film"]) .overlay,
:global(html[data-hero="landing"]) .overlay {
  display: block;
}

.video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.22);
}

.barFill {
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  transform-origin: 0 50%;
  transform: scaleX(0);
}

.skip {
  position: absolute;
  right: 40px;
  bottom: 28px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
  border: 0;
  background: none;
  color: rgba(255, 255, 255, 0.75);
  font: 500 12px/1 var(--font-mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  opacity: 0;
  animation: skipIn 300ms 1s forwards;
}

.skip:hover {
  color: #ffffff;
}

.skip:focus-visible {
  color: #ffffff;
  outline: 1px solid rgba(255, 255, 255, 0.8);
  outline-offset: 6px;
}

@keyframes skipIn {
  to {
    opacity: 1;
  }
}

/* ---- hero at rest ------------------------------------------------------ */
.hero {
  min-height: calc(max(520px, 58svh) - var(--header-h));
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.white {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: 80px;
  align-items: end;
  padding: 40px var(--margin) 64px;
}

.h1 {
  margin: 0;
  font-size: 120px;
  line-height: 0.94;
  font-weight: 600;
  letter-spacing: -0.045em;
}

/* Each line rises out of its own mask. The padding keeps descenders (q, y)
   inside the mask at rest; 125% below is fully hidden. */
.mask {
  display: block;
  overflow: hidden;
  padding-bottom: 0.12em;
  margin-bottom: -0.12em;
}

.hero [data-line] {
  display: block;
}

.hero [data-dot] {
  display: inline-block;
  color: var(--color-crimson);
  transform-origin: 30% 80%;
}

.aside {
  display: flex;
  flex-direction: column;
  gap: 28px;
  align-items: flex-start;
}

.lede {
  margin: 0;
  font-size: 21px;
  line-height: 1.5;
  color: var(--color-ink-soft);
  max-width: 480px;
  text-wrap: pretty;
}

.cta {
  display: inline-flex;
  align-items: center;
  height: 52px;
  padding: 0 26px;
  border-radius: 999px;
  background: var(--color-navy);
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 300ms var(--ease-out-expo);
}

.cta:hover {
  background: #1f2c3b;
}

/* Pre-rise positions while the film runs and while the landing animation
   takes over; GSAP writes inline styles on top of these. */
:global(html[data-hero="film"]) .hero [data-line],
:global(html[data-hero="landing"]) .hero [data-line] {
  transform: translateY(125%);
}

:global(html[data-hero="film"]) .hero [data-dot],
:global(html[data-hero="landing"]) .hero [data-dot] {
  transform: scale(0);
}

:global(html[data-hero="film"]) .hero [data-after],
:global(html[data-hero="landing"]) .hero [data-after] {
  opacity: 0;
  transform: translateY(24px);
}

@media (min-width: 768px) and (max-width: 1023px) {
  .h1 {
    font-size: 96px;
  }

  .white {
    gap: 48px;
  }
}

@media (max-width: 767px) {
  .skip {
    right: 24px;
    bottom: 24px;
  }

  .white {
    grid-template-columns: minmax(0, 1fr);
    gap: 22px;
    padding: 28px var(--margin) 36px;
  }

  .h1 {
    font-size: 60px;
  }

  .lede {
    font-size: 17px;
    max-width: none;
  }

  .cta {
    width: 100%;
    justify-content: center;
  }
}
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run components/hero/Hero.test.tsx` → Expected: `6 passed`. If the wheel test fails because jsdom's `fireEvent.wheel(window)` is not cancelable, that is fine: the listener guards with `e.cancelable`.

- [ ] **Step 6: Put the hero on the page and look at it**

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

Run `npm run dev` and open `http://localhost:3000` in a browser at ~1440 wide. Check, in order:
1. The film starts on the cave, no page content visible, a thin white line grows along the bottom, «HOPP OVER» appears after a second.
2. At the end the logo appears on white, shrinks up into the top-left, «Iqra betyr / les.» rises with the crimson full stop popping in, then the paragraph and the button.
3. Reload: the page opens at rest, no film. Click «Se filmen igjen» in the footer: it plays again.
4. Reload and scroll immediately: the film skips and the landing runs quickly.
5. Narrow the window below 768 px and reload in a fresh tab: the same, with the 720p source (check in DevTools › Network).
If the logo visibly jumps at the handoff, print `coverRect(...)` and `slot` in the console and compare against the logo in the last frame; the usual cause is a header logo whose `<a>` box is wider than its image.

- [ ] **Step 7: Commit**

```bash
git add components/hero/FilmOverlay.tsx components/hero/Hero.tsx components/hero/hero.module.css components/hero/Hero.test.tsx app/page.tsx
git commit -m "feat: hero film with logo handoff and headline landing

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---
### Task 8: The Stage — Visjon and Misjon over the stills

Implements spec §7, §8 (stage breakpoints), §9 (still loading), §10 (labels).

**Files:**
- Create: `components/stage/step.ts`, `components/stage/step.test.ts`, `components/stage/Stage.tsx`, `components/stage/stage.module.css`, `components/stage/Stage.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `gsap`, `useGSAP`, `EASE` (Task 5); `site` (Task 2); `public/media/still-*.{avif,webp}` (Task 3).
- Produces: `stepForProgress(p: number): 0 | 1`; `<Stage />` with `#visjon`; DOM hooks for e2e: `[data-step="visjon"|"misjon"]`, `[data-still]`, `[data-text]`, `[data-rail][data-active]`.

One DOM, two layouts: the same markup is stacked by CSS on phones and under reduced motion, and layered + pinned by CSS and GSAP on wider screens with motion allowed. `gsap.matchMedia()` only builds the timeline in the second case.

- [ ] **Step 1: Write the failing tests**

`components/stage/step.test.ts`:

```ts
import { expect, test } from 'vitest';
import { stepForProgress } from './step';

test.each([
  [0, 0],
  [0.49, 0],
  [0.5, 1],
  [1, 1],
])('progress %s is step %s', (p, step) => {
  expect(stepForProgress(p)).toBe(step);
});
```

`components/stage/Stage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Stage } from './Stage';

test('both steps render their label and text from the content file', () => {
  render(<Stage />);
  expect(screen.getByText('Visjon')).toHaveAttribute('id', 'visjon-label');
  expect(screen.getByText('Misjon')).toHaveAttribute('id', 'misjon-label');
  expect(screen.getByText(/ikke fra overskrifter/)).toBeInTheDocument();
  expect(screen.getByText(/bygger vi broer/)).toBeInTheDocument();
  expect(document.getElementById('visjon')).toHaveAttribute('aria-labelledby', 'visjon-label misjon-label');
});

test('each step has an avif source, a webp source and a decorative img', () => {
  render(<Stage />);
  const steps = document.querySelectorAll('[data-step]');
  expect(steps).toHaveLength(2);
  steps.forEach((step) => {
    expect(step.querySelector('source[type="image/avif"]')).not.toBeNull();
    expect(step.querySelector('source[type="image/webp"]')).not.toBeNull();
    expect(step.querySelector('img')).toHaveAttribute('alt', '');
  });
  expect(document.querySelector('[data-step="visjon"] img')).toHaveAttribute('loading', 'eager');
  expect(document.querySelector('[data-step="misjon"] img')).toHaveAttribute('loading', 'lazy');
});
```

Run: `npx vitest run components/stage` → FAIL (modules missing).

- [ ] **Step 2: Implement step.ts**

`components/stage/step.ts`:

```ts
/** Which rail step is active for a pin progress in [0, 1]; the crossfade sits at 0.5. */
export function stepForProgress(p: number): 0 | 1 {
  return p < 0.5 ? 0 : 1;
}
```

- [ ] **Step 3: Implement the Stage**

`components/stage/Stage.tsx`:

```tsx
'use client';

import { useRef, useState } from 'react';
import { site } from '@/content/site.no';
import { EASE, gsap, useGSAP } from '@/lib/gsap';
import { stepForProgress } from './step';
import styles from './stage.module.css';

const STEPS = [
  { key: 'visjon', still: 'still-arafat', loading: 'eager', ...site.stage.visjon },
  { key: 'misjon', still: 'still-koran', loading: 'lazy', ...site.stage.misjon },
] as const;

export function Stage() {
  const stageRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState<0 | 1>(0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const q = gsap.utils.selector(stageRef);
        const [stillA, stillB] = q('[data-still] img');
        const [textA, textB] = q('[data-text]');
        // Spec §7: one pinned screen, scrubbed over two screens of scroll.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: stageRef.current,
            start: 'top top',
            end: '+=200%',
            pin: true,
            scrub: 0.6,
            onUpdate: (self) => setStep(stepForProgress(self.progress)),
          },
        });
        tl.fromTo([stillA, stillB], { scale: 1 }, { scale: 1.06, duration: 1, ease: 'none' }, 0)
          .to(textA, { y: -40, autoAlpha: 0, duration: 0.15, ease: EASE.inOut }, 0.35)
          .to(stillA, { opacity: 0, duration: 0.15, ease: EASE.inOut }, 0.35)
          .fromTo(stillB, { opacity: 0 }, { opacity: 0.62, duration: 0.15, ease: EASE.inOut }, 0.35)
          .fromTo(textB, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.15, ease: EASE.out }, 0.5);
      });
      return () => mm.revert();
    },
    { scope: stageRef },
  );

  return (
    <section id="visjon" ref={stageRef} className={styles.stage} aria-labelledby="visjon-label misjon-label">
      {STEPS.map((s) => (
        <article key={s.key} className={styles.step} data-step={s.key}>
          <picture className={styles.still} data-still>
            <source srcSet={`/media/${s.still}.avif`} type="image/avif" />
            <source srcSet={`/media/${s.still}.webp`} type="image/webp" />
            <img src={`/media/${s.still}.webp`} alt="" loading={s.loading} decoding="async" width={1920} height={1080} />
          </picture>
          <div className={styles.text} data-text>
            <span id={`${s.key}-label`} className={styles.label}>{s.label}</span>
            <p className={styles.body}>{s.text}</p>
          </div>
        </article>
      ))}
      <div className={styles.rail} aria-hidden="true">
        {STEPS.map((s, i) => (
          <span key={s.key} data-rail data-active={step === i ? 'true' : 'false'} className={styles.railItem}>
            {s.label}
          </span>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Write the stage styles**

`components/stage/stage.module.css`:

```css
.stage {
  position: relative;
  background: var(--color-night);
  color: #ffffff;
}

.step {
  position: relative;
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

.step::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(14, 22, 32, 0.15) 0%, rgba(14, 22, 32, 0.85) 100%);
  pointer-events: none;
}

.text {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 22px;
  max-width: 900px;
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

.rail {
  display: none;
}

/* Stacked: phones, and anyone who asked for less motion. */
@media (max-width: 767px), (prefers-reduced-motion: reduce) {
  .step {
    aspect-ratio: 4 / 5;
    display: flex;
    align-items: flex-end;
    padding: 24px;
  }

  .text {
    gap: 14px;
  }

  .label {
    font-size: 11px;
  }

  .body {
    font-size: 26px;
  }
}

/* Layered and pinned: the GSAP timeline in Stage.tsx drives these. */
@media (min-width: 768px) and (prefers-reduced-motion: no-preference) {
  .stage {
    height: 100svh;
    overflow: hidden;
  }

  .step {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    padding: 0 var(--margin) 96px;
  }

  .step[data-step="misjon"] .still img,
  .step[data-step="misjon"] .text {
    opacity: 0;
  }

  .rail {
    position: absolute;
    left: var(--margin);
    top: 80px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .railItem {
    display: flex;
    align-items: center;
    gap: 12px;
    font: 500 12px/1 var(--font-mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.4);
    transition: color 300ms var(--ease-out-expo);
  }

  .railItem::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .railItem[data-active="true"] {
    color: #ffffff;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .body {
    font-size: 32px;
  }
}
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run components/stage` → Expected: `6 passed` (4 + 2). GSAP's matchMedia does nothing in jsdom because the mocked `matchMedia` never matches.

- [ ] **Step 6: Add it to the page and look**

In `app/page.tsx` add `import { Stage } from '@/components/stage/Stage';` and render `<Stage />` directly after `<Hero />` inside `<main>`.

Run `npm run dev`. At 1440 wide, after the film: the dark Arafat still is already visible under the headline. Scroll: the stage pins, Visjon lifts away, the Quran fades in, Misjon rises, the rail switches, then the footer arrives. Narrow below 768 px: two stacked 4:5 image blocks with the text at the bottom of each, no rail, no pin. In DevTools, emulate `prefers-reduced-motion: reduce` at desktop width: stacked as well.

- [ ] **Step 7: Commit**

```bash
git add components/stage/step.ts components/stage/step.test.ts components/stage/Stage.tsx components/stage/stage.module.css components/stage/Stage.test.tsx app/page.tsx
git commit -m "feat: pinned visjon and misjon stage over stills from the film

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---
### Task 9: End-to-end scenarios

Implements spec §12 (Playwright). The `desktop` project runs the film and stage scenarios; the `phone` project (Pixel 7, Chromium) runs the stacked-layout scenario. Both are Chromium because Playwright's Chromium plays WebM and its WebKit build on Windows cannot be relied on for video.

**Files:**
- Create: `e2e/hero.spec.ts`, `e2e/stage.spec.ts`

**Interfaces:**
- Consumes: `html[data-hero]`, `[data-overlay]`, `#site-logo`, `[data-step]`, `[data-text]`, `[data-rail][data-active]`, `.pin-spacer` (added by ScrollTrigger when it pins).

- [ ] **Step 1: Write the hero scenarios**

`e2e/hero.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const html = (page: import('@playwright/test').Page) => page.locator('html');

test.describe('hero', () => {
  test('a fresh visit plays the film and lands at rest', async ({ page }) => {
    await page.goto('/');
    await expect(html(page)).toHaveAttribute('data-hero', /film|landing/);
    await expect(page.locator('[data-overlay] video')).toBeVisible();
    await expect(html(page)).toHaveAttribute('data-hero', 'rest', { timeout: 12_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const logo = await page.locator('#site-logo').boundingBox();
    expect(logo).not.toBeNull();
    expect(logo!.y).toBeLessThan(100);
    expect(logo!.x).toBeLessThan(100);
  });

  test('scrolling during the film skips it', async ({ page }) => {
    await page.goto('/');
    await expect(html(page)).toHaveAttribute('data-hero', 'film');
    await page.mouse.wheel(0, 300);
    await expect(html(page)).toHaveAttribute('data-hero', 'rest', { timeout: 4_000 });
  });

  test('the skip button is focused and any key skips', async ({ page }) => {
    await page.goto('/');
    await expect(html(page)).toHaveAttribute('data-hero', 'film');
    await expect(page.getByRole('button', { name: 'Hopp over' })).toBeFocused();
    await page.keyboard.press('Space');
    await expect(html(page)).toHaveAttribute('data-hero', 'rest', { timeout: 4_000 });
  });

  test('a repeat visit in the same tab starts at rest', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Space');
    await expect(html(page)).toHaveAttribute('data-hero', 'rest', { timeout: 4_000 });
    await page.reload();
    await expect(page.locator('[data-overlay]')).toBeHidden();
    await expect(html(page)).toHaveAttribute('data-hero', 'rest');
    expect(await page.evaluate(() => sessionStorage.getItem('iqra:hero-seen'))).toBe('1');
  });

  test('«Se filmen igjen» replays the film', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Space');
    await expect(html(page)).toHaveAttribute('data-hero', 'rest', { timeout: 4_000 });
    await page.getByRole('button', { name: 'Se filmen igjen' }).click();
    await expect(html(page)).toHaveAttribute('data-hero', 'film', { timeout: 3_000 });
    await expect(page.locator('[data-overlay] video')).toBeVisible();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('starts at rest without the film', async ({ page }) => {
    await page.goto('/');
    await expect(html(page)).toHaveAttribute('data-hero', 'rest');
    await expect(page.locator('[data-overlay]')).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
```

- [ ] **Step 2: Write the stage scenarios**

`e2e/stage.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

async function skipFilm(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.keyboard.press('Space');
  await expect(page.locator('html')).toHaveAttribute('data-hero', 'rest', { timeout: 4_000 });
}

test('desktop: the stage pins and steps from Visjon to Misjon', async ({ page, isMobile }) => {
  test.skip(isMobile, 'pinned layout is desktop only');
  await skipFilm(page);
  await expect(page.locator('.pin-spacer')).toHaveCount(1);
  const misjonText = page.locator('[data-step="misjon"] [data-text]');
  await expect(misjonText).toHaveCSS('opacity', '0');
  await expect(page.locator('[data-rail][data-active="true"]')).toHaveText('Visjon');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(misjonText).toHaveCSS('opacity', '1', { timeout: 5_000 });
  await expect(page.locator('[data-rail][data-active="true"]')).toHaveText('Misjon');
});

test('phone: the stage stacks two image blocks and never pins', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'stacked layout is the phone layout');
  await skipFilm(page);
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  const steps = page.locator('[data-step]');
  await expect(steps).toHaveCount(2);
  const a = await steps.nth(0).boundingBox();
  const b = await steps.nth(1).boundingBox();
  expect(a && b && b.y >= a.y + a.height - 1).toBe(true);
  await expect(page.locator('[data-step="misjon"] [data-text]')).toHaveCSS('opacity', '1');
});
```

- [ ] **Step 3: Run them**

Run: `npm run e2e`
Expected: 7 desktop tests pass (6 hero + 1 stage), 7 phone tests pass (the hero ones run on the phone project too; the desktop stage test skips there, the phone stage test skips on desktop).

Likely first-run failures and their fixes:
- "fresh visit" never reaches `rest`: open the trace; if the video never fires `ended`, check the Network tab in the trace for a 404 on `/media/iqra-hero-1080.webm` (Task 3 output missing) — rerun `npm run media`.
- Logo not in the top-left after landing: the `#site-logo` `<a>` box is wider than its image; confirm `width: fit-content` survived in `header.module.css`.
- Phone stage test finds `b.y < a.y + a.height`: the stacked media query is not matching — Pixel 7 is 412 px wide, so `(max-width: 767px)` must apply; check the CSS module compiled the query (no typo in `stage.module.css`).

- [ ] **Step 4: Commit**

```bash
git add e2e/hero.spec.ts e2e/stage.spec.ts
git commit -m "test: end-to-end hero and stage scenarios

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Budgets and the final pass

Implements spec §9 (Lighthouse budget, JS size), §10 (accessibility score), §13 (order of work: last).

**Files:**
- Create: `lighthouserc.json`
- Modify: `.gitignore` (already has `.lighthouseci/`)

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

Lighthouse CI needs a Chrome. If `lhci` cannot find one, set `CHROME_PATH` to Edge for the run: `$env:CHROME_PATH = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"`.

- [ ] **Step 2: Build and read the JS budget**

Run: `npm run build`
Expected: the route table shows `/` with a First Load JS figure. Budget (§9): ≤ 160 kB. If it is over, the only optional weight is GSAP — confirm `lib/gsap.ts` imports `gsap` and `gsap/ScrollTrigger` only (no `gsap/all`).

- [ ] **Step 3: Run Lighthouse**

Run: `npm run lhci`
Expected: both assertions pass on the mobile (default) preset; the report link is printed. If performance is under 0.9, read the report's "Largest Contentful Paint" element: it must be the poster image. If LCP is something else, the `<link rel="preload" as="image">` in `app/layout.tsx` is missing or the poster path is wrong. If Total Blocking Time is the culprit, the film's decode is competing with hydration: in `FilmOverlay.tsx` wrap the `video.src = …; video.load(); video.play()` block in `requestIdleCallback` (fallback `setTimeout(fn, 0)` in Safari) and rerun.

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

Report to the user, in plain words: the URL to run locally (`npm run dev`), the two open items from spec §14 (the `[EPOST]` address; the original logo vector if the trace was rough), the measured Lighthouse scores, and the First Load JS figure. Say explicitly which checks ran and passed, and which were skipped, if any.

---

## Self-review against the spec

- §1 scope → Tasks 6–8 build exactly the header, hero, stage, footer; nothing else.
- §3 tokens → Task 2 (`@theme`), §3 type sizes → Task 7 and Task 8 CSS.
- §4 content → Task 2; components take every string from `site` (Tasks 6–8 tests assert it).
- §5 files → the File structure table; every file appears in exactly one task.
- §6.1 timeline → Task 7 landing timeline (times in the code comments match the spec's seconds after `ended`).
- §6.2 boot → Task 2 layout; §6.3 machine → Task 5; §6.4 maths + measured rect → Tasks 5 and 3; §6.5 source → Tasks 5 and 7.
- §7 stage → Task 8; §8 breakpoints → Tasks 7 and 8 CSS, header in Task 6.
- §9 budgets → Task 3 (asset sizes), Task 10 (LCP, CLS, JS).
- §10 accessibility → Task 6 (logo name), Task 7 (skip focus, decorative video, single h1), Task 8 (labels), Task 10 (score).
- §11 errors → Task 5 (reducer paths), Task 7 (timeout, autoplay, error wiring).
- §12 tests → Tasks 2–8 (unit), Task 9 (e2e), Task 10 (Lighthouse).
- §13 setup → Task 1.
- Type consistency: `HeroEvent` is always a `{ type }` object; `dispatch` is the only thing `FilmOverlay` calls; `LOGO_RECT`/`FRAME` names match between Task 3's generator and Task 7's import; `stepForProgress` returns `0 | 1` and `Stage` stores the same union.
