import type { Metadata } from 'next';
import { Aktuelt } from '@/components/aktuelt/Aktuelt';
import { copy } from '@/content/copy';
import { pageMeta } from '@/lib/meta';

const LANG = 'en';
const { site } = copy(LANG);

export const metadata: Metadata = pageMeta('newsItems', LANG, { title: site.pages.news.newsTitle, description: site.pages.news.description });

export const revalidate = 3600;

/** Aktuelt, «Nyheter»: the news only. */
export default function Page() {
  return <Aktuelt view="nyheter" lang={LANG} />;
}
