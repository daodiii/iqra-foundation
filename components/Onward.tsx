'use client';

import type { MouseEvent } from 'react';
import wash from '@/components/wash.module.css';
import { site } from '@/content/site.no';
import { scrollToSection } from '@/lib/onward';

type Section = keyof typeof site.next;

type Props = {
  /** The id of the section the button goes on to; its name comes from `site.next`. */
  to: Section;
  /** Seated on the box's bottom line (the default), or standing in the flow — the hero's. */
  seated?: boolean;
  className?: string;
};

/**
 * The button on to the next section — «after each section make a button like Vår visjon»
 * (2026-09-14). One crimson pill per section, seated on its box's bottom line the way
 * Misjon's button sits on its tile, named for the section it goes to.
 *
 * A real link to the section's id, so with no script it still goes there; with one, the
 * click is taken over and the page scrolls (`lib/onward.ts`). If the section is not on the
 * page — the row is not rendered when it is empty — the link is left to the browser.
 */
export function Onward({ to, seated = true, className }: Props) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (scrollToSection(to)) e.preventDefault();
  };
  const classes = [wash.onward, seated ? wash.seated : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <a className={classes} href={`#${to}`} onClick={onClick} data-onward={to}>
      {site.next[to]}
    </a>
  );
}
