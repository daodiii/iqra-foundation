'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import { onFrame, pageKey, paintKey } from './frame';
import { Knapp } from './Knapp';
import { MARK } from './Merke';
import f from './forside.module.css';
import styles from './topp.module.css';

const m = klient.menu;
/** The header's and the menu's pages, in the mock's order; Støtt oss stands apart as the button. */
export const LINKS = [
  { label: m.home, href: '/' },
  { label: m.about, href: '/om-oss' },
  { label: m.news, href: '/aktuelt' },
  { label: m.resources, href: '/ressurser' },
  { label: m.contact, href: '/kontakt' },
] as const;
export const SUPPORT = { label: m.support, href: '/stott-oss' } as const;

/** The colour of the ground just under the header, in the middle of the screen: the first painted background below it. */
function ground(bar: HTMLElement): string {
  const y = bar.getBoundingClientRect().bottom + 3;
  const x = window.innerWidth * 0.5;
  for (const hit of document.elementsFromPoint(x, y)) {
    // a Pilen button under the header is not the ground (Støtt oss's AvtaleGiro turned it crimson on white)
    if (hit.closest('[data-topp],[data-mk],[data-meny],[data-knapp]')) continue;
    for (let e: Element | null = hit; e && e !== document.documentElement; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor;
      if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c;
    }
  }
  return getComputedStyle(document.body).backgroundColor;
}

/** Relative luminance (WCAG) of an `rgb(…)` colour. */
export function luminance(c: string): number {
  const n = c.match(/[\d.]+/g);
  if (!n) return 0;
  const [r, g, b] = n.slice(0, 3).map((x) => {
    const v = +x / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Light ground: navy text and logo. Crimson ground: a white Støtt oss. Anything else: as on navy. */
export function toneOf(c: string): 'light' | 'rod' | 'dark' {
  if (luminance(c) > 0.5) return 'light';
  const n = (c.match(/[\d.]+/g) ?? ['0', '0', '0']).map(Number);
  return n[0] > n[2] + 40 ? 'rod' : 'dark';
}

/**
 * The front page's header, «Kameleon»: the logo's slot (the hero's logo docks into it), the pages,
 * Støtt oss, and on a phone «Meny», which opens the full-screen menu.
 */
export function Topp({ mark = false }: { mark?: boolean }) {
  const path = usePathname() ?? '/';
  const here = (href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`));
  const bar = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  // Kameleon: once the logo has docked (the hero sets data-solid on the page), follow the ground.
  useEffect(() => {
    const el = bar.current;
    const page = el?.closest<HTMLElement>('[data-forside]');
    if (!el || !page) return;
    let last = '';
    let seen = '';
    let again = false;
    return onFrame(() => {
      // only when the page has moved or the logo has docked or left, and once more the frame after:
      // the scenes move in the same frame, some after this reads. A still page needs no new reading.
      // the crimson dot opens by itself on a still page (Pour.tsx): paintKey counts that too
      const k = `${pageKey()}|${paintKey()}${'solid' in page.dataset ? 's' : ''}`;
      if (k === seen) {
        if (!again) return;
        again = false;
      } else again = true;
      seen = k;
      if (!('solid' in page.dataset)) {
        if (last) {
          delete page.dataset.tone;
          el.style.removeProperty('--hg');
          last = '';
        }
        return;
      }
      const c = ground(el);
      if (c === last) return;
      last = c;
      el.style.setProperty('--hg', c);
      page.dataset.tone = toneOf(c);
    });
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <a href="#innhold" className={styles.skip}>
        {site.header.skip}
      </a>
      <div className={styles.notch} aria-hidden="true" />
      <header ref={bar} className={`${styles.bar} ${f.pad}`} data-topp>
        <Link href="/" prefetch={false} className={styles.home} aria-label={site.header.homeLabel} data-dock>
          {/* a subpage has no hero to fly the logo in: it stands here from the start */}
          {mark && (
            <svg className={styles.homeMark} viewBox="169.591 335.594 742.433 407.094" aria-hidden="true" focusable="false">
              <use href={`#${MARK}`} />
            </svg>
          )}
        </Link>
        <nav className={styles.nav} aria-label={site.header.navLabel}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} prefetch={false} className={styles.link} aria-current={here(l.href) ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
          <Knapp href={SUPPORT.href} kind="fill" className={styles.give}>
            {SUPPORT.label}
          </Knapp>
          <button ref={button} type="button" className={styles.menu} aria-expanded={open} aria-controls="meny" onClick={() => setOpen(true)}>
            <span>{site.header.open}</span>
            <i className={styles.burger} aria-hidden="true" />
          </button>
        </nav>
      </header>
      <Meny open={open} onClose={close} returnTo={button} />
    </>
  );
}

/** The menu layer: Esc and Lukk close it, focus stays inside while it is open, and the page under it holds still. */
function Meny({ open, onClose, returnTo }: { open: boolean; onClose: () => void; returnTo: React.RefObject<HTMLButtonElement | null> }) {
  const ref = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!open) {
      delete document.body.dataset.scrollLocked;
      if (wasOpen.current) returnTo.current?.focus({ preventScroll: true });
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    document.body.dataset.scrollLocked = '';
    el.focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab') return;
      const all = Array.from(el.querySelectorAll<HTMLElement>('a, button'));
      const i = all.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        all[all.length - 1].focus();
      } else if (!e.shiftKey && i === all.length - 1) {
        e.preventDefault();
        all[0].focus();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [open, onClose, returnTo]);

  useEffect(() => () => void delete document.body.dataset.scrollLocked, []);

  const c = klient.contact;
  return (
    <div
      ref={ref}
      id="meny"
      className={`${styles.mnu} ${open ? styles.open : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={site.header.open}
      tabIndex={-1}
      inert={!open}
      data-meny
    >
      <div className={`${styles.mnuTop} ${f.pad}`}>
        <svg className={styles.mnuLogo} viewBox="169.591 335.594 742.433 407.094" role="img" aria-label={site.logoAlt}>
          <use href={`#${MARK}`} />
        </svg>
        <button type="button" className={styles.close} onClick={onClose} aria-label={site.header.close}>
          <span aria-hidden="true">{site.header.closeShort}</span>
          <i className={styles.x} aria-hidden="true" />
        </button>
      </div>
      <div className={`${styles.mnuIn} ${f.pad}`}>
        <ol className={styles.list}>
          {LINKS.map((l, i) => (
            <li key={l.href}>
              <Link href={l.href} prefetch={false} className={styles.item} style={{ '--i': i } as React.CSSProperties} onClick={onClose}>
                <small className={styles.num} aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </small>
                <span className={styles.word}>{l.label}</span>
                <em className={styles.go} aria-hidden="true">
                  →
                </em>
              </Link>
            </li>
          ))}
        </ol>
        <div className={styles.side}>
          <p>
            <Link href={SUPPORT.href} prefetch={false} className={styles.mnuGive} onClick={onClose}>
              {SUPPORT.label}
            </Link>
          </p>
          <p>
            <a href={`mailto:${c.email}`}>{c.email}</a>
            <br />
            <a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a>
          </p>
          <p>
            {c.postbox}
            <br />
            {c.postcode}
          </p>
        </div>
      </div>
    </div>
  );
}
