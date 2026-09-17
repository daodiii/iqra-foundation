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

/**
 * The instant of a wall-clock time in a zone — an event's start, which the content
 * writes as Oslo's clock — without a zone library: guess the instant as if the clock
 * were UTC, read what the zone's clock says at that instant, correct by the difference,
 * and once more in case the guess landed across a change of the clocks.
 */
export function zonedTime(iso: string, time: string | null, zone = 'Europe/Oslo'): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`not an ISO date: ${iso}`);
  const [h, min] = time ? time.split(':').map(Number) : [0, 0];
  const wall = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), h, min);
  const clock = new Intl.DateTimeFormat('sv-SE', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
  // The zone's clock at an instant, read back as if it were UTC: «2026-09-24 18:00:00».
  const reads = (at: number) => {
    const s = clock.format(new Date(at));
    return Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)), Number(s.slice(11, 13)), Number(s.slice(14, 16)), Number(s.slice(17, 19)));
  };
  let at = wall - (reads(wall) - wall);
  at = wall - (reads(at) - at);
  return at;
}

export type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

/** How long until, in whole days, hours, minutes and seconds; nothing once it has passed. */
export function timeLeft(ms: number): TimeLeft {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}
