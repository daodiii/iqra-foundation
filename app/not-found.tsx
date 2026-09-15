import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '@/components/site/page.module.css';
import { site } from '@/content/site.no';

export const metadata: Metadata = { title: site.pages.notFound.title };

/** A page in the same system: the header and its menu, one plain line, the way home. */
export default function NotFound() {
  return (
    <article className={styles.page}>
      <h1 className={styles.title}>{site.pages.notFound.line}</h1>
      <p className={styles.buttons}>
        <Link href="/" prefetch={false} className={styles.button}>{site.pages.notFound.home}</Link>
      </p>
    </article>
  );
}
