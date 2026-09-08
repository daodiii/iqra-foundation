import Link from 'next/link';
import { site } from '@/content/site.no';
import styles from './header.module.css';

/**
 * The wordmark and one link. Both start visible: on the landing page the hero hides them
 * and brings them in once the letters have opened, which is a thing the hero does rather
 * than a thing the stylesheet assumes — a page without a hero has nobody to turn them
 * back on, and this header is on every page.
 *
 * `data-on-dark` lives on the wordmark and the nav follows it through a sibling selector,
 * so there is still exactly one attribute saying what the ground behind the header is.
 */
export function Header() {
  return (
    <header className={styles.header}>
      <Link
        id="site-wordmark"
        href="/"
        prefetch={false}
        className={styles.wordmark}
        aria-label={site.header.homeLabel}
        data-on-dark="false"
      >
        {site.header.wordmark}
      </Link>
      <nav id="site-nav" className={styles.nav} aria-label={site.header.navLabel}>
        <Link href="/om-oss" prefetch={false} className={styles.navLink}>
          {site.about.label}
        </Link>
      </nav>
    </header>
  );
}
