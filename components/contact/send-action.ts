'use server';

import { headers } from 'next/headers';
import { handleContact } from '@/lib/kontakt/handle';
import type { FormState } from '@/lib/kontakt/skjema';

/**
 * The contact form's server action (useActionState's shape: the last state, then the form).
 * The rules and the sending are in lib/kontakt; this only finds the writer's IP for the rate limit.
 * On Vercel the client is the first address in x-forwarded-for (and x-real-ip).
 */
export async function sendMessage(_prev: FormState, fd: FormData): Promise<FormState> {
  const h = await headers();
  const ip = h.get('x-real-ip')?.trim() || h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return handleContact(fd, { env: process.env, ip, now: Date.now() });
}
