import Link from 'next/link';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { Logo } from './Logo';
import styles from './site.module.css';

/**
 * The red thread's second line, «Kunnskap. Dialog. Møteplasser. Samfunnsdeltakelse.», with
 * each full stop drawn as the i's crimson dot — the same four dots that open the four
 * areas' names on the home page. The period itself is kept in the text for a screen
 * reader, so what is read out is the brief's line, character for character; the dot is
 * decoration and says so.
 */
function ThreadLine({ line }: { line: string }) {
  const words = line.split('.').map((w) => w.trim()).filter(Boolean);
  return (
    <span className={styles.threadLine} data-thread-line>
      {words.map((word, i) => (
        <span key={word} className={styles.threadWord}>
          {word}
          <span className="visually-hidden">{i < words.length - 1 ? '. ' : '.'}</span>
          <span className={styles.stop} data-stop aria-hidden="true" />
        </span>
      ))}
    </span>
  );
}

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
        <ThreadLine line={brief.thread.line} />
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
