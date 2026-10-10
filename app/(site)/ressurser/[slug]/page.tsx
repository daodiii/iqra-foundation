import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Post } from '@/components/site/Post';
import { site } from '@/content/site.no';
import { getResources } from '@/lib/content';
import { writeDate } from '@/lib/dates';

/** Only a published resource with a full text — an article written here — has a page; any other address here is a 404. */
export const dynamicParams = false;

const withPage = () => getResources().filter((r) => r.body);

export function generateStaticParams() {
  return withPage().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = withPage().find((x) => x.slug === slug);
  return r ? { title: r.title, description: r.summary } : {};
}

export default async function Ressurs({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = withPage().find((x) => x.slug === slug);
  if (!r || !r.body) notFound();
  const t = site.pages.resources;
  return (
    <Post
      back={{ href: '/ressurser', label: t.title }}
      title={r.title}
      meta={
        <>
          {t.kinds[r.kind]}
          {' · '}
          <time dateTime={r.date}>{writeDate(r.date)}</time>
        </>
      }
      area={r.area}
      image={r.image}
      action={r.file ? { href: r.file, label: t.download } : r.url ? { href: r.url, label: t.open } : null}
      body={r.body}
    />
  );
}
