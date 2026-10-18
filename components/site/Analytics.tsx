'use client';

import { useEffect } from 'react';

/**
 * Visit counting by Vercel Web Analytics: the page views, where they come from, the kind of device. It
 * sets no cookie and keeps nothing in the browser, which is why the site needs no consent banner — and why
 * the privacy page says so (content/legal.no.ts): change one and the other must change.
 *
 * This is the loader Vercel's own `@vercel/analytics` package injects, written out here: the package's
 * dependency tree does not install cleanly beside this project's lockfile. The script is Vercel's, served
 * from this site's own address (`/_vercel/insights/script.js`), so it exists only on a Vercel deploy and
 * the content policy needs no other origin. It is loaded on the production deploy alone
 * (`NEXT_PUBLIC_ANALYTICS`, next.config.ts): not in development, not on a preview, not on a laptop. It
 * counts nothing until Analytics is switched on in the Vercel project's settings.
 */
export function Analytics() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ANALYTICS !== '1') return;
    const w = window as typeof window & { va?: (...args: unknown[]) => void; vaq?: unknown[][] };
    w.va =
      w.va ??
      function (...args: unknown[]) {
        (w.vaq = w.vaq ?? []).push(args);
      };
    const script = document.createElement('script');
    script.src = '/_vercel/insights/script.js';
    script.defer = true;
    document.head.appendChild(script);
    return () => script.remove();
  }, []);
  return null;
}
