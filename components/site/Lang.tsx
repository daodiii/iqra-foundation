'use client';

import { createContext, useContext } from 'react';
import type { Copy } from '@/content/copy';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';

/**
 * The page's language for client components (2026-11-22). Norwegian needs no provider: it is
 * the default, and its words are already in the bundle. The English layout passes its copy in
 * from the server, so the English words travel with English pages only and never weigh down a
 * Norwegian one.
 */
const NO: Copy = { lang: 'no', site, klient };
const LangContext = createContext<Copy>(NO);

export function LangProvider({ copy, children }: { copy: Copy; children: React.ReactNode }) {
  return <LangContext value={copy}>{children}</LangContext>;
}

export const useCopy = (): Copy => useContext(LangContext);
