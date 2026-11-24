import { brief } from './brief.en.ts';
import { klient } from './klient.en.ts';
import { PATHS } from './paths.ts';
import type { Site } from './site.no.ts';
import type { Loose } from './loose.ts';

/**
 * `site.no.ts` in English, for the /en pages (2026-11-22): the menu with its English addresses,
 * the buttons, labels, empty lines and screen-reader names. Same keys as the Norwegian file;
 * `content/en.test.ts` holds the two to one shape.
 */

/** The owner's own lines about the name (site.no.ts `story`), translated. */
const story = 'Iqra is the first word of the Quran. It can mean to read or to recite. We want everyone to read, understand and learn what Islam actually is.';

const m = klient.menu;
const p = PATHS;
const nav = [
  { label: m.home, href: p.home.en },
  {
    label: m.about,
    href: p.about.en,
    children: [
      { label: m.aboutFoundation, href: p.about.en },
      { label: m.work, href: p.work.en },
      { label: m.people, href: p.people.en },
    ],
  },
  {
    label: m.news,
    href: p.news.en,
    children: [
      { label: m.newsItems, href: p.newsItems.en },
      { label: m.events, href: p.events.en },
    ],
  },
  { label: m.resources, href: p.resources.en },
  { label: m.contact, href: p.contact.en },
  { label: m.support, href: p.support.en, button: true },
] as const;

const links: readonly { label: string; href: string }[] = nav
  .flatMap<{ label: string; href: string }>((item) => ('children' in item ? [item, ...item.children] : [item]))
  .filter((l, i, all) => all.findIndex((o) => o.href === l.href) === i);

const legal = [
  { label: 'Privacy', href: p.privacy.en },
  { label: 'Terms', href: p.terms.en },
] as const;

export const site = {
  lang: 'en',
  name: 'Iqra Foundation',
  place: 'Oslo',
  nav,
  links,
  legal,
  cta: {
    about: { label: klient.home.buttons.about, href: p.about.en },
    events: { label: klient.home.buttons.events, href: p.events.en },
    partner: { label: klient.home.together.buttons.partner, href: p.contact.en },
    support: { label: klient.home.together.buttons.support, href: p.support.en },
    contact: { label: klient.menu.contact, href: p.contact.en },
  },
  header: {
    homeLabel: 'Iqra Foundation, home page',
    navLabel: 'Main menu',
    open: 'Menu',
    close: 'Close the menu',
    closeShort: 'Close',
    subOpen: 'Show the pages under',
    skip: 'Skip to content',
  },
  footer: {
    navLabel: 'Pages',
    legalLabel: 'Legal',
    orgnrLabel: 'Organisation number',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    addressLabel: 'Address',
    toTop: 'Back to top',
  },
  contact: {
    name: klient.contact.name,
    email: klient.contact.email,
    orgnr: klient.contact.orgnr,
    address: [klient.contact.postbox, klient.contact.postcode],
    phone: klient.contact.phone,
    follow: [
      { name: 'Instagram', href: '[INSTAGRAM]' },
      { name: 'Facebook', href: '[FACEBOOK]' },
    ],
  },
  support: {
    vipps: { label: 'Vipps number', value: '26354' },
    account: { label: 'Account number', value: '[KONTO]' },
    ways: { account: 'Bank transfer', vipps: 'Vipps', avtale: 'AvtaleGiro' },
    avtale: { button: 'Set up AvtaleGiro', href: 'https://nettbutikk.solidus.no/avtalestraks/D6E5B9EA-89CF-43F0-90F0-2BD4039EADD2' },
  },
  logoAlt: 'Iqra Foundation',
  language: {
    label: 'Language',
    no: { short: 'NO', name: 'Norsk' },
    en: { short: 'EN', name: 'English' },
    inNorwegian: 'In Norwegian',
  },
  months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  pages: {
    home: {
      description: klient.home.paragraphs[0],
      allEvents: 'See all events',
      visionLabel: 'Vision',
      missionLabel: 'Mission',
      areasLabel: 'Four main areas',
      /** The owner's draft lines (site.no.ts), translated; they go when the owner writes theirs. */
      contact: {
        question: 'Would you like to work with us, challenge us or start a debate?',
        line: 'We would be glad to hear from you.',
      },
    },
    about: {
      label: klient.menu.about,
      title: klient.about.title,
      description: klient.about.intro,
      story: { label: 'The name', text: story },
    },
    work: {
      label: klient.menu.work,
      title: klient.work.title,
      description: klient.work.intro,
    },
    news: {
      label: klient.menu.news,
      title: klient.news.title,
      description: klient.news.intro,
      filterLabel: 'Show',
      newsTitle: klient.menu.newsItems,
      eventsTitle: klient.menu.events,
      upcoming: 'Upcoming events',
      past: 'Past events',
      archiveTitle: 'Archive',
      archiveDescription: klient.news.archiveText,
      archiveLink: 'See the full archive',
      emptyNews: 'No news has been published yet.',
      emptyUpcoming: 'No upcoming events have been published yet.',
      emptyPast: 'No past events yet.',
      readMore: 'Read the full story',
      signup: 'Register',
      program: 'Programme',
      report: 'Summary',
      recording: 'Watch the recording',
    },
    events: {
      label: klient.menu.events,
      title: 'Events',
      description: brief.about.paragraphs[3],
      upcoming: 'Upcoming',
      past: 'Past',
      emptyUpcoming: 'No events have been published yet.',
      emptyPast: 'No past events have been published yet.',
      place: 'Place',
      time: 'Time',
      more: 'Read more',
      count: { days: 'days', hours: 'hours', minutes: 'min', seconds: 'sec' },
    },
    resources: {
      label: klient.menu.resources,
      title: klient.resources.title,
      description: klient.resources.intro,
      categoriesLabel: 'Categories',
      empty: 'Nothing has been published here yet.',
      open: 'Open',
      download: 'Download',
    },
    people: {
      label: klient.menu.people,
      title: klient.people.title,
      description: klient.people.intro,
      empty: 'Profiles of the people behind Iqra will follow.',
      photoMissing: 'Photo to follow',
    },
    documents: {
      label: 'Governing documents',
      title: 'Governing documents',
    },
    contact: {
      label: klient.menu.contact,
      title: 'Contact',
      description: brief.about.paragraphs[2],
      addressLabel: 'Address',
      emailLabel: 'Email',
      phoneLabel: 'Phone',
      orgnrLabel: 'Organisation number',
      followLabel: 'Follow us',
      map: { alt: 'Map of central Oslo', credit: '© OpenStreetMap contributors', creditHref: 'https://www.openstreetmap.org/copyright' },
      form: {
        title: 'Contact us',
        name: 'Name',
        email: 'Email',
        mobile: 'Mobile number',
        orgnr: 'Organisation number',
        message: 'Message',
        send: 'Send',
        sent: '[FORM_SENT]',
        invalid: '[FORM_INVALID]',
        failed: '[FORM_FAILED]',
        privacy: '[FORM_PRIVACY]',
      },
    },
    support: {
      label: klient.menu.support,
      title: 'Support us',
      description: klient.support.intro,
    },
    notFound: {
      title: 'Page not found',
      line: 'This page does not exist.',
      home: 'Go to the home page',
    },
  },
} as const satisfies Loose<Site>;
