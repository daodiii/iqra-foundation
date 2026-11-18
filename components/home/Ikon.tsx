/**
 * The three icons of «Dette ønsker vi å skape» (the client asks for «passende illustrasjoner
 * eller ikoner», M2), drawn in the brand's colours: a navy line, and the logo's turquoise dot
 * as the one accent in each. Decorative: the heading beside each says what it is.
 *
 * - læring: an open book, the dot above it as the i's dot.
 * - engasjement: an arrow rising from a line, the dot at its start.
 * - samarbeid: two rings that overlap, the dot where they meet.
 */
export type IkonKey = 'laering' | 'engasjement' | 'samarbeid';

const stroke = { fill: 'none', stroke: 'var(--color-navy)', strokeWidth: 2.25, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const dot = { fill: 'var(--color-turquoise)' } as const;

export function Ikon({ name, className }: { name: IkonKey; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" width="64" height="64" aria-hidden="true" focusable="false" data-ikon={name}>
      {name === 'laering' && (
        <>
          <path {...stroke} d="M32 22c-6-4-14-5-22-4v28c8-1 16 0 22 4 6-4 14-5 22-4V18c-8-1-16 0-22 4Z" />
          <path {...stroke} d="M32 22v28" />
          <circle {...dot} cx="32" cy="11" r="4" />
        </>
      )}
      {name === 'engasjement' && (
        <>
          <path {...stroke} d="M10 52h44" />
          <path {...stroke} d="M18 44 46 16" />
          <path {...stroke} d="M30 16h16v16" />
          <circle {...dot} cx="18" cy="44" r="4" />
        </>
      )}
      {name === 'samarbeid' && (
        <>
          <circle {...stroke} cx="24" cy="32" r="14" />
          <circle {...stroke} cx="40" cy="32" r="14" />
          <circle {...dot} cx="32" cy="32" r="4" />
        </>
      )}
    </svg>
  );
}
