'use client';

import { SignOutButton } from '@clerk/nextjs';

/** «Logg ut»: Clerk's sign-out where Clerk is the way in; the test editor has nothing to leave. */
export function LoggUt({ clerk, className }: { clerk: boolean; className?: string }) {
  if (!clerk) return null;
  return (
    <SignOutButton redirectUrl="/redaksjon/logg-inn">
      <button type="button" className={className}>Logg ut</button>
    </SignOutButton>
  );
}
