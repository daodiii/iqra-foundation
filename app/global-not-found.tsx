import type { Metadata } from 'next';
import { NotFound } from '@/components/site/NotFound';
import { site } from '@/content/site.no';
import { siteUrl } from '@/lib/site-url';
import { generalSans, supreme } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${site.pages.notFound.title} – ${site.name}`,
  robots: { index: false, follow: false },
};

/**
 * An address no route matches (2026-11-22). The site has two root layouts now, one per language, so
 * there is no single layout for Next to wrap a 404 in; this page brings its own html. It is in
 * Norwegian, the site's default, and its header and foot carry the language switch like any page.
 */
export default function GlobalNotFound() {
  return (
    <html lang={site.lang} className={`${generalSans.variable} ${supreme.variable}`}>
      <body>
        <NotFound lang="no" />
      </body>
    </html>
  );
}
