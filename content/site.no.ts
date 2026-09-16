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
  /** The two buttons under the home page's text (brief 2), and where they go. */
  cta: {
    work: { label: brief.home.buttons[0], href: '/vart-arbeid' },
    support: { label: brief.home.buttons[1], href: '/stott-oss' },
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
  },
  support: {
    vipps: { label: 'Vippsnummer', value: '[NUMMER]' },
    account: { label: 'Kontonummer', value: '[KONTO]' },
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
      /** The way on from each of the home page's sections to its page; Støtt oss keeps the brief's button. */
      more: {
        about: 'Les mer om oss',
        events: 'Alle arrangementer',
        resources: 'Alle ressurser',
        people: 'Menneskene bak Iqra',
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
      emailLabel: 'E-post',
      orgnrLabel: 'Organisasjonsnummer',
      placeLabel: 'Sted',
    },
    support: {
      label: brief.menu[8],
      title: 'Støtt oss',
      description: brief.home.paragraph,
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
