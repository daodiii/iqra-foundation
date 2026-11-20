import Link from 'next/link';
import { site } from '@/content/site.no';
import { Logo } from './Logo';
import styles from './site.module.css';

/**
 * The foot of every page: the logo reversed on navy, the links again, and the foundation's
 * contact details as the client's document gives them (D8, 2026-11-18): the name with its
 * organisation number, the address, the telephone and the e-mail. The red thread of the four
 * areas is gone with the four areas; the client replaced them.
 */
export function Footer() {
  return (
    <footer className={styles.footer} data-header="dark">
      <div className={styles.footerTop}>
        <Link href="/" prefetch={false} className={styles.footerHome} aria-label={site.header.homeLabel}>
          <Logo ground="navy" crimson height={44} decorative />
        </Link>
        <nav aria-label={site.footer.navLabel}>
          <ul className={styles.footerList}>
            {site.links.map((item) => (
              <li key={item.href}>
                <Link href={item.href} prefetch={false} className={styles.footerLink}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <dl className={styles.facts}>
        <div>
          <dt>{site.contact.name}</dt>
          <dd>{site.footer.orgnrLabel} {site.contact.orgnr}</dd>
        </div>
        <div>
          <dt>{site.footer.addressLabel}</dt>
          <dd>{site.contact.address.join(', ')}</dd>
        </div>
        <div>
          <dt>{site.footer.phoneLabel}</dt>
          <dd>
            <a href={`tel:${site.contact.phone.replace(/\s/g, '')}`}>{site.contact.phone}</a>
          </dd>
        </div>
        <div>
          <dt>{site.footer.emailLabel}</dt>
          <dd>
            <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
          </dd>
        </div>
      </dl>
      <nav aria-label={site.footer.legalLabel}>
        <ul className={styles.legalList}>
          {site.legal.map((item) => (
            <li key={item.href}>
              <Link href={item.href} prefetch={false} className={styles.legalLink}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
