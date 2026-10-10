# Innlegg — design

2026-10-10. Status: agreed with the owner section by section in chat; awaiting their review of
this document before the implementation plan.

## Where this comes from

The owner asked how the foundation would make, edit and publish articles, news and events on
the site, and whether that meant connecting something like Sanity. It does not: Keystatic has
been in the site since PR #35 (local mode only). The owner's answers, 2026-10-10:

- **GitHub sign-in** for the editors, not Keystatic Cloud.
- **Add news and articles**, and build events, news and articles «in the same thing or close
  to the same thing, so everything is built together».
- **News shows on the Arrangementer page**; articles live under Ressurser, where the brief
  already puts them («Under Ressurser skal vi kunne samle publikasjoner, artikler, …»). The
  menu keeps the brief's nine items.
- **A draft switch**: a post is saved without being shown until «Publiser» is ticked.
- **The repo stays public** (see Publishing for why private is not free).

«Built together» is read as: one way of writing, one page design, one place in the editor —
while each kind keeps its own place on the site, because an event points forward and goes
stale the day after, and news and articles point back and stay.

## The editor

`/keystatic`, signed in with GitHub. The sidebar is grouped (`ui.navigation`):

- **Innlegg** — Arrangementer · Nyheter · Ressurser
- **Stiftelsen** — Menneskene bak · Styringsdokumenter

Three collections, not one with a type switch: a single collection would have had to absorb
Ressurser's PDFs, reports and videos too.

### The shared fields (all three Innlegg collections)

| Key | Label | Rule |
|---|---|---|
| `title` | Tittel | required; the slug comes from it |
| `start` / `date` | Dato | required (`start` on events, as now; `date` on the others) |
| `image` | Bilde | optional; a picture cannot be saved without its description (below) |
| `area` | Område | one of the four, or none (as now) |
| `summary` | Sammendrag | required; the short text on cards and lists |
| `body` | Brødtekst | optional; full text — headings (h2, h3), bold, italic, links, bullet and numbered lists, quotes, pictures, divider. No tables, no code blocks |
| `publish` | Publiser på nettsiden | checkbox, default unticked |

**Picture and description together.** `image` becomes
`fields.conditional(fields.checkbox({ label: 'Bilde' }), { true: fields.object({ src: fields.image({ validation: { isRequired: true } }), alt: fields.text({ validation: { isRequired: true } }) }), false: fields.empty() })`,
so the form itself refuses a picture without words. The site's reader accepts both this shape
and the plain `{ src, alt }` that hand-written files and Menneskene use.

### What each collection adds

- **Arrangementer** keeps `time`, `end`, `place` (required), `link` (labelled «Påmeldingslenke»).
  Its `text` field becomes `summary`.
- **Nyheter** is new: the shared fields only. Pictures under `public/media/nyheter/`.
- **Ressurser** keeps `kind`, `file`, `url`. «Enten fil eller lenke» loosens to «a file, a
  link, or a full text»: a resource with a `body` is an article written on the site. A resource
  with none of the three is a broken record (see the reading layer).

### Storage

The three Innlegg collections move to the folder layout (`path: 'content/<name>/*/'`), so a
post is a folder: `content/<name>/<slug>/index.json` for the fields and
`content/<name>/<slug>/body.mdoc` for the full text when there is one. Pictures inside the
full text go under `public/media/<name>/`. Menneskene and Styringsdokumenter stay flat
(`<slug>.json`) and are not touched.

The one existing event moves from `content/arrangementer/<slug>.json` to
`content/arrangementer/<slug>/index.json`, `text` renamed `summary`, `"publish": true` added.
Ressurser is empty. The collections' `README.md` files and the README's «Content» section are
updated to the new shape.

**Proved before anything reads it:** the plan's first task runs the admin in local mode and
creates one entry of each kind with a picture, a full text and a picture inside the full text,
and records the exact files and JSON it writes — as was done for Keystatic in September
(memory: keystatic-on-next-16). The readers are written against those files, not against this
paragraph.

## What visitors see

**Arrangementer** (`/arrangementer`): Kommende, then **Nyheter** (newest first), then
Tidligere. Title and menu label unchanged. Nyheter has its own honest empty line,
«Ingen nyheter er publisert ennå.», in the pattern of the other two.

**Ressurser** (`/ressurser`): one list as now. An entry with a full text links to its own
page; the rest link to the file or the outside link, as now.

**A page for every post with a full text:** `/arrangementer/<slug>`, `/nyheter/<slug>`,
`/ressurser/<slug>`. One layout for all three, in the subpages' plain style
(`page.module.css`): a link back to the list, the title (a plain `h1`, not a `PageTitle`
morph — two titles with one morph name on a page is a React error), the date, the area mark,
the picture, the full text. An event's page adds time, place and the sign-up link. A post
without a full text has no page; its card is the whole post. `/nyheter` alone redirects to
`/arrangementer#nyheter`. Unknown slugs and drafts are 404 (`dynamicParams = false`).

**Cards** link to the post's page when it has one; otherwise as today (an event's title links
to its sign-up link when it has one).

**Pictures** — the post's own and those in its full text — are served resized through Next's
image optimiser, with their dimensions read at build so nothing jumps while loading. (Next 16
differs from earlier versions: read `node_modules/next/dist/docs/` before writing the code.)

**Drafts** appear on no list and no page, and do not count toward the home page's next event.

**The home page does not change.**

## The reading layer

`lib/content.ts` stays the one door. Its readers learn the folder layout for the three
Innlegg collections, read `body.mdoc` when it exists, and return only entries with
`"publish": true` — an entry without the key is a draft, so a checkbox Keystatic leaves out
can never publish by accident. The full text is parsed with `@markdoc/markdoc` (added as a
direct dependency at the version Keystatic uses, `^0.4`) and rendered to React on the server.

**A broken entry no longer stops the build.** Today a record that is not what its type says
throws and fails the build. Once editors save straight to `main`, one bad save would freeze
every later update, and the editor would never see why. So, for all five collections: a bad
record is left off the site and named, with its file and field, in a warning in the build
log; the rest of the site builds. The strictness moves to the tests: a unit test reads the
real `content/` and fails if any record is skipped, so our own mistakes are still caught
before a PR.

## Publishing

**What a save does:** a commit on `main` by the editor's GitHub account; Vercel rebuilds; the
change is live in about one to two minutes. A draft's save rebuilds too and shows nothing.

**Switching on GitHub mode.** `keystatic.config.ts` and `lib/keystatic.ts` already switch on
`KEYSTATIC_GITHUB_CLIENT_ID`. The steps that need the owner's logins, which the owner does
and the plan writes out as a checklist:

1. Create the GitHub App from Keystatic's setup screen, signed in as the repo's owner.
2. Paste its four values into Vercel (`KEYSTATIC_GITHUB_CLIENT_ID`,
   `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`).
3. Add each editor to the repo on GitHub.
4. Redeploy, then sign in at `/keystatic` on the live site and publish a test post.

**A guide for the editors**, in plain Norwegian: `docs/slik-publiserer-du.md` — signing in,
making an event, a news item and an article, the picture and its description, the Publiser
box, how long until it is live, and what to do when it does not show.

**The repo stays public.** Drafts never reach the site, but anyone browsing the repo on GitHub
can read them; nothing secret goes in a draft. Private is not free: Keystatic commits as the
editor, and Vercel's Hobby plan blocks deploys from a private repo when the commit author is
not the account owner — a private repo needs Vercel Pro with each editor as a member.

## Testing

- **Unit (Vitest):** the folder layout; the conditional picture shape and the plain one;
  drafts hidden; a broken record skipped and warned, the rest returned; the full text parsed
  and rendered (headings, links, a picture); the real-content test that fails on any skip.
- **End to end (Playwright):** a news item on Arrangementer between Kommende and Tidligere; a
  post's page opened from its card; a draft's address and an unknown slug both 404;
  `/nyheter` lands on the news section.
- **The real editor**, local mode, in a hidden browser: create an event, a news item and an
  article, each with a picture and a full text with a picture in it; check the files written
  and each post on the built site.

## Held — not in this build

- The latest news on the home page.
- A design round (mocks) for the post pages; they ship in the subpages' plain style.
- A draft switch for Menneskene bak and Styringsdokumenter.
- Keystatic Cloud (email sign-in) instead of GitHub accounts.
