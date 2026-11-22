import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import '../globals.css';
import { keystaticEnabled } from '@/lib/keystatic';
import { siteUrl } from '@/lib/site-url';
import KeystaticApp from './keystatic';

/** What the old shared root layout gave the admin: the site's address and no indexing. */
export const metadata: Metadata = { metadataBase: new URL(siteUrl), title: 'Keystatic – Iqra Foundation', robots: { index: false, follow: false } };

/**
 * /keystatic: the admin, where it can save (`lib/keystatic.ts`), a 404 where it cannot.
 * It takes the whole document — the site's header and footer would only be in its way —
 * which is why this layout renders the app and not the page. Since the site got one root layout per
 * language (2026-11-22) this is a root layout too, so it brings its own html and body.
 */
export default function Layout() {
  if (!keystaticEnabled()) notFound();
  return (
    <html lang="nb">
      <body>
        <KeystaticApp />
      </body>
    </html>
  );
}
