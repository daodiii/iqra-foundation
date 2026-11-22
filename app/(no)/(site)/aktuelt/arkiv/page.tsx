import type { Metadata } from 'next';
import { Arkiv } from '@/components/aktuelt/Aktuelt';
import { copy } from '@/content/copy';
import { pageMeta } from '@/lib/meta';

const LANG = 'no';
const { site } = copy(LANG);

export const metadata: Metadata = pageMeta('archive', LANG, { title: site.pages.news.archiveTitle, description: site.pages.news.archiveDescription });

export const revalidate = 3600;

/** The archive: every past event. An event joins it the day after it ends; regenerated at most once an hour. */
export default function Page() {
  return <Arkiv lang={LANG} />;
}
