import Link from 'next/link';

/**
 * A page of this site: a path, not `//host`, not under the folders the uploads are served from,
 * and not ending in a file's extension. Only a page goes through next/link: a file asked for as
 * a page would be fetched as one first, and then loaded again.
 */
const isPage = (href: string) => {
  const p = href.split(/[?#]/)[0];
  return p.startsWith('/') && !p.startsWith('//') && !/^\/(files|opplastet|media)\//.test(p) && !/\.[a-z0-9]+$/i.test(p);
};

/** A card's title: a link to a page here, a plain link to a file or an address elsewhere, or the words alone. */
export function Linked({ href, children }: { href: string | null; children: string }) {
  if (!href) return <>{children}</>;
  if (isPage(href)) {
    return (
      <Link href={href} prefetch={false}>
        {children}
      </Link>
    );
  }
  return <a href={href}>{children}</a>;
}
