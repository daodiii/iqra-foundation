import { Forsiden } from '@/components/mock/hero/Forsiden';
import { HomeWith } from '@/components/mock/hero/HomeWith';
import { getEvents, splitEvents, todayISO } from '@/lib/content';

export const metadata = { robots: { index: false } };
export const revalidate = 3600;

export default function Page() {
  const today = todayISO();
  const [e] = splitEvents(getEvents(), today).upcoming;
  const next = e ? { title: e.title, start: e.start, time: e.time, place: e.place } : null;
  return <HomeWith current="11" hero={<Forsiden today={today} next={next} />} />;
}
