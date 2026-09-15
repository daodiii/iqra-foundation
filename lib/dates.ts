import { site } from '@/content/site.no';

/** An ISO date written out the way the site writes dates: «24. september 2026». */
export function writeDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) throw new Error(`not an ISO date: ${iso}`);
  const [, y, mo, d] = m;
  return `${Number(d)}. ${site.months[Number(mo) - 1]} ${y}`;
}

/** The same, with the time when there is one: «24. september 2026 kl. 18:00». */
export function writeDateTime(iso: string, time: string | null): string {
  return time ? `${writeDate(iso)} kl. ${time}` : writeDate(iso);
}
