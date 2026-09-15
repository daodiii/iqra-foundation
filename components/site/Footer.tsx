import Link from 'next/link';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { Logo } from './Logo';
import styles from './site.module.css';

/**
 * The foot of every page: the logo reversed on navy, the nine links again, the red thread,
 * and the three facts a visitor uses to check there is an organisation behind the page —
 * the organisation number, the address and the place. Two of them are bracketed until the
 * foundation supplies them; the build says so.
 */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <Link href="/" prefetch={false} className={styles.footerHome} aria-label={site.header.homeLabel}>
          <Logo ground="navy" height={44} decorative />
        </Link>
        <nav aria-label={site.footer.navLabel}>
          <ul className={styles.footerList}>
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} prefetch={false} className={styles.footerLink}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className={styles.thread} data-thread>
        <span className={styles.threadName}>{brief.thread.name}</span>
        <span className={styles.threadLine}>{brief.thread.line}</span>
      </p>
      <dl className={styles.facts}>
        <div>
          <dt>{site.footer.orgnrLabel}</dt>
          <dd>{site.contact.orgnr}</dd>
        </div>
        <div>
          <dt>{site.footer.emailLabel}</dt>
          <dd>
            <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
          </dd>
        </div>
        <div>
          <dt>{site.name}</dt>
          <dd>{site.place}</dd>
        </div>
      </dl>
    </footer>
  );
}
