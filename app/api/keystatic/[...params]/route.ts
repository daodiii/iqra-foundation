import { makeRouteHandler } from '@keystatic/next/route-handler';
import config from '@/keystatic.config';
import { keystaticEnabled } from '@/lib/keystatic';

/**
 * The admin's API. Same rule as the admin itself (`lib/keystatic.ts`): it answers where
 * Keystatic can save and is a 404 everywhere else.
 */
const handler = makeRouteHandler({ config });
const gone = () => new Response(null, { status: 404 });

export const GET = keystaticEnabled() ? handler.GET : gone;
export const POST = keystaticEnabled() ? handler.POST : gone;
