import { brief } from './brief.no.ts';

/**
 * Everything the site says that is not the brief: navigation labels, buttons, form and
 * field labels, empty-state lines, alt text, titles and descriptions. Functional microcopy
 * in plain bokmål, and nothing more — the prose is the brief's (`brief.no.ts`), verbatim,
 * and every value the foundation has not supplied yet is a bracketed placeholder so
 * `scripts/check-content.mjs` reports it and a production build refuses it.
 *
 * Titles follow one pattern, set in `app/layout.tsx`: «Om oss – Iqra Foundation», and the
 * home page is the name alone. Descriptions are sentences from the brief.
 */

/**
 * The one exception to the no-prose rule: the user's own words about the name, written
 * 2026-09-14. The brief says the meaning of «Iqra» can still be part of the story, and this
 * is that story, in Om oss and nowhere else.
 *
 * `islam` in lower case, as bokmål has it; the user writes it with a capital.
 */
const story = 'Iqra er det første ordet i Koranen. Det kan bety å lese eller resitere. Vi vil at alle skal lese, forstå og lære hva islam faktisk er.';

/** The nine menu items in the brief's order, and where each goes. The labels are the brief's. */
const nav = [
  { label: brief.menu[0], href: '/' },
  { label: brief.menu[1], href: '/om-oss' },
  { label: brief.menu[2], href: '/vart-arbeid' },
  { label: brief.menu[3], href: '/arrangementer' },
  { label: brief.menu[4], href: '/ressurser' },
  { label: brief.menu[5], href: '/menneskene-bak' },
  { label: brief.menu[6], href: '/styringsdokumenter' },
  { label: brief.menu[7], href: '/kontakt' },
  { label: brief.menu[8], href: '/stott-oss', button: true },
] as const;

export const site = {
  lang: 'nb',
  name: 'Iqra Foundation',
  place: 'Oslo',
  nav,
  /** The two buttons under the home page's text (brief 2), and where they go; and Kontakt, the way on from the foot of the home page. */
  cta: {
    work: { label: brief.home.buttons[0], href: '/vart-arbeid' },
    support: { label: brief.home.buttons[1], href: '/stott-oss' },
    contact: { label: brief.menu[7], href: '/kontakt' },
  },
  header: {
    homeLabel: 'Iqra Foundation, til forsiden',
    navLabel: 'Hovedmeny',
    open: 'Meny',
    close: 'Lukk menyen',
    skip: 'Hopp til innholdet',
  },
  footer: {
    navLabel: 'Sider',
    orgnrLabel: 'Organisasjonsnummer',
    emailLabel: 'E-post',
  },
  /** What the foundation has not supplied yet. Bracketed on purpose: the build reports them. */
  contact: {
    email: '[EPOST]',
    orgnr: '[ORG.NR]',
    /**
     * The street and the postcode; the place is `site.place`. The Kontakt page's map
     * (public/kart-1024.webp, kart-1536.webp) is stitched round a point, and the pin on it shows
     * itself only once the street is real — today the point is Oslo sentrum (59.9138 N
     * 10.7500 E), a stand-in for the place. When the address arrives: write it here, then
     * `node scripts/dev/kart.mjs <lat> <lon>` so the map is round it.
     */
    address: { street: '[GATEADRESSE]', postcode: '[POSTNUMMER]' },
    phone: '[TELEFON]',
    hours: '[ÅPNINGSTIDER]',
    transit: '[VEIEN DIT]',
    /** Where to follow. A name stands as plain text while its address is bracketed, and becomes a link once it is real. */
    follow: [
      { name: 'Instagram', href: '[INSTAGRAM]' },
      { name: 'Facebook', href: '[FACEBOOK]' },
      { name: 'LinkedIn', href: '[LINKEDIN]' },
    ],
  },
  support: {
    /** The foundation's own, given 2026-09-23. */
    vipps: { label: 'Vippsnummer', value: '26354' },
    account: { label: 'Kontonummer', value: '[KONTO]' },
    /** The three ways to give, as the owner listed them (2026-09-18) and in that order: the banners' names. */
    ways: { account: 'Direkte overføring', vipps: 'Vipps', avtale: 'AvtaleGiro' },
    /**
     * AvtaleGiro is the foundation's agreement at Solidus, given 2026-09-23 («the link is the
     * avtalegiro, make a button for it»): the button on the third banner goes there and the
     * agreement — the amount, the account, the signing — is made on their page, not here. The
     * amounts this used to draw are gone with it: nothing on this site should look like it is
     * taking a payment when the taking happens elsewhere.
     */
    avtale: { button: 'Opprett AvtaleGiro', href: 'https://nettbutikk.solidus.no/avtalestraks/D6E5B9EA-89CF-43F0-90F0-2BD4039EADD2' },
  },
  /** The logo's alt text, on every ground. */
  logoAlt: 'Iqra Foundation',
  /** The months, in full: a date is written out as «24. september 2026». */
  months: ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'],
  pages: {
    home: {
      description: brief.home.paragraph,
      visionLabel: 'Visjon',
      missionLabel: 'Misjon',
      areasLabel: 'Fire hovedområder',
      /**
       * The foot of the home page: the question on our side of the table and the line on
       * the sheet. A second exception to the no-prose rule (the first is the story of the
       * name), and a weaker one: these two lines are a DRAFT, written 2026-09-21 by the
       * owner's word («I draft it, you correct»), for whoever wants to work with the
       * foundation, meet it, challenge it or take up a debate. They stand until the owner
       * writes theirs.
       */
      contact: {
        question: 'Vil du samarbeide, utfordre oss eller ta en debatt?',
        line: 'Vi vil gjerne høre fra deg.',
      },
    },
    about: {
      label: brief.menu[1],
      title: 'Om oss',
      description: brief.about.paragraphs[0],
      story: { label: 'Navnet', text: story },
    },
    work: {
      label: brief.menu[2],
      title: 'Vårt arbeid',
      description: brief.mission.headline,
    },
    events: {
      label: brief.menu[3],
      title: 'Arrangementer',
      description: brief.about.paragraphs[3],
      upcoming: 'Kommende',
      past: 'Tidligere',
      emptyUpcoming: 'Ingen arrangementer er publisert ennå.',
      emptyPast: 'Ingen tidligere arrangementer er publisert ennå.',
      place: 'Sted',
      time: 'Tid',
      more: 'Les mer',
      /** The count on the home page, under the next event: how long until it starts. */
      count: { days: 'dager', hours: 'timer', minutes: 'min', seconds: 'sek' },
    },
    resources: {
      label: brief.menu[4],
      title: 'Ressurser',
      description: brief.resources,
      empty: 'Ingen ressurser er publisert ennå.',
      kinds: {
        publikasjon: 'Publikasjon',
        artikkel: 'Artikkel',
        rapport: 'Rapport',
        presentasjon: 'Presentasjon',
        video: 'Video',
        annet: 'Annet',
      },
      open: 'Åpne',
      download: 'Last ned',
    },
    people: {
      label: brief.menu[5],
      title: brief.people.title,
      description: brief.people.paragraph,
      empty: 'Presentasjoner av menneskene bak Iqra kommer senere.',
      photoMissing: 'Bilde kommer',
    },
    documents: {
      label: brief.menu[6],
      title: 'Styringsdokumenter',
      description: brief.documents,
      empty: 'Ingen dokumenter er publisert ennå.',
      kinds: {
        vedtekter: 'Vedtekter',
        arsrapport: 'Årsrapport',
        arsregnskap: 'Årsregnskap',
        strategi: 'Strategi',
        annet: 'Annet',
      },
      download: 'Last ned',
      year: 'År',
    },
    contact: {
      label: brief.menu[7],
      title: 'Kontakt',
      description: brief.about.paragraphs[2],
      addressLabel: 'Adresse',
      emailLabel: 'E-post',
      phoneLabel: 'Telefon',
      orgnrLabel: 'Organisasjonsnummer',
      hoursLabel: 'Åpningstider',
      transitLabel: 'Kollektivt',
      followLabel: 'Følg oss',
      /** The map is OpenStreetMap's; the credit is the licence's condition (ODbL), and links to it. The alt is rewritten with the map. */
      map: { alt: 'Kart over Oslo sentrum', credit: '© OpenStreetMap-bidragsytere', creditHref: 'https://www.openstreetmap.org/copyright' },
      /**
       * The form: its heading the owner's words (2026-09-22, «kontakt oss above the message form»), its fields what
       * they are called — the writer's name, e-mail, mobile number and organisation number (the owner's two of the same
       * day), the message. It is drawn, not wired, and the notice under it says so (the sibling of the card form's line, 2026-09-12).
       */
      form: {
        title: 'Kontakt oss',
        name: 'Navn',
        email: 'E-post',
        mobile: 'Mobilnummer',
        orgnr: 'Organisasjonsnummer',
        message: 'Melding',
        send: 'Send',
        notice: 'Skjemaet er ikke koblet til ennå. Send en e-post så lenge.',
      },
    },
    support: {
      label: brief.menu[8],
      title: 'Støtt oss',
      description: brief.home.paragraph,
      /** The page's heading, the owner's own words (2026-09-21); the title above stays the tab's and the menu's. */
      question: 'Vil du støtte oss?',
    },
    notFound: {
      title: 'Siden finnes ikke',
      line: 'Siden finnes ikke.',
      home: 'Til forsiden',
    },
  },
} as const;

export type Site = typeof site;
export type NavItem = (typeof nav)[number];
