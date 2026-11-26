'use client';

import { useState } from 'react';
import s from './editor.module.css';

/**
 * A picture the editor shows. One saved a moment ago is on the site only after its rebuild
 * (2–3 minutes), so until then its address answers 404: say so instead of a broken image.
 */
export function Picture({ src, className }: { src: string; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (failed === src) return <div className={`${s.waiting} ${className ?? ''}`}>Bildet vises her når nettsiden er oppdatert.</div>;
  // An error before hydration fires no React handler, so a picture that already failed is caught on attach.
  const check = (el: HTMLImageElement | null) => { if (el?.complete && el.naturalWidth === 0) setFailed(src); };
  return <img ref={check} src={src} alt="" className={className} onError={() => setFailed(src)} />;
}
