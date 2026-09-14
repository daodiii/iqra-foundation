/**
 * Misjon is set as stanzas with the line breaks chosen by hand, so each line is a phrase
 * rather than wherever the browser ran out of room. `text` is derived from them rather than
 * written twice: it is what a screen reader and the e2e see, and deriving it means an edit
 * to the stanzas cannot leave a second copy of the sentence behind. The stanzas are THE
 * PARAGRAPH (below), one sentence to a stanza, broken so no line runs much past 24
 * characters — the phone's box is 360px and the type there is 19px.
 */
const missionStanzas = [
  ['Iqra er det første ordet', 'i Koranen.'],
  ['Det kan bety å lese', 'eller resitere.'],
  ['Vi vil at alle skal lese,', 'forstå og lære', 'hva islam faktisk er.'],
] as const;

/**
 * THE PARAGRAPH. The user's own words (2026-09-14), and the one piece of prose on the site:
 * «take away all AI slop on the site … the paragraph I gave you, make that in every place
 * where you would write stuff … it's just to see how text looks on the page.» So every slot
 * that holds prose holds this, until real copy arrives — the hero's lede, the three values,
 * Misjon's stanzas and tiles, the four boxes, the book's chapters, the contact lines. A slot
 * that holds a headline or a lede holds its first sentence, so the paragraph never stands
 * twice on one page. Names, labels, buttons, the question and the list are not prose and
 * stay. Written once here and read everywhere, so the real text drops in in one place.
 *
 * `islam` in lower case, as the site has it everywhere (Bokmål); the user wrote it with a
 * capital and can have it back with one edit here.
 */
const paragraph = 'Iqra er det første ordet i Koranen. Det kan bety å lese eller resitere. Vi vil at alle skal lese, forstå og lære hva islam faktisk er.';
/** Its first sentence: what a headline or a lede slot shows. */
const firstLine = 'Iqra er det første ordet i Koranen.';
/** The rest, for a tile that shows the first sentence as its headline and wants no repeat. */
const restLines = 'Det kan bety å lese eller resitere. Vi vil at alle skal lese, forstå og lære hva islam faktisk er.';

/** The hero's h1 after the scroll: the name, in caps, on one line («make the title IQRA
 *  FOUNDATION in caps … so that it fits on one line», 2026-09-14). */
const heroLines = ['IQRA FOUNDATION'] as const;
const heroLede = paragraph;

/**
 * Arrangementer and Nyheter: four boxes, each a picture, a date and a paragraph.
 *
 * They have no content yet, and until 2026-09-14 every row here was a bracketed
 * placeholder — a title, a date, a line — because an invented event is the one kind of
 * placeholder a visitor cannot tell from the real thing: the mockup these came from had an
 * open evening in the mosque and a stand on Karl Johan, and someone would have walked into
 * a mosque on a Thursday. Brackets are caught by `scripts/check-content.mjs` before a
 * production build, plausible sentences are not.
 *
 * Then: «take away today … let it just be four boxes, and fill them with some stock
 * pictures … write the iqra-is-the-first-word-in-the-Quran paragraph in all four, and
 * different dates on all of them so I get the complete look.» So the boxes are filled,
 * and the way Misjon's wall is filled: the words are the site's own — the hero's, in every
 * box — which are true of the foundation and invent nothing, so the gate has nothing to
 * refuse and nothing false is on the page meanwhile. The DATES are invented, four of them
 * round the day this was asked, and they are the one thing here a visitor could take for
 * real; they are for the look, and go the day there is a real one to type. The pictures
 * are stock stand-ins, and a stand-in photograph is exactly the placeholder a visitor
 * cannot tell from the real thing — which is why each alt carries `[Midlertidig bilde]`:
 * the gate reports it with everything else the site still lacks. Replace the file and the
 * alt together.
 *
 * The two lists are shown as one row, the events first and then the news, in this order —
 * nothing sorts, and there is no «i dag» between them any more. `date` is ISO
 * `YYYY-MM-DD`, one thing to type; the box writes it out as «24. september 2026». The
 * section disappears entirely when both arrays are emptied, so deleting these is also a
 * way to ship.
 *
 * `image` is `{ src, alt }` or null. One field rather than two, so a photograph cannot
 * arrive without the words that describe it — and so there is no empty `alt` sitting in the
 * content for the gate to trip over, which is exactly what it did when they were separate.
 */
const iqraWords = paragraph;

const eventItems = [
  {
    date: '2026-09-24',
    note: iqraWords,
    image: { src: '/media/midlertidig-gata.jpg', alt: '[Midlertidig bilde] En mann går over en gate, sett ovenfra.' },
  },
  {
    date: '2026-10-08',
    note: iqraWords,
    image: { src: '/media/midlertidig-kafe.jpg', alt: '[Midlertidig bilde] To kopper på et langbord i en kafé.' },
  },
] as const;

const newsItems = [
  {
    date: '2026-09-06',
    note: iqraWords,
    image: { src: '/media/midlertidig-notatbok.jpg', alt: '[Midlertidig bilde] En hånd skriver i en notatbok ved siden av en laptop.' },
  },
  {
    date: '2026-08-30',
    note: iqraWords,
    image: { src: '/media/midlertidig-bok.jpg', alt: '[Midlertidig bilde] En åpen bok på et bord.' },
  },
] as const;

/**
 * Where «Alle arrangementer →» and «Alle nyheter →» would go.
 *
 * Null until those pages exist, and the link is not rendered while it is null. A link to `#`
 * would be the one thing on this page that answers a click by doing nothing, and unlike a
 * bracket nothing in the build would ever catch it. The day the route exists this is a
 * one-line change and the link appears.
 */
const eventsHref: string | null = null;
const newsHref: string | null = null;

export const site = {
  lang: 'nb',
  name: 'Iqra Foundation',
  meta: {
    title: 'Iqra Foundation',
    description: paragraph,
    /** What a shared link shows. The poster is the film's first frame. */
    imageAlt: 'Fjell i dis, i lyset før soloppgang.',
  },
  /** The organisation number is `support.orgnr`: one gift, one number, one place. */
  footer: { place: 'Oslo' },
  header: { wordmark: 'IQRA FOUNDATION', homeLabel: 'Iqra Foundation, til toppen', navLabel: 'Hovedmeny' },
  hero: {
    /**
     * The lockup the mask cuts out of the white. Two lines, because the name is the
     * name: IQRA large, FOUNDATION set smaller underneath and tracked out to the same
     * width. The sizes live in Hero.tsx, because they are drawing, not copy.
     */
    wordLines: ['IQRA', 'FOUNDATION'],
    h1Lines: heroLines,
    lede: heroLede,
    cta: 'Still et spørsmål',
    hint: 'Bla nedover',
  },
  /**
   * The button on to the next section, one per section, named for where it goes — «after
   * each section make a button like Vår visjon» (2026-09-14). Keyed by the section's id,
   * which is what the button links to. Støtt oss is last and has none.
   */
  next: {
    visjon: 'Vår visjon',
    misjon: 'Vår misjon',
    arrangementer: 'Arrangementer og nyheter',
    'om-oss-teamet': 'Om oss',
    'stott-oss': 'Støtt oss',
  },
  vision: {
    label: 'Visjon',
    /*
     * The hand-set headline, shown on Misjon's Visjon tile (off Visjon itself since the
     * arch, 2026-09-11): the paragraph's first sentence, and the rest under it.
     */
    lines: ['Iqra er det første ordet', 'i Koranen.'],
    sub: restLines,
    /** The three values, in the order they stand around the tree: left, top, right. */
    values: [
      { key: 'dialog', name: 'Dialog', text: paragraph },
      { key: 'trygghet', name: 'Trygghet', text: paragraph },
      { key: 'inkludering', name: 'Inkludering', text: paragraph },
    ],
    tree: {
      label: 'Et tre under en bue. Greinene er Dialog, Trygghet og Inkludering, og under røttene står Iqra Foundation.',
    },
  },
  mission: {
    label: 'Misjon',
    stanzas: missionStanzas,
    text: missionStanzas.flat().join(' '),
    /**
     * The wall (2026-09-13). Misjon is a bento now: eight tiles on the page's white, the
     * gold film the tall one in the middle, the mission and five smaller boxes round it.
     * Visjon's tile takes `vision.lines` above. The rest is here.
     *
     * These words are STAND-INS. The user has said so — «the words are not important,
     * real info is coming soon» — and they are the site's own lines (the values, Om oss,
     * the hero's lede) rather than anything invented, so the production gate has nothing
     * to refuse and nothing false is on the page meanwhile. They live here rather than in
     * the component so the real ones drop in without a code change; if they run much
     * longer or shorter than these, the grid is re-cut to them, not the other way round.
     */
    wall: {
      film: {
        title: 'Iqra betyr les.',
        line: 'Det første ordet i Koranen.',
        /** What the film shows, for anyone who cannot see it. */
        alt: 'En gullpenn skriver «iqra» på arabisk.',
      },
      question: {
        label: 'Spørsmål vi får',
        q: 'Må jeg være muslim for å komme?',
        a: 'Nei. Alle er velkomne, og du trenger ikke kunne noe fra før.',
      },
      how: {
        label: 'Slik jobber vi',
        /** Four points, each the paragraph («just write [it] the [same] way in all 4 pointers», 2026-09-14). */
        items: [paragraph, paragraph, paragraph, paragraph],
      },
      contact: {
        label: 'Kontakt',
        line: paragraph,
      },
    },
  },
  /**
   * The two lists are one row of boxes under one heading, which is why they share a
   * heading instead of holding a column each. `line` is the heading — the section's name,
   * since 2026-09-14; the line it used to be («Det som kommer, og det som var.») went with
   * the rest of the written copy — and `label` is what the section is called to a screen
   * reader.
   */
  happenings: {
    label: 'Arrangementer og nyheter',
    line: 'Arrangementer og nyheter',
    /** What each box is, on the frame's line. */
    kinds: { event: 'Arrangement', news: 'Nyhet' },
    /** The label in an empty picture frame. Bracketed, like every other thing we lack. */
    imageLabel: '[Bilde]',
    /** Read on the phone by a screen reader, which cannot see that the row runs sideways. */
    railLabel: 'Arrangementer og nyheter. Bla sidelengs.',
    /** The months, in full and in order — a box writes its date as «24. september 2026». */
    months: ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'],
  },
  events: {
    label: 'Arrangementer',
    more: 'Alle arrangementer',
    href: eventsHref,
    items: eventItems,
  },
  news: {
    label: 'Nyheter',
    more: 'Alle nyheter',
    href: newsHref,
    items: newsItems,
  },
  /**
   * Om oss · Teamet on the landing page: the `/om-oss` book lying on the section's water,
   * open on the logo facing the words, the team as the pages after. The words themselves
   * come from `about.chapters` — chapter I for the story, chapter II for the people — so
   * they are written once and the landing page and `/om-oss` cannot drift. Only what the
   * landing page adds is here.
   */
  people: {
    /** Chapter II is «Menneskene» inside the book; on the landing page it is the team,
     *  and «Teamet · 1 / 6» is what the band under the book says on a member's page. */
    teamLabel: 'Teamet',
    more: 'Les mer om oss',
    /** The two round arrows under the book: the small one turns back, the large one on. */
    prev: 'Forrige',
    next: 'Neste',
    sectionLabel: 'Om oss og teamet',
  },
  about: {
    label: 'Om oss',
    meta: {
      title: 'Om oss — Iqra Foundation',
      description: paragraph,
    },
    hint: 'Bla for å bla om',
    cover: {
      title: 'Om oss',
      sub: paragraph,
    },
    openerLabel: 'Kapittel',
    chapters: [
      {
        num: 'I',
        title: 'Historien',
        lede: firstLine,
        paras: [paragraph],
      },
      {
        num: 'II',
        title: 'Menneskene',
        lede: firstLine,
        paras: [paragraph],
        /*
         * Every slot is still a bracket: no name, no face, no sentence about anyone has been
         * invented. The landing page sets these as one card per person, which is why the name
         * is in two parts and why each has a line for who they are.
         */
        team: [
          { first: '[Fornavn]', last: '[Etternavn]', role: 'Leder', bio: '[Et par setninger om hvem dette er]' },
          { first: '[Fornavn]', last: '[Etternavn]', role: 'Nestleder', bio: '[Et par setninger om hvem dette er]' },
          { first: '[Fornavn]', last: '[Etternavn]', role: 'Styremedlem', bio: '[Et par setninger om hvem dette er]' },
          { first: '[Fornavn]', last: '[Etternavn]', role: 'Frivillig', bio: '[Et par setninger om hvem dette er]' },
          { first: '[Fornavn]', last: '[Etternavn]', role: 'Frivillig', bio: '[Et par setninger om hvem dette er]' },
          { first: '[Fornavn]', last: '[Etternavn]', role: 'Frivillig', bio: '[Et par setninger om hvem dette er]' },
        ],
      },
      {
        num: 'III',
        title: 'Arbeidet',
        lede: firstLine,
        paras: [paragraph],
        figures: [
          { value: '[N]', label: 'samtaler i året' },
          { value: '[N]', label: 'åpne kvelder' },
        ],
      },
    ],
    ask: {
      title: 'Har du et spørsmål?',
      lede: paragraph,
    },
    contact: {
      label: 'Kontakt',
      para: paragraph,
      place: 'Iqra Foundation, Oslo',
    },
  },
  support: {
    label: 'Støtt oss',
    /**
     * The section says one thing: here is the Vipps number. The question is the user's own
     * words (2026-09-12), and the number under it is the whole answer — there is no amount
     * to choose and no card to fill in, because nothing is wired to a payment yet, and a
     * control that leads nowhere is worse than none.
     */
    title: 'Vil du støtte Iqra Foundation?',
    vipps: {
      label: 'Vippsnummer',
      value: '[NUMMER]',
    },
    /**
     * The other two ways to give, as one sentence rather than two boxes. The account
     * number is bracketed INSIDE the sentence, and `scripts/lib/content-check.mjs` reads
     * it there: a bracket anywhere in this string holds a production build.
     */
    also: 'Du kan også overføre til kontonummer [KONTO], eller opprette fast trekk i nettbanken. Merk betalingen med navnet ditt.',
    /**
     * The second square: a card form, «just for the visuals» (2026-09-12). Nothing here is
     * wired and nothing here is a control — every field is a drawn box with its placeholder
     * written in it, the pay button is a span — and the drawing is hidden from assistive
     * tech, which gets `notice` instead: the one honest line, that card payment is not
     * connected yet. The placeholders are format hints, not missing content, so they are
     * not bracketed; the production gate does not need to hold on them.
     */
    card: {
      label: 'Kort',
      amount: 'Beløp',
      tiers: [200, 300, 500] as const,
      /** The amount drawn as chosen, as an index into `tiers`; the button repeats it. */
      preselect: 1,
      other: 'Annet',
      unit: 'kr',
      number: 'Kortnummer',
      numberPlaceholder: '1234 5678 9012 3456',
      expiry: 'Utløpsdato',
      expiryPlaceholder: 'MM / ÅÅ',
      cvc: 'CVC',
      cvcPlaceholder: '123',
      name: 'Navn på kortet',
      namePlaceholder: 'Som det står på kortet',
      pay: 'Gi',
      notice: 'Kortbetaling er ikke koblet til ennå. Bruk Vipps eller kontonummeret så lenge.',
    },
    fields: {
      orgnr: 'Organisasjonsnummer',
    },
    orgnr: '[ORG.NR]',
  },
  contact: { email: '[EPOST]' },
} as const;

export type Site = typeof site;
