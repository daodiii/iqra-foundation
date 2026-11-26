'use client';

import { useRouter } from 'next/navigation';

/** «Logg ut»: the session cookie goes and the login page comes. The test editor has nothing to leave. */
export function LoggUt({ show, className }: { show: boolean; className?: string }) {
  const router = useRouter();
  if (!show) return null;
  const out = async () => {
    await fetch('/api/redaksjon/logg-ut', { method: 'POST' }).catch(() => {});
    router.replace('/redaksjon/logg-inn');
    router.refresh();
  };
  return (
    <button type="button" className={className} onClick={out}>
      Logg ut
    </button>
  );
}
