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
 * Støtt oss asks for a standing gift, so these are monthly amounts and there is no
 * one-off/monthly toggle to set them against. They start at 200 because the site's own
 * skattefradrag sentence puts the floor for a deductible year at 500 kroner, and the
 * smallest of these clears it two and a half times over.
 *
 * What each amount BUYS is deliberately not here. Naming outcomes was considered and
 * rejected: every figure would have been mine rather than anyone's, and a page that tells
 * you what your money turns into has to be able to show that it did.
 */
const supportTiers = [200, 300, 500, 1000] as const;

/**
 * The three ways to give, in the order the film's colours run — slate, gold, night.
 *
 * They are inert text, which is the whole reason they lead: every number on this page is
 * still a placeholder, and a route you copy into your own bank is the one kind of payment
 * that needs nothing built. Vipps sits in the middle because it is how people here
 * actually pay, and AvtaleGiro last because it is the only one that repeats by itself.
 */
const supportRoutes = [
  {
    label: 'Kontonummer',
    value: '[KONTO]',
    how: 'Overfør beløpet selv, og merk betalingen med navnet ditt.',
  },
  {
    label: 'Vipps',
    value: '[NUMMER]',
    how: 'Åpne Vipps, velg Betal, og søk opp nummeret.',
  },
  {
    label: 'AvtaleGiro',
    value: '[KID]',
    how: 'Fast trekk hver måned. Du oppretter den i nettbanken din.',
  },
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
 * Two rows each: enough for the axis to show its rhythm, few enough that two identical rows
 * read as a template waiting to be filled rather than as a rendering fault. The section
 * disappears entirely when both arrays are emptied, so deleting these is also a way to ship.
 *
 * Both lists carry a day and a MONTH rather than a written-out date, because they are read
 * as one time axis and the axis needs the same two parts from every entry: a number to set
 * large, and a month to group by.
 *
 * `image` is `{ src, alt }` or null. One field rather than two, so a photograph cannot
 * arrive without the words that describe it — and so there is no empty `alt` sitting in the
 * content for the gate to trip over, which is exactly what it did when they were separate.
 *
 * They are in TIME ORDER, oldest first, and nothing sorts them. A real date on a placeholder
 * would be an invented date — the one bracket a visitor could not see — and an ISO field
 * nobody can fill in yet would be a sort key that lies. The order is the author's, the same
 * way the entries in any calendar are.
 */
const eventItems = [
  { day: '[00]', month: '[mnd]', title: '[Tittel]', meta: '[Ukedag kl. 00.00 · Sted]', note: '[Én setning om hva det er.]', image: null },
  { day: '[00]', month: '[mnd]', title: '[Tittel]', meta: '[Ukedag kl. 00.00 · Sted]', note: '[Én setning om hva det er.]', image: null },
] as const;

const newsItems = [
  { day: '[00]', month: '[mnd]', title: '[Tittel]', note: '[Én setning om hva som skjedde.]', image: null },
  { day: '[00]', month: '[mnd]', title: '[Tittel]', note: '[Én setning om hva som skjedde.]', image: null },
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
   * The two lists are one time axis: news behind «i dag», events ahead of it. That is not a
   * layout, it is what they are — the same line read each way — and it is why they share a
   * heading now instead of holding a column each.
   */
  happenings: {
    label: 'Arrangementer · Nyheter',
    line: 'Det som kommer, og det som var.',
    today: 'I dag',
    /** What each stop is, said once above its date. */
    kinds: { event: 'Arrangement', news: 'Nyhet' },
    /** The label in an empty picture frame. Bracketed, like every other thing we lack. */
    imageLabel: '[Bilde]',
    /** Read on the phone by a screen reader, which cannot see that the axis runs sideways. */
    railLabel: 'Tidslinje. Bla sidelengs for det som kommer og det som var.',
    back: 'Bakover i tid',
    forward: 'Framover i tid',
    /** Short month to the word above the line. Whatever is not here is shown as written. */
    months: {
      jan: 'Januar', feb: 'Februar', mar: 'Mars', apr: 'April', mai: 'Mai', jun: 'Juni',
      jul: 'Juli', aug: 'August', sep: 'September', okt: 'Oktober', nov: 'November', des: 'Desember',
    },
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
        team: [
          { name: '[Navn]', role: 'Leder' },
          { name: '[Navn]', role: 'Nestleder' },
          { name: '[Navn]', role: 'Styremedlem' },
          { name: '[Navn]', role: 'Frivillig' },
          { name: '[Navn]', role: 'Frivillig' },
          { name: '[Navn]', role: 'Frivillig' },
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
     * Two hand-set lines, sized at runtime so the longer of them lands on the measure.
     * They are written from what Om oss already says — «Rundt tjue stykker» and «Ingen av
     * oss gjør dette på heltid» — and claim nothing about the foundation's finances.
     * Changing them is a one-line edit: the heading measures whatever it is given.
     */
    title: ['Tjue stykker gjør arbeidet.', 'Faste givere gjør at det fortsetter.'],
    routes: supportRoutes,
    routesLabel: 'Slik gir du',
    giver: {
      label: 'Fast giver',
      unit: 'kr i måneden',
      amountLabel: 'Velg beløp',
      /** The amount preselected on arrival, as an index into `tiers`. */
      preselect: 1,
    },
    tiers: supportTiers,
    /**
     * The QR is bracketed like every other number on this page, and for the same reason:
     * a real one has to be issued by Vipps against a real number. Drawing a plausible
     * square here would be worse than leaving it out — it would be the one placeholder on
     * the site that a visitor could try, and it would fail silently in their bank app.
     */
    qr: {
      value: '[QR-KODE]',
      title: 'Vipps',
      how: 'Skann koden, eller søk opp nummeret i appen. Du velger beløpet selv.',
    },
    fields: {
      orgnr: 'Organisasjonsnummer',
    },
    orgnr: '[ORG.NR]',
    /**
     * True only if the foundation is on Skatteetaten's list of approved recipients
     * (skatteloven § 6-50) — approval is per organisation and has to be applied for.
     * The bracket is load-bearing: it holds the production build until whoever fills in
     * the organisation number has confirmed the approval that makes this sentence true.
     */
    tax: 'Gaver mellom 500 og 25 000 kroner i året gir skattefradrag. Vi rapporterer gaven på organisasjonsnummer [ORG.NR], og trenger fødselsnummeret ditt for å gjøre det.',
  },
  contact: { email: '[EPOST]' },
} as const;

export type Site = typeof site;
