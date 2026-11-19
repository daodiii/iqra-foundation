import { site } from '@/content/site.no';
import { getEvents, getNews, splitEvents, todayISO, type Event, type NewsItem } from '@/lib/content';
import { writeDate } from '@/lib/dates';
import { newsHref } from '@/components/aktuelt/Aktuelt';
import { Hero } from './Hero';
import { Lagene } from './Lagene';
import { NEWS_HREF } from './lenker';
import { Plakater, type Poster, type Strip } from './Plakater';
import { Pour } from './Pour';
import { Samlet } from './Samlet';
import { Spor } from './Spor';
import { Trinn } from './Trinn';

/** How many of each the front page shows (the owner, 2026-11-18: «3 would be good … and then you can click on it to see all»). */
export const SHOWN = 3;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** An event as a poster: «04», «Desember 2026», the title, «kl. 18:00 · Oslo». */
export function toPoster(e: Event): Poster {
  const [y, mo, d] = e.start.split('-');
  return {
    slug: e.slug,
    day: d,
    month: `${cap(site.months[Number(mo) - 1])} ${y}`,
    title: e.title,
    meta: e.time ? `kl. ${e.time} · ${e.place}` : e.place,
    dateTime: e.time ? `${e.start}T${e.time}` : e.start,
  };
}

/** A news item in the strip; it leads to its article when it has one, else to the news. */
export function toStrip(n: NewsItem): Strip {
  return { slug: n.slug, date: writeDate(n.date), dateTime: n.date, title: n.title, summary: n.summary, href: n.body ? newsHref(n.slug) : NEWS_HREF };
}

/**
 * The front page, the owner's redesign (2026-11-18/19), top to bottom: hero «Midt»; the pour scene
 * into «Hvorfor vi finnes»; «Dette ønsker vi å skape» (Sporet); «Fra kunnskap til handling»
 * (Trinnene); «Aktuelt» (Plakatene) with the real news and events; the finale (Samlet). The foot
 * is the layout's. Every word is the client's (content/klient.no.ts) or the site's own labels.
 */
export function Forside() {
  const news = getNews().slice(0, SHOWN).map(toStrip);
  const { upcoming } = splitEvents(getEvents(), todayISO());
  const events = upcoming.slice(0, SHOWN).map(toPoster);
  return (
    <>
      <Hero />
      <Pour />
      <Spor />
      <Trinn />
      <Plakater events={events} news={news} />
      <Samlet />
      <Lagene />
    </>
  );
}
