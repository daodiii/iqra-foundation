import Link from 'next/link';
import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import styles from '@/components/site/page.module.css';
import { copy } from '@/content/copy';
import type { Lang } from '@/content/paths';

/**
 * A page in the same system: the header and its menu, one plain line, the way home. A missing page
 * renders outside the groups' shells, so this page carries the shell itself.
 */
export function NotFound({ lang = 'no' }: { lang?: Lang }) {
  const { site } = copy(lang);
  return (
    <>
      <Header lang={lang} />
      <main id="innhold">
        <article className={styles.page}>
          <h1 className={styles.title}>{site.pages.notFound.line}</h1>
          <p className={styles.buttons}>
            <Link href={site.nav[0].href} prefetch={false} className={styles.button}>
              {site.pages.notFound.home}
            </Link>
          </p>
        </article>
      </main>
      <Footer lang={lang} />
    </>
  );
}
