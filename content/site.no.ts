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
 * Arrangementer and Nyheter, which have no content yet.
 *
 * Every row here is a bracketed placeholder, and that is deliberate rather than lazy: the
 * mockup these came from was filled with invented events — an open evening in the mosque, a
 * stand on Karl Johan — and an invented event is the one kind of placeholder a visitor
 * cannot tell from the real thing. They would have walked into a mosque on a Thursday.
 * Brackets are caught by `scripts/check-content.mjs` before a production build, plausible
 * sentences are not, which is the whole argument.
 *
 * Two rows each: enough for the row to show its rhythm, few enough that two identical rows
 * read as a template waiting to be filled rather than as a rendering fault. The section
 * disappears entirely when both arrays are emptied, so deleting these is also a way to ship.
 *
 * Every entry carries a `date`, ISO `YYYY-MM-DD`, or null while it is a placeholder. The two
 * lists are shown as ONE ROW sorted by that date, news and events mixed — «published by the
 * date; news or arrangement doesn't matter» (2026-09-12) — with «i dag» set where the
 * visitor's today falls. The day set large and the month beside it are both read off the
 * date, so there is one thing to type and nothing to keep in step. A null date shows the
 * bracketed `[00]` and `[mnd]` from `happenings.undated` and sorts as its list would —
 * news before today, events after — because a real date on a placeholder would be an
 * invented date, the one bracket a visitor could not see.
 *
 * `image` is `{ src, alt }` or null. One field rather than two, so a photograph cannot
 * arrive without the words that describe it — and so there is no empty `alt` sitting in the
 * content for the gate to trip over, which is exactly what it did when they were separate.
 */
const eventItems = [
  { date: null, title: '[Tittel]', meta: '[Ukedag kl. 00.00 · Sted]', note: '[Én setning om hva det er.]', image: null },
  { date: null, title: '[Tittel]', meta: '[Ukedag kl. 00.00 · Sted]', note: '[Én setning om hva det er.]', image: null },
] as const;

const newsItems = [
  { date: null, title: '[Tittel]', note: '[Én setning om hva som skjedde.]', image: null },
  { date: null, title: '[Tittel]', note: '[Én setning om hva som skjedde.]', image: null },
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
  },
  /**
   * The two lists are one row in date order, news and events mixed, with «i dag» where
   * today falls. That is not a layout, it is what they are — the same line read each way —
   * and it is why they share a heading instead of holding a column each.
   */
  happenings: {
    label: 'Arrangementer · Nyheter',
    line: 'Det som kommer, og det som var.',
    today: 'I dag',
    /** What each stop is, said once above its date. */
    kinds: { event: 'Arrangement', news: 'Nyhet' },
    /** What a stop shows for its date while it has none. Bracketed, like everything we lack. */
    undated: { day: '[00]', month: '[mnd]' },
    /** The label in an empty picture frame. Bracketed, like every other thing we lack. */
    imageLabel: '[Bilde]',
    /** Read on the phone by a screen reader, which cannot see that the axis runs sideways. */
    railLabel: 'Tidslinje. Bla sidelengs for det som kommer og det som var.',
    back: 'Bakover i tid',
    forward: 'Framover i tid',
    /** The months, short, in order — what a date's month is shown as beside the day. */
    months: ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'],
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
   * Om oss · Teamet on the landing page. The words themselves come from `about.chapters` —
   * chapter I for the story, chapter II for the people — so they are written once and the
   * landing page and `/om-oss` cannot drift. Only what the landing page adds is here.
   */
  people: {
    /** Chapter II is «Menneskene» inside the book; on the landing page it is the team. */
    teamLabel: 'Teamet',
    more: 'Les hele historien',
    /** The two round arrows on the member card: the small one steps back, the large one on. */
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
    fields: {
      orgnr: 'Organisasjonsnummer',
    },
    orgnr: '[ORG.NR]',
  },
  contact: { email: '[EPOST]' },
} as const;

export type Site = typeof site;
