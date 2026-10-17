import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Post } from '@/components/site/Post';
import { site } from '@/content/site.no';
import { getEvents } from '@/lib/content';
import { writeDateTime } from '@/lib/dates';

/** Only a published event with a full text has a page; any other address here is a 404. */
export const dynamicParams = false;

const withPage = () => getEvents().filter((e) => e.body);

export function generateStaticParams() {
  return withPage().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = withPage().find((x) => x.slug === slug);
  return e ? { title: e.title, description: e.summary } : {};
}

export default async function Arrangement({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = withPage().find((x) => x.slug === slug);
  if (!e || !e.body) notFound();
  const t = site.pages.events;
  return (
    <Post
      back={{ href: '/arrangementer', label: t.title }}
      title={e.title}
      meta={
        <>
          <time dateTime={e.time ? `${e.start}T${e.time}` : e.start}>{writeDateTime(e.start, e.time)}</time>
          {' · '}
          {e.place}
        </>
      }
      area={e.area}
      image={e.image}
      action={e.link ? { href: e.link, label: t.link } : null}
      body={e.body}
    />
  );
}
