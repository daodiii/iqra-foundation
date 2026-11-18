import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Body } from '@/components/site/Body';
import { COLUMN_SIZES } from '@/components/site/column';
import { Frame } from '@/components/site/Frame';
import page from '@/components/site/page.module.css';
import styles from '@/components/site/post.module.css';
import { site } from '@/content/site.no';
import { getNews } from '@/lib/content';
import { writeDate } from '@/lib/dates';

/** Only published news has a page; any other address here is a 404. Every save is a deploy, so the list is the build's. */
export const dynamicParams = false;

export function generateStaticParams() {
  return getNews()
    .filter((n) => n.body)
    .map((n) => ({ slug: n.slug }));
}

const find = (slug: string) => getNews().find((n) => n.slug === slug && n.body);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const n = find((await params).slug);
  return n ? { title: n.title, description: n.summary } : {};
}

/**
 * A news item's own page (M3): the way back to Aktuelt, the headline, the date, the ingress,
 * the picture and the article text. The article text is Markdoc as the admin writes it
 * (`Body`, from PR 62).
 */
export default async function Nyhet({ params }: { params: Promise<{ slug: string }> }) {
  const n = find((await params).slug);
  if (!n || !n.body) notFound();
  return (
    <article className={page.page}>
      <p className={styles.back}>
        <Link href="/aktuelt/nyheter" prefetch={false}>
          <span aria-hidden="true">← </span>
          {site.pages.news.newsTitle}
        </Link>
      </p>
      <h1 className={styles.title}>{n.title}</h1>
      <p className={page.meta}>
        <time dateTime={n.date}>{writeDate(n.date)}</time>
      </p>
      <p className={page.lede}>{n.summary}</p>
      {n.image && <Frame picture={n.image} sizes={COLUMN_SIZES} className={styles.picture} eager />}
      <Body source={n.body} />
    </article>
  );
}
