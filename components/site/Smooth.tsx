'use client';

import { useEffect } from 'react';
import { startSmooth } from '@/lib/smooth';

/** The page's glide (lib/smooth.ts), for as long as the page that holds this is shown. Renders nothing. */
export function Smooth() {
  useEffect(() => startSmooth(), []);
  return null;
}
