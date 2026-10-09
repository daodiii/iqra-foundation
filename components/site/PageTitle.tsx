import { Morph } from './Morph';
import { morphName } from './TitleLink';

/**
 * A page's heading, carrying the same name as the home page's section title that leads to it
 * (`TitleLink`), so arriving from that title the title grows into this heading. Set at the one
 * display size (globals.css): a page's title is its one display line.
 */
export function PageTitle({ href, className, children }: { href: string; className?: string; children: string }) {
  return (
    <h1 className={className}>
      <Morph name={morphName(href)}>
        <span style={{ display: 'inline-block' }}>{children}</span>
      </Morph>
    </h1>
  );
}
