import type { Metadata } from 'next';
import { Arkiv } from '@/components/aktuelt/Aktuelt';
import { site } from '@/content/site.no';

export const metadata: Metadata = {
  title: site.pages.news.archiveTitle,
  description: site.pages.news.archiveDescription,
};

/** An event joins the archive the day after it ends; regenerated at most once an hour. */
export const revalidate = 3600;

export default function AktueltArkiv() {
  return <Arkiv />;
}
