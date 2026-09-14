'use client';

import type { MouseEvent } from 'react';
import wash from '@/components/wash.module.css';
import { site } from '@/content/site.no';
import { scrollToSection } from '@/lib/onward';

type Section = keyof typeof site.next;

type Props = {
  /** The id of the section the button goes on to; its name comes from `site.next`. */
  to: Section;
  /** In a band of its own between two sections (the default), or bare — the hero's, in its copy. */
  band?: boolean;
  className?: string;
};

/**
 * The button on to the next section — «after each section make a button like Vår visjon»
 * (2026-09-14). One crimson pill, named for the section it goes to, standing between the
 * sections on the page's white («take the buttons under their sections»): the page puts
 * one after each section, and the hero holds its own under its paragraph.
 *
 * A real link to the section's id, so with no script it still goes there; with one, the
 * click is taken over and the page scrolls (`lib/onward.ts`). If the section is not on the
 * page — the row is not rendered when it is empty — the link is left to the browser.
 */
export function Onward({ to, band = true, className }: Props) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (scrollToSection(to)) e.preventDefault();
  };
  const link = (
    <a className={[wash.onward, className ?? ''].filter(Boolean).join(' ')} href={`#${to}`} onClick={onClick} data-onward={to}>
      {site.next[to]}
    </a>
  );
  return band ? <p className={wash.onwardBand}>{link}</p> : link;
}
