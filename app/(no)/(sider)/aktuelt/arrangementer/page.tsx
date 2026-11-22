import type { Metadata } from 'next';
import { Aktuelt } from '@/components/aktuelt/Aktuelt';
import { copy } from '@/content/copy';
import { pageMeta } from '@/lib/meta';

const LANG = 'no';
const { site } = copy(LANG);

export const metadata: Metadata = pageMeta('events', LANG, { title: site.pages.news.eventsTitle, description: site.pages.news.description });

export const revalidate = 3600;

/** Aktuelt, «Arrangementer»: the coming events, then the past ones as the archive. */
export default function Page() {
  return <Aktuelt view="arrangementer" lang={LANG} />;
}
