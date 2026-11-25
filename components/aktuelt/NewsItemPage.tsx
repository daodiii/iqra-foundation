import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Body } from '@/components/site/Body';
import { COLUMN_SIZES } from '@/components/site/column';
import { Frame } from '@/components/site/Frame';
import page from '@/components/site/page.module.css';
import styles from '@/components/site/post.module.css';
import { copy } from '@/content/copy';
import { newsItemPath, PATHS, type Lang } from '@/content/paths';
import { getNews } from '@/lib/content';
import { writeDate } from '@/lib/dates';
import { articleGraph } from '@/lib/article-schema';
import { ldJson } from '@/lib/page-graph';

const find = (slug: string) => getNews().find((n) => n.slug === slug && n.body);

/** Every news item that has an article: the pages to build, the same slugs in both languages. */
export const newsItemSlugs = () =>
  getNews()
    .filter((n) => n.body)
    .map((n) => ({ slug: n.slug }));

/**
 * An article is written in Norwegian and the English page shows it as it is, in the English frame. So
 * the Norwegian page is the one to index: both pages name it as canonical, and neither claims an
 * English version (SEO audit, second run, 2026-11-25).
 */
export function newsItemMeta(slug: string, lang: Lang): Metadata {
  const n = find(slug);
  void lang;
  const no = newsItemPath(slug, 'no');
  return n ? { title: n.title, description: n.summary, alternates: { canonical: no, languages: { nb: no, 'x-default': no } } } : {};
}

/**
 * A news item's own page (M3): the way back to Aktuelt, the headline, the date, the ingress,
 * the picture and the article text. The article text is Markdoc as the admin writes it
 * (`Body`, from PR 62). An editor writes in Norwegian; on the English page the frame is English,
 * the article is marked «In Norwegian» and carries `lang="nb"`, so a screen reader reads it right.
 */
export function NewsItemPage({ slug, lang }: { slug: string; lang: Lang }) {
  const n = find(slug);
  if (!n || !n.body) notFound();
  const { site } = copy(lang);
  const foreign = lang === 'en' ? 'nb' : undefined;
  return (
    <article className={page.page}>
      {lang === 'no' && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(articleGraph(n)) }} />}
      <p className={styles.back}>
        <Link href={PATHS.newsItems[lang]} prefetch={false}>
          <span aria-hidden="true">← </span>
          {site.pages.news.newsTitle}
        </Link>
      </p>
      <div lang={foreign}>
        <h1 className={styles.title}>{n.title}</h1>
        <p className={page.meta}>
          <time dateTime={n.date} lang={lang === 'en' ? 'en' : undefined}>
            {writeDate(n.date, lang)}
          </time>
          {foreign && <span lang="en"> · {site.language.inNorwegian}</span>}
        </p>
        <p className={page.lede}>{n.summary}</p>
        {n.image && <Frame picture={n.image} sizes={COLUMN_SIZES} className={styles.picture} eager />}
        <Body source={n.body} />
      </div>
    </article>
  );
}
