import Link from 'next/link';
import { site } from '@/content/site.no';
import { Morph } from './Morph';
import styles from './title-link.module.css';

/** A page's address, read from the menu by its label, so a section's way on goes where the menu goes. */
export const pageHref = (label: string): string => site.links.find((n) => n.label === label)?.href ?? '/';

/** The name a title carries across a page change: the same on the section's title and on the page's heading (`PageTitle`). */
export const morphName = (href: string) => `tittel-${href.replace(/[^a-z0-9]+/gi, '') || 'hjem'}`;

/**
 * A section's title as its way on (the owner, 2026-10-09, choosing the review's four first fixes):
 * the words stay the heading's and name the link, and an arrow beside the last word says it goes
 * somewhere — shown on hover and focus, and always where there is no hover. No pill, no label: the
 * «les mer» pills were the template furniture this replaces. The last word and the arrow are one
 * unit, so the arrow never stands alone on a line of its own.
 *
 * Elite study: the words are a <ViewTransition> named for the page they open, and the page's own
 * heading carries the same name (`PageTitle`), so following the link the title you pressed grows
 * into the heading of the page you arrive on (React's view transitions, on the site's one curve;
 * globals.css). The page is prefetched while the title is on screen, so it is there to morph into.
 */
export function TitleLink({ href, children }: { href: string; children: string }) {
  const cut = children.lastIndexOf(' ') + 1;
  return (
    <Link href={href} className={styles.link}>
      <Morph name={morphName(href)}>
        <span className={styles.words}>
          {children.slice(0, cut)}
          <span className={styles.last}>
            {children.slice(cut)}
            <svg className={styles.arrow} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5" />
            </svg>
          </span>
        </span>
      </Morph>
    </Link>
  );
}
