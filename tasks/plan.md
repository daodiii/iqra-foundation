# Implementation Plan: Redaksjon (mockup A «Arket»)

Spec: `docs/superpowers/specs/2026-11-19-redaksjon.md` (approved 2026-11-19).
Task list: `tasks/todo.md`.

## Overview

A custom editor at `/redaksjon` for news, events, resources and board members. Editors log in
through Clerk, write on the Arket sheet, and save straight into the content files the site
already reads. Each save is one commit to `main`, and Vercel rebuilds the site. PDFs and videos
go to Vercel Blob.

## Architecture decisions

- **One store interface, two backends.** `store.ts` offers `list`, `read`, `save` and `remove`.
  - `LocalStore` writes this checkout's files. It is used by `next dev` and by e2e, so nothing
    needs a token or the network.
  - `GitHubStore` makes one commit per save through GitHub's Git Data API. It is used in
    production.

  The site's readers (`lib/content.ts`) are not touched.
- **One schema per section** in `schema.ts`: its fields, server-side validation, and the mapping
  to and from files. Paths come only from `content/collections.ts`. Tests prove that files the
  editor writes read back through `lib/content.ts`, and that Keystatic's files open.
- **Two locks on access.**
  1. Clerk's session, checked in `proxy.ts` (Next 16's name for middleware) and again in every
     route handler.
  2. The server's own `EDITOR_EMAILS` list.

  An address must pass both.
- **An auth seam for dev and e2e.** `currentEditor()` returns a fixed test editor only when
  `REDAKSJON_TEST_EDITOR` is set and the build is not production. A unit test proves a
  production build ignores it.
- **Off until configured.** In production, `/redaksjon` and its API are a 404 until the Clerk
  keys, `EDITOR_EMAILS` and the GitHub token are all present (the same rule as
  `lib/keystatic.ts`). Merging therefore changes nothing on the live site.
- **Markdown for article text.** TipTap holds the text and converts it to and from the Markdown
  subset that `body.mdoc` already contains (headings 2 and 3, bold, italic, links, lists,
  quotes, pictures).
- **Pictures** are shrunk in the browser to WebP of at most 2000 px wide, then committed under
  `/opplastet/<section>/`. They never go under `/media`, which is cached for a year.
- **Concurrent saves.** The commit is made against the branch head it read. If `main` moved,
  the store rebases once onto the new head when the paths don't overlap. If they do overlap, it
  tells the editor someone else changed the post.

## Task list

### Phase 1: Foundation
- [x] T1 Section schemas and file mapping
- [x] T2 The store: local and GitHub
- [x] T3 Login: Clerk, proxy, the email list, the test seam, the login screen

### Checkpoint 1: foundation
- [x] vitest (481), tsc and lint clean; `npm run build` passes without the editor's env vars
- [x] /redaksjon, /redaksjon/logg-inn and /api/redaksjon/* are 404 in a production build without keys; / and /aktuelt 200
- [x] Under `next dev` with the test editor, /redaksjon serves and /redaksjon/logg-inn forwards to it
- [ ] Not yet verified: the Clerk path itself (needs the owner's keys, at setup)

### Phase 2: News, end to end
- [x] T4 API routes for sections (list, read, save, delete), checked and validated
- [x] T5 The shell and start page (rail, «Hva vil du dele i dag?», «Sist endret»), phone top bar
- [x] T6 The writing sheet: headline, ingress, TipTap text and toolbar, Markdown out
- [x] T7 The side panel and saving: «Vis på nettsiden», date, «Nettadresse», checklist, card
      preview, «Lagre» with status, the phone save bar
- [x] T8 Pictures: the cover with its description, pictures in the text, shrink and upload

### Checkpoint 2: a news post goes from editor to page
- [x] e2e: log in (test seam), write, add a picture, save, see it in «Sist endret», edit, delete
- [ ] Saved files render on /aktuelt in a production build
- [ ] Screenshots at 1440 and 390 shown to the owner against mockup A

### Phase 3: The other sections
- [x] T9 Arrangementer in the Arket layout
- [x] T10 Menneskene bak
- [x] T11 Ressurser, with PDF and video through Vercel Blob
- [x] T12 Section lists, and delete with one confirmation

### Checkpoint 3: complete
- [ ] e2e for every section at 1440, 1024, 390 and 320; no sideways scroll
- [ ] Code review (Addy's `code-reviewer`) and security review (`security-auditor`) on the branch

### Phase 4: Live
- [x] T13 README «Redaksjon» setup steps; the PR (not merged without the owner's word)
- [ ] The owner sets up Clerk, Blob, the token and `EDITOR_EMAILS`; then a live test post
- [ ] Ask: remove Keystatic and its postinstall now?

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Clerk on Next 16's `proxy.ts` behaves unlike its docs | High | T3 goes first; a production build plus a route test prove the gate before any UI |
| Vercel's 4.5 MB body limit | High | Pictures shrunk in the browser; PDF and video go directly to Blob; a test checks the shrink's output size |
| TipTap Markdown loses something on the round-trip | Med | A round-trip test for every toolbar format, and for every existing `body.mdoc` |
| Two editors save at once | Med | A head check with one rebase; on conflict, a clear message and nothing overwritten |
| Every save triggers a Vercel build; Hobby has a daily deployment cap | Low | Expected volume is a few saves a day; a draft save still costs a build, which the README states |
| A token in the wrong place | High | The token is read only in server code; a test greps the client bundle for env names |
| Editors get stuck on the 2–3 minute wait | Low | After «Lagre», the editor says when the post will be on the site |

## Open questions

None blocking. Q4 (who gets in) is answered at setup.
