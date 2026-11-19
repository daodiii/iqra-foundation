import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NewsCard } from '@/components/aktuelt/Aktuelt';
import { Lesing } from '@/components/aktuelt/Lesing';
import a from '@/components/aktuelt/artikkel.module.css';
import { Body } from '@/components/site/Body';
import page from '@/components/site/page.module.css';
import { site } from '@/content/site.no';
import { getNews } from '@/lib/content';
import { writeDate } from '@/lib/dates';
import { outline, readingMinutes } from '@/lib/outline';

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
 * A news item's own page (Artikkel 4, the owner's pick 2026-11-19): the picture under the header
 * with the headline on it, the ingress and the text on a sheet that slides up over the picture,
 * and beside the text the contents, marking where you are and how far you have read. A post
 * without a picture opens on navy. The article text is Markdoc as the editor writes it (`Body`).
 */
export default async function Nyhet({ params }: { params: Promise<{ slug: string }> }) {
  const n = find((await params).slug);
  if (!n || !n.body) notFound();
  const parts = outline(n.body);
  const minutes = readingMinutes(n.summary, n.body);
  const others = getNews().filter((o) => o.slug !== n.slug).slice(0, 3);
  const back = <Link href="/aktuelt/nyheter" prefetch={false}>{site.pages.news.newsTitle}</Link>;
  const date = <time dateTime={n.date}>{writeDate(n.date)}</time>;
  const read = `${minutes} min lesing`;

  return (
    <article className={a.article}>
      <header className={a.cover} data-plain={n.image ? undefined : true}>
        {n.image && <Image src={n.image.src} alt={n.image.alt} fill sizes="100vw" style={{ objectFit: 'cover', objectPosition: '50% 45%' }} loading="eager" fetchPriority="high" />}
        <div className={a.coverText}><h1>{n.title}</h1></div>
      </header>

      <div className={a.sheet}>
        <Lesing parts={parts} textId="artikkel-tekst" meta={<p className={a.meta}>{back}<br />{date}<br />{read}</p>} />
        <div className={a.main} id="artikkel-tekst">
          <p className={a.metaPhone}>{back} · {date} · {read}</p>
          <p className={a.lede}>{n.summary}</p>
          <Body source={n.body} className={a.prose} />
        </div>
      </div>

      <section className={a.more} aria-labelledby="flere">
        <h2 id="flere">Flere nyheter</h2>
        {others.length > 0 && <ul className={`${page.list} ${a.moreList}`}>{others.map((o) => <NewsCard key={o.slug} n={o} />)}</ul>}
        <Link className={a.moreLink} href="/aktuelt/nyheter" prefetch={false}>Til Aktuelt <span aria-hidden="true">→</span></Link>
      </section>
    </article>
  );
}
