import type { Metadata } from 'next';
import { Aktuelt } from '@/components/aktuelt/Aktuelt';
import { copy } from '@/content/copy';
import { pageMeta } from '@/lib/meta';

const LANG = 'en';
const { site } = copy(LANG);

export const metadata: Metadata = pageMeta('news', LANG, { title: site.pages.news.title, description: site.pages.news.description });

export const revalidate = 3600;

/** Aktuelt, «Alle»: news and the coming events. Upcoming and past are split on today's date; regenerated at most once an hour. */
export default function Page() {
  return <Aktuelt view="alle" lang={LANG} />;
}
