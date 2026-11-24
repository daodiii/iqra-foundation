import { site } from '@/content/site.no';
import { isPlaceholder } from '@/lib/placeholder';

export type Nummer = { key: string; label: string; value: string };

/**
 * The numbers that stand under «Gave», in the owner's order: the account number for a direct
 * transfer, then the Vipps number. The account number is the client's still to give (Q6): while
 * it is bracketed it does not stand (the client asked for the placeholders to go), and
 * `scripts/check-content.mjs` still reports it. AvtaleGiro follows them as its one button.
 */
export function numbers(s: { account: { label: string; value: string }; vipps: { label: string; value: string } } = site.support): Nummer[] {
  return [
    { key: 'konto', label: s.account.label, value: s.account.value },
    { key: 'vipps', label: s.vipps.label, value: s.vipps.value },
  ].filter((n) => !isPlaceholder(n.value));
}
