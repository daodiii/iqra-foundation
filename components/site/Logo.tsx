import { site } from '@/content/site.no';

/**
 * The logo, as the guide gives it for each ground.
 *
 * The files are the guide's own art, cut out of the PDF as SVG (`public/brand/`), one
 * per colour combination: the mark is never recoloured here, a ground picks its variant.
 * On white, light and the turquoise plate: navy with the crimson accent and a navy
 * «Foundation». Reversed on navy, dark grey and crimson as the guide draws them.
 */
export type Ground = 'white' | 'light' | 'turquoise' | 'navy' | 'dark' | 'crimson';

const FILE: Record<Ground, string> = {
  white: '/brand/iqra-logo.svg',
  light: '/brand/iqra-logo.svg',
  turquoise: '/brand/iqra-logo.svg',
  navy: '/brand/iqra-logo-on-navy.svg',
  dark: '/brand/iqra-logo-on-dark.svg',
  crimson: '/brand/iqra-logo-on-crimson.svg',
};

/** The art's proportions, from the SVGs' viewBoxes: the lockup and the mark alone. */
export const LOGO_RATIO = 742.433 / 407.094;
export const MARK_RATIO = 728.806 / 301.27;

type Props = {
  ground?: Ground;
  /** The mark alone — «iQRa» without «Foundation». Navy with the crimson accent; light grounds only. */
  mark?: boolean;
  /** Rendered height in CSS pixels; the width follows the art. */
  height: number;
  className?: string;
  /** Decorative where the name is already in the text beside it. */
  decorative?: boolean;
};

export function Logo({ ground = 'white', mark = false, height, className, decorative = false }: Props) {
  const src = mark ? '/brand/iqra-mark.svg' : FILE[ground];
  const ratio = mark ? MARK_RATIO : LOGO_RATIO;
  return (
    <img
      src={src}
      alt={decorative ? '' : site.logoAlt}
      width={Math.round(height * ratio)}
      height={height}
      className={className}
      decoding="async"
      data-logo={mark ? 'mark' : ground}
    />
  );
}
