import { NextResponse, type NextRequest } from 'next/server';
import { editorEnabled, testEditor } from '@/lib/redaksjon/access';
import { SESSION_COOKIE, verifySession } from '@/lib/redaksjon/kode';

/**
 * The editor's door, and only the editor's: the matcher below keeps every public page out of
 * here. Off (not configured) is a 404. The test editor goes straight through. Otherwise the signed
 * session cookie from the e-mail code (lib/redaksjon/kode.ts) must be valid; its signature and its
 * expiry are checked here, not only its presence. The login page and its two endpoints are the one
 * place open without one. The address list is checked again in the pages and route handlers
 * (`lib/redaksjon/session.ts`), so taking someone off the list locks them out at once.
 */

const OPEN = ['/redaksjon/logg-inn', '/api/redaksjon/logg-inn', '/api/redaksjon/logg-inn/kode', '/api/redaksjon/logg-ut'];

/**
 * A write must come from this site's own pages. A browser marks a request from another site with
 * its `Origin` and `Sec-Fetch-Site`; a page elsewhere could otherwise post a «simple» request that
 * rides the editor's login and publishes a post (`text/plain` needs no preflight).
 */
export function crossSiteWrite(req: Request): boolean {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return false;
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return true;
  const origin = req.headers.get('origin');
  return Boolean(origin) && origin !== new URL(req.url).origin;
}

export default function proxy(req: NextRequest) {
  if (!editorEnabled()) return new NextResponse(null, { status: 404 });
  if (crossSiteWrite(req)) return NextResponse.json({ error: 'Ugyldig opphav.' }, { status: 403 });
  if (testEditor()) return NextResponse.next();
  const path = req.nextUrl.pathname.replace(/\/+$/, '');
  if (OPEN.includes(path)) return NextResponse.next();
  if (verifySession(req.cookies.get(SESSION_COOKIE)?.value, Date.now(), process.env.REDAKSJON_SECRET)) return NextResponse.next();
  if (path.startsWith('/api/')) return NextResponse.json({ error: 'Du må logge inn.' }, { status: 401 });
  return NextResponse.redirect(new URL('/redaksjon/logg-inn', req.url));
}

export const config = {
  matcher: ['/redaksjon', '/redaksjon/:path*', '/api/redaksjon/:path*'],
};
