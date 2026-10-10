import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Post } from '@/components/site/Post';
import { site } from '@/content/site.no';
import { getNews } from '@/lib/content';
import { writeDate } from '@/lib/dates';

/** Only a published item with a full text has a page; any other address here is a 404. */
export const dynamicParams = false;

const withPage = () => getNews().filter((n) => n.body);

export function generateStaticParams() {
  return withPage().map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const n = withPage().find((x) => x.slug === slug);
  return n ? { title: n.title, description: n.summary } : {};
}

export default async function Nyhet({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = withPage().find((x) => x.slug === slug);
  if (!n || !n.body) notFound();
  return (
    <Post
      back={{ href: '/arrangementer#nyheter', label: site.pages.events.title }}
      title={n.title}
      meta={<time dateTime={n.date}>{writeDate(n.date)}</time>}
      area={n.area}
      image={n.image}
      body={n.body}
    />
  );
}
