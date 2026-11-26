import { NextResponse } from 'next/server';
import { editorEnabled } from '@/lib/redaksjon/access';
import { sessionCookie } from '@/lib/redaksjon/cookies';
import { CHALLENGE_COOKIE, SESSION_COOKIE } from '@/lib/redaksjon/kode';
import { confirmCode } from '@/lib/redaksjon/login';

/** Step 2 of logging in: the code typed back. Right and in time, for an address still on the list: a session cookie. */
export async function POST(req: Request) {
  if (!editorEnabled()) return new Response(null, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { kode?: unknown };
  const typed = typeof body.kode === 'string' ? body.kode.slice(0, 32) : '';
  const challenge = req.headers
    .get('cookie')
    ?.split(/;\s*/)
    .find((c) => c.startsWith(`${CHALLENGE_COOKIE}=`))
    ?.slice(CHALLENGE_COOKIE.length + 1);
  const ok = confirmCode(challenge, typed, { env: process.env, now: Date.now() });
  if (!ok) return NextResponse.json({ error: 'Koden stemmer ikke, eller den er for gammel. Be om en ny.' }, { status: 400 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: SESSION_COOKIE, ...sessionCookie(ok.session) });
  res.cookies.set({ name: CHALLENGE_COOKIE, value: '', path: '/api/redaksjon/logg-inn', maxAge: 0 });
  return res;
}
