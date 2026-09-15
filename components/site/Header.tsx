import Link from 'next/link';
import { site } from '@/content/site.no';
import { Logo } from './Logo';
import { Nav } from './Nav';
import styles from './site.module.css';

/**
 * On every page: the skip link, the logo home, the nine items. The header is the site's
 * navigation, which is what the brief asked for in place of a long page («litt for mye
 * scrolling i dagens løsning»).
 */
export function Header() {
  return (
    <>
      <a href="#innhold" className={styles.skip}>
        {site.header.skip}
      </a>
      <header className={styles.header}>
        <Link href="/" prefetch={false} className={styles.home} aria-label={site.header.homeLabel}>
          <Logo ground="white" height={40} decorative />
        </Link>
        <Nav />
      </header>
    </>
  );
}
