import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NewsCard } from '@/components/aktuelt/Aktuelt';
import { Lesing } from '@/components/aktuelt/Lesing';
import a from '@/components/aktuelt/artikkel.module.css';
import { Body } from '@/components/site/Body';
import page from '@/components/site/page.module.css';
import { copy } from '@/content/copy';
import { newsItemPath, PATHS, type Lang } from '@/content/paths';
import { getNews } from '@/lib/content';
import { writeDate } from '@/lib/dates';
import { alternates } from '@/lib/meta';
import { outline, readingMinutes } from '@/lib/outline';

const find = (slug: string) => getNews().find((n) => n.slug === slug && n.body);

/** Every news item that has an article: the pages to build, the same slugs in both languages. */
export const newsItemSlugs = () =>
  getNews()
    .filter((n) => n.body)
    .map((n) => ({ slug: n.slug }));

export function newsItemMeta(slug: string, lang: Lang): Metadata {
  const n = find(slug);
  return n ? { title: n.title, description: n.summary, alternates: alternates(newsItemPath(slug, 'no'), newsItemPath(slug, 'en'), lang) } : {};
}

/** The few words this page has of its own, in both languages. */
const WORDS = {
  no: { read: (m: number) => `${m} min lesing`, more: 'Flere nyheter', toAll: 'Til Aktuelt' },
  en: { read: (m: number) => `${m} min read`, more: 'More news', toAll: 'To Aktuelt' },
} as const;

/**
 * A news item's own page (Artikkel 4, the owner's pick 2026-11-19): the picture under the header
 * with the headline on it, the ingress and the text on a sheet that slides up over the picture,
 * and beside the text the contents, marking where you are and how far you have read. A post
 * without a picture opens on navy. The article text is Markdoc as the editor writes it (`Body`).
 * An editor writes in Norwegian; on the English page the frame is English, the article is marked
 * «In Norwegian» and carries `lang="nb"`, so a screen reader reads it right.
 */
export function NewsItemPage({ slug, lang }: { slug: string; lang: Lang }) {
  const n = find(slug);
  if (!n || !n.body) notFound();
  const { site } = copy(lang);
  const w = WORDS[lang];
  const foreign = lang === 'en' ? 'nb' : undefined;
  const parts = outline(n.body);
  const others = getNews().filter((o) => o.slug !== n.slug).slice(0, 3);
  const back = <Link href={PATHS.newsItems[lang]} prefetch={false}>{site.pages.news.newsTitle}</Link>;
  const date = (
    <time dateTime={n.date} lang={lang === 'en' ? 'en' : undefined}>{writeDate(n.date, lang)}</time>
  );
  const read = w.read(readingMinutes(n.summary, n.body));
  const inNorwegian = foreign ? <span lang="en">{site.language.inNorwegian}</span> : null;

  return (
    <article className={a.article}>
      <header className={a.cover} data-plain={n.image ? undefined : true}>
        {n.image && <Image src={n.image.src} alt={n.image.alt} fill sizes="100vw" style={{ objectFit: 'cover', objectPosition: '50% 45%' }} loading="eager" fetchPriority="high" />}
        <div className={a.coverText}><h1 lang={foreign}>{n.title}</h1></div>
      </header>

      <div className={a.sheet}>
        <Lesing
          parts={parts} textId="artikkel-tekst"
          meta={<p className={a.meta}>{back}<br />{date}<br />{read}{inNorwegian && <><br />{inNorwegian}</>}</p>}
        />
        <div className={a.main} id="artikkel-tekst">
          <p className={a.metaPhone}>{back} · {date} · {read}{inNorwegian && <> · {inNorwegian}</>}</p>
          <div lang={foreign}>
            <p className={a.lede}>{n.summary}</p>
            <Body source={n.body} className={a.prose} />
          </div>
        </div>
      </div>

      <section className={a.more} aria-labelledby="flere">
        <h2 id="flere">{w.more}</h2>
        {others.length > 0 && <ul className={`${page.list} ${a.moreList}`}>{others.map((o) => <NewsCard key={o.slug} n={o} lang={lang} />)}</ul>}
        <Link className={a.moreLink} href={PATHS.newsItems[lang]} prefetch={false}>{w.toAll} <span aria-hidden="true">→</span></Link>
      </section>
    </article>
  );
}
