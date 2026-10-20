import { makeRouteHandler } from '@keystatic/next/route-handler';
import config from '@/keystatic.config';
import { keystaticEnabled } from '@/lib/keystatic';

/**
 * The admin's API. Same rule as the admin itself (`lib/keystatic.ts`): it answers where
 * Keystatic can save and is a 404 everywhere else. The handler is made only where it is
 * enabled: in GitHub mode without all of the GitHub App's values Keystatic throws as the
 * handler is made, and `next build` loads this module, so making it first would fail the build.
 */
const handler = keystaticEnabled() ? makeRouteHandler({ config }) : null;
const gone = () => new Response(null, { status: 404 });

export const GET = handler?.GET ?? gone;
export const POST = handler?.POST ?? gone;
