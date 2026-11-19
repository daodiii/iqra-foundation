'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon, type IconName } from './Icon';
import { LoggUt } from './LoggUt';
import s from './shell.module.css';

type Counts = { nyheter: number; arrangementer: number; ressurser: number; menneskene: number };

const GROUPS: { head: string; items: { href: string; icon: IconName; label: string; key: keyof Counts }[] }[] = [
  { head: 'Aktuelt', items: [
    { href: '/redaksjon/nyheter', icon: 'news', label: 'Nyheter', key: 'nyheter' },
    { href: '/redaksjon/arrangementer', icon: 'cal', label: 'Arrangementer', key: 'arrangementer' },
  ] },
  { head: 'Ressurser', items: [{ href: '/redaksjon/ressurser', icon: 'book', label: 'Bibliotek', key: 'ressurser' }] },
  { head: 'Om oss', items: [{ href: '/redaksjon/menneskene', icon: 'people', label: 'Menneskene bak', key: 'menneskene' }] },
];

/**
 * The editor's frame (mockup A): the rail on the left with the way to write something new and
 * the sections; on a phone, a top bar whose menu opens the same rail over the page.
 */
export function Shell({ email, counts, clerk, children }: { email: string; counts: Counts; clerk: boolean; children: React.ReactNode }) {
  const path = usePathname();
  // Open on the page it was opened on: following a link closes it without an effect.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === path;
  const setOpen = (v: boolean) => setOpenAt(v ? path : null);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenAt(null); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open]);

  const here = (href: string) => (href === '/redaksjon' ? path === href : path === href || path.startsWith(href + '/'));
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className={s.app}>
      <header className={s.mtop}>
        <button type="button" aria-label="Meny" aria-expanded={open} aria-controls="redaksjon-rail" onClick={() => setOpen(true)}>
          <Icon name="menu" />
        </button>
        <Link href="/redaksjon" className={s.mlogo}><img src="/brand/iqra-logo.svg" alt="Iqra Foundation, redaksjon" /></Link>
        <Link href="/redaksjon/nyheter/ny" className={s.mnew} aria-label="Skriv nytt"><Icon name="plus" /></Link>
      </header>

      {open && <div className={s.scrim} onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside id="redaksjon-rail" className={s.rail} data-open={open || undefined}>
        <div className={s.brand}>
          <img src="/brand/iqra-mark.svg" alt="Iqra Foundation" />
          <span>Redaksjon</span>
          <button type="button" className={s.close} aria-label="Lukk menyen" onClick={() => setOpen(false)}><Icon name="close" /></button>
        </div>
        <Link href="/redaksjon/nyheter/ny" className={s.new}><Icon name="plus" />Skriv nytt</Link>
        <nav className={s.nav} aria-label="Redaksjonen">
          <Link href="/redaksjon" aria-current={here('/redaksjon') ? 'page' : undefined}><Icon name="home" />Oversikt</Link>
          {GROUPS.map((g) => (
            <div key={g.head} className={s.group}>
              <h2>{g.head}</h2>
              {g.items.map((it) => (
                <Link key={it.href} href={it.href} aria-current={here(it.href) ? 'page' : undefined}>
                  <Icon name={it.icon} />{it.label}<em>{counts[it.key]}</em>
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className={s.me}>
          <b aria-hidden="true">{initials}</b>
          <div>
            <span className={s.email}>{email}</span>
            <LoggUt clerk={clerk} className={s.out} />
          </div>
        </div>
      </aside>

      <div className={s.main}>{children}</div>
    </div>
  );
}
