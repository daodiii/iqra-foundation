import { brief } from './brief.no.ts';
import { klient } from './klient.no.ts';

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

/**
 * The menu, as the client asks for it (M1, 2026-11-18): Hjem; Om oss with Om Iqra Foundation,
 * Vårt arbeid and Menneskene bak under it; Aktuelt with Nyheter and Arrangementer under it;
 * Ressurser; Kontakt; and Støtt oss as its own button. Om oss and Aktuelt open a page too (the
 * owner, 2026-11-18): Om oss is Om Iqra Foundation, Aktuelt is the page with all of it.
 */
const m = klient.menu;
const nav = [
  { label: m.home, href: '/' },
  {
    label: m.about,
    href: '/om-oss',
    children: [
      { label: m.aboutFoundation, href: '/om-oss' },
      { label: m.work, href: '/vart-arbeid' },
      { label: m.people, href: '/menneskene-bak' },
    ],
  },
  {
    label: m.news,
    href: '/aktuelt',
    children: [
      { label: m.newsItems, href: '/aktuelt/nyheter' },
      { label: m.events, href: '/aktuelt/arrangementer' },
    ],
  },
  { label: m.resources, href: '/ressurser' },
  { label: m.contact, href: '/kontakt' },
  { label: m.support, href: '/stott-oss', button: true },
] as const;

/** Every page the menu names, once each, in its reading order (an item, then what stands under it): the footer's list. */
const links: readonly { label: string; href: string }[] = nav
  .flatMap<{ label: string; href: string }>((item) => ('children' in item ? [item, ...item.children] : [item]))
  .filter((l, i, all) => all.findIndex((o) => o.href === l.href) === i);

/** The two legal pages: not in the menu (the brief's nine are the menu), reached from the foot of every page. */
const legal = [
  { label: 'Personvern', href: '/personvern' },
  { label: 'Vilkår', href: '/vilkar' },
] as const;

export const site = {
  lang: 'nb',
  name: 'Iqra Foundation',
  place: 'Oslo',
  nav,
  links,
  legal,
  /** The two buttons under the home page's text (brief 2), and where they go; and Kontakt, the way on from the foot of the home page. */
  cta: {
    /** The front page's two buttons (D1): on to Om Iqra Foundation, and to the coming events. */
    about: { label: klient.home.buttons.about, href: '/om-oss' },
    events: { label: klient.home.buttons.events, href: '/aktuelt/arrangementer' },
    /** The two buttons under «Sammen kan vi gjøre en forskjell» (D1). Where «Bli samarbeidspartner» leads is the client's question Q9; Kontakt until they say. */
    partner: { label: klient.home.together.buttons.partner, href: '/kontakt' },
    support: { label: klient.home.together.buttons.support, href: '/stott-oss' },
    contact: { label: klient.menu.contact, href: '/kontakt' },
  },
  header: {
    homeLabel: 'Iqra Foundation, til forsiden',
    navLabel: 'Hovedmeny',
    open: 'Meny',
    close: 'Lukk menyen',
    /** The visible word on the menu's close button; `close` names it. */
    closeShort: 'Lukk',
    /** Names the arrow beside Om oss and Aktuelt, read with the item: «Vis sidene under Om oss». */
    subOpen: 'Vis sidene under',
    skip: 'Hopp til innholdet',
  },
  footer: {
    navLabel: 'Sider',
    legalLabel: 'Juridisk',
    orgnrLabel: 'Organisasjonsnummer',
    emailLabel: 'E-post',
    phoneLabel: 'Telefon',
    addressLabel: 'Adresse',
    /** The front page's foot: back to the top. */
    toTop: 'Til toppen',
  },
  /**
   * The foundation's contact details, as the client's document gives them (D8, 2026-11-18).
   * The address is a post box, so it is a place to write to, not a place to stand: the
   * Kontakt page's map gets no pin. The client gave no opening hours and no directions, and
   * asked for the placeholders to go («Fjern testinnhold og plassholdertekster»), so those
   * cards are gone. Facebook and Instagram are named in the document with their handles
   * still to come («[brukernavn]»): they stay bracketed here, so the build reports them,
   * and nothing shows them until they are real.
   */
  contact: {
    name: klient.contact.name,
    email: klient.contact.email,
    orgnr: klient.contact.orgnr,
    /** The two lines of the address: the post box, then the postcode and the place. */
    address: [klient.contact.postbox, klient.contact.postcode],
    phone: klient.contact.phone,
    /** Where to follow. Shown only once a handle is real. */
    follow: [
      { name: 'Instagram', href: '[INSTAGRAM]' },
      { name: 'Facebook', href: '[FACEBOOK]' },
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
      description: klient.home.paragraphs[0],
      /** Under the three next events: the way on to all of them, beside the client's «Se alle nyheter». */
      allEvents: 'Se alle arrangementer',
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
      label: klient.menu.about,
      title: klient.about.title,
      description: klient.about.intro,
      story: { label: 'Navnet', text: story },
    },
    work: {
      label: klient.menu.work,
      title: klient.work.title,
      description: klient.work.intro,
    },
    /** Aktuelt (M3 and D5): the words around the client's text — the filter, the headings, the empty lines. */
    news: {
      label: klient.menu.news,
      title: klient.news.title,
      description: klient.news.intro,
      filterLabel: 'Vis',
      newsTitle: klient.menu.newsItems,
      eventsTitle: klient.menu.events,
      upcoming: 'Kommende arrangementer',
      past: 'Tidligere arrangementer',
      archiveTitle: 'Arkiv',
      archiveDescription: klient.news.archiveText,
      archiveLink: 'Se hele arkivet',
      emptyNews: 'Ingen nyheter er publisert ennå.',
      emptyUpcoming: 'Ingen kommende arrangementer er publisert ennå.',
      emptyPast: 'Ingen tidligere arrangementer ennå.',
      readMore: 'Les hele saken',
      signup: 'Påmelding',
      program: 'Program',
      report: 'Referat',
      recording: 'Se opptaket',
    },
    events: {
      label: klient.menu.events,
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
      label: klient.menu.resources,
      title: klient.resources.title,
      description: klient.resources.intro,
      categoriesLabel: 'Kategorier',
      empty: 'Ingenting er publisert her ennå.',
      open: 'Åpne',
      download: 'Last ned',
    },
    people: {
      label: klient.menu.people,
      title: klient.people.title,
      description: klient.people.intro,
      empty: 'Presentasjoner av menneskene bak Iqra kommer senere.',
      photoMissing: 'Bilde kommer',
    },
    /** Styringsdokumenter is a category of the library now; the menu's item under Ressurser goes there. */
    documents: {
      label: 'Styringsdokumenter',
      title: 'Styringsdokumenter',
    },
    contact: {
      label: klient.menu.contact,
      title: 'Kontakt',
      description: brief.about.paragraphs[2],
      addressLabel: 'Adresse',
      emailLabel: 'E-post',
      phoneLabel: 'Telefon',
      orgnrLabel: 'Organisasjonsnummer',
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
      label: klient.menu.support,
      title: 'Støtt oss',
      description: klient.support.intro,
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
