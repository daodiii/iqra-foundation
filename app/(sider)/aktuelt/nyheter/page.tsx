import type { Metadata } from 'next';
import { Aktuelt } from '@/components/aktuelt/Aktuelt';
import { site } from '@/content/site.no';

export const metadata: Metadata = {
  title: site.pages.news.newsTitle,
  description: site.pages.news.description,
};

/** Aktuelt, «Nyheter»: the news only. */
export default function AktueltNyheter() {
  return <Aktuelt view="nyheter" />;
}
