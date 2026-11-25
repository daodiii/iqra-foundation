import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import '../globals.css';
import { generalSans, supreme } from '../fonts';
import styles from '@/components/redaksjon/redaksjon.module.css';
import { editorEnabled } from '@/lib/redaksjon/access';
import { siteUrl } from '@/lib/site-url';

export const metadata: Metadata = { metadataBase: new URL(siteUrl), title: 'Redaksjon', robots: { index: false, follow: false } };

/**
 * /redaksjon: the foundation's own editor (spec 2026-11-19). A 404 until it is configured
 * (`lib/redaksjon/access.ts`). Editors log in with a code by e-mail (lib/redaksjon/kode.ts), which
 * needs nothing wrapped around the pages. Since the site got one root layout per language
 * (2026-11-22) this is a root layout too, so it brings its own html, body and fonts.
 */
export default async function RedaksjonLayout({ children }: { children: React.ReactNode }) {
  // Decided per request, never at build: the build has none of the editor's settings.
  await connection();
  if (!editorEnabled()) notFound();
  return (
    <html lang="nb" className={`${generalSans.variable} ${supreme.variable}`}>
      <body>
        <div className={styles.root}>{children}</div>
      </body>
    </html>
  );
}
