# Støtt oss: the rebuild

Date: 2026-09-09
Status: approved design, not yet implemented
Scope: the Støtt oss section of the landing page. Not the payment integration.

## The complaint

Asked what was wrong with the section, the answer was **the whole thing** — named
explicitly: the layout, the amount tiers, the one-time/monthly toggle, and the ask itself.
It was agreed then that this is a rebuild rather than a restyle, and that it would be
brainstormed before any code.

Shown a first design, the response sharpened it: the title was "a small portion, and then
a lot of empty space". Three instructions followed — make the title use the entire width,
push the three numbers up under it, and make the box underneath bigger — and one standard:
"all of these needs to be special in some way. It needs to look, like, really nice."

## What is there now

A centred stack on a full-bleed night ground:

| element | behaviour |
| --- | --- |
| ground | `#0e1620`, the only dark section after the hero |
| drape | canvas, `mode: 'field'`, `palette: 'deep'`; its cover spreads as the amount rises |
| amount | the chosen tier in ~120px type — the largest thing on the page |
| outcome | `[10 samtaler på stand]` — a placeholder, and every tier's is |
| toggle | «Én gang» / «Hver måned», deciding both the copy and which second route is offered |
| tiers | 100 / 250 / 500 / 1 000 / 2 500, one-off money |
| pay | one orange Vipps button, with nowhere to go |
| alt | «Eller overfør til konto» / «Eller sett opp AvtaleGiro», a disclosure |
| tax | the skattefradrag paragraph, small and last |

The section reads as a checkout: it goes from the words «Støtt oss» straight to «250 kr»
without ever asking for anything.

## Decisions

Each of these was a choice between named alternatives. What was *not* chosen is recorded
because it is evidence too.

| # | Decision | Chosen | Rejected |
| --- | --- | --- | --- |
| 1 | What the section is for | **Be one of the people** — a membership framing, monthly as the default | the close of the page's story; a list of named things the money buys; a faster checkout |
| 2 | What the givers are called | **«fast giver»**, no membership, no coined name | a named circle; a real medlemskap |
| 3 | What leads visually | **The people, not the sum** | the giant number at monthly size; one suggested amount; a free-entry field |
| 4 | Where the single gift lives | **The toggle is deleted.** Two buttons, one primary — later overtaken by (7); see below | monthly only with a link; a demoted toggle |
| 5 | The ground | **A colour box on white**, like Visjon and Misjon. No night section | staying full-bleed night; a dark panel inset like the others |
| 6 | Monthly amounts | **200 / 300 / 500 / 1 000**, with 300 preselected | 100/200/300/500; 50/100/250/500 |
| 7 | «Pay on the website» | **Design it, wire it later** | Vipps ePayment now; Stripe; linking out to a hosted page |
| 8 | The arrangement | **Title full width, three numbers under it, one bigger box under those** | copy left with a card on the right |
| 9 | The treatment | **The ramp washed into the three boxes** | the ramp as a drawn rule along each box's top edge |

On (4) and (7) together: the two buttons were the answer while payment was assumed to be
coming. Once (7) landed on «design it, wire it later», a primary button with nothing behind
it stopped being honest, and the big box gives that space to the Vipps QR instead. The
decision that survives from (4) is the one that was actually asked for — **the toggle is
gone** — and the single gift now lives in the same three route boxes as everything else,
since a bank transfer is a single gift by nature. When payment is wired, «Bli fast giver»
and «Gi én gang» return as the two buttons in the big box.

On (2): Iqra's legal form is nowhere in the site's copy — Om oss mentions a styre and
frivillige and nothing else. A *stiftelse* has no members at all, so «medlem» could not be
used without knowing. «Fast giver» is true either way and promises nothing to administer.

On (6): the site's own copy claims skattefradrag on gifts between 500 and 25 000 kr a
year, so every tier here clears the floor several times over. That claim is itself
conditional — see **Still unresolved**.

## The design

### The box

The section becomes an inset colour box on white, using the same `--box-inset-x/y`,
`--box-radius`, `--margin` and `--wash-image` that Visjon and Misjon already resolve from
`components/wash.module.css`. It joins those two inside the wash element in `app/page.tsx`.

The night ground goes entirely, and with it the white-on-dark wordmark handoff: nothing
below the hero is dark any more.

### The title

Full width of the content measure, two hand-set lines, sized so the **longest line lands
exactly on the measure**. The size is measured at runtime, not guessed — the same idea as
the hero tracking FOUNDATION out to the width of IQRA, applied to a sentence. At 1440px
this comes out around 79px.

The second line is set in `--color-ink-soft` rather than navy, so the sentence has a hinge
in it rather than being one undifferentiated slab.

### The three routes

Immediately under the title — pushed up, not floated in the middle of the section. Three
equal boxes: **kontonummer left, Vipps middle, AvtaleGiro right.**

Each carries **one stop of the drape's own ramp**, in ramp order: turquoise, violet,
crimson. The stop is washed into the box from its top-left corner and the number is set in
that same colour. The colours come from `ramp()`/`sample()` in `lib/drape.ts` — imported,
never copied, exactly as `components/vision/tree.ts` does it, so the three sections cannot
drift apart.

Each box is a label, the number, and one line saying what to do with it. They are inert
text. Nothing here needs wiring, which is why they are the part of the section that works
today.

### The big box

One object, wider and taller than the three above it, in night `#0e1620` with **the drape
rendered inside it** — `mode: 'field'`, `palette: 'deep'`, the same renderer the section
used to run full-bleed, now at the size of a card.

This is deliberate. Dropping the night section would have orphaned `field`, `deep` and
`setCover` — they exist for nothing else in the codebase. Putting the drape inside the box
keeps them earning their place, and gives the page an object to land on now that the dark
ground is gone.

The box holds, on the left: the chosen amount at ~62px with «kr i måneden» beside it, and
the four tiers as pills under it. On the right: **the Vipps QR and number**, with one line
on how to use them.

It carries no dead buttons. A box that renders «300 kr i måneden» above two greyed-out
buttons is a box that lies; giving that space to the QR and number means the largest
object on the page does something today, with no integration and no agreement. When Vipps
is wired later, the right-hand side becomes the button and nothing else moves.

### The words

**Provisional, and mine.** Asked what the sentence needed to be true about, the answer was
no preference, so this is written from what the site already claims in Om oss — «Rundt
tjue stykker» and «Ingen av oss gjør dette på heltid» — and asserts nothing about Iqra's
finances:

> **Tjue stykker gjør arbeidet.**
> **Faste givere gjør at det fortsetter.**

Both lines live in `content/site.no.ts` as ordinary strings. Changing them is a one-line
edit and needs no code change; the title sizes itself to whatever it is given.

## What changes

| file | change |
| --- | --- |
| `components/support/Support.tsx` | rewritten. Loses the toggle, the frequency-dependent alt route, the disclosure panel, `setWordmarkOnDark(true)`, and the cover-follows-amount effect |
| `components/support/support.module.css` | rewritten |
| `components/support/Support.test.tsx` | rewritten |
| `content/site.no.ts` | the `support` block changes shape: monthly tiers, the two title lines, three route strings, the big box's strings. `give`, `frequency`, `alt`, `amountLabel` and the per-tier outcome placeholders go |
| `app/page.tsx` | Støtt oss moves inside the wash element; the comment claiming it "is already night" is no longer true |
| `components/wash.module.css` | its header says the white middle is "exactly these two" — now three |
| `e2e/sections.spec.ts` | the Støtt oss test loses its `data-on-dark="true"` assertion, its full-section field-painting assertion, and the cover-opens-with-the-amount assertion |
| `lib/drape.ts` | `field`, `deep` and `setCover` survive rather than becoming dead code. It was written to fill a section, so expect it to need work to read well in a box a fifth the height — that is a real risk in this plan, not a formality |

The tier outcome strings (`[4 samtaler på stand]` and the rest) are deleted rather than
filled in: decision (1) rejected organising the section around what each amount buys, so
nothing renders them any more.

## Testing

- **Unit** (`Support.test.tsx`): the three routes render their labels and numbers; picking
  a tier changes the displayed amount; the preselected tier is 300; the skattefradrag line
  is present. No canvas assertions — jsdom's 2D context is a no-op stub.
- **e2e** (`sections.spec.ts`): the section is not pinned; the wordmark stays navy over it,
  which is the assertion most likely to rot silently now that nothing after the hero is
  dark; the drape canvas inside the big box actually paints; picking a tier updates the
  amount; all three route numbers are on screen without opening anything.
- The existing `.pin-spacer` count of 1 holds — this section never pinned.

## Still unresolved

These are named so they are not discovered late:

1. **Every payment detail is a placeholder.** `[KONTO]`, `[KID]`, `[NUMMER]`, `[ORG.NR]`.
   The build gate in `scripts/check-content.mjs` is deliberately held open by
   `ALLOW_PLACEHOLDERS=1` in `vercel.json`, so the section will ship showing brackets.
   Nobody can give until these are real.
2. **The QR code does not exist.** The mockup shows a placeholder square. A real Vipps QR
   has to come from Vipps, tied to the real number.
3. **The skattefradrag sentence may be false.** It is true only if Iqra is on
   Skatteetaten's list of approved recipients under skatteloven § 6-50, which is applied
   for per organisation. The existing copy already carries this warning.
4. **The title copy is unconfirmed**, per **The words** above.
5. **Payment on the site is a separate piece of work** — a provider, an agreement, keys,
   and the repo's first server route. Out of scope here by decision (7).
