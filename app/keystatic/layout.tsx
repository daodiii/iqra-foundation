import { notFound } from 'next/navigation';
import { keystaticEnabled } from '@/lib/keystatic';
import KeystaticApp from './keystatic';

/**
 * /keystatic: the admin, where it can save (`lib/keystatic.ts`), a 404 where it cannot.
 * It takes the whole document — the site's header and footer would only be in its way —
 * which is why this layout renders the app and not the page.
 */
export default function Layout() {
  if (!keystaticEnabled()) notFound();
  return <KeystaticApp />;
}
