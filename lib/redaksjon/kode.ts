import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

/**
 * Logging in to Redaksjon with a code sent by e-mail (2026-11-25, in place of Clerk). Nothing is
 * kept on the server: Vercel runs many instances and the site has no database. The code is signed
 * into a short-lived cookie (the challenge), and a right code turns it into a signed session cookie.
 *
 * With no store there is no counting of wrong guesses, so the code carries its own weight instead:
 * eight characters from 31 that cannot be mistaken for each other, about 40 bits. Guessing it in the
 * ten minutes it lives is not a practical attack, where six digits would be.
 *
 * Signed with `REDAKSJON_SECRET` (at least 32 characters). Changing the secret logs everyone out.
 */

/** No 0/O, 1/I/L: what an editor reads off a phone is what they type. */
export const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const CODE_LENGTH = 8;
export const CODE_TTL_MS = 10 * 60 * 1000;
export const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function newCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

/** «ABCD-2345», as the e-mail shows it. */
export const formatCode = (code: string) => `${code.slice(0, 4)}-${code.slice(4)}`;

/** What was typed, as the code: upper case, nothing but the alphabet's characters. */
export const normalizeCode = (typed: string) => typed.toUpperCase().replace(/[^0-9A-Z]/g, '');

const usable = (secret: string | undefined): secret is string => typeof secret === 'string' && secret.length >= 32;

function mac(secret: string, ...parts: string[]): string {
  return createHmac('sha256', secret).update(parts.join('|')).digest('base64url');
}

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

type Body = { e: string; x: number };

function sign(purpose: string, email: string, expires: number, secret: string, extra = ''): string {
  if (!usable(secret)) throw new Error('REDAKSJON_SECRET is missing or shorter than 32 characters');
  const e = email.trim().toLowerCase();
  const body = Buffer.from(JSON.stringify({ e, x: expires } satisfies Body)).toString('base64url');
  return `${body}.${mac(secret, purpose, e, String(expires), extra)}`;
}

function verify(purpose: string, token: string | undefined, now: number, secret: string | undefined, extra = ''): string | null {
  if (!token || !usable(secret)) return null;
  const [body, given] = token.split('.');
  if (!body || !given) return null;
  let parsed: Body;
  try {
    parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof parsed?.e !== 'string' || typeof parsed?.x !== 'number') return null;
  if (!same(given, mac(secret, purpose, parsed.e, String(parsed.x), extra))) return null;
  return now < parsed.x ? parsed.e : null;
}

/** The challenge cookie: the address and its expiry, and a MAC over them and the code. */
export const signChallenge = (email: string, code: string, expires: number, secret: string) => sign('challenge', email, expires, secret, code);

/** The address, if `typed` is the code the challenge was made with and it has not expired. */
export const verifyChallenge = (token: string | undefined, typed: string, now: number, secret: string | undefined) =>
  verify('challenge', token, now, secret, normalizeCode(typed));

export const signSession = (email: string, expires: number, secret: string) => sign('session', email, expires, secret);

/** The logged-in address, or null. Whether it may still edit is `mayEdit`'s question, asked on every request. */
export const verifySession = (token: string | undefined, now: number, secret: string | undefined) => verify('session', token, now, secret);

export const CHALLENGE_COOKIE = 'redaksjon_kode';
export const SESSION_COOKIE = 'redaksjon_okt';
