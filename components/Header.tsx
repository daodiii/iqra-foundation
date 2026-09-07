import Link from 'next/link';
import { site } from '@/content/site.no';
import styles from './header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <Link id="site-wordmark" href="/" prefetch={false} className={styles.wordmark} aria-label={site.header.homeLabel} data-on-dark="false">
        {site.header.wordmark}
      </Link>
    </header>
  );
}
