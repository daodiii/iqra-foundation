import { copy } from '@/content/copy';
import { PATHS, type Lang } from '@/content/paths';
import { getEvents, getNews, splitEvents, todayISO, type Event, type NewsItem } from '@/lib/content';
import { writeDate, writeTime } from '@/lib/dates';
import { newsHref } from '@/components/aktuelt/Aktuelt';
import { Hero } from './Hero';
import { samplesFor } from '@/components/aktuelt/samples';
import { Plakater, type Poster, type Strip } from './Plakater';
import { Pour } from './Pour';
import { Samlet } from './Samlet';
import { Spor } from './Spor';
import { Takt } from './Takt';
import { Trinn } from './Trinn';

/** How many of each the front page shows (the owner, 2026-11-18: «3 would be good … and then you can click on it to see all»). */
export const SHOWN = 3;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * An event as a poster: «04», «Desember 2026», the title, «kl. 18:00 · Oslo». On an English page
 * the words around it are English and the event, written in Norwegian by an editor, says so.
 */
export function toPoster(e: Event, lang: Lang = 'no'): Poster {
  const [y, mo, d] = e.start.split('-');
  return {
    slug: e.slug,
    day: d,
    month: `${cap(copy(lang).site.months[Number(mo) - 1])} ${y}`,
    title: e.title,
    meta: e.time ? `${writeTime(e.time, lang)} · ${e.place}` : e.place,
    dateTime: e.time ? `${e.start}T${e.time}` : e.start,
    ...(lang === 'en' ? { foreign: true } : {}),
  };
}

/**
 * Three sample events (the owner, 2026-11-20: «make 3 arrangements, just mark so that we can see how
 * it will look»). Each poster says «Eksempel». They stand in while no real event is coming, on the
 * live site too (the owner, 2026-11-20: «show the sample events on the live site too»); the first
 * real event replaces them.
 */
export const EXAMPLES: Poster[] = [
  { slug: 'eksempel-1', day: '04', month: 'Desember 2026', title: 'Åpent foredrag: kunnskap og samfunn', meta: 'kl. 18:00 · Oslo', dateTime: '2026-12-04T18:00', example: true },
  { slug: 'eksempel-2', day: '15', month: 'Januar 2027', title: 'Samtalekveld for unge voksne', meta: 'kl. 19:00 · Oslo', dateTime: '2027-01-15T19:00', example: true },
  { slug: 'eksempel-3', day: '06', month: 'Februar 2027', title: 'Seminar om dialog og fellesskap', meta: 'kl. 11:00 · Oslo', dateTime: '2027-02-06T11:00', example: true },
];

/** The coming events to show: the real ones, or the samples where they may stand in. */
export function shownEvents(real: Poster[], lang: Lang = 'no'): Poster[] {
  if (real.length) return real;
  if (lang === 'no') return EXAMPLES;
  return samplesFor(lang).events.map((e) => ({ ...toPoster(e, lang), foreign: undefined, example: true }));
}

/** Three sample news posts (the owner, 2026-11-20: «make sample news posts too»), marked «Eksempel» like the events. */
export const NEWS_EXAMPLES: Strip[] = [
  { slug: 'eksempel-nyhet-1', date: writeDate('2026-11-18'), dateTime: '2026-11-18', title: 'Iqra Foundation åpner for samarbeidspartnere', summary: 'Vi inviterer organisasjoner og fagmiljøer til å bygge møteplasser sammen med oss.', href: PATHS.newsItems.no, example: true },
  { slug: 'eksempel-nyhet-2', date: writeDate('2026-11-06'), dateTime: '2026-11-06', title: 'Første samtalekveld samlet unge voksne i Oslo', summary: 'Kvelden handlet om tillit, fellesskap og hvordan vi kan delta mer i samfunnet.', href: PATHS.newsItems.no, example: true },
  { slug: 'eksempel-nyhet-3', date: writeDate('2026-10-24'), dateTime: '2026-10-24', title: 'Ny serie med åpne foredrag i vinter', summary: 'Gjennom vinteren holder vi foredrag om kunnskap, dialog og samfunnsdeltakelse.', href: PATHS.newsItems.no, example: true },
];

/** The news to show: the real posts, or the samples while none is published. */
export function shownNews(real: Strip[], lang: Lang = 'no'): Strip[] {
  if (real.length) return real;
  if (lang === 'no') return NEWS_EXAMPLES;
  return samplesFor(lang).news.map((n) => ({ ...toStrip(n, lang), href: PATHS.newsItems[lang], foreign: undefined, example: true }));
}

/** A news item in the strip; it leads to its article when it has one, else to the news. On an English page it is marked as Norwegian. */
export function toStrip(n: NewsItem, lang: Lang = 'no'): Strip {
  return {
    slug: n.slug,
    date: writeDate(n.date, lang),
    dateTime: n.date,
    title: n.title,
    summary: n.summary,
    href: n.body ? newsHref(n.slug, lang) : PATHS.newsItems[lang],
    ...(lang === 'en' ? { foreign: true } : {}),
  };
}

/**
 * The front page, the owner's redesign (2026-11-18/19), top to bottom: hero «Midt»; the pour scene
 * into «Hvorfor vi finnes»; «Dette ønsker vi å skape» (Sporet); «Fra kunnskap til handling»
 * (Trinnene); «Aktuelt» (Plakatene) with the real news and events; the finale (Samlet). The foot
 * is the layout's. Every word is the client's (content/klient.no.ts) or the site's own labels.
 */
export function Forside({ lang = 'no' }: { lang?: Lang }) {
  const news = shownNews(getNews().slice(0, SHOWN).map((n) => toStrip(n, lang)), lang);
  const { upcoming } = splitEvents(getEvents(), todayISO());
  const events = shownEvents(upcoming.slice(0, SHOWN).map((e) => toPoster(e, lang)), lang);
  return (
    <>
      <Hero />
      <Pour />
      <Spor />
      <Trinn />
      <Plakater events={events} news={news} />
      <Samlet />
      <Takt />
    </>
  );
}
