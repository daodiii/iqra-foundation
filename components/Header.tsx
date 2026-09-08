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
 *
 * `ground` is for a page whose content is an ordinary document rather than full-bleed
 * sections: the header is transparent so the film can run under it, and on a page that
 * simply scrolls, the copy runs under it instead and prints through the wordmark. The
 * page that has a ground says so; nothing here guesses.
 */
export function Header({ ground = false }: { ground?: boolean } = {}) {
  return (
    <header className={styles.header} data-ground={ground || undefined}>
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
        {/*
          Rooted, not a bare `#stott-oss`: the section lives at the foot of the landing
          page but this header is on every page, and from /om-oss a bare hash points at
          an element that is not there.
        */}
        <Link href="/#stott-oss" prefetch={false} className={styles.navLink}>
          {site.support.label}
        </Link>
      </nav>
    </header>
  );
}
