import Link from 'next/link';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import { MARK, Ordmerke } from './Merke';
import { VIEWBOX } from './logo-paths';
import { TilToppen } from './TilToppen';
import f from './forside.module.css';
import styles from './fot.module.css';

const m = klient.menu;
const c = klient.contact;

/** The foot's three groups, as the mock gives them: Om oss, Aktuelt, and the pages that stand alone. */
export const GROUPS = [
  {
    title: m.about,
    links: [
      { label: m.aboutFoundation, href: '/om-oss' },
      { label: m.work, href: '/vart-arbeid' },
      { label: m.people, href: '/menneskene-bak' },
    ],
  },
  {
    title: m.news,
    links: [
      { label: m.newsItems, href: '/aktuelt/nyheter' },
      { label: m.events, href: '/aktuelt/arrangementer' },
      { label: m.resources, href: '/ressurser' },
    ],
  },
  {
    title: site.footer.navLabel,
    links: [
      { label: m.home, href: '/' },
      { label: m.contact, href: '/kontakt' },
      { label: m.support, href: '/stott-oss' },
    ],
  },
] as const;

/** The front page's navy foot: the last layer, sliding over the finale. */
export function Fot() {
  return (
    <footer className={`${styles.fw} ${f.layer} ${f.layerIn}`} style={{ zIndex: 6 }} data-lag="fot">
      <div className={styles.g}>
        <div className={styles.lg}>
          <svg viewBox={VIEWBOX.join(' ')} role="img" aria-label={site.logoAlt}>
            <use href={`#${MARK}`} />
          </svg>
          <Ordmerke className={styles.lgWord} />
        </div>
        <div className={styles.row3}>
          {GROUPS.map((g) => (
            <nav key={g.title} className={styles.grp} aria-label={g.title}>
              <h3>{g.title}</h3>
              <ul>
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} prefetch={false}>
                      <span className={styles.ul}>{l.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <address className={styles.det}>
          <b>{c.name}</b>
          {site.footer.orgnrLabel} {c.orgnr}
          <br />
          {c.postbox}, {c.postcode}
          <br />
          <a href={`tel:${c.phone.replace(/\s/g, '')}`}>
            <span className={styles.ul}>{c.phone}</span>
          </a>
          <br />
          <a href={`mailto:${c.email}`}>
            <span className={styles.ul}>{c.email}</span>
          </a>
        </address>
      </div>
      <nav className={styles.legal} aria-label={site.footer.legalLabel}>
        <span>
          © {new Date().getFullYear()} {c.name}
        </span>
        {site.legal.map((l) => (
          <Link key={l.href} href={l.href} prefetch={false}>
            <span className={styles.ul}>{l.label}</span>
          </Link>
        ))}
        <TilToppen className={styles.top} />
      </nav>
    </footer>
  );
}
