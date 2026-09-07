import { site } from '@/content/site.no';
import styles from './header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <a id="site-wordmark" href="/" className={styles.wordmark} aria-label={site.header.homeLabel} data-on-dark="false">
        {site.header.wordmark}
      </a>
    </header>
  );
}
