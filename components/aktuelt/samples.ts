import type { Lang } from '@/content/paths';
import type { Event, NewsItem } from '@/lib/content';

/**
 * The samples Aktuelt shows while nothing is published: the same three news posts and three events
 * the front page shows (components/forside/Forside.tsx, the owner's wish of 2026-11-20), each marked
 * «Eksempel». They stand in only while the collection is empty, and lead nowhere.
 */
export const SAMPLE = 'Eksempel';

const base = { image: null, body: null };
export const NEWS_SAMPLES: NewsItem[] = [
  { ...base, slug: 'eksempel-nyhet-1', date: '2026-11-18', title: 'Iqra Foundation åpner for samarbeidspartnere', summary: 'Vi inviterer organisasjoner og fagmiljøer til å bygge møteplasser sammen med oss.' },
  { ...base, slug: 'eksempel-nyhet-2', date: '2026-11-06', title: 'Første samtalekveld samlet unge voksne i Oslo', summary: 'Kvelden handlet om tillit, fellesskap og hvordan vi kan delta mer i samfunnet.' },
  { ...base, slug: 'eksempel-nyhet-3', date: '2026-10-24', title: 'Ny serie med åpne foredrag i vinter', summary: 'Gjennom vinteren holder vi foredrag om kunnskap, dialog og samfunnsdeltakelse.' },
];

const ev = { end: null, text: '', link: null, program: null, report: null, recording: null, image: null, area: null, place: 'Oslo' };
export const EVENT_SAMPLES: Event[] = [
  { ...ev, slug: 'eksempel-1', start: '2026-12-04', time: '18:00', title: 'Åpent foredrag: kunnskap og samfunn' },
  { ...ev, slug: 'eksempel-2', start: '2027-01-15', time: '19:00', title: 'Samtalekveld for unge voksne' },
  { ...ev, slug: 'eksempel-3', start: '2027-02-06', time: '11:00', title: 'Seminar om dialog og fellesskap' },
];

/** The same samples in English, for the /en pages (2026-11-22). */
export const NEWS_SAMPLES_EN: NewsItem[] = [
  { ...base, slug: 'eksempel-nyhet-1', date: '2026-11-18', title: 'Iqra Foundation opens up to partners', summary: 'We are inviting organisations and professional communities to build meeting places with us.' },
  { ...base, slug: 'eksempel-nyhet-2', date: '2026-11-06', title: 'First conversation evening brings young adults together in Oslo', summary: 'The evening was about trust, community and how we can take a fuller part in society.' },
  { ...base, slug: 'eksempel-nyhet-3', date: '2026-10-24', title: 'A new series of open lectures this winter', summary: 'Through the winter we are holding lectures on knowledge, dialogue and civic participation.' },
];

export const EVENT_SAMPLES_EN: Event[] = [
  { ...ev, slug: 'eksempel-1', start: '2026-12-04', time: '18:00', title: 'Open lecture: knowledge and society' },
  { ...ev, slug: 'eksempel-2', start: '2027-01-15', time: '19:00', title: 'Conversation evening for young adults' },
  { ...ev, slug: 'eksempel-3', start: '2027-02-06', time: '11:00', title: 'Seminar on dialogue and community' },
];

/** The samples in a language. */
export const samplesFor = (lang: Lang) =>
  lang === 'en' ? { news: NEWS_SAMPLES_EN, events: EVENT_SAMPLES_EN } : { news: NEWS_SAMPLES, events: EVENT_SAMPLES };
