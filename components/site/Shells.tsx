import { instrumentSans } from '@/app/fonts';
import { Analytics } from '@/components/site/Analytics';
import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { Smooth } from '@/components/site/Smooth';
import { Fot } from '@/components/forside/Fot';
import { Merke } from '@/components/forside/Merke';
import { Topp } from '@/components/forside/Topp';
import styles from '@/components/forside/forside.module.css';
import type { Lang } from '@/content/paths';
import { PageJsonLd } from '@/components/site/PageJsonLd';
import { copy } from '@/content/copy';
import { pageTable } from '@/lib/page-schema';
import { siteUrl } from '@/lib/site-url';

/**
 * The site's two shells, shared by both languages (2026-11-22): each language is its own root
 * layout (`app/(no)/layout.tsx`, `app/en/layout.tsx`), and under each the same groups wrap their
 * pages in these.
 *
 * `ForsideShell` is the front page's own shell, since the redesign (2026-11-19): its header «Kameleon»
 * with the menu layer, its navy foot, and Instrument Sans in place of the brand's two faces. With
 * `mark` it is the redesigned subpages' shell: no hero to fly the logo in, so the logo stands in the
 * header from the first frame (`data-solid`) and the header follows the ground under it at once.
 * The first script marks the page as running JavaScript before it paints, so what waits to be
 * revealed is hidden from the first frame; without JavaScript everything stands as laid out.
 *
 * `SiteShell` is the site's old shell, kept by the article, the archive and the legal pages: the
 * header, the main region and the footer, with one glide for the whole visit (`Smooth`).
 */
export function ForsideShell({ lang, mark = false, children }: { lang: Lang; mark?: boolean; children: React.ReactNode }) {
  return (
    <div id="topp" className={`${instrumentSans.variable} ${styles.page}`} data-forside data-solid={mark ? '' : undefined}>
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.dataset.js=''" }} />
      <Merke />
      <Smooth />
      <Analytics />
      <PageJsonLd table={pageTable(lang)} siteUrl={siteUrl} inLanguage={copy(lang).site.lang} />
      <Topp mark={mark} />
      <main id="innhold" className={styles.main}>
        {children}
      </main>
      <Fot lang={lang} />
    </div>
  );
}

export function SiteShell({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return (
    <>
      <Smooth />
      <Analytics />
      <PageJsonLd table={pageTable(lang)} siteUrl={siteUrl} inLanguage={copy(lang).site.lang} />
      <Header lang={lang} />
      <main id="innhold">{children}</main>
      <Footer lang={lang} />
    </>
  );
}
