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

export default async function proxy(req: NextRequest, ev: NextFetchEvent) {
  if (!editorEnabled()) return new NextResponse(null, { status: 404 });
  if (testEditor()) return NextResponse.next();
  return (await clerkProxy())(req, ev);
}

export const config = {
  matcher: ['/redaksjon', '/redaksjon/:path*', '/api/redaksjon/:path*'],
};
