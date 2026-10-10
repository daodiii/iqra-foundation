import Link from 'next/link';

/** A card's title: a link to a page here, a plain link to an address elsewhere, or the words alone. */
export function Linked({ href, children }: { href: string | null; children: string }) {
  if (!href) return <>{children}</>;
  if (href.startsWith('/')) {
    return (
      <Link href={href} prefetch={false}>
        {children}
      </Link>
    );
  }
  return <a href={href}>{children}</a>;
}
