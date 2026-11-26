import { CODE_TTL_MS, SESSION_TTL_MS } from './kode';

/**
 * How the two login cookies are set. httpOnly (no script can read them), Secure on the live site,
 * SameSite=Lax. The code's cookie is sent only to the login endpoints; the session's to the whole
 * site, since the proxy checks it on /redaksjon and on /api/redaksjon.
 */
const secure = () => process.env.NODE_ENV === 'production' && !process.env.REDAKSJON_E2E;

export const challengeCookie = (value: string) => ({
  value,
  httpOnly: true,
  secure: secure(),
  sameSite: 'lax' as const,
  path: '/api/redaksjon/logg-inn',
  maxAge: Math.floor(CODE_TTL_MS / 1000),
});

export const sessionCookie = (value: string) => ({
  value,
  httpOnly: true,
  secure: secure(),
  sameSite: 'lax' as const,
  path: '/',
  maxAge: Math.floor(SESSION_TTL_MS / 1000),
});
