import type { Metadata } from 'next';
import { Aktuelt } from '@/components/aktuelt/Aktuelt';
import { site } from '@/content/site.no';

export const metadata: Metadata = {
  title: site.pages.news.eventsTitle,
  description: site.pages.news.description,
};

/** Upcoming and past are split on today's date; regenerated at most once an hour, so an event moves to the archive on its own. */
export const revalidate = 3600;

/** Aktuelt, «Arrangementer»: the coming events, then the past ones as the archive. */
export default function AktueltArrangementer() {
  return <Aktuelt view="arrangementer" />;
}
