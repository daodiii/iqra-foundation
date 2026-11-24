"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCopy } from "@/components/site/Lang";
import { LangSwitch } from "@/components/site/LangSwitch";
import type { Copy } from "@/content/copy";
import { PATHS } from "@/content/paths";
import { onFrame, pageKey, paintKey } from "./frame";
import { Knapp } from "./Knapp";
import { MARK, Ordmerke } from "./Merke";
import { VIEWBOX } from "./logo-paths";
import f from "./forside.module.css";
import styles from "./topp.module.css";

/** The first sentence of a text (a parenthesis such as «(org.nr. …)» left out, so its full stops do not cut it). */
export function firstSentence(s: string): string {
  const t = s.replace(/\s*\([^)]*\)/g, "");
  return t.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? t;
}

type Sub = { label: string; href: string; text: string };
type Item = { label: string; href: string; sub?: readonly Sub[] };

/**
 * The header's and the menu's pages, in the client's order (M1, 2026-11-18): Om oss and Aktuelt with
 * their pages under them, each under-page with the first sentence of its own intro (shown on a wide
 * screen only); Støtt oss stands apart as the button. In the page's language, at its addresses.
 */
export function toppLinks({ lang, klient }: Copy): { links: readonly Item[]; support: { label: string; href: string } } {
  const m = klient.menu;
  const p = (k: keyof typeof PATHS) => PATHS[k][lang];
  return {
    links: [
      { label: m.home, href: p("home") },
      {
        label: m.about,
        href: p("about"),
        sub: [
          { label: m.aboutFoundation, href: p("about"), text: firstSentence(klient.about.intro) },
          { label: m.work, href: p("work"), text: firstSentence(klient.work.intro) },
          { label: m.people, href: p("people"), text: firstSentence(klient.people.intro) },
        ],
      },
      {
        label: m.news,
        href: p("news"),
        sub: [
          { label: m.newsItems, href: p("newsItems"), text: firstSentence(klient.news.newsText) },
          { label: m.events, href: p("events"), text: firstSentence(klient.news.eventsText) },
        ],
      },
      { label: m.resources, href: p("resources") },
      { label: m.contact, href: p("contact") },
    ],
    support: { label: m.support, href: p("support") },
  };
}

/** The colour of the ground just under the header, in the middle of the screen: the first painted background below it. */
function ground(bar: HTMLElement): string {
  const y = bar.getBoundingClientRect().bottom + 3;
  const x = window.innerWidth * 0.5;
  for (const hit of document.elementsFromPoint(x, y)) {
    // a Pilen button under the header is not the ground (Støtt oss's AvtaleGiro turned it crimson on white)
    if (
      hit.closest(
        "[data-topp],[data-mk],[data-meny],[data-knapp],[data-under-row]",
      )
    )
      continue;
    for (
      let e: Element | null = hit;
      e && e !== document.documentElement;
      e = e.parentElement
    ) {
      const c = getComputedStyle(e).backgroundColor;
      if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") return c;
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
export function toneOf(c: string): "light" | "rod" | "dark" {
  if (luminance(c) > 0.5) return "light";
  const n = (c.match(/[\d.]+/g) ?? ["0", "0", "0"]).map(Number);
  return n[0] > n[2] + 40 ? "rod" : "dark";
}

/**
 * The front page's header, «Kameleon»: the logo's slot (the hero's logo docks into it), the pages,
 * Støtt oss, and on a phone «Meny», which opens the full-screen menu.
 */
export function Topp({ mark = false }: { mark?: boolean }) {
  const c = useCopy();
  const { site } = c;
  const { links: LINKS, support: SUPPORT } = toppLinks(c);
  const home = PATHS.home[c.lang];
  const path = usePathname() ?? "/";
  const here = (href: string) =>
    href === home ? path === home : path === href || path.startsWith(`${href}/`);
  const bar = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  // Kameleon: once the logo has docked (the hero sets data-solid on the page), follow the ground.
  useEffect(() => {
    const el = bar.current;
    const page = el?.closest<HTMLElement>("[data-forside]");
    if (!el || !page) return;
    let last = "";
    let seen = "";
    let again = false;
    return onFrame(() => {
      // only when the page has moved or the logo has docked or left, and once more the frame after:
      // the scenes move in the same frame, some after this reads. A still page needs no new reading.
      const k = `${pageKey()}|${paintKey()}${"solid" in page.dataset ? "s" : ""}`;
      if (k === seen) {
        if (!again) return;
        again = false;
      } else again = true;
      seen = k;
      if (!("solid" in page.dataset)) {
        if (last) {
          delete page.dataset.tone;
          el.style.removeProperty("--hg");
          page.style.removeProperty("--hg");
          last = "";
        }
        return;
      }
      const c = ground(el);
      if (c === last) return;
      last = c;
      el.style.setProperty("--hg", c);
      // the second row stands outside the header (above the hero's logo): it reads the ground from the page
      page.style.setProperty("--hg", c);
      page.dataset.tone = toneOf(c);
    });
  }, []);

  const close = useCallback(() => setOpen(false), []);

  // «Linjen» (mock 49, the owner's pick of 2026-11-20): the pages under Om oss and Aktuelt in a second
  // row of the header, opened by pointing at the item, tabbing to it, or its arrow; Escape, leaving the
  // header or a new page puts it away.
  const [under, setUnder] = useState<string | null>(null);
  const leave = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrap = useRef<HTMLDivElement>(null);
  // opened by the pointer passing over: a click on the arrow then keeps it open instead of closing it
  const byPointer = useRef(false);
  const show = (href: string, pointer = false) => {
    clearTimeout(leave.current);
    if (pointer && under !== href) byPointer.current = true;
    setUnder(href);
  };
  const toggle = (href: string) => {
    if (under === href && !byPointer.current) setUnder(null);
    else show(href);
    byPointer.current = false;
  };
  const hide = () => {
    clearTimeout(leave.current);
    leave.current = setTimeout(() => setUnder(null), 160);
  };
  useEffect(() => setUnder(null), [path]);
  useEffect(() => {
    if (!under) return;
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const chev = document.querySelector<HTMLElement>(
        `[data-under-for="${under}"]`,
      );
      setUnder(null);
      if (wrap.current?.contains(document.activeElement)) chev?.focus();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [under]);
  useEffect(() => () => clearTimeout(leave.current), []);
  const groupHere = (l: Item) =>
    !!l.sub?.some((s) => here(s.href)) || here(l.href);
  const slug = (href: string) => href.replace(/\W+/g, "");

  return (
    <>
      <a href="#innhold" className={styles.skip}>
        {site.header.skip}
      </a>
      <div className={styles.notch} aria-hidden="true" />
      <div
        ref={wrap}
        className={styles.wrap}
        onMouseLeave={hide}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null))
            setUnder(null);
        }}
      >
        <header
          ref={bar}
          className={`${styles.bar} ${f.pad}`}
          data-topp
          data-under={under ?? undefined}
        >
          <Link
            href={home}
            prefetch={false}
            className={styles.home}
            aria-label={site.header.homeLabel}
            data-dock
          >
            {/* a subpage has no hero to fly the logo in: it stands here from the start */}
            {mark && (
              <svg
                className={styles.homeMark}
                viewBox={VIEWBOX.join(" ")}
                aria-hidden="true"
                focusable="false"
              >
                <use href={`#${MARK}`} />
              </svg>
            )}
            {/* «Foundation» under the slot: with the mark from the start on a subpage; on the front
                page once the hero's logo has docked, never in the hero itself (the owner, 2026-11-21) */}
            <Ordmerke className={`${styles.homeWord} ${mark ? styles.homeWordOn : ''}`} />
          </Link>
          <nav className={styles.nav} aria-label={site.header.navLabel}>
            {LINKS.map((l) =>
              l.sub ? (
                <div
                  key={l.href}
                  className={styles.grp}
                  onMouseEnter={() => show(l.href, true)}
                  onFocus={() => show(l.href)}
                >
                  <Link
                    href={l.href}
                    prefetch={false}
                    className={styles.link}
                    aria-current={groupHere(l) ? "page" : undefined}
                  >
                    {l.label}
                  </Link>
                  <button
                    type="button"
                    className={styles.chev}
                    aria-expanded={under === l.href}
                    aria-controls={`under-${slug(l.href)}`}
                    aria-label={`${site.header.subOpen} ${l.label}`}
                    data-under-for={l.href}
                    onClick={() => toggle(l.href)}
                  >
                    <i aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <Link
                  key={l.href}
                  href={l.href}
                  prefetch={false}
                  className={styles.link}
                  aria-current={here(l.href) ? "page" : undefined}
                  onMouseEnter={hide}
                  onFocus={() => setUnder(null)}
                >
                  {l.label}
                </Link>
              ),
            )}
            <LangSwitch className={styles.lang} />
            <Knapp href={SUPPORT.href} kind="fill" className={styles.give}>
              {SUPPORT.label}
            </Knapp>
            <button
              ref={button}
              type="button"
              className={styles.menu}
              aria-expanded={open}
              aria-controls="meny"
              onClick={() => setOpen(true)}
            >
              <span>{site.header.open}</span>
              <i className={styles.burger} aria-hidden="true" />
            </button>
          </nav>
        </header>
        {LINKS.filter((l) => l.sub).map((l) => (
          <div
            key={l.href}
            id={`under-${slug(l.href)}`}
            className={`${styles.row} ${f.pad}`}
            data-open={under === l.href ? "" : undefined}
            data-under-row=""
            inert={under !== l.href}
            onMouseEnter={() => show(l.href)}
          >
            <ul>
              {l.sub!.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    prefetch={false}
                    className={styles.subLink}
                    aria-current={path === s.href ? "page" : undefined}
                  >
                    <b>{s.label}</b>
                    <span>{s.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Meny open={open} onClose={close} returnTo={button} here={here} links={LINKS} support={SUPPORT} />
    </>
  );
}

/**
 * The phone's menu, «Kortet» (mock 48, the owner's pick of 2026-11-20): a white sheet that comes up from
 * the foot over the dimmed page, every page in it with the pages under Om oss and Aktuelt set in under
 * their item, the page you are on in burgundy, Støtt oss as the button at its foot, «NO · EN» at its top. Esc, Lukk or a tap
 * on the page closes it, focus stays inside while it is open, and the page under it holds still.
 */
function Meny({
  open,
  onClose,
  returnTo,
  here,
  links: LINKS,
  support: SUPPORT,
}: {
  open: boolean;
  onClose: () => void;
  returnTo: React.RefObject<HTMLButtonElement | null>;
  here: (href: string) => boolean;
  links: readonly Item[];
  support: { label: string; href: string };
}) {
  const { site } = useCopy();
  const path = usePathname() ?? "/";
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
    document.body.dataset.scrollLocked = "";
    el.focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      const all = Array.from(el.querySelectorAll<HTMLElement>("a, button"));
      const i = all.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        all[all.length - 1].focus();
      } else if (!e.shiftKey && i === all.length - 1) {
        e.preventDefault();
        all[0].focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, onClose, returnTo]);

  useEffect(() => () => void delete document.body.dataset.scrollLocked, []);

  return (
    <div
      ref={ref}
      id="meny"
      className={`${styles.mnu} ${open ? styles.open : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={site.header.open}
      tabIndex={-1}
      inert={!open}
      data-meny
    >
      <div className={styles.scrim} aria-hidden="true" onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.sheetTop}>
          <i className={styles.grab} aria-hidden="true" />
          {/* «NO · EN» at the very top of the sheet, large (2026-11-22): it does not fit in the phone's bar */}
          <LangSwitch className={styles.mnuLang} />
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label={site.header.close}
          >
            <span aria-hidden="true">{site.header.closeShort}</span>
            <i className={styles.x} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label={site.header.navLabel}>
          <ul className={styles.list}>
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  prefetch={false}
                  className={styles.item}
                  aria-current={!l.sub && here(l.href) ? "page" : undefined}
                  onClick={onClose}
                >
                  {l.label}
                </Link>
                {l.sub && (
                  <ul className={styles.subs}>
                    {l.sub.map((s) => (
                      <li key={s.href}>
                        <Link
                          href={s.href}
                          prefetch={false}
                          className={styles.subItem}
                          aria-current={path === s.href ? "page" : undefined}
                          onClick={onClose}
                        >
                          {s.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <Link
          href={SUPPORT.href}
          prefetch={false}
          className={styles.mnuGive}
          onClick={onClose}
        >
          <span>{SUPPORT.label}</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
