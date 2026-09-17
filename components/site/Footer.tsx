import Link from 'next/link';
import { areas } from '@/components/home/areas';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { Logo } from './Logo';
import styles from './site.module.css';

/**
 * The foot of every page: the logo reversed on navy, the nine links again, the red thread,
 * and the three facts a visitor uses to check there is an organisation behind the page —
 * the organisation number, the address and the place. Two of them are bracketed until the
 * foundation supplies them; the build says so.
 *
 * The thread's four words each wear their area's colour, and their full stops are drawn as
 * dots; the text is still the brief's line, character for character, so the words are
 * matched to the areas by name and a word the mapping does not know keeps the footer's
 * own colour.
 */
export function Footer() {
  const words = brief.thread.line.split(/(?<=\.)\s+/);
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
        <span className={styles.threadLine}>
          {words.map((w, i) => {
            const stop = w.endsWith('.');
            const word = stop ? w.slice(0, -1) : w;
            const area = areas.find((a) => a.name === word);
            return (
              <span key={w}>
                <span
                  className={styles.threadWord}
                  style={area ? { color: `var(${area.onNavy})` } : undefined}
                  data-area={area?.key}
                >
                  {word}
                  {stop && <span className={styles.stop}>.</span>}
                </span>
                {i < words.length - 1 ? ' ' : ''}
              </span>
            );
          })}
        </span>
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
