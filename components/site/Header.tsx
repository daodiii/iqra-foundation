import Link from 'next/link';
import { site } from '@/content/site.no';
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
 */
export function Header() {
  return (
    <>
      <a href="#innhold" className={styles.skip}>
        {site.header.skip}
      </a>
      <header id="topp" className={styles.header} style={{ viewTransitionName: 'site-header' }}>
        <Link href="/" prefetch={false} className={styles.home} aria-label={site.header.homeLabel}>
          <Logo ground="white" height={40} decorative className={styles.logoOnWhite} />
          <Logo ground="navy" height={40} decorative className={styles.logoOnNavy} />
        </Link>
        <Nav />
      </header>
      <HeaderMotion />
    </>
  );
}
