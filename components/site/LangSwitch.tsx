'use client';

import { usePathname } from 'next/navigation';
import { counterpart, LANGS } from '@/content/paths';
import { useCopy } from './Lang';
import styles from './lang-switch.module.css';

/**
 * «NO · EN» (2026-11-22, the owner's pick): the language you are reading in stands as plain text,
 * the other is a link to the same page in that language. Each code is spoken by its own name
 * («Norsk», «English») in its own language, so a screen reader pronounces it right. Plain links,
 * not client navigation: the two languages are two root layouts, and the page loads whole.
 * Nothing is remembered; the site sets no cookies.
 */
export function LangSwitch({ className = '' }: { className?: string }) {
  const { lang, site } = useCopy();
  const path = usePathname() ?? '/';
  const l = site.language;
  return (
    <div role="group" className={`${styles.switch} ${className}`} aria-label={l.label}>
      {LANGS.map((to, i) => (
        <span key={to} className={styles.item}>
          {i > 0 && <span className={styles.dot} aria-hidden="true">·</span>}
          {to === lang ? (
            <span className={styles.here} lang={to === 'no' ? 'nb' : 'en'} aria-current="true">
              <span aria-hidden="true">{l[to].short}</span>
              <span className={styles.sr}>{l[to].name}</span>
            </span>
          ) : (
            <a className={styles.other} href={counterpart(path, to)} hrefLang={to === 'no' ? 'nb' : 'en'} lang={to === 'no' ? 'nb' : 'en'}>
              <span aria-hidden="true">{l[to].short}</span>
              <span className={styles.sr}>{l[to].name}</span>
            </a>
          )}
        </span>
      ))}
    </div>
  );
}
