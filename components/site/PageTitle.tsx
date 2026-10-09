import { soft } from '@/lib/soft';
import { Morph } from './Morph';
import { morphName } from './TitleLink';

/**
 * A page's heading, carrying the same name as the home page's section title that leads to it
 * (`TitleLink`), so arriving from that title the title grows into this heading. Set at the one
 * display size (globals.css): a page's title is its one display line.
 *
 * A long compound may break at its joint on a screen too narrow for it at that size («Arrange-
 * menter» on a 320 phone pushed «Meny» off the screen): the joint is a soft hyphen (`soft`), and
 * the heading is named by the word whole.
 */
export function PageTitle({ href, className, children }: { href: string; className?: string; children: string }) {
  return (
    <h1 className={className} aria-label={children}>
      <Morph name={morphName(href)}>
        <span style={{ display: 'inline-block' }}>{soft(children)}</span>
      </Morph>
    </h1>
  );
}
