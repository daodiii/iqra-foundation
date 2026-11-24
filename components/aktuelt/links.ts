import { copy } from '@/content/copy';
import { newsItemPath, PATHS, type Lang } from '@/content/paths';

/** The three views of Aktuelt (M3): all, news, events. Each is its own address, so the filter is three links. */
export type View = 'alle' | 'nyheter' | 'arrangementer';
export function viewsFor(lang: Lang): readonly { view: View; label: string; href: string }[] {
  const f = copy(lang).klient.news.filter;
  return [
    { view: 'alle', label: f.all, href: PATHS.news[lang] },
    { view: 'nyheter', label: f.news, href: PATHS.newsItems[lang] },
    { view: 'arrangementer', label: f.events, href: PATHS.events[lang] },
  ];
}
export const VIEWS = viewsFor('no');
export const ARCHIVE_HREF = PATHS.archive.no;
export const newsHref = (slug: string, lang: Lang = 'no') => newsItemPath(slug, lang);
