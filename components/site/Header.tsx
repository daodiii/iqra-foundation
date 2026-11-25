import Link from 'next/link';
import { copy } from '@/content/copy';
import type { Lang } from '@/content/paths';
import { HeaderMotion } from './HeaderMotion';
import { Logo } from './Logo';
import { Nav } from './Nav';
import styles from './site.module.css';

/**
 * On every page: the skip link, the logo home, the nine items. The header is the site's
 * navigation, which is what the brief asked for in place of a long page («litt for mye
 * scrolling i dagens løsning»).
 *
 * Two logos, one shown: the guide's for white, and the reversed one for navy — the header turns
 * navy while the phone's drawer is open, and (elite study) whenever a navy plate passes under it
 * (`HeaderMotion`, which also takes it away while the page is read downward and brings it back the
 * moment the reader goes up). Both are decorative — the link is named. The header keeps its place
 * through a page change (`site-header` in globals.css): it is the frame the page changes inside.
 *
 * Only the white logo is fetched first in line, and only where the header is the page's own: the
 * navy one shows later (a drawer, a navy plate), and the 404 page's header sits in every page's
 * not-found boundary, where a priority made every page preload both files (SEO audit, 2026-11-25).
 */
export function Header({ lang = 'no', priority = true }: { lang?: Lang; priority?: boolean }) {
  const { site } = copy(lang);
  return (
    <>
      <a href="#innhold" className={styles.skip}>
        {site.header.skip}
      </a>
      <header id="topp" className={styles.header} style={{ viewTransitionName: 'site-header' }}>
        <Link href={site.nav[0].href} prefetch={false} className={styles.home} aria-label={site.header.homeLabel}>
          <Logo ground="white" height={40} decorative priority={priority} className={styles.logoOnWhite} />
          <Logo ground="navy" crimson height={40} decorative className={styles.logoOnNavy} />
        </Link>
        <Nav />
      </header>
      <HeaderMotion />
    </>
  );
}
