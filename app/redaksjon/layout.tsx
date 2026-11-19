import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import styles from '@/components/redaksjon/redaksjon.module.css';
import { editorEnabled, testEditor } from '@/lib/redaksjon/access';

export const metadata: Metadata = { title: 'Redaksjon', robots: { index: false, follow: false } };

/**
 * /redaksjon: the foundation's own editor (spec 2026-11-19). A 404 until it is configured
 * (`lib/redaksjon/access.ts`). Clerk's provider wraps it only when Clerk is the way in; the test
 * editor of `next dev` and e2e runs without it.
 */
export default async function RedaksjonLayout({ children }: { children: React.ReactNode }) {
  // Decided per request, never at build: the build has none of the editor's settings.
  await connection();
  if (!editorEnabled()) notFound();
  const body = <div className={styles.root}>{children}</div>;
  if (testEditor()) return body;
  const { ClerkProvider } = await import('@clerk/nextjs');
  const { nbNO } = await import('@clerk/localizations');
  return (
    <ClerkProvider
      localization={nbNO}
      signInUrl="/redaksjon/logg-inn"
      signInFallbackRedirectUrl="/redaksjon"
      appearance={{
        variables: {
          colorPrimary: '#2c394b',
          fontFamily: 'var(--font-general-sans), "Segoe UI", system-ui, sans-serif',
          borderRadius: '10px',
        },
      }}
    >
      {body}
    </ClerkProvider>
  );
}
