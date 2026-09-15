'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { site } from '@/content/site.no';
import styles from './site.module.css';

/**
 * The menu: the nine items of the brief, one click away on every page.
 *
 * On a wide screen they are a row; on a phone they are behind one button, in a drawer that
 * behaves like a dialog — focus stays inside it, Escape closes it, the page behind does not
 * scroll — because a menu that lets focus wander off into a page it is covering is a menu a
 * keyboard cannot use. The items themselves are the same list either way, so nothing is
 * ever missing from the phone.
 *
 * Which item is the current page is read from the URL; Støtt oss is a button in both
 * layouts, as the brief asks («bør være en tydelig knapp»).
 */
export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    button.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) {
      delete document.body.dataset.scrollLocked;
      return;
    }
    document.body.dataset.scrollLocked = '';
    const first = panel.current?.querySelector<HTMLElement>('a, button');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      // The trap: Tab past the last thing wraps to the first, Shift+Tab before the first to the last.
      const focusable = [button.current, ...panel.current.querySelectorAll<HTMLElement>('a, button')].filter(
        (el): el is HTMLElement => el !== null,
      );
      const at = focusable.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && (at <= 0)) {
        e.preventDefault();
        focusable[focusable.length - 1].focus();
      } else if (!e.shiftKey && at === focusable.length - 1) {
        e.preventDefault();
        focusable[0].focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      delete document.body.dataset.scrollLocked;
    };
  }, [open, close]);

  const current = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/'));

  return (
    <nav className={styles.nav} aria-label={site.header.navLabel} data-open={open || undefined}>
      <button
        ref={button}
        type="button"
        className={styles.menuButton}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {open ? site.header.close : site.header.open}
      </button>
      <div ref={panel} id={id} className={styles.panel} data-panel>
        <ul className={styles.list}>
          {site.nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                prefetch={false}
                className={'button' in item && item.button ? styles.support : styles.link}
                aria-current={current(item.href) ? 'page' : undefined}
                // A chosen link closes the drawer: it has done its work.
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {/* The scrim behind the open drawer: a tap on the page closes the menu. */}
      {open && <button type="button" className={styles.scrim} aria-label={site.header.close} onClick={close} tabIndex={-1} />}
    </nav>
  );
}
