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
  /**
   * On navy, the reversed logo with the crimson accents in place of the guide's turquoise (and
   * FOUNDATION in the light ink): the hero's logo, which the header must match exactly, since the
   * hero's name lands on it. The owner, 2026-10-17: «use the one that has not turquoise, but red».
   */
  crimson?: boolean;
};

/** The guide's on-navy file with the two accents recoloured crimson and the word light; the guide does not draw it. */
export const LOGO_ON_NAVY_CRIMSON = '/brand/iqra-logo-on-navy-crimson.svg';

export function Logo({ ground = 'white', mark = false, height, className, decorative = false, crimson = false }: Props) {
  const src = mark ? '/brand/iqra-mark.svg' : crimson && ground === 'navy' ? LOGO_ON_NAVY_CRIMSON : FILE[ground];
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
