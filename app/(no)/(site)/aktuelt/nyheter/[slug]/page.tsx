import type { Metadata } from 'next';
import { newsItemMeta, NewsItemPage, newsItemSlugs } from '@/components/aktuelt/NewsItemPage';

/** Only published news has a page; any other address here is a 404. Every save is a deploy, so the list is the build's. */
export const dynamicParams = false;

export function generateStaticParams() {
  return newsItemSlugs();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return newsItemMeta((await params).slug, 'no');
}

/** A news item's own page (components/aktuelt/NewsItemPage.tsx). */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <NewsItemPage slug={(await params).slug} lang="no" />;
}
