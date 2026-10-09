import * as React from 'react';
import type { ReactNode } from 'react';

type VTProps = { name: string; share?: string; default?: string; children: ReactNode };

/**
 * React's <ViewTransition>, where React has it: the App Router runs on Next's own React canary, which
 * does; the unit tests run on the stable `react` package, which does not yet, and there the words are
 * simply rendered. `share="morph"` with `default="none"`: it animates only as the pair it names.
 */
const VT = (React as unknown as { ViewTransition?: React.ComponentType<VTProps> }).ViewTransition;

export function Morph({ name, children }: { name: string; children: ReactNode }) {
  return VT ? (
    <VT name={name} share="morph" default="none">
      {children}
    </VT>
  ) : (
    <>{children}</>
  );
}
