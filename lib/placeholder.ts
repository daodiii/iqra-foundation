/**
 * A bracketed token — [EPOST], [GATEADRESSE], [INSTAGRAM] — is a value the foundation has
 * not supplied yet: the same shape `scripts/lib/content-check.mjs` reports at build time.
 * A page that would DO something with a value — link to it, put a pin on it — asks first,
 * so a placeholder is shown as the text it is and never becomes a broken link or a dot on
 * the wrong street.
 */
const PLACEHOLDER = /\[[^\]]+\]/;

export function isPlaceholder(value: string): boolean {
  return PLACEHOLDER.test(value);
}
