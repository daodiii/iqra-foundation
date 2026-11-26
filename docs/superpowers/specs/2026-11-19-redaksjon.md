# Spec: Redaksjon, the foundation's own editor

Status: **approved by the owner, 2026-11-19**, with the three recommended choices:
- **Clerk** for login (Q1).
- **Vercel Blob** for PDFs and videos (Q2).
- **A fine-grained GitHub token** for saving (Q3).

The plan is in `tasks/plan.md`.

## Objective

The people at Iqra Foundation write news, events, resources and board members for the website
in an editor that looks as good as the site. It replaces Keystatic's admin. Keystatic stays only
until this is live.

The owner picked mockup **A «Arket»** (2026-11-19). The post is a sheet of paper in the middle:
cover picture and its description, headline, ingress, toolbar, text. A side panel holds what is
not writing: «Vis på nettsiden», date, «Nettadresse», a «Klar for nettsiden» checklist and the card
as it will look on Aktuelt. The start page asks «Hva vil du dele i dag?» and offers three ways
in: Ny nyhet, Nytt arrangement, Ny ressurs. Below them is «Sist endret».

Who uses it: 2 to 5 people from the foundation. They are not developers. They write on a laptop
and sometimes fix something on a phone. Desktop gets the most care, and the phone gets the same
design fitted to the screen, with «Lagre» fixed at the bottom.

Decided by the owner, 2026-11-19:
- Editors log in with a link or code sent to their email. They need no GitHub account.
- It is built now, in its own look. It does not wait for the public redesign.
- PR #84 (Keystatic, lightly branded) is the stopgap until this replaces it.

### What an editor can do (v1)

1. Log in with their email. Only addresses on the foundation's list get in.
2. See the start page: three ways to create a post, and the posts changed most recently.
3. See each section as a list: Nyheter, Arrangementer, Ressurser (Bibliotek), Menneskene bak.
4. Create, edit and delete an entry in each section, with the same fields the site reads today.
   No field is added or removed.
5. Write news text with mid-headings (2 and 3), bold, italic, links, lists, quotes and pictures.
   Every picture asks for its description.
6. Add a cover picture. It is shrunk in the browser before upload and must have a description
   before the post can be saved.
7. Upload a PDF or a video for a resource.
8. See the Aktuelt card update as they type, and open the whole page as it will look.
9. Save. The post goes into the site's files and is on the site after the next build, about
   2 to 3 minutes later. The editor says so in words.
10. For news, keep a post as a draft («Vis på nettsiden» off). Other sections have no draft
    today, and v1 keeps it that way.

Not in v1: roles, scheduled publishing, a history screen, comments, more than one language.

## How it works

```
browser (/redaksjon)            server (Next route handlers)           GitHub repo
 sheet, side panel  ──save──▶   check session → validate → commit ──▶  content/<section>/…
 picture shrunk here           (one commit per save)                   public/opplastet/…
                                                                         │ push
 PDF / video ──────direct upload──▶ file store (see Q2)                 ▼
                                                                    Vercel builds, site live
```

- **Reading** in the editor goes through GitHub's API, so the lists show what was just saved
  and not what the last build carried. The public site keeps reading files at build time
  (`lib/content.ts`, unchanged).
- **Saving** writes the same files Keystatic writes today (`content/collections.ts` is the one
  declaration of paths): `content/nyheter/<slug>/index.json` + `body.mdoc`, and one JSON file
  per entry in the other sections. A post Keystatic wrote opens in the editor, and the reverse.
- **Every save is one commit** to `main`, written by the server with a token kept in Vercel. The
  commit message names the editor's email, for example «Nyhet: Fra kunnskap til handling (ola@…)».
  Every change can be undone from the history.
- **Deleting** is also a commit, so nothing is lost. The editor asks once before it deletes.
- **Pictures** are shrunk in the browser to at most 2000 px wide (WebP) before upload. That
  keeps every request under Vercel's 4.5 MB limit for a server function.
- **Events' and people's pictures** go under `/opplastet/`, as news pictures do. `/media` is
  served as immutable for a year, so a replaced picture there would stay stale. Their entries
  keep their paths, so the readers need no change.

## Tech stack

- Next 16.3.4 (App Router; this repo's Next differs from training data, so read
  `node_modules/next/dist/docs/` before each new API), React 19.2, TypeScript, CSS Modules
  (the site's pattern).
- New dependencies, approved with this spec:
  - TipTap (ProseMirror) for the text, with Markdown in and out
  - `jose` for the session cookie, if the login service does not hand us one
  - the login service's SDK (Q1)
  - the file store's SDK (Q2)
- Fonts: General Sans and Supreme from `brand/fonts/`, as on the site.

## Commands

```
Dev:        npm run dev            (http://localhost:3001/redaksjon, see .claude/launch.json)
Build:      npm run build
Start:      npm run start          (check behaviour here, not under next dev)
Unit tests: npx vitest run
E2E:        npx playwright test
Types:      npx tsc --noEmit
Lint:       npx eslint
```

## Project structure

```
app/redaksjon/                 the editor's pages (own layout, no site header or footer)
  (innlogget)/                 everything behind the login
  logg-inn/                    the email step
app/api/redaksjon/             route handlers: list, read, save, delete, upload, session
components/redaksjon/          Sheet, SidePanel, Toolbar, CardPreview, Checklist, lists, start page
lib/redaksjon/                 github.ts (read/commit), schema.ts (fields per section, validation),
                               session.ts, markdown.ts, image.ts (browser shrink)
e2e/redaksjon.spec.ts          the editor end to end, against a fake GitHub
docs/superpowers/specs/        this spec; the plan goes to tasks/plan.md
```

## Code style

Matches the repo: a doc comment that says why, Norwegian copy in one place, named exports.

```ts
/** A news post as the editor holds it. Saved as `content/nyheter/<slug>/index.json` + `body.mdoc`. */
export type Nyhet = {
  title: string;
  date: string; // YYYY-MM-DD
  summary: string;
  image: { src: string; alt: string } | null;
  publish: boolean;
  body: string; // Markdown, the subset the site's renderer reads
};

/** What still stands between the post and the site, in the editor's words. Empty means ready. */
export function missing(n: Nyhet): string[] {
  const out: string[] = [];
  if (!n.title.trim()) out.push('Overskrift');
  if (!n.summary.trim()) out.push('Ingress');
  if (n.image && !n.image.alt.trim()) out.push('Bildebeskrivelse');
  return out;
}
```

## Testing strategy

- **Unit (vitest):**
  - each section's schema and validation
  - a post round-trips: the files a save writes read back through `lib/content.ts` as the same post
  - Keystatic's existing files open unchanged
  - the Markdown round-trip for every format the toolbar offers
  - picture shrinking stays under the size limit
- **Route handlers (vitest):**
  - no session gives 401 on every route
  - an address not on the list gives 403
  - a save makes exactly one commit with the expected paths (GitHub mocked)
  - a slug cannot climb out of its folder (`../`)
- **E2E (playwright, production build):**
  - log in (test mode), write a news post with a picture, save, see it in «Sist endret»
  - edit it, delete it
  - the same on a 390 px phone with «Lagre» on screen
  - no sideways scroll at 1440, 1024, 390 and 320
- **By eye:** screenshots at 1440 and 390 of every screen, set against mockup A.

## Boundaries

- **Always:**
  - check the session on every route
  - check every field on the server, not only in the browser
  - write paths only from `content/collections.ts`
  - keep the site's readers working
  - run the unit tests, types and e2e before each commit
  - stage explicit paths
- **Ask first:**
  - removing Keystatic
  - a dependency beyond the ones listed above
  - changing a field the site reads
  - adding drafts to sections other than news
  - anything that changes the public site
- **Never:**
  - put a token or secret in the browser or in the repo
  - type a secret into any field (the owner pastes those)
  - let an editor's text run as HTML
  - push to `main` except through a PR the owner approves

## Success criteria

1. An address on the list can log in from a laptop and from a phone. Any other address gets
   «Du har ikke tilgang» and no session.
2. A news post written in the editor shows on /aktuelt within 5 minutes of «Lagre», with its
   picture, description, ingress and text, laid out as today.
3. A post with «Vis på nettsiden» off is saved but does not show on the site.
4. A post saved by Keystatic opens in the editor, and a post saved by the editor opens in
   Keystatic, with no field lost.
5. Each save is exactly one commit, and its message names the editor.
6. The writing screen at 1440 and 390 matches mockup A. The owner judges this by eye.
7. No sideways scroll at 1440, 1024, 390 and 320.
8. The first screen of the writing page is usable within 2 s on the owner's laptop.
9. Every unit and e2e test passes, and `tsc` and the linter are clean.

## Setup choices (answered 2026-11-19: Clerk, Vercel Blob, fine-grained token; Q4 at setup)

- **Q1 · Login service.** The foundation has no own email domain (the site's address is
  `iqrafoundation25@gmail.com`). A mail service like Resend can then only send to the account
  owner, so a home-made email link would not reach other editors. Two ways that work without
  a domain:
  - **Clerk (recommended):** a managed login with an email code or link. It is free at this
    size, and its screen can be styled to match the editor. The owner creates the account and
    pastes two keys into Vercel.
  - **Supabase Auth:** free, but its built-in mailer allows only a few emails an hour unless an
    SMTP sender is added.
- **Q2 · Where PDFs and videos go.** A server function takes at most 4.5 MB, and videos are
  bigger.
  - **Vercel Blob (recommended):** the browser uploads straight to it, so the 4.5 MB limit does
    not apply. Hobby includes a free allowance (its size and per-file limit to be confirmed at
    setup), and the owner switches it on in Vercel.
  - **The repo:** keep PDFs and videos in the repo and refuse files over 4.5 MB.
- **Q3 · The token that saves.** Saving needs a GitHub token. It is a fine-grained token with
  «Contents: read and write» on this one repository, created by the owner and pasted into Vercel.
  The other choice is a GitHub App, which is more work to set up and lets commits show the
  app's name.
- **Q4 · Who gets in at the start.** A list of email addresses, kept in the login service.
  The owner names them at setup.
