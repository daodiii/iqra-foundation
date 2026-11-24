/**
 * The site's two languages and every page's address in each (2026-11-22). Norwegian stays at
 * the root, as it always was; English lives under /en with English slugs, as the owner chose.
 *
 * One table, read by the menus, the language switch, the sitemap and each page's `hreflang`
 * alternates, so a page cannot be linked under one address and announced under another.
 */
export type Lang = 'no' | 'en';
export const LANGS: readonly Lang[] = ['no', 'en'];

export const PATHS = {
  home: { no: '/', en: '/en' },
  about: { no: '/om-oss', en: '/en/about-us' },
  work: { no: '/vart-arbeid', en: '/en/our-work' },
  people: { no: '/menneskene-bak', en: '/en/our-people' },
  news: { no: '/aktuelt', en: '/en/news-and-events' },
  newsItems: { no: '/aktuelt/nyheter', en: '/en/news-and-events/news' },
  events: { no: '/aktuelt/arrangementer', en: '/en/news-and-events/events' },
  archive: { no: '/aktuelt/arkiv', en: '/en/news-and-events/archive' },
  resources: { no: '/ressurser', en: '/en/resources' },
  contact: { no: '/kontakt', en: '/en/contact' },
  support: { no: '/stott-oss', en: '/en/support-us' },
  privacy: { no: '/personvern', en: '/en/privacy' },
  terms: { no: '/vilkar', en: '/en/terms' },
} as const satisfies Record<string, Record<Lang, string>>;

export type PageKey = keyof typeof PATHS;

/** A page's address in a language. */
export const pathOf = (page: PageKey, lang: Lang): string => PATHS[page][lang];

/** One news item's address: under News in either language, the slug the same. */
export const newsItemPath = (slug: string, lang: Lang): string => `${PATHS.newsItems[lang]}/${slug}`;

/** Which language an address is in: anything under /en is English, the rest Norwegian. */
export const langOf = (pathname: string): Lang => (pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'no');

/**
 * The same page in the other language: the longest known address the path starts with is
 * swapped for its twin, and what follows (a news item's slug) is kept. A path the table does
 * not know goes to the other language's home page rather than to a 404.
 */
export function counterpart(pathname: string, to: Lang): string {
  const from = langOf(pathname);
  if (from === to) return pathname;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const pages = Object.values(PATHS)
    .filter((p) => p !== PATHS.home)
    .sort((a, b) => b[from].length - a[from].length);
  if (path === PATHS.home[from]) return PATHS.home[to];
  for (const p of pages) {
    if (path === p[from]) return p[to];
    if (path.startsWith(`${p[from]}/`)) return p[to] + path.slice(p[from].length);
  }
  return PATHS.home[to];
}
