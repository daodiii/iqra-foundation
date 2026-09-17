import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import styles from '@/components/site/page.module.css';
import { site } from '@/content/site.no';

export const metadata: Metadata = { title: site.pages.notFound.title };

/**
 * A page in the same system: the header and its menu, one plain line, the way home. An
 * unmatched URL renders under the root layout, outside the `(site)` group, so this page
 * carries the shell itself.
 */
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="innhold">
        <article className={styles.page}>
          <h1 className={styles.title}>{site.pages.notFound.line}</h1>
          <p className={styles.buttons}>
            <Link href="/" prefetch={false} className={styles.button}>{site.pages.notFound.home}</Link>
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
