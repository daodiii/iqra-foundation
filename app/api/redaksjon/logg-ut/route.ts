import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/redaksjon/kode';

/** «Logg ut»: the session cookie goes. Open without a session, so a half-expired one can always leave. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: SESSION_COOKIE, value: '', path: '/', maxAge: 0 });
  return res;
}
