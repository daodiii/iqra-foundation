# Redaksjon: tasks

Plan: `tasks/plan.md` · Spec: `docs/superpowers/specs/2026-11-19-redaksjon.md`

Every task is done only when all of these pass:
- `npx vitest run`
- `npx tsc --noEmit`
- `npx eslint`
- `npm run build`, with and without the editor's env vars

Commits stage explicit paths.

## Phase 1: Foundation

## Task 1: Section schemas and file mapping
**Description:** `lib/redaksjon/schema.ts` defines the four sections (nyheter, arrangementer,
ressurser, menneskene) with the fields the site reads today. It holds server-side validation in
Norwegian words, and the mapping from an entry to its files and back, with paths taken from
`content/collections.ts`. It also holds the `missing()` checklist.

**Acceptance criteria:**
- [ ] An entry written by the mapping reads back through `lib/content.ts` as the same entry
      (every section).
- [ ] Every existing file under `content/` (Keystatic's and hand-written) maps in and out
      unchanged.
- [ ] A slug with `/`, `\`, `..` or non `[a-z0-9-]` characters is refused.

**Verification:** `npx vitest run lib/redaksjon/schema.test.ts`
**Dependencies:** none
**Files:** `lib/redaksjon/schema.ts`, `lib/redaksjon/schema.test.ts`, `lib/redaksjon/slug.ts`
**Scope:** M

## Task 2: The store, local and GitHub
**Description:** `lib/redaksjon/store.ts` defines the interface. `LocalStore` writes this
checkout. `GitHubStore` reads through the API and saves one commit per save (tree + commit +
ref update), retrying once against a moved head when the paths don't overlap.

**Acceptance criteria:**
- [ ] A save of N files makes exactly one commit containing exactly those paths (mocked fetch).
- [ ] A moved head with overlapping paths gives a «changed by someone else» error and writes
      nothing.
- [ ] The token is read only in this server module (`import 'server-only'`).

**Verification:** `npx vitest run lib/redaksjon/store.test.ts`
**Dependencies:** T1
**Files:** `lib/redaksjon/store.ts`, `lib/redaksjon/github.ts`, `lib/redaksjon/local.ts`,
`lib/redaksjon/store.test.ts`
**Scope:** M

## Task 3: Login
**Description:**
- Install `@clerk/nextjs`.
- `proxy.ts` guards `/redaksjon` and `/api/redaksjon`.
- `currentEditor()` checks Clerk's session and `EDITOR_EMAILS`.
- The test seam works only outside production.
- `/redaksjon/logg-inn` is Clerk's sign-in styled as Arket.
- «Du har ikke tilgang» covers an address that is not on the list.
- The editor is off (404) in production until it is configured.

**Acceptance criteria:**
- [ ] A production build without keys answers 404 on /redaksjon and /api/redaksjon/\*.
- [ ] A route test: no session gives 401, an address off the list gives 403, and a listed one
      passes.
- [ ] The test seam is ignored when `NODE_ENV=production` (unit test).

**Verification:**
- `npx vitest run lib/redaksjon/session.test.ts`
- `npm run build && npm run start`, then curl /redaksjon

**Dependencies:** none (parallel to T1–T2)
**Files:** `proxy.ts`, `lib/redaksjon/session.ts`, `lib/redaksjon/enabled.ts`,
`app/redaksjon/layout.tsx`, `app/redaksjon/logg-inn/[[...rest]]/page.tsx`
**Scope:** M

### Checkpoint 1
- [ ] All checks pass, and production without keys gives 404.
- [ ] Under `next dev` the login screen shows.

## Phase 2: News, end to end

## Task 4: API routes
**Description:** `app/api/redaksjon/[section]/route.ts` (list, create) and
`[section]/[slug]/route.ts` (read, save, delete). Each one checks `currentEditor()`, validates
with T1, and saves through T2. The commit message reads «Nyhet: <title> (<email>)».

**Acceptance criteria:**
- [ ] Every route returns 401/403 per T3.
- [ ] An invalid entry gives 422 with the field names.
- [ ] A save returns the new state and «på nettsiden om ca. 2–3 minutter».

**Verification:** `npx vitest run app/api/redaksjon`
**Dependencies:** T1, T2, T3
**Files:** the two route files and their tests, `lib/redaksjon/api.ts` (browser client)
**Scope:** M

## Task 5: The shell and start page
**Description:**
- The rail: the mark, «Redaksjon», «Skriv nytt», Oversikt, and the groups Aktuelt / Ressurser /
  Om oss with counts.
- The start page: «Hva vil du dele i dag?», three ways in, and «Sist endret» with each post's
  status.
- Phone: a top bar with a menu sheet.
- Tokens, fonts and icons shared in `components/redaksjon/`.

**Acceptance criteria:**
- [ ] It matches mockup A at 1440 and 390 (screenshots).
- [ ] «Sist endret» lists real entries from the store, newest first.
- [ ] No sideways scroll at 320.

**Verification:** screenshots, plus `npx vitest run components/redaksjon`
**Dependencies:** T4
**Files:** `app/redaksjon/(innlogget)/layout.tsx`, `page.tsx`, `components/redaksjon/Rail.tsx`,
`Start.tsx`, `redaksjon.module.css`
**Scope:** M

## Task 6: The writing sheet
**Description:** `components/redaksjon/Sheet.tsx`:
- The headline as a large field and the ingress below it.
- TipTap with the toolbar (H2/H3, bold, italic, link, list, quote, picture, undo), with Markdown
  in and out.
- The toolbar stays in view while the editor scrolls.

**Acceptance criteria:**
- [ ] Each toolbar format round-trips through Markdown.
- [ ] Every existing `body.mdoc` round-trips unchanged.
- [ ] Pasting HTML keeps only the allowed formats.

**Verification:** `npx vitest run components/redaksjon/Sheet.test.tsx lib/redaksjon/markdown.test.ts`
**Dependencies:** T5
**Files:** `Sheet.tsx`, `Toolbar.tsx`, `lib/redaksjon/markdown.ts`, and tests
**Scope:** M

## Task 7: The side panel and saving
**Description:**
- The «Vis på nettsiden» switch, with its line saying what Av means.
- Date, and «Nettadresse» (made from the title until edited).
- «Klar for nettsiden» from `missing()`.
- The live Aktuelt card preview and «Hele siden» (the post page in a panel).
- «Lagre» with the states saving / saved hh:mm / error, plus a leave-without-saving guard.
- Phone: the panel follows the sheet, and the save bar stays at the bottom.

**Acceptance criteria:**
- [ ] «Lagre» is disabled with the reason shown while `missing()` is not empty.
- [ ] A saved post appears in «Sist endret» with its status.
- [ ] An error keeps the text, says what happened, and offers to try again.

**Verification:** component tests, then the T8 e2e
**Dependencies:** T6
**Files:** `SidePanel.tsx`, `CardPreview.tsx`, `Checklist.tsx`, `SaveBar.tsx`,
`app/redaksjon/(innlogget)/nyheter/[slug]/page.tsx`
**Scope:** M

## Task 8: Pictures
**Description:**
- `lib/redaksjon/image.ts` shrinks the picture in the browser (canvas to WebP, at most 2000 px).
- Upload goes through the save (the files ride in the same commit). If a save with its pictures
  would pass 4 MB, each picture goes up in its own request first (its own commit), and the post
  follows.
- The cover with its description field; «Bytt bilde».
- A picture in the text asks for its description before it is inserted.

**Acceptance criteria:**
- [ ] A 6000 px photo becomes ≤ 2000 px WebP under 1.5 MB.
- [ ] A post can't be saved with a picture that lacks a description.
- [ ] Pictures land under `/opplastet/nyheter/<slug>/`.

**Verification:** unit test plus `e2e/redaksjon.spec.ts` (news flow)
**Dependencies:** T7
**Files:** `image.ts`, `Cover.tsx`, `e2e/redaksjon.spec.ts`, `Sheet.tsx`
**Scope:** M

### Checkpoint 2
- [ ] e2e news flow passes on a production build (test seam plus LocalStore).
- [ ] The saved post renders on /aktuelt.
- [ ] Shots at 1440 and 390 sent to the owner.

## Phase 3: The other sections

## Task 9: Arrangementer
Fields:
- Tittel
- Dato
- Klokkeslett
- Sluttdato
- Sted
- Beskrivelse
- Påmelding
- Program
- Referat
- Opptak
- Bilde + beskrivelse

The headline and the description sit on the sheet; dates, place and links sit in the panel.
There is no draft (spec).
**Acceptance:** create, edit and delete; the file reads back through `getEvents()`; the
shots match the Arket style.
**Dependencies:** T8 · **Scope:** M

## Task 10: Menneskene bak
Fields: Navn, Rolle, Bilde + beskrivelse, Kort biografi, Rekkefølge.
**Acceptance:** edit the five existing people without loss; a new person shows on
/menneskene-bak in order.
**Dependencies:** T8 · **Scope:** S

## Task 11: Ressurser with Vercel Blob
Fields: Tittel, Kategori, Dato, Sammendrag, and one of Fil, Video or Lenke. PDF and video upload
straight from the browser to Blob (`@vercel/blob/client` plus a token route that checks
`currentEditor()`). LocalStore mode writes to `public/files/ressurser/` instead.
**Acceptance:** a 20 MB video uploads; a resource needs one of file, video or link; the
category list is the client's four.
**Dependencies:** T8 · **Scope:** M

## Task 12: Section lists and deleting
A list page per section, with search and the filter Alle / På nettsiden / Utkast (news only).
Delete asks once, names the post, and says the change can be undone from the history.
**Acceptance:** lists show every entry; a delete removes exactly the entry's files in one
commit.
**Dependencies:** T9–T11 · **Scope:** M

### Checkpoint 3
- [ ] e2e for every section at 1440, 1024, 390 and 320; no sideways scroll.
- [ ] Reviews by `code-reviewer` and `security-auditor`; findings fixed or listed.

## Phase 4: Live

## Task 13: Setup guide and PR
- README «Redaksjon»:
  - create the Clerk app and turn off open sign-up
  - paste the keys into Vercel
  - set `EDITOR_EMAILS`
  - switch on Blob
  - create the fine-grained token (Contents RW, this repo)
  - redeploy
  - post a test
- The PR, with base main and the `pr` body, is not merged without the owner's word.

**Dependencies:** Checkpoint 3 · **Scope:** S

- [ ] The owner sets it up and a live test post goes through.
- [ ] Ask: remove Keystatic and `scripts/keystatic-norsk.mjs`?
