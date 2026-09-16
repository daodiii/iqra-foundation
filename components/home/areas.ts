import type { CSSProperties } from 'react';
import type { Ground } from '@/components/site/Logo';
import { brief } from '@/content/brief.no';

/**
 * The four areas as the site's architecture.
 *
 * The brief says the four areas «skal være gjennomgående i både innholdet og den visuelle
 * kommunikasjonen», and this direction takes that literally: each area owns one of the
 * guide's colours and wears it wherever it appears — the fields on the home page, the
 * bands of Vårt arbeid, its word in the red thread — so a visitor can tell which one they
 * are looking at without reading. This is the one place the mapping lives: the key gives
 * the ground, the ground gives the logo variant the guide draws for it, and the type
 * colours are the ones that read on it (checked by computation, see the contrast table in
 * the direction's report). The colours themselves are the `--color-area-*` tokens in
 * `app/globals.css`; nothing here or in a component is a literal.
 */
export type AreaKey = (typeof brief.areas)[number]['key'];

/** The four grounds an area can own, named as `Logo` names them. */
export type AreaGround = Extract<Ground, 'navy' | 'turquoise' | 'light' | 'crimson'>;

type Token = `--color-${string}`;

/*
 * The look's fields are named for what they colour, never `text` or `name`: those are
 * the brief's fields on the same object, and a look that overwrote `text` would put a
 * token where the prose belongs.
 */
export type AreaLook = {
  ground: AreaGround;
  /** The field's colour: `--color-area-<key>`, declared once in `@theme`. */
  token: `--color-area-${AreaKey}`;
  /** The ink of the body text and the number, on that ground. */
  ink: Token;
  /** The ink of the name, on that ground. */
  headingInk: Token;
  /** The focus ring, chosen to read on that ground. */
  ring: Token;
  /** The area's word in the red thread, which sits on the navy footer. */
  onNavy: Token;
};

export const AREA_LOOK: Record<AreaKey, AreaLook> = {
  kunnskap: {
    ground: 'navy',
    token: '--color-area-kunnskap',
    ink: '--color-light',
    headingInk: '--color-white',
    ring: '--color-white',
    onNavy: '--color-light',
  },
  dialog: {
    ground: 'turquoise',
    token: '--color-area-dialog',
    ink: '--color-navy',
    headingInk: '--color-navy',
    ring: '--color-navy',
    onNavy: '--color-turquoise',
  },
  moteplasser: {
    ground: 'light',
    token: '--color-area-moteplasser',
    ink: '--color-navy',
    headingInk: '--color-navy',
    ring: '--color-navy',
    onNavy: '--color-white',
  },
  samfunnsdeltakelse: {
    ground: 'crimson',
    token: '--color-area-samfunnsdeltakelse',
    ink: '--color-white',
    headingInk: '--color-white',
    ring: '--color-white',
    // Crimson on navy is 2.3:1; lifted 55% towards white it is 5.2:1.
    onNavy: '--color-crimson-lift',
  },
};

export type Area = (typeof brief.areas)[number] & AreaLook & {
  /** «01» to «04», the brief's order. */
  number: string;
  /** Where the area is read in full. */
  href: `/vart-arbeid#${AreaKey}`;
};

/** The brief's four areas, in its order, each with its look. */
export const areas: readonly Area[] = brief.areas.map((a, i) => ({
  ...a,
  ...AREA_LOOK[a.key],
  number: String(i + 1).padStart(2, '0'),
  href: `/vart-arbeid#${a.key}`,
}));

/**
 * The look as custom properties on the field's element, so one stylesheet paints all
 * four: the CSS reads `--field`, `--field-text`, `--field-heading`, `--field-ring`.
 */
export function fieldVars(look: AreaLook): CSSProperties {
  return {
    '--field': `var(${look.token})`,
    '--field-text': `var(${look.ink})`,
    '--field-heading': `var(${look.headingInk})`,
    '--field-ring': `var(${look.ring})`,
  } as CSSProperties;
}
