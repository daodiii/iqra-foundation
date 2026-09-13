/**
 * Misjon is set as three stanzas with the line breaks chosen by hand, so each line is a
 * phrase rather than wherever the browser ran out of room. `text` is derived from them
 * rather than written twice: it is what a screen reader and the e2e see, and deriving it
 * means an edit to the stanzas cannot leave a second copy of the sentence behind.
 */
const missionStanzas = [
  ['Vi forteller om islam', 'på en vennlig og ærlig måte.'],
  ['Vi inviterer til samtaler,', 'svarer på spørsmål,', 'og møter folk der de er.'],
  ['Slik bygger vi broer,', 'og lærer av hverandre.'],
] as const;

/**
 * Arrangementer and Nyheter: four boxes, each a picture and one sentence.
 *
 * They have no content yet, and until 2026-09-14 every row here was a bracketed
 * placeholder — a title, a date, a line — because an invented event is the one kind of
 * placeholder a visitor cannot tell from the real thing: the mockup these came from had an
 * open evening in the mosque and a stand on Karl Johan, and someone would have walked into
 * a mosque on a Thursday. Brackets are caught by `scripts/check-content.mjs` before a
 * production build, plausible sentences are not.
 *
 * Then: «take away today … let it just be four boxes, and fill them with some stock
 * pictures and just a random sentence, just so you could see how it looks.» So the boxes
 * are filled, and the way Misjon's wall is filled: the sentences are the site's own lines
 * (Om oss chapter III, the contact line), which are true of the foundation and invent
 * nothing, so the gate has nothing to refuse and nothing false is on the page meanwhile.
 * The pictures are stock stand-ins, and a stand-in photograph is exactly the placeholder a
 * visitor cannot tell from the real thing — which is why each alt carries `[Midlertidig
 * bilde]`: the gate reports it with everything else the site still lacks. Replace the file
 * and the alt together.
 *
 * The two lists are shown as one row, the events first and then the news, in this order.
 * There is no date on a box and no «i dag» between them any more; the timeline they used
 * to stand on went with the brackets. The section disappears entirely when both arrays
 * are emptied, so deleting these is also a way to ship.
 *
 * `image` is `{ src, alt }` or null. One field rather than two, so a photograph cannot
 * arrive without the words that describe it — and so there is no empty `alt` sitting in the
 * content for the gate to trip over, which is exactly what it did when they were separate.
 */
const eventItems = [
  {
    note: 'Vi står på stand i byen.',
    image: { src: '/media/midlertidig-gata.jpg', alt: '[Midlertidig bilde] En mann går over en gate, sett ovenfra.' },
  },
  {
    note: 'Vi holder åpne kvelder i moskeen.',
    image: { src: '/media/midlertidig-kafe.jpg', alt: '[Midlertidig bilde] To kopper på et langbord i en kafé.' },
  },
] as const;

const newsItems = [
  {
    note: 'Vi svarer på e-post, og vi drar dit vi blir invitert.',
    image: { src: '/media/midlertidig-notatbok.jpg', alt: '[Midlertidig bilde] En hånd skriver i en notatbok ved siden av en laptop.' },
  },
  {
    note: 'Skriv til oss, så svarer et menneske.',
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
    description: 'Iqra betyr les. Vi snakker gjerne med deg om islam.',
    /** What a shared link shows. The poster is the film's first frame. */
    imageAlt: 'Fjell i dis, i lyset før soloppgang.',
  },
  /** The organisation number is `support.orgnr`: one gift, one number, one place. */
  footer: { place: 'Oslo' },
  header: { wordmark: 'IQRA', homeLabel: 'Iqra Foundation, til toppen', navLabel: 'Hovedmeny' },
  hero: {
    /**
     * The lockup the mask cuts out of the white. Two lines, because the name is the
     * name: IQRA large, FOUNDATION set smaller underneath and tracked out to the same
     * width. The sizes live in Hero.tsx, because they are drawing, not copy.
     */
    wordLines: ['IQRA', 'FOUNDATION'],
    h1Lines: ['Iqra betyr', 'les'],
    lede: 'Det er det første ordet i Koranen. For oss betyr det å lese, å lære, og å snakke med folk som lurer på noe.',
    cta: 'Still et spørsmål',
    hint: 'Bla nedover',
  },
  vision: {
    label: 'Visjon',
    /*
     * The hand-set headline. Off the section since the arch (2026-09-11) and used by
     * nothing; kept because whether it moves to Misjon is not decided, and deleting it
     * would hide that there is a decision to make.
     */
    lines: ['Vi vil ha et Norge', 'der folk kjenner islam', 'fra ekte møter,', 'ikke fra overskrifter.'],
    sub: 'Der det er lett å spørre, og lett å få et ærlig svar.',
    /** The three values, in the order they stand around the tree: left, top, right. */
    values: [
      {
        key: 'dialog',
        name: 'Dialog',
        text: 'Vi liker å snakke med folk. Om islam, om tro, og om det som er vanskelig å spørre om. Du kan komme med det du lurer på, og vi svarer så ærlig vi kan. Vi lærer like mye av samtalen som du gjør.',
      },
      {
        key: 'trygghet',
        name: 'Trygghet',
        text: 'Det skal være trygt å lure på ting. Ingen spørsmål er dumme, og ingen blir dømt for å stille dem. Det du sier holder vi for oss selv, og du bestemmer selv hvor langt samtalen skal gå.',
      },
      {
        key: 'inkludering',
        name: 'Inkludering',
        text: 'Alle er velkomne hos oss. Du trenger ikke være muslim, og du trenger ikke kunne noe fra før. Vi møter folk der de er, med den bakgrunnen de har. Det er sånn vi selv vil bli møtt.',
      },
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
        items: ['Stand i byen', 'Åpne kvelder i moskeen', 'Svar på e-post', 'Besøk der vi blir invitert'],
      },
      contact: {
        label: 'Kontakt',
        line: 'Skriv til oss, så svarer et menneske. Vanligvis samme uka.',
      },
    },
  },
  /**
   * The two lists are one row of boxes under one heading: what is coming and what was,
   * side by side, which is why they share a heading instead of holding a column each.
   */
  happenings: {
    label: 'Arrangementer · Nyheter',
    line: 'Det som kommer, og det som var.',
    /** What each box is, on the frame's line. */
    kinds: { event: 'Arrangement', news: 'Nyhet' },
    /** The label in an empty picture frame. Bracketed, like every other thing we lack. */
    imageLabel: '[Bilde]',
    /** Read on the phone by a screen reader, which cannot see that the row runs sideways. */
    railLabel: 'Arrangementer og nyheter. Bla sidelengs.',
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
    more: 'Les hele historien',
    /** The two round arrows under the book: the small one turns back, the large one on. */
    prev: 'Forrige',
    next: 'Neste',
    sectionLabel: 'Om oss og teamet',
  },
  about: {
    label: 'Om oss',
    meta: {
      title: 'Om oss — Iqra Foundation',
      description: 'Fire kapitler om hvem vi er, hvorfor vi begynte, og hva vi holder på med.',
    },
    hint: 'Bla for å bla om',
    cover: {
      title: 'Om oss',
      sub: 'Fire kapitler om hvem vi er, hvorfor vi begynte, og hva vi holder på med.',
    },
    openerLabel: 'Kapittel',
    chapters: [
      {
        num: 'I',
        title: 'Historien',
        lede: 'Det begynte rundt et kjøkkenbord, med en samtale som ikke ville ta slutt.',
        paras: [
          'Vi startet i 2019, i Oslo. Noen få folk som var lei av at islam bare dukket opp i nyhetene når noe var galt.',
          'Navnet kommer fra det første ordet som ble åpenbart i Koranen. Iqra. Les.',
          'Vi ville lage et sted der folk kunne spørre om hva som helst, og få et ærlig svar.',
        ],
      },
      {
        num: 'II',
        title: 'Menneskene',
        lede: 'Ingen av oss gjør dette på heltid. Vi gjør det fordi vi liker samtalene.',
        paras: ['Rundt tjue stykker. Studenter, lærere, en snekker, to sykepleiere.'],
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
        lede: 'Vi møter folk der de er. Som regel betyr det på gata, eller over en kopp te.',
        paras: [
          'Vi står på stand i byen. Vi holder åpne kvelder i moskeen.',
          'Vi svarer på e-post, og vi drar dit vi blir invitert.',
        ],
        figures: [
          { value: '[N]', label: 'samtaler i året' },
          { value: '[N]', label: 'åpne kvelder' },
        ],
      },
    ],
    ask: {
      title: 'Har du et spørsmål?',
      lede: 'Vi svarer på alt. Også det du tror er dumt.',
    },
    contact: {
      label: 'Kontakt',
      para: 'Skriv til oss, så svarer et menneske. Vanligvis samme uka.',
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
