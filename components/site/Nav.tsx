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
 *
 * Styringsdokumenter stands under Ressurser (the owner, 2026-10-09). In the row it is a small
 * plate that drops from Ressurser when Ressurser is pointed at or tabbed to; Escape puts it
 * away again until the pointer or the focus leaves. In the drawer it is a line set in under
 * Ressurser, always there. On a wide screen without a pointer that can hover it stands in the
 * row beside Ressurser, as before, so a touch never has to find it.
 */
export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // The list under an item, put away by Escape until the pointer or the focus leaves the item.
  const [shut, setShut] = useState(false);
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
      delete document.body.dataset.menuOpen;
      return;
    }
    document.body.dataset.scrollLocked = '';
    // The header reads this to turn navy under the open drawer.
    document.body.dataset.menuOpen = '';
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
    // A window widened past the drawer's breakpoint shows the row instead; the drawer's
    // state must not outlive it, or the page stays locked with no button to unlock it.
    const wide = window.matchMedia('(min-width: 900px)');
    const onWide = (e: MediaQueryListEvent) => { if (e.matches) setOpen(false); };
    wide.addEventListener('change', onWide);
    return () => {
      document.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWide);
      delete document.body.dataset.scrollLocked;
      delete document.body.dataset.menuOpen;
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
          {site.nav.map((item) => {
            const isButton = 'button' in item && item.button;
            const under = 'children' in item ? item.children : null;
            if (under) {
              return (
                <li
                  key={item.href}
                  className={styles.branch}
                  data-shut={shut ? '' : undefined}
                  onKeyDown={(e) => {
                    if (e.key !== 'Escape' || open) return;
                    setShut(true);
                    e.currentTarget.querySelector<HTMLElement>('a')?.focus();
                  }}
                  onMouseLeave={() => setShut(false)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setShut(false);
                  }}
                >
                  <Link
                    href={item.href}
                    prefetch={false}
                    className={styles.link}
                    aria-current={current(item.href) ? 'page' : undefined}
                    data-branch={under.some((c) => current(c.href)) ? '' : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                    <span className={styles.caret} aria-hidden="true" />
                  </Link>
                  <ul className={styles.under}>
                    {under.map((c) => (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          prefetch={false}
                          className={`${styles.link} ${styles.underLink}`}
                          aria-current={current(c.href) ? 'page' : undefined}
                          onClick={() => setOpen(false)}
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            }
            return (
              <li key={item.href} className={isButton ? styles.supportItem : undefined}>
                <Link
                  href={item.href}
                  prefetch={false}
                  className={isButton ? styles.support : styles.link}
                  aria-current={current(item.href) ? 'page' : undefined}
                  // A chosen link closes the drawer: it has done its work.
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      {/* The scrim behind the open drawer: a tap on the page closes the menu. */}
      {open && <button type="button" className={styles.scrim} aria-label={site.header.close} onClick={close} tabIndex={-1} />}
    </nav>
  );
}
