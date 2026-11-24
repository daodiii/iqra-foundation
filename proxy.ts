import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';
import { editorEnabled, testEditor } from '@/lib/redaksjon/access';

/**
 * The editor's door, and only the editor's: the matcher below keeps every public page out of
 * here. Off (not configured) is a 404. The test editor goes straight through. Otherwise Clerk
 * checks the session, and the login page is the one place open without one; the address list
 * is checked again in the pages and route handlers (`lib/redaksjon/session.ts`).
 */
type Handler = (req: NextRequest, ev: NextFetchEvent) => Promise<Response | null | undefined | void> | Response | null | undefined | void;
let clerk: Handler | null = null;

async function clerkProxy() {
  if (clerk) return clerk;
  const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');
  const open = createRouteMatcher(['/redaksjon/logg-inn(.*)']);
  clerk = clerkMiddleware(async (auth, req) => {
    if (!open(req)) await auth.protect({ unauthenticatedUrl: new URL('/redaksjon/logg-inn', req.url).toString() });
  }) as unknown as Handler;
  return clerk;
}

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

export default async function proxy(req: NextRequest, ev: NextFetchEvent) {
  if (!editorEnabled()) return new NextResponse(null, { status: 404 });
  if (crossSiteWrite(req)) return NextResponse.json({ error: 'Ugyldig opphav.' }, { status: 403 });
  if (testEditor()) return NextResponse.next();
  return (await clerkProxy())(req, ev);
}

export const config = {
  matcher: ['/redaksjon', '/redaksjon/:path*', '/api/redaksjon/:path*'],
};
