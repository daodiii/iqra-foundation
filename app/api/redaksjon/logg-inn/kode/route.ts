import { NextResponse } from 'next/server';
import { editorEnabled } from '@/lib/redaksjon/access';
import { challengeCookie } from '@/lib/redaksjon/cookies';
import { CHALLENGE_COOKIE } from '@/lib/redaksjon/kode';
import { requestCode } from '@/lib/redaksjon/login';
import { smtpSender } from '@/lib/redaksjon/mail';

/**
 * Step 1 of logging in: an address in, a code out by e-mail (lib/redaksjon/login.ts). The answer is
 * the same whether the address is on the list or not, so the form tells no one who is.
 */
export async function POST(req: Request) {
  if (!editorEnabled()) return new Response(null, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { epost?: unknown };
  const typed = typeof body.epost === 'string' ? body.epost.slice(0, 254) : '';
  const { challenge } = await requestCode(typed, { env: process.env, now: Date.now(), send: smtpSender() });
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: CHALLENGE_COOKIE, ...challengeCookie(challenge) });
  return res;
}
