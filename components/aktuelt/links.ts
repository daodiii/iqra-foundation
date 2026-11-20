import { klient } from '@/content/klient.no';

/** The three views of Aktuelt (M3): all, news, events. Each is its own address, so the filter is three links. */
export type View = 'alle' | 'nyheter' | 'arrangementer';
export const VIEWS: readonly { view: View; label: string; href: string }[] = [
  { view: 'alle', label: klient.news.filter.all, href: '/aktuelt' },
  { view: 'nyheter', label: klient.news.filter.news, href: '/aktuelt/nyheter' },
  { view: 'arrangementer', label: klient.news.filter.events, href: '/aktuelt/arrangementer' },
];
export const ARCHIVE_HREF = '/aktuelt/arkiv';
export const newsHref = (slug: string) => `/aktuelt/nyheter/${slug}`;
