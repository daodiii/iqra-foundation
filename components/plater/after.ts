import type { CSSProperties } from 'react';

/**
 * A delay for a `data-rise` text, in seconds, so a row of them arrives one after the next. Kept out of
 * Plater.tsx, a client module, so server components can call it while rendering.
 */
export const after = (s: number) => ({ '--d': `${s}s` }) as CSSProperties;
