import Link from 'next/link';
import { LangSwitch } from '@/components/site/LangSwitch';
import { copy, type Copy } from '@/content/copy';
import type { Lang } from '@/content/paths';
import { PATHS } from '@/content/paths';
import { MARK, Ordmerke } from './Merke';
import { VIEWBOX } from './logo-paths';
import { TilToppen } from './TilToppen';
import f from './forside.module.css';
import styles from './fot.module.css';

/** The foot's three groups, as the mock gives them: Om oss, Aktuelt, and the pages that stand alone. In the page's language. */
export function fotGroups({ lang, site, klient }: Copy) {
  const m = klient.menu;
  const p = (k: keyof typeof PATHS) => PATHS[k][lang];
  return [
    {
      title: m.about,
      links: [
        { label: m.aboutFoundation, href: p('about') },
        { label: m.work, href: p('work') },
        { label: m.people, href: p('people') },
      ],
    },
    {
      title: m.news,
      links: [
        { label: m.newsItems, href: p('newsItems') },
        { label: m.events, href: p('events') },
        { label: m.resources, href: p('resources') },
      ],
    },
    {
      title: site.footer.navLabel,
      links: [
        { label: m.home, href: p('home') },
        { label: m.contact, href: p('contact') },
        { label: m.support, href: p('support') },
      ],
    },
  ];
}

/** The front page's navy foot: the last layer, sliding over the finale. */
export function Fot({ lang = 'no' }: { lang?: Lang }) {
  const t = copy(lang);
  const { site } = t;
  const c = t.klient.contact;
  const GROUPS = fotGroups(t);
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
        <a href={site.footer.credit.href}>
          <span className={styles.ul}>{site.footer.credit.label}</span>
        </a>
        <LangSwitch className={styles.lang} />
        <TilToppen className={styles.top} />
      </nav>
    </footer>
  );
}
